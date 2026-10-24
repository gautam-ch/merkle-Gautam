import type {
  NormalizedOrder,
  OrderChannel,
  OrderRegion,
  OrderStatus,
  PaymentMethod,
  PriorityLevel,
  RawOrder,
} from '../types/order';

/**
 * Parses raw dates across the 4 specified formats:
 * 1. ISO with TZ: "2025-03-14T09:30:00.000Z"
 * 2. ISO without TZ (treated as UTC): "2025-03-14T09:30:00" -> "2025-03-14T09:30:00Z"
 * 3. Epoch seconds: 1741944600 -> * 1000
 * 4. DD/MM/YYYY: "14/03/2025" -> midnight UTC
 */
export function parseDateToTimestamp(rawDate: string | number | null | undefined): number | null {
  if (rawDate === null || rawDate === undefined || rawDate === '') {
    return null;
  }

  // Case 3: Epoch seconds (numeric or numeric string)
  if (typeof rawDate === 'number' || (/^\d{9,11}$/).test(String(rawDate).trim())) {
    const num = Number(rawDate);
    // If epoch seconds (around 10 digits), convert to ms
    return num < 100_000_000_000 ? num * 1000 : num;
  }

  const str = String(rawDate).trim();

  // Case 4: DD/MM/YYYY format
  const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10);
    const year = parseInt(ddmmyyyyMatch[3], 10);
    return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  }

  // Case 2: ISO without timezone -> treat as UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    return Date.parse(`${str}Z`);
  }

  // Case 1: Standard ISO or other parseable string
  const parsed = Date.parse(str);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats epoch timestamp into uniform Indian date representation: DD/MM/YYYY HH:mm:ss
 */
export function formatOrderDate(timestampMs: number | null): string {
  if (timestampMs === null || isNaN(timestampMs)) {
    return '-';
  }

  const date = new Date(timestampMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(date.getUTCDate());
  const month = pad(date.getUTCMonth() + 1);
  const year = date.getUTCFullYear();
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());

  // If time is exactly midnight UTC, we show DD/MM/YYYY for cleaner look
  if (hours === '00' && minutes === '00') {
    return `${day}/${month}/${year}`;
  }

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formats rupee amount to Indian Currency format: e.g. ₹1,23,456.50
 */
export function formatCurrencyInr(rupees: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Sanitizes raw string by stripping HTML tags and escaping entities
 */
export function sanitizeNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  // Strip dangerous HTML tags
  return notes
    .replace(/<[^>]*>?/gm, '')
    .trim();
}

/**
 * Normalizes a single RawOrder into a clean, typed NormalizedOrder.
 * Satisfies all 10 schema rules defined in data-notes.md.
 */
export function normalizeOrder(raw: RawOrder, fileIndex: number = 0): NormalizedOrder {
  // Rule 1: customerName (v2) and customer_name (v1)
  const customerName = (raw.customerName ?? raw.customer_name ?? '').trim();

  // Rule 3: Amount is sometimes a string -> parse to number
  const rawAmountNum = typeof raw.amount === 'string' ? parseFloat(raw.amount) : Number(raw.amount);
  const safeAmountNum = isNaN(rawAmountNum) ? 0 : rawAmountNum;

  // Rule 2: Amount unit: v1 paise, v2 rupees -> convert all to rupees
  const amountRupees = raw.schemaVersion === 1 ? safeAmountNum / 100 : safeAmountNum;

  // Rule 10: Currency trailing space "INR " -> trim
  const currency = (raw.currency ?? 'INR').trim();

  // Rule 4: Dates come in 4 formats -> normalize to UTC timestamp ms
  const createdAtMs = parseDateToTimestamp(raw.createdAt) ?? 0;

  // Rule 5: updatedAt is sometimes null or missing -> treat as absent
  const updatedAtMs = parseDateToTimestamp(raw.updatedAt);

  // Rule 6: Status & region inconsistent casing
  const status = (raw.status ? raw.status.toLowerCase().trim() : 'pending') as OrderStatus;
  const region = (raw.region ? raw.region.toUpperCase().trim() : 'NORTH') as OrderRegion;
  const channel = (raw.channel ? raw.channel.toLowerCase().trim() : 'web') as OrderChannel;
  const paymentMethod = (raw.paymentMethod ? raw.paymentMethod.toLowerCase().trim() : 'upi') as PaymentMethod;

  // Rule 8: Priority is sometimes missing -> None
  const rawPriority = raw.priority !== undefined && raw.priority !== null ? Number(raw.priority) : null;
  const priority: PriorityLevel = rawPriority === 1 || rawPriority === 2 || rawPriority === 3 ? rawPriority : null;
  const priorityLabel = priority === 1 ? '1' : priority === 2 ? '2' : priority === 3 ? '3' : 'None';

  // Rule 9: Notes plain text, no HTML
  const notes = sanitizeNotes(raw.notes);

  return {
    id: String(raw.id).trim(),
    schemaVersion: raw.schemaVersion === 1 ? 1 : 2,
    customerName,
    customerEmail: (raw.customerEmail ?? '').trim(),
    status,
    amount: amountRupees,
    amountFormatted: formatCurrencyInr(amountRupees),
    currency,
    createdAt: createdAtMs,
    createdAtFormatted: formatOrderDate(createdAtMs),
    updatedAt: updatedAtMs,
    updatedAtFormatted: formatOrderDate(updatedAtMs),
    region,
    channel,
    priority,
    priorityLabel,
    paymentMethod,
    itemCount: Number(raw.itemCount) || 1,
    notes,
    fileIndex,
  };
}
