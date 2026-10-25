import { describe, expect, it } from 'vitest';
import type { NormalizedOrder } from '../types/order';
import { nextSort, sortOrders } from './sort';

describe('sortOrders utility', () => {
  const mockOrders: NormalizedOrder[] = [
    {
      id: 'ORD-002',
      schemaVersion: 2,
      customerName: 'Bhavna',
      customerEmail: 'bhavna@example.com',
      status: 'pending',
      amount: 450,
      amountFormatted: '₹450.00',
      currency: 'INR',
      createdAt: 1000,
      createdAtFormatted: '01/01/2025',
      updatedAt: 2000,
      updatedAtFormatted: '02/01/2025',
      region: 'WEST',
      channel: 'web',
      priority: 2,
      priorityLabel: '2',
      paymentMethod: 'upi',
      itemCount: 1,
      notes: '',
      fileIndex: 1,
    },
    {
      id: 'ORD-001',
      schemaVersion: 1,
      customerName: 'Aarav',
      customerEmail: 'aarav@example.com',
      status: 'delivered',
      amount: 1500,
      amountFormatted: '₹1,500.00',
      currency: 'INR',
      createdAt: 500,
      createdAtFormatted: '01/01/2024',
      updatedAt: null,
      updatedAtFormatted: '-',
      region: 'NORTH',
      channel: 'app',
      priority: null,
      priorityLabel: 'None',
      paymentMethod: 'card',
      itemCount: 3,
      notes: '',
      fileIndex: 0,
    },
    {
      id: 'ORD-003',
      schemaVersion: 2,
      customerName: 'Chirag',
      customerEmail: 'chirag@example.com',
      status: 'processing',
      amount: 100,
      amountFormatted: '₹100.00',
      currency: 'INR',
      createdAt: 1500,
      createdAtFormatted: '01/01/2026',
      updatedAt: 1000,
      updatedAtFormatted: '01/01/2025',
      region: 'SOUTH',
      channel: 'store',
      priority: 1,
      priorityLabel: '1',
      paymentMethod: 'cod',
      itemCount: 2,
      notes: '',
      fileIndex: 2,
    },
  ];

  it('sorts strings alphabetically ascending and descending', () => {
    const asc = sortOrders(mockOrders, { field: 'customerName', direction: 'asc' });
    expect(asc.map((o) => o.customerName)).toEqual(['Aarav', 'Bhavna', 'Chirag']);

    const desc = sortOrders(mockOrders, { field: 'customerName', direction: 'desc' });
    expect(desc.map((o) => o.customerName)).toEqual(['Chirag', 'Bhavna', 'Aarav']);
  });

  it('sorts numbers numerically ascending and descending', () => {
    const asc = sortOrders(mockOrders, { field: 'amount', direction: 'asc' });
    expect(asc.map((o) => o.amount)).toEqual([100, 450, 1500]);

    const desc = sortOrders(mockOrders, { field: 'amount', direction: 'desc' });
    expect(desc.map((o) => o.amount)).toEqual([1500, 450, 100]);
  });

  it('places null updatedAt records at the bottom regardless of sort direction', () => {
    const asc = sortOrders(mockOrders, { field: 'updatedAt', direction: 'asc' });
    expect(asc[2].updatedAt).toBeNull();

    const desc = sortOrders(mockOrders, { field: 'updatedAt', direction: 'desc' });
    expect(desc[2].updatedAt).toBeNull();
  });

  it('places missing priority (None) at the bottom regardless of sort direction', () => {
    const asc = sortOrders(mockOrders, { field: 'priority', direction: 'asc' });
    expect(asc.map((o) => o.priority)).toEqual([1, 2, null]);

    const desc = sortOrders(mockOrders, { field: 'priority', direction: 'desc' });
    expect(desc.map((o) => o.priority)).toEqual([2, 1, null]);
  });

  it('cycles ascending, descending, unsorted when a header is clicked', () => {
    const none = { field: null, direction: null } as const;
    const asc = nextSort(none, 'amount');
    expect(asc).toEqual({ field: 'amount', direction: 'asc' });
    const desc = nextSort(asc, 'amount');
    expect(desc).toEqual({ field: 'amount', direction: 'desc' });
    expect(nextSort(desc, 'amount')).toEqual(none);
    expect(nextSort(desc, 'status')).toEqual({ field: 'status', direction: 'asc' });
  });
});
