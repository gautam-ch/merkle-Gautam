/// <reference lib="webworker" />
// Loads orders.json, cleans it and removes duplicates here instead of on the
// main thread, so the page stays responsive while 17 MB is processed.
import type { NormalizedOrder } from '../types/order';
import type { WorkerRequest, WorkerResponse, WorkerStage } from '../types/worker';
import { deduplicateOrders } from '../utils/deduplicate';
import { normalizeOrder } from '../utils/normalize';
import { parseRawOrders } from '../utils/rawOrder';

declare const self: DedicatedWorkerGlobalScope;

const post = (message: WorkerResponse) => self.postMessage(message);
const reportProgress = (stage: WorkerStage, message: string) => post({ type: 'PROGRESS', payload: { stage, message } });

async function loadOrders(url: string): Promise<NormalizedOrder[]> {
  reportProgress('downloading', 'Downloading orders…');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load the orders (HTTP ${response.status})`);

  reportProgress('parsing', 'Reading the file…');
  const records: unknown[] = await response.json();
  const { orders: rawOrders, skipped } = parseRawOrders(records);
  if (skipped > 0) console.warn(`Skipped ${skipped} records that could not be read`);

  reportProgress('normalizing', `Cleaning up ${rawOrders.length.toLocaleString()} orders…`);
  const cleaned = rawOrders.map((order, index) => normalizeOrder(order, index));

  reportProgress('deduplicating', 'Removing duplicate orders…');
  return deduplicateOrders(cleaned);
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  try {
    post({ type: 'SUCCESS', payload: { orders: await loadOrders(e.data.url) } });
  } catch (err) {
    post({ type: 'ERROR', payload: { message: err instanceof Error ? err.message : String(err) } });
  }
};
