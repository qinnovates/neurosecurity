import { useEffect, useId, useRef, useState, type FocusEvent } from 'react';
import DeviceMenu, { EXAMPLE_DEVICE_LABEL } from './DeviceMenu';
import { describeDevice, summariseDevice } from './device-summary';
import { useFocus } from './FocusContext';
import type { Route } from './route';

const DOT_SPACING = 12;
const DOT_RADIUS = 3;
const INTERFACE_DOT_RADIUS = 4.5;
const GLYPH_HEIGHT = 14;

/** The device as a row of dots, one per part; the filled dot is the part in contact with tissue. */
function DeviceGlyph({ partsAreInterface }: { partsAreInterface: readonly boolean[] }) {
  const width = DOT_SPACING * Math.max(1, partsAreInterface.length);
  const middle = GLYPH_HEIGHT / 2;
  return (
    <svg className="lab-device-glyph" viewBox={`0 0 ${width} ${GLYPH_HEIGHT}`} width={width} height={GLYPH_HEIGHT} aria-hidden="true">
      <path d={`M ${DOT_SPACING / 2} ${middle} H ${width - DOT_SPACING / 2}`} />
      {partsAreInterface.map((isInterface, index) => (
        <circle
          key={index} cx={DOT_SPACING / 2 + index * DOT_SPACING} cy={middle}
          r={isInterface ? INTERFACE_DOT_RADIUS : DOT_RADIUS} data-interface={isInterface}
        />
      ))}
    </svg>
  );
}

interface Props {
  onNavigate: (route: Route) => void;
  onEditDevice: () => void;
  onPrintReport: () => void;
  /** False where the screen itself states the device's facts (Model's header), so they are not printed twice. The menu always lists them. */
  hasFacts?: boolean;
}

const UNSAVED_LABEL = 'Unsaved changes';

/**
 * The device every mode is looking at, in the same place on every screen. Pressing it
 * opens the device menu: what can be done with the device, and where it is kept.
 */
export default function DeviceChip({ onNavigate, onEditDevice, onPrintReport, hasFacts = true }: Props) {
  const { state, report, isExampleDevice, hasUnsavedChanges, storageNotice } = useFocus();
  const summary = summariseDevice(state.model, report);
  const facts = describeDevice(summary);
  const [isOpen, setOpen] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // The menu floats over the screen, so it closes when the reader presses Escape or acts anywhere else.
  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsidePress = (event: PointerEvent): void => {
      if (event.target instanceof Node && slotRef.current?.contains(event.target) === false) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  /** Tabbing out of the menu closes it. Focus going nowhere (the file picker, another window) leaves it open. */
  const closeOnFocusOut = (event: FocusEvent<HTMLDivElement>): void => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <div className="lab-device-slot" ref={slotRef} onBlur={closeOnFocusOut}>
      <div className="lab-device">
        <button
          ref={buttonRef} type="button" className="lab-device-summary"
          aria-expanded={isOpen} aria-controls={isOpen ? menuId : undefined} onClick={() => setOpen((wasOpen) => !wasOpen)}
        >
          <DeviceGlyph partsAreInterface={summary.partsAreInterface} />
          <span className="lab-visually-hidden">Device in focus: </span>
          <strong className="lab-device-name">{isExampleDevice ? EXAMPLE_DEVICE_LABEL : summary.name}</strong>
          {hasFacts && <span className="lab-device-facts lab-soft">{facts.join(' · ')}</span>}
          {hasUnsavedChanges && <span className="lab-device-flag">{UNSAVED_LABEL}</span>}
        </button>
        {isOpen && (
          <DeviceMenu id={menuId} facts={facts} onNavigate={onNavigate} onEditDevice={onEditDevice} onPrintReport={onPrintReport} onClose={() => setOpen(false)} />
        )}
      </div>
      {storageNotice !== null && <p className="lab-device-alert" role="alert">{storageNotice}</p>}
    </div>
  );
}
