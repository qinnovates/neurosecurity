// @vitest-environment jsdom
/**
 * What the two radars must keep true.
 *
 * The first group is the point of the whole module: an entry NISS has not
 * scored and an entry it scored at the floor must not share a shape. The second
 * is the 6-to-4 neurorights fold, which has to be visible on the chart rather
 * than performed quietly. The third holds `neurorights.cci` out of the DOM: it
 * has no definition in `niss_spec` and a changelog that contradicts the data, so
 * the index never carried it and nothing may draw it.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import registrar from '@shared/qtara-registrar.json';
import { formatNissScore, NISS_UNSCORED_REASON_LABELS, THREAT_VECTORS } from '@/lib/threat-data';
import { foldNeurorights } from '@/lib/neurorights-fold';
import { readNeurorightsTaxonomy, type NeurorightCode } from '@/lib/anatomy/technique-tags';
import NissScoreBadge from '@/components/niss/NissScoreBadge';
import NeurorightsRadar from '../NeurorightsRadar';
import NissVectorRadar, { type NissReading } from '../NissVectorRadar';
import RadarChart from '../RadarChart';
import { axisAngle, RadarGeometryError, shareOf } from '../radar-geometry';

afterEach(cleanup);

/** The year of the paper the rights come from; it is the one number on the chart that is not a count. */
const IENCA_ANDORNO_YEAR = '2017';

const SCORED: NissReading = {
  state: 'scored',
  vector: 'NISS:1.1/BI:H/CR:H/CD:H/CV:E/RV:P/NP:T',
  severity: 'medium',
  score: 6.1,
  pins: true,
  harmFlag: true,
  cognitiveFlag: true,
};
/** Every metric at its floor: a measured zero, which the registrar does hold as a severity of `none`. */
const SCORED_AT_ZERO: NissReading = {
  state: 'scored',
  vector: 'NISS:1.1/BI:N/CR:N/CD:N/CV:N/RV:F/NP:N',
  severity: 'none',
  score: 0,
  pins: false,
};
const UNSCORED: NissReading = { state: 'unscored', reason: 'It has no peer-reviewed source.' };

function figureOf(container: HTMLElement): HTMLElement {
  const figure = container.querySelector('figure.radar');
  if (figure === null) throw new Error('No radar figure was rendered.');
  return figure as HTMLElement;
}

describe('a scored vector', () => {
  it('draws a shape with one vertex per metric, and no hatch', () => {
    const { container } = render(<NissVectorRadar title="QIF-T0001 Example" reading={SCORED} />);
    expect(figureOf(container).dataset.state).toBe('plotted');
    expect(figureOf(container).dataset.radarFill).toBe('medium');
    expect(container.querySelectorAll('.radar-edge')).toHaveLength(1);
    expect(container.querySelectorAll('.radar-vertex')).toHaveLength(6);
    expect(container.querySelectorAll('.radar-withheld-fill')).toHaveLength(0);
    expect(container.querySelectorAll('.radar-withheld-frame')).toHaveLength(0);
  });

  it('puts the score, the severity word and the flags beside the shape, not in it', () => {
    const { container } = render(<NissVectorRadar title="QIF-T0001 Example" reading={SCORED} />);
    const reading = container.querySelector('.radar-reading');
    expect(reading?.textContent).toContain('6.1');
    expect(reading?.textContent).toContain('Medium');
    expect(reading?.textContent).toContain('PINS');
    expect(reading?.textContent).toContain('Biological impact High or above');
    // The figure beside the chart is outside the plot, so nothing in the drawing carries the number.
    expect(container.querySelector('svg')?.textContent).not.toContain('6.1');
  });

  it('names every metric and its value in the one accessible name the plot carries', () => {
    render(<NissVectorRadar title="QIF-T0001 Example" reading={SCORED} />);
    const label = screen.getByRole('img').getAttribute('aria-label') ?? '';
    expect(label).toContain('Biological Impact High');
    expect(label).toContain('Reversibility Partial');
    expect(label).toContain('6 axes');
  });

  it('prints each metric value in words, so the chart is readable without a pointer', () => {
    const { container } = render(<NissVectorRadar title="QIF-T0001 Example" reading={SCORED} />);
    expect(container.querySelector('.radar-values')?.textContent).toContain('BI');
    expect(container.querySelector('.radar-values')?.textContent).toContain('High');
  });

  it('is not plotted when the stored vector cannot be read', () => {
    const { container } = render(<NissVectorRadar title="QIF-T9999 Broken" reading={{ ...SCORED, vector: 'NISS:9.9/BI:Z' } as NissReading} />);
    expect(figureOf(container).dataset.state).toBe('withheld');
    expect(container.querySelectorAll('.radar-edge')).toHaveLength(0);
  });
});

describe('an entry NISS has not scored', () => {
  it('draws no shape at all, and says so on the chart', () => {
    const { container } = render(<NissVectorRadar title="QIF-T0100 Example" reading={UNSCORED} />);
    expect(figureOf(container).dataset.state).toBe('withheld');
    expect(container.querySelectorAll('.radar-edge')).toHaveLength(0);
    expect(container.querySelectorAll('.radar-vertex')).toHaveLength(0);
    expect(container.querySelectorAll('.radar-wash')).toHaveLength(0);
    expect(container.querySelectorAll('.radar-withheld-fill')).toHaveLength(1);
    expect(container.querySelectorAll('.radar-withheld-frame')).toHaveLength(1);
    expect(screen.getByText('Not scored')).toBeTruthy();
    expect(screen.getByText(/no peer-reviewed source/)).toBeTruthy();
  });

  it('reads as no value on every axis, never as zero', () => {
    const { container } = render(<NissVectorRadar title="QIF-T0100 Example" reading={UNSCORED} />);
    const values = [...container.querySelectorAll('.radar-values dd')].map((cell) => cell.textContent);
    expect(values).toHaveLength(6);
    expect(values.every((value) => value === '—')).toBe(true);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('No shape is drawn');
  });

  it('keeps no score and no flags beside the chart', () => {
    const { container } = render(<NissVectorRadar title="QIF-T0100 Example" reading={UNSCORED} />);
    expect(container.querySelector('.radar-reading')).toBeNull();
  });

  it('does not look like a measured zero', () => {
    const measured = render(<NissVectorRadar title="Measured floor" reading={SCORED_AT_ZERO} />);
    expect(measured.container.querySelectorAll('.radar-vertex')).toHaveLength(6);
    expect(measured.container.querySelectorAll('.radar-withheld-fill')).toHaveLength(0);
    expect(measured.container.querySelector('.radar-reading')?.textContent).toContain('0.0');
    expect([...measured.container.querySelectorAll('.radar-values dd')].map((cell) => cell.textContent)).not.toContain('—');
    expect(figureOf(measured.container).dataset.radarFill).toBe('none');
    cleanup();

    const withheld = render(<NissVectorRadar title="Not measured" reading={UNSCORED} />);
    expect(withheld.container.querySelectorAll('.radar-vertex')).toHaveLength(0);
    expect(withheld.container.querySelectorAll('.radar-withheld-fill')).toHaveLength(1);
  });
});

describe('a provisional entry', () => {
  it('draws no shape, and gives the bound rather than a point', () => {
    const { container } = render(
      <NissVectorRadar title="QIF-T0200 Example" reading={{ state: 'provisional', rangeLabel: '3.3–6.7', supportedMetricCount: 2 }} />,
    );
    expect(figureOf(container).dataset.state).toBe('withheld');
    expect(screen.getByText('Provisional')).toBeTruthy();
    expect(screen.getByText(/3.3–6.7/)).toBeTruthy();
    expect(screen.getByText(/2 of the 6 metrics/)).toBeTruthy();
  });
});

describe('the neurorights chart', () => {
  const taxonomy = readNeurorightsTaxonomy(registrar);
  const records = (registrar as { techniques: { neurorights?: { affected?: NeurorightCode[] } | null }[] }).techniques.map((technique) =>
    technique.neurorights == null ? null : (technique.neurorights.affected ?? []),
  );
  const fold = foldNeurorights(taxonomy, records);

  it('draws four axes, one per right the ethics file defines', () => {
    const { container } = render(<NeurorightsRadar fold={fold} />);
    const labels = [...container.querySelectorAll('.radar-axis-label')].map((label) => label.textContent);
    expect(labels).toEqual(['MP', 'CL', 'MI', 'PC']);
  });

  it('states the fold on screen rather than collapsing six codes quietly', () => {
    const { container } = render(<NeurorightsRadar fold={fold} />);
    const caption = container.querySelector('.radar-caption')?.textContent ?? '';
    expect(caption).toContain('folds DI (Dynamical Integrity) into MI');
    expect(caption).toContain('folds IDA (Informational Disassociation) into MP');
    const notes = [...container.querySelectorAll('.radar-axis-note')].map((note) => note.textContent);
    const mentalIntegrity = fold.rights.find((right) => right.code === 'MI');
    if (mentalIntegrity !== undefined && mentalIntegrity.reachedOnlyByFold > 0) {
      expect(notes).toContain(`+${mentalIntegrity.reachedOnlyByFold} via DI`);
    }
  });

  it('says what the axis counts and what the full axis is', () => {
    const { container } = render(<NeurorightsRadar fold={fold} />);
    const caption = container.querySelector('.radar-caption')?.textContent ?? '';
    expect(caption).toContain(`${fold.recordedTechniqueCount} of ${fold.techniqueCount}`);
    expect(caption).toContain('not people, and no axis is a measurement of anyone');
  });

  it('draws nothing at all when no technique carries a record', () => {
    const { container } = render(<NeurorightsRadar fold={foldNeurorights(taxonomy, [null, null])} />);
    expect(figureOf(container).dataset.state).toBe('withheld');
    expect(screen.getByText('No records')).toBeTruthy();
    expect(container.querySelectorAll('.radar-vertex')).toHaveLength(0);
  });

  it('never puts cci in the DOM', () => {
    const { container } = render(<NeurorightsRadar fold={fold} />);
    // The registrar holds cci on its neurorights records; the index deliberately does not carry it, and nothing here reads it.
    const values = (registrar as { techniques: { neurorights?: { cci?: number } | null }[] }).techniques
      .map((technique) => technique.neurorights?.cci)
      .filter((value): value is number => typeof value === 'number');
    expect(values.length).toBeGreaterThan(0);
    expect(container.innerHTML).not.toMatch(/cci/i);
    expect(JSON.stringify(fold)).not.toMatch(/cci/i);
    /*
     * Substring-matching a cci value is useless (one of them is 1), so instead:
     * every number the chart prints has to be one of the counts it is allowed
     * to print. A cci reaching the chart would show up here as a number that is
     * not a count.
     */
    const allowed = new Set([
      String(fold.recordedTechniqueCount),
      String(fold.techniqueCount),
      IENCA_ANDORNO_YEAR,
      ...fold.rights.flatMap((right) => [String(right.total), String(right.reachedOnlyByFold), ...right.foldedIn.map((folded) => String(folded.count))]),
    ]);
    const printed = (container.textContent ?? '').match(/\d+(?:\.\d+)?/g) ?? [];
    expect(printed.length).toBeGreaterThan(0);
    for (const number of printed) expect(allowed, `the chart prints ${number}`).toContain(number);
  });
});

describe('the catalog as it stands', () => {
  const states = ['scored', 'provisional', 'unscored'] as const;

  for (const state of states) {
    it(`draws a technique the registrar reads as ${state}`, () => {
      const technique = THREAT_VECTORS.find((candidate) => candidate.niss.scoring_state === state);
      expect(technique, `no ${state} technique in the catalog`).toBeDefined();
      if (technique === undefined) return;
      const supported = Object.entries(technique.niss.metrics ?? {}).filter(([, value]) => value !== 'unknown');
      const reading: NissReading = state === 'scored'
        ? {
            state: 'scored',
            vector: technique.niss.vector,
            severity: technique.niss.severity,
            score: technique.niss.score,
            pins: technique.niss.pins,
            harmFlag: technique.niss.harm_flag,
            cognitiveFlag: technique.niss.cognitive_flag,
            isNeuroplasticityUnsupported: technique.niss.np_support === 'unsupported',
          }
        : state === 'provisional'
          ? { state: 'provisional', rangeLabel: formatNissScore(technique.niss), supportedMetricCount: supported.length }
          : { state: 'unscored', reason: technique.niss.unscored_reason ? NISS_UNSCORED_REASON_LABELS[technique.niss.unscored_reason] : null };
      const { container } = render(<NissVectorRadar title={`${technique.id} ${technique.name}`} reading={reading} />);
      expect(figureOf(container).dataset.state).toBe(state === 'scored' ? 'plotted' : 'withheld');
      // The states that are not scored carry placeholder values in the adapter (score 0, severity none); none of them may reach the chart.
      if (state !== 'scored') expect(container.querySelector('.radar-reading')).toBeNull();
    });
  }
});

describe('the score badge beside the chart', () => {
  it('takes its colour from the same palette as the shape', () => {
    const { container } = render(<NissScoreBadge score={6.1} severity="medium" />);
    const badge = container.querySelector('[role="status"]') as HTMLElement | null;
    expect(badge?.dataset.radarFill).toBe('medium');
    expect(badge?.style.color).toBe('var(--radar-tone)');
    // The Tailwind colour classes it used to carry were the palette that measured worst on a light page.
    expect(badge?.className).not.toMatch(/bg-|text-(slate|blue|yellow|amber|red)/);
  });

  it('keeps the shape that carries severity without colour', () => {
    const { container } = render(<NissScoreBadge score={9.5} severity="critical" />);
    expect(container.textContent).toContain('\u2B22');
    expect(container.textContent).toContain('Critical');
  });
});

describe('the shared primitive', () => {
  it('refuses to lay out fewer axes than a shape needs', () => {
    expect(() => axisAngle(0, 2)).toThrow(RadarGeometryError);
  });

  it('refuses a value it cannot place on an axis, rather than placing it at the origin', () => {
    expect(() => shareOf(Number.NaN, 10)).toThrow(RadarGeometryError);
    expect(() => shareOf(5, 0)).toThrow(RadarGeometryError);
    expect(shareOf(20, 10)).toBe(1);
  });

  it('holds the two bodies apart by type, so a withheld chart carries no share', () => {
    const axes = [
      { key: 'a', shortLabel: 'A', name: 'Axis A', valueLabel: '' },
      { key: 'b', shortLabel: 'B', name: 'Axis B', valueLabel: '' },
      { key: 'c', shortLabel: 'C', name: 'Axis C', valueLabel: '' },
    ];
    const { container } = render(<RadarChart title="Three axes" body={{ kind: 'withheld', word: 'Not drawn', reason: 'Nothing was measured.', axes }} />);
    expect(container.querySelectorAll('.radar-spoke')).toHaveLength(3);
    expect(container.querySelectorAll('.radar-edge')).toHaveLength(0);
  });

  it('gives each chart on a page its own pattern, so two charts cannot share one fill', () => {
    const { container } = render(
      <>
        <NissVectorRadar title="First" reading={SCORED} />
        <NissVectorRadar title="Second" reading={{ ...SCORED, severity: 'critical' }} />
      </>,
    );
    const ids = [...container.querySelectorAll('pattern')].map((pattern) => pattern.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
