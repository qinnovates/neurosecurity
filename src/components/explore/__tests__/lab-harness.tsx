/** Test-only: the real catalog, placement table, classes and chains, and a Lab to render a screen in. */
import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { loadTaraChains } from '@/components/atlas/load-tara-chains';
import { FocusProvider } from '@/components/workbench/FocusContext';
import { ViewStateProvider } from '@/components/workbench/ViewStateContext';
import { createViewStateStore, type ViewStateStore } from '@/components/workbench/view-state-store';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';

const bundle = loadEngineBundle();
export const engineData = bundle.engineData;
export const referenceData = loadReferenceData(bundle);
export const curatedChains = loadTaraChains();

/** A view-state store that lives in memory only, as the shell's does when storage is blocked. */
export function createMemoryStore(): ViewStateStore {
  return createViewStateStore(null);
}

function Lab({ store, children }: { store: ViewStateStore | undefined; children: ReactNode }) {
  const focused = <FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={curatedChains}>{children}</FocusProvider>;
  return store === undefined ? focused : <ViewStateProvider store={store}>{focused}</ViewStateProvider>;
}

/** Renders a screen with the device the Lab opens on. Pass a store to keep view state across renders. */
export function inLab(children: ReactNode, store?: ViewStateStore): RenderResult {
  return render(<Lab store={store}>{children}</Lab>);
}
