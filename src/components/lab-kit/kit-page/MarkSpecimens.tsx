import { useState } from 'react';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import type { EvidenceCount } from '@/lib/threat-model/evidence-levels';
import type { ThreatGoal } from '@/lib/threat-model/report-types';
import CoverageMeter from '../CoverageMeter';
import EmptyState from '../EmptyState';
import EvidenceBar from '../EvidenceBar';
import EvidenceLegend from '../EvidenceLegend';
import { EvidenceGlyph } from '../EvidenceMark';
import EvidenceStepMark from '../EvidenceStepMark';
import FilterChip from '../FilterChip';
import HatchSwatch from '../HatchSwatch';
import Panel from '../Panel';
import PlaybackTransport from '../PlaybackTransport';
import Segmented from '../Segmented';
import SeverityMark from '../SeverityMark';
import StatTile from '../StatTile';
import { EVIDENCE_STEP_SHORT_LABELS, EVIDENCE_STEPS } from '../evidence-steps';
import { useSequencePlayback } from '../motion/use-sequence-playback';
import { useViewTransition } from '../motion/use-view-transition';
import type { ExampleDevice } from './use-example-device';

interface Props {
  evidenceCounts: readonly EvidenceCount[];
  techniqueCount: number;
  device: ExampleDevice;
}

type CoverageScope = 'catalog' | 'device';
const GOAL_LABELS: Readonly<Record<ThreatGoal, string>> = { read: 'Read', change: 'Change', deny: 'Deny' };
/** The mark at its working size and enlarged, so the seven silhouettes can be told apart at both. */
const MARK_SIZES = [12, 24] as const;

function SeveritySteps() {
  const playback = useSequencePlayback(CATALOG_SEVERITIES.length);
  return (
    <>
      <PlaybackTransport playback={playback} stepCount={CATALOG_SEVERITIES.length} label="Specimen playback" />
      <div className="kit-row">{CATALOG_SEVERITIES.slice(0, playback.reached).map((severity) => <SeverityMark key={severity} severity={severity} />)}</div>
      <p className="lab-soft">The transport steps through the {CATALOG_SEVERITIES.length} severity marks. It starts on the whole picture and never loops.</p>
    </>
  );
}

/** The marks and the pieces that count things, each drawn from the catalog's own figures. */
export default function MarkSpecimens({ evidenceCounts, techniqueCount, device }: Props) {
  const [scope, setScope] = useState<CoverageScope>('catalog');
  const [pressedGoals, setPressedGoals] = useState<readonly ThreatGoal[]>([]);
  const runTransition = useViewTransition();
  const toggleGoal = (goal: ThreatGoal): void => setPressedGoals((current) => (current.includes(goal) ? current.filter((existing) => existing !== goal) : [...current, goal]));
  const coverage = scope === 'catalog' ? device.catalogCoverage : device.deviceCoverage;

  return (
    <div className="kit-grid">
      <Panel title="Evidence mark">
        {MARK_SIZES.map((size) => (
          <div key={size} className="kit-row" role="group" aria-label={`Evidence marks at ${size} pixels`}>
            {EVIDENCE_STEPS.map((step) => <EvidenceStepMark key={step} step={step} size={size} label={EVIDENCE_STEP_SHORT_LABELS[step]} />)}
          </div>
        ))}
        <EvidenceLegend counts={evidenceCounts} note={`Integers count the ${techniqueCount} techniques in the catalog by tier.`} />
      </Panel>
      <Panel title="Evidence in a row and in a tally">
        <div className="kit-stack">
          {evidenceCounts.map((entry) => (
            <div key={entry.label} className="kit-row"><EvidenceGlyph evidence={entry} labelForm="short" /><EvidenceGlyph evidence={entry} /></div>
          ))}
          <EvidenceBar counts={evidenceCounts} subject="techniques" />
        </div>
      </Panel>
      <Panel title="Severity">
        <div className="kit-row">{CATALOG_SEVERITIES.map((severity) => <SeverityMark key={severity} severity={severity} />)}</div>
        <p className="lab-soft">Height carries the order. Red is used for Critical and nothing else.</p>
        <SeveritySteps />
      </Panel>
      <Panel title="Split bar" actions={<Segmented label="Coverage of" options={[{ value: 'catalog', label: 'Catalog' }, { value: 'device', label: device.label }]} value={scope} onChange={(next) => runTransition(() => setScope(next))} />}>
        <CoverageMeter coverage={coverage} isForDevice={scope === 'device'} />
      </Panel>
      <Panel title="Stat tiles and filter chips">
        <div className="kit-row">
          <StatTile label="Techniques in the catalog" figure={techniqueCount} />
          <StatTile label={`Not assessed for ${scope === 'catalog' ? 'any device' : device.label}`} figure={coverage.notAssessed} unit={`of ${coverage.total}`} />
          <StatTile label={`Risk rows on ${device.label}`} figure={device.riskRowCount} />
        </div>
        <div className="kit-row" role="group" aria-label={`Open risks by goal on ${device.label}`}>
          {device.goals.map((entry) => (
            <FilterChip key={entry.goal} label={GOAL_LABELS[entry.goal]} count={entry.openRisks} isPressed={pressedGoals.includes(entry.goal)} isNotAssessed={entry.isNotAssessed} onToggle={() => toggleGoal(entry.goal)} />
          ))}
        </div>
        <div className="kit-row">
          {device.goals.map((entry) => <StatTile key={entry.goal} label={`${GOAL_LABELS[entry.goal]}, open on ${device.label}`} figure={entry.openRisks} isNotAssessed={entry.isNotAssessed} />)}
        </div>
        <p className="lab-soft">Where a zero would only mean nothing was assessed, the chip and the tile say so. These chips show the pressed state and filter nothing.</p>
      </Panel>
      <Panel title="Not assessed and empty">
        <p><HatchSwatch /> The hatch is the only pattern in the system. It is a swatch before the words, never a fill behind them.</p>
        <EmptyState reason="not-assessed" detail="Specimen of the state a view shows when nothing of its kind has been assessed." />
        <p className="lab-notice">Specimen of a notice. The caution colour is its border only; the words stay in ink.</p>
      </Panel>
    </div>
  );
}
