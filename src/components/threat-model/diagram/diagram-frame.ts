/**
 * Turns a routing plan into pixel positions for the grid: where each column and row of parts
 * sits, how wide each gap is, and where each lane runs. A gap is wide only where a straight
 * connection needs room for its label, and a channel is as tall as the labels in its lanes.
 */

import { cardHeightFor, type DiagramMetrics } from './diagram-metrics';
import type { GridNode, RoutingPlan } from './edge-plan';

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

interface ChannelBox {
  height: number;
  laneHeights: number[];
  stackedHeight: number;
  /** True when the strip of stacked labels lies above the lanes, next to the upper row. */
  isStackedLabelFirst: boolean;
}

/** Lane connections that reach `node` through `channel`: each runs straight from the part's edge to its lane. */
function countLaneEnds(plan: RoutingPlan, node: GridNode, channel: number): number {
  return plan.plans.reduce((count, edge) => {
    if (edge.kind !== 'lane') return count;
    const leavesHere = edge.from.id === node.id && edge.fromChannel === channel;
    const arrivesHere = edge.to.id === node.id && (edge.turn?.toChannel ?? edge.fromChannel) === channel;
    return count + (leavesHere ? 1 : 0) + (arrivesHere ? 1 : 0);
  }, 0);
}

/**
 * Where the labels of stacked connections go in the channel between two rows. A lane
 * connection that leaves the part on the strip's side would run through such a label, so the
 * strip lies next to whichever row sends fewer of them: next to the lower row unless the
 * upper one sends fewer.
 */
function isStackedLabelNearUpperRow(plan: RoutingPlan, channel: number): boolean {
  let fromUpper = 0;
  let fromLower = 0;
  for (const edge of plan.plans) {
    if (edge.kind !== 'column' || Math.max(edge.from.row, edge.to.row) !== channel) continue;
    const [upper, lower] = edge.from.row < edge.to.row ? [edge.from, edge.to] : [edge.to, edge.from];
    fromUpper += countLaneEnds(plan, upper, channel);
    fromLower += countLaneEnds(plan, lower, channel);
  }
  return fromUpper < fromLower;
}

function measureChannels(plan: RoutingPlan, rowCount: number, metrics: DiagramMetrics): ChannelBox[] {
  return Array.from({ length: rowCount + 1 }, (_unused, channel) => {
    const heights = laneHeights(plan, channel, metrics);
    const stackedHeight = stackedLabelHeight(plan, channel, metrics);
    const isBetweenRows = channel > 0 && channel < rowCount;
    const minimum = isBetweenRows ? 2 * metrics.channelMin : metrics.channelMin;
    return {
      height: Math.max(minimum, heights.reduce((sum, height) => sum + height, 0) + stackedHeight), laneHeights: heights, stackedHeight,
      isStackedLabelFirst: isBetweenRows && stackedHeight > 0 && isStackedLabelNearUpperRow(plan, channel),
    };
  });
}

function sumOf(heights: readonly number[]): number {
  return heights.reduce((sum, height) => sum + height, 0);
}

/** Lanes stack away from the parts they serve: upward in the first channel, downward in every other, below the stacked labels when those come first. */
function placeLanes(box: ChannelBox, channelTop: number, isFirstChannel: boolean): LaneBand[] {
  const bands: LaneBand[] = [];
  const lanesTop = box.isStackedLabelFirst ? channelTop + box.height - sumOf(box.laneHeights) : channelTop;
  let edge = isFirstChannel ? channelTop + box.height : lanesTop;
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
    // The stacked labels take the part of the channel the lanes leave: above them or below.
    const lanesHeight = channel === 0 ? box.height : sumOf(box.laneHeights);
    const stripTop = box.isStackedLabelFirst ? cursor : cursor + lanesHeight;
    stackedLabelY.push(stripTop + (box.height - lanesHeight) / 2);
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
