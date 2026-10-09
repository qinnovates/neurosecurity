/**
 * The text tag and arrow for each payload a connection carries. Which way a payload travels
 * is derived by the rule in lib/threat-model/payload-flow; nothing here decides a direction.
 */

import type { DeviceModel } from '@/lib/threat-model/device-model';
import { PAYLOAD_LABELS } from '@/lib/threat-model/match-techniques';
import type { PayloadFlow } from '@/lib/threat-model/payload-flow';
import type { LinkPayload } from '@/lib/threat-model/reference-data-types';
import { OPPOSITE_HEADING, type Heading } from './diagram-geometry';

export type PayloadFlows = ReadonlyMap<string, readonly PayloadFlow[]>;

export interface PayloadTag {
  payload: LinkPayload;
  label: string;
  /** Which way the arrow points on the drawing; null when the rule cannot decide a direction. */
  heading: Heading | null;
  /** The part the payload travels to; null when the rule cannot decide. */
  towardLabel: string | null;
}

/**
 * How the one flow pass travels along the drawn line: with it, against it, or outward from
 * the middle to both ends when the payloads go both ways or the rule decides no direction.
 */
export type PassDirection = 'forward' | 'backward' | 'both';

interface TagContext {
  model: DeviceModel;
  linkId: string;
  /** Which way the drawn line runs across the label, from the link's `from` part to its `to` part. */
  lineHeading: Heading;
}

function labelOfPart(model: DeviceModel, componentId: string | undefined): string | null {
  return model.components.find((component) => component.id === componentId)?.label ?? null;
}

export function buildPayloadTags(flows: readonly PayloadFlow[], { model, linkId, lineHeading }: TagContext): PayloadTag[] {
  const link = model.links.find((candidate) => candidate.id === linkId);
  return flows.map((flow): PayloadTag => {
    if (flow.isFromTo === null) return { payload: flow.payload, label: PAYLOAD_LABELS[flow.payload], heading: null, towardLabel: null };
    return {
      payload: flow.payload,
      label: PAYLOAD_LABELS[flow.payload],
      heading: flow.isFromTo ? lineHeading : OPPOSITE_HEADING[lineHeading],
      towardLabel: labelOfPart(model, flow.isFromTo ? link?.toComponentId : link?.fromComponentId),
    };
  });
}

/** The tags in words: "neural data to Phone app; software updates to EEG headset". */
export function describePayloadTags(tags: readonly PayloadTag[]): string {
  return tags.map((tag) => (tag.towardLabel === null ? tag.label : `${tag.label} to ${tag.towardLabel}`)).join('; ');
}

/** The direction of the flow pass on a connection, or null when it carries nothing, so nothing is shown travelling it. */
export function passDirectionOf(flows: readonly PayloadFlow[]): PassDirection | null {
  if (flows.length === 0) return null;
  const isForward = flows.every((flow) => flow.isFromTo === true);
  const isBackward = flows.every((flow) => flow.isFromTo === false);
  return isForward ? 'forward' : isBackward ? 'backward' : 'both';
}
