import { describe, expect, it } from 'vitest';
import type { RawOrder } from '../types/order';
import { deduplicateOrders } from './deduplicate';
import { normalizeOrder, parseDateToTimestamp, sanitizeNotes } from './normalize';

describe('Data Normalization & Sanitization (10 Schema Rules)', () => {
  // Base mock helper
  const createMockRaw = (overrides: Partial<RawOrder> = {}): RawOrder => ({
    id: 'ORD-0000001',
    schemaVersion: 2,
    customerName: 'Aarav Sharma',
    customerEmail: 'aarav@example.com',
    status: 'delivered',
    amount: 1500,
    currency: 'INR',
    createdAt: '2025-03-14T09:30:00.000Z',
    updatedAt: null,
    region: 'NORTH',
    channel: 'web',
    priority: 1,
    paymentMethod: 'upi',
    itemCount: 2,
    notes: 'Standard delivery',
    ...overrides,
  });

  it('Rule 1: Reconciles customer_name (v1) and customerName (v2) to customerName', () => {
    const v1 = normalizeOrder(createMockRaw({ schemaVersion: 1, customer_name: 'Rohit Kumar', customerName: undefined }));
    const v2 = normalizeOrder(createMockRaw({ schemaVersion: 2, customerName: 'Priya Patel', customer_name: undefined }));

    expect(v1.customerName).toBe('Rohit Kumar');
    expect(v2.customerName).toBe('Priya Patel');
  });

  it('Rule 2: Normalizes v1 paise to rupees and leaves v2 rupees intact', () => {
    // 50000 paise in v1 -> 500 rupees
    const v1 = normalizeOrder(createMockRaw({ schemaVersion: 1, amount: 50000 }));
    // 500 rupees in v2 -> 500 rupees
    const v2 = normalizeOrder(createMockRaw({ schemaVersion: 2, amount: 500 }));

    expect(v1.amount).toBe(500);
    expect(v2.amount).toBe(500);
  });

  it('Rule 3: Parses amount when provided as string', () => {
    const res = normalizeOrder(createMockRaw({ schemaVersion: 2, amount: '4599.5' as unknown as number }));
    expect(res.amount).toBe(4599.5);
  });

  it('Rule 4: Accurately parses all 4 date formats to UTC timestamps', () => {
    // Format A: ISO with TZ
    const isoTz = parseDateToTimestamp('2025-03-14T09:30:00.000Z');
    expect(isoTz).toBe(1741944600000);

    // Format B: ISO without TZ (treated as UTC)
    const isoNoTz = parseDateToTimestamp('2025-03-14T09:30:00');
    expect(isoNoTz).toBe(1741944600000);

    // Format C: Epoch seconds
    const epochSec = parseDateToTimestamp(1741944600);
    expect(epochSec).toBe(1741944600000);

    // Format D: DD/MM/YYYY (midnight UTC)
    const ddmmyyyy = parseDateToTimestamp('14/03/2025');
    expect(ddmmyyyy).toBe(Date.UTC(2025, 2, 14, 0, 0, 0));
  });

  it('Rule 5: Handles updatedAt as null, missing, or valid date', () => {
    const nullUpdated = normalizeOrder(createMockRaw({ updatedAt: null }));
    const missingUpdated = normalizeOrder(createMockRaw({ updatedAt: undefined }));
    const validUpdated = normalizeOrder(createMockRaw({ updatedAt: '2025-03-15T10:00:00.000Z' }));

    expect(nullUpdated.updatedAt).toBeNull();
    expect(nullUpdated.updatedAtFormatted).toBe('-');
    expect(missingUpdated.updatedAt).toBeNull();
    expect(validUpdated.updatedAt).toBe(Date.parse('2025-03-15T10:00:00.000Z'));
  });

  it('Rule 6: Normalizes inconsistent casing in status, region, and channel', () => {
    const mixed = normalizeOrder(createMockRaw({
      status: 'SHIPPED',
      region: 'south',
      channel: 'STORE',
    }));

    expect(mixed.status).toBe('shipped');
    expect(mixed.region).toBe('SOUTH');
    expect(mixed.channel).toBe('store');
  });

  it('Rule 7: Deduplicates duplicate order IDs accurately based on priority rules', () => {
    const orderA1 = normalizeOrder(createMockRaw({ id: 'ORD-DUP', updatedAt: '2025-03-10T00:00:00.000Z' }), 0);
    const orderA2 = normalizeOrder(createMockRaw({ id: 'ORD-DUP', updatedAt: '2025-03-12T00:00:00.000Z' }), 1);

    // Both have updatedAt -> keep later
    const dedupBoth = deduplicateOrders([orderA1, orderA2]);
    expect(dedupBoth).toHaveLength(1);
    expect(dedupBoth[0].updatedAt).toBe(Date.parse('2025-03-12T00:00:00.000Z'));

    // Only one has updatedAt -> keep that one
    const orderB1 = normalizeOrder(createMockRaw({ id: 'ORD-DUP2', updatedAt: null }), 0);
    const orderB2 = normalizeOrder(createMockRaw({ id: 'ORD-DUP2', updatedAt: '2025-03-11T00:00:00.000Z' }), 1);
    const dedupOne = deduplicateOrders([orderB1, orderB2]);
    expect(dedupOne).toHaveLength(1);
    expect(dedupOne[0].updatedAt).toBe(Date.parse('2025-03-11T00:00:00.000Z'));

    // Neither has updatedAt -> keep the one appearing later in file
    const orderC1 = normalizeOrder(createMockRaw({ id: 'ORD-DUP3', updatedAt: null, customerName: 'First' }), 0);
    const orderC2 = normalizeOrder(createMockRaw({ id: 'ORD-DUP3', updatedAt: null, customerName: 'Second' }), 5);
    const dedupNeither = deduplicateOrders([orderC1, orderC2]);
    expect(dedupNeither).toHaveLength(1);
    expect(dedupNeither[0].customerName).toBe('Second');
  });

  it('Rule 8: Treats missing priority as null and labels it as None', () => {
    const missing = normalizeOrder(createMockRaw({ priority: undefined }));
    const nullPriority = normalizeOrder(createMockRaw({ priority: null }));
    const p1 = normalizeOrder(createMockRaw({ priority: 1 }));

    expect(missing.priority).toBeNull();
    expect(missing.priorityLabel).toBe('None');
    expect(nullPriority.priority).toBeNull();
    expect(nullPriority.priorityLabel).toBe('None');
    expect(p1.priority).toBe(1);
    expect(p1.priorityLabel).toBe('High');
  });

  it('Rule 9: Sanitizes HTML tags from notes safely', () => {
    const rawWithHtml = '<b>URGENT</b>: Deliver before 5pm <script>alert(1)</script>';
    const sanitized = sanitizeNotes(rawWithHtml);
    expect(sanitized).toBe('URGENT: Deliver before 5pm alert(1)');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('<b>');
  });

  it('Rule 10: Trims trailing spaces from currency', () => {
    const trailingCurrency = normalizeOrder(createMockRaw({ currency: 'INR ' }));
    expect(trailingCurrency.currency).toBe('INR');
  });
});
