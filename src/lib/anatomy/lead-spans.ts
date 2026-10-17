/**
 * Where a lead's contacts lie along its own axis, from its published dimensions.
 *
 * This is everything needed to draw a lead to scale: a diameter and a list of spans
 * measured from the far edge of the first contact. It has no position in the brain
 * and takes none: a lead is drawn beside the brain, never in it.
 */

import type { DeviceLead } from './parse-device-geometry';

export interface LeadSpan {
  /** Distance along the lead from the far edge of the first contact, in millimetres. */
  start_mm: number;
  end_mm: number;
}

export interface LeadShape {
  diameter_mm: number;
  contacts: LeadSpan[];
  /** From the far edge of the first contact to the far edge of the last. */
  contact_span_mm: number;
}

type LeadDimensions = Pick<DeviceLead, 'contacts' | 'contact_length_mm' | 'contact_spacing_mm' | 'spacing_measure' | 'diameter_mm'>;

const CENTRE_TO_CENTRE = 'centre_to_centre';
const ROUNDING = 1000;

function round(value: number): number {
  return Math.round(value * ROUNDING) / ROUNDING;
}

/** The distance from the start of one contact to the start of the next. */
function pitchOf(lead: LeadDimensions): number {
  return lead.spacing_measure === CENTRE_TO_CENTRE ? lead.contact_spacing_mm : lead.contact_length_mm + lead.contact_spacing_mm;
}

export function buildLeadShape(lead: LeadDimensions): LeadShape {
  const pitch = pitchOf(lead);
  if (pitch < lead.contact_length_mm) {
    throw new RangeError(`lead contacts would overlap: a centre-to-centre spacing of ${lead.contact_spacing_mm} mm is shorter than a contact of ${lead.contact_length_mm} mm. Check the spacing measure in the lead's row.`);
  }
  const contacts = Array.from({ length: lead.contacts }, (_unused, index) => ({ start_mm: round(index * pitch), end_mm: round(index * pitch + lead.contact_length_mm) }));
  return { diameter_mm: lead.diameter_mm, contacts, contact_span_mm: contacts[contacts.length - 1].end_mm };
}
