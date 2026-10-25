import { useState, type RefObject } from 'react';
import type { CellPosition, GridColumn } from '../../types/grid';
import { moveFocus } from '../../utils/gridNavigation';
import { ROW_HEIGHT } from './columns';
import { scrollCellIntoView } from './scrollCellIntoView';

interface Options {
  containerRef: RefObject<HTMLDivElement | null>;
  rowCount: number;
  columns: GridColumn[];
  hasPinnedColumn: boolean;
  viewportHeight: number;
  onToggleRow: (rowIndex: number, shiftKey: boolean) => void;
  onOpenRow: (rowIndex: number) => void;
}

/**
 * The focused cell, and what the grid keys do: arrows move it, Space selects
 * the row, Enter opens its details.
 */
export function useGridFocus({
  containerRef,
  rowCount,
  columns,
  hasPinnedColumn,
  viewportHeight,
  onToggleRow,
  onOpenRow,
}: Options) {
  const [focusedCell, setFocusedCell] = useState<CellPosition>({ rowIndex: 0, colIndex: 1 });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (rowCount === 0) return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (e.key === ' ') onToggleRow(focusedCell.rowIndex, e.shiftKey);
      else onOpenRow(focusedCell.rowIndex);
      return;
    }

    const pageSize = Math.max(1, Math.floor(viewportHeight / ROW_HEIGHT) - 2);
    const next = moveFocus(e.key, e.ctrlKey, focusedCell, { rowCount, lastColIndex: columns.length, pageSize });
    if (!next) return;

    e.preventDefault();
    setFocusedCell(next);
    if (containerRef.current) {
      scrollCellIntoView(containerRef.current, next, { columns, hasPinnedColumn, viewportHeight });
    }
  };

  return { focusedCell, setFocusedCell, handleKeyDown };
}
