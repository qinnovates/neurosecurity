// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { EVIDENCE_TIER_GROUP, type EvidenceTierCode } from '@/lib/evidence-tiers';
import { countByEvidence, describeEvidence } from '@/lib/threat-model/evidence-levels';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import EvidenceLegend from '../EvidenceLegend';
import EvidenceMark, { EvidenceGlyph } from '../EvidenceMark';
import EvidenceStepMark, { EVIDENCE_MARK_MINIMUM_PX } from '../EvidenceStepMark';
import HatchSwatch from '../HatchSwatch';
import SeverityMark from '../SeverityMark';
import SplitBar, { type SplitBarSegment } from '../SplitBar';
import StatTile from '../StatTile';
import { EVIDENCE_STEP_SHORT_LABELS, EVIDENCE_STEPS, EVIDENCE_STEP_BY_TIER, countByEvidenceStep, shortLabelForEvidence, stepForEvidence, tierNamesForStep } from '../evidence-steps';
import { CHANGED_FLAG_MS } from '../motion/motion-tokens';

afterEach(cleanup);

const TIER_CODES = Object.keys(EVIDENCE_TIER_GROUP) as EvidenceTierCode[];
/** The five tiers that are not "validated": each must get a silhouette of its own. */
const UNVALIDATED_TIERS = TIER_CODES.filter((code) => EVIDENCE_TIER_GROUP[code] !== 'validated');

/** The tier's name as the Lab words it today; read from the library so a rewording there does not break the kit. */
const LAB_TIER_NAME = describeEvidence({ evidenceTier: 'demonstrated_lab', evidenceStatus: null }).label;
const CASE_TIER_NAME = describeEvidence({ evidenceTier: 'demonstrated_case', evidenceStatus: null }).label;

function drawingOf(step: typeof EVIDENCE_STEPS[number]): string {
  const { container } = render(<EvidenceStepMark step={step} />);
  const drawing = container.querySelector('svg')?.innerHTML ?? '';
  cleanup();
  return drawing;
}

describe('evidence steps', () => {
  it('gives every tier code the catalog defines a step, and the five unvalidated tiers five different ones', () => {
    for (const code of TIER_CODES) expect(stepForEvidence(describeEvidence({ evidenceTier: code, evidenceStatus: null })), code).toBe(EVIDENCE_STEP_BY_TIER[code]);
    expect(new Set(UNVALIDATED_TIERS.map((code) => EVIDENCE_STEP_BY_TIER[code])).size).toBe(UNVALIDATED_TIERS.length);
  });

  it('keeps each step inside the group the catalog puts its tier in', () => {
    for (const code of TIER_CODES) expect(EVIDENCE_STEP_BY_TIER[code].startsWith(EVIDENCE_TIER_GROUP[code]), code).toBe(true);
  });

  it('draws a record with no tier and no status as "not stated", and keeps an unknown word as written', () => {
    const missing = describeEvidence({ evidenceTier: null, evidenceStatus: null });
    expect(stepForEvidence(missing)).toBe('not-stated');
    expect(shortLabelForEvidence(missing)).toBe('Not stated');
    const unknown = describeEvidence({ evidenceTier: null, evidenceStatus: 'PLAUSIBLE' });
    expect(stepForEvidence(unknown)).toBe('not-stated');
    expect(shortLabelForEvidence(unknown)).toBe('Plausible');
  });

  it('draws a legacy status by the catalog\'s own fallback tier and never as validated', () => {
    for (const status of ['CONFIRMED', 'DEMONSTRATED', 'EMERGING', 'THEORETICAL']) {
      const evidence = describeEvidence({ evidenceTier: null, evidenceStatus: status });
      expect(stepForEvidence(evidence), status).not.toBe('validated');
      expect(stepForEvidence(evidence).startsWith(evidence.level), status).toBe(true);
    }
  });

  it('has a short word for every step and lists the tier names behind it', () => {
    expect(EVIDENCE_STEPS.map((step) => EVIDENCE_STEP_SHORT_LABELS[step])).toEqual(['Validated', 'Lab', 'Case study', 'Modelled', 'Proposed', 'Speculative', 'Not stated']);
    expect(new Set(Object.values(EVIDENCE_STEP_SHORT_LABELS)).size).toBe(EVIDENCE_STEPS.length);
    expect(tierNamesForStep('validated')).toHaveLength(2);
    expect(tierNamesForStep('demonstrated-lab')).toEqual([LAB_TIER_NAME]);
  });

  it('sums counts by step', () => {
    const counts = countByEvidence([
      { evidenceTier: 'demonstrated_lab', evidenceStatus: null }, { evidenceTier: 'demonstrated_lab', evidenceStatus: null },
      { evidenceTier: 'speculative', evidenceStatus: null }, { evidenceTier: null, evidenceStatus: null },
    ]);
    expect(countByEvidenceStep(counts)).toMatchObject({ validated: 0, 'demonstrated-lab': 2, speculative: 1, 'not-stated': 1 });
  });
});

describe('EvidenceStepMark', () => {
  it('draws seven different silhouettes in the text colour', () => {
    const drawings = EVIDENCE_STEPS.map(drawingOf);
    expect(new Set(drawings).size).toBe(EVIDENCE_STEPS.length);
    for (const drawing of drawings) expect(drawing).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i);
  });

  it('fills more cells the stronger the evidence, and frames only the five ordered steps', () => {
    const cells = (step: typeof EVIDENCE_STEPS[number]): number => (drawingOf(step).match(/width="5"/g) ?? []).length;
    expect(['validated', 'demonstrated-lab', 'demonstrated-case', 'theoretical-modelled', 'theoretical-proposed'].map((step) => cells(step as typeof EVIDENCE_STEPS[number]))).toEqual([4, 3, 2, 1, 0]);
    expect(drawingOf('speculative')).not.toContain('<rect');
    expect(drawingOf('not-stated')).toContain('width="6"');
  });

  it('is never drawn under 12px', () => {
    const { container } = render(<EvidenceStepMark step="speculative" size={9} />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe(String(EVIDENCE_MARK_MINIMUM_PX));
    expect(container.querySelector('svg')?.getAttribute('fill')).toBe('currentColor');
  });
});

describe('EvidenceMark label forms', () => {
  it('shows the short word and keeps the full tier name as the accessible name', () => {
    const { container } = render(<EvidenceMark tier="demonstrated_case" status={null} labelForm="short" />);
    expect(container.textContent).toBe('Case study');
    expect(screen.getByRole('img', { name: `Evidence: ${CASE_TIER_NAME}` })).toBeTruthy();
    expect(container.querySelector('.lab-evidence')?.getAttribute('data-step')).toBe('demonstrated-case');
  });

  it('draws a caller-described value by its group when its words are not a tier name', () => {
    const { container } = render(<EvidenceGlyph evidence={{ level: 'theoretical', label: 'Partly demonstrated' }} />);
    expect(container.textContent).toBe('Partly demonstrated');
    expect(container.querySelector('.lab-evidence')?.getAttribute('data-step')).toBe('theoretical-proposed');
  });
});

describe('EvidenceLegend', () => {
  it('lists all seven marks strongest first, with tier names', () => {
    render(<EvidenceLegend />);
    const items = within(screen.getByRole('list', { name: 'Evidence marks' })).getAllByRole('listitem');
    expect(items).toHaveLength(EVIDENCE_STEPS.length);
    expect(items[1].textContent).toBe(`Lab${LAB_TIER_NAME}`);
    expect(items.every((item) => item.querySelector('svg') !== null)).toBe(true);
  });

  it('prints an integer for every step when given counts, zero included', () => {
    render(<EvidenceLegend counts={countByEvidence([{ evidenceTier: 'theoretical_proposed', evidenceStatus: null }])} isCompact note="A note." />);
    const items = within(screen.getByRole('list', { name: 'Evidence marks' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['0Validated', '0Lab', '0Case study', '0Modelled', '1Proposed', '0Speculative', '0Not stated']);
    expect(screen.getByText('A note.')).toBeTruthy();
  });
});

describe('SeverityMark', () => {
  it('draws a shorter stripe for each lower severity', () => {
    const heights = CATALOG_SEVERITIES.map((severity) => {
      const { container } = render(<SeverityMark severity={severity} />);
      const height = Number(container.querySelector('rect')?.getAttribute('height'));
      cleanup();
      return height;
    });
    expect(heights).toEqual([14, 10, 6, 3]);
  });

  it('shows the word, or names the stripe when the word is hidden', () => {
    const { container } = render(<SeverityMark severity="high" />);
    expect(container.textContent).toBe('High');
    expect(container.querySelector('.lab-severity')?.getAttribute('data-severity')).toBe('high');
    cleanup();
    render(<SeverityMark severity="critical" isLabelHidden />);
    expect(screen.getByRole('img', { name: 'Severity: Critical' })).toBeTruthy();
  });
});

describe('SplitBar', () => {
  const segments: readonly SplitBarSegment[] = [
    { id: 'open', label: 'open', count: 30, kind: 'solid' },
    { id: 'decided', label: 'decided', count: 0, kind: 'open' },
    { id: 'not-assessed', label: 'not assessed', count: 10, kind: 'hatch' },
  ];
  const widths = (container: HTMLElement): string[] => Array.from(container.querySelectorAll<HTMLElement>('.lab-splitbar-segment')).map((segment) => segment.style.flexGrow);

  it('prints every integer and names every share', () => {
    const { container } = render(<SplitBar subject="rows" segments={segments} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('40 rows: 30 open, 0 decided, 10 not assessed.');
    expect(Array.from(container.querySelectorAll('.lab-splitbar-count')).map((count) => count.textContent)).toEqual(['30', '0', '10']);
    expect(Array.from(container.querySelectorAll('dd')).map((label) => label.textContent)).toEqual(['open', 'decided', 'not assessed']);
  });

  it('draws the hatch as a pattern in the hatch share only', () => {
    const { container } = render(<SplitBar subject="rows" segments={segments} />);
    const drawn = Array.from(container.querySelectorAll('.lab-splitbar-segment')).map((segment) => segment.querySelector('pattern') !== null);
    expect(drawn).toEqual([false, false, true]);
  });

  it('keeps the same segments when the set changes, so each one moves from its old width to its new', () => {
    const { container, rerender } = render(<SplitBar subject="rows" segments={segments} />);
    const before = Array.from(container.querySelectorAll('.lab-splitbar-segment'));
    expect(widths(container)).toEqual(['30', '0', '10']);
    rerender(<SplitBar subject="rows" segments={segments.map((segment) => (segment.id === 'decided' ? { ...segment, count: 12 } : segment))} />);
    expect(widths(container)).toEqual(['30', '12', '10']);
    expect(Array.from(container.querySelectorAll('.lab-splitbar-segment'))).toEqual(before);
  });

  it('says so when the set is empty, and can hide its list', () => {
    const { container } = render(<SplitBar subject="rows" segments={segments.map((segment) => ({ ...segment, count: 0 }))} isListHidden />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('No rows.');
    expect(container.querySelector('dl')).toBeNull();
  });
});

describe('StatTile', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('prints the figure, unit and label', () => {
    const { container } = render(<StatTile label="Open risks" figure={52} unit="of 76" note="catalog rows" />);
    expect(container.querySelector('.lab-stat-figure')?.textContent).toBe('52of 76');
    expect(screen.getByText('Open risks')).toBeTruthy();
    expect(screen.getByText('catalog rows')).toBeTruthy();
  });

  it('never prints a bare zero when nothing was assessed', () => {
    const { container } = render(<StatTile label="Deny" figure={0} isNotAssessed />);
    expect(container.textContent).not.toContain('0');
    expect(container.textContent).toContain('Not assessed');
    expect(container.querySelector('.lab-hatch-swatch')).not.toBeNull();
  });

  it('swaps a changed figure at once and marks it for a moment', () => {
    const { container, rerender } = render(<StatTile label="Open risks" figure={52} />);
    const figure = (): Element | null => container.querySelector('[data-changed]');
    expect(figure()?.getAttribute('data-changed')).toBe('false');
    rerender(<StatTile label="Open risks" figure={36} />);
    expect(figure()?.textContent).toBe('36');
    expect(figure()?.getAttribute('data-changed')).toBe('true');
    act(() => { vi.advanceTimersByTime(CHANGED_FLAG_MS); });
    expect(figure()?.getAttribute('data-changed')).toBe('false');
  });
});

describe('HatchSwatch', () => {
  it('is hidden from assistive technology unless it is given a name', () => {
    const { container } = render(<HatchSwatch />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    cleanup();
    render(<HatchSwatch label="Not assessed" />);
    expect(screen.getByRole('img', { name: 'Not assessed' })).toBeTruthy();
  });
});
