import type { ModeProps } from '@/components/workbench/mode-registry';
import CatalogView from './catalog/CatalogView';
import CuratedChains from './CuratedChains';
import DeviceClasses from './DeviceClasses';
import DeviceSpecifications from './DeviceSpecifications';
import { AUTHORED_CHAINS_VIEW_ID, CATALOG_VIEW_ID, SPECIFICATIONS_VIEW_ID, START_VIEW_ID } from './explore-navigation';
import './explore.css';

/** The Explore mode: where to start, what the catalog holds, the authored chains, and what is published about named devices. */
export default function ExploreMode({ viewId, onSelectView }: ModeProps) {
  if (viewId === CATALOG_VIEW_ID) return <CatalogView />;
  if (viewId === AUTHORED_CHAINS_VIEW_ID) return <CuratedChains />;
  if (viewId === SPECIFICATIONS_VIEW_ID) return <DeviceSpecifications onOpenStart={() => onSelectView(START_VIEW_ID)} />;
  return <DeviceClasses />;
}
