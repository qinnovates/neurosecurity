/** An imported device model file was rejected. The message is safe to show to the user. */
export class DeviceModelFormatError extends Error {
  constructor(message: string) {
    super(`The model file could not be loaded: ${message}`);
    this.name = 'DeviceModelFormatError';
  }
}

/** A bundled reference data file is malformed. Thrown at build time so a bad file fails the build. */
export class ThreatModelDataError extends Error {
  constructor(dataFile: string, message: string) {
    super(`${dataFile}: ${message}. Fix the data file; the build stops here so bad data never ships.`);
    this.name = 'ThreatModelDataError';
  }
}
