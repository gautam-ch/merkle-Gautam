import { describe, expect, it } from 'vitest';
import { getVisibleRange, scrollTopToShowRow } from './virtualScroll';

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

describe('Scrolling a row into view', () => {
  // 600px viewport, 66px sticky header, 40px rows: 534px of rows are visible
  const show = (row: number, scrollTop: number) => scrollTopToShowRow(row, scrollTop, 600, 66, 40);

  it('does not move when the row is already fully visible', () => {
    expect(show(3, 0)).toBe(0);
    expect(show(12, 0)).toBe(0); // row 12 ends at 520, inside the 534px of rows
  });

  it('scrolls down just enough to show a row below the screen', () => {
    // row 20 spans 800-840; it must end at the bottom edge: 840 - 534
    expect(show(20, 0)).toBe(306);
  });

  it('shows the very last row completely', () => {
    expect(show(49_999, 0)).toBe(50_000 * 40 - 534);
  });

  it('scrolls up so the row sits right under the header', () => {
    expect(show(5, 1000)).toBe(200);
  });
});
