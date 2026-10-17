// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { parseCss, splitSelectors } from '../../diagram/__tests__/parse-css';
import { countRunsUnder, settleLabels, type LabelledLine } from '../../diagram/label-placement';
import FoldPanel from '../FoldPanel';
import { buildRegisterColumns } from '../register-columns';
import { hasWrapped } from '../use-fitting-count';

afterEach(cleanup);

describe('FoldPanel', () => {
  it('folds to its title, count and one line, keeps its content in the page, and tells its toggle what it controls', () => {
    const onToggle = vi.fn();
    const { container, rerender } = render(<FoldPanel title="Memory" count={4} summary="One line." isOpen={false} onToggle={onToggle}><p>Inside</p></FoldPanel>);
    const toggle = screen.getByRole('button', { name: /^Memory/, expanded: false });
    expect(toggle.textContent).toBe('Memory4');
    expect(screen.getByText('One line.')).toBeTruthy();
    const body = container.querySelector('.model-fold-body');
    expect(body?.hasAttribute('hidden')).toBe(true);
    expect(body?.textContent).toBe('Inside');
    expect(toggle.getAttribute('aria-controls')).toBe(body?.id);
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledOnce();
    rerender(<FoldPanel title="Memory" isOpen onToggle={onToggle}><p>Inside</p></FoldPanel>);
    expect(container.querySelector('.model-fold-body')?.hasAttribute('hidden')).toBe(false);
    // With nothing to count no number is printed: a bare zero would read as "none found".
    expect(container.querySelector('.model-fold-count')).toBeNull();
  });
});

describe('hasWrapped', () => {
  function rowOf(boxes: readonly { top: number; height: number }[]): HTMLElement {
    const row = document.createElement('div');
    for (const box of boxes) {
      const child = document.createElement('span');
      Object.defineProperty(child, 'offsetTop', { value: box.top });
      Object.defineProperty(child, 'offsetHeight', { value: box.height });
      row.append(child);
    }
    return row;
  }

  it('is true only when the last item starts at or below the foot of the first', () => {
    expect(hasWrapped(rowOf([{ top: 0, height: 44 }, { top: 16, height: 28 }]))).toBe(false);
    expect(hasWrapped(rowOf([{ top: 0, height: 44 }, { top: 52, height: 28 }]))).toBe(true);
    expect(hasWrapped(rowOf([{ top: 0, height: 44 }]))).toBe(false);
  });

  it('does not call a row wrapped before it has been laid out', () => {
    expect(hasWrapped(rowOf([{ top: 0, height: 0 }, { top: 0, height: 0 }]))).toBe(false);
  });
});

describe('settling a label clear of other connections', () => {
  const lane: LabelledLine = { id: 'lane', points: [{ x: 0, y: 50 }, { x: 400, y: 50 }], card: { x: 150, y: 30, width: 100, height: 40 } };
  const crossing: LabelledLine = { id: 'crossing', points: [{ x: 200, y: 0 }, { x: 200, y: 100 }], card: { x: 190, y: 0, width: 0, height: 0 } };

  it('slides a label along its own run to the nearest place no other line runs under', () => {
    expect(countRunsUnder(lane.card, lane.id, [lane, crossing])).toBe(1);
    const [settled] = settleLabels([lane, crossing], 8);
    expect(countRunsUnder(settled.card, lane.id, [lane, crossing])).toBe(0);
    expect(settled.card.y).toBe(lane.card.y);
    expect(Math.abs(settled.card.x - lane.card.x)).toBeLessThanOrEqual(104);
    expect(settled.card.x).toBeGreaterThanOrEqual(8);
    expect(settled.card.x + settled.card.width).toBeLessThanOrEqual(392);
  });

  it('leaves a clear label where it is, and one with no room to move as well', () => {
    expect(settleLabels([lane], 8)[0]).toBe(lane);
    const tight: LabelledLine = { ...lane, points: [{ x: 140, y: 50 }, { x: 260, y: 50 }] };
    expect(settleLabels([tight, crossing], 8)[0]).toBe(tight);
  });
});

describe('the register\'s columns', () => {
  it('tells the table that the severity sort value runs most severe first', () => {
    const columns = buildRegisterColumns({ leadRiskIds: null, onDecide: () => undefined, onOpenTechnique: () => undefined });
    expect(columns.find((column) => column.id === 'severity')?.isSortValueReversed).toBe(true);
    expect(columns.filter((column) => column.isSortValueReversed === true)).toHaveLength(1);
  });
});

describe('touch targets in the Model stylesheet', () => {
  const rules = parseCss(fs.readFileSync(path.resolve('src/components/threat-model/model-layout.css'), 'utf-8'));
  const coarse = rules.filter((rule) => rule.context.includes('@media (pointer: coarse)'));

  it('gives a cell of Techniques by part, a lane, a fold and a bar line 44px under a coarse pointer', () => {
    const sized = (selector: string, property: string): string | undefined => coarse
      .filter((rule) => splitSelectors(rule.selector).includes(selector)).flatMap((rule) => rule.declarations).find((declaration) => declaration.property === property)?.value;
    expect(sized('.model-matrix-cell', 'width')).toBe('2.75rem');
    expect(sized('.model-matrix-cell', 'height')).toBe('2.75rem');
    for (const selector of ['.model-lane-pick', '.model-fold-toggle', '.model-element-line', '.model-decision']) expect(sized(selector, 'min-height'), selector).toBe('2.75rem');
  });
});
