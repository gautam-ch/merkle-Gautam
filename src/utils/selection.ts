// Selected orders go in the URL as order numbers and ranges, e.g. "1-200,250,300-310".
// Order IDs look like ORD-0000250.

const ID_PREFIX = 'ORD-';
const ID_DIGITS = 7;
const TOKEN = /^(\d+)(?:-(\d+))?$/; // "250" or "1-200"

// Stops a link like "1-999999999" from freezing the page
const MAX_RANGE_SIZE = 50_000;

export function padOrderId(num: number): string {
  return `${ID_PREFIX}${String(num).padStart(ID_DIGITS, '0')}`;
}

export function parseOrderIdNumber(id: string): number | null {
  const match = id.match(/^ORD-(\d+)$/i);
  return match ? parseInt(match[1], 10) : null;
}

/** The selection as URL text. Runs of consecutive orders become ranges, so 200 in a row is just "1-200". */
export function serializeSelection(selectedIds: Set<string>): string {
  const numbers = [...selectedIds]
    .map(parseOrderIdNumber)
    .filter((num): num is number => num !== null)
    .sort((a, b) => a - b);

  const tokens: string[] = [];
  for (let i = 0; i < numbers.length; ) {
    let end = i;
    while (numbers[end + 1] === numbers[end] + 1) end++;
    tokens.push(end > i ? `${numbers[i]}-${numbers[end]}` : String(numbers[i]));
    i = end + 1;
  }
  return tokens.join(',');
}

/** Whether the text from the URL has the expected format. It doesn't check that the orders exist. */
export function isValidSelectionParam(text: string): boolean {
  const trimmed = text.trim();
  return trimmed === '' || trimmed.split(',').every((token) => TOKEN.test(token.trim()));
}

/** The order IDs for URL text written by serializeSelection. */
export function deserializeSelection(text: string | null | undefined): Set<string> {
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
