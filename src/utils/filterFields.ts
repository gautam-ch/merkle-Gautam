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

/**
 * Every field the filter builder offers, with its input type and operators.
 * Fixed-value fields get their options from the orders when given.
 */
export function getFieldConfigs(orders?: NormalizedOrder[]): FieldConfig[] {
  const options = orders && orders.length > 0 ? extractEnumOptions(orders) : DEFAULT_ENUM_OPTIONS;

  return [
    { id: 'id', label: 'Order ID', type: 'text', operators: TEXT_OPERATORS },
    { id: 'customerName', label: 'Customer Name', type: 'text', operators: TEXT_OPERATORS },
    { id: 'customerEmail', label: 'Customer Email', type: 'text', operators: TEXT_OPERATORS },
    { id: 'status', label: 'Status', type: 'enum', operators: ENUM_OPERATORS, options: options.status },
    { id: 'amount', label: 'Amount (₹)', type: 'number', operators: NUMBER_OPERATORS },
    { id: 'createdAt', label: 'Created Date', type: 'date', operators: DATE_OPERATORS },
    { id: 'updatedAt', label: 'Updated Date', type: 'date', operators: DATE_OPERATORS },
    { id: 'region', label: 'Region', type: 'enum', operators: ENUM_OPERATORS, options: options.region },
    { id: 'channel', label: 'Channel', type: 'enum', operators: ENUM_OPERATORS, options: options.channel },
    { id: 'paymentMethod', label: 'Payment Method', type: 'enum', operators: ENUM_OPERATORS, options: options.paymentMethod },
    { id: 'priorityLabel', label: 'Priority', type: 'enum', operators: ENUM_OPERATORS, options: options.priorityLabel },
    { id: 'itemCount', label: 'Item Count', type: 'number', operators: NUMBER_OPERATORS },
    { id: 'notes', label: 'Notes', type: 'text', operators: TEXT_OPERATORS },
  ];
}

// Field list before any orders are loaded; also what a URL filter is checked against
export const FIELD_CONFIGS: FieldConfig[] = getFieldConfigs();
