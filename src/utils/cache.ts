import type { NormalizedOrder } from '../types/order';

// Saves the cleaned orders in the browser so later visits skip the download.
// The cache is optional: if it fails, the orders just load the normal way.

const DB_NAME = 'OrdersExplorerDB';
// Raise this whenever the order shape or the cleaning rules change,
// so browsers drop orders saved by an older version.
const DB_VERSION = 5;
const STORE_NAME = 'normalized_orders';
const CACHE_KEY = 'latest_orders';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      db.createObjectStore(STORE_NAME);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedOrders(): Promise<NormalizedOrder[] | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(CACHE_KEY);

      req.onsuccess = () => {
        resolve(req.result ? (req.result as NormalizedOrder[]) : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedOrders(orders: NormalizedOrder[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(orders, CACHE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // IndexedDB can be blocked (e.g. private browsing)
  }
}
