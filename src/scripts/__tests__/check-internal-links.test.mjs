import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  FROZEN_PAGE_PREFIXES,
  extractSameSiteLinkTargets,
  findDeadInternalLinkFailures,
  isInBuild,
  listBuiltPages,
} from '../check-internal-links.mjs';

let distDirectory;

function writePage(urlPath, html) {
  const filePath = path.join(distDirectory, ...urlPath.split('/').filter(Boolean), 'index.html');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);
}

beforeEach(() => {
  distDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'check-internal-links-'));
});

afterEach(() => {
  fs.rmSync(distDirectory, { recursive: true, force: true });
});

describe('extractSameSiteLinkTargets', () => {
  it('keeps one-slash hrefs without their query and fragment, and leaves external and protocol-relative ones out', () => {
    const html = '<a href="/atlas/?lens=niss#top"></a><a href="/atlas/"></a><a href="//cdn.example/x"></a>'
      + '<a href="https://example.org/"></a><a href="#here"></a><link href="/_astro/site.css">';
    expect(extractSameSiteLinkTargets(html)).toEqual(['/atlas/', '/_astro/site.css']);
  });

  it('decodes percent-encoded paths so the file system lookup sees the real name', () => {
    expect(extractSameSiteLinkTargets('<a href="/learn/a%20b.md">')).toEqual(['/learn/a b.md']);
  });
});

describe('isInBuild', () => {
  it('accepts a directory with an index page, the same page without its slash, a page file, and a plain file', () => {
    writePage('/about/', '<p>about</p>');
    fs.writeFileSync(path.join(distDirectory, 'notes.md'), '# notes');
    fs.writeFileSync(path.join(distDirectory, 'legacy.html'), '<p>legacy</p>');
    expect(isInBuild(distDirectory, '/about/')).toBe(true);
    expect(isInBuild(distDirectory, '/about')).toBe(true);
    expect(isInBuild(distDirectory, '/legacy')).toBe(true);
    expect(isInBuild(distDirectory, '/notes.md')).toBe(true);
    expect(isInBuild(distDirectory, '/missing/')).toBe(false);
  });

  it('treats a path that escapes the build as absent instead of reading outside it', () => {
    expect(isInBuild(distDirectory, '/../../etc/hosts')).toBe(false);
  });
});

describe('findDeadInternalLinkFailures', () => {
  it('names the page and the target for every link that is not in the build, once per pair', () => {
    writePage('/', '<a href="/about/">ok</a><a href="/gone/">dead</a><a href="/gone/#x">dead again</a>');
    writePage('/about/', '<a href="/">home</a>');
    expect(listBuiltPages(distDirectory)).toEqual(['/', '/about/']);
    expect(findDeadInternalLinkFailures(distDirectory)).toEqual([
      '/: links to /gone/, which is not in the build',
    ]);
  });

  it('does not hold archived whitepaper versions to the current site map', () => {
    writePage('/research/whitepaper/v6/', '<a href="/news/derivation/hourglass.html">old</a>');
    writePage('/research/whitepaper/', '<a href="/framework/">current</a>');
    writePage('/framework/', '<p>framework</p>');
    expect(FROZEN_PAGE_PREFIXES).toContain('/research/whitepaper/v');
    expect(findDeadInternalLinkFailures(distDirectory)).toEqual([]);
  });
});
