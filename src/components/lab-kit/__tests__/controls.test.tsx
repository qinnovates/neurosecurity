// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import Drawer from '../Drawer';
import EmptyState from '../EmptyState';
import FacetBar, { type Facet } from '../FacetBar';
import FilterChip from '../FilterChip';
import Legend from '../Legend';
import Panel from '../Panel';
import Segmented from '../Segmented';
import TechniqueLink from '../TechniqueLink';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); Reflect.deleteProperty(document, 'getAnimations'); });

/** jsdom lays nothing out and animates nothing. These stand in for a browser that does both. */
function stubLayout(widthByLabel: Readonly<Record<string, number>>): void {
  const order = Object.keys(widthByLabel);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function width(this: HTMLElement) { return widthByLabel[this.textContent ?? ''] ?? 0; });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => 24);
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(() => 2);
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function left(this: HTMLElement) {
    const index = order.indexOf(this.textContent ?? '');
    return order.slice(0, Math.max(0, index)).reduce((sum, label) => sum + widthByLabel[label], 2);
  });
}
function stubAnimations(): void {
  Object.defineProperty(document, 'getAnimations', { value: () => [], configurable: true });
}
function stubReducedMotion(): void {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion'), addEventListener: () => undefined, removeEventListener: () => undefined }));
}

describe('FilterChip', () => {
  it('keeps the words and the hatch swatch when a "not assessed" chip is pressed', () => {
    render(<FilterChip label="Deny" count={0} isPressed isNotAssessed onToggle={() => undefined} />);
    const chip = screen.getByRole('button', { name: 'Deny not assessed' });
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(chip.querySelector('.lab-hatch-swatch')).not.toBeNull();
    // The hatch is a swatch before the words, never a pattern on the button behind them.
    expect(chip.classList.contains('lab-hatch')).toBe(false);
    expect(chip.textContent).not.toContain('0');
  });

  it('swaps a changed count at once and marks it', () => {
    const { rerender } = render(<FilterChip label="Read" count={52} isPressed={false} onToggle={() => undefined} />);
    rerender(<FilterChip label="Read" count={36} isPressed={false} onToggle={() => undefined} />);
    const figure = screen.getByRole('button', { name: 'Read 36' }).querySelector('.lab-figure');
    expect(figure?.getAttribute('data-changed')).toBe('true');
  });

  it('swaps a changed count that is off screen without marking it', () => {
    const { rerender } = render(<FilterChip label="Read" count={52} isPressed={false} onToggle={() => undefined} />);
    const below = { top: 2000, bottom: 2024, left: 0, right: 40, width: 40, height: 24, x: 0, y: 2000, toJSON: () => ({}) };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(below);
    rerender(<FilterChip label="Read" count={36} isPressed={false} onToggle={() => undefined} />);
    const figure = screen.getByRole('button', { name: 'Read 36' }).querySelector('.lab-figure');
    expect(figure?.getAttribute('data-changed')).toBe('false');
  });
});

type Scope = 'all' | 'open' | 'decided';
const SCOPES = [{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'decided', label: 'Decided' }] as const;

function ScopeControl({ onChange }: { onChange: (scope: Scope) => void }) {
  const [scope, setScope] = useState<Scope>('all');
  return <Segmented label="Register scope" options={SCOPES} value={scope} onChange={(next) => { setScope(next); onChange(next); }} />;
}

describe('Segmented', () => {
  it('is one radio group with a single tab stop on the chosen option', () => {
    render(<ScopeControl onChange={() => undefined} />);
    const radios = within(screen.getByRole('radiogroup', { name: 'Register scope' })).getAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1, -1]);
  });

  it('chooses with a click and with the arrow keys, wrapping at the ends', () => {
    const onChange = vi.fn();
    render(<ScopeControl onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    fireEvent.keyDown(radios[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[2]);
    fireEvent.keyDown(radios[2], { key: 'ArrowRight' });
    fireEvent.keyDown(radios[0], { key: 'End' });
    fireEvent.keyDown(radios[2], { key: 'a' });
    expect(onChange.mock.calls.map(([scope]) => scope as Scope)).toEqual(['open', 'decided', 'all', 'decided']);
  });

  it('draws the chosen option itself where nothing can be measured, so the still picture never depends on the thumb', () => {
    render(<ScopeControl onChange={() => undefined} />);
    const group = screen.getByRole('radiogroup', { name: 'Register scope' });
    expect(group.getAttribute('data-thumb')).toBe('false');
    expect(group.querySelector('.lab-segmented-thumb')).toBeNull();
  });

  it('moves one thumb to the chosen option: same element, new place and width', () => {
    stubLayout({ All: 40, Open: 52, Decided: 70 });
    render(<ScopeControl onChange={() => undefined} />);
    const group = screen.getByRole('radiogroup', { name: 'Register scope' });
    const thumb = group.querySelector('.lab-segmented-thumb') as HTMLElement;
    expect(group.getAttribute('data-thumb')).toBe('true');
    expect(thumb.getAttribute('aria-hidden')).toBe('true');
    expect([thumb.style.transform, thumb.style.width, thumb.style.height]).toEqual(['translate(2px, 2px)', '40px', '24px']);
    fireEvent.click(screen.getByRole('radio', { name: 'Decided' }));
    expect(group.querySelector('.lab-segmented-thumb')).toBe(thumb);
    expect([thumb.style.transform, thumb.style.width]).toEqual(['translate(94px, 2px)', '70px']);
    expect(group.querySelectorAll('.lab-segmented-thumb')).toHaveLength(1);
  });
});

function Inspector({ isFocusTrapped }: { isFocusTrapped?: boolean }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open row</button>
      <Drawer isOpen={isOpen} title="Risk detail" onClose={() => setOpen(false)} isFocusTrapped={isFocusTrapped} actions={<button type="button">Open in catalog</button>}>
        <select aria-label="Decision"><option>Open</option></select>
      </Drawer>
    </>
  );
}

describe('Drawer', () => {
  it('renders nothing while closed', () => {
    render(<Inspector />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('takes focus when it opens, is named by its title, and returns focus when closed', () => {
    render(<Inspector />);
    const opener = screen.getByRole('button', { name: 'Open row' });
    opener.focus();
    fireEvent.click(opener);
    const drawer = screen.getByRole('dialog', { name: 'Risk detail' });
    expect(document.activeElement).toBe(drawer);
    fireEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('closes on Escape and gives focus back', () => {
    render(<Inspector />);
    const opener = screen.getByRole('button', { name: 'Open row' });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Decision' }), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('keeps Tab inside: forward from the last control wraps to the first, and back from the first to the last', () => {
    render(<Inspector />);
    fireEvent.click(screen.getByRole('button', { name: 'Open row' }));
    const drawer = screen.getByRole('dialog');
    const first = within(drawer).getByRole('button', { name: 'Open in catalog' });
    const last = within(drawer).getByRole('combobox', { name: 'Decision' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('is not a modal dialog when the trap is turned off: Tab past either end goes back to what opened it, and the drawer stays', () => {
    render(<Inspector isFocusTrapped={false} />);
    const opener = screen.getByRole('button', { name: 'Open row' });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener.hasAttribute('inert')).toBe(false);
    const last = screen.getByRole('combobox', { name: 'Decision' });
    last.focus();
    expect(fireEvent.keyDown(last, { key: 'Tab' })).toBe(false);
    expect(document.activeElement).toBe(opener);
    const first = screen.getByRole('button', { name: 'Open in catalog' });
    first.focus();
    // Inside the drawer, Tab is the browser's own.
    expect(fireEvent.keyDown(first, { key: 'Tab' })).toBe(true);
    expect(fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })).toBe(false);
    expect(document.activeElement).toBe(opener);
    expect(screen.getByRole('heading', { name: 'Risk detail' })).toBeTruthy();
  });

  it('makes everything outside a trapped drawer inert while it is open, and only then', () => {
    const { container } = render(<><p data-testid="beside">Beside</p><Inspector /></>);
    const opener = screen.getByRole('button', { name: 'Open row' });
    const beside = screen.getByTestId('beside');
    fireEvent.click(opener);
    const drawer = screen.getByRole('dialog');
    expect([opener.hasAttribute('inert'), beside.hasAttribute('inert'), drawer.hasAttribute('inert'), container.hasAttribute('inert')]).toEqual([true, true, false, false]);
    fireEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    expect(document.querySelectorAll('[inert]')).toHaveLength(0);
  });

  it('leaves in one move where the browser animates: it keeps what it showed, takes no input, gives focus back at once, and goes when the move ends', () => {
    stubAnimations();
    function Fading() {
      const [title, setTitle] = useState<string | null>(null);
      return (
        <>
          <button type="button" onClick={() => setTitle('Risk detail')}>Open row</button>
          <Drawer isOpen={title !== null} title={title ?? ''} onClose={() => setTitle(null)} isFocusTrapped={false}>{title !== null && <p>Body of {title}</p>}</Drawer>
        </>
      );
    }
    const { container } = render(<Fading />);
    const opener = screen.getByRole('button', { name: 'Open row' });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    const leaving = container.querySelector('.lab-drawer') as HTMLElement;
    expect(leaving.getAttribute('data-closing')).toBe('true');
    expect(leaving.hasAttribute('inert')).toBe(true);
    expect(leaving.textContent).toContain('Risk detail');
    expect(leaving.textContent).toContain('Body of Risk detail');
    expect(document.activeElement).toBe(opener);
    // An animation ending on something inside the panel is not the panel's exit.
    fireEvent.animationEnd(leaving.querySelector('.lab-drawer-head') as HTMLElement);
    expect(container.querySelector('.lab-drawer')).not.toBeNull();
    fireEvent.animationEnd(leaving);
    expect(container.querySelector('.lab-drawer')).toBeNull();
  });

  it('is removed after the exit should have ended even if the browser never reports it, and reopening cancels the exit', () => {
    stubAnimations();
    vi.useFakeTimers();
    const { container } = render(<Inspector isFocusTrapped={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open row' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open row' }));
    expect(container.querySelector('.lab-drawer')?.hasAttribute('data-closing')).toBe(false);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(container.querySelector('.lab-drawer')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(container.querySelector('.lab-drawer')?.getAttribute('data-closing')).toBe('true');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(container.querySelector('.lab-drawer')).toBeNull();
  });

  it('goes at once, with no exit, when the viewer asked for less motion', () => {
    stubAnimations();
    stubReducedMotion();
    const { container } = render(<Inspector isFocusTrapped={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open row' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(container.querySelector('.lab-drawer')).toBeNull();
  });
});

function facet(id: string, activeCount: number): Facet {
  return { id, label: `Facet ${id}`, control: <button type="button">{`Choice ${id}`}</button>, activeCount };
}

describe('FacetBar', () => {
  const facets = [facet('a', 1), facet('b', 0), facet('c', 2), facet('d', 1)];

  it('shows the first row and keeps the rest behind "More filters", counting their active choices', () => {
    render(<FacetBar label="Filter techniques" facets={facets} visibleCount={2} />);
    const bar = screen.getByRole('group', { name: 'Filter techniques' });
    expect(within(bar).getByRole('button', { name: 'Choice a' })).toBeTruthy();
    expect(within(bar).queryByRole('button', { name: 'Choice c' })).toBeNull();
    const more = within(bar).getByRole('button', { name: 'More filters (3)' });
    expect(more.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(more);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(within(bar).getByRole('group', { name: 'Facet c' })).toBeTruthy();
  });

  it('prints no number when nothing out of sight is active, and no button when every facet fits', () => {
    const { rerender } = render(<FacetBar label="Filter" facets={[facet('a', 1), facet('b', 0)]} visibleCount={1} />);
    expect(screen.getByRole('button', { name: 'More filters' })).toBeTruthy();
    rerender(<FacetBar label="Filter" facets={[facet('a', 1), facet('b', 0)]} />);
    expect(screen.queryByRole('button', { name: /More filters/ })).toBeNull();
  });
});

describe('EmptyState', () => {
  it('says "Not assessed" with the hatch, never a clean blank', () => {
    const { container } = render(<EmptyState reason="not-assessed" detail="No technique has been placed on this connection." />);
    expect(screen.getByRole('status').textContent).toBe('Not assessedNo technique has been placed on this connection.');
    expect(container.querySelector('.lab-hatch-swatch')).not.toBeNull();
  });

  it('says why nothing is shown and what to do', () => {
    const onClear = vi.fn();
    const { container } = render(<EmptyState reason="nothing-shown" title="No technique matches these filters" action={<button type="button" onClick={onClear}>Clear filters</button>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(container.querySelector('.lab-hatch-swatch')).toBeNull();
  });
});

describe('TechniqueLink', () => {
  it('shows the ID in monospace as a link-styled button and opens that technique', () => {
    const onOpen = vi.fn();
    render(<TechniqueLink techniqueId="QIF-T0001" techniqueName="Signal injection" onOpen={onOpen} />);
    const link = screen.getByRole('button', { name: 'Open technique QIF-T0001, Signal injection' });
    expect(link.textContent).toBe('QIF-T0001');
    expect(link.className).toBe('lab-link lab-id');
    fireEvent.click(link);
    expect(onOpen).toHaveBeenCalledWith('QIF-T0001');
  });
});

describe('Legend and Panel', () => {
  it('lists each mark with its name, detail and count', () => {
    render(<Legend label="Decision" items={[{ id: 'open', mark: <span data-testid="mark" />, name: 'Open', detail: 'no decision yet', count: 3 }]} note="Counts are rows." />);
    const item = within(screen.getByRole('list', { name: 'Decision' })).getByRole('listitem');
    expect(item.textContent).toBe('3Openno decision yet');
    expect(within(item).getByTestId('mark')).toBeTruthy();
    expect(screen.getByText('Counts are rows.')).toBeTruthy();
  });

  it('names the panel region by its title and shows its actions', () => {
    render(<Panel title="Coverage" actions={<button type="button">Export</button>}>Body</Panel>);
    const region = screen.getByRole('region', { name: 'Coverage' });
    expect(within(region).getByRole('heading', { level: 2, name: 'Coverage' })).toBeTruthy();
    expect(within(region).getByRole('button', { name: 'Export' })).toBeTruthy();
  });
});
