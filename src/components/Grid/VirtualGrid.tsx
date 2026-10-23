import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckSquare,
  Pin,
  PinOff,
  Search,
  Square,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CellPosition, GridColumn, SortState } from '../../types/grid';
import type { NormalizedOrder } from '../../types/order';
import { RowDetailSheet } from './RowDetailSheet';

const ROW_HEIGHT = 40;
const OVERSCAN = 5;

interface VirtualGridProps {
  orders: NormalizedOrder[];
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  pinnedColumn: keyof NormalizedOrder | null;
  onPinnedChange: (col: keyof NormalizedOrder | null) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  columnFilters?: Record<string, string>;
  onColumnFilterChange?: (columnId: string, value: string) => void;
  onResetFilters?: () => void;
}

export const VirtualGrid: React.FC<VirtualGridProps> = ({
  orders,
  sort,
  onSortChange,
  pinnedColumn,
  onPinnedChange,
  selectedIds,
  onSelectionChange,
  columnFilters = {},
  onColumnFilterChange,
  onResetFilters,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  // Column widths state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    select: 48,
    id: 150,
    customerName: 180,
    status: 130,
    amount: 140,
    createdAt: 160,
    region: 130,
    channel: 120,
  });

  // Roving tabindex cell focus
  const [focusedCell, setFocusedCell] = useState<CellPosition>({
    rowIndex: 0,
    colIndex: 1,
  });

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [activeDetailOrder, setActiveDetailOrder] = useState<NormalizedOrder | null>(null);

  const resizingRef = useRef<{
    colId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    setViewportHeight(el.clientHeight || 600);

    return () => observer.disconnect();
  }, []);

  const columns: GridColumn[] = useMemo(
    () => [
      {
        id: 'id',
        header: 'Order ID',
        width: columnWidths.id ?? 150,
        sortable: true,
        type: 'string',
      },
      {
        id: 'customerName',
        header: 'Customer',
        width: columnWidths.customerName ?? 180,
        sortable: true,
        type: 'string',
      },
      {
        id: 'status',
        header: 'Status',
        width: columnWidths.status ?? 130,
        sortable: true,
        type: 'badge',
      },
      {
        id: 'amount',
        header: 'Amount',
        width: columnWidths.amount ?? 140,
        align: 'right',
        sortable: true,
        type: 'number',
      },
      {
        id: 'createdAt',
        header: 'Date',
        width: columnWidths.createdAt ?? 160,
        sortable: true,
        type: 'date',
      },
      {
        id: 'region',
        header: 'Region',
        width: columnWidths.region ?? 130,
        sortable: true,
        type: 'string',
      },
      {
        id: 'channel',
        header: 'Channel',
        width: columnWidths.channel ?? 120,
        sortable: true,
        type: 'string',
      },
    ],
    [columnWidths]
  );

  const totalCount = orders.length;
  const totalHeight = totalCount * ROW_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    totalCount,
    startIndex + Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2
  );

  const visibleOrders = useMemo(
    () => orders.slice(startIndex, endIndex),
    [orders, startIndex, endIndex]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleHeaderClick = (col: GridColumn) => {
    if (!col.sortable) return;

    if (sort.field !== col.id) {
      onSortChange({ field: col.id, direction: 'asc' });
    } else if (sort.direction === 'asc') {
      onSortChange({ field: col.id, direction: 'desc' });
    } else {
      onSortChange({ field: null, direction: null });
    }
  };

  const toggleRowSelection = (orderId: string, index: number, isShiftKey: boolean) => {
    const next = new Set(selectedIds);

    if (isShiftKey && lastSelectedIndex !== null) {
      const from = Math.min(lastSelectedIndex, index);
      const to = Math.max(lastSelectedIndex, index);

      for (let i = from; i <= to; i++) {
        const item = orders[i];
        if (item) next.add(item.id);
      }
    } else {
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      setLastSelectedIndex(index);
    }

    onSelectionChange(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length && orders.length > 0) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(orders.map((o) => o.id)));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (orders.length === 0) return;

    const maxRow = orders.length - 1;
    const maxCol = columns.length;

    let { rowIndex, colIndex } = focusedCell;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        rowIndex = Math.min(maxRow, rowIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        rowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        colIndex = Math.min(maxCol, colIndex + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        colIndex = Math.max(0, colIndex - 1);
        break;
      case ' ':
        e.preventDefault();
        if (orders[rowIndex]) {
          toggleRowSelection(orders[rowIndex].id, rowIndex, e.shiftKey);
        }
        return;
      case 'Enter':
        e.preventDefault();
        if (orders[rowIndex]) {
          setActiveDetailOrder(orders[rowIndex]);
        }
        return;
      default:
        return;
    }

    setFocusedCell({ rowIndex, colIndex });

    const targetTop = rowIndex * ROW_HEIGHT;
    const container = containerRef.current;
    if (container) {
      if (targetTop < container.scrollTop + 80) {
        container.scrollTop = Math.max(0, targetTop - 80);
      } else if (targetTop + ROW_HEIGHT > container.scrollTop + viewportHeight) {
        container.scrollTop = targetTop - viewportHeight + ROW_HEIGHT + 40;
      }
    }
  };

  const handleResizePointerDown = (colId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    resizingRef.current = {
      colId,
      startX: e.clientX,
      startWidth: columnWidths[colId] ?? 120,
    };
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!resizingRef.current) return;
    const { colId, startX, startWidth } = resizingRef.current;
    const delta = e.clientX - startX;
    const newWidth = Math.max(70, startWidth + delta);

    setColumnWidths((prev) => ({
      ...prev,
      [colId]: newWidth,
    }));
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (resizingRef.current) {
      const target = e.currentTarget as HTMLElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
      resizingRef.current = null;
    }
  };

  const isAllSelected = orders.length > 0 && selectedIds.size === orders.length;

  return (
    <div className="relative flex flex-1 flex-col h-full w-full overflow-hidden bg-white text-slate-800 select-none">
      {/* Scrollable Grid Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="grid"
        aria-rowcount={orders.length}
        aria-colcount={columns.length + 1}
        className="relative flex-1 overflow-auto focus:outline-none"
      >
        {/* Sticky Table Header matching Wireframe */}
        <div
          role="row"
          aria-rowindex={1}
          className="sticky top-0 z-30 flex border-b border-slate-300 bg-slate-50 shadow-xs"
          style={{ minWidth: 'max-content' }}
        >
          {/* Select All Column Header */}
          <div
            role="columnheader"
            aria-colindex={1}
            className="flex items-center justify-center border-r border-slate-200 px-3 py-2.5 bg-slate-50"
            style={{ width: columnWidths.select }}
          >
            <button
              onClick={toggleSelectAll}
              title="Select all rows"
              className="text-slate-400 hover:text-slate-800 transition"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Column Headers with Sort & Quick Filter Input */}
          {columns.map((col, cIndex) => {
            const isPinned = pinnedColumn === col.id;
            const isSorted = sort.field === col.id;

            return (
              <div
                key={col.id}
                role="columnheader"
                aria-colindex={cIndex + 2}
                aria-sort={isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                className={`relative flex flex-col justify-between border-r border-slate-200 p-2 text-xs font-semibold text-slate-700 bg-slate-50 transition-colors ${
                  isPinned ? 'sticky left-12 z-20 bg-slate-100 shadow-md border-r-2 border-r-slate-300' : ''
                }`}
                style={{ width: col.width }}
              >
                {/* Header Title + Actions */}
                <div className="flex items-center justify-between gap-1">
                  <div
                    onClick={() => handleHeaderClick(col)}
                    className="flex flex-1 items-center gap-1.5 cursor-pointer hover:text-slate-950 truncate"
                  >
                    <span className="truncate">{col.header}</span>
                    {col.sortable && (
                      <span className="shrink-0 text-slate-400">
                        {isSorted ? (
                          sort.direction === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Pin Button */}
                  <button
                    onClick={() => onPinnedChange(isPinned ? null : col.id)}
                    title={isPinned ? 'Unpin column' : 'Pin column to left'}
                    className={`rounded p-1 hover:bg-slate-200 transition ${
                      isPinned ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  </button>
                </div>

                {/* Column Quick Filter Input matching Wireframe */}
                {onColumnFilterChange && (
                  <div className="mt-1.5 flex items-center rounded border border-slate-300 bg-white px-1.5 py-0.5 shadow-2xs">
                    <Search className="h-2.5 w-2.5 text-slate-400 mr-1 shrink-0" />
                    <input
                      type="text"
                      placeholder={`Filter...`}
                      value={columnFilters[col.id] || ''}
                      onChange={(e) => onColumnFilterChange(col.id, e.target.value)}
                      className="w-full bg-transparent text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                )}

                {/* Column Resize Handle */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(col.id, e)}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-400/50 active:bg-blue-600 transition-colors"
                />
              </div>
            );
          })}
        </div>

        {/* Empty State matching Wireframe: "Zero matching Result" */}
        {orders.length === 0 && (
          <div className="flex h-96 w-full flex-col items-center justify-center p-8 text-center bg-white">
            <XCircle className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-2xl font-serif text-slate-500 tracking-wide font-normal">
              Zero matching Result
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 max-w-sm">
              No orders matched your active filter criteria. Try relaxing or clearing your conditions.
            </p>
            {onResetFilters && (
              <button
                onClick={onResetFilters}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* Phantom Spacer Container for Virtual Scrolling */}
        {orders.length > 0 && (
          <div
            style={{
              height: totalHeight,
              position: 'relative',
              minWidth: 'max-content',
            }}
          >
            {/* Rendered Window with translateY */}
            <div
              style={{
                transform: `translateY(${startIndex * ROW_HEIGHT}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {visibleOrders.map((order, vIndex) => {
                const actualIndex = startIndex + vIndex;
                const isSelected = selectedIds.has(order.id);
                const isRowFocused = focusedCell.rowIndex === actualIndex;

                return (
                  <div
                    key={order.id}
                    role="row"
                    aria-rowindex={actualIndex + 2}
                    aria-selected={isSelected}
                    onClick={(e) => toggleRowSelection(order.id, actualIndex, e.shiftKey)}
                    onDoubleClick={() => setActiveDetailOrder(order)}
                    className={`flex items-center border-b border-slate-200 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-900 font-medium'
                        : actualIndex % 2 === 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/40 hover:bg-slate-100/60'
                    }`}
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Checkbox Cell */}
                    <div
                      role="gridcell"
                      aria-colindex={1}
                      tabIndex={isRowFocused && focusedCell.colIndex === 0 ? 0 : -1}
                      className={`flex items-center justify-center border-r border-slate-200 px-3 h-full ${
                        isRowFocused && focusedCell.colIndex === 0
                          ? 'ring-2 ring-blue-600 ring-inset z-10'
                          : ''
                      }`}
                      style={{ width: columnWidths.select }}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300 hover:text-slate-500" />
                      )}
                    </div>

                    {/* Columns */}
                    {columns.map((col, cIndex) => {
                      const isPinned = pinnedColumn === col.id;
                      const isCellFocused =
                        isRowFocused && focusedCell.colIndex === cIndex + 1;

                      return (
                        <div
                          key={col.id}
                          role="gridcell"
                          aria-colindex={cIndex + 2}
                          tabIndex={isCellFocused ? 0 : -1}
                          className={`flex items-center px-3 h-full border-r border-slate-200 truncate ${
                            col.align === 'right' ? 'justify-end font-mono' : 'justify-start'
                          } ${
                            isPinned
                              ? 'sticky left-12 z-10 bg-inherit shadow-md border-r-2 border-r-slate-300 backdrop-blur-sm'
                              : ''
                          } ${
                            isCellFocused ? 'ring-2 ring-blue-600 ring-inset z-10' : ''
                          }`}
                          style={{ width: col.width }}
                        >
                          {col.id === 'id' && (
                            <span className="font-mono text-slate-900 font-semibold">
                              {order.id}
                            </span>
                          )}

                          {col.id === 'customerName' && (
                            <span className="truncate text-slate-800 font-medium">
                              {order.customerName || 'Anonymous'}
                            </span>
                          )}

                          {col.id === 'status' && (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                order.status === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : order.status === 'shipped'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : order.status === 'processing'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {order.status}
                            </span>
                          )}

                          {col.id === 'amount' && (
                            <span className="font-mono font-medium text-slate-900">
                              {order.amountFormatted}
                            </span>
                          )}

                          {col.id === 'createdAt' && (
                            <span className="font-mono text-slate-600 text-[11px]">
                              {order.createdAtFormatted}
                            </span>
                          )}

                          {col.id === 'region' && (
                            <span className="font-mono text-slate-700 text-[11px]">
                              {order.region}
                            </span>
                          )}

                          {col.id === 'channel' && (
                            <span className="text-slate-600 capitalize">
                              {order.channel}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Row Detail Drawer */}
      <RowDetailSheet
        order={activeDetailOrder}
        open={Boolean(activeDetailOrder)}
        onOpenChange={(open) => !open && setActiveDetailOrder(null)}
      />
    </div>
  );
};
