/**
 * Decides, on the grid alone, how each connection travels: straight between two neighbours,
 * or along a lane in the space above, below or between rows of parts. No pixel is involved
 * here, so the sizes of the drawing can follow from what the plan needs.
 *
 * A lane runs where no part can be, and a connection reaches it straight up or down from the
 * edge of its part, so a planned connection never passes through a part.
 */

export interface GridNode {
  id: string;
  label: string;
  /** Column: the trust zone, from the tissue side outward. */
  col: number;
  /** Row: the part's place among the parts of its zone. */
  row: number;
  isTissueContact: boolean;
}

export interface GridLink {
  id: string;
  label: string;
  fromId: string;
  toId: string;
  /** How many of the modelled payloads the connection carries; sets the height of its label. */
  payloadCount: number;
}

interface PlanEnds { link: GridLink; from: GridNode; to: GridNode }

/** A straight line between two parts in the same row with nothing between them, or two parts stacked in one zone. */
export interface StraightPlan extends PlanEnds { kind: 'row' | 'column' }

/** Where a connection changes rows: in the gap to the right of column `gutter`, then along a second lane. */
export interface LaneTurn { gutter: number; slot: number; toChannel: number; toLane: number }

/** Channel `n` is the space above row `n`; the last channel is below the last row. */
export interface LanePlan extends PlanEnds { kind: 'lane'; fromChannel: number; fromLane: number; turn: LaneTurn | null }

export type EdgePlan = StraightPlan | LanePlan;

export interface RoutingPlan {
  plans: EdgePlan[];
  /** Lanes in use per channel. */
  laneCounts: number[];
  /** Connections turning in the gap to the right of each column. */
  gutterSlots: number[];
}

/** A stretch of a lane, in doubled column units so the gap right of column `c` is `2c + 1`. */
interface Span { lo: number; hi: number; loNodeId: string | null; hiNodeId: string | null }

function spanBetween(first: { at: number; nodeId: string | null }, second: { at: number; nodeId: string | null }): Span {
  const [lo, hi] = first.at <= second.at ? [first, second] : [second, first];
  return { lo: lo.at, hi: hi.at, loNodeId: lo.nodeId, hiNodeId: hi.nodeId };
}

/** Two stretches may share a lane when they do not overlap; they may meet end to end only on the same part. */
function doSpansConflict(first: Span, second: Span): boolean {
  if (first.lo < second.hi && second.lo < first.hi) return true;
  if (first.lo === second.lo && first.hi === second.hi) return true;
  const meeting = first.hi === second.lo ? [first.hiNodeId, second.loNodeId] : first.lo === second.hi ? [first.loNodeId, second.hiNodeId] : null;
  return meeting !== null && (meeting[0] === null || meeting[0] !== meeting[1]);
}

class LaneBook {
  private readonly channels: Span[][][];

  constructor(channelCount: number) {
    this.channels = Array.from({ length: channelCount }, () => []);
  }

  /** The first lane of the channel the stretch fits in, without taking it. */
  firstFit(channel: number, span: Span): number {
    const lanes = this.channels[channel];
    const index = lanes.findIndex((lane) => lane.every((taken) => !doSpansConflict(taken, span)));
    return index === -1 ? lanes.length : index;
  }

  take(channel: number, span: Span): number {
    const lane = this.firstFit(channel, span);
    const lanes = this.channels[channel];
    if (lane === lanes.length) lanes.push([]);
    lanes[lane].push(span);
    return lane;
  }

  laneCounts(): number[] {
    return this.channels.map((lanes) => lanes.length);
  }
}

function planStraight(ends: PlanEnds, nodes: readonly GridNode[], takenSides: Set<string>): StraightPlan | null {
  const { from, to } = ends;
  const claim = (kind: 'row' | 'column', firstSide: string, secondSide: string): StraightPlan | null => {
    if (takenSides.has(firstSide) || takenSides.has(secondSide)) return null;
    takenSides.add(firstSide).add(secondSide);
    return { ...ends, kind };
  };
  if (from.row === to.row && from.col !== to.col) {
    const [left, right] = from.col < to.col ? [from, to] : [to, from];
    const isBlocked = nodes.some((node) => node.row === from.row && node.col > left.col && node.col < right.col);
    return isBlocked ? null : claim('row', `${left.id}:right`, `${right.id}:left`);
  }
  if (from.col === to.col && Math.abs(from.row - to.row) === 1) {
    const [upper, lower] = from.row < to.row ? [from, to] : [to, from];
    return claim('column', `${upper.id}:bottom`, `${lower.id}:top`);
  }
  return null;
}

/** The gap a connection turns in when its ends are not one lane apart: beside the part it is going to. */
function gutterFor(from: GridNode, to: GridNode): number {
  if (from.col < to.col) return to.col - 1;
  return to.col;
}

function planLane(ends: PlanEnds, book: LaneBook, gutterSlots: number[]): LanePlan {
  const { from, to } = ends;
  const fromEnd = { at: 2 * from.col, nodeId: from.id };
  const toEnd = { at: 2 * to.col, nodeId: to.id };
  if (from.row === to.row) {
    // Above or below the row, whichever leaves the connection nearer its parts; above when equal.
    const span = spanBetween(fromEnd, toEnd);
    const [above, below] = [from.row, from.row + 1];
    const channel = book.firstFit(below, span) < book.firstFit(above, span) ? below : above;
    return { ...ends, kind: 'lane', fromChannel: channel, fromLane: book.take(channel, span), turn: null };
  }
  const isGoingDown = from.row < to.row;
  const fromChannel = isGoingDown ? from.row + 1 : from.row;
  const toChannel = isGoingDown ? to.row : to.row + 1;
  if (fromChannel === toChannel) {
    return { ...ends, kind: 'lane', fromChannel, fromLane: book.take(fromChannel, spanBetween(fromEnd, toEnd)), turn: null };
  }
  const gutter = gutterFor(from, to);
  const turnEnd = { at: 2 * gutter + 1, nodeId: null };
  const slot = gutterSlots[gutter];
  gutterSlots[gutter] += 1;
  return {
    ...ends, kind: 'lane', fromChannel, fromLane: book.take(fromChannel, spanBetween(fromEnd, turnEnd)),
    turn: { gutter, slot, toChannel, toLane: book.take(toChannel, spanBetween(turnEnd, toEnd)) },
  };
}

function spanLength(ends: PlanEnds): number {
  return Math.abs(ends.from.col - ends.to.col) + Math.abs(ends.from.row - ends.to.row);
}

/** Plans every connection whose two ends are parts of the model. A connection with a missing end is left out. */
export function planEdges(nodes: readonly GridNode[], links: readonly GridLink[]): RoutingPlan {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const columnCount = Math.max(0, ...nodes.map((node) => node.col + 1));
  const rowCount = Math.max(0, ...nodes.map((node) => node.row + 1));
  const takenSides = new Set<string>();
  const planByLinkId = new Map<string, EdgePlan>();
  const laneEnds: PlanEnds[] = [];
  for (const link of links) {
    const from = nodeById.get(link.fromId);
    const to = nodeById.get(link.toId);
    if (from === undefined || to === undefined) continue;
    const straight = planStraight({ link, from, to }, nodes, takenSides);
    if (straight === null) laneEnds.push({ link, from, to });
    else planByLinkId.set(link.id, straight);
  }
  // Short connections take the lanes nearest the parts, so long ones pass outside them.
  const book = new LaneBook(rowCount + 1);
  const gutterSlots = Array.from({ length: columnCount }, () => 0);
  for (const ends of [...laneEnds].sort((first, second) => spanLength(first) - spanLength(second))) {
    planByLinkId.set(ends.link.id, planLane(ends, book, gutterSlots));
  }
  const plans = links.flatMap((link) => { const plan = planByLinkId.get(link.id); return plan === undefined ? [] : [plan]; });
  return { plans, laneCounts: book.laneCounts(), gutterSlots };
}
