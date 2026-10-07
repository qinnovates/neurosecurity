import { useEffect, useRef } from 'react';
import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import type { CatalogTactic, CatalogTechnique, PrecedentCve } from '@/lib/threat-model/catalog-types';
import type { PlacementState } from '@/lib/threat-model/catalog-filter';
import type { PlacementRules } from '@/lib/threat-model/reference-data-types';

interface Props {
  technique: CatalogTechnique;
  tactic: CatalogTactic | undefined;
  precedentCves: readonly PrecedentCve[];
  precedentCvesAsOf: string;
  placementState: PlacementState;
  placementRules: PlacementRules;
  deviceName: string;
  /** Names of related techniques that exist in the catalog, by id. */
  relatedTechniques: readonly CatalogTechnique[];
  onOpenTechnique: (techniqueId: string) => void;
  onShowInModel: () => void;
  onClose: () => void;
}

export const MODE_LABELS = { R: 'Read', M: 'Change', D: 'Deny' } as const;

function describePlacement(state: PlacementState, technique: CatalogTechnique, rules: PlacementRules, deviceName: string): string {
  if (state === 'placed-here') return `Placed on ${deviceName}. ${rules.placements[technique.id]?.basis ?? ''}`;
  if (state === 'placed-elsewhere') return `Placed on other kinds of device, not on ${deviceName}: this device does not meet its conditions. ${rules.placements[technique.id]?.basis ?? ''}`;
  if (state === 'not-placed') return `Reviewed and not placed on a device. ${rules.notPlaced[technique.id]?.reason ?? ''}`;
  return 'Not assessed. No placement decision has been recorded for this technique. That is not the same as it not applying.';
}

/** One technique, described once for the whole product. */
export default function TechniquePanel({
  technique, tactic, precedentCves, precedentCvesAsOf, placementState, placementRules, deviceName, relatedTechniques, onOpenTechnique, onShowInModel, onClose,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, [technique.id]);

  return (
    <section className="lab-panel catalog-panel" aria-labelledby="catalog-technique-heading" onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
      <div className="lab-panel-head">
        <h2 className="lab-panel-title" id="catalog-technique-heading" tabIndex={-1} ref={headingRef}>{technique.name}</h2>
        <button type="button" className="lab-button" onClick={onClose}>Close</button>
      </div>
      <div className="lab-panel-body">
        <p><span className="lab-id">{technique.id}</span>{technique.alias !== null && <> · <span className="lab-id">{technique.alias}</span></>}</p>
        <p style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1rem' }}>
          <EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} />
          <SeverityMark severity={technique.severity} />
          {technique.mode !== null && <span>{MODE_LABELS[technique.mode]}</span>}
        </p>

        <h3 className="lab-label">Tactic</h3>
        <p>{tactic?.name ?? technique.tactic} <span className="lab-id">{technique.tactic}</span></p>
        {tactic !== undefined && tactic.description !== '' && <p className="lab-soft">{tactic.description}</p>}

        <h3 className="lab-label">Bands</h3>
        <p className="lab-id">{technique.bandIds.length === 0 ? 'None recorded' : technique.bandIds.join(' · ')}</p>
        <p className="lab-soft">Bands are layers in QIF, a proposed framework that is not peer reviewed. The catalog ties techniques to bands, not to brain regions.</p>

        <h3 className="lab-label">On {deviceName}</h3>
        <p className={placementState === 'not-assessed' ? 'lab-hatch' : undefined}>{describePlacement(placementState, technique, placementRules, deviceName)}</p>
        {placementState === 'placed-here' && <button type="button" className="lab-button" onClick={onShowInModel}>Show in Model</button>}

        <h3 className="lab-label">Scores</h3>
        <p className="lab-id catalog-vector">{technique.cvssBaseVector ?? 'No CVSS vector recorded'}</p>
        {technique.nissScore !== null && <p className="lab-soft">NISS {technique.nissScore}{technique.nissVector !== null && <> <span className="lab-id catalog-vector">{technique.nissVector}</span></>}. NISS is a proposed score and is not peer reviewed.</p>}

        {technique.detection !== null && (
          <>
            <h3 className="lab-label">Detection, from the catalog</h3>
            <p>{technique.detection}</p>
          </>
        )}

        <h3 className="lab-label">Precedents in other products</h3>
        {precedentCves.length === 0 ? <p className="lab-soft">No CVE is linked to this technique in the mapping dated {precedentCvesAsOf}.</p> : (
          <>
            <p className="lab-soft">Found in other products and linked to this technique by the catalog, as of {precedentCvesAsOf}. These are precedents, not findings about any device here.</p>
            <ul className="catalog-panel-list">
              {precedentCves.map((cve) => <li key={cve.cveId}><span className="lab-id">{cve.cveId}</span> {cve.product}</li>)}
            </ul>
          </>
        )}

        {relatedTechniques.length > 0 && (
          <>
            <h3 className="lab-label">Related techniques</h3>
            <div className="catalog-related">
              {relatedTechniques.map((related) => <button key={related.id} type="button" className="lab-chip" title={related.name} onClick={() => onOpenTechnique(related.id)}><span className="lab-id">{related.id}</span></button>)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
