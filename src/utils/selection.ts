/**
 * Utility for compact URL serialization and deserialization of selected order IDs.
 *
 * Supports:
 * - Special keyword 'all' (all 50,000 orders)
 * - Compact integer ranges: '1-200', '1-50,100-250' (e.g. Shift+Click ranges)
 * - Compact individual numbers: '11,25,33'
 * - Legacy full IDs: 'ORD-0000011,ORD-0000025'
 * - Custom or mixed formats
 */

export function padOrderId(num: number): string {
  return `ORD-${String(num).padStart(7, '0')}`;
}

export function parseOrderIdNumber(id: string): number | null {
  const match = id.match(/^ORD-(\d+)$/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Serializes a Set of selected order IDs into a compact URL string.
 */
export function serializeSelection(selectedIds: Set<string>): string {
  if (!selectedIds || selectedIds.size === 0) {
    return '';
  }

  if (selectedIds.size === 50000) {
    return 'all';
  }

  const nums: number[] = [];
  const others: string[] = [];

  for (const id of selectedIds) {
    const num = parseOrderIdNumber(id);
    if (num !== null) {
      nums.push(num);
    } else {
      others.push(id);
    }
  }

  nums.sort((a, b) => a - b);

  const tokens: string[] = [];
  let i = 0;
  while (i < nums.length) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) {
      j++;
    }

    if (j > i + 1) {
      // 3 or more consecutive numbers -> range: '1-200'
      tokens.push(`${nums[i]}-${nums[j]}`);
    } else if (j === i + 1) {
      // 2 consecutive numbers -> '1,2'
      tokens.push(String(nums[i]));
      tokens.push(String(nums[j]));
    } else {
      // single number -> '1'
      tokens.push(String(nums[i]));
    }

    i = j + 1;
  }

  const allTokens = [...tokens, ...others];

  // Safety ceiling: prevent query string overflow in rare non-contiguous selections
  const result = allTokens.join(',');
  if (result.length > 2000) {
    return allTokens.slice(0, 100).join(',');
  }

  return result;
}

/**
 * Deserializes a URL selection string back into a Set of order IDs.
 */
export function deserializeSelection(str: string | null | undefined): Set<string> {
  const result = new Set<string>();
  if (!str) return result;

  const trimmed = str.trim();
  if (!trimmed) return result;

  if (trimmed === 'all') {
    for (let i = 1; i <= 50000; i++) {
      result.add(padOrderId(i));
    }
    return result;
  }

  const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    // Check for range: '1-200' or 'ORD-0000001..ORD-0000200'
    const numRange = part.match(/^(\d+)-(\d+)$/);
    const ordRange = part.match(/^ORD-(\d+)\.\.ORD-(\d+)$/i);

    if (numRange) {
      const start = parseInt(numRange[1], 10);
      const end = parseInt(numRange[2], 10);
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      // Safety limit on absurd ranges
      const count = Math.min(max - min + 1, 50000);
      for (let i = 0; i < count; i++) {
        result.add(padOrderId(min + i));
      }
    } else if (ordRange) {
      const start = parseInt(ordRange[1], 10);
      const end = parseInt(ordRange[2], 10);
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      const count = Math.min(max - min + 1, 50000);
      for (let i = 0; i < count; i++) {
        result.add(padOrderId(min + i));
      }
    } else if (/^\d+$/.test(part)) {
      result.add(padOrderId(parseInt(part, 10)));
    } else {
      // Legacy full ID format or custom string
      result.add(part);
    }
  }

  return result;
}
