import type { CellPosition } from '../types/grid';

interface GridSize {
  rowCount: number;
  lastColIndex: number;
  pageSize: number; // rows moved by PageUp / PageDown
}

const FIRST_DATA_COL = 1; // column 0 is the checkbox

/**
 * Where a navigation key moves the focus. Returns null for any other key.
 */
export function moveFocus(key: string, ctrlKey: boolean, cell: CellPosition, size: GridSize): CellPosition | null {
  const lastRow = size.rowCount - 1;
  const { rowIndex, colIndex } = cell;

  switch (key) {
    case 'ArrowDown':
      return { rowIndex: Math.min(lastRow, rowIndex + 1), colIndex };
    case 'ArrowUp':
      return { rowIndex: Math.max(0, rowIndex - 1), colIndex };
    case 'ArrowRight':
      return { rowIndex, colIndex: Math.min(size.lastColIndex, colIndex + 1) };
    case 'ArrowLeft':
      return { rowIndex, colIndex: Math.max(0, colIndex - 1) };
    case 'PageDown':
      return { rowIndex: Math.min(lastRow, rowIndex + size.pageSize), colIndex };
    case 'PageUp':
      return { rowIndex: Math.max(0, rowIndex - size.pageSize), colIndex };
    case 'Home':
      return { rowIndex: ctrlKey ? 0 : rowIndex, colIndex: FIRST_DATA_COL };
    case 'End':
      return { rowIndex: ctrlKey ? lastRow : rowIndex, colIndex: size.lastColIndex };
    default:
      return null;
  }
}
