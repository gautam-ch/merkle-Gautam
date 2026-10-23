/// <reference lib="webworker" />
import type { NormalizedOrder, RawOrder } from '../types/order';
import type { WorkerRequest, WorkerResponse } from '../types/worker';
import { deduplicateOrders } from '../utils/deduplicate';
import { normalizeOrder } from '../utils/normalize';

declare const self: DedicatedWorkerGlobalScope;

function sendResponse(msg: WorkerResponse) {
  self.postMessage(msg);
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { type, payload } = e.data;

  if (type === 'FETCH_AND_NORMALIZE') {
    try {
      // 1. Downloading
      sendResponse({
        type: 'PROGRESS',
        payload: {
          stage: 'downloading',
          message: 'Downloading orders.json (17 MB)...',
        },
      });

      const response = await fetch(payload.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch orders data: HTTP ${response.status} ${response.statusText}`);
      }

      // 2. Parsing JSON off main thread
      sendResponse({
        type: 'PROGRESS',
        payload: {
          stage: 'parsing',
          message: 'Parsing JSON records in Web Worker...',
        },
      });

      const rawOrders: RawOrder[] = await response.json();

      // 3. Normalizing all 10 schema rules
      sendResponse({
        type: 'PROGRESS',
        payload: {
          stage: 'normalizing',
          message: `Normalizing ${rawOrders.length.toLocaleString()} records across schema versions...`,
        },
      });

      const normalized: NormalizedOrder[] = new Array(rawOrders.length);
      for (let i = 0; i < rawOrders.length; i++) {
        normalized[i] = normalizeOrder(rawOrders[i], i);
      }

      // 4. Deduplicating based on Rule #7
      sendResponse({
        type: 'PROGRESS',
        payload: {
          stage: 'deduplicating',
          message: 'Deduplicating duplicate IDs via timestamp priority...',
        },
      });

      const deduplicated = deduplicateOrders(normalized);

      // 5. Complete
      sendResponse({
        type: 'SUCCESS',
        payload: {
          orders: deduplicated,
          totalCount: deduplicated.length,
        },
      });
    } catch (err) {
      sendResponse({
        type: 'ERROR',
        payload: {
          message: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }
};
