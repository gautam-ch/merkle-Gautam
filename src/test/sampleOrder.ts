import type { NormalizedOrder } from '../types/order';

// One realistic order shared by the tests: amount 1250.50, created 2025-06-15 12:00 UTC
export const sampleOrder: NormalizedOrder = {
  id: 'ORD-000100',
  schemaVersion: 2,
  customerName: 'Ananya Roy',
  customerEmail: 'ananya@example.com',
  status: 'delivered',
  amount: 1250.5,
  amountFormatted: '₹1,250.50',
  currency: 'INR',
  createdAt: Date.parse('2025-06-15T12:00:00Z'),
  createdAtFormatted: '15/06/2025 12:00',
  updatedAt: Date.parse('2025-06-20T12:00:00Z'),
  updatedAtFormatted: '20/06/2025 12:00',
  region: 'EAST',
  channel: 'app',
  priority: 1,
  priorityLabel: '1',
  paymentMethod: 'upi',
  itemCount: 3,
  notes: 'Please call before delivery',
  fileIndex: 0,
};
