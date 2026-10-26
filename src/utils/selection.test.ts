import { describe, expect, it } from 'vitest';
import {
  deserializeSelection,
  isValidSelectionParam,
  padOrderId,
  parseOrderIdNumber,
  serializeSelection,
} from './selection';

describe('Selection URL Serialization & Deserialization', () => {
  it('pads and parses order IDs accurately', () => {
    expect(padOrderId(1)).toBe('ORD-0000001');
    expect(padOrderId(200)).toBe('ORD-0000200');
    expect(padOrderId(50000)).toBe('ORD-0050000');
    expect(parseOrderIdNumber('ORD-0000200')).toBe(200);
    expect(parseOrderIdNumber('INVALID')).toBeNull();
  });

  it('serializes 200 contiguous selected rows into a 5-character range', () => {
    const selected = new Set<string>();
    for (let i = 1; i <= 200; i++) {
      selected.add(padOrderId(i));
    }

    const encoded = serializeSelection(selected);
    expect(encoded).toBe('1-200');

    const decoded = deserializeSelection(encoded);
    expect(decoded.size).toBe(200);
    expect(decoded.has('ORD-0000001')).toBe(true);
    expect(decoded.has('ORD-0000200')).toBe(true);
    expect(decoded.has('ORD-0000201')).toBe(false);
  });

  it('handles mixed ranges and individual numbers', () => {
    const selected = new Set<string>([
      padOrderId(1),
      padOrderId(2),
      padOrderId(3),
      padOrderId(5),
      padOrderId(10),
      padOrderId(11),
      padOrderId(12),
      padOrderId(13),
    ]);

    const encoded = serializeSelection(selected);
    expect(encoded).toBe('1-3,5,10-13');

    const decoded = deserializeSelection(encoded);
    expect(decoded.size).toBe(8);
    expect(decoded.has('ORD-0000001')).toBe(true);
    expect(decoded.has('ORD-0000002')).toBe(true);
    expect(decoded.has('ORD-0000003')).toBe(true);
    expect(decoded.has('ORD-0000005')).toBe(true);
    expect(decoded.has('ORD-0000010')).toBe(true);
    expect(decoded.has('ORD-0000013')).toBe(true);
  });

  it('turns any run of two or more consecutive orders into a range', () => {
    const selected = new Set([padOrderId(1), padOrderId(2), padOrderId(7)]);
    expect(serializeSelection(selected)).toBe('1-2,7');
  });

  it('ignores text that is not an order number or range', () => {
    expect([...deserializeSelection('abc,12,x-3')]).toEqual(['ORD-0000012']);
  });

  it('caps absurdly large ranges', () => {
    expect(deserializeSelection('1-999999999').size).toBe(50_000);
  });

  it('keeps every row of a large scattered selection', () => {
    // Every other order: no ranges possible, so the string is long
    const selected = new Set<string>();
    for (let i = 1; i <= 2000; i += 2) {
      selected.add(padOrderId(i));
    }

    const decoded = deserializeSelection(serializeSelection(selected));
    expect(decoded.size).toBe(1000);
    expect(decoded.has('ORD-0001999')).toBe(true);
  });

  it('encodes a selection of all 50,000 orders as one range', () => {
    const selected = new Set<string>();
    for (let i = 1; i <= 50000; i++) {
      selected.add(padOrderId(i));
    }
    expect(serializeSelection(selected)).toBe('1-50000');
  });

  it('safely handles empty or null values', () => {
    expect(serializeSelection(new Set())).toBe('');
    expect(deserializeSelection(null).size).toBe(0);
    expect(deserializeSelection('').size).toBe(0);
    expect(deserializeSelection('   ').size).toBe(0);
  });

  describe('scattered selections', () => {
    const scattered = (count: number) => {
      // every 7th order: no ranges, and a lot of rows
      const selected = new Set<string>();
      for (let i = 0; i < count; i++) selected.add(padOrderId(1 + ((i * 7) % 50_000)));
      return selected;
    };

    it('stays short and keeps every row when 25,000 orders are scattered', () => {
      const selected = new Set<string>();
      for (let i = 1; i <= 50_000; i++) if (i % 2 === 0 || i % 3 === 0) selected.add(padOrderId(i));

      const encoded = serializeSelection(selected);
      expect(encoded.startsWith('~')).toBe(true);
      expect(encoded.length).toBeLessThan(8_500);
      expect(isValidSelectionParam(encoded)).toBe(true);

      const decoded = deserializeSelection(encoded);
      expect(decoded.size).toBe(selected.size);
      for (const id of selected) expect(decoded.has(id)).toBe(true);
    });

    it('uses ranges while they are shorter', () => {
      expect(serializeSelection(scattered(3)).startsWith('~')).toBe(false);
    });

    it('survives the URL round trip', () => {
      const selected = scattered(7000);
      const query = new URLSearchParams({ sel: serializeSelection(selected) }).toString();
      const decoded = deserializeSelection(new URLSearchParams(query).get('sel'));
      expect(decoded).toEqual(selected);
    });

    it('rejects broken or oversized bitset text', () => {
      expect(isValidSelectionParam('~a')).toBe(false);
      expect(isValidSelectionParam('~ab$')).toBe(false);
      expect(isValidSelectionParam('~' + 'A'.repeat(20_000))).toBe(false);
      expect(deserializeSelection('~a').size).toBe(0);
    });
  });
});
