import { describe, expect, it } from 'vitest';
import type { FilterState } from '../types/filter';
import type { NormalizedOrder } from '../types/order';
import {
  applyFilter,
  DEFAULT_ENUM_OPTIONS,
  deserializeFilter,
  evaluateCondition,
  extractEnumOptions,
  getFieldConfigs,
  serializeFilter,
} from './filter';

describe('Filter Engine (Phase 5 AST & Evaluation)', () => {
  const sampleOrder: NormalizedOrder = {
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

  it('evaluates text condition case-insensitively', () => {
    expect(
      evaluateCondition(sampleOrder, {
        id: 'c1',
        field: 'customerName',
        operator: 'contains',
        value: 'ananya',
      })
    ).toBe(true);

    expect(
      evaluateCondition(sampleOrder, {
        id: 'c2',
        field: 'customerName',
        operator: 'equals',
        value: 'ANANYA ROY',
      })
    ).toBe(true);

    expect(
      evaluateCondition(sampleOrder, {
        id: 'c3',
        field: 'customerName',
        operator: 'does_not_contain',
        value: 'Sharma',
      })
    ).toBe(true);
  });

  it('evaluates numeric range and comparison accurately', () => {
    expect(
      evaluateCondition(sampleOrder, {
        id: 'c4',
        field: 'amount',
        operator: 'greater_than',
        value: 1000,
      })
    ).toBe(true);

    expect(
      evaluateCondition(sampleOrder, {
        id: 'c5',
        field: 'amount',
        operator: 'between',
        value: [1000, 1500],
      })
    ).toBe(true);

    expect(
      evaluateCondition(sampleOrder, {
        id: 'c6',
        field: 'amount',
        operator: 'less_than',
        value: 500,
      })
    ).toBe(false);
  });

  it('evaluates enum in and not_in conditions', () => {
    expect(
      evaluateCondition(sampleOrder, {
        id: 'c7',
        field: 'status',
        operator: 'in',
        value: ['shipped', 'delivered'],
      })
    ).toBe(true);

    expect(
      evaluateCondition(sampleOrder, {
        id: 'c8',
        field: 'status',
        operator: 'not_in',
        value: ['cancelled', 'pending'],
      })
    ).toBe(true);
  });

  it('handles compound nested groups with AND and OR logic', () => {
    const filterState: FilterState = {
      groups: [
        {
          id: 'g1',
          combinator: 'OR',
          conditions: [
            { id: '1', field: 'status', operator: 'in', value: ['shipped'] },
            { id: '2', field: 'status', operator: 'in', value: ['delivered'] },
          ],
        },
        {
          id: 'g2',
          combinator: 'AND',
          conditions: [
            { id: '3', field: 'channel', operator: 'in', value: ['app'] },
          ],
        },
      ],
    };

    const result = applyFilter([sampleOrder], filterState);
    expect(result).toHaveLength(1);

    // If channel requirement is changed to web, should filter out
    const filterStateFailing: FilterState = {
      groups: [
        {
          id: 'g1',
          combinator: 'OR',
          conditions: [
            { id: '1', field: 'status', operator: 'in', value: ['shipped'] },
            { id: '2', field: 'status', operator: 'in', value: ['delivered'] },
          ],
        },
        {
          id: 'g2',
          combinator: 'AND',
          conditions: [
            { id: '3', field: 'channel', operator: 'in', value: ['web'] },
          ],
        },
      ],
    };

    expect(applyFilter([sampleOrder], filterStateFailing)).toHaveLength(0);
  });

  it('safely serializes and deserializes filters, gracefully handling malformed URLs', () => {
    const state: FilterState = {
      groups: [
        {
          id: 'g1',
          combinator: 'AND',
          conditions: [{ id: 'c1', field: 'status', operator: 'in', value: ['pending'] }],
        },
      ],
    };

    const encoded = serializeFilter(state);
    expect(encoded).toBeTruthy();

    const decoded = deserializeFilter(encoded);
    expect(decoded).toEqual(state);

    // Bad/malformed inputs must return null without crashing
    expect(deserializeFilter('invalid-base-64-junk')).toBeNull();
    expect(deserializeFilter(null)).toBeNull();
  });

  it('extracts unique sorted enum options dynamically from orders data (Phase 4 requirement)', () => {
    const customOrders: NormalizedOrder[] = [
      {
        ...sampleOrder,
        id: 'O1',
        status: 'refunded' as NormalizedOrder['status'],
        channel: 'whatsapp' as NormalizedOrder['channel'],
        region: 'SOUTH',
        paymentMethod: 'wallet',
        priorityLabel: 'None',
      },
      {
        ...sampleOrder,
        id: 'O2',
        status: 'returned' as NormalizedOrder['status'],
        channel: 'app',
        region: 'NORTH',
        paymentMethod: 'upi',
        priorityLabel: '1',
      },
      {
        ...sampleOrder,
        id: 'O3',
        status: 'refunded' as NormalizedOrder['status'],
        channel: 'whatsapp' as NormalizedOrder['channel'],
        region: 'SOUTH',
        paymentMethod: 'upi',
        priorityLabel: '2',
      },
    ];

    const options = extractEnumOptions(customOrders);
    expect(options.status).toEqual(['refunded', 'returned']);
    expect(options.channel).toEqual(['app', 'whatsapp']);
    expect(options.region).toEqual(['NORTH', 'SOUTH']);
    expect(options.paymentMethod).toEqual(['upi', 'wallet']);
    expect(options.priorityLabel).toEqual(['1', '2', 'None']);
  });

  it('populates field configurations with dynamic enum options from dataset', () => {
    const customOrders: NormalizedOrder[] = [
      {
        ...sampleOrder,
        id: 'O1',
        status: 'exchange_requested' as NormalizedOrder['status'],
      },
    ];

    const configs = getFieldConfigs(customOrders);
    const statusConfig = configs.find((c) => c.id === 'status');
    expect(statusConfig?.options).toEqual(['exchange_requested']);
  });

  it('falls back to default enum options when order array is empty', () => {
    const configs = getFieldConfigs([]);
    const statusConfig = configs.find((c) => c.id === 'status');
    expect(statusConfig?.options).toEqual(DEFAULT_ENUM_OPTIONS.status);
  });
});
