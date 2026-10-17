/**
 * Breaks a part's name into lines for the drawing. SVG text does not wrap, so the lines are
 * cut here by character count; a name too long for the lines allowed ends in an ellipsis and
 * the full name stays in the part's accessible name and tooltip.
 */

const ELLIPSIS = '…';

/** Splits a word longer than a line into line-sized pieces. */
function splitLongWord(word: string, lineCharacters: number): string[] {
  const pieces: string[] = [];
  for (let start = 0; start < word.length; start += lineCharacters) pieces.push(word.slice(start, start + lineCharacters));
  return pieces;
}

function fillLines(words: readonly string[], lineCharacters: number): string[] {
  const lines: string[] = [];
  for (const word of words.flatMap((candidate) => splitLongWord(candidate, lineCharacters))) {
    const last = lines[lines.length - 1];
    if (last !== undefined && last.length + 1 + word.length <= lineCharacters) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

/** At most `lineCount` lines of at most `lineCharacters` characters each, broken between words where it can be. */
export function wrapLabel(label: string, lineCharacters: number, lineCount: number): string[] {
  const lines = fillLines(label.trim().split(/\s+/).filter((word) => word !== ''), lineCharacters);
  if (lines.length <= lineCount) return lines;
  const kept = lines.slice(0, lineCount);
  const last = kept[lineCount - 1];
  kept[lineCount - 1] = `${last.slice(0, Math.max(0, lineCharacters - 1)).trimEnd()}${ELLIPSIS}`;
  return kept;
}
