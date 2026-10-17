import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from '@/components/lab-kit/motion/use-reduced-motion';
import type { DeviceModel, ModelLink } from '@/lib/threat-model/device-model';
import { useOnChange } from './use-on-change';

export interface FlowPass {
  /** A key per connection with a pass under way. A new key remounts the pass, which restarts it. */
  activeKeys: ReadonlyMap<string, number>;
  /** Sends one pass along the connection. With reduced motion nothing is sent. */
  start: (linkId: string) => void;
  /** Called when the pass has finished, so nothing is left animating at rest. */
  finish: (linkId: string) => void;
}

/**
 * One pass of flow along a connection, in answer to something the reader did or a change to
 * the model. It runs once and is removed; nothing here repeats.
 */
export function useFlowPass(): FlowPass {
  const isReduced = useReducedMotion();
  const [activeKeys, setActiveKeys] = useState<ReadonlyMap<string, number>>(() => new Map());
  const lastKey = useRef(0);

  const start = useCallback((linkId: string): void => {
    if (isReduced) return;
    lastKey.current += 1;
    const key = lastKey.current;
    setActiveKeys((current) => new Map(current).set(linkId, key));
  }, [isReduced]);

  const finish = useCallback((linkId: string): void => {
    setActiveKeys((current) => {
      if (!current.has(linkId)) return current;
      const remaining = new Map(current);
      remaining.delete(linkId);
      return remaining;
    });
  }, []);

  return { activeKeys, start, finish };
}

function signatureOf(link: ModelLink): string {
  return [link.fromComponentId, link.toComponentId, link.medium, link.carriesNeuralData, link.carriesStimulationCommands, link.carriesSoftwareUpdates].join('|');
}

function hasSameParts(before: DeviceModel, after: DeviceModel): boolean {
  const beforeIds = new Set(before.components.map((component) => component.id));
  return before.components.length === after.components.length && after.components.every((component) => beforeIds.has(component.id));
}

/**
 * Connections added or changed between two versions of the same device. A device with
 * different parts is a different device, not an edit, so it lists nothing.
 */
export function listEditedLinkIds(before: DeviceModel, after: DeviceModel): string[] {
  if (!hasSameParts(before, after)) return [];
  const signatureBefore = new Map(before.links.map((link) => [link.id, signatureOf(link)]));
  return after.links.filter((link) => signatureBefore.get(link.id) !== signatureOf(link)).map((link) => link.id);
}

interface PassTriggers {
  model: DeviceModel;
  selectedElementId: string | null;
  /** The element the newest chain step reached acts on, or null. */
  stepElementId: string | null;
  reachedStepCount: number | undefined;
}

/**
 * Starts a pass when a connection becomes the selection, is edited, or is the element the
 * current chain step acts on. Pointing at a connection and focusing it start a pass from
 * their own handlers.
 */
export function useFlowPassTriggers(start: (linkId: string) => void, { model, selectedElementId, stepElementId, reachedStepCount }: PassTriggers): void {
  const isLink = (elementId: string | null): elementId is string => elementId !== null && model.links.some((link) => link.id === elementId);

  useOnChange(selectedElementId, (selected) => {
    if (isLink(selected)) start(selected);
  });
  useOnChange(model, (after, before) => {
    for (const linkId of listEditedLinkIds(before, after)) start(linkId);
  });
  useOnChange(`${reachedStepCount ?? 'still'}:${stepElementId ?? ''}`, () => {
    if (reachedStepCount !== undefined && isLink(stepElementId)) start(stepElementId);
  });
}
