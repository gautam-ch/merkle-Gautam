import type { NormalizedOrder } from '../types/order';

// Whether a duplicate should replace the record already kept:
// the later updatedAt wins; if only one has an updatedAt, that one wins;
// otherwise (or on a tie) the one that appears later in the file wins.
function replaces(candidate: NormalizedOrder, kept: NormalizedOrder): boolean {
  const { updatedAt: a } = candidate;
  const { updatedAt: b } = kept;

  if (a !== null && b !== null && a !== b) return a > b;
  if ((a === null) !== (b === null)) return a !== null;
  return candidate.fileIndex > kept.fileIndex;
}

/** One record per order ID, using the rule above to pick between duplicates. */
export function deduplicateOrders(orders: NormalizedOrder[]): NormalizedOrder[] {
  const kept = new Map<string, NormalizedOrder>();

  for (const order of orders) {
    const existing = kept.get(order.id);
    if (!existing || replaces(order, existing)) kept.set(order.id, order);
  }

  return [...kept.values()];
}
