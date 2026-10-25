import type { CellPosition, GridColumn } from '../../types/grid';
import { ROW_HEIGHT, SELECT_COLUMN_WIDTH } from './columns';

// Space kept between the focused row and the sticky header / bottom edge
const TOP_MARGIN = 50;
const BOTTOM_MARGIN = 20;
const RIGHT_MARGIN = 30;

interface Layout {
  columns: GridColumn[];
  hasPinnedColumn: boolean;
  viewportHeight: number;
}

/**
 * Scrolls the grid just enough to keep the focused cell on screen.
 * The checkbox and pinned columns are sticky, so they never need scrolling.
 */
export function scrollCellIntoView(container: HTMLElement, cell: CellPosition, layout: Layout) {
  const { columns, hasPinnedColumn, viewportHeight } = layout;

  const rowTop = cell.rowIndex * ROW_HEIGHT;
  if (rowTop < container.scrollTop + TOP_MARGIN) {
    container.scrollTop = Math.max(0, rowTop - TOP_MARGIN);
  } else if (rowTop + ROW_HEIGHT > container.scrollTop + viewportHeight - BOTTOM_MARGIN) {
    container.scrollTop = rowTop + ROW_HEIGHT - viewportHeight + 2 * BOTTOM_MARGIN;
  }

  const isSticky = cell.colIndex === 0 || (hasPinnedColumn && cell.colIndex === 1);
  if (isSticky) return;

  const widthBefore = columns.slice(0, cell.colIndex - 1).reduce((sum, col) => sum + col.width, 0);
  const left = SELECT_COLUMN_WIDTH + widthBefore;
  const right = left + columns[cell.colIndex - 1].width;
  const stickyWidth = SELECT_COLUMN_WIDTH + (hasPinnedColumn ? columns[0].width : 0);

  if (left < container.scrollLeft + stickyWidth) {
    container.scrollLeft = Math.max(0, left - stickyWidth);
  } else if (right > container.scrollLeft + container.clientWidth) {
    container.scrollLeft = right - container.clientWidth + RIGHT_MARGIN;
  }
}
