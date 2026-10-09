import { STANDING_STATEMENTS } from './standing-statements';

export { STANDING_STATEMENTS };

const SITE_PATH = '/atlas/';

interface Props {
  catalogVersion: string;
  techniqueCount: number;
  /** On a narrow screen the top bar has no room for the way back to the site, so it is listed here. */
  hasSiteLink?: boolean;
}

/** The standing statements as shown on screen and on paper. Every statement is whole at every size. */
export default function StandingLine({ catalogVersion, techniqueCount, hasSiteLink = false }: Props) {
  const catalogFact = `Catalog version ${catalogVersion}, ${techniqueCount} techniques.`;
  return (
    <div className="lab-standing">
      <ul className="lab-standing-full" aria-label="What TARA Lab is and is not">
        {STANDING_STATEMENTS.map((statement) => <li key={statement}>{statement}</li>)}
        <li>{catalogFact}</li>
      </ul>
      {hasSiteLink && <a className="lab-standing-site" href={SITE_PATH}>Back to the site</a>}
    </div>
  );
}
