import { useDeferredValue, useMemo } from 'react';
import type { FilterState } from '../types/filter';
import type { SortState } from '../types/grid';
import type { NormalizedOrder } from '../types/order';
import { applyColumnFilters, applyFilter } from '../utils/filter';
import { sortOrders } from '../utils/sort';

/**
 * The orders the grid shows: filtered by the builder and the header filters,
 * then sorted. Filters are deferred, so typing stays responsive while the
 * 50,000 rows are re-filtered.
 */
export function useVisibleOrders(
  orders: NormalizedOrder[],
  filter: FilterState,
  columnFilters: Record<string, string>,
  sort: SortState
) {
  const deferredFilter = useDeferredValue(filter);
  const deferredColumnFilters = useDeferredValue(columnFilters);

  return useMemo(() => {
    const filtered = applyColumnFilters(applyFilter(orders, deferredFilter), deferredColumnFilters);
    return sortOrders(filtered, sort);
  }, [orders, deferredFilter, deferredColumnFilters, sort]);
}
