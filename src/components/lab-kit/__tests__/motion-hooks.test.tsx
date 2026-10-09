// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, cleanup, render, renderHook, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { CHANGED_FLAG_MS } from '../motion/motion-tokens';
import { useCountTransition } from '../motion/use-count-transition';
import { useLinkedHighlight, type LinkedHighlight } from '../motion/use-linked-highlight';
import { useViewTransition } from '../motion/use-view-transition';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function stubReducedMotion(isReduced: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: isReduced && query.includes('prefers-reduced-motion'), addEventListener: () => undefined, removeEventListener: () => undefined }));
}

describe('useCountTransition', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('shows the first value as it is, unflagged', () => {
    const { result } = renderHook(() => useCountTransition(52));
    expect(result.current).toEqual({ value: 52, hasChanged: false });
  });

  it('swaps to the new value at once and never shows a value in between', () => {
    const seen: number[] = [];
    const { rerender } = renderHook(({ count }) => { const { value } = useCountTransition(count); seen.push(value); return value; }, { initialProps: { count: 52 } });
    rerender({ count: 36 });
    act(() => { vi.advanceTimersByTime(CHANGED_FLAG_MS * 2); });
    expect(new Set(seen)).toEqual(new Set([52, 36]));
  });

  it('flags the change for a moment, then clears', () => {
    const { result, rerender } = renderHook(({ count }) => useCountTransition(count), { initialProps: { count: 52 } });
    rerender({ count: 36 });
    expect(result.current).toEqual({ value: 36, hasChanged: true });
    act(() => { vi.advanceTimersByTime(CHANGED_FLAG_MS - 1); });
    expect(result.current.hasChanged).toBe(true);
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.hasChanged).toBe(false);
  });

  it('does not flag a re-render with the same value', () => {
    const { result, rerender } = renderHook(({ count }) => useCountTransition(count), { initialProps: { count: 7 } });
    rerender({ count: 7 });
    expect(result.current.hasChanged).toBe(false);
  });
});

function ViewSwitch() {
  const [view, setView] = useState('risks');
  const transition = useViewTransition();
  return <button type="button" onClick={() => transition(() => setView('report'))}>{view}</button>;
}

describe('useViewTransition', () => {
  afterEach(() => { Reflect.deleteProperty(document, 'startViewTransition'); });

  it('applies the update with no animation where the browser has no view transitions', () => {
    render(<ViewSwitch />);
    fireEvent.click(screen.getByRole('button', { name: 'risks' }));
    expect(screen.getByRole('button').textContent).toBe('report');
  });

  it('runs the update inside one view transition where the browser has them', () => {
    const startViewTransition = vi.fn((update: () => void) => { update(); return { ready: Promise.resolve() }; });
    Object.defineProperty(document, 'startViewTransition', { value: startViewTransition, configurable: true });
    render(<ViewSwitch />);
    fireEvent.click(screen.getByRole('button', { name: 'risks' }));
    expect(startViewTransition).toHaveBeenCalledOnce();
    expect(screen.getByRole('button').textContent).toBe('report');
  });

  it('still applies the update, and raises no error, when the browser skips the transition', async () => {
    const ready = Promise.reject(new Error('Transition was skipped'));
    const startViewTransition = vi.fn((update: () => void) => { update(); return { ready }; });
    Object.defineProperty(document, 'startViewTransition', { value: startViewTransition, configurable: true });
    render(<ViewSwitch />);
    fireEvent.click(screen.getByRole('button', { name: 'risks' }));
    await expect(ready).rejects.toThrow('skipped');
    expect(screen.getByRole('button').textContent).toBe('report');
  });

  it('skips the transition when the viewer asked for less motion, and still applies the update', () => {
    stubReducedMotion(true);
    const startViewTransition = vi.fn();
    Object.defineProperty(document, 'startViewTransition', { value: startViewTransition, configurable: true });
    render(<ViewSwitch />);
    fireEvent.click(screen.getByRole('button', { name: 'risks' }));
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(screen.getByRole('button').textContent).toBe('report');
  });
});

function Part({ highlight }: { highlight: LinkedHighlight }) {
  return <button type="button" {...highlight.bind('headset')}>EEG headset</button>;
}
function Row({ highlight }: { highlight: LinkedHighlight }) {
  return <p tabIndex={0} {...highlight.bind('headset')}>Risk on the headset</p>;
}
function LinkedViews() {
  const highlight = useLinkedHighlight();
  return <><Part highlight={highlight} /><Row highlight={highlight} /><p {...highlight.bind('phone')}>Risk on the phone</p><output>{highlight.litKey ?? 'none'}</output></>;
}

describe('useLinkedHighlight', () => {
  it('lights the same item in both views when either is pointed at, and nothing else', () => {
    render(<LinkedViews />);
    const part = screen.getByRole('button', { name: 'EEG headset' });
    const row = screen.getByText('Risk on the headset');
    fireEvent.pointerEnter(part);
    expect([part, row, screen.getByText('Risk on the phone')].map((element) => element.getAttribute('data-lit'))).toEqual(['true', 'true', 'false']);
    fireEvent.pointerLeave(part);
    expect(row.getAttribute('data-lit')).toBe('false');
  });

  it('follows keyboard focus the same way, in the other direction', () => {
    render(<LinkedViews />);
    const row = screen.getByText('Risk on the headset');
    fireEvent.focus(row);
    expect(screen.getByRole('button', { name: 'EEG headset' }).getAttribute('data-lit')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('headset');
    fireEvent.blur(row);
    expect(screen.getByRole('status').textContent).toBe('none');
  });

  it('does not let a late leave from one item dim another that is now lit', () => {
    render(<LinkedViews />);
    const part = screen.getByRole('button', { name: 'EEG headset' });
    const phone = screen.getByText('Risk on the phone');
    fireEvent.pointerEnter(part);
    fireEvent.pointerEnter(phone);
    fireEvent.pointerLeave(part);
    expect(phone.getAttribute('data-lit')).toBe('true');
  });
});
