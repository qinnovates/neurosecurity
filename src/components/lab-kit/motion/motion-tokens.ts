/**
 * The stylesheet's motion tokens, for moves that are made in script. A test holds these
 * equal to the values in styles/lab-tokens.css, so there is one set of numbers.
 */

/** Colour and press. `--lab-dur-1`. */
export const DURATION_QUICK_MS = 160;
/** Move and reveal. `--lab-dur-2`. */
export const DURATION_MOVE_MS = 280;
/** Drawer and view change. `--lab-dur-3`. */
export const DURATION_VIEW_MS = 420;
/** `--lab-ease`. */
export const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** How long a changed value stays marked: twice the view duration, as the stylesheet's highlight runs. */
export const CHANGED_FLAG_MS = DURATION_VIEW_MS * 2;
