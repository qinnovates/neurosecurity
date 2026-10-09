/**
 * Turns a routing plan into pixel positions for the grid: where each column and row of parts
 * sits, how wide each gap is, and where each lane runs. A gap is wide only where a straight
 * connection needs room for its label, and a channel is as tall as the labels in its lanes.
 */

import { cardHeightFor, type DiagramMetrics } from './diagram-metrics';
import type { RoutingPlan } from './edge-plan';

/** A horizontal strip a connection runs along; the line is drawn through its middle. */
export interface LaneBand { top: number; height: number }

export interface DiagramFrame {
  width: number;
  height: number;
  /** Left edge of the parts in each column. */
  columnX: number[];
  /** Top edge of the parts in each row. */
  rowY: number[];
  /** Where the first connection turns in the gap to the right of each column. */
  gutterX: number[];
  /** Lanes per channel; channel `n` is the space above row `n`, and the last is below the last row. */
  lanes: LaneBand[][];
  /** Per channel, the middle of the strip kept for labels of connections between two stacked parts. */
  stackedLabelY: number[];
}

function laneMiddle(band: LaneBand): number {
  return band.top + band.height / 2;
}

export function laneY(frame: DiagramFrame, channel: number, lane: number): number {
  return laneMiddle(frame.lanes[channel][lane]);
}

function gapWidths(plan: RoutingPlan, columnCount: number, metrics: DiagramMetrics): number[] {
  const wideGap = 2 * metrics.zonePadding + metrics.cardWidth + 2 * metrics.cardStub;
  return Array.from({ length: columnCount }, (_unused, gap) => {
    const turning = plan.gutterSlots[gap] > 0 ? (plan.gutterSlots[gap] + 1) * metrics.gutterStep : 0;
    // The gap after the last column exists only when a connection has to turn there.
    if (gap === columnCount - 1) return turning === 0 ? 0 : metrics.zonePadding + turning + metrics.gutterStep;
    const holdsLabel = plan.plans.some((edge) => edge.kind === 'row' && Math.abs(edge.from.col - edge.to.col) === 1 && Math.min(edge.from.col, edge.to.col) === gap);
    return Math.max(holdsLabel ? wideGap : metrics.gapNarrow, 2 * metrics.zonePadding + turning + metrics.gutterStep);
  });
}

function laneHeights(plan: RoutingPlan, channel: number, metrics: DiagramMetrics): number[] {
  return Array.from({ length: plan.laneCounts[channel] }, (_unused, lane) => {
    const cards = plan.plans.flatMap((edge) => (edge.kind === 'lane' && edge.fromChannel === channel && edge.fromLane === lane
      ? [cardHeightFor(edge.link.payloadCount, metrics)] : []));
    return metrics.lanePadding + Math.max(0, ...cards);
  });
}

function stackedLabelHeight(plan: RoutingPlan, channel: number, metrics: DiagramMetrics): number {
  const cards = plan.plans.flatMap((edge) => (edge.kind === 'column' && Math.max(edge.from.row, edge.to.row) === channel
    ? [cardHeightFor(edge.link.payloadCount, metrics) + 2 * metrics.cardStub] : []));
  return Math.max(0, ...cards);
}

interface ChannelBox { height: number; laneHeights: number[]; stackedHeight: number }

function measureChannels(plan: RoutingPlan, rowCount: number, metrics: DiagramMetrics): ChannelBox[] {
  return Array.from({ length: rowCount + 1 }, (_unused, channel) => {
    const heights = laneHeights(plan, channel, metrics);
    const stackedHeight = stackedLabelHeight(plan, channel, metrics);
    const isBetweenRows = channel > 0 && channel < rowCount;
    const minimum = isBetweenRows ? 2 * metrics.channelMin : metrics.channelMin;
    return { height: Math.max(minimum, heights.reduce((sum, height) => sum + height, 0) + stackedHeight), laneHeights: heights, stackedHeight };
  });
}

/** Lanes stack away from the parts they serve: upward in the first channel, downward in every other. */
function placeLanes(box: ChannelBox, channelTop: number, isFirstChannel: boolean): LaneBand[] {
  const bands: LaneBand[] = [];
  let edge = isFirstChannel ? channelTop + box.height : channelTop;
  for (const height of box.laneHeights) {
    bands.push({ top: isFirstChannel ? edge - height : edge, height });
    edge += isFirstChannel ? -height : height;
  }
  return bands;
}

export function computeFrame(plan: RoutingPlan, columnCount: number, rowCount: number, metrics: DiagramMetrics): DiagramFrame {
  const gaps = gapWidths(plan, columnCount, metrics);
  const columnX: number[] = [];
  for (let column = 0; column < columnCount; column += 1) {
    columnX.push(column === 0 ? metrics.margin + metrics.zonePadding : columnX[column - 1] + metrics.nodeWidth + gaps[column - 1]);
  }
  const channels = measureChannels(plan, rowCount, metrics);
  const rowY: number[] = [];
  const lanes: LaneBand[][] = [];
  const stackedLabelY: number[] = [];
  let cursor = metrics.margin + metrics.zoneHeader;
  channels.forEach((box, channel) => {
    const bands = placeLanes(box, cursor, channel === 0);
    lanes.push(bands);
    const lanesBottom = channel === 0 ? cursor + box.height : cursor + box.laneHeights.reduce((sum, height) => sum + height, 0);
    stackedLabelY.push(lanesBottom + (cursor + box.height - lanesBottom) / 2);
    cursor += box.height;
    if (channel < rowCount) {
      rowY.push(cursor);
      cursor += metrics.nodeHeight;
    }
  });
  const lastColumnRight = columnCount === 0 ? metrics.margin : columnX[columnCount - 1] + metrics.nodeWidth + metrics.zonePadding;
  return {
    width: lastColumnRight + (gaps[columnCount - 1] ?? 0) + metrics.margin,
    height: cursor + metrics.margin,
    columnX, rowY, lanes, stackedLabelY,
    gutterX: columnX.map((x) => x + metrics.nodeWidth + metrics.zonePadding + metrics.gutterStep),
  };
}
