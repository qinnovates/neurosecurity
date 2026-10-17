// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { derivePayloadFlows } from '@/lib/threat-model/payload-flow';
import { PRESETS, modelFor } from '@/lib/threat-model/__tests__/preset-reports';
import ArchitectureDiagram from '../../ArchitectureDiagram';
import { ModelHighlightProvider, useModelHighlight } from '../../model-highlight';
import { passDirectionOf } from '../payload-tags';
import { listEditedLinkIds } from '../use-flow-pass';
import { stubMatchMedia } from './match-media';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
let restoreMatchMedia: (() => void) | null = null;

afterEach(() => {
  cleanup();
  restoreMatchMedia?.();
  restoreMatchMedia = null;
});

const cortical = modelFor('cortical-read-implant');
const CARRYING_LINK = 'implant-app';
const EMPTY_LINK = 'charger-implant';
const noop = (): void => undefined;

function passes(container: HTMLElement): Element[] {
  return [...container.querySelectorAll('[data-flow-pass]')];
}

/** Ends the animation on an element. jsdom has no AnimationEvent, so React listens for the prefixed name there; both are sent. */
function endAnimation(element: Element): void {
  fireEvent.animationEnd(element);
  fireEvent(element, new Event('webkitAnimationEnd', { bubbles: true }));
}

function card(container: HTMLElement, linkId: string): Element {
  const found = container.querySelector(`.lab-diagram-link[data-element-id="${linkId}"]`);
  if (found === null) throw new Error(`test setup: no label for ${linkId}`);
  return found;
}

describe('at rest', () => {
  it.each(PRESETS)('nothing in the diagram of %s is moving or waiting to move', (_presetId, { model }) => {
    const { container } = render(<ArchitectureDiagram model={model} title="Device" onSelectElement={noop} />);
    expect(passes(container)).toHaveLength(0);
    expect(container.querySelectorAll('animate, animateTransform, animateMotion')).toHaveLength(0);
  });
});

describe('one flow pass along a connection', () => {
  it('runs when the connection is pointed at, in the direction its payloads travel, and is removed when it ends', () => {
    const { container } = render(<ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} />);
    fireEvent.pointerEnter(card(container, CARRYING_LINK));
    expect(passes(container)).toHaveLength(1);
    expect(passes(container)[0].getAttribute('data-flow-pass')).toBe(passDirectionOf(derivePayloadFlows(cortical).get(CARRYING_LINK) ?? []));
    expect(passes(container)[0].getAttribute('d')).toBe(container.querySelector(`.lab-diagram-wire[data-element-id="${CARRYING_LINK}"] .lab-diagram-line`)?.getAttribute('d'));
    endAnimation(passes(container)[0]);
    expect(passes(container)).toHaveLength(0);
  });

  it('runs once when the pointer moves from the line to the label of the same connection', () => {
    const { container } = render(<ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} />);
    const wire = container.querySelector(`.lab-diagram-wire[data-element-id="${CARRYING_LINK}"]`);
    if (wire === null) throw new Error('test setup: no line');
    fireEvent.pointerEnter(wire);
    const first = passes(container)[0];
    fireEvent.pointerLeave(wire, { relatedTarget: card(container, CARRYING_LINK) });
    fireEvent.pointerEnter(card(container, CARRYING_LINK));
    expect(passes(container)).toHaveLength(1);
    expect(passes(container)[0]).toBe(first);
  });

  it('runs when the connection takes focus', () => {
    const { container } = render(<ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} />);
    fireEvent.focus(card(container, CARRYING_LINK));
    expect(passes(container)).toHaveLength(1);
  });

  it('runs when the connection becomes the selection, and starts again from a new element when it is selected again', () => {
    const { container, rerender } = render(<ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} selectedElementId={null} />);
    rerender(<ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} selectedElementId={CARRYING_LINK} />);
    expect(passes(container)).toHaveLength(1);
    const first = passes(container)[0];
    rerender(<ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} selectedElementId={null} />);
    rerender(<ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} selectedElementId={CARRYING_LINK} />);
    expect(passes(container)).toHaveLength(1);
    expect(passes(container)[0]).not.toBe(first);
  });

  it('runs along a connection that was edited, and along no other', () => {
    const edited: DeviceModel = { ...cortical, links: cortical.links.map((link) => (link.id === CARRYING_LINK ? { ...link, medium: 'wifi' } : link)) };
    const { container, rerender } = render(<ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} />);
    rerender(<ArchitectureDiagram model={edited} title="Device" onSelectElement={noop} />);
    expect(passes(container)).toHaveLength(1);
    expect(listEditedLinkIds(cortical, edited)).toEqual([CARRYING_LINK]);
  });

  it('runs when the chain step being played acts on the connection', () => {
    const chainSteps = [{ elementId: 'app', position: 1 }, { elementId: CARRYING_LINK, position: 2 }];
    const { container, rerender } = render(<ArchitectureDiagram model={cortical} title="Device" chainSteps={chainSteps} reachedStepCount={1} />);
    expect(passes(container)).toHaveLength(0);
    rerender(<ArchitectureDiagram model={cortical} title="Device" chainSteps={chainSteps} reachedStepCount={2} />);
    expect(passes(container)).toHaveLength(1);
    expect(container.querySelector(`.lab-diagram-link[data-element-id="${CARRYING_LINK}"] [data-step]`)?.getAttribute('data-step')).toBe('now');
  });

  it('shows nothing travelling a connection that carries none of the modelled payloads', () => {
    const { container } = render(<ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} />);
    expect(derivePayloadFlows(cortical).has(EMPTY_LINK)).toBe(false);
    fireEvent.pointerEnter(card(container, EMPTY_LINK));
    expect(passes(container)).toHaveLength(0);
    expect(card(container, EMPTY_LINK).getAttribute('data-lit')).toBe('true');
  });

  it('does not run for a reader who asked for less motion; the connection still lights', () => {
    restoreMatchMedia = stubMatchMedia([REDUCED_MOTION_QUERY]);
    const { container } = render(<ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} />);
    fireEvent.pointerEnter(card(container, CARRYING_LINK));
    expect(passes(container)).toHaveLength(0);
    expect(card(container, CARRYING_LINK).getAttribute('data-lit')).toBe('true');
  });

  it('never runs in a picture', () => {
    const { container } = render(<ArchitectureDiagram model={cortical} title="Device" isStatic />);
    fireEvent.pointerEnter(card(container, CARRYING_LINK));
    expect(passes(container)).toHaveLength(0);
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(0);
    expect(container.querySelector('.lab-diagram-svg')?.getAttribute('role')).toBe('img');
  });
});

describe('edits between two versions of a device', () => {
  it('lists a connection that was added and none when the device itself was replaced', () => {
    const added = { ...cortical.links[0], id: 'new-link', medium: 'usb' as const };
    expect(listEditedLinkIds(cortical, { ...cortical, links: [...cortical.links, added] })).toEqual(['new-link']);
    expect(listEditedLinkIds(cortical, cortical)).toEqual([]);
    expect(listEditedLinkIds(modelFor('noninvasive-eeg-headset'), cortical)).toEqual([]);
  });
});

function LitKeyProbe() {
  return <output data-testid="lit-key">{useModelHighlight().litKey ?? 'none'}</output>;
}

describe('linked highlight', () => {
  it('lights a part through the shared highlight when it is pointed at, and lets go when the pointer leaves', () => {
    const { container, getByTestId } = render(
      <ModelHighlightProvider><ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} /><LitKeyProbe /></ModelHighlightProvider>,
    );
    const part = container.querySelector('.lab-diagram-part[data-element-id="app"]');
    if (part === null) throw new Error('test setup: no part');
    fireEvent.pointerEnter(part);
    expect(getByTestId('lit-key').textContent).toBe('app');
    expect(part.getAttribute('data-lit')).toBe('true');
    expect(container.querySelectorAll('[data-selected="true"]')).toHaveLength(0);
    fireEvent.pointerLeave(part);
    expect(getByTestId('lit-key').textContent).toBe('none');
    expect(part.getAttribute('data-lit')).toBe('false');
  });

  it('lights a connection lit from another view and sends one pass along it', () => {
    function LightFromElsewhere() {
      const { setLitKey } = useModelHighlight();
      return <button type="button" onClick={() => setLitKey(CARRYING_LINK)}>light</button>;
    }
    const { container, getByText } = render(
      <ModelHighlightProvider><ArchitectureDiagram model={cortical} title="Device" onSelectElement={noop} /><LightFromElsewhere /></ModelHighlightProvider>,
    );
    fireEvent.click(getByText('light'));
    expect(card(container, CARRYING_LINK).getAttribute('data-lit')).toBe('true');
    expect(container.querySelector(`.lab-diagram-wire[data-element-id="${CARRYING_LINK}"]`)?.getAttribute('data-lit')).toBe('true');
    expect(passes(container)).toHaveLength(1);
  });
});
