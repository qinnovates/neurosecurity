/**
 * Draws each planned connection as a line of horizontal and vertical runs that starts and
 * ends on the edge of a part, and places the connection's label card on it.
 */

import { laneY, type DiagramFrame } from './diagram-frame';
import { boxAround, headingOf, roundedPath, type Box, type Heading, type Point } from './diagram-geometry';
import { cardHeightFor, type DiagramMetrics } from './diagram-metrics';
import type { EdgePlan, GridNode, LanePlan, RoutingPlan, StraightPlan } from './edge-plan';
import { settleLabels } from './label-placement';

export interface EdgeLine {
  id: string;
  /** The medium, in words. */
  label: string;
  fromId: string;
  toId: string;
  /** Corners of the line, from the `from` part to the `to` part. */
  points: Point[];
  path: string;
  /** The label card. It has no size when the metrics draw none. */
  card: Box;
  /** Which way the line runs across the card, from `from` to `to`; payload arrows are turned by it. */
  heading: Heading;
  payloadCount: number;
}

type PortSide = 'top' | 'bottom';

interface LaneEnd {
  linkId: string;
  isFromEnd: boolean;
  node: GridNode;
  side: PortSide;
  isGoingRight: boolean;
  /** How far the lane is from the part; a connection bound for a farther lane leaves nearer the middle. */
  reach: number;
}

function nodeBox(node: GridNode, frame: DiagramFrame, metrics: DiagramMetrics): Box {
  return { x: frame.columnX[node.col], y: frame.rowY[node.row], width: metrics.nodeWidth, height: metrics.nodeHeight };
}

function edgeY(box: Box, side: PortSide): number {
  return side === 'top' ? box.y : box.y + box.height;
}

function laneEndsOf(plan: LanePlan, frame: DiagramFrame, metrics: DiagramMetrics): LaneEnd[] {
  const { from, to, turn } = plan;
  const describe = (node: GridNode, channel: number, lane: number, towards: number, isFromEnd: boolean): LaneEnd => {
    const side: PortSide = channel === node.row ? 'top' : 'bottom';
    const own = 2 * node.col;
    return {
      linkId: plan.link.id, isFromEnd, node, side,
      isGoingRight: towards > own || (towards === own && isFromEnd),
      reach: Math.abs(laneY(frame, channel, lane) - edgeY(nodeBox(node, frame, metrics), side)),
    };
  };
  const turnAt = turn === null ? null : 2 * turn.gutter + 1;
  return [
    describe(from, plan.fromChannel, plan.fromLane, turnAt ?? 2 * to.col, true),
    describe(to, turn?.toChannel ?? plan.fromChannel, turn?.toLane ?? plan.fromLane, turnAt ?? 2 * from.col, false),
  ];
}

/** Where along a part's edge each connection leaves it, as an offset from the middle of the edge. */
function portOffsets(ends: readonly LaneEnd[], hasStraightAtMiddle: boolean, metrics: DiagramMetrics): Map<LaneEnd, number> {
  const leftward = ends.filter((end) => !end.isGoingRight).sort((first, second) => first.reach - second.reach);
  const rightward = ends.filter((end) => end.isGoingRight).sort((first, second) => second.reach - first.reach);
  const ordered = [...leftward, ...rightward];
  const limit = metrics.nodeWidth / 2 - metrics.portStep;
  const offsetAt = (index: number): number => {
    if (!hasStraightAtMiddle) return (index - (ordered.length - 1) / 2) * metrics.portStep;
    return index < leftward.length ? (index - leftward.length) * metrics.portStep : (index - leftward.length + 1) * metrics.portStep;
  };
  return new Map(ordered.map((end, index) => [end, Math.max(-limit, Math.min(limit, offsetAt(index)))]));
}

function sideKey(nodeId: string, side: PortSide): string {
  return `${nodeId}:${side}`;
}

/** The x of every lane connection's port, keyed by connection id and end. */
function placePorts(plan: RoutingPlan, frame: DiagramFrame, metrics: DiagramMetrics): Map<string, number> {
  const straightSides = new Set(plan.plans.flatMap((edge) => {
    if (edge.kind !== 'column') return [];
    const [upper, lower] = edge.from.row < edge.to.row ? [edge.from, edge.to] : [edge.to, edge.from];
    return [sideKey(upper.id, 'bottom'), sideKey(lower.id, 'top')];
  }));
  const endsBySide = new Map<string, LaneEnd[]>();
  for (const edge of plan.plans) {
    if (edge.kind !== 'lane') continue;
    for (const end of laneEndsOf(edge, frame, metrics)) {
      const key = sideKey(end.node.id, end.side);
      endsBySide.set(key, [...(endsBySide.get(key) ?? []), end]);
    }
  }
  const portX = new Map<string, number>();
  for (const [key, ends] of endsBySide) {
    for (const [end, offset] of portOffsets(ends, straightSides.has(key), metrics)) {
      portX.set(`${end.linkId}:${end.isFromEnd ? 'from' : 'to'}`, frame.columnX[end.node.col] + metrics.nodeWidth / 2 + offset);
    }
  }
  return portX;
}

function withoutRepeats(points: readonly Point[]): Point[] {
  return points.filter((point, index) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y);
}

function straightPoints(plan: StraightPlan, frame: DiagramFrame, metrics: DiagramMetrics): { points: Point[]; cardCentre: Point } {
  const from = nodeBox(plan.from, frame, metrics);
  const to = nodeBox(plan.to, frame, metrics);
  if (plan.kind === 'row') {
    const y = from.y + from.height / 2;
    const points = from.x < to.x ? [{ x: from.x + from.width, y }, { x: to.x, y }] : [{ x: from.x, y }, { x: to.x + to.width, y }];
    return { points, cardCentre: { x: (points[0].x + points[1].x) / 2, y } };
  }
  const x = from.x + from.width / 2;
  const points = from.y < to.y ? [{ x, y: from.y + from.height }, { x, y: to.y }] : [{ x, y: from.y }, { x, y: to.y + to.height }];
  return { points, cardCentre: { x, y: frame.stackedLabelY[Math.max(plan.from.row, plan.to.row)] } };
}

function lanePoints(plan: LanePlan, frame: DiagramFrame, metrics: DiagramMetrics, portX: ReadonlyMap<string, number>): { points: Point[]; cardCentre: Point } {
  const fromX = portX.get(`${plan.link.id}:from`) ?? 0;
  const toX = portX.get(`${plan.link.id}:to`) ?? 0;
  const fromBox = nodeBox(plan.from, frame, metrics);
  const toBox = nodeBox(plan.to, frame, metrics);
  const firstY = laneY(frame, plan.fromChannel, plan.fromLane);
  const start = { x: fromX, y: edgeY(fromBox, plan.fromChannel === plan.from.row ? 'top' : 'bottom') };
  if (plan.turn === null) {
    const end = { x: toX, y: edgeY(toBox, plan.fromChannel === plan.to.row ? 'top' : 'bottom') };
    return { points: [start, { x: fromX, y: firstY }, { x: toX, y: firstY }, end], cardCentre: { x: (fromX + toX) / 2, y: firstY } };
  }
  const turnX = frame.gutterX[plan.turn.gutter] + plan.turn.slot * metrics.gutterStep;
  const secondY = laneY(frame, plan.turn.toChannel, plan.turn.toLane);
  const end = { x: toX, y: edgeY(toBox, plan.turn.toChannel === plan.to.row ? 'top' : 'bottom') };
  return {
    points: [start, { x: fromX, y: firstY }, { x: turnX, y: firstY }, { x: turnX, y: secondY }, { x: toX, y: secondY }, end],
    cardCentre: { x: (fromX + turnX) / 2, y: firstY },
  };
}

/** The run the card sits on: the one whose middle is the card's centre. */
function headingAcross(points: readonly Point[], cardCentre: Point): Heading {
  for (let index = 1; index < points.length; index += 1) {
    const [from, to] = [points[index - 1], points[index]];
    const isOnRun = cardCentre.x >= Math.min(from.x, to.x) && cardCentre.x <= Math.max(from.x, to.x)
      && cardCentre.y >= Math.min(from.y, to.y) && cardCentre.y <= Math.max(from.y, to.y);
    if (isOnRun) return headingOf(from, to);
  }
  return headingOf(points[0], points[points.length - 1]);
}

function keepInside(card: Box, frame: DiagramFrame, metrics: DiagramMetrics): Box {
  const maxX = Math.max(metrics.margin, frame.width - metrics.margin - card.width);
  return { ...card, x: Math.max(metrics.margin, Math.min(maxX, card.x)) };
}

function routeOne(plan: EdgePlan, frame: DiagramFrame, metrics: DiagramMetrics, portX: ReadonlyMap<string, number>): EdgeLine {
  const drawn = plan.kind === 'lane' ? lanePoints(plan, frame, metrics, portX) : straightPoints(plan, frame, metrics);
  const points = withoutRepeats(drawn.points);
  const card = boxAround(drawn.cardCentre, metrics.cardWidth, cardHeightFor(plan.link.payloadCount, metrics));
  return {
    id: plan.link.id, label: plan.link.label, fromId: plan.from.id, toId: plan.to.id,
    points, path: roundedPath(points, metrics.cornerRadius),
    card: keepInside(card, frame, metrics), heading: headingAcross(points, drawn.cardCentre), payloadCount: plan.link.payloadCount,
  };
}

export function routeEdges(plan: RoutingPlan, frame: DiagramFrame, metrics: DiagramMetrics): EdgeLine[] {
  const portX = placePorts(plan, frame, metrics);
  return settleLabels(plan.plans.map((edge) => routeOne(edge, frame, metrics, portX)), metrics.cardStub);
}
