import { describe, expect, it } from 'vitest';
import type { FilterCondition, FilterState } from '../types/filter';
import {
  addCondition,
  addGroup,
  countActiveConditions,
  isConditionEmpty,
  removeCondition,
  removeGroup,
  updateCondition,
} from './filterEdit';
import { getFieldConfigs } from './filterFields';

const fields = getFieldConfigs();
const rule = (id: string, overrides: Partial<FilterCondition> = {}): FilterCondition => ({
  id,
  field: 'status',
  operator: 'in',
  value: ['shipped'],
  ...overrides,
});

describe('Editing the filter', () => {
  it('adds an empty rule to the first group, a chosen group, or a new group', () => {
    const twoGroups: FilterState = { groups: [{ id: 'g1', conditions: [rule('a')] }, { id: 'g2', conditions: [rule('b')] }] };

    expect(addCondition(twoGroups).groups[0].conditions).toHaveLength(2);
    expect(addCondition(twoGroups, 'g2').groups[1].conditions).toHaveLength(2);

    const fromNothing = addCondition({ groups: [] });
    expect(fromNothing.groups).toHaveLength(1);
    expect(fromNothing.groups[0].conditions[0].value).toEqual([]); // nothing ticked, hides no rows
  });

  it('adds and removes groups', () => {
    const one: FilterState = { groups: [{ id: 'g1', conditions: [rule('a')] }] };
    const two = addGroup(one);
    expect(two.groups).toHaveLength(2);
    expect(removeGroup(two, two.groups[1].id).groups).toEqual(one.groups);
  });

  it('removes a condition and drops groups left empty', () => {
    const filter: FilterState = {
      groups: [
        { id: 'g1', conditions: [rule('a'), rule('b')] },
        { id: 'g2', conditions: [rule('c')] },
      ],
    };

    expect(removeCondition(filter, 'g1', 'a').groups[0].conditions.map((c) => c.id)).toEqual(['b']);
    expect(removeCondition(filter, 'g2', 'c').groups.map((g) => g.id)).toEqual(['g1']);

    // the only group stays even when empty
    const single: FilterState = { groups: [{ id: 'g1', conditions: [rule('a')] }] };
    expect(removeCondition(single, 'g1', 'a').groups).toEqual([{ id: 'g1', conditions: [] }]);
  });

  it('starts a rule fresh when its field changes', () => {
    const filter: FilterState = { groups: [{ id: 'g1', conditions: [rule('a')] }] };
    const [changed] = updateCondition(filter, 'g1', 'a', { field: 'amount' }, fields).groups[0].conditions;
    expect(changed).toMatchObject({ field: 'amount', operator: 'equals', value: '' });
  });

  it('resets the value when switching to or from "between", and keeps it otherwise', () => {
    const greaterThan = rule('a', { field: 'amount', operator: 'greater_than', value: 500 });
    const filter: FilterState = { groups: [{ id: 'g1', conditions: [greaterThan] }] };

    const [between] = updateCondition(filter, 'g1', 'a', { operator: 'between' }, fields).groups[0].conditions;
    expect(between.value).toEqual(['', '']);

    const [lessThan] = updateCondition(filter, 'g1', 'a', { operator: 'less_than' }, fields).groups[0].conditions;
    expect(lessThan.value).toBe(500);
  });

  it('knows when a rule has no value yet', () => {
    const withValue = (value: FilterCondition['value']) => rule('c', { field: 'amount', operator: 'equals', value });
    expect(isConditionEmpty(withValue(''))).toBe(true);
    expect(isConditionEmpty(withValue([]))).toBe(true);
    expect(isConditionEmpty(withValue(['', '']))).toBe(true);
    expect(isConditionEmpty(withValue(0))).toBe(false);
    expect(isConditionEmpty(withValue(['1', '']))).toBe(false);
  });

  it('counts only rules that have a value', () => {
    const filter: FilterState = {
      groups: [{ id: 'g1', conditions: [rule('a'), rule('b', { value: [] }), rule('c', { field: 'amount', operator: 'greater_than', value: '' })] }],
    };
    expect(countActiveConditions(filter)).toBe(1);
  });
});
