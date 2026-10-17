/** Edit distance between two short strings, for suggesting the name someone probably meant. */
function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      const substitution = previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1);
      current.push(Math.min(previous[column] + 1, current[column - 1] + 1, substitution));
    }
    previous = current;
  }
  return previous[right.length];
}

/** Names further than this from what was typed are not worth suggesting. */
const MAX_DISTANCE_SHARE = 0.5;

/** Up to `limit` of the known names closest to `typed`: those containing it first, then by edit distance. */
export function nearestNames(typed: string, known: readonly string[], limit = 3): string[] {
  const needle = typed.trim().toLowerCase();
  if (needle === '') return [];
  return known
    .map((name) => {
      const candidate = name.toLowerCase();
      const distance = candidate.includes(needle) || needle.includes(candidate) ? 0 : editDistance(needle, candidate);
      return { name, distance };
    })
    .filter(({ distance }) => distance <= Math.max(needle.length, 1) * MAX_DISTANCE_SHARE)
    .sort((left, right) => left.distance - right.distance || left.name.localeCompare(right.name))
    .slice(0, limit)
    .map(({ name }) => name);
}
