// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { SEQUENCE_STEP_MS, useSequencePlayback } from '../motion/use-sequence-playback';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); cleanup(); });

describe('useSequencePlayback', () => {
  it('starts with every step shown, so the still picture is complete', () => {
    const { result } = renderHook(() => useSequencePlayback(4));
    expect(result.current).toMatchObject({ reached: 4, isPlaying: false });
  });

  it('plays from the start in order, stops at the end, and never loops', () => {
    const { result } = renderHook(() => useSequencePlayback(3));
    act(() => result.current.play());
    expect(result.current).toMatchObject({ reached: 0, isPlaying: true });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.reached).toBe(1);
    act(() => { vi.advanceTimersByTime(SEQUENCE_STEP_MS); });
    act(() => { vi.advanceTimersByTime(SEQUENCE_STEP_MS); });
    expect(result.current.reached).toBe(3);
    act(() => { vi.advanceTimersByTime(SEQUENCE_STEP_MS * 3); });
    expect(result.current).toMatchObject({ reached: 3, isPlaying: false });
  });

  it('steps one at a time in both directions and pauses when stepped', () => {
    const { result } = renderHook(() => useSequencePlayback(3));
    act(() => result.current.stepForward());
    expect(result.current.reached).toBe(1);
    act(() => result.current.stepForward());
    act(() => result.current.stepBack());
    expect(result.current).toMatchObject({ reached: 1, isPlaying: false });
    act(() => result.current.stepBack());
    expect(result.current.reached).toBe(1);
    act(() => result.current.showAll());
    expect(result.current.reached).toBe(3);
  });

  it('starts over from the whole picture when the sequence changes', () => {
    const { result, rerender } = renderHook(({ count }) => useSequencePlayback(count), { initialProps: { count: 3 } });
    act(() => result.current.stepForward());
    rerender({ count: 5 });
    expect(result.current).toMatchObject({ reached: 5, isPlaying: false });
  });
});
