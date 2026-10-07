import { useEffect, useRef } from 'react';
import {
  BRAIN_OUTLINE_PATH, BRAIN_REGION_COORDS, BRAINSTEM_PATH, CEREBELLUM_PATH, SPINAL_CORD_PATH,
} from '@/components/atlas/brainmap/brain-regions';
import type { TargetRegionSummary } from '@/lib/threat-model/target-regions';

interface Props {
  summary: TargetRegionSummary;
  /** The label of the component that touches or records from neural tissue. */
  interfaceLabel: string;
}

const MAP_VIEW_BOX = '0 0 440 480';
const MARKER_RADIUS = 15;

/**
 * Where the device's neural interface sits: the regions chosen at intake, drawn on a
 * schematic. It restates the user's own selection and shows no technique, count, or
 * score against a region.
 */
export default function TargetRegionsPanel({ summary, interfaceLabel }: Props) {
  const { regions, unknownRegionIds } = summary;
  const targetIds = new Set(regions.map((region) => region.id));
  const regionNames = regions.map((region) => region.name).join(', ');
  const panelRef = useRef<HTMLElement>(null);

  // The panel opens in answer to a click on the diagram above it, so bring it on screen if it landed below the fold.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panelRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, []);

  return (
    <section ref={panelRef} className="tm-card tm-regions" aria-labelledby="tm-regions-heading">
      <div className="tm-regions-text">
        <h2 className="tm-heading" id="tm-regions-heading">Target regions</h2>
        <p className="tm-muted">
          Where {interfaceLabel} records from or acts on, as you selected for this device. Change the selection under &ldquo;Target brain regions&rdquo;.
        </p>
        {regions.length === 0 && <p className="tm-muted">No target region is selected.</p>}
        <ol className="tm-regions-list">
          {regions.map((region, index) => (
            <li key={region.id}>
              <span className="tm-regions-number" aria-hidden="true">{index + 1}</span>
              <span>
                <strong>{region.name}</strong>
                <span className="tm-muted tm-small"> {region.depthClass.replaceAll('_', ' ')}, band {region.bandId}</span>
              </span>
            </li>
          ))}
        </ol>
        {unknownRegionIds.length > 0 && (
          <p className="tm-error" role="alert">Not in the brain atlas, so not drawn: {unknownRegionIds.join(', ')}.</p>
        )}
        <p className="tm-muted tm-small">
          Schematic side view. Positions are approximate, and areas on the brain&rsquo;s outer surface are drawn on this inner view.
          No risk is attached to a region here: the catalog ties techniques to bands, which are layers in QIF, a proposed and unreviewed framework.
        </p>
      </div>
      <svg
        className="tm-regions-map" viewBox={MAP_VIEW_BOX} role="img"
        aria-label={regions.length === 0 ? 'Schematic of the brain with no target region marked' : `Schematic of the brain with these target regions marked: ${regionNames}`}
      >
        <path className="tm-regions-outline" d={BRAIN_OUTLINE_PATH} />
        <path className="tm-regions-outline" d={CEREBELLUM_PATH} />
        <path className="tm-regions-outline" d={BRAINSTEM_PATH} />
        <path className="tm-regions-outline" d={SPINAL_CORD_PATH} />
        {Object.entries(BRAIN_REGION_COORDS).filter(([regionId]) => !targetIds.has(regionId)).map(([regionId, coord]) => (
          <ellipse key={regionId} className="tm-regions-other" cx={coord.cx} cy={coord.cy} rx={coord.rx} ry={coord.ry} />
        ))}
        {regions.map((region, index) => {
          const coord = BRAIN_REGION_COORDS[region.id];
          if (coord === undefined) return null;
          return (
            <g key={region.id} className="tm-regions-target">
              <ellipse className="tm-regions-halo" cx={coord.cx} cy={coord.cy} rx={coord.rx + 8} ry={coord.ry + 8} />
              <circle cx={coord.cx} cy={coord.cy} r={MARKER_RADIUS} />
              <text x={coord.cx} y={coord.cy} textAnchor="middle" dominantBaseline="central">{index + 1}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
