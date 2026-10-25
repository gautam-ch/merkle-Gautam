
export interface RawOrder {
  id: string;
  schemaVersion: 1 | 2;
  customerName?: string;
  customer_name?: string;
  customerEmail: string;
  status: string;
  amount: number | string;
  currency: string;
  createdAt: string | number;
  updatedAt?: string | null;
  region: string;
  channel: string;
  priority?: number | null;
  paymentMethod: string;
  itemCount: number;
  notes?: string | null;
  [key: string]: unknown;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type OrderRegion = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'CENTRAL' | 'NORTHEAST';

export type OrderChannel = 'web' | 'app' | 'phone' | 'store';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';

export type PriorityLevel = 1 | 2 | 3 | null;

export interface NormalizedOrder {
  id: string;
  schemaVersion: 1 | 2;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  amount: number; // In Rupees (floats allowed)
  amountFormatted: string; // Indian format e.g. ₹1,23,456.50
  currency: string; // Trimmed e.g. "INR"
  createdAt: number; // Epoch milliseconds for fast sorting/filtering
  createdAtFormatted: string; // Unified date format DD/MM/YYYY HH:mm
  updatedAt: number | null; // Epoch milliseconds or null
  updatedAtFormatted: string; // Unified date format or "-"
  region: OrderRegion;
  channel: OrderChannel;
  priority: PriorityLevel; // 1, 2, 3 or null (None)
  priorityLabel: '1' | '2' | '3' | 'None'; // Same values the grid shows
  paymentMethod: PaymentMethod;
  itemCount: number;
  notes: string; // Plain text escaped, safe
  fileIndex: number; // Original position in file for deterministic deduplication
}
