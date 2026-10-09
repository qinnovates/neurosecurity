import { useMemo } from 'react';
import type { EngineData } from '@/lib/threat-model/catalog-types';
import { countByEvidence } from '@/lib/threat-model/evidence-levels';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import MarkSpecimens from './kit-page/MarkSpecimens';
import TableSpecimen from './kit-page/TableSpecimen';
import TokenSpecimens from './kit-page/TokenSpecimens';
import { useExampleDevice } from './kit-page/use-example-device';
import './lab-kit.css';
import './kit-page/kit-page.css';

interface Props {
  engineData: EngineData;
  referenceData: ReferenceData;
}

const THEMES = [{ id: 'light', title: 'Light theme' }, { id: 'dark', title: 'Dark theme' }] as const;

/** The design system on one page, in both themes, drawn with the catalog's own figures so each piece can be judged on real content. */
export default function LabKit({ engineData, referenceData }: Props) {
  const { techniques } = engineData;
  const evidenceCounts = useMemo(() => countByEvidence(techniques), [techniques]);
  const device = useExampleDevice(engineData, referenceData);

  return (
    <div className="lab kit-page">
      <div>
        <h1 className="lab-title">TARA Lab kit</h1>
        <p className="lab-soft">
          The pieces TARA Lab is built from, shown with catalog version {engineData.registrarVersion}: {techniques.length} techniques.
          TARA is a proposed catalog and is not peer reviewed. The placement table was drafted with an AI assistant and has not yet been reviewed.
        </p>
      </div>
      <div className="kit-themes">
        {THEMES.map((theme) => (
          <section key={theme.id} className="lab kit-theme" data-lab-theme={theme.id} aria-label={theme.title}>
            <h2 className="lab-panel-title">{theme.title}</h2>
            <TokenSpecimens />
            <MarkSpecimens evidenceCounts={evidenceCounts} techniqueCount={techniques.length} device={device} />
            <TableSpecimen techniques={techniques} evidenceCounts={evidenceCounts} />
          </section>
        ))}
      </div>
    </div>
  );
}
