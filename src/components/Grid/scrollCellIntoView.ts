import type { CellPosition, GridColumn } from '../../types/grid';
import { scrollTopToShowRow } from '../../utils/virtualScroll';
import { ROW_HEIGHT, SELECT_COLUMN_WIDTH } from './columns';

const RIGHT_MARGIN = 30; // space kept between the focused cell and the right edge

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

  // The first role="row" is the sticky header
  const headerHeight = container.querySelector<HTMLElement>('[role="row"]')?.offsetHeight ?? 0;
  container.scrollTop = scrollTopToShowRow(cell.rowIndex, container.scrollTop, viewportHeight, headerHeight, ROW_HEIGHT);

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
