/**
 * Every size the device diagram is laid out with, in CSS pixels. The drawing is rendered at
 * one pixel per unit and scrolls inside its container, so the type sizes in the stylesheet
 * are the sizes on screen whatever the device looks like.
 */

export interface DiagramMetrics {
  nodeWidth: number;
  nodeHeight: number;
  /** How far a zone's band reaches past its parts on each side. */
  zonePadding: number;
  /** Room at the top of each band for the zone's name. */
  zoneHeader: number;
  margin: number;
  /** Space between two columns of parts when no connection label sits in it. */
  gapNarrow: number;
  /** A connection's label card. Zero width means no card is drawn. */
  cardWidth: number;
  /** Line left showing on each side of a card that sits on a straight connection. */
  cardStub: number;
  /** Card height with no payload line: padding, the medium, and the badge. */
  cardBaseHeight: number;
  /** Height each payload line adds to a card. */
  cardLineHeight: number;
  /** Smallest space between two rows of parts, and above the first and below the last. */
  channelMin: number;
  /** Space a lane keeps beyond the card on it, and the height of a lane with no card. */
  lanePadding: number;
  /** Distance between two connections leaving the same edge of a part. */
  portStep: number;
  /** Distance between two connections that turn in the same gap between columns. */
  gutterStep: number;
  cornerRadius: number;
}

export const FULL_METRICS: DiagramMetrics = {
  nodeWidth: 160,
  nodeHeight: 84,
  zonePadding: 12,
  zoneHeader: 28,
  margin: 12,
  gapNarrow: 48,
  cardWidth: 164,
  cardStub: 10,
  cardBaseHeight: 50,
  cardLineHeight: 16,
  channelMin: 12,
  lanePadding: 16,
  portStep: 14,
  gutterStep: 10,
  cornerRadius: 8,
};

/** Height of the badge row on a connection's label, with the space above it. */
const CARD_BADGE_ROW = 18;

/** The full-size drawing when no element has a badge: connection labels do not keep an empty row for one. */
export const UNBADGED_METRICS: DiagramMetrics = { ...FULL_METRICS, cardBaseHeight: FULL_METRICS.cardBaseHeight - CARD_BADGE_ROW };

/** The miniature on a card: the same layout with no text, so it carries no label that could fall under 12px. */
export const MINI_METRICS: DiagramMetrics = {
  nodeWidth: 30,
  nodeHeight: 20,
  zonePadding: 5,
  zoneHeader: 0,
  margin: 2,
  gapNarrow: 16,
  cardWidth: 0,
  cardStub: 6,
  cardBaseHeight: 0,
  cardLineHeight: 0,
  channelMin: 6,
  lanePadding: 8,
  portStep: 5,
  gutterStep: 4,
  cornerRadius: 3,
};

/** Characters a part's name may run to on one line at the label size, and how many lines it may take. */
export const LABEL_LINE_CHARACTERS = 19;
export const LABEL_LINE_COUNT = 2;

export function cardHeightFor(payloadCount: number, metrics: DiagramMetrics): number {
  return metrics.cardWidth === 0 ? 0 : metrics.cardBaseHeight + payloadCount * metrics.cardLineHeight;
}
