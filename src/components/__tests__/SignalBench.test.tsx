// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import SignalBench from '../signal-bench/SignalBench';
import { drawSignalBench } from '../signal-bench/signal-bench-renderer';
import { getFinalFrameTime } from '../signal-bench/signal-model';
import type { SignalBenchEvent } from '../signal-bench/signal-bench-events';

vi.mock('../signal-bench/signal-bench-renderer', () => ({ drawSignalBench: vi.fn() }));
vi.mock('../atlas-scene/RegionViewMount', () => ({
  BAND_LENS: { kind: 'band' },
  default: ({ selectedBandId }: { selectedBandId: string | null }) => <div data-testid="mount" data-band={String(selectedBandId)} />,
}));

const EVENTS: SignalBenchEvent[] = [
  { kind: 'inject', id: 'QIF-T0001', name: 'Signal injection', status: 'CONFIRMED', nissScore: 6.1, severity: 'medium', placement: { kind: 'neural', bandId: 'N1', layerName: 'Spinal Cord', alsoTagged: ['the seam'] } },
  { kind: 'replay', id: 'QIF-T0107', name: 'Neural nonce replay', status: 'THEORETICAL', nissScore: 5.4, severity: 'medium', placement: { kind: 'classical', alsoTagged: [] } },
  { kind: 'jam', id: 'QIF-T0025', name: 'Neuronal jamming', status: 'THEORETICAL', nissScore: 5, severity: 'medium', placement: { kind: 'seam', alsoTagged: [] } },
];

const eventButton = (id: string) => screen.getByRole('button', { name: new RegExp(`^${id}`) });

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

beforeEach(() => {
  vi.mocked(drawSignalBench).mockClear();
  window.history.replaceState(null, '', '/');
});

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
    const lastFrame = vi.mocked(drawSignalBench).mock.lastCall?.[0];
    expect(lastFrame?.time).toBe(getFinalFrameTime(EVENTS.length));
  });

  it('offers no pause control when nothing animates', () => {
    stubBrowser(true);
    render(<SignalBench events={EVENTS} />);
    expect(screen.queryByRole('button', { name: /animation/ })).toBeNull();
  });

  it('stops scheduling frames when paused and resumes on play', () => {
    stubBrowser(false);
    render(<SignalBench events={EVENTS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause animation' }));
    expect(cancelAnimationFrame).toHaveBeenCalled();
    vi.mocked(requestAnimationFrame).mockClear();
    expect(screen.getByRole('button', { name: 'Play animation' }).hasAttribute('aria-pressed')).toBe(false);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Play animation' }));
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('holds the animation while the readout link has focus', () => {
    stubBrowser(false);
    render(<SignalBench events={EVENTS} />);
    vi.mocked(requestAnimationFrame).mockClear();
    fireEvent.focus(screen.getByRole('link', { name: 'QIF-T0001' }));
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('holds for a mouse hovering the readout but not for a touch', () => {
    stubBrowser(false);
    render(<SignalBench events={EVENTS} />);
    const readout = screen.getByRole('link', { name: 'QIF-T0001' }).closest('div') as HTMLElement;
    vi.mocked(cancelAnimationFrame).mockClear();
    fireEvent.pointerEnter(readout, { pointerType: 'touch' });
    expect(cancelAnimationFrame).not.toHaveBeenCalled();
    fireEvent.pointerEnter(readout, { pointerType: 'mouse' });
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('passes labels that carry each technique status', () => {
    stubBrowser(false);
    render(<SignalBench events={EVENTS} />);
    const frame = vi.mocked(drawSignalBench).mock.calls[0][0];
    expect(frame.eventLabels).toContain('QIF-T0107 (theoretical)');
  });

  it('makes every event a button that sets the highlight and brackets the layer', () => {
    stubBrowser(false);
    render(<SignalBench events={EVENTS} />);
    expect(screen.queryByTestId('mount')).toBeNull();
    expect(eventButton('QIF-T0001').className).toContain('min-h-[44px]');
    fireEvent.click(eventButton('QIF-T0001'));
    expect(window.location.search).toBe('?highlight=QIF-T0001');
    expect(eventButton('QIF-T0001').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('mount').getAttribute('data-band')).toBe('N1');
    expect(screen.getByText(/Spinal Cord/)).toBeDefined();
    expect(screen.getByRole('link', { name: /Open the atlas/ }).getAttribute('href')).toBe('/atlas/anatomy/?highlight=QIF-T0001');
  });

  it('brackets nothing and says why for classical-only and seam-only techniques', () => {
    stubBrowser(false);
    render(<SignalBench events={EVENTS} />);
    fireEvent.click(eventButton('QIF-T0107'));
    expect(screen.getByTestId('mount').getAttribute('data-band')).toBe('null');
    expect(screen.getByText(/classical stack/)).toBeDefined();
    fireEvent.click(eventButton('QIF-T0025'));
    expect(screen.getByTestId('mount').getAttribute('data-band')).toBe('null');
    expect(screen.getByText(/the seam/)).toBeDefined();
  });

  it('keeps other query parameters and restores only a listed highlight', () => {
    stubBrowser(false);
    window.history.replaceState(null, '', '/?ref=x&highlight=QIF-T0107');
    render(<SignalBench events={EVENTS} />);
    expect(eventButton('QIF-T0107').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(eventButton('QIF-T0001'));
    expect(window.location.search).toBe('?ref=x&highlight=QIF-T0001');
    cleanup();
    window.history.replaceState(null, '', '/?highlight=QIF-T9999');
    render(<SignalBench events={EVENTS} />);
    expect(screen.queryByTestId('mount')).toBeNull();
  });

  it('renders nothing without events', () => {
    stubBrowser(false);
    const { container } = render(<SignalBench events={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
