#!/usr/bin/env node

/**
 * changelog-update.mjs
 *
 * Parses git log since last changelog update, classifies commits by prefix tag,
 * and appends entries to CHANGELOG.md. Generates blog drafts for tier 2+ commits
 * and release metadata for tier 3.
 *
 * Usage: node scripts/changelog-update.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CHANGELOG_PATH = join(ROOT, 'CHANGELOG.md');
const BLOGS_DIR = join(ROOT, 'blogs');
const DIST_DIR = join(ROOT, 'dist');
const DRY_RUN = process.argv.includes('--dry-run');
const REPO_URL = 'https://github.com/qinnovates/qinnovate';

// --- Tier Classification ---

const TIER_RULES = [
  // Tier 0: skip
  { pattern: /^auto:/i, tier: 0, category: null },
  // Tier 3: release + research
  { pattern: /^\[Release\]/i, tier: 3, category: 'Released' },
  { pattern: /^\[Research\]/i, tier: 3, category: 'Research' },
  // Tier 2: add + update
  { pattern: /^\[Add\]/i, tier: 2, category: 'Added' },
  { pattern: /^\[Update\]/i, tier: 2, category: 'Updated' },
  { pattern: /^\[Consolidate\]/i, tier: 2, category: 'Other' },
  // Tier 1: fix, docs, chore, refactor
  { pattern: /^\[Fix\]/i, tier: 1, category: 'Fixed' },
  { pattern: /^fix:/i, tier: 1, category: 'Fixed' },
  { pattern: /^docs:/i, tier: 1, category: 'Docs' },
  { pattern: /^chore:/i, tier: 1, category: 'Other' },
  { pattern: /^refactor:/i, tier: 1, category: 'Other' },
];

/**
 * Classify a commit message into a tier and category.
 */
function classifyCommit(subject) {
  for (const rule of TIER_RULES) {
    if (rule.pattern.test(subject)) {
      return { tier: rule.tier, category: rule.category };
    }
  }
  // Default: unprefixed commits are tier 1, categorized as "Other"
  // But if they start with a capitalized verb (Add, Create, etc.), bump to tier 2
  if (/^(Add|Create|Implement|Build|Launch)\b/i.test(subject)) {
    return { tier: 2, category: 'Added' };
  }
  if (/^Neurowall\b/i.test(subject)) {
    return { tier: 2, category: 'Added' };
  }
  return { tier: 1, category: 'Other' };
}

/**
 * Strip the prefix tag from a commit subject for display.
 */
function stripPrefix(subject) {
  return subject
    .replace(/^\[(Release|Research|Add|Update|Fix|Consolidate)\]\s*/i, '')
    .replace(/^(fix|docs|chore|refactor|auto):\s*/i, '')
    .trim();
}

/**
 * Get the last processed commit hash from CHANGELOG.md marker.
 */
function getLastMarker() {
  if (!existsSync(CHANGELOG_PATH)) return null;
  const content = readFileSync(CHANGELOG_PATH, 'utf-8');
  const match = content.match(/<!-- changelog-marker: ([a-f0-9]+) -->/);
  return match ? match[1] : null;
}

/**
 * Parse git log since a given commit (or all commits if null).
 */
function getCommitsSince(sinceHash) {
  const range = sinceHash ? `${sinceHash}..HEAD` : 'HEAD~50..HEAD';
  try {
    const raw = execSync(
      `git log ${range} --format="%H|%s|%ai|%b|||END|||" --no-merges`,
      { cwd: ROOT, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return parseGitLog(raw);
  } catch {
    return [];
  }
}

/**
 * Parse raw git log output into structured commits.
 */
function parseGitLog(raw) {
  const entries = raw.split('|||END|||').filter(e => e.trim());
  return entries.map(entry => {
    const lines = entry.trim().split('\n');
    const firstLine = lines[0];
    const pipeIdx1 = firstLine.indexOf('|');
    const pipeIdx2 = firstLine.indexOf('|', pipeIdx1 + 1);
    const pipeIdx3 = firstLine.indexOf('|', pipeIdx2 + 1);

    const hash = firstLine.substring(0, pipeIdx1);
    const subject = firstLine.substring(pipeIdx1 + 1, pipeIdx2);
    const dateStr = firstLine.substring(pipeIdx2 + 1, pipeIdx3);
    const body = lines.slice(1).join('\n').trim();

    const date = dateStr.split(' ')[0]; // YYYY-MM-DD

    return { hash, subject, date, body };
  }).filter(c => c.hash && c.subject);
}

/**
 * Group commits by date and category.
 */
function groupCommits(commits) {
  const classified = commits.map(c => ({
    ...c,
    ...classifyCommit(c.subject),
    display: stripPrefix(c.subject),
  }));

  // Filter out tier 0
  const filtered = classified.filter(c => c.tier > 0);

  // Group by date
  const byDate = {};
  for (const c of filtered) {
    if (!byDate[c.date]) byDate[c.date] = [];
    byDate[c.date].push(c);
  }

  return { classified, filtered, byDate };
}

/**
 * Generate changelog markdown for a date group.
 */
function formatDateSection(date, commits) {
  const byCategory = {};
  for (const c of commits) {
    if (!byCategory[c.category]) byCategory[c.category] = [];
    byCategory[c.category].push(c);
  }

  // Category order
  const ORDER = ['Released', 'Research', 'Added', 'Updated', 'Fixed', 'Docs', 'Other'];
  let md = `## ${date}\n`;

  for (const cat of ORDER) {
    if (!byCategory[cat]) continue;
    md += `\n### ${cat}\n`;
    for (const c of byCategory[cat]) {
      const shortHash = c.hash.substring(0, 7);
      md += `- ${c.display} ([${shortHash}](${REPO_URL}/commit/${shortHash}))\n`;
    }
  }

  return md;
}

/**
 * Generate a blog draft for tier 2+ commits on a given date.
 */
function generateBlogDraft(date, commits) {
  const tier2Plus = commits.filter(c => c.tier >= 2);
  if (tier2Plus.length === 0) return null;

  const tags = new Set(['#Changelog', '#Release']);
  for (const c of tier2Plus) {
    const lower = c.subject.toLowerCase();
    if (lower.includes('bci') || lower.includes('eeg')) tags.add('#BCI');
    if (lower.includes('tara') || lower.includes('niss')) tags.add('#TARA');
    if (lower.includes('neurowall')) tags.add('#Neurowall');
    if (lower.includes('validation')) tags.add('#Validation');
    if (lower.includes('nsp')) tags.add('#NSP');
    if (lower.includes('dashboard')) tags.add('#Dashboard');
  }

  const tagArray = JSON.stringify([...tags]);

  let body = '';
  for (const c of tier2Plus) {
    const shortHash = c.hash.substring(0, 7);
    body += `- **${c.display}** ([${shortHash}](${REPO_URL}/commit/${shortHash}))`;
    if (c.body) {
      // Pull first meaningful line from commit body
      const bodyLines = c.body.split('\n').filter(l => l.trim() && !l.startsWith('Co-Authored'));
      if (bodyLines.length > 0) {
        body += `\n  ${bodyLines[0].trim()}`;
      }
    }
    body += '\n';
  }

  const frontmatter = `---
title: "Project Update: ${date}"
subtitle: "Recent changes and improvements"
date_posted: "${date}"
source: "${REPO_URL}/commits/main"
tags: ${tagArray}
author: "Kevin Qi"
fact_checked: false
fact_check_date: ""
fact_check_notes: []
---`;

  const content = `${frontmatter}

## What Changed

${body}
---

*Auto-generated changelog summary. Review before publishing.*
`;

  return content;
}

/**
 * Generate release metadata JSON for tier 3 commits.
 */
function generateReleaseMeta(date, commits) {
  const tier3 = commits.filter(c => c.tier >= 3);
  if (tier3.length === 0) return null;

  return {
    date,
    highlights: tier3.map(c => c.display),
    commits: tier3.map(c => ({ hash: c.hash.substring(0, 7), subject: c.subject })),
  };
}

// --- Main ---

function main() {
  const lastMarker = getLastMarker();
  const commits = getCommitsSince(lastMarker);

  if (commits.length === 0) {
    console.log('No new commits since last changelog update.');
    process.exit(2); // Exit code 2 = no changes (matches fetch-news.mjs pattern)
  }

  const { classified, filtered, byDate } = groupCommits(commits);
  const skipped = classified.filter(c => c.tier === 0).length;

  console.log(`Found ${commits.length} commits (${filtered.length} tracked, ${skipped} skipped)`);

  if (filtered.length === 0) {
    console.log('All commits are tier 0 (auto:). Nothing to add.');
    process.exit(2);
  }

  // Sort dates descending
  const dates = Object.keys(byDate).sort().reverse();

  // Build new changelog sections
  let newSections = '';
  let maxTier = 0;
  let blogDraftsCreated = 0;

  for (const date of dates) {
    const dateCommits = byDate[date];
    newSections += '\n' + formatDateSection(date, dateCommits);

    // Track max tier
    for (const c of dateCommits) {
      if (c.tier > maxTier) maxTier = c.tier;
    }

    // Blog draft for tier 2+
    const draft = generateBlogDraft(date, dateCommits);
    if (draft) {
      const filename = `${date}-changelog-summary.md`;
      const filepath = join(BLOGS_DIR, filename);

      // Skip if draft already exists for this date
      if (existsSync(filepath)) {
        console.log(`  blog draft already exists: ${filename}`);
      } else if (DRY_RUN) {
        console.log(`  would create blog draft: ${filename}`);
        blogDraftsCreated++;
      } else {
        if (!existsSync(BLOGS_DIR)) mkdirSync(BLOGS_DIR, { recursive: true });
        writeFileSync(filepath, draft, 'utf-8');
        console.log(`  created blog draft: ${filename}`);
        blogDraftsCreated++;
      }
    }

    // Release metadata for tier 3
    const releaseMeta = generateReleaseMeta(date, dateCommits);
    if (releaseMeta) {
      if (DRY_RUN) {
        console.log(`  would create release metadata for ${date}`);
      } else {
        if (!existsSync(DIST_DIR)) mkdirSync(DIST_DIR, { recursive: true });
        const metaPath = join(DIST_DIR, 'release-meta.json');
        writeFileSync(metaPath, JSON.stringify(releaseMeta, null, 2), 'utf-8');
        console.log(`  created release metadata: dist/release-meta.json`);

        // Also generate release notes markdown
        const notesPath = join(DIST_DIR, 'release-notes.md');
        let notes = `# Release ${date}\n\n`;
        for (const h of releaseMeta.highlights) {
          notes += `- ${h}\n`;
        }
        writeFileSync(notesPath, notes, 'utf-8');
        console.log(`  created release notes: dist/release-notes.md`);
      }
    }
  }

  // Update CHANGELOG.md
  const latestHash = commits[0].hash;
  const newMarker = `<!-- changelog-marker: ${latestHash} -->`;

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: Would add to CHANGELOG.md ---');
    console.log(newSections);
    console.log(`\nMax tier: ${maxTier}`);
    console.log(`Blog drafts: ${blogDraftsCreated}`);
    if (maxTier >= 3) console.log('Would create GitHub Release');
  } else {
    let existing = '';
    if (existsSync(CHANGELOG_PATH)) {
      existing = readFileSync(CHANGELOG_PATH, 'utf-8');
    }

    // Replace marker with new one
    if (existing.includes('<!-- changelog-marker:')) {
      existing = existing.replace(/<!-- changelog-marker: [a-f0-9]+ -->/, newMarker);
    } else {
      // Insert marker after header
      const headerEnd = existing.indexOf('\n\n');
      if (headerEnd > -1) {
        existing = existing.substring(0, headerEnd) + '\n\n' + newMarker + existing.substring(headerEnd);
      }
    }

    // Insert new sections after marker line
    const markerIdx = existing.indexOf(newMarker);
    if (markerIdx > -1) {
      const afterMarker = markerIdx + newMarker.length;
      // Check if the date section already exists
      for (const date of dates) {
        const dateHeader = `## ${date}`;
        if (existing.includes(dateHeader)) {
          // Date already has entries, merge new ones
          // For simplicity, skip dates that already exist
          console.log(`  skipping ${date} (already in changelog)`);
          newSections = newSections.replace(formatDateSection(date, byDate[date]), '');
        }
      }
      if (newSections.trim()) {
        existing = existing.substring(0, afterMarker) + '\n' + newSections + existing.substring(afterMarker);
      }
    }

    writeFileSync(CHANGELOG_PATH, existing, 'utf-8');
    console.log(`\nUpdated CHANGELOG.md (marker: ${latestHash.substring(0, 7)})`);
  }

  // Output tier info for CI
  console.log(`\nmax_tier=${maxTier}`);
  console.log(`blog_drafts=${blogDraftsCreated}`);

  return { maxTier, blogDraftsCreated };
}

const result = main();
process.exit(0);
