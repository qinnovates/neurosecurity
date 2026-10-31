/**
 * Container runtime lifecycle for scan-sources.
 *
 * If the Docker daemon is already up, nothing is started and nothing is stopped: the VM belongs to
 * whoever started it. If it is down and Colima is installed, this starts Colima for the run and
 * stops it afterwards, so a scan never leaves a virtual machine consuming memory. Set
 * SCAN_KEEP_RUNTIME=1 to leave a Colima that this run started in place.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DockerError } from './errors.mjs';

const execFileAsync = promisify(execFile);
const COLIMA_BIN = 'colima';
const COLIMA_START_ARGS = ['start', '--cpu', '2', '--memory', '4'];
const COLIMA_START_TIMEOUT_MS = 5 * 60 * 1000;
const COLIMA_STOP_TIMEOUT_MS = 2 * 60 * 1000;
const NOOP_RUNTIME = { startedByUs: false, release: async () => {} };

async function defaultExec(file, args, timeoutMs) {
  try {
    await execFileAsync(file, args, { encoding: 'utf8', timeout: timeoutMs });
    return { exitCode: 0, isMissing: false };
  } catch (error) {
    return { exitCode: typeof error.code === 'number' ? error.code : 1, isMissing: error.code === 'ENOENT' };
  }
}

async function stopColima({ exec, log }) {
  const stopped = await exec(COLIMA_BIN, ['stop'], COLIMA_STOP_TIMEOUT_MS);
  log(stopped.exitCode === 0 ? 'scan-sources: stopped Colima' : 'scan-sources: WARNING could not stop Colima; run "colima stop"');
}

function startFailure(started) {
  return new DockerError(started.isMissing
    ? 'The Docker daemon is not reachable and Colima is not installed. Start your Docker runtime, then rerun.'
    : 'Colima failed to start. Run "colima start --cpu 2 --memory 4" to see why, then rerun.');
}

/** Returns { startedByUs, release }. Always await release() in a finally block. */
export async function acquireRuntime({ isDaemonUp, exec = defaultExec, keepRuntime = false, log = () => {} }) {
  if (await isDaemonUp()) return NOOP_RUNTIME;
  const started = await exec(COLIMA_BIN, COLIMA_START_ARGS, COLIMA_START_TIMEOUT_MS);
  if (started.exitCode !== 0) throw startFailure(started);
  log('scan-sources: started Colima for this run');
  if (!(await isDaemonUp())) {
    await stopColima({ exec, log });
    throw new DockerError('Colima started but the Docker daemon is still unreachable.');
  }
  return {
    startedByUs: true,
    release: async () => (keepRuntime ? log('scan-sources: leaving Colima running (SCAN_KEEP_RUNTIME=1)') : stopColima({ exec, log })),
  };
}
