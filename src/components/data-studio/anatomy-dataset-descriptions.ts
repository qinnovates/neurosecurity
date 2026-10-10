/**
 * What Data Studio says about each anatomy table. Every one of these tables is
 * AI-drafted and unreviewed, so each description says so and says what the
 * table must not be read as. The key type makes a table without a description
 * a compile error, and a test checks every count below against the data.
 */

import type { AnatomyTableName } from '@/lib/anatomy/anatomy-tables';

export interface DatasetDescription {
  label: string;
  description: string;
  category: string;
}

const CATEGORY = 'Anatomy';

export const ANATOMY_DATASET_DESCRIPTIONS: Readonly<Record<AnatomyTableName, DatasetDescription>> = {
  anatomy_sources: {
    label: 'Atlas Sources',
    description: 'The 16 upstream brain atlases considered for the TARA Brain Atlas, each with its stated licence, the publisher\'s quoted terms and whether it may ship. '
      + 'AI-drafted and unreviewed: the licence readings were made by AI, not by a lawyer, no person has confirmed them, and they are not legal advice or a clearance for your own use.',
    category: CATEGORY,
  },
  anatomy_structures: {
    label: 'Atlas Structures',
    description: 'The 125 atlas labels that have a shape in the TARA Brain Atlas, one row per drawn side, with the publisher\'s label name, size class, position check and mesh file digest. '
      + 'AI-drafted and unreviewed: the shapes come from an AI-written pipeline and the QIF records listed as owners are an unchecked reading, so a row is not a statement of where a QIF region is.',
    category: CATEGORY,
  },
  anatomy_crosswalk: {
    label: 'Region-to-Atlas Crosswalk',
    description: 'Correspondences between the 38 QIF brain regions and atlas labels: 32 regions have a row and 6 have a record saying no usable atlas has geometry for them. '
      + 'AI-drafted and unreviewed; no neuroanatomist has checked them. Read extent_match before treating a label as the region: only 6 of 32 rows grade the shape as the same structure.',
    category: CATEGORY,
  },
  anatomy_technique_terms: {
    label: 'Technique Region Terms',
    description: 'The words each technique\'s own catalog text uses for a brain structure, with the quoted text and what the word resolves to in the QIF region table. '
      + 'AI-drafted and unreviewed, and not a list of targets: only 14 of 123 terms resolve to one region that agrees with the technique\'s band tags (lights_region); the rest name something broader, narrower or unlisted.',
    category: CATEGORY,
  },
  anatomy_technique_scopes: {
    label: 'Technique Region Coverage',
    description: 'One row per technique with a neural band, saying whether any region term could be drafted from its catalog text and, if none, the stated reason. '
      + 'AI-drafted and unreviewed: 12 of 111 techniques have a term that resolves to a single region, and 63 stay at band level, so a missing region is not evidence that a technique spares it.',
    category: CATEGORY,
  },
};
