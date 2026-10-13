import type { AnatomyIndex } from '@/lib/anatomy/anatomy-index-types';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import { ELECTRODE_LAYER_NAME, describeElectrode, listDrawableLayouts, listLandmarkNotes, type ElectrodeDetail, type LandmarkNote } from '@/lib/atlas-explorer/device-drawing';
import { buildLeadFigures, longestContactSpanMm } from '@/lib/atlas-explorer/lead-figure';
import LeadFigure, { LeadLimits } from './LeadFigure';
import LimitNote from './LimitNote';
import ReviewMark from './ReviewMark';

interface Props {
  index: AnatomyIndex;
  /** The picked electrode, or null. Picking one selects no region. */
  electrodeId: string | null;
  onPickElectrode: (electrodeId: string | null) => void;
}

function Landmarks({ landmarks }: { landmarks: readonly LandmarkNote[] }) {
  return (
    <ul className="atlas-plain-list" aria-label="The four points the layout is measured from, and how far each can be trusted">
      {landmarks.map((landmark) => (
        <li key={landmark.id} className="atlas-fact" data-landmark={landmark.id}>
          <strong>{landmark.words}.</strong> {landmark.note ?? 'The data file says nothing about how far this point can be trusted.'} <ReviewMark state={landmark.reviewState} />
        </li>
      ))}
    </ul>
  );
}

/** A picked electrode: its name, the limits, the landmark notes. No region, and nothing measured from the picture. */
function PickedElectrode({ detail, onClear }: { detail: ElectrodeDetail; onClear: () => void }) {
  return (
    <div className="atlas-electrode-picked" data-picked-electrode={detail.id} role="status">
      <p className="atlas-fact">
        Picked electrode: <strong>{detail.id}</strong>{detail.alsoCalled !== null && ` (also called ${detail.alsoCalled})`}, in the {detail.layoutName}. <ReviewMark state={detail.reviewState} />
      </p>
      {detail.limits.map((limit) => <LimitNote key={limit.id} limit={limit} />)}
      <Landmarks landmarks={detail.landmarks} />
      <button type="button" className="atlas-link-button" onClick={onClear}>Clear the picked electrode</button>
    </div>
  );
}

/**
 * The devices layer in words and drawings, shown whenever the layer is on,
 * whether or not the 3D view is open: the electrode layout's dots by name, the
 * landmarks it is measured from, sourced statements about it, and each lead as
 * a to-scale object with a scale bar and a table of its numbers. The leads sit
 * here, beside the picture of the brain and never in it. Every drawing and
 * list carries its review state.
 */
export default function DeviceGeometry({ index, electrodeId, onPickElectrode }: Props) {
  const layouts = listDrawableLayouts(index);
  const detail = electrodeId === null ? null : describeElectrode(index, electrodeId);
  const leads = buildLeadFigures(index);
  const widestSpanMm = longestContactSpanMm(leads);
  return (
    <section className="atlas-panel atlas-devices" aria-labelledby="atlas-devices-heading">
      <h2 className="atlas-heading" id="atlas-devices-heading">{ELECTRODE_LAYER_NAME}</h2>
      {layouts.length === 0 && <p className="atlas-fact">This build holds no electrode layout that can be drawn.</p>}
      {layouts.map((layout) => (
        <div key={layout.id} data-layout-id={layout.id}>
          <p className="atlas-fact"><strong>{layout.name}</strong> <ReviewMark state={layout.review_state} /></p>
          <p className="atlas-fact">{layout.construction}</p>
          <LimitNote limit={limitSentence('device_electrodes')} />
          <LimitNote limit={limitSentence('device_head_surface')} />
          <LimitNote limit={limitSentence('device_electrode_pick')} />
          <ul className="atlas-chips" aria-label={`The ${layout.electrodes.length} electrode positions, by name`}>
            {layout.electrodes.map((electrode) => (
              <li key={electrode.id}>
                <button type="button" className="atlas-chip" data-electrode-id={electrode.id} aria-pressed={electrode.id === electrodeId} onClick={() => onPickElectrode(electrode.id === electrodeId ? null : electrode.id)}>
                  {electrode.id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {detail !== null && <PickedElectrode detail={detail} onClear={() => onPickElectrode(null)} />}
      {layouts.length > 0 && detail === null && (
        <>
          <h3 className="atlas-subheading">The points the layout is measured from</h3>
          {index.devices.fiducial_method !== null && <p className="atlas-fact">{index.devices.fiducial_method}</p>}
          <LimitNote limit={limitSentence('device_landmarks')} />
          <Landmarks landmarks={listLandmarkNotes(index)} />
        </>
      )}
      {index.devices.facts.map((fact) => (
        <div key={fact.id} data-device-fact={fact.id}>
          <p className="atlas-fact">{fact.statement}</p>
          <p className="atlas-source"><a href={fact.url} rel="noopener noreferrer">{fact.citation}</a></p>
          <LimitNote limit={limitSentence(fact.read_depth === 'abstract_only' ? 'device_fact_abstract_only' : 'device_fact_full_text')} />
        </div>
      ))}
      {leads.length > 0 && (
        <div className="atlas-leads" data-leads="beside-the-brain">
          <h3 className="atlas-subheading">Deep brain stimulation leads, beside the brain</h3>
          <LeadLimits />
          {leads.map((figure) => <LeadFigure key={figure.id} figure={figure} widestSpanMm={widestSpanMm} />)}
        </div>
      )}
    </section>
  );
}
