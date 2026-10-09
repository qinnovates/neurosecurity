import { describe, it, expect } from 'vitest';
import { SCOPE_TERMS } from '../lab-terms';
import { collectExclusions } from '../match-techniques';
import { NO_MATCHING_ELEMENT_RULE, SCOPE_LIST_BY_TERM, diffScope, listScopeEntries, summariseScope } from '../scope-statement';
import { PRESETS, engineData, modelFor, referenceData, reportFor } from './preset-reports';

const { placements, notPlaced } = referenceData.placementRules;
const SENSES_TECHNIQUE_IDS = Object.keys(placements).filter((techniqueId) => placements[techniqueId].entryPath === 'senses');

describe.each(PRESETS)('scope of the preset %s', (_id, { model, report }) => {
  const scope = summariseScope(model, engineData, referenceData);
  const entries = listScopeEntries(scope);

  it('puts every catalog technique under exactly one term, and the four lists sum to the catalog', () => {
    expect(scope.total).toBe(engineData.techniques.length);
    expect(scope.applies.length + scope.wouldApplyIf.length + scope.reviewedOutside.length + scope.notAssessed.length).toBe(engineData.techniques.length);
    expect(new Set(entries.map((entry) => entry.techniqueId)).size).toBe(engineData.techniques.length);
    for (const term of SCOPE_TERMS) expect(scope[SCOPE_LIST_BY_TERM[term]].every((entry) => entry.term === term), term).toBe(true);
  });

  it('lists under "applies" exactly the techniques the engine put on the device, with the elements', () => {
    const catalogRows = report.riskRows.filter((row) => row.source === 'catalog');
    expect(new Set(scope.applies.map((entry) => entry.techniqueId))).toEqual(new Set(catalogRows.map((row) => row.techniqueId)));
    for (const entry of scope.applies) {
      expect([...entry.elementIds].sort(), entry.techniqueId).toEqual(catalogRows.filter((row) => row.techniqueId === entry.techniqueId).map((row) => row.elementId).sort());
      expect(entry.reason).toBe(placements[entry.techniqueId].basis);
    }
  });

  it('gives every "would apply if" technique at least one condition the engine evaluated, with the answer that restores it', () => {
    expect(scope.applies.length + scope.wouldApplyIf.length).toBe(Object.keys(placements).length);
    for (const entry of scope.wouldApplyIf) {
      expect(entry.conditions.length, entry.techniqueId).toBeGreaterThan(0);
      for (const condition of entry.conditions) {
        expect(condition.ruleId, entry.techniqueId).toMatch(/^(precondition\.|placement\.no-matching-element$)/);
        expect(condition.detail.length).toBeGreaterThan(10);
        expect(condition.restoringAnswer.length).toBeGreaterThan(10);
      }
    }
  });

  it('keeps the stored reason for every technique reviewed and outside the device', () => {
    expect(scope.reviewedOutside).toHaveLength(Object.keys(notPlaced).length);
    for (const entry of scope.reviewedOutside) expect(entry.reason).toBe(notPlaced[entry.techniqueId].reason);
  });

  it('keeps, per technique and element, each unmet condition the engine used to fold away', () => {
    const exclusions = collectExclusions(report.elementOutcomes);
    const unmetIds = new Set(scope.wouldApplyIf.filter((entry) => entry.conditions.some((condition) => condition.ruleId.startsWith('precondition.'))).map((entry) => entry.techniqueId));
    const withElement = new Set(scope.wouldApplyIf.filter((entry) => !entry.conditions.some((condition) => condition.ruleId === NO_MATCHING_ELEMENT_RULE)).map((entry) => entry.techniqueId));
    expect(new Set(exclusions.map((exclusion) => exclusion.techniqueId))).toEqual(new Set([...unmetIds].filter((techniqueId) => withElement.has(techniqueId))));
    for (const exclusion of exclusions) expect(exclusion.reason.ruleId).toMatch(/^precondition\./);
  });
});

describe('diffScope', () => {
  const before = summariseScope(modelFor('cortical-read-implant'), engineData, referenceData);

  it('reports nothing when nothing changed', () => {
    expect(diffScope(before, before)).toEqual([]);
  });

  it('lists the techniques that leave when the system stops presenting stimuli, with the reason and the restoring answer', () => {
    const model = modelFor('cortical-read-implant', { presentsStimuli: false });
    const changes = diffScope(before, summariseScope(model, engineData, referenceData));
    expect(changes.map((change) => change.techniqueId).sort()).toEqual([...SENSES_TECHNIQUE_IDS].sort());
    for (const change of changes) {
      expect(change).toMatchObject({ direction: 'left', from: 'applies', to: 'would_apply_if' });
      expect(change.conditions).toEqual([{
        ruleId: 'precondition.stimuli',
        detail: 'Needs the system to show images or play sounds to the patient; this one does not.',
        restoringAnswer: 'The system shows images or plays sounds to the patient.',
      }]);
      expect(change.reason).toBe(change.conditions[0].detail);
    }
  });

  it('lists the same techniques as arriving when the answer is restored', () => {
    const without = summariseScope(modelFor('cortical-read-implant', { presentsStimuli: false }), engineData, referenceData);
    const changes = diffScope(without, before);
    expect(changes.map((change) => change.techniqueId).sort()).toEqual([...SENSES_TECHNIQUE_IDS].sort());
    for (const change of changes) {
      expect(change).toMatchObject({ direction: 'arrived', from: 'would_apply_if', to: 'applies', reason: placements[change.techniqueId].basis });
      expect(change.conditions[0].ruleId).toBe('precondition.stimuli');
    }
  });

  it('names the missing part when a technique leaves because its part was removed', () => {
    const full = modelFor('cortical-read-implant');
    const removable = full.components.find((component) => !component.isNeuralInterface);
    if (removable === undefined) throw new Error('test setup: the preset has no removable part');
    const after = summariseScope(modelFor('cortical-read-implant', { removedComponentIds: [removable.id] }), engineData, referenceData);
    const afterReport = reportFor(modelFor('cortical-read-implant', { removedComponentIds: [removable.id] }));
    const stillOnDevice = new Set(afterReport.riskRows.map((row) => row.techniqueId));
    for (const change of diffScope(before, after)) {
      expect(change.direction).toBe('left');
      expect(stillOnDevice.has(change.techniqueId)).toBe(false);
      expect(change.conditions.map((condition) => condition.ruleId)).toContain(NO_MATCHING_ELEMENT_RULE);
    }
  });
});
