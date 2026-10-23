import type { NormalizedOrder } from './order';

export type TextOperator = 'contains' | 'does_not_contain' | 'equals';
export type NumberOperator = 'equals' | 'greater_than' | 'less_than' | 'between';
export type DateOperator = 'before' | 'after' | 'between';
export type EnumOperator = 'in' | 'not_in';

export type FilterOperator = TextOperator | NumberOperator | DateOperator | EnumOperator;

export interface FilterCondition {
  id: string;
  field: keyof NormalizedOrder;
  operator: FilterOperator;
  value: string | number | [number, number] | string[] | [string, string];
}

export interface FilterGroup {
  id: string;
  combinator: 'AND' | 'OR';
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
