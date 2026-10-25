import type { NormalizedOrder } from '../types/order';

/** Selects the row if it isn't selected, unselects it if it is. */
export function toggleId(selected: Set<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (!next.delete(id)) next.add(id);
  return next;
}

/** Adds every order between two row positions (either way round) to the selection. */
export function addRange(selected: Set<string>, orders: NormalizedOrder[], from: number, to: number): Set<string> {
  const next = new Set(selected);
  for (let i = Math.min(from, to); i <= Math.max(from, to); i++) {
    if (orders[i]) next.add(orders[i].id);
  }
  return next;
}
