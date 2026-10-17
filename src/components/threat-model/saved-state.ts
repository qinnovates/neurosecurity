/**
 * Reads back a device saved in this browser. The saved text is treated like any imported
 * file: it goes through the same parser, so a tampered or outdated copy is rejected.
 */

import { MODEL_LIMITS, type DeviceModel } from '@/lib/threat-model/device-model';
import { DeviceModelFormatError } from '@/lib/threat-model/errors';
import { isRecord } from '@/lib/threat-model/guards';
import { parseDeviceModelText } from '@/lib/threat-model/parse-device-model';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';
import { isUntouchedPreset, type StudioState } from './studio-state';

export function serialiseState(state: StudioState): string {
  return JSON.stringify({ archetypeId: state.archetypeId, model: state.model });
}

function parseEnvelope(text: string): { archetypeId: unknown; model: unknown } {
  if (text.length > MODEL_LIMITS.maxFileBytes) throw new DeviceModelFormatError('the saved copy is too large');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new DeviceModelFormatError('the saved copy is not valid JSON');
  }
  if (!isRecord(parsed)) throw new DeviceModelFormatError('the saved copy has an unexpected shape');
  return { archetypeId: parsed.archetypeId, model: parsed.model };
}

/**
 * @throws DeviceModelFormatError when the saved text cannot be trusted
 */
export function parseSavedState(text: string, archetypes: readonly DeviceArchetype[], knownRegionIds: ReadonlySet<string>): StudioState {
  const envelope = parseEnvelope(text);
  const model: DeviceModel = parseDeviceModelText(JSON.stringify(envelope.model), knownRegionIds);
  const archetype = archetypes.find((candidate) => candidate.id === envelope.archetypeId);
  // The saved preset name is believed only while the model still equals that preset; any other model is just a model.
  const archetypeId = archetype !== undefined && isUntouchedPreset(model, archetype) ? archetype.id : null;
  return { archetypeId, model, editProblem: null };
}
