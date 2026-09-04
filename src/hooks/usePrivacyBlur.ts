import { useCallback, useEffect, useRef, useState } from 'react';

// How long the screen can sit idle before sensitive data is auto-blurred.
const IDLE_TIMEOUT_MS = 90_000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;

/**
 * Tracks user idle time and window focus to decide when sensitive
 * household financial data should be blurred from view — e.g. when the
 * tab loses focus (screen sharing another window, alt-tabbing away) or
 * the user has stepped away without touching the keyboard/mouse.
 *
 * Once blurred, content stays hidden until the user explicitly reveals
 * it (click-to-reveal), rather than auto-unblurring on the next bit of
 * mouse movement — this avoids accidentally exposing data while the
 * screen is still being shared/recorded.
 */
export function usePrivacyBlur() {
  const [isBlurred, setIsBlurred] = useState(false);
  const lastActivityRef = useRef(Date.now());

  const reveal = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsBlurred(false);
  }, []);

  const blurNow = useCallback(() => {
    setIsBlurred(true);
  }, []);

  const toggle = useCallback(() => {
    setIsBlurred((prev) => {
      if (prev) {
        lastActivityRef.current = Date.now();
        return false;
      }
      return true;
    });
  }, []);

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActivity, { passive: true }));

    const handleVisibilityChange = () => {
      if (document.hidden) setIsBlurred(true);
    };
    const handleWindowBlur = () => setIsBlurred(true);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    const interval = setInterval(() => {
      setIsBlurred((prev) => {
        if (prev) return prev;
        return Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS;
      });
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      clearInterval(interval);
    };
  }, []);

  return { isBlurred, reveal, blurNow, toggle };
}
