/** Test-only: renders a Model screen inside the two providers the shell gives it, with the real data files. */
import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FocusProvider } from '@/components/workbench/FocusContext';
import { forgetDeviceViews } from '@/components/workbench/use-lab-route';
import { createViewStateStore, type ViewStateStore } from '@/components/workbench/view-state-store';
import { ViewStateProvider } from '@/components/workbench/ViewStateContext';
import { engineData, referenceData } from '@/lib/threat-model/__tests__/preset-reports';

export interface LabRender extends RenderResult {
  store: ViewStateStore;
}

export function renderInLab(children: ReactNode, store: ViewStateStore = createViewStateStore(null)): LabRender {
  const result = render(
    <ViewStateProvider store={store}>
      <FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={[]} onDeviceReplaced={() => forgetDeviceViews(store)}>
        {children}
      </FocusProvider>
    </ViewStateProvider>,
  );
  return { ...result, store };
}
