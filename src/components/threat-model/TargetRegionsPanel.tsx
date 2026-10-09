import { useEffect, useRef } from 'react';
import {
  BRAIN_OUTLINE_PATH, BRAIN_REGION_COORDS, BRAINSTEM_PATH, CEREBELLUM_PATH, SPINAL_CORD_PATH,
} from '@/components/atlas/brainmap/brain-regions';
import type { Invasiveness } from '@/lib/threat-model/device-model';
import type { TargetRegionSummary } from '@/lib/threat-model/target-regions';
import './threat-model.css';

interface Props {
  summary: TargetRegionSummary;
  /** The label of the part in contact with neural tissue or the scalp. */
  interfaceLabel: string;
  /**
   * How the device contacts the body. A non-invasive device gets the electrode-coverage
   * heading, and the schematic is drawn only when this says the device is not non-invasive:
   * left out, nothing is drawn inside a brain.
   */
  invasiveness?: Invasiveness;
}

const MAP_VIEW_BOX = '0 0 440 480';
const MARKER_RADIUS = 15;
const HEADING_ID = 'lab-regions-heading';
const NONINVASIVE_HEADING = 'Electrode coverage (description only)';
const DEFAULT_HEADING = 'Target regions';

/**
 * The regions chosen for the device's neural interface, as a description. It restates the
 * user's own selection and shows no technique, count, score or band against a region, and
 * nothing on it moves.
 */
export default function TargetRegionsPanel({ summary, interfaceLabel, invasiveness }: Props) {
  const { regions, unknownRegionIds } = summary;
  const isNonInvasive = invasiveness === 'noninvasive';
  const isSchematicShown = invasiveness !== undefined && !isNonInvasive;
  const targetIds = new Set(regions.map((region) => region.id));
  const regionNames = regions.map((region) => region.name).join(', ');
  const panelRef = useRef<HTMLElement>(null);

  // The panel opens in answer to a click on the diagram above it, so bring it on screen if it landed below the fold.
  useEffect(() => {
    const prefersReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panelRef.current?.scrollIntoView?.({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, []);

  return (
    <section ref={panelRef} className="lab-panel lab-regions" aria-labelledby={HEADING_ID}>
      <div className="lab-regions-text">
        <h2 className="lab-panel-title" id={HEADING_ID}>{isNonInvasive ? NONINVASIVE_HEADING : DEFAULT_HEADING}</h2>
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
          <p className="lab-regions-error" role="alert">Not in the brain atlas{isSchematicShown ? ', so not drawn' : ''}: {unknownRegionIds.join(', ')}.</p>
        )}
        <p className="lab-soft">
          {isSchematicShown && <>Schematic side view. Positions are approximate, and areas on the brain&rsquo;s outer surface are drawn on this inner view.{' '}</>}
          No risk is attached to a region here: the catalog ties techniques to bands, which are layers in QIF, a proposed and unreviewed framework.
        </p>
      </div>
      {isSchematicShown && (
        <svg
          className="lab-regions-map" viewBox={MAP_VIEW_BOX} role="img"
          aria-label={regions.length === 0 ? 'Schematic of the brain with no target region marked' : `Schematic of the brain with these target regions marked: ${regionNames}`}
        >
          <path className="lab-regions-outline" d={BRAIN_OUTLINE_PATH} />
          <path className="lab-regions-outline" d={CEREBELLUM_PATH} />
          <path className="lab-regions-outline" d={BRAINSTEM_PATH} />
          <path className="lab-regions-outline" d={SPINAL_CORD_PATH} />
          {Object.entries(BRAIN_REGION_COORDS).filter(([regionId]) => !targetIds.has(regionId)).map(([regionId, coord]) => (
            <ellipse key={regionId} className="lab-regions-other" cx={coord.cx} cy={coord.cy} rx={coord.rx} ry={coord.ry} />
          ))}
          {regions.map((region, index) => {
            const coord = BRAIN_REGION_COORDS[region.id];
            if (coord === undefined) return null;
            return (
              <g key={region.id} className="lab-regions-target">
                <circle cx={coord.cx} cy={coord.cy} r={MARKER_RADIUS} />
                <text x={coord.cx} y={coord.cy} textAnchor="middle" dominantBaseline="central">{index + 1}</text>
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
}
