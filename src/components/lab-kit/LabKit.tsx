import { useMemo, useState } from 'react';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import type { CatalogTechnique, EngineData } from '@/lib/threat-model/catalog-types';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import { EVIDENCE_LEVELS, countByEvidenceLevel, evidenceLevelOf, type EvidenceLevel } from '@/lib/threat-model/evidence-levels';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { EMPTY_LENS, countOpenRisks } from '@/lib/threat-model/lens';
import { summarisePlacementCoverage } from '@/lib/threat-model/placement-coverage';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS, type ThreatGoal } from '@/lib/threat-model/report-types';
import CoverageMeter from './CoverageMeter';
import DataTable, { type DataTableColumn } from './DataTable';
import EvidenceMark from './EvidenceMark';
import FilterChip from './FilterChip';
import Panel from './Panel';
import SeverityMark from './SeverityMark';
import './lab-kit.css';

interface Props {
  engineData: EngineData;
  referenceData: ReferenceData;
}

const GOAL_LABELS: Record<ThreatGoal, string> = { read: 'Read', change: 'Change', deny: 'Deny' };
/** The example device carries no moment in time, so its report has no timestamp. */
const NO_TIMESTAMP = '';
const KIT_GRID = { display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))' } as const;
const CHIP_ROW = { display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' } as const;

const TECHNIQUE_COLUMNS: readonly DataTableColumn<CatalogTechnique>[] = [
  { id: 'evidence', header: 'Evidence', render: (technique) => <EvidenceMark status={technique.evidenceStatus} />, sortValue: (technique) => EVIDENCE_LEVELS.indexOf(evidenceLevelOf(technique.evidenceStatus)) },
  { id: 'name', header: 'Technique', render: (technique) => technique.name, sortValue: (technique) => technique.name },
  { id: 'id', header: 'ID', render: (technique) => <span className="lab-id">{technique.id}</span>, sortValue: (technique) => technique.id },
  { id: 'tactic', header: 'Tactic', render: (technique) => <span className="lab-id">{technique.tactic}</span>, sortValue: (technique) => technique.tactic },
  { id: 'severity', header: 'Severity', render: (technique) => <SeverityMark severity={technique.severity} />, sortValue: (technique) => CATALOG_SEVERITIES.indexOf(technique.severity) },
];

/** The design system on one page, drawn with the catalog's own figures so each piece can be judged on real content. */
export default function LabKit({ engineData, referenceData }: Props) {
  const [activeLevels, setActiveLevels] = useState<readonly EvidenceLevel[]>([]);
  const [pressedGoals, setPressedGoals] = useState<readonly ThreatGoal[]>([]);
  const [openedTechnique, setOpenedTechnique] = useState<CatalogTechnique | null>(null);
  const { techniques } = engineData;

  const evidenceCounts = useMemo(() => countByEvidenceLevel(techniques), [techniques]);
  const exampleDevice = useMemo(() => {
    const [archetype] = referenceData.archetypes;
    const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
    const report = buildThreatModelReport({ model, engineData, referenceData, generatedAt: NO_TIMESTAMP });
    const techniqueIdsOnDevice = new Set(report.riskRows.flatMap((row) => (row.source === 'catalog' && row.techniqueId !== null ? [row.techniqueId] : [])));
    return { label: archetype.label, report, techniqueIdsOnDevice, goalCounts: countOpenRisks(report.riskRows, EMPTY_LENS, model.controlsInPlace).byGoal };
  }, [engineData, referenceData]);
  const catalogCoverage = useMemo(() => summarisePlacementCoverage(techniques, referenceData.placementRules), [techniques, referenceData]);
  const deviceCoverage = useMemo(
    () => summarisePlacementCoverage(techniques, referenceData.placementRules, exampleDevice.techniqueIdsOnDevice),
    [techniques, referenceData, exampleDevice],
  );
  const shownTechniques = useMemo(
    () => (activeLevels.length === 0 ? techniques : techniques.filter((technique) => activeLevels.includes(evidenceLevelOf(technique.evidenceStatus)))),
    [techniques, activeLevels],
  );
  const toggleGoal = (goal: ThreatGoal): void => {
    setPressedGoals((current) => (current.includes(goal) ? current.filter((existing) => existing !== goal) : [...current, goal]));
  };
  const toggleLevel = (level: EvidenceLevel): void => {
    setActiveLevels((current) => (current.includes(level) ? current.filter((existing) => existing !== level) : [...current, level]));
  };

  return (
    <div className="lab" style={{ display: 'grid', gap: '0.75rem' }}>
      <div>
        <h1 className="lab-title">TARA Lab kit</h1>
        <p className="lab-soft">
          The pieces TARA Lab is built from, shown with catalog version {engineData.registrarVersion}: {techniques.length} techniques.
          TARA is a proposed catalog and is not peer reviewed. The placement table was drafted with an AI assistant and has not yet been reviewed.
        </p>
      </div>
      <div style={KIT_GRID}>
        <Panel title="Evidence">
          <p className="lab-soft">Certainty is drawn as how solid the mark is. A status the interface does not know keeps its own word.</p>
          <dl className="lab-meter-legend">
            {evidenceCounts.map((entry) => (
              <div key={entry.level} style={{ display: 'contents' }}>
                <dt className="lab-figure">{entry.count}</dt>
                <dd style={CHIP_ROW}>
                  {entry.statuses.length === 0 ? <span className="lab-soft">none ({entry.level})</span> : entry.statuses.map((status) => <EvidenceMark key={status} status={status} />)}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Coverage of the catalog">
          <CoverageMeter coverage={catalogCoverage} isForDevice={false} />
        </Panel>
        <Panel title={`Coverage on a device: ${exampleDevice.label}`}>
          <CoverageMeter coverage={deviceCoverage} isForDevice />
        </Panel>
        <Panel title="Filters">
          <p className="lab-soft">A filter shows what choosing it would leave. Where a zero would only mean nothing was assessed, it says so.</p>
          <div style={CHIP_ROW}>
            {THREAT_GOALS.map((goal) => {
              const coverage = exampleDevice.report.goalCoverage[goal];
              const count = exampleDevice.goalCounts[goal];
              return (
                <FilterChip
                  key={goal} label={GOAL_LABELS[goal]} count={count} isPressed={pressedGoals.includes(goal)} onToggle={() => toggleGoal(goal)}
                  isNotAssessed={count === 0 && coverage.placedTechniques < coverage.catalogTechniques}
                />
              );
            })}
          </div>
          <p className="lab-soft" style={{ marginTop: '0.5rem' }}>Open risks by goal on {exampleDevice.label}. These three show the pressed and not-assessed states. They do not filter the table below.</p>
        </Panel>
        <Panel title="Severity and type">
          <div style={CHIP_ROW}>{CATALOG_SEVERITIES.map((severity) => <SeverityMark key={severity} severity={severity} />)}</div>
          <p className="lab-panel-title" style={{ marginTop: '0.75rem' }}>Panel title, 14 semibold</p>
          <p>Body and table text, 13 regular</p>
          <p className="lab-label">Label, 12 medium, sentence case</p>
          <p><span className="lab-figure">{techniques.length}</span> figure, tabular</p>
          <p className="lab-id">{techniques[0]?.id} identifier, monospace</p>
        </Panel>
      </div>
      <Panel
        title="Table"
        actions={(
          <div style={CHIP_ROW} role="group" aria-label="Filter the table by evidence">
            {evidenceCounts.filter((entry) => entry.count > 0).map((entry) => (
              <FilterChip
                key={entry.level} label={entry.statuses.join(', ')} count={entry.count}
                isPressed={activeLevels.includes(entry.level)} onToggle={() => toggleLevel(entry.level)}
              />
            ))}
          </div>
        )}
      >
        <div style={{ maxHeight: '26rem', overflow: 'auto' }}>
          <DataTable
            caption={`${shownTechniques.length} of ${techniques.length} techniques. Arrow keys move between rows; Enter opens one.`}
            columns={TECHNIQUE_COLUMNS} rows={shownTechniques} rowKey={(technique) => technique.id}
            emptyMessage="No technique has the evidence levels selected." onOpenRow={setOpenedTechnique}
          />
        </div>
        <p className="lab-soft" role="status" style={{ marginTop: '0.5rem' }}>
          {openedTechnique === null ? 'No row opened yet.' : <>Opened <span className="lab-id">{openedTechnique.id}</span> {openedTechnique.name}.</>}
        </p>
      </Panel>
    </div>
  );
}
