/**
 * Turns the US requirements list into a checklist for one device model.
 * The output is a checklist with sources. It never states that a device complies.
 */

import type { DeviceModel } from './device-model';
import type { ComplianceData, ComplianceRequirement } from './reference-data-types';
import type { ComplianceItem, CyberDeviceAssessment, RequirementApplicability } from './report-types';

interface ApplicabilityDecision {
  applicability: RequirementApplicability;
  reason: string;
}

/**
 * Section 524B(c) has three prongs. This tool can only check connectivity from the
 * model; the software and vulnerability prongs are assumed true and said so.
 */
export function assessCyberDevice(model: DeviceModel, compliance: ComplianceData): CyberDeviceAssessment {
  const internetCapableLinkIds = model.links
    .filter((link) => compliance.internetCapableMedia.includes(link.medium))
    .map((link) => link.id);
  const isCyberDevice = internetCapableLinkIds.length > 0;
  const connectivity = isCyberDevice
    ? `${internetCapableLinkIds.length} link(s) use a connection type FDA lists as able to connect to the internet.`
    : 'No link in the model uses a connection type FDA lists as able to connect to the internet.';
  return {
    isCyberDevice,
    internetCapableLinkIds,
    explanation: `${connectivity} This tool assumes the device includes software and has characteristics that could be vulnerable to cybersecurity threats; confirm both.`,
  };
}

function decideMarketingRequirement(requirement: ComplianceRequirement, model: DeviceModel, compliance: ComplianceData, isCyberDevice: boolean): ApplicabilityDecision {
  if (model.submissionType === 'none') {
    return { applicability: 'not_required', reason: 'No FDA submission type is selected.' };
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
  return isCyberDevice
    ? { applicability: 'required', reason: 'The model meets the connectivity prong of the cyber device definition, and this is a marketing submission.' }
    : { applicability: 'not_required', reason: 'The model has no internet-capable connection, so it does not meet the cyber device definition as modelled.' };
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
  const { isCyberDevice } = assessCyberDevice(model, compliance);
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
    return [toItem(requirement, decideMarketingRequirement(requirement, model, compliance, isCyberDevice), compliance)];
  });
}
