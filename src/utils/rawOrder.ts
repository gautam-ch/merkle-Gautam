import { z } from 'zod';

const text = z.string();
const textOrNumber = z.union([z.string(), z.number()]);

// The shape of one record in orders.json, before any cleaning. It accepts every
// quirk listed in data-notes.md (two name fields, amount as text, four date
// formats, missing updatedAt, priority or notes) and rejects records that
// can't be read at all, such as one with no ID.
const rawOrderSchema = z.looseObject({
  id: text.trim().min(1),
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
  customerName: text.optional(), // version 2
  customer_name: text.optional(), // version 1
  customerEmail: text,
  status: text,
  amount: textOrNumber,
  currency: text,
  createdAt: textOrNumber,
  updatedAt: textOrNumber.nullish(),
  region: text,
  channel: text,
  priority: z.number().nullish(),
  paymentMethod: text,
  itemCount: z.number(),
  notes: text.nullish(),
});

export type RawOrder = z.infer<typeof rawOrderSchema>;

/** Splits a list of records into the ones that can be read and the number that can't. */
export function parseRawOrders(records: unknown[]): { orders: RawOrder[]; skipped: number } {
  const orders: RawOrder[] = [];
  for (const record of records) {
    const result = rawOrderSchema.safeParse(record);
    if (result.success) orders.push(result.data);
  }
  return { orders, skipped: records.length - orders.length };
}
