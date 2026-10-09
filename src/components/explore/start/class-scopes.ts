/**
 * The device classes side by side: the scope statement of each, which of them have the same
 * set of applying techniques, and the techniques that apply to one and not another. Every
 * value is computed from the class file, the placement table and the catalog.
 */

import type { EngineData } from '@/lib/threat-model/catalog-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { modelFromArchetype } from '@/lib/threat-model/intake-to-model';
import type { DeviceArchetype, ReferenceData } from '@/lib/threat-model/reference-data-types';
import { diffScope, listScopeEntries, summariseScope, type ScopeEntry, type ScopeStatement } from '@/lib/threat-model/scope-statement';

type ScopeReference = Pick<ReferenceData, 'placementRules'>;

/** One device as the Start view compares it: a class from the class file, or the reader's own device. */
export interface ComparedDevice {
  id: string;
  label: string;
  model: DeviceModel;
  scope: ScopeStatement;
}

export function compareModel(id: string, label: string, model: DeviceModel, engineData: EngineData, referenceData: ScopeReference): ComparedDevice {
  return { id, label, model, scope: summariseScope(model, engineData, referenceData) };
}

/** A class as its file describes it, untouched. */
export function compareClass(archetype: DeviceArchetype, engineData: EngineData, referenceData: ScopeReference): ComparedDevice {
  return compareModel(archetype.id, archetype.label, modelFromArchetype(archetype, engineData.registrarVersion), engineData, referenceData);
}

function appliesSignature(device: ComparedDevice): string {
  return device.scope.applies.map((entry) => entry.techniqueId).sort().join('\n');
}

/** Two or more devices to which exactly the same techniques apply. */
export interface IdenticalSet {
  labels: string[];
  techniqueCount: number;
}

/** Every group of devices whose sets of applying techniques are equal, in the order the devices were given. */
export function findIdenticalSets(devices: readonly ComparedDevice[]): IdenticalSet[] {
  const groups = new Map<string, ComparedDevice[]>();
  for (const device of devices) {
    const signature = appliesSignature(device);
    groups.set(signature, [...(groups.get(signature) ?? []), device]);
  }
  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({ labels: group.map((device) => device.label), techniqueCount: group[0].scope.applies.length }));
}

const LABEL_LIST = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/** The one sentence printed for a group of devices with the same applying set. */
export function describeIdenticalSet(set: IdenticalSet): string {
  const noun = set.techniqueCount === 1 ? 'technique applies' : 'techniques apply';
  return `The same ${set.techniqueCount} ${noun} to ${LABEL_LIST.format(set.labels)}.`;
}

/** One technique that applies to at least one compared device and not to another. */
export interface ClassDifference {
  techniqueId: string;
  name: string;
  /** The technique's scope entry on each device, in the order the devices were given. */
  entries: ScopeEntry[];
}

function listDifferingIds(devices: readonly ComparedDevice[]): Set<string> {
  const differing = new Set<string>();
  devices.forEach((before, index) => {
    for (const after of devices.slice(index + 1)) {
      for (const change of diffScope(before.scope, after.scope)) differing.add(change.techniqueId);
    }
  });
  return differing;
}

/** The techniques that start or stop applying between any two of the devices, in catalog order. */
export function listClassDifferences(devices: readonly ComparedDevice[], techniqueOrder: readonly string[]): ClassDifference[] {
  const differing = listDifferingIds(devices);
  const entriesByDevice = devices.map((device) => new Map(listScopeEntries(device.scope).map((entry) => [entry.techniqueId, entry])));
  return techniqueOrder.filter((techniqueId) => differing.has(techniqueId)).flatMap((techniqueId): ClassDifference[] => {
    const entries = entriesByDevice.flatMap((byId) => { const entry = byId.get(techniqueId); return entry === undefined ? [] : [entry]; });
    // A technique missing from any statement cannot be compared; the four lists always hold the whole catalog.
    return entries.length === devices.length ? [{ techniqueId, name: entries[0].name, entries }] : [];
  });
}
