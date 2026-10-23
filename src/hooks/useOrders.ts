import { useCallback, useEffect, useState } from 'react';
import type { NormalizedOrder } from '../types/order';
import type { WorkerProgressPayload, WorkerResponse } from '../types/worker';
import { getCachedOrders, setCachedOrders } from '../utils/cache';

export interface UseOrdersResult {
  orders: NormalizedOrder[];
  loading: boolean;
  error: string | null;
  progress: WorkerProgressPayload | null;
  reload: () => void;
}

export function useOrders(url: string = '/orders.json'): UseOrdersResult {
  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<WorkerProgressPayload | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const reload = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let worker: Worker | null = null;

    async function loadData() {
      setLoading(true);
      setError(null);

      // Check cache first for instant load
      try {
        const cached = await getCachedOrders();
        if (cached && cached.length > 0 && !isCancelled) {
          setOrders(cached);
          setLoading(false);
          return;
        }
      } catch {
        // Cache miss or failure, continue to worker
      }

      try {
        // Instantiate Web Worker
        worker = new Worker(new URL('../workers/data.worker.ts', import.meta.url), {
          type: 'module',
        });

        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
          if (isCancelled) return;
          const res = e.data;

          if (res.type === 'PROGRESS') {
            setProgress(res.payload);
          } else if (res.type === 'SUCCESS') {
            setOrders(res.payload.orders);
            setLoading(false);
            setProgress(null);
            // Async cache write in background
            setCachedOrders(res.payload.orders);
          } else if (res.type === 'ERROR') {
            setError(res.payload.message);
            setLoading(false);
            setProgress(null);
          }
        };

        worker.onerror = (err) => {
          if (isCancelled) return;
          setError(`Worker encountered an error: ${err.message}`);
          setLoading(false);
          setProgress(null);
        };

        // Start worker processing
        worker.postMessage({
          type: 'FETCH_AND_NORMALIZE',
          payload: { url },
        });
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
        setProgress(null);
      }
    }

    loadData();

    return () => {
      isCancelled = true;
      if (worker) {
        worker.terminate();
      }
    };
  }, [url, reloadTrigger]);

  return { orders, loading, error, progress, reload };
}
