/**
 * A deep-brain-stimulation lead as a drawing beside the brain: its contacts
 * and thickness to scale from the lead's published dimensions, and a table
 * that gives each number with the source it was read in and what kind of
 * source that is.
 *
 * A lead here has a size and no place. Nothing in this module holds a
 * position in the brain, a target, an angle or a path, and no function takes one.
 */

import type { AnatomyIndex, IndexLead, IndexLeadSource, IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { buildLeadShape, type LeadShape } from '@/lib/anatomy/lead-spans';
import type { DimensionSourceKind, LeadDimensionField, SpacingMeasure } from '@/lib/anatomy/parse-device-geometry';

/** The words the lead panel's limit sentence uses for each kind of source. */
export const SOURCE_KIND_WORDS: Readonly<Record<DimensionSourceKind, string>> = { fda_document: 'FDA document', review_paper: 'review paper' };
const SPACING_MEASURE_WORDS: Readonly<Record<SpacingMeasure, string>> = { edge_to_edge: 'edge of one contact to the edge of the next', centre_to_centre: 'centre of one contact to the centre of the next' };
const DIMENSION_WORDS: Readonly<Record<LeadDimensionField, string>> = {
  contacts: 'Contacts', contact_length_mm: 'Contact length', contact_spacing_mm: 'Contact spacing', spacing_measure: 'Spacing is measured from', diameter_mm: 'Lead diameter',
};
const DIMENSION_ORDER: readonly LeadDimensionField[] = ['contacts', 'contact_length_mm', 'contact_spacing_mm', 'spacing_measure', 'diameter_mm'];

export interface LeadDimensionRow {
  field: LeadDimensionField;
  words: string;
  value: string;
  /** The sources that state this number. Empty only if the data names none, and the table then says so. */
  sources: Array<Pick<IndexLeadSource, 'citation' | 'url' | 'kind'>>;
}

export interface LeadFigure {
  id: string;
  name: string;
  /** Shown with the drawing and the table; a lead is never drawn without it. */
  reviewState: IndexReviewState;
  shape: LeadShape;
  rows: LeadDimensionRow[];
}

function valueOf(lead: IndexLead, field: LeadDimensionField): string {
  if (field === 'contacts') return String(lead.contacts);
  if (field === 'spacing_measure') return SPACING_MEASURE_WORDS[lead.spacing_measure];
  return `${lead[field]} mm`;
}

function rowsOf(lead: IndexLead): LeadDimensionRow[] {
  return DIMENSION_ORDER.map((field) => ({
    field,
    words: DIMENSION_WORDS[field],
    value: valueOf(lead, field),
    sources: lead.sources.filter((source) => source.supports.includes(field)).map((source) => ({ citation: source.citation, url: source.url, kind: source.kind })),
  }));
}

/** Every lead the index says may be drawn, with its to-scale spans and its table. */
export function buildLeadFigures(index: AnatomyIndex): LeadFigure[] {
  return index.devices.leads.filter((lead) => lead.drawable).map((lead) => ({ id: lead.id, name: lead.name, reviewState: lead.review_state, shape: buildLeadShape(lead), rows: rowsOf(lead) }));
}

/** The length of the scale bar, in millimetres. */
export const SCALE_BAR_MM = 5;
/** Drawn before the first contact and after the last. Not to scale: the sources give no tip length, and the lead runs on far beyond the picture. */
export const NOT_TO_SCALE_END_MM = 1.5;

/** The longest run of contacts among the leads, so every lead can be drawn at one scale. */
export function longestContactSpanMm(figures: readonly LeadFigure[]): number {
  return Math.max(0, ...figures.map((figure) => figure.shape.contact_span_mm));
}
