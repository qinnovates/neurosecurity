import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const KIT_DIRECTORY = path.resolve(import.meta.dirname, '..');
const STYLES_DIRECTORY = path.join(KIT_DIRECTORY, 'styles');

export interface CssRule {
  /** The at-rules the rule sits in, outermost first, joined by " / ". Empty at the top level. */
  context: string;
  selector: string;
  declarations: ReadonlyMap<string, string>;
}

export function listStyleFiles(): string[] {
  return readdirSync(STYLES_DIRECTORY).filter((name) => name.endsWith('.css')).sort();
}

export function readStyleFile(name: string): string {
  return readFileSync(path.join(STYLES_DIRECTORY, name), 'utf8');
}

export function readEntryFile(): string {
  return readFileSync(path.join(KIT_DIRECTORY, 'lab-kit.css'), 'utf8');
}

/** Every style file's text, joined, for rules that must hold across the whole kit. */
export function readAllStyles(): string {
  return listStyleFiles().map(readStyleFile).join('\n');
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseDeclarations(body: string): Map<string, string> {
  const declarations = new Map<string, string>();
  for (const part of body.split(';')) {
    const colon = part.indexOf(':');
    if (colon > 0) declarations.set(part.slice(0, colon).trim(), part.slice(colon + 1).trim());
  }
  return declarations;
}

/** A small reader for the kit's own stylesheets: flat rules, optionally inside at-rules. */
export function parseRules(css: string): CssRule[] {
  const rules: CssRule[] = [];
  const contexts: string[] = [];
  const text = stripComments(css);
  let position = 0;
  while (position < text.length) {
    const open = text.indexOf('{', position);
    const close = text.indexOf('}', position);
    if (close !== -1 && (open === -1 || close < open)) {
      contexts.pop();
      position = close + 1;
    } else if (open === -1) {
      break;
    } else {
      const prelude = text.slice(position, open).trim();
      if (prelude.startsWith('@')) {
        contexts.push(prelude);
        position = open + 1;
      } else {
        const end = text.indexOf('}', open);
        rules.push({ context: contexts.join(' / '), selector: prelude, declarations: parseDeclarations(text.slice(open + 1, end)) });
        position = end + 1;
      }
    }
  }
  return rules;
}

/** The declarations of the first rule with exactly this selector and at-rule context. */
export function declarationsOf(rules: readonly CssRule[], selector: string, context = ''): ReadonlyMap<string, string> {
  const rule = rules.find((candidate) => candidate.selector === selector && candidate.context === context);
  if (rule === undefined) throw new Error(`No rule "${selector}" in context "${context}". Check styles/lab-tokens.css.`);
  return rule.declarations;
}
