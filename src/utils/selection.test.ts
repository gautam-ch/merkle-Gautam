import { describe, expect, it } from 'vitest';
import {
  deserializeSelection,
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

  it('deserializes legacy comma-separated order IDs for backwards compatibility', () => {
    const legacy = 'ORD-0000011,ORD-0000025,ORD-0000033';
    const decoded = deserializeSelection(legacy);

    expect(decoded.size).toBe(3);
    expect(decoded.has('ORD-0000011')).toBe(true);
    expect(decoded.has('ORD-0000025')).toBe(true);
    expect(decoded.has('ORD-0000033')).toBe(true);
  });

  it('handles special "all" selection keyword', () => {
    const selected = new Set<string>();
    for (let i = 1; i <= 50000; i++) {
      selected.add(padOrderId(i));
    }

    const encoded = serializeSelection(selected);
    expect(encoded).toBe('all');

    const decoded = deserializeSelection('all');
    expect(decoded.size).toBe(50000);
    expect(decoded.has('ORD-0000001')).toBe(true);
    expect(decoded.has('ORD-0050000')).toBe(true);
  });

  it('safely handles empty or null values', () => {
    expect(serializeSelection(new Set())).toBe('');
    expect(deserializeSelection(null).size).toBe(0);
    expect(deserializeSelection('').size).toBe(0);
    expect(deserializeSelection('   ').size).toBe(0);
  });
});
