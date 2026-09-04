import { useEffect, useRef } from 'react';

// How long the app can sit genuinely untouched (no mouse, keyboard, touch or
// scroll input) before automatically signing the user out — distinct from
// the much shorter privacy blur (which just hides the screen) and from the
// 30-day "remember me" session cookie (which keeps you signed in across
// separate visits). This only fires while a tab is open and idle for a long
// stretch of continuous inactivity.
const IDLE_LOGOUT_MS = 30 * 60 * 1000;

const CHECK_INTERVAL_MS = 30_000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;

/**
 * Signs the user out after a long period of true inactivity within an open
 * session. Pass `enabled` as whether the user is currently authenticated —
 * the timer only runs while there's someone to log out.
 */
export function useIdleLogout(enabled: boolean, onIdle: () => void) {
  const lastActivityRef = useRef(Date.now());
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled) return;
    lastActivityRef.current = Date.now();

    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActivity, { passive: true }));

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > IDLE_LOGOUT_MS) {
        onIdleRef.current();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActivity));
      clearInterval(interval);
    };
  }, [enabled]);
}
