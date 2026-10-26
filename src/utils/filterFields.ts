import { FIELDS } from '../config/fields';
import type { FieldConfig } from '../types/filter';
import type { NormalizedOrder } from '../types/order';

interface EnumOptions {
  status: string[];
  region: string[];
  channel: string[];
  paymentMethod: string[];
  priorityLabel: string[];
}

// Used until the orders have loaded
export const DEFAULT_ENUM_OPTIONS: EnumOptions = {
  status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  region: ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTHEAST'],
  channel: ['web', 'app', 'phone', 'store'],
  paymentMethod: ['upi', 'card', 'netbanking', 'cod', 'wallet'],
  priorityLabel: ['1', '2', '3', 'None'],
};

const PRIORITY_ORDER = ['1', '2', '3', 'None'];
const byPriority = (a: string, b: string) => PRIORITY_ORDER.indexOf(a) - PRIORITY_ORDER.indexOf(b);

/**
 * The values that exist in the orders for each fixed-value field, so the
 * filter choices always match the data.
 */
export function extractEnumOptions(orders: NormalizedOrder[]): EnumOptions {
  const unique = (pick: (order: NormalizedOrder) => string, fallback: string[], compare?: (a: string, b: string) => number) => {
    const values = [...new Set(orders.map(pick).filter(Boolean))].sort(compare);
    return values.length > 0 ? values : fallback;
  };

  return {
    status: unique((o) => o.status, DEFAULT_ENUM_OPTIONS.status),
    region: unique((o) => o.region, DEFAULT_ENUM_OPTIONS.region),
    channel: unique((o) => o.channel, DEFAULT_ENUM_OPTIONS.channel),
    paymentMethod: unique((o) => o.paymentMethod, DEFAULT_ENUM_OPTIONS.paymentMethod),
    priorityLabel: unique((o) => o.priorityLabel, DEFAULT_ENUM_OPTIONS.priorityLabel, byPriority),
  };
}

const TEXT_OPERATORS: FieldConfig['operators'] = [
  { label: 'contains', value: 'contains' },
  { label: 'does not contain', value: 'does_not_contain' },
  { label: 'equals', value: 'equals' },
];

const NUMBER_OPERATORS: FieldConfig['operators'] = [
  { label: 'equals', value: 'equals' },
  { label: 'greater than', value: 'greater_than' },
  { label: 'less than', value: 'less_than' },
  { label: 'between', value: 'between' },
];

const DATE_OPERATORS: FieldConfig['operators'] = [
  { label: 'before', value: 'before' },
  { label: 'after', value: 'after' },
  { label: 'between', value: 'between' },
];

const ENUM_OPERATORS: FieldConfig['operators'] = [
  { label: 'is one of', value: 'in' },
  { label: 'is not one of', value: 'not_in' },
];

const OPERATORS: Record<FieldConfig['type'], FieldConfig['operators']> = {
  text: TEXT_OPERATORS,
  number: NUMBER_OPERATORS,
  date: DATE_OPERATORS,
  enum: ENUM_OPERATORS,
};

/**
 * Every field the filter builder offers, with its input type and operators.
 * Fixed-value fields get their options from the orders when given.
 */
export function getFieldConfigs(orders?: NormalizedOrder[]): FieldConfig[] {
  const options = orders && orders.length > 0 ? extractEnumOptions(orders) : DEFAULT_ENUM_OPTIONS;

  return FIELDS.map((field) => {
    const id = field.filterId ?? field.id;
    return {
      id,
      label: field.filterLabel ?? field.header,
      type: field.type,
      operators: OPERATORS[field.type],
      ...(field.type === 'enum' && { options: options[id as keyof EnumOptions] }),
    };
  });
}

// Field list before any orders are loaded; also what a URL filter is checked against
export const FIELD_CONFIGS: FieldConfig[] = getFieldConfigs();
