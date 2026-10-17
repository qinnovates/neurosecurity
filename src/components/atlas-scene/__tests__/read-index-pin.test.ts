// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import { INDEX_PIN_ATTRIBUTE, parseIndexPin, readIndexPin } from '../read-index-pin';

const PIN = { path: ANATOMY_INDEX_PATH, bytes: 1234, sha256: 'a'.repeat(64) };

describe('the index pin a page carries', () => {
  it('reads the pin the page was built with', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div hidden></div>';
    root.firstElementChild?.setAttribute(INDEX_PIN_ATTRIBUTE, JSON.stringify(PIN));
    expect(readIndexPin(root)).toEqual(PIN);
  });

  it('is null on a page that carries none, so the view says the page is unpinned', () => {
    expect(readIndexPin(document.createElement('div'))).toBeNull();
  });

  it.each([
    ['text that is not JSON', 'not json'],
    ['a list', '[]'],
    ['another file\'s path', JSON.stringify({ ...PIN, path: '/atlas/other.json' })],
    ['a path on another site', JSON.stringify({ ...PIN, path: `https://example.org${ANATOMY_INDEX_PATH}` })],
    ['a length that is not a whole number', JSON.stringify({ ...PIN, bytes: 1.5 })],
    ['no length', JSON.stringify({ path: PIN.path, sha256: PIN.sha256 })],
    ['a digest of the wrong form', JSON.stringify({ ...PIN, sha256: 'ABC' })],
  ])('refuses %s', (_case, text) => {
    expect(parseIndexPin(text)).toBeNull();
  });

  it('keeps only the three values of a pin', () => {
    expect(parseIndexPin(JSON.stringify({ ...PIN, extra: 'x' }))).toEqual(PIN);
  });
});
