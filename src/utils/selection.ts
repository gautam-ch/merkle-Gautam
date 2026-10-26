// Selected orders go in the URL as order numbers and ranges, e.g. "1-200,250,300-310".
// Order IDs look like ORD-0000250.
// A scattered selection would make that text very long (and the link too long to reload),
// so when it gets long the selection is written as a bitset instead: "~" followed by
// base64url text, where bit N-1 stands for order number N. That never takes more than
// about 8,400 characters for 50,000 orders.

const ID_PREFIX = 'ORD-';
const ID_DIGITS = 7;
const TOKEN = /^(\d+)(?:-(\d+))?$/; // "250" or "1-200"
const BITSET_PREFIX = '~';
const BITSET_TEXT = /^~[A-Za-z0-9_-]*$/;

// Stops a link like "1-999999999" from freezing the page
const MAX_RANGE_SIZE = 50_000;
const MAX_READABLE_RANGES = 1_000; // longer than this, the compact bitset is used instead
const MAX_BITSET_TEXT = 10_000; // a bitset for 50,000 orders is about 8,400 characters

export function padOrderId(num: number): string {
  return `${ID_PREFIX}${String(num).padStart(ID_DIGITS, '0')}`;
}

export function parseOrderIdNumber(id: string): number | null {
  const match = id.match(/^ORD-(\d+)$/i);
  return match ? parseInt(match[1], 10) : null;
}

function toSortedNumbers(selectedIds: Set<string>): number[] {
  return [...selectedIds]
    .map(parseOrderIdNumber)
    .filter((num): num is number => num !== null)
    .sort((a, b) => a - b);
}

function numbersToRanges(numbers: number[]): string {
  const tokens: string[] = [];
  for (let i = 0; i < numbers.length; ) {
    let end = i;
    while (numbers[end + 1] === numbers[end] + 1) end++;
    tokens.push(end > i ? `${numbers[i]}-${numbers[end]}` : String(numbers[i]));
    i = end + 1;
  }
  return tokens.join(',');
}

function numbersToBitset(numbers: number[]): string {
  if (numbers.length === 0) return '';
  const bytes = new Uint8Array((numbers[numbers.length - 1] >> 3) + 1);
  for (const num of numbers) bytes[(num - 1) >> 3] |= 1 << ((num - 1) & 7);

  const base64 = btoa(String.fromCharCode(...bytes));
  return BITSET_PREFIX + base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bitsetToIds(text: string): Set<string> {
  const base64 = text.slice(1).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));

  const ids = new Set<string>();
  for (let byteIndex = 0; byteIndex < binary.length; byteIndex++) {
    const byte = binary.charCodeAt(byteIndex);
    for (let bit = 0; bit < 8; bit++) {
      if (byte & (1 << bit)) ids.add(padOrderId(byteIndex * 8 + bit + 1));
    }
  }
  return ids;
}

/** The selection as URL text: ranges like "1-200", or a bitset once the ranges get long. */
export function serializeSelection(selectedIds: Set<string>): string {
  const numbers = toSortedNumbers(selectedIds);
  const ranges = numbersToRanges(numbers);
  const bitset = numbersToBitset(numbers);
  return ranges.length > MAX_READABLE_RANGES && bitset.length < ranges.length ? bitset : ranges;
}

/** Whether the text from the URL has the expected format. It doesn't check that the orders exist. */
export function isValidSelectionParam(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith(BITSET_PREFIX)) {
    return trimmed.length <= MAX_BITSET_TEXT && BITSET_TEXT.test(trimmed) && trimmed.length % 4 !== 2;
  }
  return trimmed === '' || trimmed.split(',').every((token) => TOKEN.test(token.trim()));
}

/** The order IDs for URL text written by serializeSelection. */
export function deserializeSelection(text: string | null | undefined): Set<string> {
  const trimmed = (text ?? '').trim();
  if (trimmed.startsWith(BITSET_PREFIX)) {
    try {
      return isValidSelectionParam(trimmed) ? bitsetToIds(trimmed) : new Set();
    } catch {
      return new Set(); // text that isn't valid base64
    }
  }

  const ids = new Set<string>();

  for (const token of (text ?? '').split(',')) {
    const match = token.trim().match(TOKEN);
    if (!match) continue;

    const first = parseInt(match[1], 10);
    const last = match[2] ? parseInt(match[2], 10) : first;
    const from = Math.min(first, last);
    const size = Math.min(Math.abs(last - first) + 1, MAX_RANGE_SIZE);
    for (let num = from; num < from + size; num++) ids.add(padOrderId(num));
  }

  return ids;
}
