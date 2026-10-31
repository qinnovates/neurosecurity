/**
 * Pure half of scan-sources: parses ClamAV output, cross-checks the scanner's own
 * account against the per-file results, decides pass/fail, and builds the report.
 * No Docker, no filesystem, no clock reads by default, so every rule here is
 * unit-tested without a container.
 */
import os from 'node:os';
import { ScanOutputError } from './errors.mjs';

export const MAX_SIGNATURE_AGE_DAYS = 7;
export const CLAMSCAN_EXIT_CLEAN = 0;
export const CLAMSCAN_EXIT_INFECTED = 1;
export const CLAMSCAN_EXIT_ERROR = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FOUND_SUFFIX = ' FOUND';
const ERROR_SUFFIX = ' ERROR';

/** Replace mount points, target paths and any home directory so no host path or username reaches output. */
export function redactHostPaths(text, targets = []) {
  let redacted = String(text);
  for (const target of targets) {
    redacted = redacted.split(target.mountPoint).join(target.label).split(target.absolute).join(target.label);
  }
  return redacted.split(os.homedir()).join('~').replace(/\/(?:Users|home)\/[^/\s]+/g, '~');
}

/** Parse "ClamAV 1.5.4/28170/Sat Oct 31 06:24:42 2026". The container runs in UTC. */
export function parseVersionLine(text) {
  const match = /^ClamAV (\S+)\/(\d+)\/(.+)$/m.exec(text.trim());
  const date = match ? new Date(`${match[3].trim()} UTC`) : null;
  if (!match || Number.isNaN(date.getTime())) {
    throw new ScanOutputError(`Unrecognised "clamscan --version" output: ${JSON.stringify(text.slice(0, 120))}`);
  }
  return { engineVersion: match[1], databaseVersion: Number(match[2]), databaseDate: date.toISOString() };
}

export function classifyResult(rest) {
  if (rest === 'OK') return { status: 'clean' };
  if (rest === 'Empty file') return { status: 'empty' };
  if (rest === 'Symbolic link') return { status: 'skipped', detail: 'symbolic links are not followed' };
  if (rest.endsWith(FOUND_SUFFIX)) return { status: 'infected', detail: rest.slice(0, -FOUND_SUFFIX.length) };
  if (rest.endsWith(ERROR_SUFFIX)) return { status: 'error', detail: rest.slice(0, -ERROR_SUFFIX.length) };
  return { status: 'error', detail: `unrecognised clamscan result "${rest}"` };
}

/** Match "<path>: <result>" against known paths, since file names may themselves contain ": ". */
function splitResultLine(line, knownPaths) {
  for (let at = line.indexOf(': '); at !== -1; at = line.indexOf(': ', at + 1)) {
    if (knownPaths.has(line.slice(0, at))) return { containerPath: line.slice(0, at), rest: line.slice(at + 2) };
  }
  return null;
}

function recordSummaryField(fields, line) {
  const match = /^([^:]+): (.*)$/.exec(line);
  if (match) fields[match[1]] = match[2];
}

function recordResultLine(line, knownPaths, results, notes) {
  if (line === '') return;
  const hit = splitResultLine(line, knownPaths);
  if (!hit) {
    notes.push(line);
    return;
  }
  const result = results.has(hit.containerPath) ? { status: 'error', detail: 'reported more than once' } : classifyResult(hit.rest);
  results.set(hit.containerPath, result);
}

/** Split clamscan output into per-file results, unmatched lines (notes) and the summary block fields. */
export function parseScanOutput(stdout, knownPaths) {
  const results = new Map();
  const notes = [];
  const summaryFields = {};
  let inSummary = false;
  for (const line of stdout.split('\n')) {
    if (/^-+ SCAN SUMMARY -+$/.test(line)) inSummary = true;
    else if (inSummary) recordSummaryField(summaryFields, line);
    else recordResultLine(line, knownPaths, results, notes);
  }
  return { results, notes, summaryFields };
}

export function tallyStatuses(files) {
  const counts = { clean: 0, infected: 0, empty: 0, skipped: 0, error: 0 };
  for (const file of files) counts[file.status] += 1;
  return counts;
}

function exitCodeProblem(exitCode, counts) {
  if (exitCode === CLAMSCAN_EXIT_CLEAN && counts.infected > 0) return `clamscan exited 0 although ${counts.infected} file(s) were detected`;
  if (exitCode === CLAMSCAN_EXIT_INFECTED && counts.infected === 0) return 'clamscan exited 1 (detection) but no listed file was detected';
  if (exitCode === CLAMSCAN_EXIT_ERROR && counts.error === 0) return 'clamscan reported an error that is not tied to a listed file';
  return null;
}

/** Cross-check the scanner's own account against the per-file results; any disagreement fails the run. */
export function findIntegrityProblems({ counts, scan }) {
  const reportedScanned = Number.parseInt(scan.summaryFields['Scanned files'], 10);
  const reportedInfected = Number.parseInt(scan.summaryFields['Infected files'], 10);
  const matchedScanned = counts.clean + counts.infected;
  const problems = [exitCodeProblem(scan.exitCode, counts)];
  if (reportedScanned !== matchedScanned) problems.push(`clamscan counted ${reportedScanned} scanned files but ${matchedScanned} were matched to the file list`);
  if (reportedInfected !== counts.infected) problems.push(`clamscan counted ${reportedInfected} infected files but ${counts.infected} were matched to the file list`);
  if (scan.notes.some((line) => line.endsWith(FOUND_SUFFIX) || line.endsWith(ERROR_SUFFIX))) problems.push('clamscan reported a result for a path outside the file list');
  return problems.filter(Boolean);
}

export function evaluateFailures({ counts, databaseDate, integrityProblems }, now = new Date()) {
  const failures = [];
  const ageDays = (now.getTime() - new Date(databaseDate).getTime()) / MS_PER_DAY;
  if (counts.infected > 0) failures.push(`${counts.infected} infected file(s)`);
  if (counts.error + counts.skipped > 0) failures.push(`${counts.error + counts.skipped} file(s) could not be scanned`);
  if (ageDays > MAX_SIGNATURE_AGE_DAYS) failures.push(`signature database is ${ageDays.toFixed(1)} days old (limit ${MAX_SIGNATURE_AGE_DAYS})`);
  if (counts.clean + counts.infected === 0) failures.push('zero files were scanned');
  return [...failures, ...integrityProblems];
}

export function buildReport({ info, image, targets, files, scan, now = new Date() }) {
  const merged = files.map((file) => {
    const result = scan.results.get(file.containerPath) ?? { status: 'error', detail: 'not reported by clamscan; if the directory is outside $HOME, Colima does not share it with the VM' };
    return { path: file.displayPath, sha256: file.sha256, status: result.status, ...(result.detail ? { detail: redactHostPaths(result.detail, targets) } : {}) };
  });
  const counts = tallyStatuses(merged);
  const integrityProblems = findIntegrityProblems({ counts, scan });
  return {
    generated_at: now.toISOString(),
    engine_version: info.engineVersion,
    signature_database_version: info.databaseVersion,
    signature_database_date: info.databaseDate,
    image,
    targets: targets.map((target) => target.label),
    files_total: merged.length,
    files_scanned: counts.clean + counts.infected,
    infected_count: counts.infected,
    error_count: counts.error + counts.skipped,
    empty_count: counts.empty,
    failures: evaluateFailures({ counts, databaseDate: info.databaseDate, integrityProblems }, now),
    scanner_notes: scan.notes.map((line) => redactHostPaths(line, targets)),
    files: merged,
  };
}

export function formatReport(report) {
  const lines = [
    `ClamAV ${report.engine_version}, signature database ${report.signature_database_version} (${report.signature_database_date})`,
    `Targets: ${report.targets.join(', ')}`,
    `Files: ${report.files_total} listed, ${report.files_scanned} scanned, ${report.empty_count} empty, ${report.infected_count} infected, ${report.error_count} errors`,
    ...report.files.map((file) => `${file.status.padEnd(8)} ${file.sha256 ?? '-'.repeat(64)}  ${file.path}${file.detail ? `  [${file.detail}]` : ''}`),
    ...report.scanner_notes.map((note) => `note: ${note}`),
  ];
  return [...lines, report.failures.length === 0 ? 'RESULT: PASS (no known signature matched)' : `RESULT: FAIL - ${report.failures.join('; ')}`].join('\n');
}
