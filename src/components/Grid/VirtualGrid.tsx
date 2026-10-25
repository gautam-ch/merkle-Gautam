import { useCallback, useMemo, useState } from 'react';
import type { CellPosition, SortState } from '../../types/grid';
import type { NormalizedOrder } from '../../types/order';
import { getColumnDropdownOptions } from './columnOptions';
import { ROW_HEIGHT } from './columns';
import { EmptyResults } from './EmptyResults';
import { GridHeader } from './GridHeader';
import { GridRow } from './GridRow';
import { RowDetailSheet } from './RowDetailSheet';
import { useGridColumns } from './useGridColumns';
import { useGridFocus } from './useGridFocus';
import { useGridKeyboard } from './useGridKeyboard';
import { useRowSelection } from './useRowSelection';
import { useVirtualRows } from './useVirtualRows';

interface VirtualGridProps {
  orders: NormalizedOrder[]; // the rows to show (already filtered and sorted)
  allOrders: NormalizedOrder[]; // every order, used to build the header dropdown options
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  pinnedColumn: keyof NormalizedOrder | null;
  onPinnedChange: (column: keyof NormalizedOrder | null) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  columnFilters: Record<string, string>;
  onColumnFilterChange: (columnId: string, value: string) => void;
  onClearFilters: () => void;
}

/**
 * The data grid. Only the rows on screen are in the DOM: a tall empty spacer
 * keeps the scrollbar the right size, and the drawn rows are moved to where
 * the user has scrolled.
 */
export const VirtualGrid: React.FC<VirtualGridProps> = ({
  orders,
  allOrders,
  sort,
  onSortChange,
  pinnedColumn,
  onPinnedChange,
  selectedIds,
  onSelectionChange,
  columnFilters,
  onColumnFilterChange,
  onClearFilters,
}) => {
  const [detailOrder, setDetailOrder] = useState<NormalizedOrder | null>(null);

  const { containerRef, handleScroll, viewportHeight, range } = useVirtualRows(orders.length);
  const { columns, totalWidth, startResize, resize, endResize } = useGridColumns(pinnedColumn);
  const { selectRow, toggleAll, isAllSelected } = useRowSelection(orders, selectedIds, onSelectionChange);
  const dropdownOptions = useMemo(() => getColumnDropdownOptions(allOrders), [allOrders]);

  const { focusedCell, setFocusedCell, handleKeyDown } = useGridFocus({
    containerRef,
    rowCount: orders.length,
    columns,
    hasPinnedColumn: pinnedColumn !== null,
    viewportHeight,
    onToggleRow: selectRow,
    onOpenRow: (rowIndex) => setDetailOrder(orders[rowIndex] ?? null),
  });
  useGridKeyboard(containerRef, detailOrder === null, handleKeyDown);

  // Clicking a cell moves the focus there and keeps the arrow keys working
  const focusCell = useCallback(
    (cell: CellPosition) => {
      setFocusedCell(cell);
      containerRef.current?.focus();
    },
    [setFocusedCell, containerRef]
  );

  return (
    <div className="relative flex flex-1 flex-col h-full w-full overflow-hidden bg-white text-slate-800 select-none">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        tabIndex={0}
        role="grid"
        aria-activedescendant={orders.length > 0 ? `cell-${focusedCell.rowIndex}-${focusedCell.colIndex}` : undefined}
        aria-rowcount={orders.length}
        aria-colcount={columns.length + 1}
        className="relative flex-1 overflow-auto focus:outline-none"
      >
        <GridHeader
          columns={columns}
          totalWidth={totalWidth}
          sort={sort}
          onSortChange={onSortChange}
          pinnedColumn={pinnedColumn}
          onPinnedChange={onPinnedChange}
          columnFilters={columnFilters}
          onColumnFilterChange={onColumnFilterChange}
          dropdownOptions={dropdownOptions}
          isAllSelected={isAllSelected}
          onToggleAll={toggleAll}
          onResizeStart={startResize}
          onResize={resize}
          onResizeEnd={endResize}
        />

        {orders.length === 0 ? (
          <EmptyResults onClearFilters={onClearFilters} />
        ) : (
          <div style={{ height: orders.length * ROW_HEIGHT, position: 'relative', width: totalWidth }}>
            <div
              style={{
                transform: `translateY(${range.start * ROW_HEIGHT}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                width: totalWidth,
              }}
            >
              {orders.slice(range.start, range.end).map((order, offset) => {
                const rowIndex = range.start + offset;
                return (
                  <GridRow
                    key={order.id}
                    order={order}
                    rowIndex={rowIndex}
                    columns={columns}
                    pinnedColumn={pinnedColumn}
                    totalWidth={totalWidth}
                    isSelected={selectedIds.has(order.id)}
                    focusedColIndex={focusedCell.rowIndex === rowIndex ? focusedCell.colIndex : null}
                    onSelect={selectRow}
                    onFocusCell={focusCell}
                    onOpen={setDetailOrder}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <RowDetailSheet
        order={detailOrder}
        open={detailOrder !== null}
        onOpenChange={(open) => !open && setDetailOrder(null)}
      />
    </div>
  );
};
