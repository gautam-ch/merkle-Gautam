import { describe, expect, it } from 'vitest';
import { sampleOrder } from '../test/sampleOrder';
import type { NormalizedOrder } from '../types/order';
import { DEFAULT_ENUM_OPTIONS, extractEnumOptions, getFieldConfigs } from './filterFields';

const order = (overrides: Partial<NormalizedOrder>): NormalizedOrder => ({ ...sampleOrder, ...overrides });

describe('Filter fields', () => {
  it('takes the fixed-value options from the orders, unique and sorted', () => {
    const options = extractEnumOptions([
      order({ status: 'refunded' as NormalizedOrder['status'], channel: 'app', region: 'SOUTH', paymentMethod: 'wallet', priorityLabel: 'None' }),
      order({ status: 'returned' as NormalizedOrder['status'], channel: 'app', region: 'NORTH', paymentMethod: 'upi', priorityLabel: '1' }),
      order({ status: 'refunded' as NormalizedOrder['status'], channel: 'web', region: 'SOUTH', paymentMethod: 'upi', priorityLabel: '2' }),
    ]);

    expect(options.status).toEqual(['refunded', 'returned']);
    expect(options.channel).toEqual(['app', 'web']);
    expect(options.region).toEqual(['NORTH', 'SOUTH']);
    expect(options.paymentMethod).toEqual(['upi', 'wallet']);
    expect(options.priorityLabel).toEqual(['1', '2', 'None']); // None always last
  });

  it('gives the status field the options found in the data', () => {
    const configs = getFieldConfigs([order({ status: 'exchange_requested' as NormalizedOrder['status'] })]);
    expect(configs.find((c) => c.id === 'status')?.options).toEqual(['exchange_requested']);
  });

  it('falls back to the default options when there are no orders', () => {
    const configs = getFieldConfigs([]);
    expect(configs.find((c) => c.id === 'status')?.options).toEqual(DEFAULT_ENUM_OPTIONS.status);
  });

  it('offers the operators the assignment asks for on each type', () => {
    const operators = (id: string) => getFieldConfigs().find((c) => c.id === id)?.operators.map((o) => o.value);
    expect(operators('customerName')).toEqual(['contains', 'does_not_contain', 'equals']);
    expect(operators('notes')).toEqual(['contains', 'does_not_contain', 'equals']);
    expect(operators('amount')).toEqual(['equals', 'greater_than', 'less_than', 'between']);
    expect(operators('createdAt')).toEqual(['before', 'after', 'between']);
    expect(operators('status')).toEqual(['in', 'not_in']);
  });
});
