import { describe, expect, it } from 'vitest';
import type { FilterCondition } from '../types/filter';
import { describeCondition } from './filterLabel';
import { getFieldConfigs } from './filterFields';

const fields = getFieldConfigs();
const describe_ = (condition: Omit<FilterCondition, 'id'>) => describeCondition({ id: 'c', ...condition }, fields);

describe('Chip text', () => {
  it('describes single values and lists', () => {
    expect(describe_({ field: 'amount', operator: 'greater_than', value: 5000 })).toBe('Amount (₹) greater than 5000');
    expect(describe_({ field: 'status', operator: 'in', value: ['shipped', 'delivered'] })).toBe(
      'Status is one of shipped, delivered'
    );
  });

  it('describes a range, showing an open side as an ellipsis', () => {
    expect(describe_({ field: 'itemCount', operator: 'between', value: ['5', '8'] })).toBe('Item Count between 5 - 8');
    expect(describe_({ field: 'itemCount', operator: 'between', value: ['5', ''] })).toBe('Item Count between 5 - …');
  });
});
