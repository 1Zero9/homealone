import { useRef, useCallback } from 'react';

/**
 * Click-outside-to-close for modal overlays, without the classic bug where
 * selecting text inside the modal (e.g. dragging to select in a textarea or
 * input) and releasing the mouse button past the modal's edge closes it —
 * because a browser "click" event fires based on where the mouse button is
 * released, not where the drag started, so a plain `onClick={onClose}` on
 * the overlay div fires even though the interaction began inside the modal.
 *
 * Fix: only close when BOTH the mousedown and the click landed directly on
 * the overlay itself (never bubbled up from a child), i.e. the whole
 * press-and-release happened on the empty backdrop.
 *
 * Usage: spread the returned handlers onto the overlay div —
 *   <div className="modal-overlay" {...useOverlayClose(onClose)}>
 */
export function useOverlayClose(onClose: () => void) {
  const mouseDownOnOverlay = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    mouseDownOnOverlay.current = e.target === e.currentTarget;
  }, []);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && mouseDownOnOverlay.current) {
        onClose();
      }
      mouseDownOnOverlay.current = false;
    },
    [onClose]
  );

  return { onMouseDown, onClick };
}
