import type { GridColumn } from '../types/grid';

// Grid columns in display order. Also used to check sort/pin values from the URL.
export const GRID_COLUMNS: Omit<GridColumn, 'width'>[] = [
  { id: 'id', header: 'Order ID', align: 'center' },
  { id: 'customerName', header: 'Customer', align: 'center' },
  { id: 'customerEmail', header: 'Customer Email', align: 'center' },
  { id: 'status', header: 'Status', align: 'center' },
  { id: 'amount', header: 'Amount', align: 'right' },
  { id: 'createdAt', header: 'Created At', align: 'center' },
  { id: 'updatedAt', header: 'Updated At', align: 'center' },
  { id: 'priority', header: 'Priority', align: 'center' },
  { id: 'paymentMethod', header: 'Payment Method', align: 'center' },
  { id: 'itemCount', header: 'Items', align: 'right' },
  { id: 'region', header: 'Region', align: 'center' },
  { id: 'channel', header: 'Channel', align: 'center' },
  { id: 'notes', header: 'Notes', align: 'center' },
];
