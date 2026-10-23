import type { NormalizedOrder } from '../types/order';

/**
 * Exports current orders to CSV or JSON format.
 * Capped at 200 rows per assignment decision.
 */
export function exportOrders(
  orders: NormalizedOrder[],
  format: 'csv' | 'json',
  limit: number = 200
): { count: number; truncated: boolean } {
  const exportData = orders.slice(0, limit);
  const truncated = orders.length > limit;

  if (format === 'json') {
    const jsonStr = JSON.stringify(exportData, null, 2);
    downloadFile(jsonStr, 'orders_export.json', 'application/json');
  } else {
    // Generate CSV
    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Status',
      'Amount (INR)',
      'Created At',
      'Updated At',
      'Region',
      'Channel',
      'Priority',
      'Payment Method',
      'Items',
      'Notes',
    ];

    const rows = exportData.map((o) => [
      escapeCsv(o.id),
      escapeCsv(o.customerName),
      escapeCsv(o.customerEmail),
      escapeCsv(o.status),
      o.amount.toFixed(2),
      escapeCsv(o.createdAtFormatted),
      escapeCsv(o.updatedAtFormatted),
      escapeCsv(o.region),
      escapeCsv(o.channel),
      escapeCsv(o.priorityLabel),
      escapeCsv(o.paymentMethod),
      o.itemCount,
      escapeCsv(o.notes),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, 'orders_export.csv', 'text/csv;charset=utf-8;');
  }

  return { count: exportData.length, truncated };
}

function escapeCsv(str: string | null | undefined): string {
  if (!str) return '""';
  const escaped = String(str).replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
