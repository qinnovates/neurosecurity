#!/usr/bin/env node
/**
 * Scans third-party data files for known malware with ClamAV inside a locked-down
 * container, and emits a path-safe summary that can sit beside the ingest evidence.
 *
 * Why this exists: the atlas ingest downloads archives and volumes from hosts we
 * do not control, and the assets built from them are committed to a public repo.
 * Nothing checked those bytes against known malware. The Homebrew ClamAV on the
 * host cannot refresh its signatures (OpenSSL X509 store failure), so the engine
 * runs from a pinned official image and the host never executes the scanner.
 *
 * Containment: the image is pinned by digest. The scan runs with --network none,
 * targets bind-mounted read-only, a read-only root filesystem, uid 1000, all
 * capabilities dropped, and the signatures in a named volume mounted read-only.
 * Only `update` has network, and it runs freshclam alone. Docker cannot filter
 * egress by hostname, so "mirrors only" holds because freshclam is the only
 * process and the image config names database.clamav.net; it is not a firewall
 * rule. freshclam verifies every database signature; nothing here disables that.
 *
 * Usage:
 *   node src/scripts/scan-sources.mjs update
 *   node src/scripts/scan-sources.mjs scan <dir...> [--json <file>]
 *
 * Exit 0: clean. Exit 1: a detection, a file that could not be scanned, signatures
 * older than 7 days, or zero files scanned. Exit 2: could not run at all (usage,
 * Docker down, image or signature volume missing).
 *
 * Limits: ClamAV matches known signatures. A clean result means "no known
 * signature matched", not "this file is safe". It cannot see novel malware, a
 * parser exploit with no signature, poisoned or biased data, a license problem,
 * or a malicious payload inside a format it does not unpack. Files over the
 * size limits or encrypted archives are reported as detections, not skipped.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readdir, realpath, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { DockerError, ScanOutputError, ScanTargetError, UpdateError, UsageError } from './scan-sources/errors.mjs';
import { acquireRuntime } from './scan-sources/runtime.mjs';
import {
  CLAMSCAN_EXIT_CLEAN, CLAMSCAN_EXIT_ERROR, CLAMSCAN_EXIT_INFECTED, buildReport, formatReport, parseScanOutput, parseVersionLine, redactHostPaths,
} from './scan-sources/report.mjs';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** clamav/clamav:1.5.4-debian (multi-arch index). Digest read from the Docker Hub API and matched to a local pull on 2026-10-31. */
export const CLAMAV_IMAGE = 'clamav/clamav@sha256:cce3e1a43ae2bb40e11335c52c0e1e98273b12fa3d587e617f63a6907cc4b70b';
export const SIGNATURE_VOLUME = 'qinnovate-clamav-db';
const DOCKER_BIN = 'docker';
const SIGNATURE_DIR = '/var/lib/clamav';
const SCAN_MOUNT_ROOT = '/scan';
const MAX_OUTPUT_BYTES = 256 * 1024 * 1024;
const EXIT_FAILED = 1;
const EXIT_UNABLE_TO_RUN = 2;
const UNSAFE_MOUNT_PATH = /[,:"\r\n\0]/;
const USAGE = 'Usage: scan-sources.mjs update | scan <dir...> [--json <file>]';
/**
 * Fail closed: oversize and encrypted content is reported, never silently passed. The caps sit
 * above the largest known-good ingest file (a 550 KB label volume that inflates to 530 MB), and
 * /tmp below has room for one such file to unpack.
 */
const CLAMSCAN_FLAGS = ['-r', '--stdout', '--alert-exceeds-max=yes', '--alert-encrypted=yes', '--max-filesize=1024M', '--max-scansize=2048M'];
const HARDENING_ARGS = [
  'run', '--rm', '--user', '1000:1000', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
  '--pids-limit', '256', '--env', 'TZ=UTC', '--tmpfs', '/tmp:rw,noexec,nosuid,size=1g',
];

function emit(text) {
  process.stdout.write(`${text}\n`);
}

async function dockerExec(args) {
  try {
    const { stdout, stderr } = await execFileAsync(DOCKER_BIN, args, { encoding: 'utf8', maxBuffer: MAX_OUTPUT_BYTES });
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    if (typeof error.code === 'number') {
      return { stdout: error.stdout ?? '', stderr: error.stderr ?? '', exitCode: error.code };
    }
    throw new DockerError(`Could not run "${DOCKER_BIN}" (${error.code ?? error.message}). Install the Docker CLI and put it on PATH.`, { cause: error });
  }
}

async function requireRuntime({ needsVolume }) {
  const daemon = await dockerExec(['info', '--format', '{{.ServerVersion}}']);
  if (daemon.exitCode !== 0) {
    throw new DockerError('The Docker daemon is not reachable. Start your Docker runtime, then rerun.');
  }
  const image = await dockerExec(['image', 'inspect', CLAMAV_IMAGE, '--format', '{{.Id}}']);
  if (image.exitCode !== 0) {
    throw new DockerError(`The pinned ClamAV image is not present locally. Fetch it once with: docker pull ${CLAMAV_IMAGE}`);
  }
  if (needsVolume && (await dockerExec(['volume', 'inspect', SIGNATURE_VOLUME])).exitCode !== 0) {
    throw new DockerError(`Signature volume "${SIGNATURE_VOLUME}" does not exist. Run the update command first.`);
  }
}

const signatureMount = (isReadonly) => ['--mount', `type=volume,source=${SIGNATURE_VOLUME},target=${SIGNATURE_DIR}${isReadonly ? ',readonly' : ''}`];
const targetMount = (target) => ['--mount', `type=bind,source=${target.absolute},target=${target.mountPoint},readonly`];

export function buildRunArgs({ network, mounts, entrypoint, toolArgs }) {
  return [...HARDENING_ARGS, '--network', network, ...mounts.flat(), '--entrypoint', entrypoint, CLAMAV_IMAGE, ...toolArgs];
}

async function runUpdate() {
  await requireRuntime({ needsVolume: false });
  await dockerExec(['volume', 'create', SIGNATURE_VOLUME]);
  const args = buildRunArgs({ network: 'bridge', mounts: [signatureMount(false)], entrypoint: 'freshclam', toolArgs: ['--stdout', '--log=/dev/null'] });
  const result = await dockerExec(args);
  emit(result.stdout.trimEnd());
  if (result.exitCode !== 0) {
    throw new UpdateError(`freshclam exited ${result.exitCode}: ${result.stderr.trim() || 'see output above'}. Signatures were not refreshed and no signature check was bypassed.`);
  }
  const info = await readSignatureInfo();
  emit(`Signature database ${info.databaseVersion} built ${info.databaseDate} (engine ${info.engineVersion})`);
  return 0;
}

async function readSignatureInfo() {
  const args = buildRunArgs({ network: 'none', mounts: [signatureMount(true)], entrypoint: 'clamscan', toolArgs: ['--version'] });
  const result = await dockerExec(args);
  if (result.exitCode !== 0) {
    throw new ScanOutputError(`Could not read the signature database version (exit ${result.exitCode}): ${redactHostPaths(result.stderr.trim())}`);
  }
  return parseVersionLine(result.stdout);
}

function relativeInside(base, candidate) {
  const relative = path.relative(base, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
  return relative === '' ? '.' : relative.split(path.sep).join('/');
}

/** Output label for a target: repo-relative, else "~/..." under home, else a neutral index. */
export function labelFor(canonical, index, { root = ROOT, home = os.homedir() } = {}) {
  const inRoot = relativeInside(root, canonical);
  if (inRoot !== null) return inRoot;
  const inHome = relativeInside(home, canonical);
  return inHome !== null ? `~/${inHome}` : `external-${index}`;
}

async function resolveTarget(input, index) {
  let canonical;
  try {
    canonical = await realpath(path.resolve(input));
    if (!(await lstat(canonical)).isDirectory()) throw new Error('not a directory');
  } catch (cause) {
    throw new ScanTargetError(`Scan target "${input}" is not a readable directory (${cause.code ?? cause.message}). Pass an existing directory.`, { cause });
  }
  if (UNSAFE_MOUNT_PATH.test(canonical)) {
    throw new ScanTargetError(`Scan target "${input}" contains a character (comma, colon, quote or line break) that cannot be passed safely to docker --mount. Rename the directory or scan a copy at a plain path.`);
  }
  return { absolute: canonical, label: labelFor(canonical, index), mountPoint: `${SCAN_MOUNT_ROOT}/${index}` };
}

async function collectEntries(directory, relativeDir = '') {
  const entries = [];
  for (const dirent of await readdir(path.join(directory, relativeDir), { withFileTypes: true })) {
    const relative = relativeDir === '' ? dirent.name : `${relativeDir}/${dirent.name}`;
    if (dirent.isDirectory()) entries.push(...await collectEntries(directory, relative));
    else entries.push({ relative, isRegular: dirent.isFile() });
  }
  return entries;
}

async function sha256File(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

async function describeTarget(target) {
  const entries = (await collectEntries(target.absolute)).sort((a, b) => (a.relative < b.relative ? -1 : Number(a.relative > b.relative)));
  const files = [];
  for (const { relative, isRegular } of entries) {
    files.push({
      containerPath: `${target.mountPoint}/${relative}`,
      displayPath: target.label === '.' ? relative : `${target.label}/${relative}`,
      sha256: isRegular ? await sha256File(path.join(target.absolute, relative)) : null,
    });
  }
  return files;
}

async function executeScan(targets, files) {
  const args = buildRunArgs({ network: 'none', mounts: [signatureMount(true), ...targets.map(targetMount)], entrypoint: 'clamscan', toolArgs: [...CLAMSCAN_FLAGS, ...targets.map((t) => t.mountPoint)] });
  const { stdout, stderr, exitCode } = await dockerExec(args);
  const parsed = parseScanOutput(stdout, new Set(files.map((file) => file.containerPath)));
  if (![CLAMSCAN_EXIT_CLEAN, CLAMSCAN_EXIT_INFECTED, CLAMSCAN_EXIT_ERROR].includes(exitCode) || !('Scanned files' in parsed.summaryFields)) {
    const detail = redactHostPaths(`${stderr.trim()} ${parsed.notes.slice(-3).join(' | ')}`, targets).trim();
    throw new ScanOutputError(`clamscan did not finish (exit ${exitCode}): ${detail}. Colima shares only $HOME with the VM, so scan targets must live under it.`);
  }
  return { ...parsed, exitCode };
}

async function runScan({ directories, jsonPath }) {
  await requireRuntime({ needsVolume: true });
  const targets = await Promise.all(directories.map(resolveTarget));
  const files = (await Promise.all(targets.map(describeTarget))).flat();
  const info = await readSignatureInfo();
  const scan = await executeScan(targets, files);
  const report = buildReport({ info, image: CLAMAV_IMAGE, targets, files, scan });
  emit(formatReport(report));
  if (jsonPath) await writeFile(path.resolve(jsonPath), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o644 });
  return report.failures.length === 0 ? 0 : EXIT_FAILED;
}

export function parseArguments(argv) {
  const [name, ...rest] = argv;
  if (name === 'update' && rest.length === 0) return { name };
  if (name !== 'scan') throw new UsageError(USAGE);
  const directories = [];
  let jsonPath = null;
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === '--json') {
      jsonPath = rest[i + 1];
      i += 1;
      if (!jsonPath || jsonPath.startsWith('--')) throw new UsageError(`--json needs a file path. ${USAGE}`);
    } else if (rest[i].startsWith('--')) {
      throw new UsageError(`Unknown option "${rest[i]}". ${USAGE}`);
    } else {
      directories.push(rest[i]);
    }
  }
  if (directories.length === 0) throw new UsageError(`scan needs at least one directory. ${USAGE}`);
  return { name, directories, jsonPath };
}

async function isDaemonUp() {
  return (await dockerExec(['info', '--format', '{{.ServerVersion}}'])).exitCode === 0;
}

async function main(argv) {
  let runtime = null;
  try {
    const command = parseArguments(argv);
    runtime = await acquireRuntime({
      isDaemonUp,
      keepRuntime: process.env.SCAN_KEEP_RUNTIME === '1',
      log: (message) => process.stderr.write(`${message}\n`),
    });
    process.exitCode = command.name === 'update' ? await runUpdate() : await runScan(command);
  } catch (error) {
    process.stderr.write(`scan-sources: ${error.name}: ${redactHostPaths(error.message)}\n`);
    process.exitCode = EXIT_UNABLE_TO_RUN;
  } finally {
    if (runtime) await runtime.release();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main(process.argv.slice(2));
