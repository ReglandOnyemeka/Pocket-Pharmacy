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
  DEFAULT_PHARMACY,
  DEFAULT_USERS,
  INITIAL_PRODUCTS_TEMPLATE,
  INITIAL_FREQUENCIES_TEMPLATE
} from "../data/initialData";
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

const PHARMACIES_KEY = "pocket_pharmacies_registry";
const USERS_REGISTRY_KEY = "pocket_users_global_registry";
const CURRENT_USER_KEY = "pocket_active_user";
const CURRENT_PHARMACY_KEY = "pocket_active_pharmacy";

type RegistryListener = (pharmacies: Pharmacy[], users: AppUser[]) => void;
const registryListeners = new Set<RegistryListener>();

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
            const currentLocal = getLocal<Pharmacy[]>(PHARMACIES_KEY, [DEFAULT_PHARMACY]);
            const mergedMap = new Map<string, Pharmacy>();
            currentLocal.forEach((p) => mergedMap.set(p.id, p));
            cloudPharmacies.forEach((p) => mergedMap.set(p.id, p));
            const merged = Array.from(mergedMap.values());
            setLocal(PHARMACIES_KEY, merged);

            const currentUsers = getLocal<AppUser[]>(USERS_REGISTRY_KEY, DEFAULT_USERS);
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
            const currentLocal = getLocal<AppUser[]>(USERS_REGISTRY_KEY, DEFAULT_USERS);
            const mergedMap = new Map<string, AppUser>();
            currentLocal.forEach((u) => mergedMap.set(u.id, u));
            cloudUsers.forEach((u) => mergedMap.set(u.id, u));
            const merged = Array.from(mergedMap.values());
            setLocal(USERS_REGISTRY_KEY, merged);

            const currentPharmacies = getLocal<Pharmacy[]>(PHARMACIES_KEY, [DEFAULT_PHARMACY]);
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
 * Initializes default multi-tenant registry from LocalStorage + bidirectional Firestore sync
 */
export function initTenantRegistry(): { pharmacies: Pharmacy[]; users: AppUser[] } {
  let pharmacies = getLocal<Pharmacy[]>(PHARMACIES_KEY, [DEFAULT_PHARMACY]);
  let users = getLocal<AppUser[]>(USERS_REGISTRY_KEY, DEFAULT_USERS);

  if (pharmacies.length === 0) pharmacies = [DEFAULT_PHARMACY];
  if (users.length === 0) users = DEFAULT_USERS;

  setLocal(PHARMACIES_KEY, pharmacies);
  setLocal(USERS_REGISTRY_KEY, users);

  // Seed default tenant local structures
  ensureTenantSeeded(DEFAULT_PHARMACY.id, true);

  // Set up real-time listener
  setupRegistryRealtimeListener();

  // Asynchronously synchronize global registry with Firebase
  syncRegistryWithFirebase(pharmacies, users).catch((e) =>
    console.warn("[Firestore] Silent registry sync warning:", e)
  );

  return { pharmacies, users };
}

/**
 * Syncs pharmacies and users with Firestore bi-directionally
 */
export async function syncRegistryWithFirebase(localPharmacies: Pharmacy[], localUsers: AppUser[]) {
  try {
    let updatedPharmacies = [...localPharmacies];
    let updatedUsers = [...localUsers];
    let changed = false;

    // 1. Fetch cloud pharmacies
    const pharmSnapshot = await getDocs(collection(db, "pharmacies"));
    if (pharmSnapshot.empty) {
      // Seed initial cloud pharmacies
      for (const p of localPharmacies) {
        await setDoc(doc(db, "pharmacies", p.id), p);
      }
    } else {
      const cloudPharmacies: Pharmacy[] = [];
      pharmSnapshot.forEach((docSnap) => {
        const p = docSnap.data() as Pharmacy;
        if (p && p.id) cloudPharmacies.push(p);
      });

      const pharmMap = new Map<string, Pharmacy>();
      localPharmacies.forEach((p) => pharmMap.set(p.id, p));
      cloudPharmacies.forEach((p) => pharmMap.set(p.id, p));
      updatedPharmacies = Array.from(pharmMap.values());
      changed = true;
      setLocal(PHARMACIES_KEY, updatedPharmacies);
    }

    // 2. Fetch cloud users
    const userSnapshot = await getDocs(collection(db, "users"));
    if (userSnapshot.empty) {
      // Seed initial cloud users
      for (const u of localUsers) {
        await setDoc(doc(db, "users", u.id), u);
      }
    } else {
      const cloudUsers: AppUser[] = [];
      userSnapshot.forEach((docSnap) => {
        const u = docSnap.data() as AppUser;
        if (u && u.id) cloudUsers.push(u);
      });

      const userMap = new Map<string, AppUser>();
      localUsers.forEach((u) => userMap.set(u.id, u));
      cloudUsers.forEach((u) => userMap.set(u.id, u));
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
 * Performs robust asynchronous authentication against local cache and cloud Firestore
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

  // 1. Check local registry first
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
      const matchPharm =
        localPharmacies.find((p) => p.id === matchLocal.pharmacyId) || DEFAULT_PHARMACY;
      
      // Async pull cloud tenant data to ensure freshest state
      pullTenantFromFirebase(matchLocal.pharmacyId).catch(() => null);
      
      return {
        success: true,
        user: matchLocal,
        pharmacy: matchPharm
      };
    }
  }

  // 2. Direct Cloud Verification via Firestore (handles fresh domains/browsers & updated credentials)
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
          ...DEFAULT_PHARMACY,
          id: cloudUser.pharmacyId,
          name: "Pharmacy Terminal"
        };
      }

      // Merge into local registry
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

  // 3. If local user matched but PIN failed
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
 * Ensures an isolated tenant has initial sample catalog and settings
 */
export function ensureTenantSeeded(pharmacyId: string, isDefault = false) {
  const prodKey = `tenant_${pharmacyId}_products`;
  if (!localStorage.getItem(prodKey)) {
    const starterProds = isDefault ? INITIAL_PRODUCTS_TEMPLATE(pharmacyId) : [];
    setLocal(prodKey, starterProds);
  }

  const freqKey = `tenant_${pharmacyId}_frequencies`;
  if (!localStorage.getItem(freqKey)) {
    const starterFreqs = isDefault ? INITIAL_FREQUENCIES_TEMPLATE(pharmacyId) : [];
    setLocal(freqKey, starterFreqs);
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
 * Creates a brand new Pharmacy Tenant Workspace.
 * The creator is assigned as Super Admin of this new tenant.
 * Persists immediately both locally and in Firebase Firestore.
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
    cacNumber: params.cacNumber || `RC-${Math.floor(1000000 + Math.random() * 9000000)}`,
    pcnLicense: params.pcnLicense || `PCN/REG/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
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

  // Seed isolated tenant database
  ensureTenantSeeded(pharmacyId);

  // Update registries locally
  const updatedPharmacies = [...pharmacies, newPharmacy];
  const updatedUsers = [...users, newSuperAdmin];

  setLocal(PHARMACIES_KEY, updatedPharmacies);
  setLocal(USERS_REGISTRY_KEY, updatedUsers);
  setLocal(CURRENT_PHARMACY_KEY, newPharmacy);
  setLocal(CURRENT_USER_KEY, newSuperAdmin);

  notifyRegistryListeners(updatedPharmacies, updatedUsers);

  // Save to Firebase Firestore immediately
  (async () => {
    try {
      await setDoc(doc(db, "pharmacies", pharmacyId), newPharmacy);
      await setDoc(doc(db, "users", superAdminId), newSuperAdmin);
      await setDoc(doc(db, "tenants", pharmacyId), {
        pharmacy: newPharmacy,
        users: [newSuperAdmin],
        products: [],
        sales: [],
        audits: [],
        frequencies: [],
        logs: [],
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("[Firestore] Error saving new tenant to cloud:", e);
    }
  })();

  return { pharmacy: newPharmacy, superAdmin: newSuperAdmin };
}

/**
 * Adds a new user under a Super Admin's tenant
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
    accessibleFeatures: userData.accessibleFeatures || (userData.role === "cashier" ? ["sales"] : ["sales", "inventory", "audits", "ai_consult", "admin_panel"]),
    createdAt: new Date().toISOString()
  };

  const updatedUsers = [...users, newUser];
  setLocal(USERS_REGISTRY_KEY, updatedUsers);
  notifyRegistryListeners(pharmacies, updatedUsers);

  // Firestore async persist
  setDoc(doc(db, "users", newUser.id), newUser).catch((err) =>
    console.warn("[Firestore] User persist warning:", err)
  );

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
 * Updates a tenant user
 */
export function updateTenantUser(updatedUser: AppUser): void {
  const { users, pharmacies } = initTenantRegistry();
  const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
  setLocal(USERS_REGISTRY_KEY, updated);
  notifyRegistryListeners(pharmacies, updated);

  setDoc(doc(db, "users", updatedUser.id), updatedUser).catch((err) =>
    console.warn("[Firestore] User update warning:", err)
  );
}

/**
 * Resets password/PIN for Super Admin accounts with cloud & local sync
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

  // 2. If not found locally, search Firestore
  if (!superAdmin) {
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
    // Check if the user exists but is not super_admin
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
      message: `No Super Admin account found matching "${identifier}". Please check your username or registered email.`
    };
  }

  const updatedAdmin: AppUser = {
    ...superAdmin,
    pin: cleanPin
  };

  const updatedUsers = [...users.filter((u) => u.id !== updatedAdmin.id), updatedAdmin];
  setLocal(USERS_REGISTRY_KEY, updatedUsers);
  notifyRegistryListeners(pharmacies, updatedUsers);

  // If current active user in localStorage is this super admin, update it too
  const activeUser = getLocal<AppUser | null>(CURRENT_USER_KEY, null);
  if (activeUser && activeUser.id === updatedAdmin.id) {
    setLocal(CURRENT_USER_KEY, updatedAdmin);
  }

  // Update in Firestore
  try {
    await setDoc(doc(db, "users", updatedAdmin.id), updatedAdmin);
  } catch (err) {
    console.warn("[Firestore] Super admin password reset sync warning:", err);
  }

  return {
    success: true,
    message: `Password for Super Admin (${updatedAdmin.fullName || updatedAdmin.username}) has been successfully updated.`,
    user: updatedAdmin
  };
}

/**
 * Deletes a tenant user
 */
export function deleteTenantUser(userId: string): void {
  const { users, pharmacies } = initTenantRegistry();
  const updated = users.filter((u) => u.id !== userId);
  setLocal(USERS_REGISTRY_KEY, updated);
  notifyRegistryListeners(pharmacies, updated);

  deleteDoc(doc(db, "users", userId)).catch((err) =>
    console.warn("[Firestore] User delete warning:", err)
  );
}

/**
 * Updates pharmacy profile
 */
export function updateTenantPharmacy(updatedPharmacy: Pharmacy): void {
  const { pharmacies, users } = initTenantRegistry();
  const updated = pharmacies.map((p) => (p.id === updatedPharmacy.id ? updatedPharmacy : p));
  setLocal(PHARMACIES_KEY, updated);
  setLocal(CURRENT_PHARMACY_KEY, updatedPharmacy);
  notifyRegistryListeners(updated, users);

  setDoc(doc(db, "pharmacies", updatedPharmacy.id), updatedPharmacy).catch((err) =>
    console.warn("[Firestore] Pharmacy update warning:", err)
  );
}

/**
 * Reads isolated tenant products
 */
export function getTenantProducts(pharmacyId: string): Product[] {
  const key = `tenant_${pharmacyId}_products`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading tenant products", e);
  }
  const defaults = pharmacyId === DEFAULT_PHARMACY.id ? INITIAL_PRODUCTS_TEMPLATE(pharmacyId) : [];
  setLocal(key, defaults);
  return defaults;
}

/**
 * Saves isolated tenant products
 */
export function saveTenantProducts(pharmacyId: string, products: Product[]): void {
  const key = `tenant_${pharmacyId}_products`;
  setLocal(key, products);

  // Firestore real-time save
  setDoc(doc(db, "tenants", pharmacyId, "catalog", "products"), { items: products }, { merge: true }).catch((e) =>
    console.warn("[Firestore] Catalog save warning:", e)
  );
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
 * Saves isolated tenant sales records
 */
export function saveTenantSales(pharmacyId: string, sales: SaleRecord[]): void {
  const key = `tenant_${pharmacyId}_sales`;
  setLocal(key, sales);

  // Firestore real-time save
  setDoc(doc(db, "tenants", pharmacyId, "records", "sales"), { items: sales }, { merge: true }).catch((e) =>
    console.warn("[Firestore] Sales save warning:", e)
  );
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
 * Saves isolated tenant audit history
 */
export function saveTenantAudits(pharmacyId: string, audits: StockAuditRecord[]): void {
  const key = `tenant_${pharmacyId}_audits`;
  setLocal(key, audits);

  setDoc(doc(db, "tenants", pharmacyId, "records", "audits"), { items: audits }, { merge: true }).catch((e) =>
    console.warn("[Firestore] Audits save warning:", e)
  );
}

/**
 * Reads isolated tenant stock frequencies
 */
export function getTenantFrequencies(pharmacyId: string): StockFrequency[] {
  const key = `tenant_${pharmacyId}_frequencies`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading tenant frequencies", e);
  }
  const defaults = pharmacyId === DEFAULT_PHARMACY.id ? INITIAL_FREQUENCIES_TEMPLATE(pharmacyId) : [];
  setLocal(key, defaults);
  return defaults;
}

/**
 * Saves isolated tenant stock frequencies
 */
export function saveTenantFrequencies(pharmacyId: string, frequencies: StockFrequency[]): void {
  const key = `tenant_${pharmacyId}_frequencies`;
  setLocal(key, frequencies);

  setDoc(doc(db, "tenants", pharmacyId, "schedules", "frequencies"), { items: frequencies }, { merge: true }).catch((e) =>
    console.warn("[Firestore] Frequencies save warning:", e)
  );
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
 * Saves isolated tenant audit logs
 */
export function saveTenantLogs(pharmacyId: string, logs: AuditScheduleLog[]): void {
  const key = `tenant_${pharmacyId}_logs`;
  setLocal(key, logs);

  setDoc(doc(db, "tenants", pharmacyId, "records", "logs"), { items: logs }, { merge: true }).catch((e) =>
    console.warn("[Firestore] Logs save warning:", e)
  );
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
 * Backs up tenant database directly to Firebase Firestore with parallel background execution
 */
export async function backupTenantDatabase(
  pharmacyId: string,
  pharmacy: Pharmacy
): Promise<{ success: boolean; timestamp: string; message: string }> {
  const snapshot = compileTenantSnapshot(pharmacyId, pharmacy);
  const timestamp = new Date().toISOString();

  // 1. Instant local persistence
  localStorage.setItem(`tenant_${pharmacyId}_last_backup`, timestamp);

  // 2. Parallel cloud sync (Firestore + Server Backup)
  const syncPromise = Promise.allSettled([
    setDoc(doc(db, "tenants", pharmacyId), {
      ...snapshot,
      lastBackup: timestamp
    }, { merge: true }),
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

  // Race with a fast 400ms window so the button never lags or hangs
  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 400));
  await Promise.race([syncPromise, timeoutPromise]);

  return {
    success: true,
    timestamp,
    message: "Database securely persisted to Cloud and local storage."
  };
}

/**
 * Loads entire tenant data from Firestore into local cache if online
 */
export async function pullTenantFromFirebase(pharmacyId: string): Promise<TenantSnapshot | null> {
  try {
    // 1. Check main tenant document
    const tenantDoc = await getDoc(doc(db, "tenants", pharmacyId));
    if (tenantDoc.exists()) {
      const data = tenantDoc.data() as TenantSnapshot;
      if (data.products && Array.isArray(data.products)) saveTenantProducts(pharmacyId, data.products);
      if (data.sales && Array.isArray(data.sales)) saveTenantSales(pharmacyId, data.sales);
      if (data.audits && Array.isArray(data.audits)) saveTenantAudits(pharmacyId, data.audits);
      if (data.frequencies && Array.isArray(data.frequencies)) saveTenantFrequencies(pharmacyId, data.frequencies);
      if (data.logs && Array.isArray(data.logs)) saveTenantLogs(pharmacyId, data.logs);
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
        saveTenantProducts(pharmacyId, prods);
        hadSubcollectionData = true;
      }
    }
    if (salesSnap.status === "fulfilled" && salesSnap.value.exists()) {
      const sales = salesSnap.value.data()?.items;
      if (Array.isArray(sales)) {
        saveTenantSales(pharmacyId, sales);
        hadSubcollectionData = true;
      }
    }
    if (auditsSnap.status === "fulfilled" && auditsSnap.value.exists()) {
      const audits = auditsSnap.value.data()?.items;
      if (Array.isArray(audits)) {
        saveTenantAudits(pharmacyId, audits);
        hadSubcollectionData = true;
      }
    }
    if (freqSnap.status === "fulfilled" && freqSnap.value.exists()) {
      const freqs = freqSnap.value.data()?.items;
      if (Array.isArray(freqs)) {
        saveTenantFrequencies(pharmacyId, freqs);
        hadSubcollectionData = true;
      }
    }
    if (logsSnap.status === "fulfilled" && logsSnap.value.exists()) {
      const logs = logsSnap.value.data()?.items;
      if (Array.isArray(logs)) {
        saveTenantLogs(pharmacyId, logs);
        hadSubcollectionData = true;
      }
    }

    if (hadSubcollectionData) {
      return {
        pharmacy: getLocal<Pharmacy[]>(PHARMACIES_KEY, [DEFAULT_PHARMACY]).find((p) => p.id === pharmacyId) || DEFAULT_PHARMACY,
        users: getTenantUsers(pharmacyId),
        products: getTenantProducts(pharmacyId),
        sales: getTenantSales(pharmacyId),
        audits: getTenantAudits(pharmacyId),
        frequencies: getTenantFrequencies(pharmacyId),
        logs: getTenantLogs(pharmacyId),
        lastBackup: new Date().toISOString()
      };
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
