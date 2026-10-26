import { useState } from 'react';
import type { NormalizedOrder } from '../../types/order';
import { addRange, toggleId } from '../../utils/rowSelection';

/**
 * Click, Shift+click and select-all behaviour for the grid rows.
 * Shift+click selects from the last clicked row to this one (if a filter hid that row, it acts as a plain click).
 */
export function useRowSelection(
  orders: NormalizedOrder[],
  selectedIds: Set<string>,
  onSelectionChange: (ids: Set<string>) => void
) {
  // The anchor is an order, not a row position, so it survives sorting and filtering
  const [anchorId, setAnchorId] = useState<string | null>(null);

  const selectRow = (rowIndex: number, shiftKey: boolean) => {
    const order = orders[rowIndex];
    if (!order) return;

    const anchorIndex = shiftKey && anchorId !== null ? orders.findIndex((o) => o.id === anchorId) : -1;

    if (anchorIndex !== -1) {
      onSelectionChange(addRange(selectedIds, orders, anchorIndex, rowIndex));
    } else {
      onSelectionChange(toggleId(selectedIds, order.id));
      setAnchorId(order.id);
    }
  };

  const isAllSelected = orders.length > 0 && selectedIds.size === orders.length;

  const toggleAll = () => {
    onSelectionChange(isAllSelected ? new Set() : new Set(orders.map((order) => order.id)));
  };

  return { selectRow, toggleAll, isAllSelected };
}
