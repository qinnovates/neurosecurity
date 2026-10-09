/**
 * The statements that stay on screen in every mode. They live in one place so no screen
 * can drop or reword them. Every statement is shown whole at every screen size.
 */
export const STANDING_STATEMENTS: readonly string[] = [
  'A drafting aid, not a compliance determination.',
  'TARA, NISS and QIF are proposed and not peer reviewed.',
  'Placement decisions were drafted with an AI assistant and have not yet been reviewed by the author.',
  'Runs in your browser. Nothing you enter is sent anywhere.',
];

const SITE_PATH = '/atlas/';

interface Props {
  catalogVersion: string;
  techniqueCount: number;
  /** On a narrow screen the top bar has no room for the way back to the site, so it is listed here. */
  hasSiteLink?: boolean;
}

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
