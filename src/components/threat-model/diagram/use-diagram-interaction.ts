import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useModelHighlight } from '../model-highlight';
import { useOnChange } from './use-on-change';

const ELEMENT_ID_ATTRIBUTE = 'data-element-id';

interface Options {
  /** A drawing that is only a picture: nothing lights, nothing is focusable. */
  isStatic: boolean;
  selectedElementId: string | null;
  onSelectElement?: (elementId: string) => void;
  /** Called once when the pointer or focus arrives on an element, here or in a linked view. */
  onPointAt: (elementId: string) => void;
}

/** What goes on each element that stands for a part or a connection: a `<g>` in the drawing, a row in the list. */
export interface ElementProps {
  [ELEMENT_ID_ATTRIBUTE]: string;
  'data-lit'?: boolean;
  onPointerEnter?: () => void;
  onPointerLeave?: (event: PointerEvent<Element>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<Element>) => void;
  tabIndex?: number;
  role?: 'button';
  'aria-pressed'?: boolean;
  'aria-label'?: string;
}

export interface DiagramInteraction {
  isLit: (elementId: string) => boolean;
  /** Props for the piece of an element that takes the pointer only (a connection's line). */
  pointerProps: (elementId: string) => ElementProps;
  /** Props for the piece that also takes focus and the keyboard (a part, a connection's label). */
  controlProps: (elementId: string, accessibleName: string) => ElementProps;
}

/** True when the pointer is moving to another piece of the same element, so the element is still pointed at. */
function isStayingOn(event: PointerEvent<Element>, elementId: string): boolean {
  const destination: unknown = event.relatedTarget;
  for (let node = destination instanceof Node ? destination : null; node !== null; node = node.parentNode) {
    if (node instanceof Element && node.getAttribute(ELEMENT_ID_ATTRIBUTE) === elementId) return true;
  }
  return false;
}

function activateOnKey(event: KeyboardEvent<Element>, activate: () => void): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  activate();
}

/**
 * Pointer, focus and keyboard behaviour for every part and connection of the drawing. The
 * lit element is shared with the other Model views through `useModelHighlight().bind`, and
 * kept locally too so the drawing answers the pointer where no view is linked.
 */
export function useDiagramInteraction({ isStatic, selectedElementId, onSelectElement, onPointAt }: Options): DiagramInteraction {
  const linked = useModelHighlight();
  const [pointedId, setPointedId] = useState<string | null>(null);

  // An element lit from another view (a register row, an overview bar) counts as pointed at.
  useOnChange(linked.litKey, (litKey) => {
    if (!isStatic && litKey !== null && litKey !== pointedId) onPointAt(litKey);
  });

  const pointerProps = (elementId: string): ElementProps => {
    if (isStatic) return { [ELEMENT_ID_ATTRIBUTE]: elementId };
    const bound = linked.bind(elementId);
    const arrive = (notifyLinked: () => void): void => {
      notifyLinked();
      if (pointedId === elementId) return;
      setPointedId(elementId);
      onPointAt(elementId);
    };
    const depart = (notifyLinked: () => void): void => {
      notifyLinked();
      setPointedId((current) => (current === elementId ? null : current));
    };
    return {
      [ELEMENT_ID_ATTRIBUTE]: elementId,
      'data-lit': bound['data-lit'] || pointedId === elementId,
      onPointerEnter: () => arrive(bound.onPointerEnter),
      onPointerLeave: (event) => { if (!isStayingOn(event, elementId)) depart(bound.onPointerLeave); },
      onFocus: () => arrive(bound.onFocus),
      onBlur: () => depart(bound.onBlur),
      onClick: onSelectElement === undefined ? undefined : () => onSelectElement(elementId),
    };
  };

  const controlProps = (elementId: string, accessibleName: string): ElementProps => {
    const shared = pointerProps(elementId);
    if (isStatic || onSelectElement === undefined) return shared;
    return {
      ...shared,
      tabIndex: 0,
      role: 'button',
      'aria-pressed': elementId === selectedElementId,
      'aria-label': accessibleName,
      onKeyDown: (event) => activateOnKey(event, () => onSelectElement(elementId)),
    };
  };

  return { isLit: (elementId) => !isStatic && (pointedId === elementId || linked.isLit(elementId)), pointerProps, controlProps };
}
