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
