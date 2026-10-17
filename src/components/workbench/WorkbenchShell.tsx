import { useCallback, useState } from 'react';
import type { AttackChain } from '@/components/atlas/AttackChainViz';
import type { EngineData } from '@/lib/threat-model/catalog-types';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import { FocusProvider } from './FocusContext';
import ShellFrame from './ShellFrame';
import { forgetDeviceViews } from './use-lab-route';
import { ViewStateProvider } from './ViewStateContext';
import { createViewStateStore } from './view-state-store';
import '@/components/lab-kit/lab-kit.css';
import './lab-shell.css';

interface Props {
  engineData: EngineData;
  referenceData: ReferenceData;
  curatedChains: readonly AttackChain[];
}

/**
 * TARA Lab. Two things sit above every mode and outlive each of them: the device in focus,
 * and the reader's place in each view. The frame and the modes are drawn inside both.
 */
export default function WorkbenchShell({ engineData, referenceData, curatedChains }: Props) {
  const [viewStateStore] = useState(() => createViewStateStore());
  const forgetDevice = useCallback((): void => forgetDeviceViews(viewStateStore), [viewStateStore]);

  return (
    <ViewStateProvider store={viewStateStore}>
      <FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={curatedChains} onDeviceReplaced={forgetDevice}>
        <ShellFrame store={viewStateStore} />
      </FocusProvider>
    </ViewStateProvider>
  );
}
