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

/**
 * The scrollTop that brings a row fully on screen, or the current one if it
 * already is. The sticky header covers the top of the scroll area, so rows are
 * pushed down by its height and only the part below it counts as visible.
 */
export function scrollTopToShowRow(
  rowIndex: number,
  scrollTop: number,
  viewportHeight: number,
  headerHeight: number,
  rowHeight: number
): number {
  const rowTop = rowIndex * rowHeight; // measured from the first row, below the header
  const rowBottom = rowTop + rowHeight;
  if (rowTop < scrollTop) return rowTop;
  if (rowBottom > scrollTop + viewportHeight - headerHeight) return rowBottom - viewportHeight + headerHeight;
  return scrollTop;
}
