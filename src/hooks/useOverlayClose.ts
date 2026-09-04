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
 *
 * IMPORTANT — do NOT use this for modals that contain a data-entry form
 * (anything with typed/selected values that only get saved on an explicit
 * Save/Add button, e.g. AccountModal, ExpenseModal, TransferModal,
 * GoalModal, IncomeModal, ShareWorkspaceModal, ContactVendorModal,
 * ScanReceiptModal, the Money Map node/edge forms). Even with the fix
 * above, click-outside-to-close on those modals silently discards
 * whatever the user just typed, which is worse than the text-selection
 * bug this hook was originally written to solve. For those, leave the
 * overlay as a plain `<div className="modal-overlay">` (no handlers) and
 * only close via the explicit X / Cancel button.
 *
 * Only use this hook for modals with no unsaved-state risk: read-only
 * viewers (HelpGuideModal, ChangelogModal), or browse/search/action
 * modals whose actions apply immediately rather than staging a draft
 * (PresetsModal, SettingsModal, AdminBackupModal, ExportImportModal).
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
