import { useCallback, useEffect, useRef, useState } from 'react';

// How long the screen can sit idle before sensitive data is auto-blurred.
const IDLE_TIMEOUT_MS = 90_000;

// Grace period before a window-blur event actually triggers the privacy
// screen. `window`'s blur event fires very eagerly — e.g. opening devtools,
// clicking a native <select>/date-picker, an autofill/password-manager
// popup, or just clicking the browser's address bar all momentarily blur
// the window even though the user never left the tab. Without a grace
// period the screen would flash-blur on virtually every interaction. If
// focus returns within this window, the pending blur is cancelled.
const WINDOW_BLUR_GRACE_MS = 600;

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

    let blurTimeout: ReturnType<typeof setTimeout> | null = null;
    const clearPendingBlur = () => {
      if (blurTimeout) {
        clearTimeout(blurTimeout);
        blurTimeout = null;
      }
    };
    const handleWindowBlur = () => {
      clearPendingBlur();
      blurTimeout = setTimeout(() => setIsBlurred(true), WINDOW_BLUR_GRACE_MS);
    };
    const handleWindowFocus = () => {
      clearPendingBlur();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

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
      window.removeEventListener('focus', handleWindowFocus);
      clearPendingBlur();
      clearInterval(interval);
    };
  }, []);

  return { isBlurred, reveal, blurNow, toggle };
}
