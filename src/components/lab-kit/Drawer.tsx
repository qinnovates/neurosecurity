import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

interface Props {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  /** Controls beside the title, before the close button. */
  actions?: ReactNode;
  /**
   * Keeps Tab inside the drawer while it is open. Turn it off only where the reader must
   * keep working in the table beside the drawer; Escape and the close button work either way.
   */
  isFocusTrapped?: boolean;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** Where Tab should land when it would leave the panel; null when it can carry on by itself. */
function wrapTarget(panel: HTMLElement, isBackward: boolean): HTMLElement | null {
  const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  if (focusable.length === 0) return panel;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const current = document.activeElement;
  if (isBackward && (current === first || current === panel)) return last;
  if (!isBackward && current === last) return first;
  return null;
}

type PanelProps = Omit<Props, 'isOpen'>;

function DrawerPanel({ title, onClose, actions, isFocusTrapped = true, children }: PanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();

  // Focus moves into the drawer when it opens and back to where it was when it closes.
  useEffect(() => {
    const opener = document.activeElement;
    panelRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  const handleKey = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !isFocusTrapped || panelRef.current === null) return;
    const target = wrapTarget(panelRef.current, event.shiftKey);
    if (target === null) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <aside
      ref={panelRef} className="lab-drawer" role={isFocusTrapped ? 'dialog' : undefined} aria-modal={isFocusTrapped ? true : undefined}
      aria-labelledby={titleId} tabIndex={-1} onKeyDown={handleKey}
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
 * under 720px. Escape closes it, and focus returns to whatever opened it.
 */
export default function Drawer({ isOpen, ...panelProps }: Props) {
  return isOpen ? <DrawerPanel {...panelProps} /> : null;
}
