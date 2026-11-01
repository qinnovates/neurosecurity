export type HitKind = 'TARA technique' | 'region' | 'band';
export interface SearchHit { kind: HitKind; id: string; name: string; href?: string }
interface Named { id: string; name: string }

/** Explicit field projection: only public identifiers and display names leave the build. */
export function buildSearchIndex(techniques: readonly Named[], regions: readonly Named[], bands: readonly Named[]): SearchHit[] {
  return [
    ...techniques.map(({ id, name }): SearchHit => ({ kind: 'TARA technique', id, name, href: `/atlas/tara/${id}/` })),
    ...regions.map(({ id, name }): SearchHit => ({ kind: 'region', id, name })),
    ...bands.map(({ id, name }): SearchHit => ({ kind: 'band', id, name, href: '/atlas/tara/ttps/' })),
  ];
}

export const HIT_KINDS: readonly HitKind[] = ['TARA technique', 'region', 'band'];
export function filterSearch(index: readonly SearchHit[], query: string): SearchHit[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return HIT_KINDS.flatMap((kind) => index.filter((hit) => hit.kind === kind && terms.every((term) => `${hit.id} ${hit.name}`.toLocaleLowerCase().includes(term))));
}
