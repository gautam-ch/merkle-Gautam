import { describe, expect, it } from 'vitest';
import { escapeCsv } from './export';

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
