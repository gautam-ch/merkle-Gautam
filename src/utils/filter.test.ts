import { describe, expect, it } from 'vitest';
import { sampleOrder } from '../test/sampleOrder';
import type { FilterCondition, FilterState } from '../types/filter';
import { applyColumnFilters, applyFilter, evaluateCondition } from './filter';

// sampleOrder: Ananya Roy, status delivered, amount 1250.50, 3 items, created 2025-06-15 12:00 UTC
const matches = (field: FilterCondition['field'], operator: FilterCondition['operator'], value: FilterCondition['value']) =>
  evaluateCondition(sampleOrder, { id: 'c', field, operator, value });

describe('Matching one rule', () => {
  it('matches text ignoring upper and lower case', () => {
    expect(matches('customerName', 'contains', 'ananya')).toBe(true);
    expect(matches('customerName', 'equals', 'ANANYA ROY')).toBe(true);
    expect(matches('customerName', 'does_not_contain', 'Sharma')).toBe(true);
    expect(matches('notes', 'equals', 'Please call before delivery')).toBe(true);
    expect(matches('notes', 'equals', 'Please call')).toBe(false);
  });

  it('matches numbers', () => {
    expect(matches('amount', 'greater_than', 1000)).toBe(true);
    expect(matches('amount', 'less_than', 500)).toBe(false);
    expect(matches('amount', 'between', [1000, 1500])).toBe(true);
    expect(matches('itemCount', 'equals', 3)).toBe(true);
  });

  it('matches fixed-value fields', () => {
    expect(matches('status', 'in', ['shipped', 'delivered'])).toBe(true);
    expect(matches('status', 'not_in', ['cancelled', 'pending'])).toBe(true);
    expect(matches('priorityLabel', 'in', ['1', 'None'])).toBe(true);
  });

  it('ignores a rule with no value instead of treating it as 0', () => {
    expect(matches('amount', 'greater_than', '')).toBe(true);
    expect(matches('amount', 'less_than', '')).toBe(true);
    expect(matches('amount', 'equals', '')).toBe(true);
    expect(matches('amount', 'between', ['', ''])).toBe(true);
    expect(matches('status', 'in', [])).toBe(true);
    expect(matches('createdAt', 'before', '')).toBe(true);
    expect(matches('amount', 'less_than', 0)).toBe(false); // a typed 0 is a real value
  });

  it('treats an empty side of "between" as no limit', () => {
    expect(matches('amount', 'between', ['1000', ''])).toBe(true);
    expect(matches('amount', 'between', ['2000', ''])).toBe(false);
    expect(matches('amount', 'between', ['', '1300'])).toBe(true);
    expect(matches('amount', 'between', ['', '1000'])).toBe(false);
    expect(matches('amount', 'between', ['1250.5', '1250.5'])).toBe(true);
  });

  it('matches dates by whole days', () => {
    // between includes both end days, even when the order is later in the day
    expect(matches('createdAt', 'between', ['2025-06-15', '2025-06-15'])).toBe(true);
    expect(matches('createdAt', 'between', ['2025-06-16', '2025-06-20'])).toBe(false);
    expect(matches('createdAt', 'between', ['2025-06-01', ''])).toBe(true);
    // the picked day itself is neither before nor after
    expect(matches('createdAt', 'before', '2025-06-15')).toBe(false);
    expect(matches('createdAt', 'after', '2025-06-15')).toBe(false);
    expect(matches('createdAt', 'before', '2025-06-16')).toBe(true);
    expect(matches('createdAt', 'after', '2025-06-14')).toBe(true);
  });

  it('never matches a missing date once a date is chosen, but ignores an empty box', () => {
    const noUpdate = { ...sampleOrder, updatedAt: null };
    const rule = (value: string): FilterCondition => ({ id: 'c', field: 'updatedAt', operator: 'before', value });
    expect(evaluateCondition(noUpdate, rule('2030-01-01'))).toBe(false);
    expect(evaluateCondition(noUpdate, rule(''))).toBe(true);
  });
});

describe('Matching the whole filter', () => {
  const status = (id: string, ...values: string[]): FilterCondition => ({ id, field: 'status', operator: 'in', value: values });
  const channel = (value: string): FilterCondition => ({ id: 'ch', field: 'channel', operator: 'in', value: [value] });

  it('combines rules inside a group with OR and groups with AND', () => {
    // (status is shipped OR status is delivered) AND (channel is app)
    const filter = (channelValue: string): FilterState => ({
      groups: [
        { id: 'g1', conditions: [status('1', 'shipped'), status('2', 'delivered')] },
        { id: 'g2', conditions: [channel(channelValue)] },
      ],
    });
    expect(applyFilter([sampleOrder], filter('app'))).toHaveLength(1);
    expect(applyFilter([sampleOrder], filter('web'))).toHaveLength(0);
  });

  it('matches a group when only one of its rules matches', () => {
    // status is cancelled OR region is EAST: only the region matches
    const filter: FilterState = {
      groups: [{ id: 'g1', conditions: [status('1', 'cancelled'), { id: '2', field: 'region', operator: 'in', value: ['EAST'] }] }],
    };
    expect(applyFilter([sampleOrder], filter)).toHaveLength(1);
  });

  it('returns every order when there is nothing to filter on', () => {
    expect(applyFilter([sampleOrder], { groups: [] })).toHaveLength(1);
    expect(applyFilter([sampleOrder], { groups: [{ id: 'g1', conditions: [] }] })).toHaveLength(1);
  });
});

describe('Header quick filters', () => {
  it('search what the cell shows', () => {
    // Dates match the displayed DD/MM/YYYY HH:mm text, not the stored timestamp
    expect(applyColumnFilters([sampleOrder], { createdAt: '15/' })).toHaveLength(1);
    expect(applyColumnFilters([sampleOrder], { createdAt: '15/06/2025' })).toHaveLength(1);
    expect(applyColumnFilters([sampleOrder], { createdAt: '05/' })).toHaveLength(0);

    // Amount matches the plain number and the formatted rupee text
    expect(applyColumnFilters([sampleOrder], { amount: '1250.50' })).toHaveLength(1);
    expect(applyColumnFilters([sampleOrder], { amount: '1,250' })).toHaveLength(1);
  });

  it('match dropdown columns exactly and ignore empty boxes', () => {
    expect(applyColumnFilters([sampleOrder], { status: 'delivered', customerName: '  ' })).toHaveLength(1);
    expect(applyColumnFilters([sampleOrder], { status: 'deliver' })).toHaveLength(0);
    expect(applyColumnFilters([sampleOrder], { priority: 'none' })).toHaveLength(0);
    expect(applyColumnFilters([sampleOrder], { priority: '1' })).toHaveLength(1);
  });
});
