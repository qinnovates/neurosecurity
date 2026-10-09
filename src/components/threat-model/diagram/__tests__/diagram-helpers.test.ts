import { describe, it, expect } from 'vitest';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import { derivePayloadFlows } from '@/lib/threat-model/payload-flow';
import { countRowsByElement } from '@/lib/threat-model/register-counts';
import { PRESETS, modelFor } from '@/lib/threat-model/__tests__/preset-reports';
import { doesSegmentEnterBox, headingOf, isOnBoxEdge, roundedPath } from '../diagram-geometry';
import { FULL_METRICS, LABEL_LINE_CHARACTERS, LABEL_LINE_COUNT, MINI_METRICS, UNBADGED_METRICS, cardHeightFor } from '../diagram-metrics';
import { buildStepMarks, currentStepElementId } from '../diagram-types';
import { planEdges, type GridNode } from '../edge-plan';
import { buildBadges, describeBadge, splitBar } from '../element-badges';
import { wrapLabel } from '../label-lines';
import { buildPayloadTags, describePayloadTags, passDirectionOf } from '../payload-tags';

describe('wrapLabel', () => {
  it('keeps a short name on one line and breaks a longer one between words', () => {
    expect(wrapLabel('Charger', LABEL_LINE_CHARACTERS, LABEL_LINE_COUNT)).toEqual(['Charger']);
    expect(wrapLabel('Pulse generator and leads', LABEL_LINE_CHARACTERS, LABEL_LINE_COUNT)).toEqual(['Pulse generator and', 'leads']);
  });

  it('never returns more lines or longer lines than asked, and ends a cut name with an ellipsis', () => {
    const lines = wrapLabel('Implanted pulse generator with a deliberately long name', 19, 2);
    expect(lines).toHaveLength(2);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(19);
    expect(lines[1].endsWith('…')).toBe(true);
    expect(wrapLabel('Supercalifragilisticexpialidocious', 10, 2).every((line) => line.length <= 10)).toBe(true);
    expect(wrapLabel('   ', 10, 2)).toEqual([]);
  });
});

describe('badges', () => {
  it.each(PRESETS)('for %s: one per element, with widths that add up to the bar', (_presetId, { model, report }) => {
    const counts = countRowsByElement(model, report.riskRows);
    const badges = buildBadges({ elementCounts: counts });
    expect(badges.size).toBe(counts.length);
    for (const given of counts) {
      const badge = badges.get(given.id);
      expect(badge?.kind).toBe(given.catalogRows === 0 ? 'not-assessed' : 'split');
      if (badge?.kind !== 'split') continue;
      const shares = splitBar(badge.bySeverity, 40);
      expect(shares.reduce((sum, share) => sum + share.count, 0)).toBe(given.openCatalogRows);
      if (shares.length > 0) expect(shares.reduce((sum, share) => sum + share.width, 0)).toBe(40);
      expect(shares.map((share) => share.severity)).toEqual(CATALOG_SEVERITIES.filter((severity) => given.openBySeverity[severity] > 0));
    }
  });

  it('does not call an element "not assessed" because a filter left it no row', () => {
    const { model, report } = PRESETS[0][1];
    const filteredOut = countRowsByElement(model, []);
    const badges = buildBadges({ elementCounts: filteredOut, notAssessedElementIds: new Set() });
    expect([...badges.values()].every((badge) => badge.kind === 'split' && badge.open === 0)).toBe(true);
    expect(report.riskRows.length).toBeGreaterThan(0);
  });

  it('describes a badge in words and never as a bare zero for an element with nothing placed', () => {
    expect(describeBadge({ kind: 'not-assessed' })).toContain('Not assessed');
    expect(describeBadge({ kind: 'total', open: 1 })).toBe('1 open catalog row.');
    expect(describeBadge({ kind: 'split', open: 3, bySeverity: { critical: 1, high: 2, medium: 0, low: 0 } })).toBe('3 open catalog rows: 1 critical, 2 high, 0 medium, 0 low.');
    expect(describeBadge(undefined)).toBe('');
    expect(splitBar({ critical: 0, high: 0, medium: 0, low: 0 }, 40)).toEqual([]);
  });
});

describe('payload tags', () => {
  const model = modelFor('noninvasive-eeg-headset');
  const flows = derivePayloadFlows(model);

  it('turns each arrow with the line for a from-to flow and against it otherwise, and names the part it travels to', () => {
    const link = model.links[0];
    const tags = buildPayloadTags(flows.get(link.id) ?? [], { model, linkId: link.id, lineHeading: 'right' });
    expect(tags.map((tag) => tag.heading)).toEqual((flows.get(link.id) ?? []).map((flow) => (flow.isFromTo === true ? 'right' : 'left')));
    expect(describePayloadTags(tags)).toContain(' to ');
  });

  it('gives a flow with no derived direction no arrow, and a connection carrying nothing no pass', () => {
    const tags = buildPayloadTags([{ payload: 'neuralData', sense: null, isFromTo: null }], { model, linkId: model.links[0].id, lineHeading: 'down' });
    expect(tags[0].heading).toBeNull();
    expect(tags[0].towardLabel).toBeNull();
    expect(passDirectionOf([])).toBeNull();
    expect(passDirectionOf([{ payload: 'neuralData', sense: 'away', isFromTo: true }])).toBe('forward');
    expect(passDirectionOf([{ payload: 'softwareUpdates', sense: 'toward', isFromTo: false }])).toBe('backward');
    expect(passDirectionOf(flows.get(model.links[0].id) ?? [])).toBe('both');
  });
});

describe('chain step marks', () => {
  const steps = [{ elementId: 'a', position: 1 }, { elementId: 'b', position: 2 }, { elementId: 'b', position: 3 }, { elementId: 'c', position: 4 }];

  it('shows every step as reached in the still picture, and follows playback otherwise', () => {
    expect([...buildStepMarks(steps, undefined).values()].map((mark) => mark.state)).toEqual(['reached', 'reached', 'reached']);
    const playing = buildStepMarks(steps, 2);
    expect(playing.get('a')).toEqual({ text: '1', state: 'reached' });
    expect(playing.get('b')).toEqual({ text: '2,3', state: 'now' });
    expect(playing.get('c')?.state).toBe('ahead');
    expect(currentStepElementId(steps, 2)).toBe('b');
    expect(currentStepElementId(steps, undefined)).toBeNull();
  });
});

describe('geometry and metrics', () => {
  const box = { x: 10, y: 10, width: 20, height: 10 };

  it('tells a line that enters a box from one that only touches it', () => {
    expect(doesSegmentEnterBox({ x: 0, y: 15 }, { x: 40, y: 15 }, box)).toBe(true);
    expect(doesSegmentEnterBox({ x: 0, y: 15 }, { x: 10, y: 15 }, box)).toBe(false);
    expect(doesSegmentEnterBox({ x: 0, y: 10 }, { x: 40, y: 10 }, box)).toBe(false);
    expect(isOnBoxEdge({ x: 10, y: 15 }, box)).toBe(true);
    expect(isOnBoxEdge({ x: 20, y: 15 }, box)).toBe(false);
  });

  it('names headings and rounds corners without leaving the corner', () => {
    expect(headingOf({ x: 0, y: 0 }, { x: -5, y: 0 })).toBe('left');
    expect(headingOf({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe('down');
    expect(roundedPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], 4)).toBe('M 0 0 L 6 0 Q 10 0 10 4 L 10 10');
    expect(roundedPath([], 4)).toBe('');
  });

  it('sizes a label by the payloads it lists, and draws none in the miniature', () => {
    expect(cardHeightFor(2, FULL_METRICS) - cardHeightFor(0, FULL_METRICS)).toBe(2 * FULL_METRICS.cardLineHeight);
    expect(cardHeightFor(1, UNBADGED_METRICS)).toBeLessThan(cardHeightFor(1, FULL_METRICS));
    expect(cardHeightFor(3, MINI_METRICS)).toBe(0);
  });
});

describe('planEdges', () => {
  const node = (id: string, col: number, row: number): GridNode => ({ id, label: id, col, row, isTissueContact: false });
  const link = (fromId: string, toId: string) => ({ id: `${fromId}-${toId}`, label: 'usb', fromId, toId, payloadCount: 0 });

  it('draws neighbours straight and sends a connection that would cross a part along a lane', () => {
    const plan = planEdges([node('a', 0, 0), node('b', 1, 0), node('c', 2, 0)], [link('a', 'b'), link('a', 'c')]);
    expect(plan.plans.map((edge) => edge.kind)).toEqual(['row', 'lane']);
  });

  it('shares a lane between two connections that meet on one part, and separates two that overlap', () => {
    const nodes = [node('a', 0, 0), node('b', 1, 0), node('c', 2, 0), node('d', 3, 0), node('e', 4, 0)];
    const plan = planEdges(nodes, [link('a', 'c'), link('c', 'e'), link('d', 'a')]);
    const lanes = plan.plans.flatMap((edge) => (edge.kind === 'lane' ? [`${edge.fromChannel}:${edge.fromLane}`] : []));
    expect(lanes).toEqual(['0:0', '0:0', '1:0']);
  });

  it('turns in a gap between columns when the two ends are more than one row apart', () => {
    const plan = planEdges([node('a', 0, 0), node('b', 0, 1), node('c', 0, 2), node('d', 1, 2)], [link('a', 'd')]);
    const [edge] = plan.plans;
    expect(edge.kind === 'lane' && edge.turn !== null).toBe(true);
    expect(plan.gutterSlots).toEqual([1, 0]);
  });
});
