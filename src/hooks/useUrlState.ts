import { useCallback, useEffect, useState } from 'react';
import { defaultUrlState, parseUrlState, serializeUrlState, type GridUrlState } from '../utils/urlState';

const INVALID_LINK_MESSAGE =
  'This link has broken or unknown settings, so the default view is shown instead.';

function readUrl(): { state: GridUrlState; isValid: boolean } {
  if (typeof window === 'undefined') return { state: defaultUrlState(), isValid: true };
  const state = parseUrlState(window.location.search);
  return state ? { state, isValid: true } : { state: defaultUrlState(), isValid: false };
}

/**
 * View state (filters, sort, pin, selection) that lives in the URL, so a
 * refresh or a shared link shows the same screen.
 */
export function useUrlState() {
  const [initial] = useState(readUrl);
  const [urlState, setUrlState] = useState<GridUrlState>(initial.state);
  const [urlError, setUrlError] = useState<string | null>(
    initial.isValid ? null : INVALID_LINK_MESSAGE
  );

  // Keep the address bar in step with the state. This also clears a broken query.
  useEffect(() => {
    const query = serializeUrlState(urlState);
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [urlState]);

  const syncToUrl = useCallback((changes: Partial<GridUrlState>) => {
    setUrlState((prev) => ({ ...prev, ...changes }));
  }, []);

  // Shows the default view with a message, for links that turn out to be broken
  const fallBackToDefault = useCallback(() => {
    setUrlState(defaultUrlState());
    setUrlError(INVALID_LINK_MESSAGE);
  }, []);

  const dismissUrlError = useCallback(() => setUrlError(null), []);

  // Browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const next = parseUrlState(window.location.search);
      if (next) {
        setUrlState(next);
      } else {
        fallBackToDefault();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fallBackToDefault]);

  return { urlState, syncToUrl, urlError, dismissUrlError, fallBackToDefault };
}
