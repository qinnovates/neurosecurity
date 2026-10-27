import type { RefObject } from 'react';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { ShownAnatomyEvidence } from '@/lib/anatomy/parse-anatomy-evidence';
import type { RegionEvidence } from '@/lib/anatomy/region-evidence-types';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { RegionDetail } from '@/lib/atlas-explorer/region-detail';
import { GEOMETRY_LABELS } from '@/lib/atlas-explorer/region-rows';
import type { Loaded } from './explorer-data';
import InspectorCoverage from './InspectorCoverage';
import InspectorDsm from './InspectorDsm';
import InspectorEmpty from './InspectorEmpty';
import InspectorEvidence from './InspectorEvidence';
import InspectorShapes from './InspectorShapes';
import InspectorTechniques, { InspectorBandOnly } from './InspectorTechniques';
import LimitNote from './LimitNote';
import ReviewMark from './ReviewMark';
import { buildRegionCoverage, type AtlasCoverage } from './region-coverage';

interface Props {
  model: ExplorerModel;
  /** Null while nothing is selected. */
  detail: RegionDetail | null;
  /** The whole atlas's coverage, for the pane with nothing chosen and for the bars' scale. */
  atlasCoverage: AtlasCoverage;
  headingRef: RefObject<HTMLHeadingElement | null>;
  anatomyEvidence: Loaded<ShownAnatomyEvidence>;
  regionEvidence: Loaded<RegionEvidence>;
  onRetryAnatomyEvidence: () => void;
  onRetryRegionEvidence: () => void;
  onChooseTechnique: (techniqueId: string) => void;
  onChooseDevice: (deviceId: string) => void;
  onSelectRegion: (regionId: string) => void;
  onBackToList: () => void;
  /** Returns the visitor to the 3D view's heading. */
  onBackToView: () => void;
}

function Devices({ detail, onChooseDevice }: { detail: RegionDetail; onChooseDevice: (deviceId: string) => void }) {
  return (
    <section className="atlas-section" aria-labelledby="atlas-inspector-devices">
      <h3 className="atlas-subheading" id="atlas-inspector-devices">Devices whose QIF record lists this region</h3>
      <p className="atlas-route">via the device records in QIF&rsquo;s atlas file</p>
      {detail.deviceIds.length === 0 ? <LimitNote limit={limitSentence('stated_devices_none')} /> : (
        <>
          <ul className="atlas-chips">
            {detail.deviceIds.map((deviceId) => (
              <li key={deviceId}><button type="button" className="atlas-chip" onClick={() => onChooseDevice(deviceId)}>{deviceId}</button></li>
            ))}
          </ul>
          <LimitNote limit={limitSentence('qif_file_fact')} />
        </>
      )}
    </section>
  );
}

/**
 * Everything the atlas holds for the selected region, in the order a reader
 * needs in order not to be misled: who the region is and how reliable the
 * record is, then what we hold for it and out of what, and only then anything
 * derived from those records. Material that arrives through the region's band
 * is last and under its own heading, because a band holds up to every region
 * in the atlas and so describes the bucket rather than this region.
 *
 * Its heading takes focus when a region is chosen from the keyboard; "Back to
 * the list" returns it to the region's row, and "Back to the 3D view" to the
 * picture.
 */
export default function RegionInspector(props: Props) {
  const { detail, headingRef } = props;
  if (detail === null) {
    return <InspectorEmpty coverage={props.atlasCoverage} headingRef={headingRef} onSelectRegion={props.onSelectRegion} />;
  }
  const { region, band } = detail;
  const coverage = buildRegionCoverage(props.model, detail, props.atlasCoverage);
  return (
    <section className="atlas-panel atlas-inspector" aria-labelledby="atlas-inspector-heading" key={region.id}>
      <p className="atlas-kicker">{band === null ? 'No band' : `QIF band ${band.id}, ${band.name}`}</p>
      <h2 className="atlas-heading atlas-inspector-title" id="atlas-inspector-heading" ref={headingRef} tabIndex={-1}>{region.name}</h2>
      <p className="atlas-fact atlas-inspector-standing">
        {GEOMETRY_LABELS[region.geometry.state]} <ReviewMark state={region.review_state} />
      </p>
      <p className="atlas-inspector-ways">
        <button type="button" className="atlas-link-button" onClick={props.onBackToList}>Back to the list</button>
        <button type="button" className="atlas-link-button" onClick={props.onBackToView}>Back to the 3D view</button>
      </p>
      <InspectorCoverage coverage={coverage} model={props.model} regionId={region.id} />
      {detail.description !== null && (
        <section className="atlas-section" aria-labelledby="atlas-inspector-what">
          <h3 className="atlas-subheading" id="atlas-inspector-what">What the QIF atlas file says it does</h3>
          <blockquote className="atlas-quote"><p>{detail.description}</p></blockquote>
          <LimitNote limit={limitSentence('region_description')} />
        </section>
      )}
      <InspectorTechniques detail={detail} evidence={props.anatomyEvidence} onRetryEvidence={props.onRetryAnatomyEvidence} onChooseTechnique={props.onChooseTechnique} />
      <InspectorDsm model={props.model} regionId={region.id} />
      <Devices detail={detail} onChooseDevice={props.onChooseDevice} />
      <InspectorShapes detail={detail} />
      <InspectorEvidence regionId={region.id} regionName={region.name} evidence={props.regionEvidence} onRetry={props.onRetryRegionEvidence} />
      {/*
        * Band context, kept apart on purpose and counted in no total above. A band is a bucket of
        * up to every region in the atlas, so a technique tagged with one names no region in it.
        */}
      <div className="atlas-band-context" data-band-context="true">
        <InspectorBandOnly detail={detail} onChooseTechnique={props.onChooseTechnique} />
      </div>
    </section>
  );
}
