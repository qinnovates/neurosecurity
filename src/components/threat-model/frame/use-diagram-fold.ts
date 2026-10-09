import { useMemo } from 'react';
import { useMediaQuery } from '@/components/lab-kit/use-media-query';
import { useViewState } from '@/components/workbench/ViewStateContext';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { COMPACT_METRICS } from '../diagram/diagram-metrics';
import { computeDiagramLayout } from '../diagram-layout';
import { MODEL_STATE_KEYS } from './model-view-keys';

/** Under this width the drawing is a list; the same breakpoint the diagram and the kit's tables use. */
export const NARROW_SCREEN_QUERY = '(max-width: 719.98px)';
/** Under this height an open drawing would leave too few rows on the first screen. */
export const SHORT_SCREEN_QUERY = '(max-height: 799.98px)';
/** The tallest drawing, in CSS pixels, that opens by itself above the rows: one row of parts. */
export const OPEN_DRAWING_MAX_HEIGHT = 136;

export interface FoldFacts {
  isNarrow: boolean;
  isShort: boolean;
  /** Height of the compact drawing of this device. */
  drawingHeight: number;
  /** True while a chain is drawn on the diagram. */
  hasChain: boolean;
}

/**
 * Whether the diagram is unfolded before the reader has chosen. On a phone it starts folded.
 * On a wider screen it is open while a chain is drawn on it, and otherwise when the drawing is
 * low enough and the screen tall enough to leave the first screen to the rows.
 */
export function isDiagramOpenByDefault({ isNarrow, isShort, drawingHeight, hasChain }: FoldFacts): boolean {
  if (isNarrow) return false;
  return hasChain || (!isShort && drawingHeight <= OPEN_DRAWING_MAX_HEIGHT);
}

function isNullableBoolean(value: unknown): value is boolean | null {
  return value === null || typeof value === 'boolean';
}

export interface DiagramFold {
  isOpen: boolean;
  isNarrow: boolean;
  toggle: () => void;
}

/** The fold of the diagram on the working views. The reader's choice is kept in view state and wins over the default. */
export function useDiagramFold(model: DeviceModel, hasChain: boolean): DiagramFold {
  const [choice, setChoice] = useViewState<boolean | null>(MODEL_STATE_KEYS.isDiagramOpen, null, isNullableBoolean);
  const isNarrow = useMediaQuery(NARROW_SCREEN_QUERY);
  const isShort = useMediaQuery(SHORT_SCREEN_QUERY);
  const drawingHeight = useMemo(() => computeDiagramLayout(model, COMPACT_METRICS).height, [model]);
  const isOpen = choice ?? isDiagramOpenByDefault({ isNarrow, isShort, drawingHeight, hasChain });
  return { isOpen, isNarrow, toggle: () => setChoice(!isOpen) };
}
