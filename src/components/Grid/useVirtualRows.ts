import { useCallback, useEffect, useRef, useState } from 'react';
import { getVisibleRange } from '../../utils/virtualScroll';
import { ROW_HEIGHT } from './columns';

const OVERSCAN = 5; // extra rows drawn above and below the screen
const INITIAL_VIEWPORT_HEIGHT = 600;

/**
 * Tracks the scroll container's position and size, and works out which rows
 * to draw. Only those rows are in the DOM, which keeps 50,000 rows smooth.
 */
export function useVirtualRows(rowCount: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(INITIAL_VIEWPORT_HEIGHT);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setViewportHeight(entry.contentRect.height));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const range = getVisibleRange(scrollTop, viewportHeight, rowCount, ROW_HEIGHT, OVERSCAN);

  return { containerRef, handleScroll, viewportHeight, range };
}
