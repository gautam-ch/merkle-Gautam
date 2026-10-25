import { useMemo, useState } from 'react';
import type { NormalizedOrder } from '../types/order';
import { exportOrders } from '../utils/export';

const NOTICE_DURATION_MS = 4000;

/**
 * Exporting. With rows selected, only the selected rows that are still
 * visible after filtering are exported, so the count on screen always matches
 * the file. With nothing selected, every visible row is exported.
 */
export function useExport(visibleOrders: NormalizedOrder[], selectedIds: Set<string>) {
  const [notice, setNotice] = useState<string | null>(null);
  const hasSelection = selectedIds.size > 0;

  const selectedVisible = useMemo(
    () => (hasSelection ? visibleOrders.filter((order) => selectedIds.has(order.id)) : []),
    [hasSelection, visibleOrders, selectedIds]
  );
  const exportable = hasSelection ? selectedVisible : visibleOrders;

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
  };

  const exportAs = (format: 'csv' | 'json') => {
    if (exportable.length === 0) {
      showNotice(
        hasSelection ? 'No selected orders match the current filter to export.' : 'There are no orders to export.'
      );
      return;
    }
    const { count } = exportOrders(exportable, format);
    const kind = hasSelection ? 'selected' : 'matching';
    showNotice(`Exported ${count.toLocaleString()} ${kind} orders as ${format.toUpperCase()}`);
  };

  return {
    selectedVisibleCount: selectedVisible.length,
    exportCount: exportable.length,
    notice,
    dismissNotice: () => setNotice(null),
    exportAs,
  };
}
