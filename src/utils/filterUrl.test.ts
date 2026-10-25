import { describe, expect, it } from 'vitest';
import type { FilterState } from '../types/filter';
import { deserializeFilter, serializeFilter } from './filterUrl';

const encodeRaw = (value: unknown) => btoa(encodeURIComponent(JSON.stringify(value)));

describe('Filter in the URL', () => {
  it('reads back exactly what it writes', () => {
    const filter: FilterState = {
      groups: [{ id: 'g1', conditions: [{ id: 'c1', field: 'status', operator: 'in', value: ['pending'] }] }],
    };
    expect(deserializeFilter(serializeFilter(filter))).toEqual(filter);
  });

  it('returns null for nothing, junk, or the wrong shape', () => {
    expect(deserializeFilter(null)).toBeNull();
    expect(deserializeFilter('invalid-base-64-junk')).toBeNull();
    expect(deserializeFilter(encodeRaw({ groups: [{}] }))).toBeNull();
    expect(deserializeFilter(encodeRaw({ groups: [{ id: 'g', conditions: 'x' }] }))).toBeNull();
  });

  it('returns null for a field or operator the builder does not offer', () => {
    const condition = (field: string, operator: string) => ({
      groups: [{ id: 'g', conditions: [{ id: 'c', field, operator, value: 'x' }] }],
    });
    expect(deserializeFilter(encodeRaw(condition('password', 'equals')))).toBeNull();
    expect(deserializeFilter(encodeRaw(condition('amount', 'contains')))).toBeNull();
  });
});
