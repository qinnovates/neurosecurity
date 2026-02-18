/**
 * Generates governance/ETHICAL-NEUROSECURITY-CODE-OF-ETHICS.md from the
 * single source of truth at src/data/code-of-ethics.ts
 *
 * Usage: npx tsx scripts/generate-ethics-md.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {
  ETHICS_VERSION,
  ETHICS_STATUS,
  ETHICS_DATE,
  ETHICS_AUTHOR,
  ETHICS_LICENSE,
  PREAMBLE,
  CANONS,
  PRINCIPLES,
  CROSS_REFERENCES,
  INTRO_TEXT,
  FRAMEWORK_LINKS,
} from '../src/data/code-of-ethics';

function stripUrls(text: string): string {
  // Convert inline URLs in descriptions to markdown links where possible
  return text
    .replace(
      /A Neurorights Foundation audit \(https:\/\/[^)]+\)/,
      `A [Neurorights Foundation audit](${FRAMEWORK_LINKS.neurorightsAudit})`
    )
    .replace(
      /Mexico's GLNN bill \(introduced 2024, published in The Lancet Psychiatry: https:\/\/[^)]+\)/,
      `Mexico's GLNN bill (introduced 2024, published in [The Lancet Psychiatry](${FRAMEWORK_LINKS.lancetGlnn}))`
    );
}

const lines: string[] = [];

// Astro content collection frontmatter
lines.push('---');
lines.push('title: "Ethical Neurosecurity Code of Ethics"');
lines.push(`description: "Adapted from EC-Council CEH and (ISC)² codes of ethics for neurosecurity. v${ETHICS_VERSION} (${ETHICS_STATUS})."`);
lines.push('order: 0');
lines.push('---');
lines.push('');
lines.push('# Ethical Neurosecurity Code of Ethics');
lines.push('');
lines.push(`> **Version ${ETHICS_VERSION}** (${ETHICS_STATUS}) | ${ETHICS_DATE} | ${ETHICS_AUTHOR} | [${ETHICS_LICENSE}](https://creativecommons.org/licenses/by/4.0/)`);
lines.push('');
lines.push(`> **Canonical source:** [\`src/data/code-of-ethics.ts\`](../src/data/code-of-ethics.ts) — edit that file to update both this document and the [website](https://qinnovate.com/security/#ethics).`);
lines.push('');

// Intro
lines.push(INTRO_TEXT);
lines.push('');

// Preamble
lines.push('## Preamble');
lines.push('');
for (const p of PREAMBLE) {
  lines.push(p);
  lines.push('');
}

// Canons
lines.push('## The Four Canons');
lines.push('');
lines.push('*Adapted from (ISC)² Code of Ethics. These are the highest-level obligations.*');
lines.push('');
for (const canon of CANONS) {
  lines.push(`### Canon ${canon.number}: ${canon.title}`);
  lines.push('');
  lines.push(canon.description);
  lines.push('');
  lines.push(`*Sources: ${canon.sources}*`);
  lines.push('');
}

// Principles
lines.push('## The Principles');
lines.push('');
lines.push('*Adapted from the EC-Council CEH Code of Ethics and mapped across neurorights, bioethics, digital ethics, and international law.*');
lines.push('');
for (const p of PRINCIPLES) {
  lines.push(`### ${p.number}. ${p.title}`);
  lines.push('');
  lines.push(stripUrls(p.description));
  lines.push('');
  lines.push(`*Sources: ${p.sources}*`);
  lines.push('');
}

// Cross-reference table
lines.push('## Framework Cross-Reference');
lines.push('');
lines.push('How each principle maps to existing ethics frameworks. This code does not exist in a vacuum. It stands on the shoulders of decades of work in cybersecurity ethics, bioethics, neurorights, and international law.');
lines.push('');
lines.push('| Principle | CEH / (ISC)² | Bioethics | Neurorights | Digital / Intl Law |');
lines.push('|-----------|-------------|-----------|-------------|-------------------|');
for (const ref of CROSS_REFERENCES) {
  lines.push(`| ${ref.principle} | ${ref.cehIsc2} | ${ref.bioethics} | ${ref.neurorights} | ${ref.digitalIntlLaw} |`);
}
lines.push('');

// Footer
lines.push('---');
lines.push('');
lines.push(`**Version ${ETHICS_VERSION}** (${ETHICS_STATUS}) · ${ETHICS_DATE} · Written by ${ETHICS_AUTHOR} · [${ETHICS_LICENSE}](https://creativecommons.org/licenses/by/4.0/)`);
lines.push('');
lines.push('This code is a living document. If you work in neurosecurity and see something missing, [open an issue](https://github.com/qinnovates/qinnovate/issues) or submit a pull request. The point is to get this right, not to get it first.');

const outPath = path.resolve(__dirname, '..', 'governance', 'ETHICAL-NEUROSECURITY-CODE-OF-ETHICS.md');
fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
console.log(`Generated: ${outPath}`);
