import type { FieldConfig, FilterCondition, FilterGroup, FilterState } from '../types/filter';
import type { NormalizedOrder } from '../types/order';

export interface DynamicEnumOptions {
  status: string[];
  region: string[];
  channel: string[];
  paymentMethod: string[];
  priorityLabel: string[];
}

export const DEFAULT_ENUM_OPTIONS: DynamicEnumOptions = {
  status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  region: ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTHEAST'],
  channel: ['web', 'app', 'phone', 'store'],
  paymentMethod: ['upi', 'card', 'netbanking', 'cod', 'wallet'],
  priorityLabel: ['1', '2', '3', 'None'],
};

/**
 * Dynamically derives unique enum options from order dataset.
 * Guarantees enum filter choices reflect actual dataset values without drifting.
 */
export function extractEnumOptions(orders: NormalizedOrder[]): DynamicEnumOptions {
  const statusSet = new Set<string>();
  const regionSet = new Set<string>();
  const channelSet = new Set<string>();
  const paymentSet = new Set<string>();
  const prioritySet = new Set<string>();

  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    if (o.status) statusSet.add(String(o.status));
    if (o.region) regionSet.add(String(o.region));
    if (o.channel) channelSet.add(String(o.channel));
    if (o.paymentMethod) paymentSet.add(String(o.paymentMethod));
    if (o.priorityLabel) prioritySet.add(String(o.priorityLabel));
  }

  const priorityOrder: Record<string, number> = { '1': 1, '2': 2, '3': 3, None: 4 };

  return {
    status: statusSet.size > 0 ? Array.from(statusSet).sort() : DEFAULT_ENUM_OPTIONS.status,
    region: regionSet.size > 0 ? Array.from(regionSet).sort() : DEFAULT_ENUM_OPTIONS.region,
    channel: channelSet.size > 0 ? Array.from(channelSet).sort() : DEFAULT_ENUM_OPTIONS.channel,
    paymentMethod: paymentSet.size > 0 ? Array.from(paymentSet).sort() : DEFAULT_ENUM_OPTIONS.paymentMethod,
    priorityLabel: prioritySet.size > 0
      ? Array.from(prioritySet).sort((a, b) => (priorityOrder[a] ?? 99) - (priorityOrder[b] ?? 99) || a.localeCompare(b))
      : DEFAULT_ENUM_OPTIONS.priorityLabel,
  };
}

/**
 * Returns field configurations with dynamic enum options derived from orders.
 */
export function getFieldConfigs(orders?: NormalizedOrder[]): FieldConfig[] {
  const enumOptions = orders && orders.length > 0
    ? extractEnumOptions(orders)
    : DEFAULT_ENUM_OPTIONS;

  return [
    {
      id: 'id',
      label: 'Order ID',
      type: 'text',
      operators: [
        { label: 'contains', value: 'contains' },
        { label: 'does not contain', value: 'does_not_contain' },
        { label: 'equals', value: 'equals' },
      ],
    },
    {
      id: 'customerName',
      label: 'Customer Name',
      type: 'text',
      operators: [
        { label: 'contains', value: 'contains' },
        { label: 'does not contain', value: 'does_not_contain' },
        { label: 'equals', value: 'equals' },
      ],
    },
    {
      id: 'customerEmail',
      label: 'Customer Email',
      type: 'text',
      operators: [
        { label: 'contains', value: 'contains' },
        { label: 'does not contain', value: 'does_not_contain' },
        { label: 'equals', value: 'equals' },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'enum',
      operators: [
        { label: 'is one of', value: 'in' },
        { label: 'is not one of', value: 'not_in' },
      ],
      options: enumOptions.status,
    },
    {
      id: 'amount',
      label: 'Amount (₹)',
      type: 'number',
      operators: [
        { label: 'equals', value: 'equals' },
        { label: 'greater than', value: 'greater_than' },
        { label: 'less than', value: 'less_than' },
        { label: 'between', value: 'between' },
      ],
    },
    {
      id: 'createdAt',
      label: 'Created Date',
      type: 'date',
      operators: [
        { label: 'before', value: 'before' },
        { label: 'after', value: 'after' },
        { label: 'between', value: 'between' },
      ],
    },
    {
      id: 'updatedAt',
      label: 'Updated Date',
      type: 'date',
      operators: [
        { label: 'before', value: 'before' },
        { label: 'after', value: 'after' },
        { label: 'between', value: 'between' },
      ],
    },
    {
      id: 'region',
      label: 'Region',
      type: 'enum',
      operators: [
        { label: 'is one of', value: 'in' },
        { label: 'is not one of', value: 'not_in' },
      ],
      options: enumOptions.region,
    },
    {
      id: 'channel',
      label: 'Channel',
      type: 'enum',
      operators: [
        { label: 'is one of', value: 'in' },
        { label: 'is not one of', value: 'not_in' },
      ],
      options: enumOptions.channel,
    },
    {
      id: 'paymentMethod',
      label: 'Payment Method',
      type: 'enum',
      operators: [
        { label: 'is one of', value: 'in' },
        { label: 'is not one of', value: 'not_in' },
      ],
      options: enumOptions.paymentMethod,
    },
    {
      id: 'priorityLabel',
      label: 'Priority',
      type: 'enum',
      operators: [
        { label: 'is one of', value: 'in' },
        { label: 'is not one of', value: 'not_in' },
      ],
      options: enumOptions.priorityLabel,
    },
    {
      id: 'itemCount',
      label: 'Item Count',
      type: 'number',
      operators: [
        { label: 'equals', value: 'equals' },
        { label: 'greater than', value: 'greater_than' },
        { label: 'less than', value: 'less_than' },
        { label: 'between', value: 'between' },
      ],
    },
    {
      id: 'notes',
      label: 'Notes',
      type: 'text',
      operators: [
        { label: 'contains', value: 'contains' },
        { label: 'does not contain', value: 'does_not_contain' },
      ],
    },
  ];
}

export const FIELD_CONFIGS: FieldConfig[] = getFieldConfigs();

/**
 * Evaluates a single filter condition against a record.
 * Handles null-safety and case-insensitivity.
 */
export function evaluateCondition(order: NormalizedOrder, condition: FilterCondition): boolean {
  const { field, operator, value } = condition;
  const rawVal = order[field];

  // Text operators
  if (operator === 'contains' || operator === 'does_not_contain' || operator === 'equals') {
    if (typeof rawVal === 'number' && (field === 'amount' || field === 'itemCount')) {
      const targetNum = Number(value);
      if (isNaN(targetNum)) return true;
      return operator === 'equals' ? rawVal === targetNum : true;
    }

    const strVal = String(rawVal ?? '').toLowerCase();
    const searchStr = String(value ?? '').toLowerCase().trim();
    if (!searchStr) return true; // empty filter is neutral

    if (operator === 'contains') {
      return strVal.includes(searchStr);
    }
    if (operator === 'does_not_contain') {
      return !strVal.includes(searchStr);
    }
    if (operator === 'equals') {
      return strVal === searchStr;
    }
  }

  // Number operators
  if (
    operator === 'greater_than' ||
    operator === 'less_than' ||
    (operator === 'between' && (field === 'amount' || field === 'itemCount'))
  ) {
    if (rawVal === null || rawVal === undefined) return false;
    const num = Number(rawVal);
    if (isNaN(num)) return false;

    if (operator === 'greater_than') {
      const target = Number(value);
      return !isNaN(target) ? num > target : true;
    }
    if (operator === 'less_than') {
      const target = Number(value);
      return !isNaN(target) ? num < target : true;
    }
    if (operator === 'between') {
      if (Array.isArray(value) && value.length === 2) {
        const min = Number(value[0]);
        const max = Number(value[1]);
        if (!isNaN(min) && !isNaN(max)) {
          return num >= min && num <= max;
        }
      }
      return true;
    }
  }

  // Date operators
  if (
    operator === 'before' ||
    operator === 'after' ||
    (operator === 'between' && (field === 'createdAt' || field === 'updatedAt'))
  ) {
    if (rawVal === null || rawVal === undefined) return false;
    const timestamp = Number(rawVal);
    if (isNaN(timestamp)) return false;

    if (operator === 'before') {
      const targetDate = typeof value === 'string' ? Date.parse(value) : Number(value);
      return !isNaN(targetDate) ? timestamp < targetDate : true;
    }
    if (operator === 'after') {
      const targetDate = typeof value === 'string' ? Date.parse(value) : Number(value);
      return !isNaN(targetDate) ? timestamp > targetDate : true;
    }
    if (operator === 'between') {
      if (Array.isArray(value) && value.length === 2) {
        const start = typeof value[0] === 'string' ? Date.parse(String(value[0])) : Number(value[0]);
        const end = typeof value[1] === 'string' ? Date.parse(String(value[1])) : Number(value[1]);
        if (!isNaN(start) && !isNaN(end)) {
          return timestamp >= start && timestamp <= end;
        }
      }
      return true;
    }
  }

  // Enum operators
  if (operator === 'in' || operator === 'not_in') {
    const list = Array.isArray(value) ? value.map((v) => String(v).toLowerCase()) : [];
    if (list.length === 0) return true; // empty selection matches all

    const current = String(rawVal ?? '').toLowerCase();
    const hasMatch = list.includes(current);

    return operator === 'in' ? hasMatch : !hasMatch;
  }

  return true;
}

/**
 * Evaluates a condition group against a record.
 */
export function evaluateGroup(order: NormalizedOrder, group: FilterGroup): boolean {
  if (!group.conditions || group.conditions.length === 0) {
    return true;
  }

  if (group.combinator === 'OR') {
    return group.conditions.some((cond) => evaluateCondition(order, cond));
  } else {
    return group.conditions.every((cond) => evaluateCondition(order, cond));
  }
}

/**
 * Applies compound filter state to an array of orders.
 * Top-level groups are combined with AND.
 */
export function applyFilter(orders: NormalizedOrder[], filterState: FilterState): NormalizedOrder[] {
  if (!filterState.groups || filterState.groups.length === 0) {
    return orders;
  }

  // Filter out completely empty groups
  const activeGroups = filterState.groups.filter((g) => g.conditions.length > 0);
  if (activeGroups.length === 0) {
    return orders;
  }

  return orders.filter((order) => {
    return activeGroups.every((group) => evaluateGroup(order, group));
  });
}

/**
 * Safe Base64 serialization for URL params.
 */
export function serializeFilter(state: FilterState): string {
  try {
    const json = JSON.stringify(state);
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

/**
 * Safe deserialization with try/catch fallback (Rule 6.6: never crash on bad URL).
 */
export function deserializeFilter(encoded: string | null): FilterState | null {
  if (!encoded) return null;
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    if (parsed && Array.isArray(parsed.groups)) {
      return parsed as FilterState;
    }
    return null;
  } catch {
    return null;
  }
}
