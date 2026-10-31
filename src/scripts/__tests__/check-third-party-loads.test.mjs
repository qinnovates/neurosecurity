import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findThirdPartyLoadFailures, findThirdPartyLoads } from '../check-third-party-loads.mjs';

describe('findThirdPartyLoads', () => {
  it('finds scripts, stylesheets, preconnects and frames on other origins, whatever the attribute order', () => {
    const html = [
      '<script async src="https://cdn.example.net/tag.js"></script>',
      '<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<iframe title="t" src="//example.org/embed"></iframe>',
    ].join('');
    expect(findThirdPartyLoads(html)).toEqual([
      { kind: 'script', host: 'cdn.example.net' },
      { kind: 'link', host: 'fonts.googleapis.com' },
      { kind: 'link', host: 'fonts.gstatic.com' },
      { kind: 'iframe', host: 'example.org' },
    ]);
  });

  it('finds images, media sources, posters and srcset candidates on other origins', () => {
    const html = '<img src="https://img.example.net/a.png" alt=""><source srcset="/a.webp 1x, https://img.example.org/b.webp 2x"><video poster="https://img.example.com/p.jpg"></video>';
    expect(findThirdPartyLoads(html)).toEqual([
      { kind: 'img', host: 'img.example.net' },
      { kind: 'source', host: 'img.example.org' },
      { kind: 'video poster', host: 'img.example.com' },
    ]);
  });

  it('leaves own-origin loads, relative loads, plain links and inline scripts alone', () => {
    const html = [
      '<script src="/js/consent.js"></script>', '<script src="https://qinnovate.com/_astro/a.js"></script>', '<script>var a = 1;</script>',
      '<link rel="canonical" href="https://other.example/x">', '<link rel="alternate" type="application/rss+xml" href="https://news.example/rss">',
      '<link rel="stylesheet" href="/_astro/a.css">',
    ].join('');
    expect(findThirdPartyLoads(html)).toEqual([]);
  });
});

describe('findThirdPartyLoadFailures', () => {
  let dist;
  beforeEach(() => { dist = fs.mkdtempSync(path.join(os.tmpdir(), 'third-party-')); });
  afterEach(() => { fs.rmSync(dist, { recursive: true, force: true }); });

  it('names the page and the origin once, however often the page repeats it', () => {
    fs.mkdirSync(path.join(dist, 'about'));
    fs.writeFileSync(path.join(dist, 'about', 'index.html'), '<script src="https://cdn.example.net/a.js"></script><script src="https://cdn.example.net/b.js"></script>');
    expect(findThirdPartyLoadFailures(dist)).toEqual(['/about/: loads a script from cdn.example.net']);
  });
});
