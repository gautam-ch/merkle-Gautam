import type { FilterCondition, FilterGroup, FilterState } from '../types/filter';
import type { NormalizedOrder } from '../types/order';

type Operator = FilterCondition['operator'];
type Value = FilterCondition['value'];

const DAY_MS = 24 * 60 * 60 * 1000;
const NUMBER_FIELDS = new Set<keyof NormalizedOrder>(['amount', 'itemCount']);
const DATE_FIELDS = new Set<keyof NormalizedOrder>(['createdAt', 'updatedAt']);

// A number typed into a filter box; null when the box is empty or not a number
function toNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// Midnight (UTC) at the start of a "YYYY-MM-DD" date; null when the box is empty or invalid
function toDayStart(value: unknown): number | null {
  if (typeof value !== 'string' || value === '') return null;
  const time = Date.parse(value);
  return isNaN(time) ? null : time;
}

// The two boxes of a "between" rule; an empty box is null (no limit on that side)
function readRange<T>(value: Value, parse: (box: unknown) => T | null): [T | null, T | null] {
  return Array.isArray(value) && value.length === 2 ? [parse(value[0]), parse(value[1])] : [null, null];
}

function matchesText(raw: unknown, operator: Operator, value: Value): boolean {
  const search = String(value ?? '').toLowerCase().trim();
  if (!search) return true;

  const text = String(raw ?? '').toLowerCase();
  switch (operator) {
    case 'contains':
      return text.includes(search);
    case 'does_not_contain':
      return !text.includes(search);
    case 'equals':
      return text === search;
    default:
      return true;
  }
}

function matchesNumber(num: number, operator: Operator, value: Value): boolean {
  if (operator === 'between') {
    const [min, max] = readRange(value, toNumber); // an empty side means "no limit"
    return (min === null || num >= min) && (max === null || num <= max);
  }

  const target = toNumber(value);
  if (target === null) return true;
  switch (operator) {
    case 'equals':
      return num === target;
    case 'greater_than':
      return num > target;
    case 'less_than':
      return num < target;
    default:
      return true;
  }
}

// The date box has no time, so dates work on whole days (UTC): "before" means
// earlier days, "after" later days, and "between" includes both end days.
function matchesDate(timestamp: number | null, operator: Operator, value: Value): boolean {
  let from: number | null = null; // inclusive
  let until: number | null = null; // exclusive

  if (operator === 'between') {
    const [start, end] = readRange(value, toDayStart);
    from = start;
    until = end === null ? null : end + DAY_MS;
  } else if (operator === 'before') {
    until = toDayStart(value);
  } else if (operator === 'after') {
    const day = toDayStart(value);
    from = day === null ? null : day + DAY_MS;
  }

  if (from === null && until === null) return true;
  if (timestamp === null) return false; // no date never matches a date rule
  return (from === null || timestamp >= from) && (until === null || timestamp < until);
}

function matchesEnum(raw: unknown, operator: Operator, value: Value): boolean {
  const chosen = Array.isArray(value) ? value.map((v) => String(v).toLowerCase()) : [];
  if (chosen.length === 0) return true;

  const isChosen = chosen.includes(String(raw ?? '').toLowerCase());
  return operator === 'in' ? isChosen : !isChosen;
}

/** Whether one order matches one rule. A rule with no value yet matches everything. */
export function evaluateCondition(order: NormalizedOrder, { field, operator, value }: FilterCondition): boolean {
  const raw = order[field];

  if (operator === 'in' || operator === 'not_in') return matchesEnum(raw, operator, value);
  if (NUMBER_FIELDS.has(field)) return matchesNumber(Number(raw), operator, value);
  if (DATE_FIELDS.has(field)) return matchesDate(raw === null ? null : Number(raw), operator, value);
  return matchesText(raw, operator, value);
}

/** A group matches when any of its rules match (OR). */
function evaluateGroup(order: NormalizedOrder, group: FilterGroup): boolean {
  return group.conditions.length === 0 || group.conditions.some((rule) => evaluateCondition(order, rule));
}

/** The orders that match the filter: every group must match (AND). */
export function applyFilter(orders: NormalizedOrder[], filter: FilterState): NormalizedOrder[] {
  const activeGroups = filter.groups.filter((group) => group.conditions.length > 0);
  if (activeGroups.length === 0) return orders;

  return orders.filter((order) => activeGroups.every((group) => evaluateGroup(order, group)));
}

// Dropdown columns in the header: the picked value must match exactly
const EXACT_MATCH_COLUMNS = new Set(['status', 'channel', 'region', 'paymentMethod']);

// The text a header filter searches is what the cell shows. Amount also includes
// the plain number, so both "1250.50" and "1,250" work.
function columnText(order: NormalizedOrder, column: string): string {
  switch (column) {
    case 'createdAt':
      return order.createdAtFormatted;
    case 'updatedAt':
      return order.updatedAtFormatted;
    case 'amount':
      return `${order.amount.toFixed(2)} ${order.amountFormatted}`;
    default:
      return String((order as unknown as Record<string, unknown>)[column] ?? '');
  }
}

/** The orders that match the quick filters under the column headers. Every filled-in one must match. */
export function applyColumnFilters(orders: NormalizedOrder[], columnFilters: Record<string, string>): NormalizedOrder[] {
  const active = Object.entries(columnFilters)
    .map(([column, text]) => [column, text.trim().toLowerCase()] as const)
    .filter(([, text]) => text !== '');
  if (active.length === 0) return orders;

  return orders.filter((order) =>
    active.every(([column, search]) => {
      if (column === 'priority') {
        return search === 'none' ? order.priority === null : String(order.priority) === search;
      }
      const text = columnText(order, column).toLowerCase();
      return EXACT_MATCH_COLUMNS.has(column) ? text === search : text.includes(search);
    })
  );
}
