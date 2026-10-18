import { useEffect, useRef } from 'react';
import RegionViewMount, { BAND_LENS } from '@/components/atlas-scene/RegionViewMount';
import AtlasExplorerLink from '@/components/brain/AtlasExplorerLink';
import type { TargetRegionSummary } from '@/lib/threat-model/target-regions';
import './threat-model.css';

interface Props {
  summary: TargetRegionSummary;
  /** The label of the part in contact with neural tissue or the scalp. */
  interfaceLabel: string;
}

const HEADING_ID = 'lab-regions-heading';

/**
 * Where the device's neural interface sits: the regions chosen at intake, as a list.
 * It restates the user's own selection and shows no technique, count, or score against
 * a region. The list is the whole of it until the visitor asks for the 3D view, which then marks these
 * same regions as the visitor's selection: corner marks, no fill, and coloured by band alone.
 */
export default function TargetRegionsPanel({ summary, interfaceLabel }: Props) {
  const { regions, unknownRegionIds } = summary;
  const panelRef = useRef<HTMLElement>(null);

  // The panel opens in answer to a click on the diagram above it, so bring it on screen if it landed below the fold.
  useEffect(() => {
    const prefersReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panelRef.current?.scrollIntoView?.({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, []);

  return (
    <section ref={panelRef} className="lab-panel lab-regions" aria-labelledby={HEADING_ID}>
      <div className="lab-regions-text">
        <h2 className="lab-panel-title" id={HEADING_ID}>Target regions</h2>
        <p className="lab-soft">The regions you selected for {interfaceLabel} on this device. Change the selection in the device editor.</p>
        {regions.length === 0 && <p className="lab-soft">No target region is selected.</p>}
        <ol className="lab-regions-list">
          {regions.map((region, index) => (
            <li key={region.id}>
              <span className="lab-regions-number" aria-hidden="true">{index + 1}</span>
              <span>
                <strong>{region.name}</strong>
                <span className="lab-soft"> {region.depthClass.replaceAll('_', ' ')}</span>
              </span>
            </li>
          ))}
        </ol>
        {unknownRegionIds.length > 0 && (
          <p className="lab-notice" role="alert">Not in the brain atlas, so not listed: {unknownRegionIds.join(', ')}.</p>
        )}
        <p className="lab-soft">
          No risk is attached to a region here: the catalog ties techniques to bands, which are layers in QIF, a proposed and unreviewed framework.
        </p>
        <RegionViewMount lens={BAND_LENS} selectedRegionIds={regions.map((region) => region.id)} />
        <p className="lab-soft">
          <AtlasExplorerLink>Look these regions up in the TARA Brain Atlas, which draws the ones it has geometry for</AtlasExplorerLink>
        </p>
      </div>
    </section>
  );
}
