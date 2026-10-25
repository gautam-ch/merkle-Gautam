import { describe, expect, it } from 'vitest';
import type { NormalizedOrder } from '../types/order';
import { addRange, toggleId } from './rowSelection';

const orders = ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id }) as NormalizedOrder);

describe('Row selection', () => {
  it('toggles a single row without changing the original set', () => {
    const empty = new Set<string>();
    const one = toggleId(empty, 'A');
    expect([...one]).toEqual(['A']);
    expect(empty.size).toBe(0);
    expect(toggleId(one, 'A').size).toBe(0);
  });

  it('adds a range in either direction and keeps what was selected', () => {
    expect([...addRange(new Set(['E']), orders, 1, 3)].sort()).toEqual(['B', 'C', 'D', 'E']);
    expect([...addRange(new Set(), orders, 3, 1)].sort()).toEqual(['B', 'C', 'D']);
  });

  it('skips positions that no longer exist', () => {
    expect([...addRange(new Set(), orders, 3, 9)].sort()).toEqual(['D', 'E']);
  });
});
