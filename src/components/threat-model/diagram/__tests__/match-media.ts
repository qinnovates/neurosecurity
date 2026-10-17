/** Test-only: makes the listed media queries match in jsdom, which has no `matchMedia`. Returns a function that undoes it. */
export function stubMatchMedia(matchingQueries: readonly string[]): () => void {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: matchingQueries.includes(query),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  return () => { window.matchMedia = original; };
}
