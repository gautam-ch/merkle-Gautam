import { ArrowDown, ArrowUp, ArrowUpDown, Pin, PinOff } from 'lucide-react';
import type { GridColumn, SortState } from '../../types/grid';
import type { DropdownOption } from './columnOptions';
import { ColumnQuickFilter } from './ColumnQuickFilter';
import { SELECT_COLUMN_WIDTH } from './columns';

interface ColumnHeaderProps {
  column: GridColumn;
  colIndex: number; // 1-based position among the data columns
  sort: SortState;
  isPinned: boolean;
  filterValue: string;
  filterOptions?: DropdownOption[];
  onSort: () => void;
  onPin: () => void;
  onFilterChange: (value: string) => void;
  onResizeStart: (e: React.PointerEvent) => void;
  onResize: (e: React.PointerEvent) => void;
  onResizeEnd: (e: React.PointerEvent) => void;
}

function SortIcon({ sort, isSorted }: { sort: SortState; isSorted: boolean }) {
  if (!isSorted) return <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />;
  const Arrow = sort.direction === 'asc' ? ArrowUp : ArrowDown;
  return <Arrow className="h-3.5 w-3.5 text-blue-600" />;
}

/** One column title with its sort, pin and resize controls and the quick filter below. */
export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  colIndex,
  sort,
  isPinned,
  filterValue,
  filterOptions,
  onSort,
  onPin,
  onFilterChange,
  onResizeStart,
  onResize,
  onResizeEnd,
}) => {
  const isSorted = sort.field === column.id;
  const ariaSort = isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
  const alignment = column.align === 'right' ? 'justify-end text-right' : 'justify-center text-center';

  return (
    <div
      role="columnheader"
      aria-colindex={colIndex + 1}
      aria-sort={ariaSort}
      className={`shrink-0 relative flex flex-col justify-between border-r border-slate-200 p-2 text-xs font-semibold text-slate-700 bg-slate-50 transition-colors ${
        isPinned ? 'sticky z-20 bg-slate-100 shadow-md border-r-2 border-r-slate-300' : ''
      }`}
      style={{ width: column.width, left: isPinned ? SELECT_COLUMN_WIDTH : undefined }}
    >
      <div className="flex items-center justify-between gap-1 w-full">
        <button
          type="button"
          onClick={onSort}
          title={`Sort by ${column.header}`}
          className={`flex flex-1 items-center gap-1.5 cursor-pointer hover:text-slate-950 truncate pl-4 rounded focus-visible:outline-2 focus-visible:outline-blue-600 ${alignment}`}
        >
          <span className="truncate">{column.header}</span>
          <span className="shrink-0 text-slate-400">
            <SortIcon sort={sort} isSorted={isSorted} />
          </span>
        </button>

        <button
          onClick={onPin}
          title={isPinned ? 'Unpin column' : 'Pin column to left'}
          aria-label={isPinned ? `Unpin ${column.header}` : `Pin ${column.header}`}
          className={`rounded p-1 hover:bg-slate-200 transition shrink-0 ${
            isPinned ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
      </div>

      <ColumnQuickFilter value={filterValue} options={filterOptions} onChange={onFilterChange} />

      {/* Drag this edge to resize the column */}
      <div
        onPointerDown={onResizeStart}
        onPointerMove={onResize}
        onPointerUp={onResizeEnd}
        className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-400/50 active:bg-blue-600 transition-colors"
      />
    </div>
  );
};
