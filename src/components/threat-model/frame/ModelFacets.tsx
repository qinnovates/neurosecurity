import FacetBar, { type Facet } from '@/components/lab-kit/FacetBar';
import FilterChip from '@/components/lab-kit/FilterChip';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import { CATALOG_SEVERITY_HEADING, CATALOG_SEVERITY_LABELS, EFFECT_HEADING, EFFECT_LABELS, ENTRY_PATH_HEADING, ENTRY_PATH_LABELS } from '@/lib/threat-model/lab-terms';
import { EMPTY_LENS, isLensActive, type Lens } from '@/lib/threat-model/lens';
import type { ModelElement } from '@/lib/threat-model/model-order';
import { PLACED_ENTRY_PATHS } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS } from '@/lib/threat-model/report-types';
import { isZeroNotAssessed, type CoverageGaps, type FacetCounts } from './facet-counts';
import GoalChip from './GoalChip';

export const MODEL_FACET_IDS = ['technique', 'part', 'entry-path', 'effect', 'decision', 'severity', 'evidence'] as const;
export type ModelFacetId = typeof MODEL_FACET_IDS[number];

interface Props {
  lens: Lens;
  onLensChange: (lens: Lens) => void;
  isOpenOnly: boolean;
  onOpenOnlyChange: (isOpenOnly: boolean) => void;
  counts: FacetCounts;
  gaps: CoverageGaps;
  /** Every part and connection, in model order. */
  elements: readonly ModelElement[];
  /** The name of the technique the lens is narrowed to, when it is. */
  techniqueName: string | null;
  /** The facets that act on the view in front of the reader. Leave out for all of them. */
  facetIds?: readonly ModelFacetId[];
}

const WHOLE_DEVICE_VALUE = '';
const WHOLE_DEVICE_LABEL = 'Whole device';
/** Facets kept in the first row; the rest wait behind "More filters". */
const FIRST_ROW_FACETS = 4;

function toggle<Value>(values: readonly Value[], value: Value): Value[] {
  return values.includes(value) ? values.filter((existing) => existing !== value) : [...values, value];
}

function partFacet({ lens, onLensChange, elements }: Props): Facet {
  return {
    id: 'part', label: 'Part', activeCount: lens.elementId === null ? 0 : 1,
    control: (
      <select
        className="lab-input model-part-select" aria-label="Part or connection" value={lens.elementId ?? WHOLE_DEVICE_VALUE}
        onChange={(event) => onLensChange({ ...lens, elementId: event.target.value === WHOLE_DEVICE_VALUE ? null : event.target.value })}
      >
        <option value={WHOLE_DEVICE_VALUE}>{WHOLE_DEVICE_LABEL}</option>
        {elements.map((element) => <option key={element.id} value={element.id}>{element.label}</option>)}
      </select>
    ),
  };
}

function techniqueFacet({ lens, onLensChange, techniqueName }: Props): Facet {
  return {
    id: 'technique', label: 'Technique', activeCount: 1,
    control: (
      <button type="button" className="lab-chip" aria-pressed="true" onClick={() => onLensChange({ ...lens, techniqueId: null })}>
        <span>{techniqueName ?? lens.techniqueId}</span> <span className="lab-id">{lens.techniqueId}</span>
        <span aria-hidden="true">×</span><span className="sr-only"> (clear)</span>
      </button>
    ),
  };
}

function entryPathFacet({ lens, onLensChange, counts, gaps }: Props): Facet {
  return {
    id: 'entry-path', label: ENTRY_PATH_HEADING, activeCount: lens.entryPaths.length,
    control: PLACED_ENTRY_PATHS.map((entryPath) => (
      <FilterChip
        key={entryPath} label={ENTRY_PATH_LABELS[entryPath]} count={counts.lens.byEntryPath[entryPath]}
        isNotAssessed={isZeroNotAssessed(counts.lens.byEntryPath[entryPath], gaps.isAnyIncomplete)}
        isPressed={lens.entryPaths.includes(entryPath)} onToggle={() => onLensChange({ ...lens, entryPaths: toggle(lens.entryPaths, entryPath) })}
      />
    )),
  };
}

function effectFacet({ lens, onLensChange, counts, gaps }: Props): Facet {
  return {
    id: 'effect', label: EFFECT_HEADING, activeCount: lens.goals.length,
    control: THREAT_GOALS.map((goal) => (
      <GoalChip
        key={goal} label={EFFECT_LABELS[goal]} catalogCount={counts.catalogByGoal[goal]} baselineCount={counts.lens.baselineByGoal[goal]}
        isIncomplete={gaps.byGoal[goal]} isPressed={lens.goals.includes(goal)} onToggle={() => onLensChange({ ...lens, goals: toggle(lens.goals, goal) })}
      />
    )),
  };
}

function decisionFacet({ isOpenOnly, onOpenOnlyChange, counts, gaps }: Props): Facet {
  return {
    id: 'decision', label: 'Decision', activeCount: isOpenOnly ? 1 : 0,
    control: (
      <FilterChip
        label="Open only" count={counts.openRows} isNotAssessed={isZeroNotAssessed(counts.openRows, gaps.isAnyIncomplete)}
        isPressed={isOpenOnly} onToggle={() => onOpenOnlyChange(!isOpenOnly)}
      />
    ),
  };
}

function severityFacet({ lens, onLensChange, counts, gaps }: Props): Facet {
  return {
    id: 'severity', label: CATALOG_SEVERITY_HEADING, activeCount: lens.severities.length,
    control: CATALOG_SEVERITIES.map((severity) => (
      <FilterChip
        key={severity} label={CATALOG_SEVERITY_LABELS[severity]} count={counts.bySeverity[severity]}
        isNotAssessed={isZeroNotAssessed(counts.bySeverity[severity], gaps.bySeverity[severity])}
        isPressed={lens.severities.includes(severity)} onToggle={() => onLensChange({ ...lens, severities: toggle(lens.severities, severity) })}
      />
    )),
  };
}

function evidenceFacet({ lens, onLensChange, counts, gaps }: Props): Facet {
  return {
    id: 'evidence', label: 'Evidence', activeCount: lens.evidenceLevels.length,
    control: counts.byEvidence.map((evidence) => (
      <FilterChip
        key={evidence.label} label={evidence.label} count={evidence.count} isNotAssessed={isZeroNotAssessed(evidence.count, gaps.isAnyIncomplete)}
        isPressed={lens.evidenceLevels.includes(evidence.label)}
        onToggle={() => onLensChange({ ...lens, evidenceLevels: toggle(lens.evidenceLevels, evidence.label) })}
      />
    )),
  };
}

const FACET_BUILDERS: Readonly<Record<ModelFacetId, (props: Props) => Facet>> = {
  technique: techniqueFacet, part: partFacet, 'entry-path': entryPathFacet, effect: effectFacet,
  decision: decisionFacet, severity: severityFacet, evidence: evidenceFacet,
};

/**
 * The one row of filters over the device's rows. Every chip prints the open rows it would
 * leave, or "not assessed"; a technique the reader arrived with is shown first and can be cleared.
 */
export default function ModelFacets(props: Props) {
  const { lens, onLensChange, isOpenOnly, onOpenOnlyChange, facetIds = MODEL_FACET_IDS } = props;
  const shownIds = facetIds.filter((facetId) => facetId !== 'technique' || lens.techniqueId !== null);
  const facets = shownIds.map((facetId) => FACET_BUILDERS[facetId](props));
  const hasTechnique = shownIds.includes('technique');
  const clearAll = (): void => {
    onLensChange(EMPTY_LENS);
    onOpenOnlyChange(false);
  };
  return (
    <div className="model-facets model-no-print">
      <FacetBar label="Filter this device's rows" facets={facets} visibleCount={FIRST_ROW_FACETS + (hasTechnique ? 1 : 0)} />
      {(isLensActive(lens) || isOpenOnly) && <button type="button" className="lab-button model-facets-clear" onClick={clearAll}>Show everything</button>}
    </div>
  );
}
