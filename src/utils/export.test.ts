import { describe, expect, it } from 'vitest';
import { sampleOrder } from '../test/sampleOrder';
import { escapeCsv, ordersToCsv } from './export';

describe('CSV escaping', () => {
  it('quotes plain values and doubles embedded quotes', () => {
    expect(escapeCsv('hello')).toBe('"hello"');
    expect(escapeCsv('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsv('')).toBe('""');
    expect(escapeCsv(null)).toBe('""');
  });

  it('neutralises values that spreadsheets would run as formulas', () => {
    expect(escapeCsv('=SUM(A1:A9)')).toBe(`"'=SUM(A1:A9)"`);
    expect(escapeCsv('+91 call back')).toBe(`"'+91 call back"`);
    expect(escapeCsv('-2+3')).toBe(`"'-2+3"`);
    expect(escapeCsv('@cmd')).toBe(`"'@cmd"`);
  });

  it('leaves values with a trigger character later in the text unchanged', () => {
    expect(escapeCsv('a=b')).toBe('"a=b"');
  });
});

describe('CSV rows', () => {
  it('leaves Updated At empty when the order has none', () => {
    const noUpdate = { ...sampleOrder, updatedAt: null, updatedAtFormatted: '-' };
    const [, row] = ordersToCsv([noUpdate]).split('\n');
    expect(row).not.toContain('-"');
    expect(row).toContain('"15/06/2025 12:00",""');
  });

  it('writes a header, then one line per order, after a BOM', () => {
    const lines = ordersToCsv([sampleOrder, sampleOrder]).split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0].startsWith('\uFEFF"Order ID"') || lines[0].startsWith('\uFEFFOrder ID')).toBe(true);
  });
});
