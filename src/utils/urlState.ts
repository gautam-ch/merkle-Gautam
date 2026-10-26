import { z } from 'zod';
import { GRID_COLUMNS } from '../config/fields';
import type { FilterState } from '../types/filter';
import type { SortState } from '../types/grid';
import type { NormalizedOrder } from '../types/order';
import { deserializeFilter, serializeFilter } from './filterUrl';
import { deserializeSelection, isValidSelectionParam, serializeSelection } from './selection';

export interface GridUrlState {
  sort: SortState;
  pinnedColumn: keyof NormalizedOrder | null;
  selectedIds: Set<string>;
  filter: FilterState;
  columnFilters: Record<string, string>; // quick filters under the column headers
}

export const defaultUrlState = (): GridUrlState => ({
  sort: { field: null, direction: null },
  pinnedColumn: null,
  selectedIds: new Set(),
  filter: { groups: [] },
  columnFilters: {},
});

const COLUMN_IDS = new Set<string>(GRID_COLUMNS.map((col) => col.id));

// Every query parameter the app writes; anything else (e.g. a typo) means a broken link
const KNOWN_PARAMS = new Set(['sort', 'dir', 'pin', 'sel', 'f', 'q']);

const isColumnId = (value: string | null): value is keyof NormalizedOrder =>
  value !== null && COLUMN_IDS.has(value);

// Header quick filters are stored as JSON: {"createdAt":"05/"}
const columnFiltersSchema = z.record(
  z.string().refine((key) => COLUMN_IDS.has(key)),
  z.string()
);

function parseColumnFilters(q: string | null): Record<string, string> | null {
  if (q === null) return {};
  try {
    const result = columnFiltersSchema.safeParse(JSON.parse(q));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Reads the view state from a query string. Returns null if any value is
 * broken or unknown, so the caller can show a message and the default view.
 */
export function parseUrlState(search: string): GridUrlState | null {
  const params = new URLSearchParams(search);
  for (const key of params.keys()) {
    if (!KNOWN_PARAMS.has(key)) return null;
  }

  const sortField = params.get('sort');
  const sortDir = params.get('dir');
  const pin = params.get('pin');
  const sel = params.get('sel');
  const f = params.get('f');

  let sort: SortState = { field: null, direction: null };
  if (sortField !== null || sortDir !== null) {
    if (!isColumnId(sortField) || (sortDir !== 'asc' && sortDir !== 'desc')) return null;
    sort = { field: sortField, direction: sortDir };
  }

  if (pin !== null && !isColumnId(pin)) return null;
  if (sel !== null && !isValidSelectionParam(sel)) return null;

  const filter = f === null ? { groups: [] } : deserializeFilter(f);
  if (!filter) return null;

  const columnFilters = parseColumnFilters(params.get('q'));
  if (!columnFilters) return null;

  return {
    sort,
    pinnedColumn: isColumnId(pin) ? pin : null,
    selectedIds: deserializeSelection(sel),
    filter,
    columnFilters,
  };
}

/**
 * Writes the view state as a query string (without "?"). Default values are
 * left out, so the default view is just the plain address.
 */
export function serializeUrlState(state: GridUrlState): string {
  const params = new URLSearchParams();

  if (state.sort.field && state.sort.direction) {
    params.set('sort', state.sort.field);
    params.set('dir', state.sort.direction);
  }
  if (state.pinnedColumn) {
    params.set('pin', state.pinnedColumn);
  }
  if (state.selectedIds.size > 0) {
    params.set('sel', serializeSelection(state.selectedIds));
  }
  if (state.filter.groups.some((group) => group.conditions.length > 0)) {
    params.set('f', serializeFilter(state.filter));
  }
  if (Object.keys(state.columnFilters).length > 0) {
    params.set('q', JSON.stringify(state.columnFilters));
  }

  return params.toString();
}
