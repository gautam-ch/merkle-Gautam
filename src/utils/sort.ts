import type { SortState } from '../types/grid';
import type { NormalizedOrder } from '../types/order';

/**
 * Type-aware comparator for NormalizedOrder fields.
 * Handles:
 * - String comparison with localeCompare
 * - Numeric comparison for amount, itemCount, priority
 * - Timestamp comparison for createdAt and updatedAt
 * - Explicit rule #5: null updatedAt rows are always sorted to the end regardless of direction
 */
export function sortOrders(orders: NormalizedOrder[], sort: SortState): NormalizedOrder[] {
  if (!sort.field || !sort.direction) {
    return orders;
  }

  const { field, direction } = sort;
  const isAsc = direction === 'asc';

  return [...orders].sort((a, b) => {
    const valA = a[field];
    const valB = b[field];

    // Special rule for updatedAt: nulls go to the bottom in both asc and desc
    if (field === 'updatedAt') {
      if (valA === null && valB === null) return 0;
      if (valA === null) return 1;
      if (valB === null) return -1;
    }

    // Special rule for priority: nulls (None) placed at bottom
    if (field === 'priority') {
      if (valA === null && valB === null) return 0;
      if (valA === null) return 1;
      if (valB === null) return -1;
    }

    if (valA === valB) return 0;

    // Numeric comparison
    if (typeof valA === 'number' && typeof valB === 'number') {
      return isAsc ? valA - valB : valB - valA;
    }

    // String comparison
    const strA = String(valA ?? '');
    const strB = String(valB ?? '');
    const cmp = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
    return isAsc ? cmp : -cmp;
  });
}
