/**
 * The statements that stay on screen in every mode. They live in one place so no screen
 * can drop or reword them.
 */
export const STANDING_STATEMENTS: readonly string[] = [
  'A drafting aid, not a compliance determination.',
  'TARA, NISS and QIF are proposed and not peer reviewed.',
  'Placement decisions were drafted with an AI assistant and have not yet been reviewed by the author.',
  'Runs in your browser. Nothing you enter is sent anywhere.',
];

/** What a narrow screen shows before the reader opens the rest. */
const BRIEF_STATEMENT = 'Proposed, not peer reviewed. Placement decisions not yet reviewed.';
const SITE_PATH = '/atlas/';

interface Props {
  catalogVersion: string;
  techniqueCount: number;
}

export default function StandingLine({ catalogVersion, techniqueCount }: Props) {
  const catalogFact = `Catalog version ${catalogVersion}, ${techniqueCount} techniques.`;
  return (
    <div className="lab-standing">
      <p className="lab-standing-full">{STANDING_STATEMENTS.join(' ')} {catalogFact}</p>
      <details className="lab-standing-brief">
        <summary>{BRIEF_STATEMENT} <span className="lab-standing-more">More</span></summary>
        <ul>
          {STANDING_STATEMENTS.map((statement) => <li key={statement}>{statement}</li>)}
          <li>{catalogFact}</li>
          <li><a href={SITE_PATH}>Back to the site</a></li>
        </ul>
      </details>
    </div>
  );
}
