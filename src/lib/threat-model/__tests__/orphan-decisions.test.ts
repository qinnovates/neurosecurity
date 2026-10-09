import { describe, it, expect } from 'vitest';
import type { RiskDecision } from '../device-model';
import { listOrphanDecisions } from '../orphan-decisions';
import { modelFor, reportFor } from './preset-reports';

const full = modelFor('cortical-read-implant');
const fullReport = reportFor(full);

function decide(riskIds: readonly string[]): RiskDecision[] {
  return riskIds.map((riskId, index) => ({ riskId, status: index % 2 === 0 ? 'mitigated' : 'accepted', note: `note ${index}` }));
}

describe('listOrphanDecisions', () => {
  it('lists nothing while every decision still has its row', () => {
    const model = { ...full, riskDecisions: decide(fullReport.riskRows.slice(0, 4).map((row) => row.riskId)) };
    expect(listOrphanDecisions(model, reportFor(model))).toEqual([]);
  });

  it('lists both decisions made on a part once that part is removed, with the cause', () => {
    const removable = full.components.find((component) => !component.isNeuralInterface && fullReport.riskRows.filter((row) => row.elementId === component.id).length >= 2);
    if (removable === undefined) throw new Error('test setup: no removable part carries two rows');
    const decisions = decide(fullReport.riskRows.filter((row) => row.elementId === removable.id).slice(0, 2).map((row) => row.riskId));
    const model = { ...modelFor('cortical-read-implant', { removedComponentIds: [removable.id] }), riskDecisions: decisions };
    const orphans = listOrphanDecisions(model, reportFor(model));
    expect(orphans.map((orphan) => orphan.decision)).toEqual(decisions);
    for (const orphan of orphans) {
      expect(orphan).toMatchObject({ cause: 'element_removed', elementId: removable.id });
      expect(orphan.detail).toBe('The part or connection this decision was recorded on is no longer in the model.');
    }
  });

  it('lists a decision on a connection that went with its part', () => {
    const link = full.links[0];
    const [row] = fullReport.riskRows.filter((candidate) => candidate.elementId === link.id);
    const removedId = full.components.find((component) => !component.isNeuralInterface && [link.fromComponentId, link.toComponentId].includes(component.id))?.id;
    if (removedId === undefined) throw new Error('test setup: the first connection has no removable end');
    const model = { ...modelFor('cortical-read-implant', { removedComponentIds: [removedId] }), riskDecisions: decide([row.riskId]) };
    expect(listOrphanDecisions(model, reportFor(model))).toMatchObject([{ cause: 'element_removed', elementId: link.id }]);
  });

  it('gives the unmet condition when the technique no longer applies to a part that is still there', () => {
    const sensesRows = fullReport.riskRows.filter((row) => row.entryPath === 'senses');
    expect(sensesRows.length).toBeGreaterThan(0);
    const model = { ...modelFor('cortical-read-implant', { presentsStimuli: false }), riskDecisions: decide(sensesRows.map((row) => row.riskId)) };
    const orphans = listOrphanDecisions(model, reportFor(model));
    expect(orphans.map((orphan) => orphan.decision.riskId)).toEqual(sensesRows.map((row) => row.riskId));
    for (const orphan of orphans) {
      expect(orphan.cause).toBe('technique_no_longer_applies');
      expect(orphan.detail).toBe('The technique no longer applies here. Needs the system to show images or play sounds to the patient; this one does not.');
      expect(orphan.techniqueId).toBe(sensesRows.find((row) => row.riskId === orphan.decision.riskId)?.techniqueId);
    }
  });

  it('lists a decision whose technique has left the catalog, and one on a baseline category that no longer exists', () => {
    const [part] = full.components;
    const decisions = decide([`${part.id}::QIF-T9999`, `${part.id}::STRIDE-not_a_category`]);
    const model = { ...full, riskDecisions: decisions };
    expect(listOrphanDecisions(model, reportFor(model)).map((orphan) => [orphan.cause, orphan.techniqueId])).toEqual([
      ['technique_not_in_catalog', 'QIF-T9999'], ['baseline_no_longer_applies', null],
    ]);
  });

  it('accounts for every decision: it has a current row or it is listed', () => {
    const everyId = fullReport.riskRows.map((row) => row.riskId);
    const model = { ...modelFor('cortical-read-implant', { presentsStimuli: false, removedComponentIds: [full.components[full.components.length - 1].id] }), riskDecisions: decide(everyId) };
    const report = reportFor(model);
    const current = new Set(report.riskRows.filter((row) => row.catalogState === 'current').map((row) => row.riskId));
    const orphanIds = listOrphanDecisions(model, report).map((orphan) => orphan.decision.riskId);
    expect(orphanIds.length).toBeGreaterThan(0);
    expect(orphanIds.length + everyId.filter((riskId) => current.has(riskId)).length).toBe(everyId.length);
  });
});
