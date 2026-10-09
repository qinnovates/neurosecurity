// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { act, render, screen, cleanup, fireEvent } from '@testing-library/react';
import { fingerprintText } from '../text-fingerprint';
import { ViewStateProvider, useViewState } from '../ViewStateContext';
import { createViewStateStore, matchesShape, parseStoredViewState } from '../view-state-store';

const STORAGE_KEY = 'tara-lab:view-state:v1';

beforeEach(() => window.sessionStorage.clear());
afterEach(cleanup);

function Counter({ viewKey = 'explore/test/count' }: { viewKey?: string }) {
  const [count, setCount] = useViewState(viewKey, 0);
  return <button type="button" onClick={() => setCount((previous) => previous + 1)}>count {count}</button>;
}

describe('view state store', () => {
  it('holds values, removes them, and clears by prefix', () => {
    const store = createViewStateStore(null);
    store.write('model/lens', { partId: 'p1' });
    store.write('model/sort', 'severity');
    store.write('explore/catalog/layout', 'table');
    expect(store.read('model/sort')).toBe('severity');
    store.clearPrefix('model/');
    expect(store.read('model/lens')).toBeUndefined();
    expect(store.read('model/sort')).toBeUndefined();
    expect(store.read('explore/catalog/layout')).toBe('table');
    store.write('explore/catalog/layout', undefined);
    expect(store.read('explore/catalog/layout')).toBeUndefined();
  });

  it('tells subscribers about a change and not about a write of the same value', () => {
    const store = createViewStateStore(null);
    let calls = 0;
    const unsubscribe = store.subscribe(() => { calls += 1; });
    store.write('explore/a', 1);
    store.write('explore/a', 1);
    expect(calls).toBe(1);
    unsubscribe();
    store.write('explore/a', 2);
    expect(calls).toBe(1);
  });

  it('refuses a malformed key', () => {
    const store = createViewStateStore(null);
    expect(() => store.write('__proto__', 1)).toThrow(/not valid/);
    expect(() => store.write('Model/Lens', 1)).toThrow(/not valid/);
  });

  it('mirrors to session storage and reads it back in a new store', () => {
    createViewStateStore(window.sessionStorage).write('explore/catalog/search', 'bluetooth');
    expect(JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ 'explore/catalog/search': 'bluetooth' });
    expect(createViewStateStore(window.sessionStorage).read('explore/catalog/search')).toBe('bluetooth');
  });

  it('keeps working when storage refuses to write', () => {
    const refusing = { getItem: () => null, setItem: () => { throw new Error('quota'); } } as unknown as Storage;
    const store = createViewStateStore(refusing);
    store.write('explore/a', 1);
    expect(store.read('explore/a')).toBe(1);
  });
});

describe('parseStoredViewState', () => {
  it('yields nothing for text that is missing, not JSON, not an object, or too large', () => {
    for (const text of [null, 'not json', '[1,2]', '"text"', 'null', `{"explore/a":"${'x'.repeat(200_001)}"}`]) {
      expect(parseStoredViewState(text).size).toBe(0);
    }
  });

  it('drops malformed keys and keeps the rest', () => {
    const entries = parseStoredViewState(JSON.stringify({ 'explore/a': 1, '__proto__x': 2, 'Bad Key': 3, constructor: 4, 'model/b': null }));
    expect([...entries.keys()].sort()).toEqual(['constructor', 'explore/a']);
    expect(Object.getPrototypeOf(entries)).toBe(Map.prototype);
  });
});

describe('matchesShape', () => {
  it('accepts the same primitive type and rejects another', () => {
    expect(matchesShape('severity', '')).toBe(true);
    expect(matchesShape(3, 0)).toBe(true);
    expect(matchesShape('3', 0)).toBe(false);
    expect(matchesShape(Number.NaN, 0)).toBe(false);
    expect(matchesShape('x'.repeat(2_001), '')).toBe(false);
  });

  it('accepts null or one primitive where the sample is null', () => {
    expect(matchesShape(null, null)).toBe(true);
    expect(matchesShape('QIF-T0001', null)).toBe(true);
    expect(matchesShape({ id: 'x' }, null)).toBe(false);
  });

  it('checks objects field by field and lists item by item', () => {
    const sample = { partId: null, severities: [], isOpenOnly: false };
    expect(matchesShape({ partId: 'p1', severities: ['critical'], isOpenOnly: true }, sample)).toBe(true);
    expect(matchesShape({ partId: 'p1', severities: [{ nested: true }], isOpenOnly: true }, sample)).toBe(false);
    expect(matchesShape({ partId: 'p1', severities: [] }, sample)).toBe(false);
    expect(matchesShape({ partId: 'p1', severities: [], isOpenOnly: true, extra: 1 }, sample)).toBe(false);
    expect(matchesShape([], sample)).toBe(false);
  });
});

describe('useViewState', () => {
  it('keeps a value while the component that set it is unmounted', () => {
    const store = createViewStateStore(null);
    const first = render(<ViewStateProvider store={store}><Counter /></ViewStateProvider>);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    first.unmount();
    render(<ViewStateProvider store={store}><Counter /></ViewStateProvider>);
    expect(screen.getByRole('button').textContent).toBe('count 2');
  });

  it('returns to the initial value when the key is cleared', () => {
    const store = createViewStateStore(null);
    render(<ViewStateProvider store={store}><Counter viewKey="model/test/count" /></ViewStateProvider>);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button').textContent).toBe('count 1');
    act(() => store.clearPrefix('model/'));
    expect(screen.getByRole('button').textContent).toBe('count 0');
  });

  it('falls back to the initial value when the stored copy is corrupt or the wrong shape', () => {
    window.sessionStorage.setItem(STORAGE_KEY, '{"explore/test/count": "<img src=x onerror=alert(1)>"}');
    const wrongShape = render(<ViewStateProvider store={createViewStateStore(window.sessionStorage)}><Counter /></ViewStateProvider>);
    expect(screen.getByRole('button').textContent).toBe('count 0');
    wrongShape.unmount();
    window.sessionStorage.setItem(STORAGE_KEY, '{not json');
    render(<ViewStateProvider store={createViewStateStore(window.sessionStorage)}><Counter /></ViewStateProvider>);
    expect(screen.getByRole('button').textContent).toBe('count 0');
  });

  it('uses the caller\'s validator when one is given', () => {
    const isKnownLayout = (value: unknown): value is 'table' | 'matrix' => value === 'table' || value === 'matrix';
    function Layout() {
      const [layout] = useViewState<'table' | 'matrix'>('explore/test/layout', 'table', isKnownLayout);
      return <p>{layout}</p>;
    }
    const store = createViewStateStore(null);
    store.write('explore/test/layout', 'cards');
    render(<ViewStateProvider store={store}><Layout /></ViewStateProvider>);
    expect(screen.getByText('table')).toBeTruthy();
    act(() => store.write('explore/test/layout', 'matrix'));
    expect(screen.getByText('matrix')).toBeTruthy();
  });

  it('behaves as plain state outside the shell', () => {
    render(<Counter />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button').textContent).toBe('count 1');
  });
});

describe('fingerprintText', () => {
  it('is the same for the same text and different for a one-character change', () => {
    expect(fingerprintText('{"name":"Headset"}')).toBe(fingerprintText('{"name":"Headset"}'));
    expect(fingerprintText('{"name":"Headset"}')).not.toBe(fingerprintText('{"name":"Headseu"}'));
    expect(fingerprintText('')).toMatch(/^[0-9a-f]{16}$/);
  });
});
