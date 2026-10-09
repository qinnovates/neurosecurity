/** Test-only: a small reader for the diagram's stylesheet, enough to list every rule with the at-rules around it. */

export interface CssRule {
  /** The at-rules the rule sits inside, outermost first: "@media print". Empty at the top level. */
  context: string[];
  selector: string;
  declarations: { property: string; value: string }[];
}

function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function matchingBrace(css: string, openIndex: number): number {
  let depth = 0;
  for (let index = openIndex; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error('test setup: unbalanced braces in the stylesheet');
}

function parseDeclarations(body: string): CssRule['declarations'] {
  return body.split(';').map((declaration) => declaration.trim()).filter((declaration) => declaration !== '').map((declaration) => {
    const colon = declaration.indexOf(':');
    return { property: declaration.slice(0, colon).trim(), value: declaration.slice(colon + 1).trim() };
  });
}

/** At-rules whose body is a list of rules. Keyframes are kept as one rule per step, under their own context. */
const NESTING_AT_RULE = /^@(media|supports|keyframes)\b/;

function parseBlock(css: string, context: string[]): CssRule[] {
  const rules: CssRule[] = [];
  let cursor = 0;
  while (cursor < css.length) {
    const open = css.indexOf('{', cursor);
    if (open === -1) break;
    const close = matchingBrace(css, open);
    const selector = css.slice(cursor, open).trim();
    const body = css.slice(open + 1, close);
    if (NESTING_AT_RULE.test(selector)) rules.push(...parseBlock(body, [...context, selector]));
    else rules.push({ context, selector, declarations: parseDeclarations(body) });
    cursor = close + 1;
  }
  return rules;
}

export function parseCss(css: string): CssRule[] {
  return parseBlock(withoutComments(css), []);
}

/** The selectors of a rule, split at the commas that are not inside `:is()` or `:where()`. */
export function splitSelectors(selector: string): string[] {
  const selectors: string[] = [];
  let depth = 0;
  let current = '';
  for (const character of selector) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      selectors.push(current.trim());
      current = '';
    } else current += character;
  }
  return [...selectors, current.trim()].filter((part) => part !== '');
}
