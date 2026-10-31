import { describe, expect, it } from 'vitest';
import { comparePolicies, findMissingHeaders } from '../check-live-headers.mjs';

const REPOSITORY = ["default-src 'self'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'", "connect-src 'self'"];

describe('comparePolicies', () => {
  it('reports a source the live policy adds, and nothing for an equal policy', () => {
    expect(comparePolicies(REPOSITORY.join('; '), REPOSITORY)).toEqual({ looser: [], stricter: [] });
    const { looser } = comparePolicies("default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.net", REPOSITORY);
    expect(looser).toEqual(['script-src allows https://cdn.example.net, which the repository policy does not']);
  });

  it('reports a source the live policy lacks as stricter, not looser', () => {
    const { looser, stricter } = comparePolicies("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'", REPOSITORY);
    expect(looser).toEqual([]);
    expect(stricter).toEqual(["script-src lacks 'unsafe-inline', which the repository policy lists, so anything needing it will not run"]);
  });

  it('judges a directive the repository does not state against its default-src, and lets frame-ancestors tighten', () => {
    expect(comparePolicies("default-src 'self'; worker-src 'self' blob:", REPOSITORY).looser).toEqual(['worker-src allows blob:, which the repository policy does not']);
    expect(comparePolicies("default-src 'self'; frame-ancestors 'none'", REPOSITORY).looser).toEqual([]);
  });
});

describe('findMissingHeaders', () => {
  const complete = {
    'content-security-policy': "default-src 'self'", 'x-content-type-options': 'nosniff', 'strict-transport-security': 'max-age=31536000',
    'referrer-policy': 'strict-origin-when-cross-origin', 'x-frame-options': 'DENY',
  };

  it('accepts a complete baseline', () => {
    expect(findMissingHeaders(new Headers(complete))).toEqual([]);
  });

  it('names each missing or weak header', () => {
    const weak = { ...complete, 'strict-transport-security': 'max-age=60' };
    delete weak['x-frame-options'];
    expect(findMissingHeaders(new Headers(weak))).toEqual([
      'the live response lacks Strict-Transport-Security with a max-age of at least a year',
      'the live response lacks X-Frame-Options: DENY or SAMEORIGIN',
    ]);
  });
});
