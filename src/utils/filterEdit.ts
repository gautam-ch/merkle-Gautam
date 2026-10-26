import type { FieldConfig, FilterCondition, FilterGroup, FilterState } from '../types/filter';

const newId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// A new rule starts empty (nothing ticked), so adding it doesn't hide any rows yet
const newCondition = (): FilterCondition => ({ id: newId('cond'), field: 'status', operator: 'in', value: [] });
const newGroup = (): FilterGroup => ({ id: newId('grp'), conditions: [newCondition()] });

/**
 * True when a rule has no value yet (empty box or nothing ticked). Such a rule
 * matches everything, so it gets no chip and isn't counted.
 */
export function isConditionEmpty({ value }: FilterCondition): boolean {
  if (Array.isArray(value)) return value.every((v) => v === '');
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}

/** How many conditions in the filter have a value. */
export function countActiveConditions(filter: FilterState): number {
  return filter.groups.reduce((sum, group) => sum + group.conditions.filter((c) => !isConditionEmpty(c)).length, 0);
}

/** The starting value for a rule of this field type and operator. */
function defaultConditionValue(type: FieldConfig['type'], operator: FilterCondition['operator']): FilterCondition['value'] {
  if (type === 'enum') return [];
  return operator === 'between' ? ['', ''] : '';
}

/** Adds a rule to the given group, or to the first group. Creates a group if there is none. */
export function addCondition(filter: FilterState, groupId?: string): FilterState {
  const targetId = groupId ?? filter.groups[0]?.id;
  if (!targetId) return { groups: [newGroup()] };

  return {
    groups: filter.groups.map((group) =>
      group.id === targetId ? { ...group, conditions: [...group.conditions, newCondition()] } : group
    ),
  };
}

export function addGroup(filter: FilterState): FilterState {
  return { groups: [...filter.groups, newGroup()] };
}

export function removeGroup(filter: FilterState, groupId: string): FilterState {
  return { groups: filter.groups.filter((group) => group.id !== groupId) };
}

/**
 * The filter without one condition. A group left with no conditions is
 * dropped, except the only group, which stays so the builder isn't empty.
 */
export function removeCondition(filter: FilterState, groupId: string, conditionId: string): FilterState {
  const groups = filter.groups.map((group) =>
    group.id === groupId ? { ...group, conditions: group.conditions.filter((c) => c.id !== conditionId) } : group
  );
  return { groups: groups.filter((group) => group.conditions.length > 0 || groups.length === 1) };
}

function applyUpdate(condition: FilterCondition, updates: Partial<FilterCondition>, fields: FieldConfig[]): FilterCondition {
  const typeOf = (id: FilterCondition['field']) => fields.find((f) => f.id === id)?.type ?? 'text';

  // A new field starts with its first operator and an empty value
  if (updates.field && updates.field !== condition.field) {
    const operator = fields.find((f) => f.id === updates.field)?.operators[0]?.value ?? 'contains';
    return { ...condition, field: updates.field, operator, value: defaultConditionValue(typeOf(updates.field), operator) };
  }

  // "between" takes two values and the other operators one, so start fresh when switching
  const { operator } = updates;
  if (operator && (operator === 'between') !== (condition.operator === 'between')) {
    return { ...condition, ...updates, value: defaultConditionValue(typeOf(condition.field), operator) };
  }

  return { ...condition, ...updates };
}

/** Changes the field, operator or value of one rule. */
export function updateCondition(
  filter: FilterState,
  groupId: string,
  conditionId: string,
  updates: Partial<FilterCondition>,
  fields: FieldConfig[]
): FilterState {
  return {
    groups: filter.groups.map((group) =>
      group.id !== groupId
        ? group
        : {
            ...group,
            conditions: group.conditions.map((c) => (c.id === conditionId ? applyUpdate(c, updates, fields) : c)),
          }
    ),
  };
}
