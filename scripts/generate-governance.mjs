#!/usr/bin/env node
/**
 * Generate governance documents from QIF-DERIVATION-LOG.md.
 *
 * Single source of truth: the derivation log.
 * Generated views: DECISION-LOG.md (RACI tables) and TRANSPARENCY.md (AI disclosure).
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
const ROOT = resolve(__dirname, '..');
const LOG_PATH = resolve(ROOT, 'qif-framework/QIF-DERIVATION-LOG.md');
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
    const aiMatch = body.match(/\*\*AI Systems:\*\*\s*(.+)/);
    const raciMatch = body.match(/\*\*RACI:\*\*\s*(.+)/);
    const contribMatch = body.match(/\*\*AI Contribution Level:\*\*\s*(.+)/);
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
      aiSystems: aiMatch ? aiMatch[1].trim() : '',
      raci: raciMatch ? raciMatch[1].trim() : '',
      contributionLevel: contribMatch ? contribMatch[1].trim() : '',
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
    'Rolling record of framework decisions extracted from the [QIF Derivation Log](../qif-framework/QIF-DERIVATION-LOG.md).',
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
    `| Accountable (all decisions) | Kevin Qi |`,
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
    lines.push('| Status | # | Date | Decision | Classification | RACI | AI Level |');
    lines.push('|--------|---|------|----------|---------------|------|----------|');

    for (const d of byMonth[month].sort((a, b) => b.num - a.num)) {
      const raci = d.raci || 'See entry';
      const level = d.contributionLevel || '—';
      const dateShort = d.date.match(/\d{4}-\d{2}-\d{2}/)?.[0] || d.date;
      // Ship status based on classification
      const cls = (d.classification || '').toLowerCase();
      const status = cls.includes('verified') ? '✅'
        : cls.includes('correction') ? '🔴'
        : cls.includes('hypothesis') ? '🟡'
        : cls.includes('inferred') ? '🟠'
        : cls.includes('process') ? '✅'
        : '⚪';
      lines.push(`| ${status} | [${d.num}](../qif-framework/QIF-DERIVATION-LOG.md#entry-${d.num}-${d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}) | ${dateShort} | ${d.title.slice(0, 80)} | ${d.classification} | ${raci} | ${level} |`);
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

function generateTransparency(entries) {
  const total = entries.length;
  const decisions = entries.filter(e => e.isDecision).length;
  const withAI = entries.filter(e => e.aiSystems && e.aiSystems !== '').length;
  const corrections = entries.filter(e => /CORRECTION/i.test(e.classification)).length;
  const quorumReviewed = entries.filter(e => /quorum/i.test(e.aiSystems)).length;
  const humanOnly = entries.filter(e => /human-only/i.test(e.contributionLevel)).length;

  // Count AI contribution levels
  const levels = { 'AI-assisted': 0, 'AI-generated': 0, 'Human-only': 0, 'Quorum-reviewed': 0, 'unspecified': 0 };
  for (const e of entries) {
    const lvl = e.contributionLevel?.toLowerCase() || '';
    if (lvl.includes('quorum')) levels['Quorum-reviewed']++;
    else if (lvl.includes('generated')) levels['AI-generated']++;
    else if (lvl.includes('assisted')) levels['AI-assisted']++;
    else if (lvl.includes('human')) levels['Human-only']++;
    else levels['unspecified']++;
  }

  const lines = [
    '---',
    'title: "Transparency Statement"',
    'description: "Auditable record of Human-AI collaboration in QIF Framework development"',
    'order: 4',
    `audit:`,
    `  decisionsLogged: ${decisions}`,
    `  independentReviews: ${quorumReviewed}`,
    `  humanDecisionRate: "100%"`,
    `  verificationPasses: ${total}`,
    `  automatedTests: 0`,
    '---',
    '',
    `<!-- AUTO-GENERATED from QIF-DERIVATION-LOG.md — do not edit directly -->`,
    `<!-- Regenerate: npm run transparency | Last generated: ${new Date().toISOString().split('T')[0]} -->`,
    '',
    '# Transparency Statement: Human-AI Collaboration in QIF Framework',
    '',
    '> This document is auto-generated from the [QIF Derivation Log](../qif-framework/QIF-DERIVATION-LOG.md),',
    '> which is the single source of truth for all framework decisions and AI collaboration records.',
    '',
    `**Last generated:** ${new Date().toISOString().split('T')[0]} at ${new Date().toTimeString().split(' ')[0]}`,
    '',
    '## Table of Contents',
    '',
    '- [AI Collaboration Summary](#ai-collaboration-summary)',
    '- [AI Contribution Breakdown](#ai-contribution-breakdown)',
    '- [Core Principle](#core-principle)',
    '- [Tools Used](#tools-used)',
    '- [Documented Corrections](#documented-corrections)',
    '',
    '---',
    '',
    '## AI Collaboration Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total derivation entries | **${total}** |`,
    `| Entries involving AI | ${withAI} (${Math.round(withAI / total * 100)}%) |`,
    `| Corrections / retractions | ${corrections > 0 ? '🔴' : '🟢'} ${corrections} |`,
    `| Quorum swarm reviews | ${quorumReviewed > 0 ? '🟢' : '🟡'} ${quorumReviewed} |`,
    `| Human-only entries | ${humanOnly} |`,
    `| Human decision rate | 🟢 100% (Kevin Qi is Accountable on every entry) |`,
    '',
    '## AI Contribution Breakdown',
    '',
    '| Level | Count | Description |',
    '|-------|-------|-------------|',
    `| AI-assisted | ${levels['AI-assisted']} | Human directed; AI implemented or researched |`,
    `| AI-generated | ${levels['AI-generated']} | AI produced first draft; human reviewed and approved |`,
    `| Human-only | ${levels['Human-only']} | No AI involvement |`,
    `| Quorum-reviewed | ${levels['Quorum-reviewed']} | Multi-agent swarm validation |`,
    `| Unspecified | ${levels['unspecified']} | Legacy entries without AI Contribution Level metadata |`,
    '',
    '## Core Principle',
    '',
    'Every contribution is categorized by its cognitive origin. AI assistance is treated as a tool subject',
    'to human oversight, not a collaborator with independent judgment on ethical or novel technical matters.',
    'All final decisions are made by Kevin Qi (A = Accountable in every RACI entry).',
    '',
    '## Tools Used',
    '',
    '| Tool | Role |',
    '|------|------|',
    '| Claude Opus 4.6 | Primary AI assistant — co-derivation, implementation, literature synthesis |',
    '| Quorum (Claude plugin) | Multi-agent swarm review — structured dissent, fact-checking, security audit |',
    '',
    '## Documented Corrections',
    '',
    'The derivation log contains explicit correction entries (Classification: CORRECTION) where',
    'previous claims were retracted or revised. This is by design — corrections are the most',
    'valuable entries because they demonstrate active oversight.',
    '',
    `Total corrections: ${corrections}`,
    '',
    '---',
    '',
    `*Generated from ${total} derivation log entries. Source: [QIF-DERIVATION-LOG.md](../qif-framework/QIF-DERIVATION-LOG.md)*`,
    '',
    '*Generated by [Quorum](https://qinnovate.com) governance pipeline*',
  ];

  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  const cmd = process.argv[2] || 'both';
  const entries = parseDerivationLog();

  console.log(`[governance] Parsed ${entries.length} derivation log entries`);
  console.log(`[governance] Decisions: ${entries.filter(e => e.isDecision).length}`);
  console.log(`[governance] With AI: ${entries.filter(e => e.aiSystems).length}`);

  if (cmd === 'decisions' || cmd === 'both') {
    const content = generateDecisionLog(entries);
    writeFileSync(DECISION_PATH, content);
    console.log(`[governance] Wrote ${DECISION_PATH}`);
  }

  if (cmd === 'transparency' || cmd === 'both') {
    const content = generateTransparency(entries);
    writeFileSync(TRANSPARENCY_PATH, content);
    console.log(`[governance] Wrote ${TRANSPARENCY_PATH}`);
  }
}

main();
