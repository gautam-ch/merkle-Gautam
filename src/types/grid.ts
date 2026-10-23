import type React from 'react';
import type { NormalizedOrder } from './order';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  field: keyof NormalizedOrder | null;
  direction: SortDirection;
}

export interface GridColumn {
  id: keyof NormalizedOrder;
  header: string;
  width: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  type?: 'string' | 'number' | 'date' | 'badge';
  renderCell?: (row: NormalizedOrder) => React.ReactNode;
}

export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}
