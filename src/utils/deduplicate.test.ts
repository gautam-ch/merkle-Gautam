import { describe, expect, it } from 'vitest';
import { sampleOrder } from '../test/sampleOrder';
import { deduplicateOrders } from './deduplicate';

const record = (fileIndex: number, updatedAt: number | null) => ({ ...sampleOrder, fileIndex, updatedAt });

describe('Removing duplicate order IDs', () => {
  it('keeps the record with the later updatedAt', () => {
    expect(deduplicateOrders([record(0, 200), record(1, 100)])[0].fileIndex).toBe(0);
    expect(deduplicateOrders([record(0, 100), record(1, 200)])[0].fileIndex).toBe(1);
  });

  it('keeps the one that has an updatedAt when only one does', () => {
    expect(deduplicateOrders([record(0, 100), record(1, null)])[0].fileIndex).toBe(0);
    expect(deduplicateOrders([record(0, null), record(1, 100)])[0].fileIndex).toBe(1);
  });

  it('keeps the later one in the file when neither has an updatedAt, or on a tie', () => {
    expect(deduplicateOrders([record(0, null), record(1, null)])[0].fileIndex).toBe(1);
    expect(deduplicateOrders([record(0, 100), record(1, 100)])[0].fileIndex).toBe(1);
  });

  it('leaves orders with different IDs alone, in file order', () => {
    const orders = [{ ...record(0, null), id: 'A' }, { ...record(1, null), id: 'B' }, { ...record(2, null), id: 'A' }];
    const result = deduplicateOrders(orders);
    expect(result.map((o) => o.id)).toEqual(['A', 'B']);
    expect(result[0].fileIndex).toBe(2);
  });
});
