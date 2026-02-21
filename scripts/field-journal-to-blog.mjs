#!/usr/bin/env node

/**
 * field-journal-to-blog.mjs
 *
 * Parses QIF-FIELD-JOURNAL.md and generates blog post markdown files
 * for any entries not already published in blogs/.
 *
 * Usage: node scripts/field-journal-to-blog.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const JOURNAL_PATH = join(ROOT, 'qif-framework', 'QIF-FIELD-JOURNAL.md');
const BLOGS_DIR = join(ROOT, 'blogs');
const DRY_RUN = process.argv.includes('--dry-run');

const REPO_URL = 'https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md';

// Map keywords from "Connected to:" lines to tags
const TAG_MAP = {
  'nsp': '#NSP',
  'bci': '#BCI',
  'tara': '#TARA',
  'niss': '#NISS',
  'runemate': '#Runemate',
  'neuroethics': '#Neuroethics',
  'neuroscience': '#Neuroscience',
  'synesthesia': '#Synesthesia',
  'neuroplasticity': '#Neuroplasticity',
  'moore\'s law': '#MooresLaw',
  'openbci': '#OpenBCI',
  'neuralink': '#Neuralink',
  'coherence': '#Coherence',
  'hourglass': '#Hourglass',
  'quantum': '#Quantum',
  'cryptography': '#Cryptography',
  'encryption': '#Encryption',
  'neurorights': '#Neurorights',
  'firewall': '#Firewall',
  'brain-firewall': '#Firewall',
  'macshield': '#macshield',
};

/**
 * Parse all entries from the field journal.
 * Handles two header formats:
 *   New: ## Entry NNN — "Title" {#entry-NNN}
 *   Old: ### NNN — YYYY-MM-DD [HH:MM]
 */
function parseEntries(content) {
  const lines = content.split('\n');
  const entries = [];

  // Parse ToC for titles of old-format entries
  const tocTitles = {};
  const tocRegex = /\|\s*\[(\d+)\]/;
  const tocTitleRegex = /\|\s*\d{4}-\d{2}-\d{2}\s*\|\s*(.+?)\s*\|/;
  for (const line of lines) {
    const numMatch = line.match(tocRegex);
    const titleMatch = line.match(tocTitleRegex);
    if (numMatch && titleMatch) {
      tocTitles[numMatch[1]] = titleMatch[1].trim();
    }
  }

  // Regex for entry headers
  const newFormatRegex = /^## Entry (\d+)\s*[—–-]\s*"(.+?)"\s*\{#entry-\d+\}/;
  const oldFormatRegex = /^###\s+(\d+)\s*[—–-]\s*(\d{4}-\d{2}-\d{2})/;

  let currentEntry = null;
  let bodyLines = [];

  function finalizeEntry() {
    if (!currentEntry) return;
    // Trim trailing empty lines and separator
    while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') {
      bodyLines.pop();
    }
    if (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '---') {
      bodyLines.pop();
    }
    while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') {
      bodyLines.pop();
    }
    currentEntry.body = bodyLines.join('\n').trim();

    // Extract date from body if not in header
    if (!currentEntry.date) {
      const dateMatch = currentEntry.body.match(/\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        currentEntry.date = dateMatch[1];
      }
    }

    // Extract connected-to tags
    const connectedMatch = currentEntry.body.match(/\*\*Connected to:\*\*(.+?)(?:\n\n|\n\*\*|$)/s);
    if (connectedMatch) {
      const connectedText = connectedMatch[1].toLowerCase();
      for (const [keyword, tag] of Object.entries(TAG_MAP)) {
        if (connectedText.includes(keyword)) {
          if (!currentEntry.tags.includes(tag)) {
            currentEntry.tags.push(tag);
          }
        }
      }
    }

    // Also scan body for neurorights-related content
    const bodyLower = currentEntry.body.toLowerCase();
    for (const [keyword, tag] of Object.entries(TAG_MAP)) {
      if (bodyLower.includes(keyword) && !currentEntry.tags.includes(tag)) {
        // Only auto-add certain high-signal tags from body text
        if (['#Neurorights', '#TARA', '#NSP', '#BCI'].includes(tag)) {
          currentEntry.tags.push(tag);
        }
      }
    }

    entries.push(currentEntry);
    currentEntry = null;
    bodyLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for new-format entry header
    const newMatch = line.match(newFormatRegex);
    if (newMatch) {
      finalizeEntry();
      const num = newMatch[1];
      currentEntry = {
        number: parseInt(num, 10),
        paddedNumber: num.padStart(3, '0'),
        title: newMatch[2],
        date: null,
        tags: ['#FieldJournal', '#QIF'],
        anchor: `entry-${num.padStart(3, '0')}`,
      };
      bodyLines = [];
      continue;
    }

    // Check for old-format entry header
    const oldMatch = line.match(oldFormatRegex);
    if (oldMatch) {
      finalizeEntry();
      const num = oldMatch[1];
      const title = tocTitles[num] || tocTitles[num.padStart(3, '0')] || `Entry ${num}`;
      currentEntry = {
        number: parseInt(num, 10),
        paddedNumber: num.padStart(3, '0'),
        title: title,
        date: oldMatch[2],
        tags: ['#FieldJournal', '#QIF'],
        anchor: `${num.padStart(3, '0')}--${oldMatch[2].replace(/ /g, '-')}`,
      };
      bodyLines = [];
      continue;
    }

    // If inside an entry, accumulate body lines
    if (currentEntry) {
      bodyLines.push(line);
    }
  }

  // Finalize last entry
  finalizeEntry();

  return entries;
}

/**
 * Check which entry numbers already have blog posts.
 * Looks for `source:` frontmatter containing `#entry-NNN` or entry anchors.
 */
function getPublishedEntries() {
  const published = new Set();
  if (!existsSync(BLOGS_DIR)) return published;

  const files = readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const content = readFileSync(join(BLOGS_DIR, file), 'utf-8');
    // Check source field for entry anchor
    const sourceMatch = content.match(/source:\s*["']?.*#entry-(\d+)/);
    if (sourceMatch) {
      published.add(parseInt(sourceMatch[1], 10));
      continue;
    }
    // Check for old-style anchors
    const oldAnchorMatch = content.match(/source:\s*["']?.*#(\d+)--/);
    if (oldAnchorMatch) {
      published.add(parseInt(oldAnchorMatch[1], 10));
      continue;
    }
    // Check filename pattern
    const filenameMatch = file.match(/field-journal-(\d+)/);
    if (filenameMatch) {
      published.add(parseInt(filenameMatch[1], 10));
    }
  }
  return published;
}

/**
 * Slugify a title for use in filenames.
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

/**
 * Generate a blog post markdown string for an entry.
 */
function generateBlogPost(entry) {
  const tags = JSON.stringify(entry.tags);
  const sourceUrl = `${REPO_URL}#${entry.anchor}`;

  const frontmatter = `---
title: "Field Journal #${entry.paddedNumber}: ${entry.title}"
subtitle: "From the QIF Field Journal"
date_posted: "${entry.date}"
source: "${sourceUrl}"
tags: ${tags}
author: "Kevin Qi"
fact_checked: false
fact_check_date: ""
fact_check_notes: []
---`;

  const footer = `

---

*This entry is part of the [QIF Field Journal](${REPO_URL}), a living, append-only research journal documenting first-person observations at the intersection of neurosecurity, BCI engineering, and neurorights. The journal exists because neural privacy is a right, not a feature. Tools like [macshield](https://github.com/qinnovates/macshield) protect digital identity on networks; this research works toward protecting cognitive identity at the neural interface.*

[Read this entry in context](${sourceUrl})`;

  return `${frontmatter}\n\n${entry.body}${footer}\n`;
}

// Main
function main() {
  if (!existsSync(JOURNAL_PATH)) {
    console.error(`Field journal not found at ${JOURNAL_PATH}`);
    process.exit(1);
  }

  if (!existsSync(BLOGS_DIR)) {
    mkdirSync(BLOGS_DIR, { recursive: true });
  }

  const journalContent = readFileSync(JOURNAL_PATH, 'utf-8');
  const entries = parseEntries(journalContent);
  const published = getPublishedEntries();

  console.log(`Parsed ${entries.length} entries from field journal`);
  console.log(`Already published: ${published.size} entries`);

  let created = 0;
  for (const entry of entries) {
    if (published.has(entry.number)) {
      console.log(`  skip: Entry ${entry.paddedNumber} (already published)`);
      continue;
    }

    if (!entry.date) {
      console.warn(`  skip: Entry ${entry.paddedNumber} (no date found)`);
      continue;
    }

    const slug = slugify(entry.title);
    const filename = `${entry.date}-field-journal-${entry.paddedNumber}-${slug}.md`;
    const filepath = join(BLOGS_DIR, filename);

    const content = generateBlogPost(entry);

    if (DRY_RUN) {
      console.log(`  would create: ${filename}`);
    } else {
      writeFileSync(filepath, content, 'utf-8');
      console.log(`  created: ${filename}`);
    }
    created++;
  }

  console.log(`\n${DRY_RUN ? 'Would create' : 'Created'} ${created} new blog post(s)`);
  return created;
}

const count = main();
process.exit(0);
