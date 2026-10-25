import type { SortState } from '../types/grid';
import type { NormalizedOrder } from '../types/order';

// Created once and reused. Building a new comparer on every comparison
// (localeCompare with options) made text sorts take seconds on 50,000 rows.
const textCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

// Columns where empty values (null) always go last, whatever the direction
const EMPTY_LAST_FIELDS = new Set<keyof NormalizedOrder>(['updatedAt', 'priority']);

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return textCollator.compare(String(a ?? ''), String(b ?? ''));
}

/**
 * The sort after clicking a column header: ascending, then descending,
 * then back to unsorted. Clicking a different column starts at ascending.
 */
export function nextSort(current: SortState, field: keyof NormalizedOrder): SortState {
  if (current.field !== field) return { field, direction: 'asc' };
  if (current.direction === 'asc') return { field, direction: 'desc' };
  return { field: null, direction: null };
}

/**
 * Returns a sorted copy of the orders. Amounts, counts and dates (stored as
 * timestamps) sort as numbers; text sorts alphabetically. Empty Updated At
 * and Priority values always go last (data-notes rule 5).
 */
export function sortOrders(orders: NormalizedOrder[], sort: SortState): NormalizedOrder[] {
  const { field, direction } = sort;
  if (!field || !direction) return orders;

  const sign = direction === 'asc' ? 1 : -1;
  const emptyLast = EMPTY_LAST_FIELDS.has(field);

  return [...orders].sort((a, b) => {
    const valA = a[field];
    const valB = b[field];

    if (emptyLast && (valA === null || valB === null)) {
      if (valA === valB) return 0;
      return valA === null ? 1 : -1;
    }
    return sign * compareValues(valA, valB);
  });
}
