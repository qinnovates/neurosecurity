import type { ModeProps } from '@/components/workbench/mode-registry';
import CatalogView from './catalog/CatalogView';
import CuratedChains from './CuratedChains';
import DeviceClasses from './DeviceClasses';
import DeviceSpecifications from './DeviceSpecifications';
import '@/components/threat-model/threat-model.css';
import './explore.css';

/** The Explore mode: which kind of device, what the catalog holds, and what is published about real devices. */
export default function ExploreMode({ viewId, onOpenMode }: ModeProps) {
  if (viewId === 'catalog') return <CatalogView onOpenMode={onOpenMode} />;
  if (viewId === 'curated-chains') return <CuratedChains />;
  if (viewId === 'specifications') return <DeviceSpecifications />;
  return <DeviceClasses onOpenMode={onOpenMode} />;
}
