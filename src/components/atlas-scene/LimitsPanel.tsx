import type { AnatomyIndex, GeometryState } from '@/lib/anatomy/anatomy-index-types';
import { GEOMETRY_STATES } from '@/lib/anatomy/anatomy-index-types';
import { limitSentence, type LimitId } from '@/lib/anatomy/limits-copy';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { GEOMETRY_LABELS } from '@/lib/atlas-explorer/region-rows';
import Disclosure from './Disclosure';
import LimitNote from './LimitNote';

interface Props {
  model: ExplorerModel;
}

/** The limits that apply to the whole page, gathered in one place. Each also sits beside the thing it limits. */
const GENERAL_LIMIT_IDS = [
  'region_matching', 'lens_band', 'lens_technique', 'lens_niss', 'lens_dsm', 'lens_stated_targets', 'counts_are_entries',
  'evidence_intro', 'networks_names_only', 'device_stages', 'h01_sample',
] as const satisfies readonly LimitId[];

function countRegions(model: ExplorerModel, state: GeometryState): number {
  return model.regions.filter((region) => region.geometry.state === state).length;
}

/** What this build holds, counted from the index, so a visitor can see how much is and is not there. */
function Holdings({ model }: Props) {
  const { techniques } = model.index;
  const countScope = (scope: string): number => techniques.filter((technique) => technique.scope === scope).length;
  const linkedCount = techniques.filter((technique) => technique.links.some((link) => link.lit)).length;
  return (
    <ul className="atlas-plain-list" data-holdings="true">
      <li className="atlas-fact">
        {model.regions.length} regions: {GEOMETRY_STATES.filter((state) => countRegions(model, state) > 0).map((state) => `${countRegions(model, state)} ${GEOMETRY_LABELS[state]}`).join(', ')}.
      </li>
      <li className="atlas-fact">
        {techniques.length} techniques carry a brain band: {linkedCount} linked to at least one region, {countScope('regions') - linkedCount} whose text names
        structures that cannot be linked, {countScope('band_level')} tagged to a band only, {countScope('not_drafted')} with no links drafted.
      </li>
      <li className="atlas-fact">{model.deviceOnlyTechniquesById.size} techniques carry no brain band and sit on the device stages.</li>
    </ul>
  );
}

function Sources({ index }: { index: AnatomyIndex }) {
  return (
    <div className="atlas-table-wrap">
      <table className="atlas-table">
        <caption className="sr-only">Sources and their licence readings</caption>
        <thead><tr><th scope="col">Source</th><th scope="col">Licence as stated</th><th scope="col">In this build</th><th scope="col">Recorded reason</th></tr></thead>
        <tbody>
          {index.sources.map((source) => (
            <tr key={source.id}>
              <th scope="row">{source.name}</th>
              <td>{source.stated_license_id}</td>
              <td>{source.buildable ? (source.pipeline_only ? 'used to compute, not redistributed' : 'may be built') : 'not built'}</td>
              <td>{source.clearance_reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The way in to the limits and the sources: what the page holds, every general limit in one list, and each source's licence reading. */
export default function LimitsPanel({ model }: Props) {
  return (
    <section className="atlas-panel" aria-labelledby="atlas-limits-heading">
      <h2 className="atlas-heading" id="atlas-limits-heading">Limits and sources</h2>
      <p className="atlas-fact">{model.index.status}</p>
      <Disclosure label="What this page holds, and what it cannot tell you">
        <Holdings model={model} />
        {GENERAL_LIMIT_IDS.map((limitId) => <LimitNote key={limitId} limit={limitSentence(limitId)} />)}
      </Disclosure>
      <Disclosure label={`Sources and licence readings (${model.index.sources.length})`}>
        <LimitNote limit={limitSentence('licence_readings')} />
        <Sources index={model.index} />
      </Disclosure>
    </section>
  );
}
