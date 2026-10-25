import type { FilterState } from '../types/filter';
import { FIELD_CONFIGS } from './filterFields';

/** Encodes a filter as text that is safe to put in a URL. */
export function serializeFilter(filter: FilterState): string {
  return btoa(encodeURIComponent(JSON.stringify(filter)));
}

/**
 * Decodes a filter from the URL. Returns null if it can't be decoded or
 * doesn't have the expected shape, so a bad link can never crash the app.
 */
export function deserializeFilter(encoded: string | null): FilterState | null {
  if (!encoded) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(atob(encoded)));
    return isValidFilterState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isPrimitive = (value: unknown) => typeof value === 'string' || typeof value === 'number';

// The field and operator must be ones the builder offers. Values only need to be
// text, numbers or a list of them: while switching operators the builder can hold
// a single value for "between", and matching copes with that.
function isValidCondition(value: unknown): boolean {
  if (!isRecord(value) || typeof value.id !== 'string') return false;
  const field = FIELD_CONFIGS.find((f) => f.id === value.field);
  if (!field || !field.operators.some((op) => op.value === value.operator)) return false;
  return Array.isArray(value.value) ? value.value.every(isPrimitive) : isPrimitive(value.value);
}

function isValidFilterState(value: unknown): value is FilterState {
  if (!isRecord(value) || !Array.isArray(value.groups)) return false;
  return value.groups.every(
    (group) =>
      isRecord(group) &&
      typeof group.id === 'string' &&
      Array.isArray(group.conditions) &&
      group.conditions.every(isValidCondition)
  );
}
