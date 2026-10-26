import { z } from 'zod';
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
    const result = filterSchema.safeParse(parsed);
    return result.success ? (result.data as FilterState) : null;
  } catch {
    return null;
  }
}

const valueSchema = z.union([z.string(), z.number()]);

// The field and operator must be ones the builder offers. Values only need to be
// text, numbers or a list of them: while switching operators the builder can hold
// a single value for "between", and matching copes with that.
const conditionSchema = z
  .object({
    id: z.string(),
    field: z.string(),
    operator: z.string(),
    value: z.union([valueSchema, z.array(valueSchema)]),
  })
  .refine((condition) => {
    const field = FIELD_CONFIGS.find((f) => f.id === condition.field);
    return !!field && field.operators.some((op) => op.value === condition.operator);
  });

const filterSchema = z.object({
  groups: z.array(z.object({ id: z.string(), conditions: z.array(conditionSchema) })),
});
