import type { RefObject } from 'react';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { ShownAnatomyEvidence } from '@/lib/anatomy/parse-anatomy-evidence';
import type { RegionEvidence } from '@/lib/anatomy/region-evidence-types';
import type { RegionDetail } from '@/lib/atlas-explorer/region-detail';
import type { Loaded } from './explorer-data';
import InspectorEvidence from './InspectorEvidence';
import InspectorShapes from './InspectorShapes';
import InspectorTechniques, { InspectorBandOnly } from './InspectorTechniques';
import LimitNote from './LimitNote';

interface Props {
  /** Null while nothing is selected. */
  detail: RegionDetail | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  anatomyEvidence: Loaded<ShownAnatomyEvidence>;
  regionEvidence: Loaded<RegionEvidence>;
  onRetryAnatomyEvidence: () => void;
  onRetryRegionEvidence: () => void;
  onChooseTechnique: (techniqueId: string) => void;
  onChooseDevice: (deviceId: string) => void;
  onBackToList: () => void;
}

function Devices({ detail, onChooseDevice }: { detail: RegionDetail; onChooseDevice: (deviceId: string) => void }) {
  return (
    <section className="atlas-section" aria-labelledby="atlas-inspector-devices">
      <h3 className="atlas-subheading" id="atlas-inspector-devices">Devices whose QIF record lists this region</h3>
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
 * Everything the atlas holds for the selected region. Its heading takes focus
 * when a region is chosen from the keyboard, and "Back to the list" returns it.
 */
export default function RegionInspector(props: Props) {
  const { detail, headingRef } = props;
  if (detail === null) {
    return (
      <section className="atlas-panel atlas-inspector" aria-labelledby="atlas-inspector-heading" data-empty="true">
        <h2 className="atlas-heading" id="atlas-inspector-heading" ref={headingRef} tabIndex={-1}>Region details</h2>
        <p className="atlas-fact">Choose a region from the list to see what the atlas holds for it.</p>
      </section>
    );
  }
  const { region, band } = detail;
  return (
    <section className="atlas-panel atlas-inspector" aria-labelledby="atlas-inspector-heading" key={region.id}>
      <p className="atlas-kicker">{band === null ? 'No band' : `QIF band ${band.id}, ${band.name}`}</p>
      <h2 className="atlas-heading atlas-inspector-title" id="atlas-inspector-heading" ref={headingRef} tabIndex={-1}>{region.name}</h2>
      <button type="button" className="atlas-link-button" onClick={props.onBackToList}>Back to the list</button>
      {detail.description !== null && (
        <section className="atlas-section" aria-labelledby="atlas-inspector-what">
          <h3 className="atlas-subheading" id="atlas-inspector-what">What the QIF atlas file says it does</h3>
          <blockquote className="atlas-quote"><p>{detail.description}</p></blockquote>
          <LimitNote limit={limitSentence('region_description')} />
        </section>
      )}
      <InspectorShapes detail={detail} />
      <InspectorEvidence regionId={region.id} regionName={region.name} evidence={props.regionEvidence} onRetry={props.onRetryRegionEvidence} />
      <Devices detail={detail} onChooseDevice={props.onChooseDevice} />
      <InspectorTechniques detail={detail} evidence={props.anatomyEvidence} onRetryEvidence={props.onRetryAnatomyEvidence} onChooseTechnique={props.onChooseTechnique} />
      <InspectorBandOnly detail={detail} onChooseTechnique={props.onChooseTechnique} />
    </section>
  );
}
