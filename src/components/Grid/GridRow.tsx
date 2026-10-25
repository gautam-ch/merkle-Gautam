import { CheckSquare, Square } from 'lucide-react';
import type { CellPosition, GridColumn } from '../../types/grid';
import type { NormalizedOrder } from '../../types/order';
import { CellContent } from './CellContent';
import { ROW_HEIGHT, SELECT_COLUMN_WIDTH } from './columns';

interface GridRowProps {
  order: NormalizedOrder;
  rowIndex: number;
  columns: GridColumn[];
  pinnedColumn: keyof NormalizedOrder | null;
  totalWidth: number;
  isSelected: boolean;
  focusedColIndex: number | null; // set only on the row that has focus
  onSelect: (rowIndex: number, shiftKey: boolean) => void;
  onFocusCell: (cell: CellPosition) => void;
  onOpen: (order: NormalizedOrder) => void;
}

const FOCUS_RING = 'ring-2 ring-blue-600 ring-inset';

function rowColor(isSelected: boolean, rowIndex: number) {
  if (isSelected) return 'bg-blue-50 text-blue-900 font-medium';
  return rowIndex % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-50 hover:bg-slate-100';
}

function cellClassName(align: GridColumn['align'], isPinned: boolean, isFocused: boolean) {
  const alignment = align === 'right' ? 'justify-end text-right' : 'justify-center text-center';
  const pinned = isPinned ? 'sticky z-10 shadow-md border-r-2 border-r-slate-300' : '';
  // Pinned cells need a solid background so scrolled cells don't show through
  const state = isFocused ? `${FOCUS_RING} bg-blue-100 text-blue-950 font-semibold` : isPinned ? 'bg-inherit' : '';
  return `shrink-0 flex items-center px-3 h-full border-r border-slate-200 truncate cursor-pointer transition-colors ${alignment} ${pinned} ${state}`;
}

/** One order row: a checkbox cell followed by a cell per column. */
export const GridRow: React.FC<GridRowProps> = ({
  order,
  rowIndex,
  columns,
  pinnedColumn,
  totalWidth,
  isSelected,
  focusedColIndex,
  onSelect,
  onFocusCell,
  onOpen,
}) => (
  // Clicks on any cell bubble up to the row, which selects it
  <div
    role="row"
    aria-rowindex={rowIndex + 2}
    aria-selected={isSelected}
    onClick={(e) => onSelect(rowIndex, e.shiftKey)}
    onDoubleClick={() => onOpen(order)}
    className={`flex items-center border-b border-slate-200 text-xs transition-colors cursor-pointer ${rowColor(isSelected, rowIndex)}`}
    style={{ height: ROW_HEIGHT, width: totalWidth }}
  >
    <div
      id={`cell-${rowIndex}-0`}
      role="gridcell"
      aria-colindex={1}
      onClick={() => onFocusCell({ rowIndex, colIndex: 0 })}
      className={`sticky left-0 z-10 shrink-0 flex items-center justify-center border-r border-slate-200 px-3 h-full bg-inherit ${
        focusedColIndex === 0 ? FOCUS_RING : ''
      }`}
      style={{ width: SELECT_COLUMN_WIDTH }}
    >
      {isSelected ? (
        <CheckSquare className="h-4 w-4 text-blue-600" />
      ) : (
        <Square className="h-4 w-4 text-slate-300 hover:text-slate-500" />
      )}
    </div>

    {columns.map((col, index) => {
      const colIndex = index + 1;
      const isPinned = pinnedColumn === col.id;
      return (
        <div
          key={col.id}
          id={`cell-${rowIndex}-${colIndex}`}
          role="gridcell"
          aria-colindex={colIndex + 1}
          onClick={() => onFocusCell({ rowIndex, colIndex })}
          className={cellClassName(col.align, isPinned, focusedColIndex === colIndex)}
          style={{ width: col.width, left: isPinned ? SELECT_COLUMN_WIDTH : undefined }}
        >
          <CellContent columnId={col.id} order={order} />
        </div>
      );
    })}
  </div>
);
