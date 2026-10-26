import { describe, expect, it } from 'vitest';
import { parseRawOrders } from './rawOrder';

const record = {
  id: 'ORD-0000001',
  schemaVersion: 2,
  customerName: 'Aarav Sharma',
  customerEmail: 'aarav@example.com',
  status: 'delivered',
  amount: '4599.5',
  currency: 'INR ',
  createdAt: '14/03/2025',
  region: 'north',
  channel: 'web',
  paymentMethod: 'upi',
  itemCount: 2,
};

describe('Reading raw records', () => {
  it('accepts the quirks in the data: text amounts, missing updatedAt, priority and notes', () => {
    const { orders, skipped } = parseRawOrders([record, { ...record, updatedAt: null, priority: null, notes: null }]);
    expect(orders).toHaveLength(2);
    expect(skipped).toBe(0);
  });

  it('accepts version 1 records with customer_name and a numeric date', () => {
    const v1 = { ...record, schemaVersion: 1, customerName: undefined, customer_name: 'Rohit', createdAt: 1741944600 };
    expect(parseRawOrders([v1]).skipped).toBe(0);
  });

  it('skips records that cannot be read and counts them', () => {
    const { orders, skipped } = parseRawOrders([record, { ...record, id: '' }, { ...record, schemaVersion: 3 }, null, 'x']);
    expect(orders).toHaveLength(1);
    expect(skipped).toBe(4);
  });
});
