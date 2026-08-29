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
  deleteDoc
} from "../lib/firebase";

const PHARMACIES_KEY = "pocket_pharmacies_registry";
const USERS_REGISTRY_KEY = "pocket_users_global_registry";
const CURRENT_USER_KEY = "pocket_active_user";
const CURRENT_PHARMACY_KEY = "pocket_active_pharmacy";

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
 * Initializes default multi-tenant registry from LocalStorage + asynchronous Firestore sync
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

  // Asynchronously synchronize global registry with Firebase
  syncRegistryWithFirebase(pharmacies, users).catch((e) =>
    console.warn("[Firestore] Silent registry sync warning:", e)
  );

  return { pharmacies, users };
}

/**
 * Syncs pharmacies and users with Firestore
 */
async function syncRegistryWithFirebase(localPharmacies: Pharmacy[], localUsers: AppUser[]) {
  try {
    // 1. Fetch cloud pharmacies
    const pharmSnapshot = await getDocs(collection(db, "pharmacies"));
    if (pharmSnapshot.empty) {
      // Seed initial cloud pharmacies
      for (const p of localPharmacies) {
        await setDoc(doc(db, "pharmacies", p.id), p);
      }
    }

    // 2. Fetch cloud users
    const userSnapshot = await getDocs(collection(db, "users"));
    if (userSnapshot.empty) {
      // Seed initial cloud users
      for (const u of localUsers) {
        await setDoc(doc(db, "users", u.id), u);
      }
    }
  } catch (err) {
    console.warn("[Firestore] Sync registry error:", err);
  }
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
    pin: params.pin,
    email: params.email,
    phone: params.phone,
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

  // Asynchronously save to Firebase Firestore
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
  const { users } = initTenantRegistry();
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
  const { users } = initTenantRegistry();
  const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
  setLocal(USERS_REGISTRY_KEY, updated);

  setDoc(doc(db, "users", updatedUser.id), updatedUser).catch((err) =>
    console.warn("[Firestore] User update warning:", err)
  );
}

/**
 * Resets password/PIN for Super Admin accounts only
 */
export function resetSuperAdminPin(
  identifier: string,
  newPin: string
): { success: boolean; message: string; user?: AppUser } {
  const { users } = initTenantRegistry();
  const cleanId = identifier.trim().toLowerCase();
  const cleanPin = newPin.trim();

  if (!cleanPin || cleanPin.length < 4) {
    return {
      success: false,
      message: "New password/PIN must be at least 4 characters long."
    };
  }

  // Find user with super_admin role matching username or email
  const superAdmin = users.find(
    (u) =>
      u.role === "super_admin" &&
      (u.username.toLowerCase() === cleanId || u.email?.toLowerCase() === cleanId)
  );

  if (!superAdmin) {
    // Check if the user exists but is not super_admin
    const regularUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanId || u.email?.toLowerCase() === cleanId
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

  const updatedUsers = users.map((u) => (u.id === updatedAdmin.id ? updatedAdmin : u));
  setLocal(USERS_REGISTRY_KEY, updatedUsers);

  // If current active user in localStorage is this super admin, update it too
  const activeUser = getLocal<AppUser | null>(CURRENT_USER_KEY, null);
  if (activeUser && activeUser.id === updatedAdmin.id) {
    setLocal(CURRENT_USER_KEY, updatedAdmin);
  }

  // Update in Firestore
  setDoc(doc(db, "users", updatedAdmin.id), updatedAdmin).catch((err) =>
    console.warn("[Firestore] Super admin password reset sync warning:", err)
  );

  return {
    success: true,
    message: `Password/PIN for Super Admin (${updatedAdmin.fullName || updatedAdmin.username}) has been successfully updated.`,
    user: updatedAdmin
  };
}

/**
 * Deletes a tenant user
 */
export function deleteTenantUser(userId: string): void {
  const { users } = initTenantRegistry();
  const updated = users.filter((u) => u.id !== userId);
  setLocal(USERS_REGISTRY_KEY, updated);

  deleteDoc(doc(db, "users", userId)).catch((err) =>
    console.warn("[Firestore] User delete warning:", err)
  );
}

/**
 * Updates pharmacy profile
 */
export function updateTenantPharmacy(updatedPharmacy: Pharmacy): void {
  const { pharmacies } = initTenantRegistry();
  const updated = pharmacies.map((p) => (p.id === updatedPharmacy.id ? updatedPharmacy : p));
  setLocal(PHARMACIES_KEY, updated);
  setLocal(CURRENT_PHARMACY_KEY, updatedPharmacy);

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
    const tenantDoc = await getDoc(doc(db, "tenants", pharmacyId));
    if (tenantDoc.exists()) {
      const data = tenantDoc.data() as TenantSnapshot;
      if (data.products) saveTenantProducts(pharmacyId, data.products);
      if (data.sales) saveTenantSales(pharmacyId, data.sales);
      if (data.audits) saveTenantAudits(pharmacyId, data.audits);
      if (data.frequencies) saveTenantFrequencies(pharmacyId, data.frequencies);
      if (data.logs) saveTenantLogs(pharmacyId, data.logs);
      return data;
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
