import type { CatalogTechnique } from './catalog-types';
import type { DeviceModel } from './device-model';
import type { StrideMap } from './reference-data-types';
import type { StrideCategory } from './report-types';

export const STRIDE_LABELS: Record<StrideCategory, string> = {
  spoofing: 'Spoofing',
  tampering: 'Tampering',
  repudiation: 'Repudiation',
  information_disclosure: 'Information disclosure',
  denial_of_service: 'Denial of service',
  elevation_of_privilege: 'Elevation of privilege',
};

export interface BaselineThreat {
  elementId: string;
  elementLabel: string;
  category: StrideCategory;
}

/** STRIDE categories a catalog technique falls under, from its tactic and its mode. */
export function strideForTechnique(technique: CatalogTechnique, strideMap: StrideMap): StrideCategory[] {
  const byTactic = strideMap.strideByTactic[technique.tactic] ?? [];
  const byMode = technique.mode === null ? [] : strideMap.strideByMode[technique.mode];
  return [...new Set([...byTactic, ...byMode])];
}

export function describeLink(model: DeviceModel, linkId: string): string {
  const link = model.links.find((candidate) => candidate.id === linkId);
  if (link === undefined) return linkId;
  const labelOf = (componentId: string): string =>
    model.components.find((component) => component.id === componentId)?.label ?? componentId;
  return `${labelOf(link.fromComponentId)} to ${labelOf(link.toComponentId)} (${link.medium.replaceAll('_', ' ')})`;
}

export function describeElement(model: DeviceModel, elementId: string): string {
  const component = model.components.find((candidate) => candidate.id === elementId);
  return component === undefined ? describeLink(model, elementId) : component.label;
}

/**
 * The generic STRIDE-per-element baseline: every component and link gets the
 * categories that apply to its kind, independent of the neural technique catalog.
 */
export function listBaselineThreats(model: DeviceModel, strideMap: StrideMap): BaselineThreat[] {
  const componentThreats = model.components.flatMap((component) =>
    strideMap.strideByComponentKind[component.kind].map((category): BaselineThreat => ({
      elementId: component.id, elementLabel: component.label, category,
    })));
  const linkThreats = model.links.flatMap((link) =>
    strideMap.strideForLink.map((category): BaselineThreat => ({
      elementId: link.id, elementLabel: describeLink(model, link.id), category,
    })));
  return [...componentThreats, ...linkThreats];
}
