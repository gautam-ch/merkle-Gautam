import { useState } from 'react';
import type { NormalizedOrder } from '../../types/order';
import { addRange, toggleId } from '../../utils/rowSelection';

/**
 * Click, Shift+click and select-all behaviour for the grid rows.
 * Shift+click selects from the last clicked row to this one.
 */
export function useRowSelection(
  orders: NormalizedOrder[],
  selectedIds: Set<string>,
  onSelectionChange: (ids: Set<string>) => void
) {
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);

  const selectRow = (rowIndex: number, shiftKey: boolean) => {
    const order = orders[rowIndex];
    if (!order) return;

    if (shiftKey && anchorIndex !== null) {
      onSelectionChange(addRange(selectedIds, orders, anchorIndex, rowIndex));
    } else {
      onSelectionChange(toggleId(selectedIds, order.id));
      setAnchorIndex(rowIndex);
    }
  };

  const isAllSelected = orders.length > 0 && selectedIds.size === orders.length;

  const toggleAll = () => {
    onSelectionChange(isAllSelected ? new Set() : new Set(orders.map((order) => order.id)));
  };

  return { selectRow, toggleAll, isAllSelected };
}
