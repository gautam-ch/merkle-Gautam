import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

const GRID_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
  'Enter',
]);

const TEXT_FIELDS = new Set(['input', 'textarea', 'select']);

// Keys belong to the page when the user is typing, or is on a button or link
// outside the grid (so Enter and Space still press it).
function shouldGridHandle(container: HTMLElement | null): boolean {
  const active = document.activeElement;
  const tag = active?.tagName.toLowerCase() ?? '';
  if (TEXT_FIELDS.has(tag)) return false;

  const isInteractive =
    tag === 'button' || tag === 'a' || active?.getAttribute('role') === 'button' || active?.getAttribute('contenteditable') === 'true';
  return !isInteractive || container?.contains(active) === true;
}

/**
 * Lets the grid take navigation keys from anywhere on the page, so keyboard
 * users don't have to click into it first. Turned off while the details panel
 * is open, because the panel handles its own keys.
 */
export function useGridKeyboard(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onKeyDown: (e: KeyboardEvent) => void
) {
  // Always call the latest handler without re-adding the listener on every render
  const handler = useRef(onKeyDown);
  useLayoutEffect(() => {
    handler.current = onKeyDown;
  });

  useEffect(() => {
    containerRef.current?.focus();
  }, [containerRef]);

  useEffect(() => {
    if (!enabled) return;

    const listener = (e: KeyboardEvent) => {
      if (GRID_KEYS.has(e.key) && shouldGridHandle(containerRef.current)) handler.current(e);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [containerRef, enabled]);
}
