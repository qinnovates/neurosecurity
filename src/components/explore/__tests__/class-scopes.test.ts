import { describe, it, expect } from 'vitest';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { modelFromArchetype } from '@/lib/threat-model/intake-to-model';
import { compareClass, compareModel, describeIdenticalSet, findIdenticalSets, listClassDifferences, type ComparedDevice } from '../start/class-scopes';
import { engineData, referenceData } from './lab-harness';

const classes = referenceData.archetypes.map((archetype) => compareClass(archetype, engineData, referenceData));
const techniqueOrder = engineData.techniques.map((technique) => technique.id);

/** The applying set of a class by another road: the catalog rows of the register the engine builds for it. */
function registerTechniqueIds(model: DeviceModel): string[] {
  const report = buildThreatModelReport({ model, engineData, referenceData, generatedAt: '' });
  return [...new Set(report.riskRows.flatMap((row) => (row.source === 'catalog' && row.techniqueId !== null ? [row.techniqueId] : [])))].sort();
}

function appliesIds(device: ComparedDevice): string[] {
  return device.scope.applies.map((entry) => entry.techniqueId).sort();
}

describe('the classes side by side', () => {
  it('reads each class from the class file, in file order', () => {
    expect(classes.map((device) => device.label)).toEqual(referenceData.archetypes.map((archetype) => archetype.label));
  });

  it('finds the same applying set as the register built for the class', () => {
    referenceData.archetypes.forEach((archetype, index) => {
      expect(appliesIds(classes[index])).toEqual(registerTechniqueIds(modelFromArchetype(archetype, engineData.registrarVersion)));
    });
  });

  it('reports classes as identical only when their computed sets are equal', () => {
    const signatures = classes.map((device) => appliesIds(device).join('|'));
    const expectedGroups = [...new Set(signatures)]
      .map((signature) => classes.filter((_device, index) => signatures[index] === signature).map((device) => device.label))
      .filter((labels) => labels.length > 1);
    expect(findIdenticalSets(classes).map((set) => set.labels)).toEqual(expectedGroups);
  });

  it('says nothing when no two sets are equal, and names every member when they are', () => {
    const [first] = classes;
    const shorter: ComparedDevice = { ...first, id: 'shorter', label: 'Shorter', scope: { ...first.scope, applies: first.scope.applies.slice(1), wouldApplyIf: [...first.scope.wouldApplyIf, first.scope.applies[0]] } };
    expect(findIdenticalSets([first, shorter])).toEqual([]);
    const twin = { ...first, id: 'twin', label: 'Twin' };
    const [set] = findIdenticalSets([first, shorter, twin]);
    expect(set).toEqual({ labels: [first.label, 'Twin'], techniqueCount: first.scope.applies.length });
    expect(describeIdenticalSet(set)).toBe(`The same ${first.scope.applies.length} techniques apply to ${first.label} and Twin.`);
  });

  it('lists exactly the techniques that apply to one class and not another, in catalog order', () => {
    const differences = listClassDifferences(classes, techniqueOrder);
    const sets = classes.map((device) => new Set(appliesIds(device)));
    const expected = techniqueOrder.filter((techniqueId) => new Set(sets.map((set) => set.has(techniqueId))).size > 1);
    expect(differences.map((difference) => difference.techniqueId)).toEqual(expected);
    for (const difference of differences) {
      expect(difference.entries).toHaveLength(classes.length);
      expect(difference.entries.some((entry) => entry.term === 'applies')).toBe(true);
      expect(difference.entries.filter((entry) => entry.term === 'would_apply_if').every((entry) => entry.conditions.length > 0)).toBe(true);
    }
  });

  it('has no difference between a class and itself', () => {
    const [first] = classes;
    const again = compareModel('again', 'Again', first.model, engineData, referenceData);
    expect(listClassDifferences([first, again], techniqueOrder)).toEqual([]);
  });
});
