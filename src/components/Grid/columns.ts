export const ROW_HEIGHT = 40;
export const SELECT_COLUMN_WIDTH = 48;
export const MIN_COLUMN_WIDTH = 70;

// Sized so about six columns fit on a 13-inch screen (1280px) without being cut off
export const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
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
};
