#!/usr/bin/env node
/**
 * Generate governance documents from QIF-DERIVATION-LOG.md.
 *
 * Single source of truth: the derivation log.
 * Generated views: DECISION-LOG.md (RACI tables) and TRANSPARENCY.md (deprecation notice for the retired AI-contribution metrics).
 *
 * Usage:
 *   node scripts/generate-governance.mjs decisions     — regenerate DECISION-LOG.md
 *   node scripts/generate-governance.mjs transparency  — regenerate TRANSPARENCY.md
 *   node scripts/generate-governance.mjs               — regenerate both
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const LOG_PATH = resolve(ROOT, 'osi-of-mind/QIF-DERIVATION-LOG.md');
const DECISION_PATH = resolve(ROOT, 'governance/DECISION-LOG.md');
const TRANSPARENCY_PATH = resolve(ROOT, 'governance/TRANSPARENCY.md');

// ── Parse Derivation Log ──────────────────────────────────────────────

function parseDerivationLog() {
  const content = readFileSync(LOG_PATH, 'utf-8');
  const entries = [];

  // Split on ## Entry headers
  const entryBlocks = content.split(/^## Entry (\d+):/m);

  for (let i = 1; i < entryBlocks.length; i += 2) {
    const num = parseInt(entryBlocks[i], 10);
    const body = entryBlocks[i + 1] || '';

    // Extract metadata from header lines
    const dateMatch = body.match(/\*\*Date:\*\*\s*(.+)/);
    const classMatch = body.match(/\*\*Classification:\*\*\s*(.+)/);
    const raciMatch = body.match(/\*\*RACI:\*\*\s*(.+)/);
    const decisionMatch = body.match(/\*\*Decision:\*\*\s*(.+)/);
    const connectedMatch = body.match(/\*\*Connected entries:\*\*\s*(.+)/);

    // Extract title from first line
    const titleMatch = body.match(/^([^\n{]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `Entry ${num}`;

    // Check for human decision sections
    const hasHumanDecision = /### Human Decision/i.test(body) ||
                              /\*\*Human-Decided:\*\*/i.test(body) ||
                              /\*\*Kevin decided:\*\*/i.test(body) ||
                              /\*\*Kevin:\*\*/i.test(body);

    // Check for RACI tables in body
    const raciTableMatch = body.match(/\|[^|]*Decision[^|]*\|[^|]*Chosen[^|]*\|[^|]*Rejected[^|]*\|[^|]*R[^|]*\|[^|]*A[^|]*\|/);

    // Extract AI Collaboration section
    const aiCollabMatch = body.match(/### AI Collaboration[\s\S]*?(?=\n---|\n## |\n### [^A]|$)/);

    entries.push({
      num,
      title,
      date: dateMatch ? dateMatch[1].trim() : '',
      classification: classMatch ? classMatch[1].trim() : '',
      raci: raciMatch ? raciMatch[1].trim() : '',
      isDecision: decisionMatch ? /yes/i.test(decisionMatch[1]) : hasHumanDecision || !!raciTableMatch,
      connected: connectedMatch ? connectedMatch[1].trim() : '',
      hasRaciTable: !!raciTableMatch,
      aiCollaboration: aiCollabMatch ? aiCollabMatch[0].trim() : '',
      body: body.slice(0, 500), // First 500 chars for summary
    });
  }

  return entries;
}

// ── Generate DECISION-LOG.md ──────────────────────────────────────────

function generateDecisionLog(entries) {
  const decisions = entries.filter(e => e.isDecision);

  const lines = [
    '---',
    'title: "Decision Log"',
    'description: "RACI-attributed architectural decisions extracted from the QIF Derivation Log"',
    'order: 5',
    '---',
    '',
    `<!-- AUTO-GENERATED from QIF-DERIVATION-LOG.md — do not edit directly -->`,
    `<!-- Regenerate: npm run decisions | Last generated: ${new Date().toISOString().split('T')[0]} -->`,
    '',
    '# Decision Log',
    '',
    '> **Notice: the AI attributions on this page are not reliable.** The AI tools that recorded them were inaccurate. Their accuracy also degrades with the context window and the limits of current language models, so the attributions cannot be relied on as an audit trail. Per-decision tracking costs more tokens than it is worth, so we no longer keep it. Treat any attribution published before this notice as unverified.',
    '',
    'Rolling record of framework decisions extracted from the [QIF Derivation Log](../osi-of-mind/QIF-DERIVATION-LOG.md).',
    'Each entry links back to the full derivation context.',
    '',
    `**Last generated:** ${new Date().toISOString().split('T')[0]} at ${new Date().toTimeString().split(' ')[0]}`,
    '',
    '**RACI Key:** R (Responsible) | A (Accountable) | C (Consulted) | I (Informed)',
    '',
    '**Status:** ✅ Shipped/Verified | 🟠 Inferred | 🟡 Hypothesis/Backlogged | 🔴 Correction | ⚪ Other',
    '',
    '---',
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total decisions | ${decisions.length} |`,
    `| Total derivation entries | ${entries.length} |`,
    `| Date range | ${decisions.length > 0 ? decisions[decisions.length - 1].date.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '?' : '?'} to ${decisions.length > 0 ? decisions[0].date.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '?' : '?'} |`,
    `| Accountable (all decisions) | Qinnovate LLC |`,
    '',
  ];

  // Group by month
  const byMonth = {};
  for (const d of decisions) {
    const month = d.date.match(/\d{4}-\d{2}/)?.[0] || 'Unknown';
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(d);
  }

  // Reverse chronological
  const months = Object.keys(byMonth).sort().reverse();

  // Table of Contents
  lines.push('## Table of Contents');
  lines.push('');
  for (const month of months) {
    const monthName = new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const count = byMonth[month].length;
    const anchor = monthName.toLowerCase().replace(/\s+/g, '-');
    lines.push(`- [${monthName}](#${anchor}) (${count} decision${count !== 1 ? 's' : ''})`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const month of months) {
    const monthName = new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    lines.push(`## ${monthName}`);
    lines.push('');
    lines.push('| Status | # | Date | Decision | Classification | RACI |');
    lines.push('|--------|---|------|----------|---------------|------|');

    for (const d of byMonth[month].sort((a, b) => b.num - a.num)) {
      const raci = d.raci || 'See entry';
      const dateShort = d.date.match(/\d{4}-\d{2}-\d{2}/)?.[0] || d.date;
      // Ship status based on classification
      const cls = (d.classification || '').toLowerCase();
      const status = cls.includes('verified') ? '✅'
        : cls.includes('correction') ? '🔴'
        : cls.includes('hypothesis') ? '🟡'
        : cls.includes('inferred') ? '🟠'
        : cls.includes('process') ? '✅'
        : '⚪';
      lines.push(`| ${status} | [${d.num}](../osi-of-mind/QIF-DERIVATION-LOG.md#entry-${d.num}-${d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}) | ${dateShort} | ${d.title.slice(0, 80)} | ${d.classification} | ${raci} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(`*${decisions.length} decisions extracted from ${entries.length} derivation log entries.*`);
  lines.push('');
  lines.push('*Generated by [Quorum](https://qinnovate.com) governance pipeline*');

  return lines.join('\n');
}

// ── Generate TRANSPARENCY.md ──────────────────────────────────────────

/**
 * The AI-versus-human contribution figures this page used to publish are retired: they were counted
 * from per-entry labels in the derivation log, which cannot capture the context in which work was
 * produced. The page stays so existing links work, and states that plainly.
 */
function generateTransparency() {
  const today = new Date().toISOString().split('T')[0];
  const lines = [
    '---',
    'title: "Transparency Statement"',
    'description: "AI-versus-human contribution metrics are deprecated. This page explains why."',
    'order: 4',
    '---',
    '',
    `<!-- AUTO-GENERATED by src/scripts/generate-governance.mjs — do not edit directly -->`,
    `<!-- Regenerate: npm run transparency | Last generated: ${today} -->`,
    '',
    '# Transparency Statement',
    '',
    '> **Notice: the AI-versus-human metrics on this page are not reliable.** The AI tools that tracked them were inaccurate. Their accuracy also degrades with the context window and the limits of current language models, so no complete record can be kept. Per-decision audit trails cost more tokens than they are worth, so we no longer keep them. Treat any figure published before this notice as unverified.',
    '',
    '> **Deprecated: AI-versus-human contribution metrics.** This page used to publish figures for how much of the work was AI-assisted and how much was human-only. Those figures are retired and should not be cited. They were counted from per-entry labels in a working log, and a label cannot capture the context in which a piece of work was produced: who set the direction, who checked it, what was corrected and why. The numbers were inaccurate, so they are no longer published.',
    '',
    '## What this page still states',
    '',
    '- QIF, TARA and NISS are proposed research frameworks. They are not validated and not adopted by any standards body.',
    '- Posts and papers that involved AI assistance are meant to carry their own disclosure note.',
    '- Qinnovate is accountable for what it publishes.',
    '',
    '## Tools Used',
    '',
    '| Tool | Role |',
    '|------|------|',
    '| Claude Opus 4.6 | Primary AI assistant — co-derivation, implementation, literature synthesis |',
    '| Quorum (Claude plugin) | Multi-agent swarm review — structured dissent, fact-checking, security audit |',
    '',
    '---',
    '',
    '*Why this page is still here: so that existing links keep working.*',
  ];

  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  const cmd = process.argv[2] || 'both';
  const entries = parseDerivationLog();

  console.log(`[governance] Parsed ${entries.length} derivation log entries`);
  console.log(`[governance] Decisions: ${entries.filter(e => e.isDecision).length}`);

  if (cmd === 'decisions' || cmd === 'both') {
    const content = generateDecisionLog(entries);
    writeFileSync(DECISION_PATH, content);
    console.log(`[governance] Wrote ${DECISION_PATH}`);
  }

  if (cmd === 'transparency' || cmd === 'both') {
    const content = generateTransparency();
    writeFileSync(TRANSPARENCY_PATH, content);
    console.log(`[governance] Wrote ${TRANSPARENCY_PATH}`);
  }
}

main();
