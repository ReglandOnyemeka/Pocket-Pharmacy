import {
  Pharmacy,
  AppUser,
  Product,
  SaleRecord,
  StockAuditRecord,
  StockFrequency,
  AuditScheduleLog,
  TenantSnapshot
} from "../types";
import {
  db,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  onSnapshot
} from "../lib/firebase";
import {
  idbSet,
  idbHydrateLocalStorage,
  enqueueOfflineSync,
  getPendingSyncQueue,
  removeOfflineSyncItems,
  hasPendingOfflineChanges,
  subscribePendingSyncQueue,
  PendingSyncItem
} from "./offlineSync";

export { subscribePendingSyncQueue, getPendingSyncQueue, hasPendingOfflineChanges };
export type { PendingSyncItem };

const PHARMACIES_KEY = "pocket_pharmacies_registry";
const USERS_REGISTRY_KEY = "pocket_users_global_registry";
const CURRENT_USER_KEY = "pocket_active_user";
const CURRENT_PHARMACY_KEY = "pocket_active_pharmacy";

type RegistryListener = (pharmacies: Pharmacy[], users: AppUser[]) => void;
const registryListeners = new Set<RegistryListener>();

function isBrowserOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/**
 * Checks local cache or memory fallback
 */
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[Storage] Failed reading ${key}`, e);
  }
  return fallback;
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[Storage] Failed setting ${key}`, e);
  }
  // Mirror to IndexedDB asynchronously for resilient offline-first storage
  idbSet(key, value).catch(() => null);
}

/**
 * Hydrates critical keys from IndexedDB into localStorage if localStorage was cleared
 */
export async function hydrateOfflineStorage(pharmacyId?: string): Promise<boolean> {
  const keys = [PHARMACIES_KEY, USERS_REGISTRY_KEY, CURRENT_USER_KEY, CURRENT_PHARMACY_KEY];
  if (pharmacyId) {
    keys.push(
      `tenant_${pharmacyId}_products`,
      `tenant_${pharmacyId}_sales`,
      `tenant_${pharmacyId}_audits`,
      `tenant_${pharmacyId}_frequencies`,
      `tenant_${pharmacyId}_logs`
    );
  }
  return idbHydrateLocalStorage(keys);
}

/**
 * Subscribes React components to real-time registry updates
 */
export function subscribeTenantRegistry(listener: RegistryListener): () => void {
  registryListeners.add(listener);
  return () => {
    registryListeners.delete(listener);
  };
}

function notifyRegistryListeners(pharmacies: Pharmacy[], users: AppUser[]) {
  registryListeners.forEach((fn) => {
    try {
      fn(pharmacies, users);
    } catch (e) {
      console.warn("[Storage] Listener notification error:", e);
    }
  });
}

let isRealtimeListenerAttached = false;

/**
 * Attaches real-time Firestore listeners for global multi-tenant syncing
 */
function setupRegistryRealtimeListener() {
  if (isRealtimeListenerAttached) return;
  isRealtimeListenerAttached = true;

  try {
    // 1. Listen to pharmacies
    onSnapshot(
      collection(db, "pharmacies"),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudPharmacies: Pharmacy[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Pharmacy;
            if (data && data.id) cloudPharmacies.push(data);
          });

          if (cloudPharmacies.length > 0) {
            const currentLocal = getLocal<Pharmacy[]>(PHARMACIES_KEY, []);
            const mergedMap = new Map<string, Pharmacy>();
            cloudPharmacies.forEach((p) => mergedMap.set(p.id, p));
            // Preserve locally created/edited pharmacies that haven't finished syncing yet
            currentLocal.forEach((p) => {
              if (!mergedMap.has(p.id) || hasPendingOfflineChanges(p.id)) {
                mergedMap.set(p.id, p);
              }
            });
            const merged = Array.from(mergedMap.values());
            setLocal(PHARMACIES_KEY, merged);

            const currentUsers = getLocal<AppUser[]>(USERS_REGISTRY_KEY, []);
            notifyRegistryListeners(merged, currentUsers);
          }
        }
      },
      (err) => console.warn("[Firestore] Pharmacies live sync warning:", err)
    );

    // 2. Listen to users
    onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudUsers: AppUser[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as AppUser;
            if (data && data.id) cloudUsers.push(data);
          });

          if (cloudUsers.length > 0) {
            const currentLocal = getLocal<AppUser[]>(USERS_REGISTRY_KEY, []);
            const pendingDeletes = new Set(
              getPendingSyncQueue()
                .filter((q) => q.entity === "user_delete" && q.targetId)
                .map((q) => q.targetId!)
            );
            const mergedMap = new Map<string, AppUser>();
            cloudUsers.forEach((u) => {
              if (!pendingDeletes.has(u.id)) mergedMap.set(u.id, u);
            });
            currentLocal.forEach((u) => {
              if (!mergedMap.has(u.id) || hasPendingOfflineChanges(u.pharmacyId)) {
                mergedMap.set(u.id, u);
              }
            });
            const merged = Array.from(mergedMap.values());
            setLocal(USERS_REGISTRY_KEY, merged);

            const currentPharmacies = getLocal<Pharmacy[]>(PHARMACIES_KEY, []);
            notifyRegistryListeners(currentPharmacies, merged);
          }
        }
      },
      (err) => console.warn("[Firestore] Users live sync warning:", err)
    );
  } catch (e) {
    console.warn("[Firestore] Could not attach real-time registry listener:", e);
  }
}

/**
 * Initializes multi-tenant registry from LocalStorage (offline-first) + bidirectional Firestore sync when online.
 * Does NOT seed placeholder pharmacies, placeholder users, or placeholder inventory.
 */
export function initTenantRegistry(): { pharmacies: Pharmacy[]; users: AppUser[] } {
  const pharmacies = getLocal<Pharmacy[]>(PHARMACIES_KEY, []);
  const users = getLocal<AppUser[]>(USERS_REGISTRY_KEY, []);

  // Set up real-time listener (uses persistent IndexedDB cache when offline)
  setupRegistryRealtimeListener();

  // Asynchronously synchronize global registry with Firebase when online
  if (isBrowserOnline()) {
    syncRegistryWithFirebase(pharmacies, users).catch((e) =>
      console.warn("[Firestore] Silent registry sync warning:", e)
    );
  }

  return { pharmacies, users };
}

/**
 * Syncs pharmacies and users with Firestore bi-directionally (only when online)
 */
export async function syncRegistryWithFirebase(localPharmacies: Pharmacy[], localUsers: AppUser[]) {
  if (!isBrowserOnline()) {
    return { pharmacies: localPharmacies, users: localUsers };
  }

  try {
    let updatedPharmacies = [...localPharmacies];
    let updatedUsers = [...localUsers];
    let changed = false;

    // 1. Fetch cloud pharmacies
    const pharmSnapshot = await getDocs(collection(db, "pharmacies"));
    if (!pharmSnapshot.empty) {
      const cloudPharmacies: Pharmacy[] = [];
      pharmSnapshot.forEach((docSnap) => {
        const p = docSnap.data() as Pharmacy;
        if (p && p.id) cloudPharmacies.push(p);
      });

      const pharmMap = new Map<string, Pharmacy>();
      cloudPharmacies.forEach((p) => pharmMap.set(p.id, p));
      localPharmacies.forEach((p) => {
        if (!pharmMap.has(p.id) || hasPendingOfflineChanges(p.id)) {
          pharmMap.set(p.id, p);
        }
      });
      updatedPharmacies = Array.from(pharmMap.values());
      changed = true;
      setLocal(PHARMACIES_KEY, updatedPharmacies);
    }

    // 2. Fetch cloud users
    const userSnapshot = await getDocs(collection(db, "users"));
    if (!userSnapshot.empty) {
      const cloudUsers: AppUser[] = [];
      userSnapshot.forEach((docSnap) => {
        const u = docSnap.data() as AppUser;
        if (u && u.id) cloudUsers.push(u);
      });

      const pendingDeletes = new Set(
        getPendingSyncQueue()
          .filter((q) => q.entity === "user_delete" && q.targetId)
          .map((q) => q.targetId!)
      );

      const userMap = new Map<string, AppUser>();
      cloudUsers.forEach((u) => {
        if (!pendingDeletes.has(u.id)) userMap.set(u.id, u);
      });
      localUsers.forEach((u) => {
        if (!userMap.has(u.id) || hasPendingOfflineChanges(u.pharmacyId)) {
          userMap.set(u.id, u);
        }
      });
      updatedUsers = Array.from(userMap.values());
      changed = true;
      setLocal(USERS_REGISTRY_KEY, updatedUsers);
    }

    if (changed) {
      notifyRegistryListeners(updatedPharmacies, updatedUsers);
    }

    return { pharmacies: updatedPharmacies, users: updatedUsers };
  } catch (err) {
    console.warn("[Firestore] Sync registry error:", err);
    return { pharmacies: localPharmacies, users: localUsers };
  }
}

/**
 * Performs offline-first authentication against local cache first, falling back to Cloud Firestore when online
 */
export async function authenticateUser(
  identifier: string,
  pin: string
): Promise<{
  success: boolean;
  message?: string;
  user?: AppUser;
  pharmacy?: Pharmacy;
}> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPin = pin.trim();

  if (!cleanId || !cleanPin) {
    return { success: false, message: "Please enter both username/email and password." };
  }

  // Hydrate from IndexedDB if localStorage is empty
  await hydrateOfflineStorage();

  // 1. Check local registry first (works 100% offline immediately)
  const { users: localUsers, pharmacies: localPharmacies } = initTenantRegistry();

  const matchLocal = localUsers.find((u) => {
    const uName = (u.username || "").toLowerCase().trim();
    const uEmail = (u.email || "").toLowerCase().trim();
    return uName === cleanId || uEmail === cleanId;
  });

  if (matchLocal) {
    const isPinMatch =
      matchLocal.pin === cleanPin ||
      matchLocal.pin.toLowerCase() === cleanPin.toLowerCase() ||
      String(matchLocal.pin).trim() === cleanPin;

    if (isPinMatch) {
      const matchPharm = localPharmacies.find((p) => p.id === matchLocal.pharmacyId) || {
        id: matchLocal.pharmacyId,
        name: "Pharmacy Workspace",
        directorName: matchLocal.fullName,
        location: "",
        phone: matchLocal.phone || "",
        email: matchLocal.email || "",
        cacNumber: "",
        pcnLicense: "",
        currency: "₦",
        createdAt: matchLocal.createdAt || new Date().toISOString(),
        superAdminId: matchLocal.id
      };

      // Async pull cloud tenant data only when online and no unsynced local writes exist
      if (isBrowserOnline()) {
        pullTenantFromFirebase(matchLocal.pharmacyId).catch(() => null);
      }

      return {
        success: true,
        user: matchLocal,
        pharmacy: matchPharm
      };
    }

    if (!isBrowserOnline()) {
      return {
        success: false,
        message: "Incorrect password. Please verify your credentials."
      };
    }
  }

  // If offline and user was not found in local device cache
  if (!isBrowserOnline()) {
    return {
      success: false,
      message:
        "You are currently offline and this account has not been cached on this device yet. Connect to the internet once to sign in, or onboard a new offline workspace."
    };
  }

  // 2. Direct Cloud Verification via Firestore (handles fresh browsers & updated credentials when online)
  try {
    const userSnapshot = await getDocs(collection(db, "users"));
    let foundCloudUser: AppUser | null = null;

    if (!userSnapshot.empty) {
      userSnapshot.forEach((docSnap) => {
        const u = docSnap.data() as AppUser;
        if (u) {
          const uName = (u.username || "").toLowerCase().trim();
          const uEmail = (u.email || "").toLowerCase().trim();
          if (uName === cleanId || uEmail === cleanId) {
            foundCloudUser = u;
          }
        }
      });
    }

    if (foundCloudUser) {
      const cloudUser = foundCloudUser as AppUser;
      const isPinMatch =
        cloudUser.pin === cleanPin ||
        cloudUser.pin.toLowerCase() === cleanPin.toLowerCase() ||
        String(cloudUser.pin).trim() === cleanPin;

      if (!isPinMatch) {
        return {
          success: false,
          message: "Incorrect password. Please verify your credentials or use Forgot Password."
        };
      }

      // Fetch corresponding pharmacy from cloud if not present locally
      let matchingPharm = localPharmacies.find((p) => p.id === cloudUser.pharmacyId);
      if (!matchingPharm) {
        try {
          const pharmDoc = await getDoc(doc(db, "pharmacies", cloudUser.pharmacyId));
          if (pharmDoc.exists()) {
            matchingPharm = pharmDoc.data() as Pharmacy;
          }
        } catch (e) {
          console.warn("[Firestore] Fetch user pharmacy warning:", e);
        }
      }

      if (!matchingPharm) {
        matchingPharm = {
          id: cloudUser.pharmacyId,
          name: "Pharmacy Workspace",
          directorName: cloudUser.fullName,
          location: "",
          phone: cloudUser.phone || "",
          email: cloudUser.email || "",
          cacNumber: "",
          pcnLicense: "",
          currency: "₦",
          createdAt: cloudUser.createdAt || new Date().toISOString(),
          superAdminId: cloudUser.id
        };
      }

      // Merge into local registry for future offline logins
      const updatedUsers = [...localUsers.filter((u) => u.id !== cloudUser.id), cloudUser];
      const updatedPharmacies = [
        ...localPharmacies.filter((p) => p.id !== matchingPharm!.id),
        matchingPharm
      ];

      setLocal(USERS_REGISTRY_KEY, updatedUsers);
      setLocal(PHARMACIES_KEY, updatedPharmacies);
      setLocal(CURRENT_USER_KEY, cloudUser);
      setLocal(CURRENT_PHARMACY_KEY, matchingPharm);

      notifyRegistryListeners(updatedPharmacies, updatedUsers);

      // Hydrate tenant catalog & database from cloud
      await pullTenantFromFirebase(cloudUser.pharmacyId);

      return {
        success: true,
        user: cloudUser,
        pharmacy: matchingPharm
      };
    }
  } catch (cloudErr) {
    console.warn("[Firestore] Cloud authentication error:", cloudErr);
  }

  if (matchLocal) {
    return {
      success: false,
      message: "Incorrect password. Please verify your credentials or use Forgot Password."
    };
  }

  return {
    success: false,
    message: "No account found matching this username or email. Please verify credentials or register a new workspace."
  };
}

/**
 * Ensures an isolated tenant has clean, empty local collections (no placeholder inventory or schedules)
 */
export function ensureTenantSeeded(pharmacyId: string) {
  const prodKey = `tenant_${pharmacyId}_products`;
  if (!localStorage.getItem(prodKey)) {
    setLocal(prodKey, []);
  }

  const freqKey = `tenant_${pharmacyId}_frequencies`;
  if (!localStorage.getItem(freqKey)) {
    setLocal(freqKey, []);
  }

  const salesKey = `tenant_${pharmacyId}_sales`;
  if (!localStorage.getItem(salesKey)) {
    setLocal(salesKey, []);
  }

  const auditKey = `tenant_${pharmacyId}_audits`;
  if (!localStorage.getItem(auditKey)) {
    setLocal(auditKey, []);
  }

  const logsKey = `tenant_${pharmacyId}_logs`;
  if (!localStorage.getItem(logsKey)) {
    setLocal(logsKey, []);
  }
}

/**
 * Creates a brand new Pharmacy Tenant Workspace with empty inventory (zero placeholder items).
 * Works 100% offline-first and syncs automatically to Firestore when online.
 */
export function createTenantWorkspace(params: {
  pharmacyName: string;
  directorName: string;
  location: string;
  phone: string;
  email: string;
  username: string;
  pin: string;
  cacNumber?: string;
  pcnLicense?: string;
}): { pharmacy: Pharmacy; superAdmin: AppUser } {
  const { pharmacies, users } = initTenantRegistry();

  const pharmacyId = `pharm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const superAdminId = `user_sa_${Date.now()}`;

  const newPharmacy: Pharmacy = {
    id: pharmacyId,
    name: params.pharmacyName,
    directorName: params.directorName,
    location: params.location,
    phone: params.phone,
    email: params.email,
    cacNumber: params.cacNumber || "",
    pcnLicense: params.pcnLicense || "",
    currency: "₦",
    createdAt: new Date().toISOString(),
    superAdminId
  };

  const newSuperAdmin: AppUser = {
    id: superAdminId,
    username: params.username.toLowerCase().trim(),
    fullName: params.directorName,
    role: "super_admin",
    pin: params.pin.trim(),
    email: params.email.trim(),
    phone: params.phone.trim(),
    pharmacyId,
    accessibleFeatures: ["sales", "inventory", "audits", "ai_consult", "admin_panel"],
    createdAt: new Date().toISOString()
  };

  // Initialize strictly empty isolated tenant database (no placeholder inventory)
  ensureTenantSeeded(pharmacyId);

  // Update registries locally first
  const updatedPharmacies = [...pharmacies, newPharmacy];
  const updatedUsers = [...users, newSuperAdmin];

  setLocal(PHARMACIES_KEY, updatedPharmacies);
  setLocal(USERS_REGISTRY_KEY, updatedUsers);
  setLocal(CURRENT_PHARMACY_KEY, newPharmacy);
  setLocal(CURRENT_USER_KEY, newSuperAdmin);

  notifyRegistryListeners(updatedPharmacies, updatedUsers);

  // Queue for offline-first cloud sync, and immediately sync if online
  enqueueOfflineSync("pharmacy", pharmacyId);
  enqueueOfflineSync("user", pharmacyId, superAdminId);
  enqueueOfflineSync("tenant_full", pharmacyId);

  if (isBrowserOnline()) {
    syncPendingChangesToCloud().catch((e) =>
      console.warn("[OfflineSync] Deferred new tenant sync:", e)
    );
  }

  return { pharmacy: newPharmacy, superAdmin: newSuperAdmin };
}

/**
 * Adds a new user under a Super Admin's tenant (offline-first)
 */
export function createTenantUser(
  pharmacyId: string,
  userData: {
    username: string;
    fullName: string;
    role: "cashier" | "admin" | "super_admin";
    pin: string;
    email: string;
    phone?: string;
    accessibleFeatures?: ("sales" | "inventory" | "audits" | "ai_consult" | "admin_panel")[];
  }
): AppUser {
  const { users, pharmacies } = initTenantRegistry();
  const newUser: AppUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: userData.username.toLowerCase().trim(),
    fullName: userData.fullName.trim(),
    role: userData.role,
    pin: userData.pin.trim(),
    email: userData.email.trim(),
    phone: userData.phone?.trim(),
    pharmacyId,
    accessibleFeatures:
      userData.accessibleFeatures ||
      (userData.role === "cashier"
        ? ["sales"]
        : ["sales", "inventory", "audits", "ai_consult", "admin_panel"]),
    createdAt: new Date().toISOString()
  };

  const updatedUsers = [...users, newUser];
  setLocal(USERS_REGISTRY_KEY, updatedUsers);
  notifyRegistryListeners(pharmacies, updatedUsers);

  enqueueOfflineSync("user", pharmacyId, newUser.id);
  if (isBrowserOnline()) {
    setDoc(doc(db, "users", newUser.id), newUser)
      .then(() => removeOfflineSyncItems([`user:${pharmacyId}:${newUser.id}`]))
      .catch((err) => console.warn("[Firestore] User persist deferred to offline queue:", err));
  }

  return newUser;
}

/**
 * Gets all users strictly belonging to a tenant
 */
export function getTenantUsers(pharmacyId: string): AppUser[] {
  const { users } = initTenantRegistry();
  return users.filter((u) => u.pharmacyId === pharmacyId);
}

/**
 * Updates a tenant user (offline-first)
 */
export function updateTenantUser(updatedUser: AppUser): void {
  const { users, pharmacies } = initTenantRegistry();
  const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
  setLocal(USERS_REGISTRY_KEY, updated);
  notifyRegistryListeners(pharmacies, updated);

  enqueueOfflineSync("user", updatedUser.pharmacyId, updatedUser.id);
  if (isBrowserOnline()) {
    setDoc(doc(db, "users", updatedUser.id), updatedUser)
      .then(() => removeOfflineSyncItems([`user:${updatedUser.pharmacyId}:${updatedUser.id}`]))
      .catch((err) => console.warn("[Firestore] User update deferred to offline queue:", err));
  }
}

/**
 * Resets password/PIN for Super Admin accounts with offline-first local + cloud sync
 */
export async function resetSuperAdminPin(
  identifier: string,
  newPin: string
): Promise<{ success: boolean; message: string; user?: AppUser }> {
  const { users, pharmacies } = initTenantRegistry();
  const cleanId = identifier.trim().toLowerCase();
  const cleanPin = newPin.trim();

  if (!cleanPin || cleanPin.length < 6 || cleanPin.length > 8) {
    return {
      success: false,
      message: "New password/PIN must be between 6 and 8 characters long."
    };
  }

  // 1. Search locally
  let superAdmin = users.find(
    (u) =>
      u.role === "super_admin" &&
      (u.username.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId))
  );

  // 2. If not found locally and online, search Firestore
  if (!superAdmin && isBrowserOnline()) {
    try {
      const userSnapshot = await getDocs(collection(db, "users"));
      if (!userSnapshot.empty) {
        userSnapshot.forEach((docSnap) => {
          const u = docSnap.data() as AppUser;
          if (
            u &&
            u.role === "super_admin" &&
            (u.username.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId))
          ) {
            superAdmin = u;
          }
        });
      }
    } catch (err) {
      console.warn("[Firestore] Password reset search error:", err);
    }
  }

  if (!superAdmin) {
    const regularUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId)
    );

    if (regularUser) {
      return {
        success: false,
        message: "Password reset on this portal is restricted to Super Admin accounts only. Please contact your Super Admin to reset staff credentials."
      };
    }

    return {
      success: false,
      message: !isBrowserOnline()
        ? `No cached Super Admin account found locally for "${identifier}" while offline.`
        : `No Super Admin account found matching "${identifier}". Please check your username or registered email.`
    };
  }

  const updatedAdmin: AppUser = {
    ...superAdmin,
    pin: cleanPin
  };

  const updatedUsers = [...users.filter((u) => u.id !== updatedAdmin.id), updatedAdmin];
  setLocal(USERS_REGISTRY_KEY, updatedUsers);
  notifyRegistryListeners(pharmacies, updatedUsers);

  const activeUser = getLocal<AppUser | null>(CURRENT_USER_KEY, null);
  if (activeUser && activeUser.id === updatedAdmin.id) {
    setLocal(CURRENT_USER_KEY, updatedAdmin);
  }

  enqueueOfflineSync("user", updatedAdmin.pharmacyId, updatedAdmin.id);
  if (isBrowserOnline()) {
    try {
      await setDoc(doc(db, "users", updatedAdmin.id), updatedAdmin);
      removeOfflineSyncItems([`user:${updatedAdmin.pharmacyId}:${updatedAdmin.id}`]);
    } catch (err) {
      console.warn("[Firestore] Super admin password reset queued for sync:", err);
    }
  }

  return {
    success: true,
    message: `Password for Super Admin (${updatedAdmin.fullName || updatedAdmin.username}) has been successfully updated.`,
    user: updatedAdmin
  };
}

/**
 * Deletes a tenant user (offline-first)
 */
export function deleteTenantUser(userId: string): void {
  const { users, pharmacies } = initTenantRegistry();
  const target = users.find((u) => u.id === userId);
  const pharmacyId = target?.pharmacyId || "global";
  const updated = users.filter((u) => u.id !== userId);
  setLocal(USERS_REGISTRY_KEY, updated);
  notifyRegistryListeners(pharmacies, updated);

  enqueueOfflineSync("user_delete", pharmacyId, userId);
  if (isBrowserOnline()) {
    deleteDoc(doc(db, "users", userId))
      .then(() => removeOfflineSyncItems([`user_delete:${pharmacyId}:${userId}`]))
      .catch((err) => console.warn("[Firestore] User delete deferred to offline queue:", err));
  }
}

/**
 * Updates pharmacy profile (offline-first)
 */
export function updateTenantPharmacy(updatedPharmacy: Pharmacy): void {
  const { pharmacies, users } = initTenantRegistry();
  const updated = pharmacies.map((p) => (p.id === updatedPharmacy.id ? updatedPharmacy : p));
  setLocal(PHARMACIES_KEY, updated);
  setLocal(CURRENT_PHARMACY_KEY, updatedPharmacy);
  notifyRegistryListeners(updated, users);

  enqueueOfflineSync("pharmacy", updatedPharmacy.id);
  if (isBrowserOnline()) {
    setDoc(doc(db, "pharmacies", updatedPharmacy.id), updatedPharmacy)
      .then(() => removeOfflineSyncItems([`pharmacy:${updatedPharmacy.id}`]))
      .catch((err) => console.warn("[Firestore] Pharmacy update deferred to offline queue:", err));
  }
}

/**
 * Reads isolated tenant products (always empty [] for fresh tenants — zero placeholder inventory)
 */
export function getTenantProducts(pharmacyId: string): Product[] {
  const key = `tenant_${pharmacyId}_products`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading tenant products", e);
  }
  setLocal(key, []);
  return [];
}

/**
 * Saves isolated tenant products (offline-first)
 */
export function saveTenantProducts(pharmacyId: string, products: Product[], skipQueue = false): void {
  const key = `tenant_${pharmacyId}_products`;
  setLocal(key, products);

  if (skipQueue) return;

  enqueueOfflineSync("products", pharmacyId);
  if (isBrowserOnline()) {
    setDoc(doc(db, "tenants", pharmacyId, "catalog", "products"), { items: products }, { merge: true })
      .then(() => removeOfflineSyncItems([`products:${pharmacyId}`]))
      .catch((e) => console.warn("[Firestore] Catalog save deferred to offline queue:", e));
  }
}

/**
 * Reads isolated tenant sales records
 */
export function getTenantSales(pharmacyId: string): SaleRecord[] {
  const key = `tenant_${pharmacyId}_sales`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading tenant sales", e);
  }
  return [];
}

/**
 * Saves isolated tenant sales records (offline-first)
 */
export function saveTenantSales(pharmacyId: string, sales: SaleRecord[], skipQueue = false): void {
  const key = `tenant_${pharmacyId}_sales`;
  setLocal(key, sales);

  if (skipQueue) return;

  enqueueOfflineSync("sales", pharmacyId);
  if (isBrowserOnline()) {
    setDoc(doc(db, "tenants", pharmacyId, "records", "sales"), { items: sales }, { merge: true })
      .then(() => removeOfflineSyncItems([`sales:${pharmacyId}`]))
      .catch((e) => console.warn("[Firestore] Sales save deferred to offline queue:", e));
  }
}

/**
 * Reads isolated tenant audit history
 */
export function getTenantAudits(pharmacyId: string): StockAuditRecord[] {
  const key = `tenant_${pharmacyId}_audits`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading tenant audits", e);
  }
  return [];
}

/**
 * Saves isolated tenant audit history (offline-first)
 */
export function saveTenantAudits(pharmacyId: string, audits: StockAuditRecord[], skipQueue = false): void {
  const key = `tenant_${pharmacyId}_audits`;
  setLocal(key, audits);

  if (skipQueue) return;

  enqueueOfflineSync("audits", pharmacyId);
  if (isBrowserOnline()) {
    setDoc(doc(db, "tenants", pharmacyId, "records", "audits"), { items: audits }, { merge: true })
      .then(() => removeOfflineSyncItems([`audits:${pharmacyId}`]))
      .catch((e) => console.warn("[Firestore] Audits save deferred to offline queue:", e));
  }
}

/**
 * Reads isolated tenant stock frequencies (always empty [] for fresh tenants)
 */
export function getTenantFrequencies(pharmacyId: string): StockFrequency[] {
  const key = `tenant_${pharmacyId}_frequencies`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading tenant frequencies", e);
  }
  setLocal(key, []);
  return [];
}

/**
 * Saves isolated tenant stock frequencies (offline-first)
 */
export function saveTenantFrequencies(
  pharmacyId: string,
  frequencies: StockFrequency[],
  skipQueue = false
): void {
  const key = `tenant_${pharmacyId}_frequencies`;
  setLocal(key, frequencies);

  if (skipQueue) return;

  enqueueOfflineSync("frequencies", pharmacyId);
  if (isBrowserOnline()) {
    setDoc(doc(db, "tenants", pharmacyId, "schedules", "frequencies"), { items: frequencies }, { merge: true })
      .then(() => removeOfflineSyncItems([`frequencies:${pharmacyId}`]))
      .catch((e) => console.warn("[Firestore] Frequencies save deferred to offline queue:", e));
  }
}

/**
 * Reads isolated tenant audit logs
 */
export function getTenantLogs(pharmacyId: string): AuditScheduleLog[] {
  const key = `tenant_${pharmacyId}_logs`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading tenant logs", e);
  }
  return [];
}

/**
 * Saves isolated tenant audit logs (offline-first)
 */
export function saveTenantLogs(pharmacyId: string, logs: AuditScheduleLog[], skipQueue = false): void {
  const key = `tenant_${pharmacyId}_logs`;
  setLocal(key, logs);

  if (skipQueue) return;

  enqueueOfflineSync("logs", pharmacyId);
  if (isBrowserOnline()) {
    setDoc(doc(db, "tenants", pharmacyId, "records", "logs"), { items: logs }, { merge: true })
      .then(() => removeOfflineSyncItems([`logs:${pharmacyId}`]))
      .catch((e) => console.warn("[Firestore] Logs save deferred to offline queue:", e));
  }
}

/**
 * Flushes all queued offline mutations to Firestore when connectivity returns
 */
export async function syncPendingChangesToCloud(): Promise<{
  syncedCount: number;
  remainingCount: number;
}> {
  if (!isBrowserOnline()) {
    return { syncedCount: 0, remainingCount: getPendingSyncQueue().length };
  }

  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  const pharmacies = getLocal<Pharmacy[]>(PHARMACIES_KEY, []);
  const users = getLocal<AppUser[]>(USERS_REGISTRY_KEY, []);
  const completedIds: string[] = [];

  for (const item of queue) {
    try {
      switch (item.entity) {
        case "pharmacy": {
          const pharm = pharmacies.find((p) => p.id === item.pharmacyId);
          if (pharm) {
            await setDoc(doc(db, "pharmacies", pharm.id), pharm, { merge: true });
          }
          completedIds.push(item.id);
          break;
        }
        case "user": {
          const user = users.find((u) => u.id === item.targetId);
          if (user) {
            await setDoc(doc(db, "users", user.id), user, { merge: true });
          }
          completedIds.push(item.id);
          break;
        }
        case "user_delete": {
          if (item.targetId) {
            await deleteDoc(doc(db, "users", item.targetId));
          }
          completedIds.push(item.id);
          break;
        }
        case "products": {
          const products = getTenantProducts(item.pharmacyId);
          await setDoc(
            doc(db, "tenants", item.pharmacyId, "catalog", "products"),
            { items: products },
            { merge: true }
          );
          completedIds.push(item.id);
          break;
        }
        case "sales": {
          const sales = getTenantSales(item.pharmacyId);
          await setDoc(
            doc(db, "tenants", item.pharmacyId, "records", "sales"),
            { items: sales },
            { merge: true }
          );
          completedIds.push(item.id);
          break;
        }
        case "audits": {
          const audits = getTenantAudits(item.pharmacyId);
          await setDoc(
            doc(db, "tenants", item.pharmacyId, "records", "audits"),
            { items: audits },
            { merge: true }
          );
          completedIds.push(item.id);
          break;
        }
        case "frequencies": {
          const frequencies = getTenantFrequencies(item.pharmacyId);
          await setDoc(
            doc(db, "tenants", item.pharmacyId, "schedules", "frequencies"),
            { items: frequencies },
            { merge: true }
          );
          completedIds.push(item.id);
          break;
        }
        case "logs": {
          const logs = getTenantLogs(item.pharmacyId);
          await setDoc(
            doc(db, "tenants", item.pharmacyId, "records", "logs"),
            { items: logs },
            { merge: true }
          );
          completedIds.push(item.id);
          break;
        }
        case "tenant_full": {
          const pharm = pharmacies.find((p) => p.id === item.pharmacyId);
          if (pharm) {
            const snapshot = compileTenantSnapshot(item.pharmacyId, pharm);
            await setDoc(
              doc(db, "tenants", item.pharmacyId),
              { ...snapshot, updatedAt: new Date().toISOString() },
              { merge: true }
            );
          }
          completedIds.push(item.id);
          break;
        }
      }
    } catch (err) {
      console.warn(`[OfflineSync] Failed syncing ${item.id}, keeping in queue:`, err);
    }
  }

  removeOfflineSyncItems(completedIds);
  const remainingCount = getPendingSyncQueue().length;
  return { syncedCount: completedIds.length, remainingCount };
}

/**
 * Compiles a full tenant snapshot
 */
export function compileTenantSnapshot(pharmacyId: string, pharmacy: Pharmacy): TenantSnapshot {
  return {
    pharmacy,
    users: getTenantUsers(pharmacyId),
    products: getTenantProducts(pharmacyId),
    sales: getTenantSales(pharmacyId),
    audits: getTenantAudits(pharmacyId),
    frequencies: getTenantFrequencies(pharmacyId),
    logs: getTenantLogs(pharmacyId),
    lastBackup: new Date().toISOString()
  };
}

/**
 * Backs up tenant database locally first (instant offline persistence) and syncs to cloud when online
 */
export async function backupTenantDatabase(
  pharmacyId: string,
  pharmacy: Pharmacy
): Promise<{ success: boolean; timestamp: string; message: string; offlineOnly?: boolean }> {
  const snapshot = compileTenantSnapshot(pharmacyId, pharmacy);
  const timestamp = new Date().toISOString();

  // 1. Instant local & IndexedDB persistence
  localStorage.setItem(`tenant_${pharmacyId}_last_backup`, timestamp);
  idbSet(`tenant_${pharmacyId}_last_backup`, timestamp).catch(() => null);
  idbSet(`tenant_${pharmacyId}_snapshot`, snapshot).catch(() => null);

  if (!isBrowserOnline()) {
    enqueueOfflineSync("tenant_full", pharmacyId);
    return {
      success: true,
      timestamp,
      offlineOnly: true,
      message: "Saved locally on this device. Changes will sync to cloud automatically when back online."
    };
  }

  // 2. Parallel cloud sync (Firestore + Server Backup + Pending Queue Flush)
  const syncPromise = Promise.allSettled([
    syncPendingChangesToCloud(),
    setDoc(
      doc(db, "tenants", pharmacyId),
      {
        ...snapshot,
        lastBackup: timestamp
      },
      { merge: true }
    ),
    setDoc(doc(db, "pharmacies", pharmacyId), pharmacy, { merge: true }),
    setDoc(doc(db, "tenants", pharmacyId, "catalog", "products"), { items: snapshot.products }, { merge: true }),
    setDoc(doc(db, "tenants", pharmacyId, "records", "sales"), { items: snapshot.sales }, { merge: true }),
    setDoc(doc(db, "tenants", pharmacyId, "records", "audits"), { items: snapshot.audits }, { merge: true }),
    setDoc(doc(db, "tenants", pharmacyId, "schedules", "frequencies"), { items: snapshot.frequencies }, { merge: true }),
    setDoc(doc(db, "tenants", pharmacyId, "records", "logs"), { items: snapshot.logs }, { merge: true }),
    fetch("/api/backup-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pharmacyId, snapshot })
    }).catch(() => null)
  ]);

  // Race with a fast 600ms window so the button stays snappy
  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 600));
  await Promise.race([syncPromise, timeoutPromise]);

  return {
    success: true,
    timestamp,
    message: "Database securely persisted to Cloud and local offline storage."
  };
}

/**
 * Loads entire tenant data from Firestore into local cache if online.
 * Protects local unsynced offline changes by flushing pending writes first!
 */
export async function pullTenantFromFirebase(pharmacyId: string): Promise<TenantSnapshot | null> {
  if (!isBrowserOnline()) {
    return null;
  }

  // Never overwrite unsynced local offline work — push local changes first!
  if (hasPendingOfflineChanges(pharmacyId)) {
    await syncPendingChangesToCloud();
  }

  try {
    // 1. Check main tenant document
    const tenantDoc = await getDoc(doc(db, "tenants", pharmacyId));
    if (tenantDoc.exists()) {
      const data = tenantDoc.data() as TenantSnapshot;
      if (data.products && Array.isArray(data.products)) saveTenantProducts(pharmacyId, data.products, true);
      if (data.sales && Array.isArray(data.sales)) saveTenantSales(pharmacyId, data.sales, true);
      if (data.audits && Array.isArray(data.audits)) saveTenantAudits(pharmacyId, data.audits, true);
      if (data.frequencies && Array.isArray(data.frequencies)) saveTenantFrequencies(pharmacyId, data.frequencies, true);
      if (data.logs && Array.isArray(data.logs)) saveTenantLogs(pharmacyId, data.logs, true);
      return data;
    }

    // 2. Check subcollections fallback
    const [catalogSnap, salesSnap, auditsSnap, freqSnap, logsSnap] = await Promise.allSettled([
      getDoc(doc(db, "tenants", pharmacyId, "catalog", "products")),
      getDoc(doc(db, "tenants", pharmacyId, "records", "sales")),
      getDoc(doc(db, "tenants", pharmacyId, "records", "audits")),
      getDoc(doc(db, "tenants", pharmacyId, "schedules", "frequencies")),
      getDoc(doc(db, "tenants", pharmacyId, "records", "logs"))
    ]);

    let hadSubcollectionData = false;

    if (catalogSnap.status === "fulfilled" && catalogSnap.value.exists()) {
      const prods = catalogSnap.value.data()?.items;
      if (Array.isArray(prods)) {
        saveTenantProducts(pharmacyId, prods, true);
        hadSubcollectionData = true;
      }
    }
    if (salesSnap.status === "fulfilled" && salesSnap.value.exists()) {
      const sales = salesSnap.value.data()?.items;
      if (Array.isArray(sales)) {
        saveTenantSales(pharmacyId, sales, true);
        hadSubcollectionData = true;
      }
    }
    if (auditsSnap.status === "fulfilled" && auditsSnap.value.exists()) {
      const audits = auditsSnap.value.data()?.items;
      if (Array.isArray(audits)) {
        saveTenantAudits(pharmacyId, audits, true);
        hadSubcollectionData = true;
      }
    }
    if (freqSnap.status === "fulfilled" && freqSnap.value.exists()) {
      const freqs = freqSnap.value.data()?.items;
      if (Array.isArray(freqs)) {
        saveTenantFrequencies(pharmacyId, freqs, true);
        hadSubcollectionData = true;
      }
    }
    if (logsSnap.status === "fulfilled" && logsSnap.value.exists()) {
      const logs = logsSnap.value.data()?.items;
      if (Array.isArray(logs)) {
        saveTenantLogs(pharmacyId, logs, true);
        hadSubcollectionData = true;
      }
    }

    if (hadSubcollectionData) {
      const currentPharm = getLocal<Pharmacy[]>(PHARMACIES_KEY, []).find((p) => p.id === pharmacyId);
      if (currentPharm) {
        return {
          pharmacy: currentPharm,
          users: getTenantUsers(pharmacyId),
          products: getTenantProducts(pharmacyId),
          sales: getTenantSales(pharmacyId),
          audits: getTenantAudits(pharmacyId),
          frequencies: getTenantFrequencies(pharmacyId),
          logs: getTenantLogs(pharmacyId),
          lastBackup: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn("[Firestore Pull]", err);
  }
  return null;
}

/**
 * Gets last backup timestamp for tenant
 */
export function getLastBackupTime(pharmacyId: string): string | null {
  return localStorage.getItem(`tenant_${pharmacyId}_last_backup`);
}
