/**
 * The four security architecture views FDA's premarket guidance recommends,
 * expressed as highlights over the one device diagram.
 */

import type { DeviceModel, ModelLink } from './device-model';
import type { ArchitectureViewSelection } from './report-types';

function endpointsOf(links: readonly ModelLink[]): string[] {
  return [...new Set(links.flatMap((link) => [link.fromComponentId, link.toComponentId]))];
}

function selectGlobalSystem(model: DeviceModel): ArchitectureViewSelection {
  return {
    view: 'global_system',
    highlightedComponentIds: model.components.map((component) => component.id),
    highlightedLinkIds: model.links.map((link) => link.id),
    explanation: 'Every component and connection in the modelled system.',
  };
}

function selectMultiPatientHarm(model: DeviceModel): ArchitectureViewSelection {
  const sharedIds = model.components.filter((component) => component.isSharedAcrossPatients).map((component) => component.id);
  const touchingLinks = model.links.filter((link) => sharedIds.includes(link.fromComponentId) || sharedIds.includes(link.toComponentId));
  return {
    view: 'multi_patient_harm',
    highlightedComponentIds: sharedIds,
    highlightedLinkIds: touchingLinks.map((link) => link.id),
    explanation: sharedIds.length > 0
      ? 'Components shared across patients, and their connections. A compromise here can reach more than one patient.'
      : 'No component in the model is marked as shared across patients.',
  };
}

function selectUpdateability(model: DeviceModel): ArchitectureViewSelection {
  const updateLinks = model.links.filter((link) => link.carriesSoftwareUpdates);
  return {
    view: 'updateability',
    highlightedComponentIds: endpointsOf(updateLinks),
    highlightedLinkIds: updateLinks.map((link) => link.id),
    explanation: updateLinks.length > 0
      ? 'The path software updates and patches travel, end to end.'
      : 'No connection in the model carries software updates. State how the device is patched.',
  };
}

function selectSecurityUseCase(model: DeviceModel): ArchitectureViewSelection {
  const stimulationLinks = model.links.filter((link) => link.carriesStimulationCommands);
  const isProgrammingCase = stimulationLinks.length > 0;
  const useCaseLinks = isProgrammingCase ? stimulationLinks : model.links.filter((link) => link.carriesNeuralData);
  return {
    view: 'security_use_case',
    highlightedComponentIds: endpointsOf(useCaseLinks),
    highlightedLinkIds: useCaseLinks.map((link) => link.id),
    explanation: isProgrammingCase
      ? 'Use case: stimulation programming. The path a stimulation command travels to the neural interface.'
      : 'Use case: neural data transfer. The path a recording travels from the neural interface.',
  };
}

export function selectArchitectureViews(model: DeviceModel): ArchitectureViewSelection[] {
  return [
    selectGlobalSystem(model),
    selectMultiPatientHarm(model),
    selectUpdateability(model),
    selectSecurityUseCase(model),
  ];
}
