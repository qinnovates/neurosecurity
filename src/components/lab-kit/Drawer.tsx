import { useCallback, useEffect, useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { makeOutsideInert } from './inert-outside';
import { useExitEnd } from './motion/use-exit-end';
import { useExitPresence } from './motion/use-exit-presence';

interface Props {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  /** Controls beside the title, before the close button. */
  actions?: ReactNode;
  /**
   * Keeps Tab inside the drawer while it is open, and makes the rest of the page inert. Turn it
   * off only where the reader must keep working in the table beside the drawer: Tab past its last
   * control then goes back to whatever opened it. Escape and the close button work either way.
   */
  isFocusTrapped?: boolean;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** True when Tab, in this direction, would carry focus out of the panel. */
function isLeavingPanel(panel: HTMLElement, isBackward: boolean): boolean {
  const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  const current = document.activeElement;
  if (focusable.length === 0) return true;
  return isBackward ? current === focusable[0] || current === panel : current === focusable[focusable.length - 1];
}

/** Where a trapped Tab lands instead of leaving: the other end of the panel. */
function otherEnd(panel: HTMLElement, isBackward: boolean): HTMLElement {
  const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  if (focusable.length === 0) return panel;
  return isBackward ? focusable[focusable.length - 1] : focusable[0];
}

type PanelProps = Omit<Props, 'isOpen'> & { isClosing: boolean; onExited: () => void };

function DrawerPanel({ title, onClose, actions, isFocusTrapped = true, isClosing, onExited, children }: PanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  useExitEnd(panelRef, isClosing, onExited);

  /** Hands focus back to whatever opened the drawer, once, if it is still on the page. */
  const returnFocus = useCallback((): void => {
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener?.isConnected === true) opener.focus();
  }, []);

  // Remembered before anything else touches the page: making the page inert takes focus off the opener.
  useLayoutEffect(() => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, []);

  // A trapped drawer is modal: nothing behind it can be worked while it is open. Declared before the
  // focus effects, so the page is released before focus is handed back to something on it.
  useEffect(() => {
    if (!isFocusTrapped || isClosing || panelRef.current === null) return undefined;
    return makeOutsideInert(panelRef.current);
  }, [isFocusTrapped, isClosing]);

  // Focus moves into the drawer when it opens, and back as soon as it starts to leave.
  useEffect(() => {
    panelRef.current?.focus();
    return returnFocus;
  }, [returnFocus]);
  useEffect(() => {
    if (isClosing) returnFocus();
  }, [isClosing, returnFocus]);

  const handleTab = (event: KeyboardEvent<HTMLElement>, panel: HTMLElement): void => {
    if (!isLeavingPanel(panel, event.shiftKey)) return;
    const target = isFocusTrapped ? otherEnd(panel, event.shiftKey) : openerRef.current;
    // An opener that has left the page cannot take focus back; Tab then carries on by itself.
    if (target === null || !target.isConnected) return;
    event.preventDefault();
    target.focus();
  };
  const handleKey = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    } else if (event.key === 'Tab' && panelRef.current !== null) {
      handleTab(event, panelRef.current);
    }
  };

  return (
    <aside
      ref={panelRef} className="lab-drawer" role={isFocusTrapped ? 'dialog' : undefined} aria-modal={isFocusTrapped ? true : undefined}
      aria-labelledby={titleId} tabIndex={-1} data-closing={isClosing ? 'true' : undefined} inert={isClosing}
      onKeyDown={handleKey}
    >
      <div className="lab-drawer-head">
        <h2 className="lab-drawer-title" id={titleId}>{title}</h2>
        <div className="lab-drawer-actions">
          {actions}
          <button type="button" className="lab-button" onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="lab-drawer-body">{children}</div>
    </aside>
  );
}

/**
 * The inspector. It springs in from the right beside the work, and rises as a bottom sheet
 * under 720px. Escape closes it, focus returns to whatever opened it, and it leaves in one
 * move: while it does, it shows what it last showed, however the caller's props have changed.
 */
export default function Drawer({ isOpen, ...panelProps }: Props) {
  const { isMounted, isClosing, finishClosing } = useExitPresence(isOpen);
  const shownRef = useRef(panelProps);
  // Kept from the last open render on purpose: a caller usually empties the title and content as it closes.
  if (isOpen) shownRef.current = panelProps;
  return isMounted ? <DrawerPanel {...shownRef.current} isClosing={isClosing} onExited={finishClosing} /> : null;
}
