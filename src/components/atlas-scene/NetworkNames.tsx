import type { IndexSubject } from '@/lib/anatomy/anatomy-index-types';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import LimitNote from './LimitNote';

interface Props {
  networks: readonly IndexSubject[];
}

/** The network names QIF records, as labels only: no shapes, and nothing to select. */
export default function NetworkNames({ networks }: Props) {
  return (
    <section className="atlas-panel" aria-labelledby="atlas-networks-heading">
      <h2 className="atlas-heading" id="atlas-networks-heading">Network names</h2>
      <LimitNote limit={limitSentence('networks_names_only')} />
      {networks.length === 0
        ? <p className="atlas-fact">The index records no network names.</p>
        : <ul className="atlas-labels">{networks.map((network) => <li key={network.id} className="atlas-name-label">{network.name}</li>)}</ul>}
    </section>
  );
}
