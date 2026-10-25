import { useEffect, useMemo } from 'react';
import type { NormalizedOrder } from '../types/order';

/**
 * A link that selects orders which don't exist is a broken link. Once the
 * orders have loaded, calls onInvalid if any selected ID is unknown.
 */
export function useSelectionCheck(orders: NormalizedOrder[], selectedIds: Set<string>, onInvalid: () => void) {
  const knownIds = useMemo(() => new Set(orders.map((order) => order.id)), [orders]);

  useEffect(() => {
    if (knownIds.size === 0) return;
    for (const id of selectedIds) {
      if (!knownIds.has(id)) {
        onInvalid();
        return;
      }
    }
  }, [knownIds, selectedIds, onInvalid]);
}
