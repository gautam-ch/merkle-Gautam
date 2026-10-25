import type { NormalizedOrder } from '../types/order';

/**
 * Exports current orders to CSV or JSON format.
 * If limit is provided, caps export at limit; otherwise exports all targets.
 */
export function exportOrders(
  orders: NormalizedOrder[],
  format: 'csv' | 'json',
  limit?: number
): { count: number; truncated: boolean } {
  const exportData = limit ? orders.slice(0, limit) : orders;
  const truncated = limit ? orders.length > limit : false;

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

    // BOM so Excel on Windows reads the file as UTF-8 (₹, non-ASCII names)
    const csvContent = '﻿' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, 'orders_export.csv', 'text/csv;charset=utf-8;');
  }

  return { count: exportData.length, truncated };
}

/**
 * Quotes a text field for CSV. Values starting with a formula trigger
 * (=, +, -, @, tab, CR) get a leading ' so spreadsheets show them as text.
 */
export function escapeCsv(str: string | null | undefined): string {
  if (!str) return '""';
  let value = String(str);
  if (/^[=+\-@\t\r]/.test(value)) {
    value = `'${value}`;
  }
  return `"${value.replace(/"/g, '""')}"`;
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
