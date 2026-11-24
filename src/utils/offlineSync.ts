/**
 * Offline-First IndexedDB Persistence & Pending Cloud Sync Queue
 * Ensures all pharmacy POS sales, inventory updates, audits, and accounts
 * persist locally first and automatically sync to cloud when connectivity returns.
 */

const DB_NAME = "pocket_pharmacy_offline_db";
const DB_VERSION = 1;
const KV_STORE = "kv_store";
const PENDING_QUEUE_KEY = "pocket_offline_pending_sync_queue";

export type OfflineSyncEntity =
  | "pharmacy"
  | "user"
  | "user_delete"
  | "products"
  | "sales"
  | "audits"
  | "frequencies"
  | "logs"
  | "tenant_full";

export interface PendingSyncItem {
  id: string; // dedupe key, e.g. "products:pharm_123"
  entity: OfflineSyncEntity;
  pharmacyId: string;
  targetId?: string;
  updatedAt: string;
}

type QueueListener = (items: PendingSyncItem[]) => void;
const queueListeners = new Set<QueueListener>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openOfflineDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(KV_STORE)) {
          db.createObjectStore(KV_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("[OfflineDB] IndexedDB open failed, falling back to localStorage.");
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Mirrors key-value state asynchronously into IndexedDB for higher offline capacity
 */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openOfflineDB();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(KV_STORE, "readwrite");
      tx.objectStore(KV_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn(`[OfflineDB] Failed writing ${key} to IndexedDB`, e);
  }
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openOfflineDB();
    if (!db) return null;
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(KV_STORE, "readonly");
      const req = tx.objectStore(KV_STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbHydrateLocalStorage(keys: string[]): Promise<boolean> {
  let hydratedAny = false;
  for (const key of keys) {
    try {
      if (!localStorage.getItem(key)) {
        const val = await idbGet<unknown>(key);
        if (val !== null && val !== undefined) {
          localStorage.setItem(key, JSON.stringify(val));
          hydratedAny = true;
        }
      }
    } catch {
      // ignore hydration errors
    }
  }
  return hydratedAny;
}

/**
 * Pending Sync Queue helpers (stored synchronously in localStorage + mirrored to IndexedDB)
 */
export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

function savePendingSyncQueue(items: PendingSyncItem[]): void {
  try {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
  idbSet(PENDING_QUEUE_KEY, items).catch(() => null);
  queueListeners.forEach((fn) => {
    try {
      fn(items);
    } catch {
      // ignore listener errors
    }
  });
}

export function enqueueOfflineSync(
  entity: OfflineSyncEntity,
  pharmacyId: string,
  targetId?: string
): void {
  const id = targetId ? `${entity}:${pharmacyId}:${targetId}` : `${entity}:${pharmacyId}`;
  const current = getPendingSyncQueue().filter((item) => item.id !== id);
  const next: PendingSyncItem[] = [
    ...current,
    {
      id,
      entity,
      pharmacyId,
      targetId,
      updatedAt: new Date().toISOString()
    }
  ];
  savePendingSyncQueue(next);
}

export function removeOfflineSyncItems(ids: string[]): void {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const remaining = getPendingSyncQueue().filter((item) => !idSet.has(item.id));
  savePendingSyncQueue(remaining);
}

export function hasPendingOfflineChanges(pharmacyId?: string): boolean {
  const queue = getPendingSyncQueue();
  if (!pharmacyId) return queue.length > 0;
  return queue.some((item) => item.pharmacyId === pharmacyId);
}

export function subscribePendingSyncQueue(listener: QueueListener): () => void {
  queueListeners.add(listener);
  listener(getPendingSyncQueue());
  return () => {
    queueListeners.delete(listener);
  };
}
