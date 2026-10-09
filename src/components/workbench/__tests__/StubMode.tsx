/**
 * A stand-in for every mode in the shell's tests, so they exercise the frame and not the
 * screens other folders own. It reads the device and keeps two pieces of view state, one
 * of them under the "model/" prefix.
 */
import { useFocus } from '../FocusContext';
import type { ModeProps } from '../mode-registry';
import { useViewState } from '../ViewStateContext';

export const STUB_NOTE_KEY = 'explore/stub/note';
export const STUB_LENS_KEY = 'model/stub/lens';

export default function StubMode({ viewId }: ModeProps) {
  const { dispatch, referenceData, engineData, report } = useFocus();
  const [note, setNote] = useViewState(STUB_NOTE_KEY, '');
  const [lens, setLens] = useViewState(STUB_LENS_KEY, '');
  const otherClass = referenceData.archetypes[1];
  const firstRiskId = report.riskRows[0].riskId;

  return (
    <div>
      <p data-testid="stub-view">{viewId}</p>
      <label>Note <input value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <label>Lens <input value={lens} onChange={(event) => setLens(event.target.value)} /></label>
      <button type="button" onClick={() => dispatch({ type: 'preset-selected', archetype: otherClass, registrarVersion: engineData.registrarVersion })}>
        Pick another class
      </button>
      <button type="button" onClick={() => dispatch({ type: 'risk-decided', riskId: firstRiskId, status: 'mitigated', note: '' })}>
        Decide a risk
      </button>
      <div id="lab-results">Results region</div>
    </div>
  );
}
