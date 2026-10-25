import { CheckSquare, Square } from 'lucide-react';
import type { GridColumn, SortState } from '../../types/grid';
import type { NormalizedOrder } from '../../types/order';
import { nextSort } from '../../utils/sort';
import type { ColumnDropdownOptions } from './columnOptions';
import { ColumnHeader } from './ColumnHeader';
import { SELECT_COLUMN_WIDTH } from './columns';

interface GridHeaderProps {
  columns: GridColumn[];
  totalWidth: number;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  pinnedColumn: keyof NormalizedOrder | null;
  onPinnedChange: (column: keyof NormalizedOrder | null) => void;
  columnFilters: Record<string, string>;
  onColumnFilterChange: (columnId: string, value: string) => void;
  dropdownOptions: ColumnDropdownOptions;
  isAllSelected: boolean;
  onToggleAll: () => void;
  onResizeStart: (columnId: string, e: React.PointerEvent) => void;
  onResize: (e: React.PointerEvent) => void;
  onResizeEnd: (e: React.PointerEvent) => void;
}

/** The sticky top row: select-all checkbox and a header for each column. */
export const GridHeader: React.FC<GridHeaderProps> = ({
  columns,
  totalWidth,
  sort,
  onSortChange,
  pinnedColumn,
  onPinnedChange,
  columnFilters,
  onColumnFilterChange,
  dropdownOptions,
  isAllSelected,
  onToggleAll,
  onResizeStart,
  onResize,
  onResizeEnd,
}) => (
  <div
    role="row"
    aria-rowindex={1}
    className="sticky top-0 z-30 flex border-b border-slate-300 bg-slate-50 shadow-xs"
    style={{ width: totalWidth }}
  >
    <div
      role="columnheader"
      aria-colindex={1}
      className="sticky left-0 z-20 shrink-0 flex items-center justify-center border-r border-slate-200 px-3 py-2.5 bg-slate-50"
      style={{ width: SELECT_COLUMN_WIDTH }}
    >
      <button onClick={onToggleAll} title="Select all rows" className="text-slate-400 hover:text-slate-800 transition">
        {isAllSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
      </button>
    </div>

    {columns.map((column, index) => (
      <ColumnHeader
        key={column.id}
        column={column}
        colIndex={index + 1}
        sort={sort}
        isPinned={pinnedColumn === column.id}
        filterValue={columnFilters[column.id] ?? ''}
        filterOptions={dropdownOptions[column.id]}
        onSort={() => onSortChange(nextSort(sort, column.id))}
        onPin={() => onPinnedChange(pinnedColumn === column.id ? null : column.id)}
        onFilterChange={(value) => onColumnFilterChange(column.id, value)}
        onResizeStart={(e) => onResizeStart(column.id, e)}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
      />
    ))}
  </div>
);
