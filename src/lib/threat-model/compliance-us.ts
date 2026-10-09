/**
 * Turns the US requirements list into a checklist for one device model.
 * The output is a checklist with sources. It never states that a device complies.
 */

import type { DeviceModel, ModelLink } from './device-model';
import type { ComplianceData, ComplianceRequirement } from './reference-data-types';
import type { ComplianceItem, CyberDeviceAssessment, CyberDeviceConnectivity, RequirementApplicability } from './report-types';

/** The name of the checklist wherever it is headed: what it is, and no wider. */
export const CHECKLIST_TITLE = 'FDA premarket cybersecurity checklist';

/**
 * Said wherever the model cannot settle the definition. The second sentence repeats the words
 * FDA uses of its own list, which the data file quotes; a test holds the two together.
 */
export const NOT_DETERMINED_STATEMENT = "Not determined by this tool. FDA's list is illustrative, not exhaustive.";
export const NOT_EVALUATED_STATEMENT = 'Not evaluated. Choose a submission type.';

interface ApplicabilityDecision {
  applicability: RequirementApplicability;
  reason: string;
}

/** A link that moves data, commands or software in the model; a power-only link carries none of them. */
function carriesModelledPayload(link: ModelLink): boolean {
  return link.carriesNeuralData || link.carriesStimulationCommands || link.carriesSoftwareUpdates;
}

function describeConnectivity(carryingCount: number, emptyCount: number): string {
  if (carryingCount > 0) return `${carryingCount} link(s) use a connection type FDA lists as able to connect to the internet.`;
  const found = emptyCount > 0
    ? `${emptyCount} link(s) use a connection type on FDA's list but carry no neural data, stimulation commands or software updates in this model.`
    : "No link in the model uses a connection type on FDA's list as this tool reads it.";
  return `${found} ${NOT_DETERMINED_STATEMENT}`;
}

/**
 * Section 524B(c) has three prongs. This tool can only check connectivity from the
 * model; the software and vulnerability prongs are assumed true and said so. A model
 * can show that the connectivity prong is met. It can never show that it is not, so
 * the tool does not make that call.
 */
export function assessCyberDevice(model: DeviceModel, compliance: ComplianceData): CyberDeviceAssessment {
  const listedLinks = model.links.filter((link) => compliance.internetCapableMedia.includes(link.medium));
  const internetCapableLinkIds = listedLinks.filter(carriesModelledPayload).map((link) => link.id);
  const connectivity: CyberDeviceConnectivity = internetCapableLinkIds.length > 0 ? 'meets' : 'not_determined';
  const found = describeConnectivity(internetCapableLinkIds.length, listedLinks.length - internetCapableLinkIds.length);
  return {
    connectivity,
    internetCapableLinkIds,
    explanation: `${found} This tool assumes the device includes software and has characteristics that could be vulnerable to cybersecurity threats; confirm both.`,
    connectivityQuote: compliance.internetCapableMediaQuote,
    checklistStatus: compliance.status,
    checklistSources: compliance.sources,
  };
}

function decideMarketingRequirement(requirement: ComplianceRequirement, model: DeviceModel, compliance: ComplianceData, connectivity: CyberDeviceConnectivity): ApplicabilityDecision {
  if (model.submissionType === 'none') {
    return { applicability: 'not_evaluated', reason: NOT_EVALUATED_STATEMENT };
  }
  if (!compliance.marketingSubmissionTypes.includes(model.submissionType)) {
    return {
      applicability: 'not_required',
      reason: 'Section 524B names marketing submissions (510(k), De Novo, PMA, PDP, HDE). An investigational device exemption is not among them. This applies to the marketing submission that follows.',
    };
  }
  if (requirement.force === 'guidance') {
    return { applicability: 'recommended', reason: 'FDA guidance recommends this for premarket submissions. Guidance is not binding.' };
  }
  return connectivity === 'meets'
    ? { applicability: 'required', reason: 'The model meets the connectivity prong of the cyber device definition, and this is a marketing submission.' }
    : { applicability: 'not_determined', reason: `${NOT_DETERMINED_STATEMENT} The model shows no listed connection carrying data, commands or updates, which does not settle the cyber device definition.` };
}

function toItem(requirement: ComplianceRequirement, decision: ApplicabilityDecision, compliance: ComplianceData): ComplianceItem {
  const source = compliance.sources.find((candidate) => candidate.id === requirement.sourceId);
  return {
    requirementId: requirement.id,
    title: requirement.title,
    instrument: source?.title ?? requirement.sourceId,
    applicability: decision.applicability,
    applicabilityReason: decision.reason,
    evidence: requirement.evidence,
    suggestedFix: requirement.suggestedFix,
    sourceUrl: source?.url ?? '',
    dateRead: source?.dateRead ?? '',
    supportingQuote: requirement.quote,
  };
}

export function evaluateCompliance(model: DeviceModel, compliance: ComplianceData): ComplianceItem[] {
  const { connectivity } = assessCyberDevice(model, compliance);
  const isInvestigational = model.submissionType === 'ide';
  return compliance.requirements.flatMap((requirement): ComplianceItem[] => {
    if (requirement.appliesTo === 'ide') {
      if (!isInvestigational) return [];
      const decision: ApplicabilityDecision = {
        applicability: 'recommended',
        reason: 'FDA guidance recommends this documentation for investigational device exemption applications.',
      };
      return [toItem(requirement, decision, compliance)];
    }
    return [toItem(requirement, decideMarketingRequirement(requirement, model, compliance, connectivity), compliance)];
  });
}
