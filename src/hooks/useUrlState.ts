import { useCallback, useEffect, useState } from 'react';
import type { FilterState } from '../types/filter';
import type { SortDirection, SortState } from '../types/grid';
import type { NormalizedOrder } from '../types/order';
import { deserializeFilter, serializeFilter } from '../utils/filter';

export interface GridUrlState {
  sort: SortState;
  pinnedColumn: keyof NormalizedOrder | null;
  selectedIds: Set<string>;
  filter: FilterState;
}

export function useUrlState() {
  const [urlState, setUrlState] = useState<GridUrlState>(() => {
    if (typeof window === 'undefined') {
      return {
        sort: { field: null, direction: null },
        pinnedColumn: null,
        selectedIds: new Set(),
        filter: { groups: [] },
      };
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const sortField = params.get('sort') as keyof NormalizedOrder | null;
      const sortDir = params.get('dir') as SortDirection;
      const pin = params.get('pin') as keyof NormalizedOrder | null;
      const sel = params.get('sel');
      const f = params.get('f');

      const parsedFilter = deserializeFilter(f);

      return {
        sort: {
          field: sortField || null,
          direction: sortDir === 'asc' || sortDir === 'desc' ? sortDir : null,
        },
        pinnedColumn: pin || null,
        selectedIds: sel ? new Set(sel.split(',').filter(Boolean)) : new Set(),
        filter: parsedFilter || { groups: [] },
      };
    } catch {
      // Safe fallback on any malformed state (Rule 6.6)
      return {
        sort: { field: null, direction: null },
        pinnedColumn: null,
        selectedIds: new Set(),
        filter: { groups: [] },
      };
    }
  });

  const syncToUrl = useCallback((newState: Partial<GridUrlState>) => {
    setUrlState((prev) => {
      const merged: GridUrlState = {
        ...prev,
        ...newState,
      };

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);

        if (merged.sort.field && merged.sort.direction) {
          params.set('sort', String(merged.sort.field));
          params.set('dir', merged.sort.direction);
        } else {
          params.delete('sort');
          params.delete('dir');
        }

        if (merged.pinnedColumn) {
          params.set('pin', String(merged.pinnedColumn));
        } else {
          params.delete('pin');
        }

        if (merged.selectedIds.size > 0) {
          const ids = Array.from(merged.selectedIds).slice(0, 20);
          params.set('sel', ids.join(','));
        } else {
          params.delete('sel');
        }

        if (merged.filter && merged.filter.groups.some((g) => g.conditions.length > 0)) {
          const encoded = serializeFilter(merged.filter);
          if (encoded) {
            params.set('f', encoded);
          } else {
            params.delete('f');
          }
        } else {
          params.delete('f');
        }

        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
      }

      return merged;
    });
  }, []);

  // Listen for browser popstate
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sortField = params.get('sort') as keyof NormalizedOrder | null;
        const sortDir = params.get('dir') as SortDirection;
        const pin = params.get('pin') as keyof NormalizedOrder | null;
        const sel = params.get('sel');
        const f = params.get('f');

        setUrlState({
          sort: {
            field: sortField || null,
            direction: sortDir === 'asc' || sortDir === 'desc' ? sortDir : null,
          },
          pinnedColumn: pin || null,
          selectedIds: sel ? new Set(sel.split(',').filter(Boolean)) : new Set(),
          filter: deserializeFilter(f) || { groups: [] },
        });
      } catch {
        // Fallback safely
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { urlState, syncToUrl };
}
