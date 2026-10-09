import { useId, useState, type ReactNode } from 'react';

interface Props {
  label: string;
  /** Called the first time the panel opens, so its content can load then and not before. */
  onFirstOpen?: () => void;
  children: ReactNode;
}

/** A real button that shows or hides a panel. The panel stays out of the page until it is opened. */
export default function Disclosure({ label, onFirstOpen, children }: Props) {
  const [isOpen, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const panelId = useId();

  const toggle = (): void => {
    if (!hasOpened) {
      setHasOpened(true);
      onFirstOpen?.();
    }
    setOpen((open) => !open);
  };

  return (
    <div className="atlas-disclosure" data-open={isOpen}>
      <button type="button" className="atlas-disclosure-button" aria-expanded={isOpen} aria-controls={panelId} onClick={toggle}>
        <svg className="atlas-chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M4 2 8 6 4 10" /></svg>
        {label}
      </button>
      <div className="atlas-disclosure-panel" id={panelId} hidden={!isOpen}>
        {isOpen && children}
      </div>
    </div>
  );
}
