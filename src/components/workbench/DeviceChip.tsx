import { useEffect, useRef } from 'react';
import { describeDevice, summariseDevice } from './device-summary';
import { useFocus } from './FocusContext';

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

/**
 * The device every mode is looking at, in the same place on every screen. Opening it
 * shows the full facts and where the device is saved.
 */
export default function DeviceChip() {
  const { state, report, isRemembered, setRemembered, storageNotice } = useFocus();
  const summary = summariseDevice(state.model, report);
  const facts = describeDevice(summary);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // The panel floats over the screen, so it closes when the reader presses Escape or acts anywhere else.
  useEffect(() => {
    const close = (): void => { if (detailsRef.current !== null) detailsRef.current.open = false; };
    const closeOnOutsidePress = (event: PointerEvent): void => {
      if (event.target instanceof Node && detailsRef.current?.contains(event.target) === false) close();
    };
    const closeOnEscape = (event: KeyboardEvent): void => { if (event.key === 'Escape') close(); };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div className="lab-device-slot">
      <details className="lab-device" ref={detailsRef}>
        <summary className="lab-device-summary">
          <DeviceGlyph partsAreInterface={summary.partsAreInterface} />
          <span className="sr-only">Device in focus: </span>
          <strong className="lab-device-name">{summary.name}</strong>
          <span className="lab-device-facts lab-soft" aria-live="polite">{facts.join(' · ')}</span>
          {!isRemembered && <span className="lab-device-unsaved">Not saved</span>}
        </summary>
        <div className="lab-device-panel">
          <p className="lab-label">Device in focus</p>
          <p><strong>{summary.name}</strong></p>
          <ul className="lab-device-list">
            {facts.map((fact) => <li key={fact}>{fact}</li>)}
          </ul>
          <label className="lab-remember">
            <input id="workbench-remember" type="checkbox" checked={isRemembered} onChange={(event) => setRemembered(event.target.checked)} />
            <span>{isRemembered ? 'Saved in this browser' : 'Remember in this browser'}</span>
          </label>
          {!isRemembered && <p className="lab-device-unsaved">Not saved. A reload starts over.</p>}
        </div>
      </details>
      {storageNotice !== null && <p className="lab-device-alert" role="alert">{storageNotice}</p>}
    </div>
  );
}
