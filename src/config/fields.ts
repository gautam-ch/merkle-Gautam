import type { GridColumn } from '../types/grid';
import type { FieldConfig } from '../types/filter';
import type { NormalizedOrder } from '../types/order';

type FieldType = FieldConfig['type'];

interface FieldDef {
  id: keyof NormalizedOrder; // the grid column, and the key used for sorting and pinning
  header: string; // the column title
  type: FieldType;
  align: GridColumn['align'];
  width: number; // starting column width
  filterLabel?: string; // the name in the filter builder, when it differs from the header
  filterId?: keyof NormalizedOrder; // the value the filter builder matches on, when it differs from id
  emptyLast?: boolean; // empty values always sort last, whatever the direction
}

// Every field of an order, in grid order. The grid, the sort and the filter builder
// all read from this list, so a new field is added here and nowhere else.
// Widths are sized so about six columns fit on a 13-inch screen (1280px).
export const FIELDS: FieldDef[] = [
  { id: 'id', header: 'Order ID', type: 'text', align: 'center', width: 130 },
  { id: 'customerName', header: 'Customer', filterLabel: 'Customer Name', type: 'text', align: 'center', width: 155 },
  { id: 'customerEmail', header: 'Customer Email', type: 'text', align: 'center', width: 185 },
  { id: 'status', header: 'Status', type: 'enum', align: 'center', width: 120 },
  { id: 'amount', header: 'Amount', filterLabel: 'Amount (₹)', type: 'number', align: 'right', width: 125 },
  { id: 'createdAt', header: 'Created At', filterLabel: 'Created Date', type: 'date', align: 'center', width: 150 },
  { id: 'updatedAt', header: 'Updated At', filterLabel: 'Updated Date', type: 'date', align: 'center', width: 150, emptyLast: true },
  { id: 'priority', header: 'Priority', filterId: 'priorityLabel', type: 'enum', align: 'center', width: 105, emptyLast: true },
  { id: 'paymentMethod', header: 'Payment Method', type: 'enum', align: 'center', width: 125 },
  { id: 'itemCount', header: 'Items', filterLabel: 'Item Count', type: 'number', align: 'right', width: 80 },
  { id: 'region', header: 'Region', type: 'enum', align: 'center', width: 105 },
  { id: 'channel', header: 'Channel', type: 'enum', align: 'center', width: 100 },
  { id: 'notes', header: 'Notes', type: 'text', align: 'center', width: 220 },
];

export const GRID_COLUMNS: Omit<GridColumn, 'width'>[] = FIELDS.map(({ id, header, align }) => ({ id, header, align }));

export const DEFAULT_COLUMN_WIDTHS: Record<string, number> = Object.fromEntries(FIELDS.map((f) => [f.id, f.width]));

export const EMPTY_LAST_FIELDS = new Set(FIELDS.filter((f) => f.emptyLast).map((f) => f.id));

/** The ids of the fields of one type, as the filter builder names them. */
export const filterIdsOfType = (type: FieldType) =>
  new Set(FIELDS.filter((f) => f.type === type).map((f) => f.filterId ?? f.id));
