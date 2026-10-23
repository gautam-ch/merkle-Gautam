import type { NormalizedOrder } from '../types/order';

/**
 * Deduplicates orders by ID based on Rule #7:
 * - If both records have an updatedAt, keep the one with the later updatedAt.
 * - If only one has an updatedAt, keep that one.
 * - If neither has one, keep the one that appears later in the file.
 *
 * Runs in O(N) time with Map.
 */
export function deduplicateOrders(orders: NormalizedOrder[]): NormalizedOrder[] {
  const map = new Map<string, NormalizedOrder>();

  for (const current of orders) {
    const existing = map.get(current.id);

    if (!existing) {
      map.set(current.id, current);
      continue;
    }

    // Both have updatedAt
    if (existing.updatedAt !== null && current.updatedAt !== null) {
      if (current.updatedAt > existing.updatedAt) {
        map.set(current.id, current);
      } else if (current.updatedAt === existing.updatedAt) {
        // Tie breaker: later in file
        if (current.fileIndex > existing.fileIndex) {
          map.set(current.id, current);
        }
      }
    }
    // Only current has updatedAt
    else if (existing.updatedAt === null && current.updatedAt !== null) {
      map.set(current.id, current);
    }
    // Only existing has updatedAt -> keep existing (do nothing)
    else if (existing.updatedAt !== null && current.updatedAt === null) {
      // keep existing
    }
    // Neither has updatedAt -> keep later in file
    else {
      if (current.fileIndex > existing.fileIndex) {
        map.set(current.id, current);
      }
    }
  }

  return Array.from(map.values());
}
