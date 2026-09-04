/**
 * True if the user currently has a non-empty text selection anywhere on the
 * page. Used to guard "click the whole row to expand/collapse" handlers so
 * that finishing a text-selection drag (e.g. to copy an account number)
 * inside the row doesn't also toggle it — a mouseup at the end of a drag
 * still fires a native `click` event on whatever element it landed in, even
 * though the user's intent was to select text, not click.
 */
export function hasTextSelection(): boolean {
  if (typeof window === 'undefined') return false;
  const selection = window.getSelection();
  return !!selection && selection.toString().length > 0;
}
