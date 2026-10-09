// @vitest-environment jsdom
/**
 * The Model frame with the real data files. The diagram, the editor and the screens other
 * folders own are stood in for, so this exercises the frame and not their work in progress.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { screen, cleanup, fireEvent, within, act } from '@testing-library/react';
import { useEffect, type ReactNode } from 'react';
import { useFocus } from '@/components/workbench/FocusContext';
import { VIEW_STATE_KEYS } from '@/components/workbench/shell-targets';
import { MODE_VIEW_GROUPS } from '@/components/workbench/view-registry';
import { createViewStateStore } from '@/components/workbench/view-state-store';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import { PRESETS } from '@/lib/threat-model/__tests__/preset-reports';
import ThreatModelStudio from '../../ThreatModelStudio';
import { stubMatchMedia } from '../../diagram/__tests__/match-media';
import { MODEL_STATE_KEYS, MODEL_VIEWS } from '../model-view-keys';
import { NARROW_SCREEN_QUERY, OPEN_DRAWING_MAX_HEIGHT, SHORT_SCREEN_QUERY, isDiagramOpenByDefault } from '../use-diagram-fold';
import { renderInLab } from './render-in-lab';

interface CanvasStandInProps {
  lens: { elementId: string | null };
  selectedChain: { chain_id: string } | null;
  elementCounts?: unknown[];
  isOpen?: boolean;
  onToggleOpen?: () => void;
  folded?: ReactNode;
}
vi.mock('../../DeviceCanvas', () => ({
  default: ({ lens, selectedChain, elementCounts, isOpen = true, onToggleOpen, folded }: CanvasStandInProps) => (
    <div
      data-testid="diagram" data-element={lens.elementId ?? ''} data-chain={selectedChain?.chain_id ?? ''} data-counts={elementCounts?.length ?? -1}
      data-open={isOpen} data-foldable={onToggleOpen !== undefined}
    >
      {onToggleOpen !== undefined && <button type="button" onClick={onToggleOpen}>Fold stand-in</button>}
      {!isOpen && folded}
    </div>
  ),
}));
vi.mock('../../editor/DeviceEditor', () => ({ default: () => <button type="button">Editor stand-in</button> }));
vi.mock('../../PartStrip', () => ({
  default: ({ elementCounts }: { elementCounts?: unknown[] }) => <div data-testid="part-strip" data-counts={elementCounts?.length ?? -1} />,
}));
vi.mock('../../TargetRegionsPanel', () => ({
  default: ({ invasiveness }: { invasiveness?: string }) => <div data-testid="target-regions" data-invasiveness={invasiveness ?? ''} />,
}));
vi.mock('../../ReportView', () => ({ default: () => <div data-testid="report" /> }));
vi.mock('../../ComplianceChecklist', () => ({ default: () => <div data-testid="checklist" /> }));

const [, headset] = PRESETS[0];
const modelViewIds = MODE_VIEW_GROUPS.model.flatMap((group) => group.views.map((view) => view.id));
const catalogRows = headset.report.riskRows.filter((row) => row.source === 'catalog');
const FACET_BAR = 'Filter this device\'s rows';

let restoreMatchMedia: (() => void) | null = null;
beforeEach(() => {
  window.location.hash = '';
});
afterEach(() => {
  cleanup();
  restoreMatchMedia?.();
  restoreMatchMedia = null;
});

function renderModel(viewId: string, store = createViewStateStore(null)) {
  const onSelectView = vi.fn();
  const view = renderInLab(<ThreatModelStudio viewId={viewId} onSelectView={onSelectView} onOpenMode={() => undefined} />, store);
  return { ...view, onSelectView };
}

function registerRows(): HTMLElement[] {
  return within(screen.getByRole('region', { name: 'Risk register' })).getAllByRole('row').slice(1);
}

describe('Model frame', () => {
  it('draws every view the registry lists for Model, and marks a results region on each of its own', () => {
    for (const viewId of modelViewIds) {
      const { container } = renderModel(viewId);
      expect(screen.getByRole('heading', { name: new RegExp(headset.model.name) })).toBeTruthy();
      const isForeign = viewId === MODEL_VIEWS.requirements || viewId === MODEL_VIEWS.report;
      expect(container.querySelectorAll('#lab-results')).toHaveLength(isForeign ? 0 : 1);
      cleanup();
    }
    expect(modelViewIds).toEqual(Object.values(MODEL_VIEWS));
  });

  it('shows the diagram only on Overview, Risks, Techniques by part and Chains', () => {
    for (const viewId of modelViewIds) {
      renderModel(viewId);
      const hasDiagram = ['overview', 'risks', 'attack-map', 'chains'].includes(viewId);
      expect(screen.queryAllByTestId('diagram')).toHaveLength(hasDiagram ? 1 : 0);
      cleanup();
    }
  });

  it('shows the facet bar only on Risks and Techniques by part, with no second way to choose a part where the diagram is', () => {
    for (const viewId of modelViewIds) {
      renderModel(viewId);
      const bars = screen.queryAllByRole('group', { name: FACET_BAR });
      // Chains are narrowed by the part alone, and beside a diagram the diagram chooses it.
      expect(bars).toHaveLength(['risks', 'attack-map'].includes(viewId) ? 1 : 0);
      expect(screen.queryByRole('combobox', { name: 'Part or connection' })).toBeNull();
      cleanup();
    }
  });

  it('offers the Part select on a phone, where the drawing gives way to a folded list: on Chains it is the only facet', () => {
    restoreMatchMedia = stubMatchMedia([NARROW_SCREEN_QUERY]);
    for (const viewId of ['risks', 'attack-map', 'chains']) {
      renderModel(viewId);
      const bar = screen.getByRole('group', { name: FACET_BAR });
      expect(within(bar).getByRole('combobox', { name: 'Part or connection' })).toBeTruthy();
      if (viewId === 'chains') expect(within(bar).getAllByRole('group').map((group) => group.querySelector('legend')?.textContent)).toEqual(['Part']);
      expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('false');
      expect(screen.queryByTestId('part-strip')).toBeNull();
      cleanup();
    }
  });

  it('gives the device\'s name the screen title, and the names the kit moves across a change of view', () => {
    const { container } = renderModel('risks');
    const title = screen.getByRole('heading', { name: new RegExp(headset.model.name) });
    expect(title.classList.contains('lab-title')).toBe(true);
    expect(container.querySelectorAll('.lab-vt-identity')).toHaveLength(1);
    expect(container.querySelectorAll('.lab-vt-diagram')).toHaveLength(1);
    expect(container.querySelector('.lab-vt-diagram')?.contains(screen.getByTestId('diagram'))).toBe(true);
    cleanup();
    const overview = renderModel('overview');
    expect(overview.container.querySelectorAll('.lab-vt-diagram')).toHaveLength(1);
  });

  it('has no Save, Load or Export button of its own: those live in the device menu', () => {
    for (const viewId of modelViewIds) {
      const { container } = renderModel(viewId);
      expect(screen.queryByRole('button', { name: /^(save|load|export)\b/i })).toBeNull();
      expect(container.querySelector('input[type="file"]')).toBeNull();
      cleanup();
    }
  });

  it('hands the diagram a count for every part and connection', () => {
    renderModel('risks');
    expect(screen.getByTestId('diagram').getAttribute('data-counts')).toBe(String(listElementsInModelOrder(headset.model).length));
  });
});

describe('view state under "model/"', () => {
  it('narrows to the part the shell hands over, and writes a part chosen here back under the same key', () => {
    const store = createViewStateStore(null);
    const [first, second] = listElementsInModelOrder(headset.model);
    store.write(VIEW_STATE_KEYS.modelSelectedElementId, first.id);
    restoreMatchMedia = stubMatchMedia([NARROW_SCREEN_QUERY]);
    renderModel('risks', store);
    const select = screen.getByRole('combobox', { name: 'Part or connection' }) as HTMLSelectElement;
    expect(select.value).toBe(first.id);
    expect(screen.getByTestId('diagram').getAttribute('data-element')).toBe(first.id);
    fireEvent.change(select, { target: { value: second.id } });
    expect(store.read(VIEW_STATE_KEYS.modelSelectedElementId)).toBe(second.id);
  });

  it('narrows the register to the technique handed over by "Show in Model", and clears it from its chip', () => {
    const store = createViewStateStore(null);
    const techniqueId = catalogRows[0].techniqueId as string;
    store.write(VIEW_STATE_KEYS.modelLensTechniqueId, techniqueId);
    renderModel('risks', store);
    expect(registerRows()).toHaveLength(catalogRows.filter((row) => row.techniqueId === techniqueId).length);
    fireEvent.click(screen.getByRole('button', { name: /\(clear\)$/ }));
    expect(store.read(VIEW_STATE_KEYS.modelLensTechniqueId)).toBeNull();
    expect(registerRows()).toHaveLength(catalogRows.length);
  });

  it('ignores a part, a technique and facets from storage that name nothing on this device', () => {
    const store = createViewStateStore(null);
    store.write(VIEW_STATE_KEYS.modelSelectedElementId, 'not-a-part');
    store.write(VIEW_STATE_KEYS.modelLensTechniqueId, 'QIF-T9999');
    store.write(MODEL_STATE_KEYS.lensFacets, { goals: ['<script>'] });
    renderModel('risks', store);
    expect(screen.getByTestId('diagram').getAttribute('data-element')).toBe('');
    expect(registerRows()).toHaveLength(catalogRows.length);
    expect(screen.queryByRole('button', { name: 'Show everything' })).toBeNull();
  });

  it('keeps a filter across views: an effect chosen on Risks still narrows Techniques by part', () => {
    const store = createViewStateStore(null);
    renderModel('risks', store);
    fireEvent.click(screen.getByRole('button', { name: /^Read \d+$/ }));
    const readTechniques = new Set(catalogRows.filter((row) => row.goal === 'read').map((row) => row.techniqueId));
    cleanup();
    renderModel('attack-map', store);
    expect(within(screen.getByRole('region', { name: 'Techniques by part' })).getAllByRole('row')).toHaveLength(readTechniques.size + 2);
    expect(screen.getByRole('button', { name: 'Show everything' })).toBeTruthy();
  });

  it('draws the chosen chain on the diagram only on the Chains view, and still has it chosen on return', () => {
    const store = createViewStateStore(null);
    const chainId = headset.report.chainResult.chains[0].chain_id;
    store.write(MODEL_STATE_KEYS.selectedChainId, chainId);
    renderModel('risks', store);
    expect(screen.getByTestId('diagram').getAttribute('data-chain')).toBe('');
    cleanup();
    renderModel('chains', store);
    expect(screen.getByTestId('diagram').getAttribute('data-chain')).toBe(chainId);
  });
});

describe('the fold of the diagram', () => {
  const [, cortical] = PRESETS[1];

  it('opens by itself only for a drawing one row of parts tall on a screen tall enough, and never on a phone', () => {
    const fits = { isNarrow: false, isShort: false, drawingHeight: OPEN_DRAWING_MAX_HEIGHT, hasChain: false };
    expect(isDiagramOpenByDefault(fits)).toBe(true);
    expect(isDiagramOpenByDefault({ ...fits, drawingHeight: OPEN_DRAWING_MAX_HEIGHT + 1 })).toBe(false);
    expect(isDiagramOpenByDefault({ ...fits, isShort: true })).toBe(false);
    expect(isDiagramOpenByDefault({ ...fits, isShort: true, hasChain: true })).toBe(true);
    expect(isDiagramOpenByDefault({ ...fits, isNarrow: true, hasChain: true })).toBe(false);
  });

  it('is open for the headset and can be folded; the choice is kept and holds on every working view', () => {
    const store = createViewStateStore(null);
    renderModel('risks', store);
    expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('true');
    expect(store.read(MODEL_STATE_KEYS.isDiagramOpen) ?? null).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Fold stand-in' }));
    expect(store.read(MODEL_STATE_KEYS.isDiagramOpen)).toBe(false);
    expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('false');
    // Folded, the row of parts stands in for the drawing, with a count for every part and connection.
    expect(screen.getByTestId('part-strip').getAttribute('data-counts')).toBe(String(listElementsInModelOrder(headset.model).length));
    cleanup();
    for (const viewId of ['attack-map', 'chains']) {
      renderModel(viewId, store);
      expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('false');
      cleanup();
    }
    renderModel('overview', store);
    // The Overview always shows the drawing where there is one, and offers no fold.
    expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('true');
    expect(screen.getByTestId('diagram').getAttribute('data-foldable')).toBe('false');
  });

  it('starts folded on a short screen, and for a device whose drawing is taller than one row of parts', () => {
    restoreMatchMedia = stubMatchMedia([SHORT_SCREEN_QUERY]);
    renderModel('risks');
    expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('false');
    cleanup();
    restoreMatchMedia();
    restoreMatchMedia = null;
    renderInLab(<><LoadModel model={cortical.model} /><ThreatModelStudio viewId="risks" onSelectView={() => undefined} onOpenMode={() => undefined} /></>);
    act(() => undefined);
    expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Fold stand-in' }));
    expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('true');
  });

  it('unfolds for a chain drawn on it unless the reader folded it, and folds the phone\'s list on the Overview too', () => {
    const store = createViewStateStore(null);
    store.write(MODEL_STATE_KEYS.selectedChainId, headset.report.chainResult.chains[0].chain_id);
    restoreMatchMedia = stubMatchMedia([SHORT_SCREEN_QUERY]);
    renderModel('chains', store);
    expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Fold stand-in' }));
    expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('false');
    cleanup();
    restoreMatchMedia();
    restoreMatchMedia = stubMatchMedia([NARROW_SCREEN_QUERY]);
    renderModel('overview');
    expect(screen.getByTestId('diagram').getAttribute('data-open')).toBe('false');
    expect(screen.getByTestId('diagram').getAttribute('data-foldable')).toBe('true');
  });

  it('tells the regions panel how the device contacts the body', () => {
    const store = createViewStateStore(null);
    const tissuePart = headset.model.components.find((component) => component.isNeuralInterface);
    if (tissuePart === undefined) throw new Error('test setup: the preset has no tissue-contact part');
    store.write(VIEW_STATE_KEYS.modelSelectedElementId, tissuePart.id);
    renderModel('risks', store);
    expect(screen.getByTestId('target-regions').getAttribute('data-invasiveness')).toBe(headset.model.invasiveness);
  });
});

describe('Overview in the frame', () => {
  it('shows the whole device whatever was filtered elsewhere, and a part chosen there opens its rows', () => {
    const store = createViewStateStore(null);
    const [first] = listElementsInModelOrder(headset.model);
    store.write(VIEW_STATE_KEYS.modelSelectedElementId, first.id);
    const { onSelectView } = renderModel('overview', store);
    expect(screen.getByTestId('diagram').getAttribute('data-element')).toBe('');
    const lines = within(screen.getByRole('region', { name: 'Open rows by part and connection' })).getAllByRole('button');
    fireEvent.click(lines[1]);
    expect(store.read(VIEW_STATE_KEYS.modelSelectedElementId)).toBe(listElementsInModelOrder(headset.model)[1].id);
    expect(onSelectView).toHaveBeenCalledWith('risks');
  });

  it('opens a top row in the register, with its detail', () => {
    const store = createViewStateStore(null);
    const { onSelectView } = renderModel('overview', store);
    const topRows = within(screen.getByRole('region', { name: 'Top open rows' })).getAllByRole('row').slice(1);
    fireEvent.keyDown(topRows[0], { key: 'Enter' });
    expect(onSelectView).toHaveBeenCalledWith('risks');
    expect(store.read(MODEL_STATE_KEYS.openedRiskId)).toBe(topRows[0].getAttribute('data-reflow-key'));
  });
});

describe('the risk drawer', () => {
  it('opens beside the register with focus inside, and Escape closes it and returns focus to the row', () => {
    const { store } = renderModel('risks');
    const [row] = registerRows();
    const riskId = row.getAttribute('data-reflow-key');
    row.focus();
    fireEvent.keyDown(row, { key: 'Enter' });
    const drawer = screen.getByRole('complementary');
    expect(drawer.contains(document.activeElement)).toBe(true);
    expect(store.read(MODEL_STATE_KEYS.openedRiskId)).toBe(riskId);
    expect(row.getAttribute('aria-current')).toBe('true');
    // An inspector beside a table: Tab is free to leave it, so it is not announced as a modal dialog.
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.keyDown(within(drawer).getByRole('combobox', { name: 'Decision' }), { key: 'Escape' });
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(store.read(MODEL_STATE_KEYS.openedRiskId)).toBeNull();
    expect(document.activeElement).toBe(registerRows().find((candidate) => candidate.getAttribute('data-reflow-key') === riskId));
  });

  it('puts focus on the row when it closes and whatever opened it is gone', () => {
    const store = createViewStateStore(null);
    store.write(MODEL_STATE_KEYS.openedRiskId, catalogRows[0].riskId);
    renderModel('risks', store);
    fireEvent.click(within(screen.getByRole('complementary')).getByRole('button', { name: 'Close' }));
    expect(document.activeElement?.getAttribute('data-reflow-key')).toBe(catalogRows[0].riskId);
  });

  it('records Mitigated from the row at once, and the row moves without leaving the register', () => {
    renderModel('risks');
    const [row] = registerRows();
    const riskId = row.getAttribute('data-reflow-key');
    fireEvent.change(within(row).getByRole('combobox'), { target: { value: 'mitigated' } });
    const moved = registerRows().find((candidate) => candidate.getAttribute('data-reflow-key') === riskId) as HTMLElement;
    expect((within(moved).getByRole('combobox') as HTMLSelectElement).value).toBe('mitigated');
    expect(moved.getAttribute('data-quiet')).toBe('true');
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('does not record Accepted from the row without a note: the drawer opens for it, and the note records it', () => {
    renderModel('risks');
    const [row] = registerRows();
    const riskId = row.getAttribute('data-reflow-key');
    const rowOf = (): HTMLElement => registerRows().find((candidate) => candidate.getAttribute('data-reflow-key') === riskId) as HTMLElement;
    fireEvent.change(within(row).getByRole('combobox'), { target: { value: 'accepted' } });
    expect((within(rowOf()).getByRole('combobox') as HTMLSelectElement).value).toBe('open');
    const drawer = screen.getByRole('complementary');
    expect(within(drawer).getByRole('alert').textContent).toContain('A note is required for Accepted and Not applicable.');
    expect((within(drawer).getByRole('combobox', { name: 'Decision' }) as HTMLSelectElement).value).toBe('accepted');

    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Note for this decision' }), { target: { value: 'Residual risk accepted by the safety board' } });
    expect((within(rowOf()).getByRole('combobox') as HTMLSelectElement).value).toBe('accepted');
    expect(within(drawer).queryByRole('alert')).toBeNull();
  });

  it('opens a row from Techniques by part in place', () => {
    const { onSelectView } = renderModel('attack-map');
    const [first] = catalogRows;
    fireEvent.click(screen.getByRole('button', { name: `${first.title} on ${first.elementLabel}: Open` }));
    expect(within(screen.getByRole('complementary')).getByRole('heading', { name: first.title })).toBeTruthy();
    expect(onSelectView).not.toHaveBeenCalled();
  });
});

describe('the device editor', () => {
  it('opens as a drawer when the shell asks, traps focus as a dialog, and closing it writes the key back', () => {
    const store = createViewStateStore(null);
    store.write(VIEW_STATE_KEYS.modelEditorOpen, true);
    renderModel('around', store);
    const dialog = screen.getByRole('dialog', { name: 'Device editor' });
    expect(within(dialog).getByRole('button', { name: 'Editor stand-in' })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(store.read(VIEW_STATE_KEYS.modelEditorOpen)).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens from the header on any view', () => {
    const { store } = renderModel('report');
    fireEvent.click(screen.getByRole('button', { name: 'Edit device' }));
    expect(store.read(VIEW_STATE_KEYS.modelEditorOpen)).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Device editor' })).toBeTruthy();
  });
});

function LoadModel({ model }: { model: DeviceModel }) {
  const { dispatch } = useFocus();
  useEffect(() => dispatch({ type: 'model-imported', model }), [dispatch, model]);
  return null;
}

describe('decisions without a row', () => {
  it('are listed under the register with their cause, and a row kept only for its decision is not in the register', () => {
    const orphanModel: DeviceModel = {
      ...headset.model,
      riskDecisions: [
        { riskId: 'removed-part::QIF-T0001', status: 'accepted', note: 'Signed off' },
        { riskId: `${headset.model.components[0].id}::QIF-T9999`, status: 'mitigated', note: '' },
      ],
    };
    const store = createViewStateStore(null);
    renderInLab(<><LoadModel model={orphanModel} /><ThreatModelStudio viewId="risks" onSelectView={() => undefined} onOpenMode={() => undefined} /></>, store);
    act(() => undefined);
    const panel = screen.getByRole('region', { name: 'Decisions without a row' });
    expect(within(panel).getAllByRole('listitem')).toHaveLength(2);
    expect(panel.textContent).toContain('The part or connection this decision was recorded on is no longer in the model.');
    expect(panel.textContent).toContain('The technique is no longer in the catalog.');
    expect(registerRows()).toHaveLength(catalogRows.length);
    expect(screen.getByRole('region', { name: 'Risk register' }).textContent).not.toContain('Technique no longer in the catalog');
  });

  it('are not shown when there are none', () => {
    renderModel('risks');
    expect(screen.queryByRole('region', { name: 'Decisions without a row' })).toBeNull();
  });
});
