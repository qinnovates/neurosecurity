// @vitest-environment jsdom
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useRowFlip } from '../use-row-flip';

/** Each row sits 40 px below the one before, so dropping the first row moves the others up by 40 px. */
function List({ ids, animate }: { ids: string[]; animate: (element: HTMLElement) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  useRowFlip(ref, ids.join(' '));
  return (
    <ul ref={ref}>
      {ids.map((id, position) => (
        <li
          key={id} data-row-id={id}
          ref={(element) => {
            if (element === null) return;
            element.getBoundingClientRect = () => ({ top: position * 40 }) as DOMRect;
            element.animate = (() => { animate(element); return {} as Animation; }) as HTMLElement['animate'];
          }}
        />
      ))}
    </ul>
  );
}
const stubMotionPreference = (prefersLess: boolean): void => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: prefersLess && query === '(prefers-reduced-motion: reduce)' }));
};
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('useRowFlip', () => {
  it('slides the rows that stay when the list changes', () => {
    stubMotionPreference(false);
    const animate = vi.fn();
    const { rerender } = render(<List ids={['a', 'b', 'c']} animate={animate} />);
    expect(animate).not.toHaveBeenCalled();
    rerender(<List ids={['b', 'c']} animate={animate} />);
    expect(animate.mock.calls.map(([element]) => (element as HTMLElement).dataset.rowId)).toEqual(['b', 'c']);
  });

  it('moves nothing when the visitor asks for less motion', () => {
    stubMotionPreference(true);
    const animate = vi.fn();
    const { rerender } = render(<List ids={['a', 'b', 'c']} animate={animate} />);
    rerender(<List ids={['b', 'c']} animate={animate} />);
    expect(animate).not.toHaveBeenCalled();
  });

  it('does not animate when the same rows are drawn again', () => {
    stubMotionPreference(false);
    const animate = vi.fn();
    const { rerender } = render(<List ids={['a', 'b']} animate={animate} />);
    rerender(<List ids={['a', 'b']} animate={animate} />);
    expect(animate).not.toHaveBeenCalled();
  });
});
