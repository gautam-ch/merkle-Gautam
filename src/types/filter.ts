import type { NormalizedOrder } from './order';

type TextOperator = 'contains' | 'does_not_contain' | 'equals';
type NumberOperator = 'equals' | 'greater_than' | 'less_than' | 'between';
type DateOperator = 'before' | 'after' | 'between';
type EnumOperator = 'in' | 'not_in';

export type FilterOperator = TextOperator | NumberOperator | DateOperator | EnumOperator;

export interface FilterCondition {
  id: string;
  field: keyof NormalizedOrder;
  operator: FilterOperator;
  value: string | number | [number, number] | string[] | [string, string];
}

// Conditions inside a group are combined with OR; groups are combined with AND.
export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
}

export interface FilterState {
  groups: FilterGroup[];
}

export interface FieldConfig {
  id: keyof NormalizedOrder;
  label: string;
  type: 'text' | 'number' | 'date' | 'enum';
  operators: { label: string; value: FilterOperator }[];
  options?: string[]; // for enum fields
}
