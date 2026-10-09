/**
 * What every datalake command-line script shares: where the datalake is, and
 * how to run as a command without running when a test imports the module.
 */

import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATALAKE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Whether the module at `moduleUrl` is the script at `invokedPath` (normally
 * process.argv[1]). Both sides are compared as real paths: Node reports a
 * module by its real path but argv by the path that was typed, so a script
 * reached through a symlink would otherwise look imported and do nothing.
 */
export function isInvokedScript(moduleUrl, invokedPath) {
  if (invokedPath === undefined) return false;
  return realpathSync(invokedPath) === realpathSync(fileURLToPath(moduleUrl));
}

/**
 * Runs `run` only when the module at `moduleUrl` is the script Node was started
 * with. A thrown error becomes one labelled line on stderr and exit code 1.
 */
export function runAsCli(moduleUrl, label, run) {
  if (!isInvokedScript(moduleUrl, process.argv[1])) return;
  try {
    run();
  } catch (error) {
    process.stderr.write(`[${label}] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
