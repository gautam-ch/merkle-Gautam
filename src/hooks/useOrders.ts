import { useCallback, useEffect, useState } from 'react';
import type { NormalizedOrder } from '../types/order';
import type { WorkerProgressPayload, WorkerRequest, WorkerResponse } from '../types/worker';
import { getCachedOrders, setCachedOrders } from '../utils/cache';

/**
 * Loads the orders. A copy saved by an earlier visit is used when there is one;
 * otherwise a Web Worker downloads and cleans the file and the result is saved
 * for next time.
 */
export function useOrders(url: string = '/orders.json') {
  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<WorkerProgressPayload | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  useEffect(() => {
    let cancelled = false;
    let worker: Worker | null = null;

    const fail = (message: string) => {
      setError(message);
      setLoading(false);
      setProgress(null);
    };

    const handleMessage = (e: MessageEvent<WorkerResponse>) => {
      if (cancelled) return;
      const message = e.data;

      if (message.type === 'PROGRESS') {
        setProgress(message.payload);
      } else if (message.type === 'SUCCESS') {
        setOrders(message.payload.orders);
        setLoading(false);
        setProgress(null);
        setCachedOrders(message.payload.orders);
      } else {
        fail(message.payload.message);
      }
    };

    async function load() {
      setLoading(true);
      setError(null);

      const cached = await getCachedOrders();
      if (cancelled) return;
      if (cached && cached.length > 0) {
        setOrders(cached);
        setLoading(false);
        return;
      }

      worker = new Worker(new URL('../workers/data.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = handleMessage;
      worker.onerror = (e) => !cancelled && fail(`Could not process the orders: ${e.message}`);
      worker.postMessage({ url } satisfies WorkerRequest);
    }

    load();

    return () => {
      cancelled = true;
      worker?.terminate();
    };
  }, [url, attempt]);

  return { orders, loading, error, progress, reload };
}
