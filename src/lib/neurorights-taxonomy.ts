/**
 * The neurorights count the site states, derived from the registrar's glossary
 * (`statistics.neurorights.taxonomy`) so no page holds its own numeral.
 *
 * A neuroright here is a code that stands on its own: six codes are tagged, two
 * fold, and the rest are the rights. Equal Access is not among them; it is a
 * governance dimension, not a code in the glossary.
 *
 * Server-side only: this module parses the registrar, so it is imported from
 * Astro frontmatter and never from a hydrated component. Client code reads
 * `neurorights_taxonomy` from the anatomy index and calls `neurorights-fold`.
 */

import registrar from '@shared/qtara-registrar.json';
import { readNeurorightsTaxonomy } from '@/lib/anatomy/technique-tags';
import { listStandingNeurorights } from '@/lib/neurorights-fold';

export const NEURORIGHT_TAXONOMY = readNeurorightsTaxonomy(registrar);

export const NEURORIGHT_COUNT = listStandingNeurorights(NEURORIGHT_TAXONOMY).length;
