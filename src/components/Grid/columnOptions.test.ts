import { describe, expect, it } from 'vitest';
import type { NormalizedOrder } from '../../types/order';
import { getColumnDropdownOptions } from './columnOptions';

const order = (overrides: Partial<NormalizedOrder>) => ({ ...overrides }) as NormalizedOrder;

describe('Header dropdown options', () => {
  const options = getColumnDropdownOptions([
    order({ status: 'shipped', channel: 'web', region: 'NORTH', paymentMethod: 'upi', priorityLabel: '3' }),
    order({ status: 'delivered', channel: 'app', region: 'EAST', paymentMethod: 'card', priorityLabel: '1' }),
    order({ status: 'shipped', channel: 'web', region: 'NORTH', paymentMethod: 'upi', priorityLabel: 'None' }),
  ]);

  it('lists each value from the data once, after an "all" entry', () => {
    expect(options.status).toEqual([
      { label: 'All Statuses', value: '' },
      { label: 'Delivered', value: 'delivered' },
      { label: 'Shipped', value: 'shipped' },
    ]);
    expect(options.region?.map((o) => o.value)).toEqual(['', 'EAST', 'NORTH']);
  });

  it('formats payment methods readably', () => {
    expect(options.paymentMethod?.map((o) => o.label)).toEqual(['All Payments', 'Card', 'UPI']);
  });

  it('keeps priorities in order with None last', () => {
    expect(options.priority).toEqual([
      { label: 'All Priorities', value: '' },
      { label: '1 (Highest)', value: '1' },
      { label: '3 (Lowest)', value: '3' },
      { label: 'None', value: 'none' },
    ]);
  });
});
