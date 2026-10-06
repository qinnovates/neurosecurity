// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SignalBench from '../signal-bench/SignalBench';
import { drawSignalBench } from '../signal-bench/signal-bench-renderer';
import type { SignalBenchEvent } from '../signal-bench/signal-bench-events';

vi.mock('../signal-bench/signal-bench-renderer', () => ({ drawSignalBench: vi.fn() }));

const EVENTS: SignalBenchEvent[] = [
  { kind: 'inject', id: 'QIF-T0001', name: 'Signal injection', status: 'CONFIRMED', nissScore: 6.1, severity: 'medium' },
  { kind: 'replay', id: 'QIF-T0107', name: 'Neural nonce replay', status: 'THEORETICAL', nissScore: 5.4, severity: 'medium' },
];

class ObserverStub {
  constructor(private readonly callback: (entries: { isIntersecting: boolean }[]) => void) {}
  observe() {
    this.callback([{ isIntersecting: true }]);
  }
  disconnect() {}
}

function stubBrowser(prefersReducedMotion: boolean) {
  vi.stubGlobal('IntersectionObserver', ObserverStub);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', () => ({ matches: prefersReducedMotion, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ setTransform() {} } as unknown as CanvasRenderingContext2D);
}

beforeEach(() => vi.mocked(drawSignalBench).mockClear());

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SignalBench', () => {
  it('labels the readout from the catalog entry and links to its page', () => {
    stubBrowser(false);
    render(<SignalBench events={EVENTS} />);
    expect(screen.getByRole('link', { name: 'QIF-T0001' }).getAttribute('href')).toBe('/atlas/tara/QIF-T0001/');
    expect(screen.getByText('Signal injection')).toBeDefined();
    expect(screen.getByText(/not recorded neural data/)).toBeDefined();
  });

  it('animates when motion is allowed and the strip is on screen', () => {
    stubBrowser(false);
    render(<SignalBench events={EVENTS} />);
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('draws a single static frame and never schedules animation under reduced motion', () => {
    stubBrowser(true);
    render(<SignalBench events={EVENTS} />);
    expect(drawSignalBench).toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('renders nothing without events', () => {
    stubBrowser(false);
    const { container } = render(<SignalBench events={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
