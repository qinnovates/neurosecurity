/**
 * Saving and loading files in the browser. Nothing here touches the network:
 * exports are built in memory and handed to the browser's download mechanism,
 * and imports are read from a file the user picks.
 */

import { MODEL_LIMITS, type DeviceModel } from '@/lib/threat-model/device-model';
import { DeviceModelFormatError } from '@/lib/threat-model/errors';
import { parseDeviceModelText } from '@/lib/threat-model/parse-device-model';

const SAFE_FILENAME_PATTERN = /[^a-z0-9]+/g;
const FALLBACK_FILENAME = 'device';
const MAX_FILENAME_STEM = 40;

function toFilenameStem(name: string): string {
  const stem = name.toLowerCase().replace(SAFE_FILENAME_PATTERN, '-').replace(/^-+|-+$/g, '').slice(0, MAX_FILENAME_STEM);
  return stem.length > 0 ? stem : FALLBACK_FILENAME;
}

function downloadText(filename: string, mimeType: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadModelFile(model: DeviceModel): void {
  downloadText(`${toFilenameStem(model.name)}.threat-model.json`, 'application/json', `${JSON.stringify(model, null, 2)}\n`);
}

export function downloadRegisterCsv(model: DeviceModel, csv: string): void {
  downloadText(`${toFilenameStem(model.name)}.risk-register.csv`, 'text/csv;charset=utf-8', csv);
}

/**
 * Reads and validates a model file the user selected.
 * @throws DeviceModelFormatError with a message that is safe to show
 */
export async function readModelFile(file: File, knownRegionIds: ReadonlySet<string>): Promise<DeviceModel> {
  // Checked before the file is read, so an oversized file is never loaded into memory.
  if (file.size > MODEL_LIMITS.maxFileBytes) {
    throw new DeviceModelFormatError(`it is larger than ${MODEL_LIMITS.maxFileBytes / 1_000_000} MB`);
  }
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new DeviceModelFormatError('the browser could not read it');
  }
  return parseDeviceModelText(text, knownRegionIds);
}
