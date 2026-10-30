import { useCallback, useState } from 'react';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import { doiAddress } from '@/lib/anatomy/literature-readers';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { H01Card as H01CardData, H01Fact } from '@/lib/anatomy/parse-h01-card';
import { H01_CARD_PATH } from '@/lib/anatomy/parse-h01-card';
import Disclosure from './Disclosure';
import { loadH01Card } from './explorer-companions';
import LimitNote from './LimitNote';
import LoadNotice from './LoadNotice';
import { useLoaded } from './use-loaded';

function Fact({ fact }: { fact: H01Fact }) {
  return (
    <li className="atlas-related">
      <p className="atlas-fact">{fact.fact}</p>
      <blockquote className="atlas-quote"><p>&ldquo;{fact.quote}&rdquo;</p><footer>{fact.source_description}, {fact.quote_location}.</footer></blockquote>
    </li>
  );
}

function CardBody({ card }: { card: H01CardData }) {
  const factsById = new Map(card.facts.map((fact) => [fact.id, fact]));
  return (
    <div className="atlas-h01">
      <h3 className="atlas-subheading">{card.card.title}</h3>
      <ol className="atlas-h01-sentences">
        {card.card.sentences.map((sentence) => (
          <li key={sentence.text}>
            <p className="atlas-fact">{sentence.text}</p>
            <Disclosure label={`Sources for this sentence (${sentence.fact_ids.length})`}>
              <ul className="atlas-plain-list">{sentence.fact_ids.flatMap((factId) => factsById.get(factId) ?? []).map((fact) => <Fact key={fact.id} fact={fact} />)}</ul>
            </Disclosure>
          </li>
        ))}
      </ol>
      <h4 className="atlas-minor-heading">Figures that differ between sources</h4>
      <ul className="atlas-plain-list">
        {card.numbers_that_differ_by_source.map((number) => (
          <li key={number.quantity} className="atlas-fact"><strong>{number.quantity}:</strong> {number.values.map((entry) => entry.value).join('; ')}. {number.note}</li>
        ))}
      </ul>
      <h4 className="atlas-minor-heading">What this sample does not show</h4>
      <ul className="atlas-plain-list" data-caveats="true">{card.visitor_caveats.map((caveat) => <li key={caveat.must_not_imply_index} className="atlas-row-why">{caveat.text}</li>)}</ul>
      <p className="atlas-citation">
        {card.card.attribution_line}{' '}
        <a href={doiAddress(card.paper.doi)} target="_blank" rel="noopener noreferrer">Paper</a>{' '}
        <a href={card.release_page} target="_blank" rel="noopener noreferrer">Data release</a>
      </p>
    </div>
  );
}

/** A card about the H01 sample of human cortex. Its file is fetched only when the card is opened. */
interface Props {
  model: ExplorerModel;
}

export default function H01Card({ model }: Props) {
  const [isWanted, setWanted] = useState(false);
  const load = useCallback((signal: AbortSignal) => loadH01Card(model, signal), [model]);
  const { state, retry } = useLoaded(load, isWanted, H01_CARD_PATH);
  return (
    <section className="atlas-panel" aria-labelledby="atlas-h01-heading">
      <h2 className="atlas-heading" id="atlas-h01-heading">A real sample at nanometre scale</h2>
      <LimitNote limit={limitSentence('h01_sample')} />
      <Disclosure label="About the H01 sample" onFirstOpen={() => setWanted(true)}>
        <LoadNotice what="the H01 card" state={state} onRetry={retry} />
        {state.status === 'ready' && <CardBody card={state.data} />}
      </Disclosure>
    </section>
  );
}
