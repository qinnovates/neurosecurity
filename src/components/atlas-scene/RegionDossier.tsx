import { useCallback, useMemo, type ReactNode } from 'react';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import { REGION_DOSSIER_PATH, type EndpointNaming } from '@/lib/atlas-explorer/dossier-file';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { buildRegionDetail, type RegionDetail } from '@/lib/atlas-explorer/region-detail';
import { buildRegionDsm } from '@/lib/atlas-explorer/region-dsm';
import { regionKqlHref } from '@/lib/atlas-explorer/region-kql';
import Disclosure from './Disclosure';
import DossierDevices from './DossierDevices';
import DossierTechniques from './DossierTechniques';
import { loadRegionDossier, peekRegionDossier } from './explorer-companions';
import LimitNote from './LimitNote';
import LoadNotice from './LoadNotice';
import { useLoaded } from './use-loaded';

interface Props {
  model: ExplorerModel;
  regionId: string;
  onChooseTechnique: (techniqueId: string) => void;
  onChooseDevice: (deviceId: string) => void;
}

/** A longer list folds away, so one block never pushes the next off the pane: the spinal cord's band holds twenty-one hazards. */
const ROWS_SHOWN_OPEN = 5;

const NAMING_WORDS: Readonly<Record<EndpointNaming, string>> = {
  exact: 'named exactly',
  container_stand_in: 'a larger structure stands in',
  unreviewed: 'naming not reviewed',
};

function FoldedWhenLong({ count, noun, children }: { count: number; noun: string; children: ReactNode }) {
  return count > ROWS_SHOWN_OPEN ? <Disclosure label={`Show the ${count} ${noun}`}>{children}</Disclosure> : children;
}

function LayerAndFunction({ detail }: { detail: RegionDetail }) {
  const bandId = detail.region.band_ids[0];
  return (
    <section className="atlas-section" aria-labelledby="atlas-dossier-layer">
      <h3 className="atlas-subheading" id="atlas-dossier-layer">Layer and function</h3>
      <p className="atlas-fact" data-fact="layer">{detail.layerName ?? detail.band?.name ?? 'No layer'} <span className="atlas-id">{bandId}</span></p>
      {detail.description !== null && (
        <>
          <blockquote className="atlas-quote"><p>{detail.description}</p></blockquote>
          <LimitNote limit={limitSentence('region_description')} />
        </>
      )}
    </section>
  );
}

function Hazards({ detail }: { detail: RegionDetail }) {
  if (detail.hazards === null) return null;
  return (
    <section className="atlas-section" aria-labelledby="atlas-dossier-hazards">
      <h3 className="atlas-subheading" id="atlas-dossier-hazards">Hazards for this layer</h3>
      <LimitNote limit={limitSentence('hazards_by_layer')} />
      <FoldedWhenLong count={detail.hazards.length} noun="hazards">
        <ul className="atlas-dossier-rows">
          {detail.hazards.map((hazard) => <li className="atlas-dossier-row" key={hazard.id} data-dossier-hazard={hazard.id}><p className="atlas-row-why"><span className="atlas-id">{hazard.id}</span> {hazard.name}</p></li>)}
        </ul>
      </FoldedWhenLong>
    </section>
  );
}

function Connections({ detail }: { detail: RegionDetail }) {
  return (
    <section className="atlas-section" aria-labelledby="atlas-dossier-connections">
      <h3 className="atlas-subheading" id="atlas-dossier-connections">Connections</h3>
      {detail.pathways.length === 0 ? <LimitNote limit={limitSentence('dossier_no_pathway')} /> : (
        <>
          <LimitNote limit={limitSentence('pathway_unreviewed')} />
          <FoldedWhenLong count={detail.pathways.length} noun="pathways">
            <ul className="atlas-dossier-rows">
              {detail.pathways.map((pathway) => (
                <li className="atlas-dossier-row" key={pathway.id} data-dossier-pathway={pathway.id}>
                  <p className="atlas-row-why">{pathway.name}{pathway.naming !== null && `: ${NAMING_WORDS[pathway.naming]}`}.</p>
                </li>
              ))}
            </ul>
          </FoldedWhenLong>
        </>
      )}
    </section>
  );
}

function ReferenceList({ references }: { references: ReadonlyArray<{ code: string; name: string }> }) {
  return (
    <ul className="atlas-dossier-rows">
      {references.map(({ code, name }) => <li className="atlas-dossier-row" key={`${code} ${name}`}><p className="atlas-row-why"><span className="atlas-id">{code}</span> {name}</p></li>)}
    </ul>
  );
}

/** DSM-5-TR references through the region's techniques and pathways, and neurological references through its pathways. Each stands under its own qualifier. */
function Conditions({ model, detail }: { model: ExplorerModel; detail: RegionDetail }) {
  const dsm = buildRegionDsm(model, detail.region.id);
  const dsmReferences = [...new Map([...dsm.viaTechniques, ...dsm.viaPathways].map((reference) => [`${reference.code} ${reference.name}`, reference])).values()];
  const neurological = detail.conditions ?? [];
  return (
    <section className="atlas-section" aria-labelledby="atlas-dossier-conditions">
      <h3 className="atlas-subheading" id="atlas-dossier-conditions">Conditions referenced</h3>
      <LimitNote limit={limitSentence('dsm_references')} />
      {dsmReferences.length === 0 ? <LimitNote limit={limitSentence('dsm_none')} /> : <Disclosure label={`Show the ${dsmReferences.length} DSM-5-TR references`}><ReferenceList references={dsmReferences} /></Disclosure>}
      {neurological.length > 0 && (
        <>
          <LimitNote limit={limitSentence('neurological_references')} />
          <Disclosure label={`Show the ${neurological.length} neurological references`}><ReferenceList references={neurological} /></Disclosure>
        </>
      )}
    </section>
  );
}

/**
 * One region as a doorway into everything the datalake holds about it, in the order a neurosecurity reader needs: what
 * the region is, what names it, what touches it, what can go wrong with no attacker, how it connects, which conditions
 * are referenced, and how to query all of it. It holds its own load, so a page can mount it with a model and an id.
 * What needs the dossier's file appears once that file has arrived; the rest does not wait for it.
 */
export default function RegionDossier({ model, regionId, onChooseTechnique, onChooseDevice }: Props) {
  const loadFile = useCallback(() => loadRegionDossier(model), [model]);
  const { state, retry } = useLoaded(loadFile, true, REGION_DOSSIER_PATH);
  const file = peekRegionDossier(model) ?? (state.status === 'ready' ? state.data : null);
  const detail = useMemo(() => buildRegionDetail(model, regionId, file), [model, regionId, file]);
  if (detail === null) return null;
  return (
    <div className="atlas-dossier" data-dossier={regionId}>
      <LayerAndFunction detail={detail} />
      {file === null && <LoadNotice what="this region's records" state={state} onRetry={retry} />}
      <DossierTechniques detail={detail} onChooseTechnique={onChooseTechnique} />
      <DossierDevices detail={detail} onChooseDevice={onChooseDevice} />
      <Hazards detail={detail} />
      <Connections detail={detail} />
      <Conditions model={model} detail={detail} />
      <section className="atlas-section" aria-label="Query this region">
        <p className="atlas-fact"><a className="atlas-link-button" href={regionKqlHref(detail.kqlQuery)} data-dossier-query={regionId}>Query this in KQL</a></p>
        <LimitNote limit={limitSentence('nothing_live')} />
        <LimitNote limit={limitSentence('scene_review_state')} />
      </section>
    </div>
  );
}
