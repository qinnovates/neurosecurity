/**
 * What every datalake command-line script shares: where the datalake is, and
 * how to run as a command without running when a test imports the module.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATALAKE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Runs `run` only when the module at `moduleUrl` is the script Node was started
 * with. A thrown error becomes one labelled line on stderr and exit code 1.
 */
export function runAsCli(moduleUrl, label, run) {
  const isRunDirectly = process.argv[1] !== undefined
    && path.resolve(process.argv[1]) === fileURLToPath(moduleUrl);
  if (!isRunDirectly) return;
  try {
    run();
  } catch (error) {
    process.stderr.write(`[${label}] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
