import { describe, expect, it } from 'vitest';
import { getVisibleRange } from './virtualScroll';

describe('Visible row range', () => {
  it('draws the first screen plus extra rows below at the top', () => {
    // 400px viewport / 40px rows = 10 rows, plus 5 extra below
    expect(getVisibleRange(0, 400, 50000, 40, 5)).toEqual({ start: 0, end: 20 });
  });

  it('adds extra rows above once scrolled', () => {
    // scrolled 20 rows down: rows 15 to 35
    expect(getVisibleRange(800, 400, 50000, 40, 5)).toEqual({ start: 15, end: 35 });
  });

  it('never goes past the last row', () => {
    // fully scrolled down: 50,000 rows * 40px - 400px viewport
    expect(getVisibleRange(1_999_600, 400, 50000, 40, 5).end).toBe(50000);
    expect(getVisibleRange(0, 400, 3, 40, 5)).toEqual({ start: 0, end: 3 });
  });

  it('draws nothing when there are no rows', () => {
    expect(getVisibleRange(0, 400, 0, 40, 5)).toEqual({ start: 0, end: 0 });
  });
});
