import { limitSentence } from '@/lib/anatomy/limits-copy';
import { NOT_TO_SCALE_END_MM, SCALE_BAR_MM, SOURCE_KIND_WORDS, isLinkable, type LeadFigure as LeadFigureData } from '@/lib/atlas-explorer/lead-figure';
import LimitNote from './LimitNote';
import ReviewMark from './ReviewMark';

interface Props {
  figure: LeadFigureData;
  /** The longest run of contacts among the leads shown, so every lead is drawn at one scale. */
  widestSpanMm: number;
}

/** The drawing's own units are millimetres, so a contact 1.5 mm long is 1.5 units long. */
const MARGIN_MM = 0.5;
const ROW_GAP_MM = 1.1;
const BAR_TICK_MM = 0.35;
const LABEL_SIZE_MM = 0.7;

/**
 * One lead, lying on its side: contacts and thickness to scale, both ends
 * drawn broken because the sources give no tip length and the lead runs on.
 * It is a drawing of an object. It has no place in the brain.
 */
function LeadDrawing({ figure, widestSpanMm }: Props) {
  const { shape } = figure;
  const width = widestSpanMm + NOT_TO_SCALE_END_MM * 2 + MARGIN_MM * 2;
  const top = MARGIN_MM;
  const barY = top + shape.diameter_mm + ROW_GAP_MM;
  const height = barY + BAR_TICK_MM + LABEL_SIZE_MM + MARGIN_MM;
  const startX = MARGIN_MM + NOT_TO_SCALE_END_MM;
  return (
    <svg
      className="atlas-lead-drawing" viewBox={`0 0 ${width} ${height}`} role="img" data-lead-drawing={figure.id}
      aria-label={`${figure.name}: ${shape.contacts.length} contacts along ${shape.contact_span_mm} mm, ${shape.diameter_mm} mm thick, drawn to scale with a ${SCALE_BAR_MM} mm bar. ${figure.reviewState.mark}.`}
    >
      <rect className="atlas-lead-body" x={startX} y={top} width={shape.contact_span_mm} height={shape.diameter_mm} />
      <rect className="atlas-lead-end" x={MARGIN_MM} y={top} width={NOT_TO_SCALE_END_MM} height={shape.diameter_mm} />
      <rect className="atlas-lead-end" x={startX + shape.contact_span_mm} y={top} width={NOT_TO_SCALE_END_MM} height={shape.diameter_mm} />
      {shape.contacts.map((contact) => (
        <rect key={contact.start_mm} className="atlas-lead-contact" x={startX + contact.start_mm} y={top} width={contact.end_mm - contact.start_mm} height={shape.diameter_mm} />
      ))}
      <path className="atlas-lead-bar" data-scale-bar-mm={SCALE_BAR_MM} d={`M${startX} ${barY - BAR_TICK_MM}V${barY + BAR_TICK_MM}M${startX} ${barY}H${startX + SCALE_BAR_MM}M${startX + SCALE_BAR_MM} ${barY - BAR_TICK_MM}V${barY + BAR_TICK_MM}`} />
      <text className="atlas-lead-label" x={startX + SCALE_BAR_MM + BAR_TICK_MM} y={barY + LABEL_SIZE_MM / 3} fontSize={LABEL_SIZE_MM}>{SCALE_BAR_MM} mm</text>
    </svg>
  );
}

/** A citation, linked to its source when the address is an https one, and as plain words otherwise. */
export function Citation({ citation, url }: { citation: string; url: string }) {
  return isLinkable(url) ? <a href={url} rel="noopener noreferrer">{citation}</a> : <>{citation}</>;
}

/** Each number with where it was read and what kind of source that is. */
function DimensionTable({ figure }: Pick<Props, 'figure'>) {
  return (
    <div className="atlas-table-wrap">
      <table className="atlas-table" data-lead-table={figure.id}>
        <caption className="sr-only">Dimensions of the {figure.name}, with the source of each number</caption>
        <thead><tr><th scope="col">Dimension</th><th scope="col">Value</th><th scope="col">Source</th><th scope="col">Kind of source</th></tr></thead>
        <tbody>
          {figure.rows.map((row) => (
            <tr key={row.field} data-dimension={row.field}>
              <th scope="row">{row.words}</th>
              <td>{row.value}</td>
              <td>
                {row.sources.length === 0 && 'No source is recorded for this number.'}
                {row.sources.map((source) => <p key={`${source.url}:${source.citation}`} className="atlas-source"><Citation citation={source.citation} url={source.url} /></p>)}
              </td>
              <td>{[...new Set(row.sources.map((source) => SOURCE_KIND_WORDS[source.kind]))].join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A lead beside the brain: its drawing, its review state, and its table. Never drawn without the review state. */
export default function LeadFigure({ figure, widestSpanMm }: Props) {
  return (
    <figure className="atlas-lead" data-lead-id={figure.id}>
      <figcaption className="atlas-fact"><strong>{figure.name}</strong> <ReviewMark state={figure.reviewState} /></figcaption>
      <LeadDrawing figure={figure} widestSpanMm={widestSpanMm} />
      <DimensionTable figure={figure} />
    </figure>
  );
}

/** The sentences that go with every lead drawing, shown once above them. */
export function LeadLimits() {
  return (
    <>
      <LimitNote limit={limitSentence('device_lead')} />
      <LimitNote limit={limitSentence('device_lead_scale', { length: String(SCALE_BAR_MM) })} />
      <LimitNote limit={limitSentence('device_lead_panel')} />
    </>
  );
}
