// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MODE_IDS } from '../mode-registry';
import { toHash } from '../route';
import { MODEL_KEY_PREFIX, MODEL_OVERVIEW_TARGET, MODEL_TECHNIQUE_TARGET, SHELL_TARGETS, TECHNIQUE_TARGET, VIEW_STATE_KEYS } from '../shell-targets';
import { useOpenTechnique, useShowTechniqueInModel } from '../use-open-technique';
import { MODE_VIEW_GROUPS, defaultViewId, findView } from '../view-registry';
import { createViewStateStore } from '../view-state-store';
import { ViewStateProvider } from '../ViewStateContext';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

function viewsOf(modeId: typeof MODE_IDS[number]): [string, string][] {
  return MODE_VIEW_GROUPS[modeId].flatMap((group) => group.views.map((view): [string, string] => [view.id, view.label]));
}

describe('view registry', () => {
  it('lists the Explore views under their version 2 labels, with the ids unchanged', () => {
    expect(viewsOf('explore')).toEqual([
      ['device-classes', 'Start'], ['catalog', 'Techniques'], ['curated-chains', 'Authored chains'], ['specifications', 'Published device specifications'],
    ]);
  });

  it('opens Model on the Overview and keeps every earlier view id', () => {
    expect(viewsOf('model')).toEqual([
      ['overview', 'Overview'], ['risks', 'Risks'], ['attack-map', 'Techniques by part'], ['chains', 'Chains'],
      ['around', 'Around the device'], ['requirements', 'FDA premarket checklist'], ['report', 'Report'],
    ]);
    expect(defaultViewId('model')).toBe('overview');
  });

  it('leaves Monitor and Query as they were, and deletes no mode', () => {
    expect(viewsOf('monitor')).toEqual([['signal', 'Signal']]);
    expect(viewsOf('query')).toEqual([['console', 'Query console']]);
    expect(Object.keys(MODE_VIEW_GROUPS).sort()).toEqual([...MODE_IDS].sort());
  });

  it('never names the product as something it is not, in any label', () => {
    const labels = MODE_IDS.flatMap((modeId) => viewsOf(modeId).map(([, label]) => label));
    for (const label of labels) expect(label).not.toMatch(/siem|scanner|detection/i);
  });
});

describe('shell targets', () => {
  it('names only screens the registry has', () => {
    for (const target of SHELL_TARGETS) expect(findView(target.modeId, target.viewId)).not.toBeNull();
    expect(MODEL_OVERVIEW_TARGET).toEqual({ modeId: 'model', viewId: defaultViewId('model') });
  });

  it('keeps the technique lens under the prefix that is cleared with the device', () => {
    expect(VIEW_STATE_KEYS.modelLensTechniqueId.startsWith(MODEL_KEY_PREFIX)).toBe(true);
    expect(VIEW_STATE_KEYS.modelSelectedElementId.startsWith(MODEL_KEY_PREFIX)).toBe(true);
  });
});

function Openers() {
  const openTechnique = useOpenTechnique();
  const showInModel = useShowTechniqueInModel();
  return (
    <>
      <button type="button" onClick={() => openTechnique('QIF-T0001')}>Open</button>
      <button type="button" onClick={() => showInModel('QIF-T0002')}>Show in Model</button>
    </>
  );
}

describe('useOpenTechnique', () => {
  it('hands the technique to the catalog through view state and changes the address to it, without the id', () => {
    const store = createViewStateStore(null);
    render(<ViewStateProvider store={store}><Openers /></ViewStateProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(store.read(VIEW_STATE_KEYS.catalogOpenedTechniqueId)).toBe('QIF-T0001');
    expect(window.location.hash).toBe(toHash(TECHNIQUE_TARGET));
    expect(window.location.hash).not.toContain('T0001');
  });

  it('narrows Model to a technique through the lens key and opens the register', () => {
    const store = createViewStateStore(null);
    render(<ViewStateProvider store={store}><Openers /></ViewStateProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Show in Model' }));
    expect(store.read(VIEW_STATE_KEYS.modelLensTechniqueId)).toBe('QIF-T0002');
    expect(window.location.hash).toBe(toHash(MODEL_TECHNIQUE_TARGET));
  });

  it('still navigates outside the shell, where there is no store to write', () => {
    render(<Openers />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(window.location.hash).toBe(toHash(TECHNIQUE_TARGET));
  });
});
