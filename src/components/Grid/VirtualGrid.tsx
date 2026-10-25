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
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CellPosition, GridColumn, SortState } from '../../types/grid';
import type { NormalizedOrder } from '../../types/order';
import { RowDetailSheet } from './RowDetailSheet';

const ROW_HEIGHT = 40;
const OVERSCAN = 5;

const ALL_COLUMNS: Omit<GridColumn, 'width'>[] = [
  { id: 'id', header: 'Order ID', align: 'center', sortable: true, type: 'string' },
  { id: 'customerName', header: 'Customer', align: 'center', sortable: true, type: 'string' },
  { id: 'customerEmail', header: 'Customer Email', align: 'center', sortable: true, type: 'string' },
  { id: 'status', header: 'Status', align: 'center', sortable: true, type: 'badge' },
  { id: 'amount', header: 'Amount', align: 'right', sortable: true, type: 'number' },
  { id: 'createdAt', header: 'Created At', align: 'center', sortable: true, type: 'date' },
  { id: 'updatedAt', header: 'Updated At', align: 'center', sortable: true, type: 'date' },
  { id: 'priority', header: 'Priority', align: 'center', sortable: true, type: 'badge' },
  { id: 'paymentMethod', header: 'Payment Method', align: 'center', sortable: true, type: 'string' },
  { id: 'itemCount', header: 'Items', align: 'right', sortable: true, type: 'number' },
  { id: 'region', header: 'Region', align: 'center', sortable: true, type: 'string' },
  { id: 'channel', header: 'Channel', align: 'center', sortable: true, type: 'string' },
  { id: 'notes', header: 'Notes', align: 'center', sortable: true, type: 'string' },
];

const DEFAULT_COLUMN_ENUM_OPTIONS: Partial<Record<keyof NormalizedOrder, { label: string; value: string }[]>> = {
  status: [
    { label: 'All Statuses', value: '' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Processing', value: 'processing' },
    { label: 'Pending', value: 'pending' },
    { label: 'Cancelled', value: 'cancelled' },
  ],
  channel: [
    { label: 'All Channels', value: '' },
    { label: 'Web', value: 'web' },
    { label: 'App', value: 'app' },
    { label: 'Store', value: 'store' },
    { label: 'Phone', value: 'phone' },
  ],
  region: [
    { label: 'All Regions', value: '' },
    { label: 'North', value: 'NORTH' },
    { label: 'South', value: 'SOUTH' },
    { label: 'East', value: 'EAST' },
    { label: 'West', value: 'WEST' },
    { label: 'Central', value: 'CENTRAL' },
    { label: 'Northeast', value: 'NORTHEAST' },
  ],
  paymentMethod: [
    { label: 'All Payments', value: '' },
    { label: 'UPI', value: 'upi' },
    { label: 'Card', value: 'card' },
    { label: 'Netbanking', value: 'netbanking' },
    { label: 'COD', value: 'cod' },
    { label: 'Wallet', value: 'wallet' },
  ],
  priority: [
    { label: 'All Priorities', value: '' },
    { label: '1 (Highest)', value: '1' },
    { label: '2', value: '2' },
    { label: '3 (Lowest)', value: '3' },
    { label: 'None', value: 'none' },
  ],
};

interface VirtualGridProps {
  orders: NormalizedOrder[];
  allOrders?: NormalizedOrder[];
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
  allOrders,
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

  const columnEnumOptions = useMemo(() => {
    const dataSource = allOrders && allOrders.length > 0 ? allOrders : orders;
    if (!dataSource || dataSource.length === 0) {
      return DEFAULT_COLUMN_ENUM_OPTIONS;
    }

    const statusSet = new Set<string>();
    const channelSet = new Set<string>();
    const regionSet = new Set<string>();
    const paymentSet = new Set<string>();
    const prioritySet = new Set<string>();

    for (let i = 0; i < dataSource.length; i++) {
      const o = dataSource[i];
      if (o.status) statusSet.add(String(o.status));
      if (o.channel) channelSet.add(String(o.channel));
      if (o.region) regionSet.add(String(o.region));
      if (o.paymentMethod) paymentSet.add(String(o.paymentMethod));
      if (o.priority !== undefined && o.priority !== null) {
        prioritySet.add(String(o.priority));
      }
    }

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return {
      status: [
        { label: 'All Statuses', value: '' },
        ...Array.from(statusSet).sort().map((v) => ({ label: capitalize(v), value: v })),
      ],
      channel: [
        { label: 'All Channels', value: '' },
        ...Array.from(channelSet).sort().map((v) => ({ label: capitalize(v), value: v })),
      ],
      region: [
        { label: 'All Regions', value: '' },
        ...Array.from(regionSet).sort().map((v) => ({ label: v.toUpperCase(), value: v })),
      ],
      paymentMethod: [
        { label: 'All Payments', value: '' },
        ...Array.from(paymentSet).sort().map((v) => ({
          label: ['upi', 'cod'].includes(v.toLowerCase()) ? v.toUpperCase() : capitalize(v),
          value: v,
        })),
      ],
      priority: [
        { label: 'All Priorities', value: '' },
        ...Array.from(prioritySet).sort().map((v) => ({
          label: v === '1' ? '1 (Highest)' : v === '3' ? '3 (Lowest)' : v,
          value: v,
        })),
        { label: 'None', value: 'none' },
      ],
    };
  }, [allOrders, orders]);

  // Calibrated column widths: exactly 6 columns fit on a 13-inch display (1280px) without any cut column!
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    select: 48,
    id: 130,
    customerName: 155,
    customerEmail: 185,
    status: 120,
    amount: 125,
    createdAt: 150,
    updatedAt: 150,
    priority: 105,
    paymentMethod: 125,
    itemCount: 80,
    region: 105,
    channel: 100,
    notes: 220,
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

  // Compute columns. The pinned column moves to the front so it stays visible
  // even when it was pinned from the far right of the grid.
  const columns: GridColumn[] = useMemo(() => {
    const ordered = pinnedColumn
      ? [
          ...ALL_COLUMNS.filter((col) => col.id === pinnedColumn),
          ...ALL_COLUMNS.filter((col) => col.id !== pinnedColumn),
        ]
      : ALL_COLUMNS;
    return ordered.map((col) => ({
      ...col,
      width: columnWidths[col.id] ?? 140,
    }));
  }, [columnWidths, pinnedColumn]);

  const selectWidth = columnWidths.select ?? 48;
  const hasPinnedColumn = pinnedColumn !== null && columns[0]?.id === pinnedColumn;

  const totalGridWidth = useMemo(() => {
    return (columnWidths.select ?? 48) + columns.reduce((acc, col) => acc + col.width, 0);
  }, [columnWidths.select, columns]);

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
      case 'PageDown': {
        e.preventDefault();
        const pageSize = Math.max(1, Math.floor(viewportHeight / ROW_HEIGHT) - 2);
        rowIndex = Math.min(maxRow, rowIndex + pageSize);
        break;
      }
      case 'PageUp': {
        e.preventDefault();
        const pageSize = Math.max(1, Math.floor(viewportHeight / ROW_HEIGHT) - 2);
        rowIndex = Math.max(0, rowIndex - pageSize);
        break;
      }
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          rowIndex = 0;
          colIndex = 1;
        } else {
          colIndex = 1;
        }
        break;
      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          rowIndex = maxRow;
          colIndex = maxCol;
        } else {
          colIndex = maxCol;
        }
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

    const container = containerRef.current;
    if (container) {
      // 1. Vertical Auto-Scroll
      const targetTop = rowIndex * ROW_HEIGHT;
      if (targetTop < container.scrollTop + 50) {
        container.scrollTop = Math.max(0, targetTop - 50);
      } else if (targetTop + ROW_HEIGHT > container.scrollTop + viewportHeight - 20) {
        container.scrollTop = targetTop + ROW_HEIGHT - viewportHeight + 40;
      }

      // 2. Horizontal Auto-Scroll (Keeps focused column in view).
      // The select and pinned columns are sticky, so they never need scrolling.
      const isStickyColumn = colIndex === 0 || (hasPinnedColumn && colIndex === 1);
      if (!isStickyColumn) {
        const precedingWidth = columns
          .slice(0, colIndex - 1)
          .reduce((sum, col) => sum + col.width, 0);
        const targetLeft = selectWidth + precedingWidth;
        const targetRight = targetLeft + (columns[colIndex - 1]?.width ?? 140);
        const stickyWidth = selectWidth + (hasPinnedColumn ? columns[0].width : 0);

        if (targetLeft < container.scrollLeft + stickyWidth) {
          container.scrollLeft = Math.max(0, targetLeft - stickyWidth);
        } else if (targetRight > container.scrollLeft + container.clientWidth) {
          container.scrollLeft = targetRight - container.clientWidth + 30;
        }
      }
    }
  };

  // Stable refs for window keydown delegation, refreshed after every commit
  const handleKeyDownRef = useRef(handleKeyDown);
  const activeDetailOrderRef = useRef(activeDetailOrder);

  useLayoutEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
    activeDetailOrderRef.current = activeDetailOrder;
  });

  useEffect(() => {
    // 1. Auto-focus grid on mount so arrow navigation works immediately without clicking
    containerRef.current?.focus();

    // 2. Window-level keyboard listener (operates globally unless focused in an input/select)
    const onWindowKeyDown = (e: KeyboardEvent) => {
      // If detail sheet is open, let sheet handle escape and ignore grid nav
      if (activeDetailOrderRef.current !== null) {
        return;
      }

      const activeEl = document.activeElement;
      const activeTag = (activeEl?.tagName || '').toLowerCase();

      // 1. If focus is inside a form input/textarea/select, never hijack any key
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      // 2. If focus is on an interactive element (button, link, custom role), Enter & Space belong to it!
      const isInteractive =
        activeTag === 'button' ||
        activeTag === 'a' ||
        activeEl?.getAttribute('role') === 'button' ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (isInteractive && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')) {
        return; // Allow native button/link activation without opening row details!
      }

      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'PageUp',
          'PageDown',
          'Home',
          'End',
          ' ',
          'Enter',
        ].includes(e.key)
      ) {
        // If focus is on an external interactive element, don't hijack arrow keys either
        if (isInteractive && !containerRef.current?.contains(activeEl)) {
          return;
        }

        handleKeyDownRef.current(e as unknown as React.KeyboardEvent);
      }
    };

    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, []);

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
        tabIndex={0}
        role="grid"
        aria-activedescendant={
          orders.length > 0 ? `cell-${focusedCell.rowIndex}-${focusedCell.colIndex}` : undefined
        }
        aria-rowcount={orders.length}
        aria-colcount={columns.length + 1}
        className="relative flex-1 overflow-auto focus:outline-none"
      >
        {/* Sticky Table Header */}
        <div
          role="row"
          aria-rowindex={1}
          className="sticky top-0 z-30 flex border-b border-slate-300 bg-slate-50 shadow-xs"
          style={{ width: totalGridWidth }}
        >
          {/* Select All Column Header */}
          <div
            role="columnheader"
            aria-colindex={1}
            className="sticky left-0 z-20 shrink-0 flex items-center justify-center border-r border-slate-200 px-3 py-2.5 bg-slate-50"
            style={{ width: selectWidth }}
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
                className={`shrink-0 relative flex flex-col justify-between border-r border-slate-200 p-2 text-xs font-semibold text-slate-700 bg-slate-50 transition-colors ${
                  isPinned ? 'sticky z-20 bg-slate-100 shadow-md border-r-2 border-r-slate-300' : ''
                }`}
                style={{ width: col.width, left: isPinned ? selectWidth : undefined }}
              >
                {/* Header Title + Actions */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <div
                    onClick={() => handleHeaderClick(col)}
                    className={`flex flex-1 items-center gap-1.5 cursor-pointer hover:text-slate-950 truncate pl-4 ${
                      col.align === 'right' ? 'justify-end text-right' : 'justify-center text-center'
                    }`}
                  >
                    <span className="truncate text-center">{col.header}</span>
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
                    className={`rounded p-1 hover:bg-slate-200 transition shrink-0 ${
                      isPinned ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  </button>
                </div>

                {/* Column Quick Filter Input / Dropdown */}
                {onColumnFilterChange && (
                  <div className="mt-1.5 flex items-center justify-center rounded border border-slate-300 bg-white px-1.5 py-0.5 shadow-2xs">
                    {columnEnumOptions[col.id] ? (
                      <select
                        value={columnFilters[col.id] || ''}
                        onChange={(e) => onColumnFilterChange(col.id, e.target.value)}
                        className="w-full bg-transparent text-[11px] text-slate-800 text-center focus:outline-none cursor-pointer truncate"
                      >
                        {columnEnumOptions[col.id]?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <Search className="h-2.5 w-2.5 text-slate-400 mr-1 shrink-0" />
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={columnFilters[col.id] || ''}
                          onChange={(e) => onColumnFilterChange(col.id, e.target.value)}
                          className="w-full bg-transparent text-[11px] text-slate-800 text-center placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    )}
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

        {/* Empty State */}
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
              width: totalGridWidth,
            }}
          >
            {/* Rendered Window with translateY */}
            <div
              style={{
                transform: `translateY(${startIndex * ROW_HEIGHT}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                width: totalGridWidth,
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
                    onClick={(e) => {
                      toggleRowSelection(order.id, actualIndex, e.shiftKey);
                      setFocusedCell((prev) => ({ ...prev, rowIndex: actualIndex }));
                      containerRef.current?.focus();
                    }}
                    onDoubleClick={() => setActiveDetailOrder(order)}
                    className={`flex items-center border-b border-slate-200 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-medium'
                        : actualIndex % 2 === 0
                        ? 'bg-white hover:bg-slate-100'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                    style={{ height: ROW_HEIGHT, width: totalGridWidth }}
                  >
                    {/* Checkbox Cell */}
                    <div
                      id={`cell-${actualIndex}-0`}
                      role="gridcell"
                      aria-colindex={1}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowSelection(order.id, actualIndex, e.shiftKey);
                        setFocusedCell({ rowIndex: actualIndex, colIndex: 0 });
                        containerRef.current?.focus();
                      }}
                      className={`sticky left-0 z-10 shrink-0 flex items-center justify-center border-r border-slate-200 px-3 h-full bg-inherit ${
                        isRowFocused && focusedCell.colIndex === 0
                          ? 'ring-2 ring-blue-600 ring-inset'
                          : ''
                      }`}
                      style={{ width: selectWidth }}
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
                          id={`cell-${actualIndex}-${cIndex + 1}`}
                          role="gridcell"
                          aria-colindex={cIndex + 2}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusedCell({ rowIndex: actualIndex, colIndex: cIndex + 1 });
                            containerRef.current?.focus();
                          }}
                          className={`shrink-0 flex items-center px-3 h-full border-r border-slate-200 truncate cursor-pointer transition-colors ${
                            col.align === 'right' ? 'justify-end text-right' : 'justify-center text-center'
                          } ${
                            isPinned
                              ? 'sticky z-10 shadow-md border-r-2 border-r-slate-300'
                              : ''
                          } ${
                            isCellFocused
                              ? 'ring-2 ring-blue-600 ring-inset bg-blue-100 text-blue-950 font-semibold'
                              : isPinned
                              ? 'bg-inherit'
                              : ''
                          }`}
                          style={{ width: col.width, left: isPinned ? selectWidth : undefined }}
                        >
                          {col.id === 'id' && (
                            <span className="font-mono text-slate-900 font-semibold text-center truncate">
                              {order.id}
                            </span>
                          )}

                          {col.id === 'customerName' && (
                            <span className="truncate text-slate-800 font-medium text-center" title={order.customerName}>
                              {order.customerName || 'Anonymous'}
                            </span>
                          )}

                          {col.id === 'customerEmail' && (
                            <span className="truncate font-mono text-[11px] text-slate-600 text-center" title={order.customerEmail}>
                              {order.customerEmail || '—'}
                            </span>
                          )}

                          {col.id === 'status' && (
                            <span
                              className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border text-center ${
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
                            <span className="font-mono font-medium text-slate-900 text-center">
                              {order.amountFormatted}
                            </span>
                          )}

                          {col.id === 'createdAt' && (
                            <span className="font-mono text-slate-600 text-[11px] text-center">
                              {order.createdAtFormatted}
                            </span>
                          )}

                          {col.id === 'updatedAt' && (
                            <span className="font-mono text-slate-500 text-[11px] text-center">
                              {order.updatedAtFormatted}
                            </span>
                          )}

                          {col.id === 'priority' && (
                            <span
                              className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[10px] font-semibold border text-center ${
                                order.priority === 1
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : order.priority === 2
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : order.priority === 3
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {order.priority !== null ? order.priority : 'None'}
                            </span>
                          )}

                          {col.id === 'paymentMethod' && (
                            <span className="inline-flex items-center justify-center rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase text-slate-700 text-center">
                              {order.paymentMethod}
                            </span>
                          )}

                          {col.id === 'itemCount' && (
                            <span className="font-mono text-slate-800 font-medium text-center">
                              {order.itemCount}
                            </span>
                          )}

                          {col.id === 'region' && (
                            <span className="font-mono text-slate-700 text-[11px] text-center">
                              {order.region}
                            </span>
                          )}

                          {col.id === 'channel' && (
                            <span className="text-slate-600 capitalize text-center">
                              {order.channel}
                            </span>
                          )}

                          {col.id === 'notes' && (
                            <span
                              className="truncate text-slate-600 text-[11px] text-center"
                              title={order.notes}
                            >
                              {order.notes || <span className="text-slate-300 italic">—</span>}
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
