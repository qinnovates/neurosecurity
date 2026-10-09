/**
 * A bundled anatomy data file is malformed. Thrown at build time so a bad file
 * fails the build. The message says which file, where in it, what is wrong and
 * what to do about it.
 */
export class AnatomyDataError extends Error {
  readonly dataFile: string;
  readonly location: string;

  constructor(dataFile: string, location: string, problem: string, remedy: string) {
    super(`${dataFile}: ${location}: ${problem}. ${remedy} The build stops here so bad anatomy data never ships.`);
    this.name = 'AnatomyDataError';
    this.dataFile = dataFile;
    this.location = location;
  }
}
