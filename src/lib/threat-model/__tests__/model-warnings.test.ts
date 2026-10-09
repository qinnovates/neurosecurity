import { describe, it, expect } from 'vitest';
import type { DeviceModel } from '../device-model';
import { applyModelEdit, startBlankModel } from '../model-edit';
import { MODEL_WARNING_KINDS, findModelWarnings } from '../model-warnings';
import { describeLink } from '../stride';
import { PRESETS, engineData, modelFor } from './preset-reports';

const { regions } = engineData;
const deepRegion = regions.find((region) => region.depthClass === 'subcortical')!;
const corticalRegion = regions.find((region) => region.depthClass === 'cortical')!;

function kindsOf(model: DeviceModel): string[] {
  return findModelWarnings(model, regions).map((warning) => warning.kind);
}

describe('findModelWarnings', () => {
  it.each(PRESETS)('finds nothing to warn about in the preset %s', (_presetId, preset) => {
    expect(findModelWarnings(preset.model, regions)).toEqual([]);
  });

  it('names every part that no connection touches', () => {
    const blank = startBlankModel(modelFor('cortical-read-implant'));
    if (!blank.isAccepted) throw new Error(blank.problem);
    const added = applyModelEdit(blank.model, { type: 'part-added', part: { label: 'Relay <b>wand</b>', kind: 'wearable_processor', trustZone: 'on_body', isSharedAcrossPatients: false } });
    if (!added.isAccepted) throw new Error(added.problem);
    const warnings = findModelWarnings(added.model, regions);
    expect(warnings.map((warning) => [warning.kind, warning.subjectId])).toEqual(added.model.components.map((part) => ['part_without_connection', part.id]));
    expect(warnings[1].message).toBe('"Relay <b>wand</b>" has no connection to another part.');
  });

  it('warns when a non-invasive device targets a region the atlas does not record as cortical', () => {
    const headset = modelFor('noninvasive-eeg-headset');
    const warnings = findModelWarnings({ ...headset, targetRegionIds: [corticalRegion.id, deepRegion.id] }, regions);
    expect(warnings).toEqual([{
      kind: 'noninvasive_deep_site', subjectId: deepRegion.id,
      message: `The device is recorded as non-invasive, and its target region "${deepRegion.name}" is recorded in the atlas as ${deepRegion.depthClass}.`,
    }]);
  });

  it('says nothing about a deep region on an invasive device, or a region the atlas gives no depth for', () => {
    const stimulator = modelFor('subcortical-stimulator');
    expect(kindsOf({ ...stimulator, targetRegionIds: [deepRegion.id] })).toEqual([]);
    const headset = modelFor('noninvasive-eeg-headset');
    const unspecified = [{ ...deepRegion, depthClass: 'unspecified' }];
    expect(findModelWarnings({ ...headset, targetRegionIds: [deepRegion.id] }, unspecified)).toEqual([]);
  });

  it('warns for each connection marked as carrying stimulation commands on a records-only device', () => {
    const stimulator = modelFor('subcortical-stimulator');
    const carrying = stimulator.links.filter((link) => link.carriesStimulationCommands);
    expect(carrying.length).toBeGreaterThan(0);
    expect(kindsOf(stimulator)).toEqual([]);
    const recordsOnly: DeviceModel = { ...stimulator, direction: 'read' };
    const warnings = findModelWarnings(recordsOnly, regions);
    expect(warnings.map((warning) => warning.subjectId)).toEqual(carrying.map((link) => link.id));
    expect(warnings[0].message).toContain(describeLink(recordsOnly, carrying[0].id));
  });

  it('only ever reports the kinds it declares, and never changes the model', () => {
    const model: DeviceModel = { ...modelFor('subcortical-stimulator'), direction: 'read', invasiveness: 'noninvasive', links: [] };
    const frozen = JSON.stringify(model);
    const kinds = new Set(kindsOf(model));
    expect([...kinds].sort()).toEqual([...MODEL_WARNING_KINDS].filter((kind) => kind !== 'records_only_stimulation_connection').sort());
    expect(JSON.stringify(model)).toBe(frozen);
  });
});
