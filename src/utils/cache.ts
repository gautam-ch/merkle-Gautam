import { openDB } from 'idb';
import type { NormalizedOrder } from '../types/order';

// Saves the cleaned orders in the browser so later visits skip the download.
// The cache is optional: if it fails, the orders just load the normal way.

const DB_NAME = 'OrdersExplorerDB';
// Raise this whenever the order shape or the cleaning rules change,
// so browsers drop orders saved by an older version.
const DB_VERSION = 5;
const STORE_NAME = 'normalized_orders';
const CACHE_KEY = 'latest_orders';

const openDatabase = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (db.objectStoreNames.contains(STORE_NAME)) db.deleteObjectStore(STORE_NAME);
      db.createObjectStore(STORE_NAME);
    },
  });

export async function getCachedOrders(): Promise<NormalizedOrder[] | null> {
  try {
    const db = await openDatabase();
    return (await db.get(STORE_NAME, CACHE_KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function setCachedOrders(orders: NormalizedOrder[]): Promise<void> {
  try {
    const db = await openDatabase();
    await db.put(STORE_NAME, orders, CACHE_KEY);
  } catch {
    // IndexedDB can be blocked (e.g. private browsing)
  }
}
