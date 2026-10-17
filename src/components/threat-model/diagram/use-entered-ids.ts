import { useLayoutEffect, useRef, useState } from 'react';

const NONE: ReadonlySet<string> = new Set();

/** Ids in `after` that `before` lacks, when the two share at least one id: an edit to the same list, not a different list. */
export function listEnteredIds(before: readonly string[], after: readonly string[]): string[] {
  const known = new Set(before);
  if (!after.some((id) => known.has(id))) return [];
  return after.filter((id) => !known.has(id));
}

/**
 * The ids added since the render before, so what an edit added can arrive once. Nothing is
 * reported on the first render, or when the whole list was replaced: a picture that is new
 * to the reader does not move on load.
 */
export function useEnteredIds(ids: readonly string[]): ReadonlySet<string> {
  const previous = useRef(ids);
  const [entered, setEntered] = useState<ReadonlySet<string>>(NONE);

  // Runs after every render and returns at once unless the ids differ: a new array with the same ids is not a change.
  useLayoutEffect(() => {
    const before = previous.current;
    if (before.join('\n') === ids.join('\n')) return;
    previous.current = ids;
    setEntered(new Set(listEnteredIds(before, ids)));
  });

  return entered;
}
