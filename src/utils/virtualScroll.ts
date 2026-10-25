/**
 * Which rows to draw for the current scroll position: the visible ones plus
 * a few extra above and below so fast scrolling doesn't show gaps.
 */
export function getVisibleRange(
  scrollTop: number,
  viewportHeight: number,
  totalRows: number,
  rowHeight: number,
  overscan: number
) {
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(totalRows, start + Math.ceil(viewportHeight / rowHeight) + overscan * 2);
  return { start, end };
}
