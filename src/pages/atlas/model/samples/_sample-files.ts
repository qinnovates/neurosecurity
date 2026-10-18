/**
 * The synthetic signal samples the Lab's Monitor plays, read from the repository at build
 * time and served under the Lab's own route with neutral names. Only the order of the source
 * list is used: no name or description written beside a sample is passed on.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Where the sample files are kept in the repository, beside the older static page that first shipped them. */
const SOURCE_DIRECTORY = 'src/site/brain-siem/data';
const SOURCE_LIST_FILE = 'manifest.json';
/** A source file may only be a plain name in the source folder, never a path. */
const SOURCE_FILE_PATTERN = /^[a-z0-9_]+\.csv$/;
const SERVED_NAME_DIGITS = 2;
export const SERVED_EXTENSION = '.csv';

export class SampleSourceError extends Error {
  constructor(detail: string) {
    super(`The signal samples could not be prepared: ${detail}. Check the sample folder and its list file.`);
    this.name = 'SampleSourceError';
  }
}

export interface ServedSample {
  /** The neutral name the Lab requests, for example "sample-01.csv". */
  servedName: string;
  /** The file in the repository it is read from. */
  sourcePath: string;
}

function servedNameFor(position: number): string {
  return `sample-${String(position + 1).padStart(SERVED_NAME_DIGITS, '0')}${SERVED_EXTENSION}`;
}

function readSourceFileNames(): string[] {
  const listPath = path.resolve(SOURCE_DIRECTORY, SOURCE_LIST_FILE);
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(listPath, 'utf-8'));
  } catch (error) {
    throw new SampleSourceError(`the list file could not be read (${error instanceof Error ? error.message : String(error)})`);
  }
  const datasets = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>).datasets : undefined;
  if (!Array.isArray(datasets)) throw new SampleSourceError('the list file has no list of samples');
  return datasets.map((entry: unknown, position) => {
    const file = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>).file : undefined;
    if (typeof file !== 'string' || !SOURCE_FILE_PATTERN.test(file)) throw new SampleSourceError(`entry ${position + 1} of the list file does not name a plain CSV file`);
    return file;
  });
}

/** Every sample in the order the source list gives them. @throws SampleSourceError */
export function listServedSamples(): ServedSample[] {
  return readSourceFileNames().map((file, position) => ({ servedName: servedNameFor(position), sourcePath: path.resolve(SOURCE_DIRECTORY, file) }));
}

/** The text of one sample by its served name. @throws SampleSourceError when the name is not one the list serves */
export function readServedSample(servedName: string): string {
  const sample = listServedSamples().find((candidate) => candidate.servedName === servedName);
  if (sample === undefined) throw new SampleSourceError(`"${servedName}" is not a served sample`);
  try {
    return fs.readFileSync(sample.sourcePath, 'utf-8');
  } catch (error) {
    throw new SampleSourceError(`${servedName} could not be read (${error instanceof Error ? error.message : String(error)})`);
  }
}
