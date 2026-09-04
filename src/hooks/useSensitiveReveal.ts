import { useCallback, useState } from 'react';

/**
 * Tracks which individually-blurred sensitive figures (e.g. salary, monthly
 * totals, left-after-bills) have been explicitly revealed this session.
 *
 * Deliberately separate from the app-wide privacy screen (usePrivacyBlur):
 * these figures stay blurred even when that screen is turned off, and each
 * one only un-blurs on its own explicit click — revealing one doesn't
 * reveal the others. Once revealed, a figure stays visible for the rest of
 * the session (until reload/logout), including across tab switches, since
 * this state lives above the tab-switching logic in app/page.tsx.
 */
export function useSensitiveReveal() {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());

  const isRevealed = useCallback((id: string) => revealedIds.has(id), [revealedIds]);

  const reveal = useCallback((id: string) => {
    setRevealedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  return { isRevealed, reveal };
}
