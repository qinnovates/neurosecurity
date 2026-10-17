import { useCallback, useMemo, useState } from 'react';
import EmptyState from '@/components/lab-kit/EmptyState';
import { useMediaQuery } from '@/components/lab-kit/use-media-query';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { derivePayloadFlows } from '@/lib/threat-model/payload-flow';
import type { ElementRowCounts } from '@/lib/threat-model/register-counts';
import { describeLink } from '@/lib/threat-model/stride';
import { computeDiagramLayout } from './diagram-layout';
import { metricsFor, type DiagramDensity } from './diagram/diagram-metrics';
import { buildStepMarks, currentStepElementId, type ChainMarker, type DiagramHighlight } from './diagram/diagram-types';
import DiagramCanvas from './diagram/DiagramCanvas';
import DiagramLegend from './diagram/DiagramLegend';
import DiagramList from './diagram/DiagramList';
import { buildBadges } from './diagram/element-badges';
import { passDirectionOf, type PayloadFlows } from './diagram/payload-tags';
import { useDiagramInteraction } from './diagram/use-diagram-interaction';
import { useElementSize } from './diagram/use-element-size';
import { useFlowPass, useFlowPassTriggers } from './diagram/use-flow-pass';
import './threat-model.css';

export type { ChainMarker, DiagramHighlight } from './diagram/diagram-types';

/** Under this width the drawing gives way to a list; the same breakpoint the kit's tables use. */
export const NARROW_SCREEN_QUERY = '(max-width: 719.98px)';

interface Props {
  model: DeviceModel;
  /** Accessible name; also says which view is shown. */
  title: string;
  /** When set, everything outside it steps back to a softer colour. */
  highlight?: DiagramHighlight | null;
  selectedElementId?: string | null;
  /** Makes every part and connection a button, reachable by keyboard. */
  onSelectElement?: (elementId: string) => void;
  /** Rows per part and connection, as `countRowsByElement` returns them. Draws a severity-split badge on each. */
  elementCounts?: readonly ElementRowCounts[];
  /** Older form of the counts: open rows per element id, with no severity. Used only when `elementCounts` is absent. */
  openRiskCounts?: ReadonlyMap<string, number>;
  /** Elements with no catalog row at all, when `elementCounts` was taken under a filter. */
  notAssessedElementIds?: ReadonlySet<string>;
  /** The steps of a chain to mark, each on the part or connection it acts on. */
  chainSteps?: readonly ChainMarker[];
  /** During playback, how many steps have been reached. Omit for the still picture with every step shown. */
  reachedStepCount?: number;
  /** What each connection carries and which way. Derived from the model by `derivePayloadFlows` when omitted. */
  payloadFlows?: PayloadFlows;
  /** A picture only: nothing lights, nothing moves, nothing takes focus. For print and for cards. */
  isStatic?: boolean;
  isLegendHidden?: boolean;
  /** The grid the drawing is laid out on. Type sizes are the same on both; the compact one takes less room. */
  density?: DiagramDensity;
  /** A sentence shown with the legend, above its items. */
  legendNote?: string;
  /** The id of the legend's region, for a control elsewhere that shows and hides it. */
  legendId?: string;
}

function describeDrawing(model: DeviceModel): string {
  const parts = model.components.map((component) => `${component.label}${component.isNeuralInterface ? ' (tissue contact)' : ''}`).join(', ');
  const connections = model.links.map((link) => describeLink(model, link.id)).join('; ');
  return `Parts: ${parts}. Connections: ${connections === '' ? 'none' : connections}.`;
}

/**
 * The device diagram: a drawing at fixed type sizes where it fits, a list of the same parts
 * and connections where it does not (a narrow screen, or a device wider than the place it is
 * shown in), and a legend for the marks in use. The drawing is never scaled. It is still at
 * rest; one pass of flow runs along a connection when the reader points at it, focuses it,
 * selects it or edits it, or when the chain step being played acts on it.
 */
export default function ArchitectureDiagram({
  model, title, highlight = null, selectedElementId = null, onSelectElement, elementCounts, openRiskCounts, notAssessedElementIds,
  chainSteps = [], reachedStepCount, payloadFlows, isStatic = false, isLegendHidden = false, density = 'full', legendNote, legendId,
}: Props) {
  const flows = useMemo<PayloadFlows>(() => payloadFlows ?? derivePayloadFlows(model), [payloadFlows, model]);
  const badges = useMemo(() => buildBadges({ elementCounts, openRiskCounts, notAssessedElementIds }), [elementCounts, openRiskCounts, notAssessedElementIds]);
  const stepMarks = buildStepMarks(chainSteps, reachedStepCount);
  const isNarrow = useMediaQuery(NARROW_SCREEN_QUERY);
  const hasBadges = badges.size > 0;
  const metrics = useMemo(() => metricsFor(density, hasBadges), [density, hasBadges]);
  const layout = useMemo(() => computeDiagramLayout(model, metrics), [model, metrics]);
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const frameSize = useElementSize(frame);
  // A picture for paper keeps its drawing and scrolls on screen; a working diagram that does not fit gives way to the list.
  const isTooWide = !isStatic && frameSize !== null && layout.width > Math.ceil(frameSize.width);
  const flowPass = useFlowPass();
  const startPass = flowPass.start;
  // Flow is shown only where the model says something travels, and never in a picture.
  const passAlong = useCallback((elementId: string): void => {
    if (!isStatic && passDirectionOf(flows.get(elementId) ?? []) !== null) startPass(elementId);
  }, [isStatic, flows, startPass]);
  const interaction = useDiagramInteraction({ isStatic, selectedElementId, onSelectElement, onPointAt: passAlong });
  useFlowPassTriggers(passAlong, { model, selectedElementId, stepElementId: currentStepElementId(chainSteps, reachedStepCount), reachedStepCount });

  if (model.components.length === 0) {
    return <EmptyState reason="nothing-shown" title="This device has no parts" action="Add a part in the device editor." />;
  }
  const shared = { model, title, flows, badges, stepMarks, highlight, selectedElementId, interaction };
  return (
    <div className="lab-diagram" ref={setFrame} data-form={isNarrow || isTooWide ? 'list' : 'drawing'}>
      {isNarrow || isTooWide
        ? <DiagramList {...shared} />
        : (
          <div className="lab-diagram-scroll">
            <DiagramCanvas
              {...shared} layout={layout} metrics={metrics} description={describeDrawing(model)} flowPass={flowPass}
              isSelectable={!isStatic && onSelectElement !== undefined}
            />
          </div>
        )}
      {(legendId !== undefined || !isLegendHidden) && (
        <div id={legendId} className="lab-diagram-legend" hidden={isLegendHidden}>
          {!isLegendHidden && legendNote !== undefined && <p className="lab-diagram-note">{legendNote}</p>}
          {!isLegendHidden && <DiagramLegend model={model} flows={flows} badges={badges} hasChainSteps={chainSteps.length > 0} />}
        </div>
      )}
    </div>
  );
}
