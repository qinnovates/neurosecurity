import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { LENS_DESCRIPTIONS, LENS_LABELS, LENS_SUBJECT_NOUNS, lensNeedsSubject, lensSubjectId, type Lens, type LensKind } from '@/lib/atlas-explorer/lens-state';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import { limitsForLens } from '@/lib/atlas-explorer/limit-selection';
import type { LensTally } from '@/lib/atlas-explorer/region-rows';
import { listSubjectOptions } from '@/lib/atlas-explorer/subject-options';
import { summariseTechnique, type TechniqueSummary } from '@/lib/atlas-explorer/technique-summary';
import ColourModePicker from './ColourModePicker';
import HighlightPicker from './HighlightPicker';
import LimitNote from './LimitNote';
import SubjectPicker from './SubjectPicker';

interface Props {
  model: ExplorerModel;
  lens: Lens;
  /** The lens before the last change of kind, or null: with one, the panel offers the way back to it. */
  previousLens: Lens | null;
  tally: LensTally;
  onChooseKind: (kind: LensKind) => void;
  onRestoreLens: () => void;
  onChooseSubject: (kind: LensKind, subjectId: string) => void;
  onSelectRegion: (regionId: string) => void;
}

/** The heading a drill-down from the region's details lands on while the picture is closed. */
export const LENS_HEADING_ID = 'atlas-lens-heading';

/** "Back to the Band lens". */
export function restoreLensLabel(previousLens: Lens): string {
  return `Back to the ${LENS_LABELS[previousLens.kind]} lens`;
}

/** The lens kinds a highlight drives, so the picker can show which one is carrying the colour, and so a fact lens's own `SubjectPicker` is never shown beside it for the same subject. */
const HIGHLIGHT_KINDS: readonly LensKind[] = ['technique', 'stated_targets'];

function RegionButtons({ regions, onSelectRegion }: { regions: ReadonlyArray<{ id: string; name: string }>; onSelectRegion: (regionId: string) => void }) {
  return (
    <ul className="atlas-chips">
      {regions.map((region) => <li key={region.id}><button type="button" className="atlas-chip" onClick={() => onSelectRegion(region.id)}>{region.name}</button></li>)}
    </ul>
  );
}

/** The chosen technique in words: what it is linked to, and what its text names that the atlas cannot show. */
function TechniqueFacts({ summary, onSelectRegion }: { summary: TechniqueSummary; onSelectRegion: (regionId: string) => void }) {
  return (
    <div className="atlas-subject" data-technique-kind={summary.kind}>
      <p className="atlas-fact">
        <strong>{summary.name}</strong> <span className="atlas-id">{summary.id}</span>. Bands: {summary.bandNames}.
      </p>
      {summary.linkedRegions.length > 0 && <><p className="atlas-label">Linked regions</p><RegionButtons regions={summary.linkedRegions} onSelectRegion={onSelectRegion} /></>}
      {summary.namedNotCounted.length > 0 && (
        <>
          <p className="atlas-label">Named, not counted</p>
          <ul className="atlas-plain-list">
            {summary.namedNotCounted.map((entry) => (
              <li key={`${entry.id}:${entry.term}`} className="atlas-row-why">
                <button type="button" className="atlas-link-button" onClick={() => onSelectRegion(entry.id)}>{entry.name}</button> (&ldquo;{entry.term}&rdquo;): {entry.reason}.
              </li>
            ))}
          </ul>
        </>
      )}
      {summary.unresolvedTerms.length > 0 && (
        <p className="atlas-row-why">Named in the catalog text but not shown, because the atlas file has no region for them: {summary.unresolvedTerms.map((term) => `"${term}"`).join(', ')}.</p>
      )}
    </div>
  );
}

function LensSummary({ lens, tally }: Pick<Props, 'lens' | 'tally'>) {
  if (lens.kind === 'band' || (lensNeedsSubject(lens.kind) && lensSubjectId(lens) === null)) return null;
  return (
    <>
      <p className="atlas-fact atlas-tally" data-tally="true">
        {tally.withValue} {tally.withValue === 1 ? 'region has' : 'regions have'} a value under this lens, {tally.namedNotCounted} named but not counted, {tally.noData} with no data.
      </p>
      {tally.withValue === 0 && tally.namedNotCounted === 0 && <LimitNote limit={limitSentence('lens_no_data')} />}
    </>
  );
}

/**
 * The lens controls with everything that qualifies them in the same group: the
 * four lens buttons, the one highlight picker that searches techniques and
 * devices together, the limit sentences for the lens as it stands, a fact
 * lens's own subject where it has one, and a count of what the lens shows.
 *
 * Lens and highlight are two different questions. A lens says what a colour
 * means — a fact the index holds about every region. A highlight says what to
 * pick out, and the regions linked to it light up. They were one row of five
 * buttons, three of which coloured nothing until a subject had been found.
 */
export default function LensPanel({ model, lens, previousLens, tally, onChooseKind, onRestoreLens, onChooseSubject, onSelectRegion }: Props) {
  // A highlight kind's noun is used elsewhere (the way back from a drill-down names it), but its own picker here is the HighlightPicker below, not a SubjectPicker.
  const noun = HIGHLIGHT_KINDS.includes(lens.kind) ? undefined : LENS_SUBJECT_NOUNS[lens.kind];
  const subjectId = lensSubjectId(lens);
  const summary = lens.kind === 'technique' && subjectId !== null ? summariseTechnique(model, subjectId) : null;
  const highlightId = HIGHLIGHT_KINDS.includes(lens.kind) ? subjectId : null;
  return (
    <section className="atlas-panel atlas-lens-panel" aria-labelledby="atlas-lens-heading" data-lens={lens.kind}>
      <h2 className="atlas-heading" id={LENS_HEADING_ID} tabIndex={-1}>Lens</h2>
      <ColourModePicker activeKind={lens.kind} onChoose={onChooseKind} />
      <p className="atlas-lens-what" data-lens-description={lens.kind}>
        {LENS_DESCRIPTIONS[lens.kind]}
        {previousLens !== null && <> <button type="button" className="atlas-link-button" onClick={onRestoreLens}>{restoreLensLabel(previousLens)}</button></>}
      </p>
      <div className="atlas-lens-body" key={lens.kind}>
        <div className="atlas-lens-limits">
          {limitsForLens(model, lens).map((limit) => <LimitNote key={limit.id} limit={limit} />)}
          <LensSummary lens={lens} tally={tally} />
          {subjectId !== null && lens.kind !== 'technique' && <p className="atlas-fact">{LENS_LABELS[lens.kind]}: <strong>{subjectId.replaceAll('_', ' ')}</strong></p>}
          {summary !== null && <TechniqueFacts summary={summary} onSelectRegion={onSelectRegion} />}
        </div>
        {noun !== undefined && (
          <SubjectPicker noun={noun} options={listSubjectOptions(model, lens.kind)} chosenId={subjectId} onChoose={(chosenId) => onChooseSubject(lens.kind, chosenId)} />
        )}
        <HighlightPicker model={model} chosenId={highlightId} onChoose={onChooseSubject} />
      </div>
    </section>
  );
}
