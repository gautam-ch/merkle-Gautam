import type { NormalizedOrder } from './order';

type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  field: keyof NormalizedOrder | null;
  direction: SortDirection;
}

export interface GridColumn {
  id: keyof NormalizedOrder;
  header: string;
  width: number;
  align: 'center' | 'right';
}

// colIndex 0 is the checkbox column, data columns start at 1
export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}
