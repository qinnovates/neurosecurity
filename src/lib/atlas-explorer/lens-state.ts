/**
 * The lens a visitor is looking through: which fact about each region the list
 * (and, later, the 3D view) shows. A lens that needs a subject, such as one
 * technique, can be picked before its subject is; until then it colours nothing.
 */

import type { ColourMode } from '@/lib/anatomy/colour-modes';

export const LENS_KINDS = ['band', 'technique', 'niss', 'dsm', 'stated_targets'] as const;
export type LensKind = typeof LENS_KINDS[number];

export type Lens =
  | { kind: 'band' }
  | { kind: 'niss' }
  | { kind: 'technique'; techniqueId: string | null }
  | { kind: 'dsm'; cluster: string | null }
  | { kind: 'stated_targets'; deviceId: string | null };

export const LENS_LABELS: Readonly<Record<LensKind, string>> = {
  band: 'Band',
  technique: 'Technique',
  niss: 'NISS severity',
  dsm: 'DSM cluster',
  stated_targets: 'Device',
};

/** What each lens colours by, in one line under the lens bar, so a visitor knows what a choice shows before reading its limits. */
export const LENS_DESCRIPTIONS: Readonly<Record<LensKind, string>> = {
  band: 'Colours each region by the QIF band it is grouped under.',
  technique: 'Colours the regions an AI linked to one technique. Choose the technique below.',
  niss: 'Colours each region by the highest NISS step among the techniques an AI linked to it.',
  dsm: 'Colours the regions whose linked techniques carry one DSM cluster tag. Choose the tag below.',
  stated_targets: 'Colours the regions that one device\'s QIF record lists. Choose the device below.',
};

/** The singular noun of what a lens is about, for the lenses that take a subject. */
export const LENS_SUBJECT_NOUNS: Readonly<Partial<Record<LensKind, string>>> = { technique: 'technique', dsm: 'cluster tag', stated_targets: 'device' };

export const DEFAULT_LENS: Lens = { kind: 'band' };

/** A lens of this kind with no subject chosen yet. */
export function emptyLens(kind: LensKind): Lens {
  switch (kind) {
    case 'band': return { kind };
    case 'niss': return { kind };
    case 'technique': return { kind, techniqueId: null };
    case 'dsm': return { kind, cluster: null };
    case 'stated_targets': return { kind, deviceId: null };
  }
}

/** Whether a lens of this kind waits for a subject. No default: adding a kind makes the type checker name this switch. */
export function lensNeedsSubject(kind: LensKind): boolean {
  switch (kind) {
    case 'band': return false;
    case 'niss': return false;
    case 'technique': return true;
    case 'dsm': return true;
    case 'stated_targets': return true;
  }
}

/** The lens's subject id, or null when it has none or none is chosen. */
export function lensSubjectId(lens: Lens): string | null {
  switch (lens.kind) {
    case 'technique': return lens.techniqueId;
    case 'dsm': return lens.cluster;
    case 'stated_targets': return lens.deviceId;
    default: return null;
  }
}

export function withLensSubject(kind: LensKind, subjectId: string): Lens {
  switch (kind) {
    case 'technique': return { kind, techniqueId: subjectId };
    case 'dsm': return { kind, cluster: subjectId };
    case 'stated_targets': return { kind, deviceId: subjectId };
    default: return emptyLens(kind);
  }
}

/** The colour mode the style functions understand, or null while the lens still waits for its subject. */
export function toColourMode(lens: Lens): ColourMode | null {
  switch (lens.kind) {
    case 'band': return { kind: 'band' };
    case 'niss': return { kind: 'niss' };
    case 'technique': return lens.techniqueId === null ? null : { kind: 'technique', techniqueId: lens.techniqueId };
    case 'dsm': return lens.cluster === null ? null : { kind: 'dsm', cluster: lens.cluster };
    case 'stated_targets': return lens.deviceId === null ? null : { kind: 'stated_targets', deviceId: lens.deviceId };
  }
}
