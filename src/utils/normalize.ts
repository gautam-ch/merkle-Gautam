import type {
  NormalizedOrder,
  OrderChannel,
  OrderRegion,
  OrderStatus,
  PaymentMethod,
  PriorityLevel,
  RawOrder,
} from '../types/order';

// Built once: creating a formatter for each of the 50,000 orders is slow
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

const ISO_WITHOUT_TIMEZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;
const DAY_MONTH_YEAR = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const EPOCH_SECONDS = /^\d{9,11}$/;

/**
 * Turns a date in any of the four formats in the data into a UTC timestamp
 * in milliseconds, or null when there is none.
 */
export function parseDateToTimestamp(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;

  // Epoch seconds, as a number or as numeric text
  if (typeof raw === 'number' || EPOCH_SECONDS.test(String(raw).trim())) {
    const seconds = Number(raw);
    return seconds < 100_000_000_000 ? seconds * 1000 : seconds;
  }

  const text = String(raw).trim();

  // "14/03/2025" has no time, so it means midnight UTC
  const dayMonthYear = text.match(DAY_MONTH_YEAR);
  if (dayMonthYear) {
    const [, day, month, year] = dayMonthYear.map(Number);
    return Date.UTC(year, month - 1, day);
  }

  // ISO without a timezone counts as UTC
  if (ISO_WITHOUT_TIMEZONE.test(text)) return Date.parse(`${text}Z`);

  const parsed = Date.parse(text);
  return isNaN(parsed) ? null : parsed;
}

/** DD/MM/YYYY HH:mm in UTC, for every date. A missing date shows "-". */
function formatDate(timestamp: number | null): string {
  if (timestamp === null || isNaN(timestamp)) return '-';

  const date = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
  return `${day} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

// Version 1 records store the amount in paise, version 2 in rupees. Some amounts are text.
function parseAmountInRupees(raw: RawOrder): number {
  const amount = typeof raw.amount === 'string' ? parseFloat(raw.amount) : Number(raw.amount);
  if (isNaN(amount)) return 0;
  return raw.schemaVersion === 1 ? amount / 100 : amount;
}

function parsePriority(raw: RawOrder): PriorityLevel {
  const priority = Number(raw.priority);
  return priority === 1 || priority === 2 || priority === 3 ? priority : null;
}

const lower = (text: string | undefined) => (text ?? '').toLowerCase().trim();

/**
 * Cleans one record from the file into the shape the app uses. All the
 * fixes listed in data-notes.md happen here, before the data reaches the
 * grid or the filters.
 */
export function normalizeOrder(raw: RawOrder, fileIndex: number = 0): NormalizedOrder {
  const amount = parseAmountInRupees(raw);
  const createdAt = parseDateToTimestamp(raw.createdAt) ?? 0;
  const updatedAt = parseDateToTimestamp(raw.updatedAt); // null and missing are treated the same
  const priority = parsePriority(raw);

  return {
    id: String(raw.id).trim(),
    schemaVersion: raw.schemaVersion === 1 ? 1 : 2,
    customerName: (raw.customerName ?? raw.customer_name ?? '').trim(), // version 1 uses customer_name
    customerEmail: (raw.customerEmail ?? '').trim(),
    status: lower(raw.status) as OrderStatus,
    amount,
    amountFormatted: rupees.format(amount),
    currency: (raw.currency ?? 'INR').trim(), // some values are "INR "
    createdAt,
    createdAtFormatted: formatDate(createdAt),
    updatedAt,
    updatedAtFormatted: formatDate(updatedAt),
    region: (raw.region ?? '').toUpperCase().trim() as OrderRegion,
    channel: lower(raw.channel) as OrderChannel,
    priority,
    priorityLabel: priority === null ? 'None' : (String(priority) as NormalizedOrder['priorityLabel']),
    paymentMethod: lower(raw.paymentMethod) as PaymentMethod,
    itemCount: Number(raw.itemCount) || 0,
    // Kept exactly as written. Notes are only ever shown as text, never as HTML,
    // so tags like <b> appear literally and can't run.
    notes: (raw.notes ?? '').trim(),
    fileIndex,
  };
}
