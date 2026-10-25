import { describe, expect, it } from 'vitest';
import { serializeFilter } from './filterUrl';
import { isValidSelectionParam } from './selection';
import { defaultUrlState, parseUrlState, serializeUrlState } from './urlState';

const encodeRaw = (value: unknown) => btoa(encodeURIComponent(JSON.stringify(value)));

describe('Reading view state from the URL', () => {
  it('reads a valid link', () => {
    const filter = serializeFilter({
      groups: [
        {
          id: 'g1',
          conditions: [{ id: 'c1', field: 'status', operator: 'in', value: ['shipped'] }],
        },
      ],
    });
    const params = new URLSearchParams({ sort: 'amount', dir: 'desc', pin: 'notes', sel: '1-3', f: filter });
    const state = parseUrlState(`?${params}`);

    expect(state?.sort).toEqual({ field: 'amount', direction: 'desc' });
    expect(state?.pinnedColumn).toBe('notes');
    expect(state?.selectedIds.size).toBe(3);
    expect(state?.filter.groups[0].conditions[0].field).toBe('status');
  });

  it('reads an empty link as the default view', () => {
    const state = parseUrlState('');
    expect(state?.sort).toEqual({ field: null, direction: null });
    expect(state?.pinnedColumn).toBeNull();
    expect(state?.selectedIds.size).toBe(0);
    expect(state?.filter.groups).toEqual([]);
  });

  it('rejects unknown sort, direction and pin values', () => {
    expect(parseUrlState('?sort=hacker&dir=asc')).toBeNull();
    expect(parseUrlState('?sort=amount&dir=sideways')).toBeNull();
    expect(parseUrlState('?sort=amount')).toBeNull();
    expect(parseUrlState('?pin=nope')).toBeNull();
  });

  it('rejects unknown parameters such as typos', () => {
    expect(parseUrlState('?sel-1111111111111')).toBeNull();
    expect(parseUrlState('?srot=amount&dir=asc')).toBeNull();
  });

  it('rejects a filter that cannot be decoded', () => {
    expect(parseUrlState('?f=garbage')).toBeNull();
  });

  it('rejects a filter that decodes but has the wrong shape', () => {
    expect(parseUrlState(`?f=${encodeURIComponent(encodeRaw({ groups: [{}] }))}`)).toBeNull();
    expect(
      parseUrlState(`?f=${encodeURIComponent(encodeRaw({ groups: [{ id: 'g', combinator: 'OR', conditions: 'x' }] }))}`)
    ).toBeNull();
    const unknownField = {
      groups: [{ id: 'g', combinator: 'OR', conditions: [{ id: 'c', field: 'password', operator: 'equals', value: 'x' }] }],
    };
    expect(parseUrlState(`?f=${encodeURIComponent(encodeRaw(unknownField))}`)).toBeNull();
    const wrongOperator = {
      groups: [{ id: 'g', combinator: 'OR', conditions: [{ id: 'c', field: 'amount', operator: 'contains', value: '5' }] }],
    };
    expect(parseUrlState(`?f=${encodeURIComponent(encodeRaw(wrongOperator))}`)).toBeNull();
  });

  it('rejects badly formed selections', () => {
    expect(parseUrlState('?sel=abc,1-,--')).toBeNull();
  });
});

describe('Writing view state to the URL', () => {
  it('writes nothing for the default view', () => {
    expect(serializeUrlState(defaultUrlState())).toBe('');
  });

  it('reads back exactly what it writes, including header quick filters', () => {
    const state = {
      ...defaultUrlState(),
      sort: { field: 'customerName' as const, direction: 'asc' as const },
      pinnedColumn: 'notes' as const,
      selectedIds: new Set(['ORD-0000001', 'ORD-0000002', 'ORD-0000003', 'ORD-0000010']),
      filter: {
        groups: [{ id: 'g1', conditions: [{ id: 'c1', field: 'amount' as const, operator: 'greater_than' as const, value: 5000 }] }],
      },
      columnFilters: { createdAt: '05/2025', customerName: 'gupta' },
    };

    expect(parseUrlState(`?${serializeUrlState(state)}`)).toEqual(state);
  });

  it('rejects broken header quick filters', () => {
    expect(parseUrlState('?q=not-json')).toBeNull();
    expect(parseUrlState(`?q=${encodeURIComponent('["a"]')}`)).toBeNull();
    expect(parseUrlState(`?q=${encodeURIComponent('{"password":"x"}')}`)).toBeNull();
    expect(parseUrlState(`?q=${encodeURIComponent('{"createdAt":5}')}`)).toBeNull();
  });
});

describe('Selection format check', () => {
  it('accepts the formats the app writes', () => {
    expect(isValidSelectionParam('1-200')).toBe(true);
    expect(isValidSelectionParam('1-50,100-250,7')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isValidSelectionParam('abc')).toBe(false);
    expect(isValidSelectionParam('1-')).toBe(false);
    expect(isValidSelectionParam('1,,2')).toBe(false);
  });
});
