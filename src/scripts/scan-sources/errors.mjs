/** Typed errors for scan-sources. Each message says what failed and what the caller should do. */
export class ScanSourcesError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = new.target.name;
  }
}
export class UsageError extends ScanSourcesError {}
export class DockerError extends ScanSourcesError {}
export class ScanTargetError extends ScanSourcesError {}
export class ScanOutputError extends ScanSourcesError {}
export class UpdateError extends ScanSourcesError {}
