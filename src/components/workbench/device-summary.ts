import type { DeviceModel, InterfaceDirection } from '@/lib/threat-model/device-model';
import type { ThreatModelReport } from '@/lib/threat-model/report-types';

const DIRECTION_WORDS: Record<InterfaceDirection, string> = {
  read: 'records',
  write: 'stimulates',
  bidirectional: 'records and stimulates',
};

export interface DeviceSummary {
  name: string;
  /** What the device does, as a verb phrase: "records", "stimulates", or both. */
  directionWord: string;
  partCount: number;
  /** Distinct catalog techniques placed on this device. */
  placedTechniqueCount: number;
  chainHypothesisCount: number;
  /** One entry per part, in the model's order; true marks the part in contact with tissue. */
  partsAreInterface: boolean[];
}

/** The few facts about the device in focus that every mode shows, so switching mode never loses the thread. */
export function summariseDevice(model: DeviceModel, report: ThreatModelReport): DeviceSummary {
  const placedTechniqueIds = new Set(report.riskRows.filter((row) => row.source === 'catalog').map((row) => row.techniqueId));
  return {
    name: model.name,
    directionWord: DIRECTION_WORDS[model.direction],
    partCount: model.components.length,
    placedTechniqueCount: placedTechniqueIds.size,
    chainHypothesisCount: report.chainResult.chains.length,
    partsAreInterface: model.components.map((component) => component.isNeuralInterface),
  };
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** The summary as short phrases, in the order they are read. */
export function describeDevice(summary: DeviceSummary): string[] {
  return [
    summary.directionWord,
    plural(summary.partCount, 'part', 'parts'),
    plural(summary.placedTechniqueCount, 'technique placed', 'techniques placed'),
    plural(summary.chainHypothesisCount, 'chain hypothesis', 'chain hypotheses'),
  ];
}
