import { describe, expect, it } from 'vitest';
import { CLAMAV_IMAGE, buildRunArgs, labelFor, parseArguments } from '../scan-sources.mjs';
import { ScanOutputError, UsageError } from '../scan-sources/errors.mjs';
import {
  buildReport, classifyResult, evaluateFailures, findIntegrityProblems, parseScanOutput, parseVersionLine, redactHostPaths, tallyStatuses,
} from '../scan-sources/report.mjs';

const NOW = new Date('2026-10-31T12:00:00Z');
const FRESH_DATE = '2026-10-31T06:24:42.000Z';
const INFO = { engineVersion: '1.5.4', databaseVersion: 28170, databaseDate: FRESH_DATE };
const USERS_ROOT = ['', 'Users'].join('/');
const HOME_ROOT = ['', 'home'].join('/');
const TARGET = { absolute: `${USERS_ROOT}/someone/cache/raw`, label: '~/cache/raw', mountPoint: '/scan/0' };
const file = (name) => ({ containerPath: `/scan/0/${name}`, displayPath: `~/cache/raw/${name}`, sha256: 'a'.repeat(64) });
const SUMMARY = (scanned, infected) => `\n----------- SCAN SUMMARY -----------\nKnown viruses: 3628245\nScanned files: ${scanned}\nInfected files: ${infected}\n`;

function scanOf(stdout, files, exitCode) {
  const parsed = parseScanOutput(stdout, new Set(files.map((f) => f.containerPath)));
  return { ...parsed, exitCode };
}

describe('parseVersionLine', () => {
  it('reads engine, database version and UTC build date', () => {
    expect(parseVersionLine('ClamAV 1.5.4/28170/Sat Oct 31 06:24:42 2026\n')).toEqual(INFO);
  });
  it('rejects output it does not recognise', () => {
    expect(() => parseVersionLine('clamscan: command not found')).toThrow(ScanOutputError);
  });
});

describe('classifyResult', () => {
  it.each([
    ['OK', 'clean'],
    ['Empty file', 'empty'],
    ['Symbolic link', 'skipped'],
    ['Eicar-Test-Signature FOUND', 'infected'],
    ["Can't open file ERROR", 'error'],
    ['something new', 'error'],
  ])('maps "%s" to %s', (rest, status) => {
    expect(classifyResult(rest).status).toBe(status);
  });
  it('keeps the signature name of a detection', () => {
    expect(classifyResult('Win.Test.EICAR_HDB-1 FOUND').detail).toBe('Win.Test.EICAR_HDB-1');
  });
});

describe('parseScanOutput', () => {
  it('matches file names that contain ": " and collects notes and summary fields', () => {
    const files = [file('weird: name.txt'), file('ok.txt')];
    const out = `/scan/0/weird: name.txt: OK\n/scan/0/ok.txt: OK\nLibClamAV Warning: x${SUMMARY(2, 0)}`;
    const parsed = parseScanOutput(out, new Set(files.map((f) => f.containerPath)));
    expect(parsed.results.get('/scan/0/weird: name.txt').status).toBe('clean');
    expect(parsed.notes).toEqual(['LibClamAV Warning: x']);
    expect(parsed.summaryFields['Scanned files']).toBe('2');
  });
  it('flags a path reported twice', () => {
    const parsed = parseScanOutput('/scan/0/a: OK\n/scan/0/a: OK\n', new Set(['/scan/0/a']));
    expect(parsed.results.get('/scan/0/a').status).toBe('error');
  });
});

describe('evaluateFailures', () => {
  const clean = { clean: 3, infected: 0, empty: 0, skipped: 0, error: 0 };
  it('passes a fresh, fully scanned, clean run', () => {
    expect(evaluateFailures({ counts: clean, databaseDate: FRESH_DATE, integrityProblems: [] }, NOW)).toEqual([]);
  });
  it('fails on a detection', () => {
    expect(evaluateFailures({ counts: { ...clean, infected: 1 }, databaseDate: FRESH_DATE, integrityProblems: [] }, NOW)).toHaveLength(1);
  });
  it('fails on a file that could not be scanned', () => {
    expect(evaluateFailures({ counts: { ...clean, error: 1 }, databaseDate: FRESH_DATE, integrityProblems: [] }, NOW)[0]).toMatch(/could not be scanned/);
  });
  it('fails on signatures older than 7 days but not on 6', () => {
    const stale = evaluateFailures({ counts: clean, databaseDate: '2026-10-23T12:00:00Z', integrityProblems: [] }, NOW);
    const recent = evaluateFailures({ counts: clean, databaseDate: '2026-10-25T12:00:00Z', integrityProblems: [] }, NOW);
    expect(stale[0]).toMatch(/days old/);
    expect(recent).toEqual([]);
  });
  it('fails when zero files were scanned', () => {
    const failures = evaluateFailures({ counts: { ...clean, clean: 0, empty: 2 }, databaseDate: FRESH_DATE, integrityProblems: [] }, NOW);
    expect(failures).toContain('zero files were scanned');
  });
});

describe('buildReport', () => {
  it('marks a listed file the scanner never reported as an error, not a pass', () => {
    const files = [file('seen.bin'), file('missing.bin')];
    const scan = scanOf(`/scan/0/seen.bin: OK\n${SUMMARY(1, 0)}`, files, 0);
    const report = buildReport({ info: INFO, image: CLAMAV_IMAGE, targets: [TARGET], files, scan, now: NOW });
    expect(report.files.find((f) => f.path.endsWith('missing.bin')).status).toBe('error');
    expect(report.error_count).toBe(1);
    expect(report.failures.length).toBeGreaterThan(0);
  });
  it('reports relative labels only and never an absolute home path', () => {
    const files = [file('a.nii')];
    const scan = scanOf(`/scan/0/a.nii: Win.Test FOUND\n${SUMMARY(1, 1)}`, files, 1);
    const json = JSON.stringify(buildReport({ info: INFO, image: CLAMAV_IMAGE, targets: [TARGET], files, scan, now: NOW }));
    expect(json).not.toMatch(/\/Users\/|\/home\//);
    expect(json).toContain('"infected_count":1');
  });
  it('fails when the scanner summary disagrees with the per-file results', () => {
    const files = [file('a')];
    const scan = scanOf(`/scan/0/a: OK\n${SUMMARY(5, 0)}`, files, 0);
    expect(findIntegrityProblems({ counts: tallyStatuses([{ status: 'clean' }]), scan })[0]).toMatch(/counted 5 scanned/);
  });
});

describe('redactHostPaths', () => {
  it('replaces mount points, target paths and home directories', () => {
    const text = `/scan/0/x failed; ${USERS_ROOT}/someone/cache/raw/x; ${HOME_ROOT}/other/y`;
    expect(redactHostPaths(text, [TARGET])).toBe('~/cache/raw/x failed; ~/cache/raw/x; ~/y');
  });
});

describe('labelFor', () => {
  const roots = { root: '/repo', home: `${HOME_ROOT}/dev` };
  it('labels repo, home and external directories without absolute paths', () => {
    expect(labelFor('/repo/src/site/atlas-assets', 0, roots)).toBe('src/site/atlas-assets');
    expect(labelFor(`${HOME_ROOT}/dev/.cache/raw`, 1, roots)).toBe('~/.cache/raw');
    expect(labelFor('/mnt/data', 2, roots)).toBe('external-2');
  });
});

describe('parseArguments', () => {
  it('accepts update and scan with directories and --json', () => {
    expect(parseArguments(['update'])).toEqual({ name: 'update' });
    expect(parseArguments(['scan', 'a', 'b', '--json', 'out.json'])).toEqual({ name: 'scan', directories: ['a', 'b'], jsonPath: 'out.json' });
  });
  it.each([[[]], [['scan']], [['scan', '--json']], [['scan', 'a', '--bogus']], [['update', 'x']]])('rejects %j', (argv) => {
    expect(() => parseArguments(argv)).toThrow(UsageError);
  });
});

describe('container hardening', () => {
  const scanArgs = buildRunArgs({ network: 'none', mounts: [['--mount', 'type=bind,source=/x,target=/scan/0,readonly']], entrypoint: 'clamscan', toolArgs: ['-r'] });
  it('pins the image by digest', () => {
    expect(CLAMAV_IMAGE).toMatch(/^clamav\/clamav@sha256:[0-9a-f]{64}$/);
    expect(scanArgs).toContain(CLAMAV_IMAGE);
  });
  it('runs scans without network, read-only, non-root, with every capability dropped', () => {
    const joined = scanArgs.join(' ');
    expect(joined).toContain('--network none');
    expect(joined).toContain('--read-only');
    expect(joined).toContain('--user 1000:1000');
    expect(joined).toContain('--cap-drop ALL');
    expect(joined).toContain('no-new-privileges');
    expect(joined).toContain('readonly');
  });
});
