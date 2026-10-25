import { useMemo, useRef, useState } from 'react';
import type { GridColumn } from '../../types/grid';
import type { NormalizedOrder } from '../../types/order';
import { GRID_COLUMNS } from '../../config/gridColumns';
import { DEFAULT_COLUMN_WIDTHS, MIN_COLUMN_WIDTH, SELECT_COLUMN_WIDTH } from './columns';

const FALLBACK_WIDTH = 140;

/**
 * The columns in display order with their current widths, plus the pointer
 * handlers for dragging a column edge to resize it.
 * The pinned column is moved first so it stays visible next to the checkboxes.
 */
export function useGridColumns(pinnedColumn: keyof NormalizedOrder | null) {
  const [widths, setWidths] = useState(DEFAULT_COLUMN_WIDTHS);
  const drag = useRef<{ columnId: string; startX: number; startWidth: number } | null>(null);

  const columns: GridColumn[] = useMemo(() => {
    const pinned = GRID_COLUMNS.filter((col) => col.id === pinnedColumn);
    const others = GRID_COLUMNS.filter((col) => col.id !== pinnedColumn);
    return [...pinned, ...others].map((col) => ({ ...col, width: widths[col.id] ?? FALLBACK_WIDTH }));
  }, [widths, pinnedColumn]);

  const totalWidth = SELECT_COLUMN_WIDTH + columns.reduce((sum, col) => sum + col.width, 0);

  const startResize = (columnId: string, e: React.PointerEvent) => {
    e.stopPropagation(); // don't trigger a sort click
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { columnId, startX: e.clientX, startWidth: widths[columnId] ?? FALLBACK_WIDTH };
  };

  const resize = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const { columnId, startX, startWidth } = drag.current;
    const width = Math.max(MIN_COLUMN_WIDTH, startWidth + e.clientX - startX);
    setWidths((prev) => ({ ...prev, [columnId]: width }));
  };

  const endResize = (e: React.PointerEvent) => {
    if (!drag.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
  };

  return { columns, totalWidth, startResize, resize, endResize };
}
