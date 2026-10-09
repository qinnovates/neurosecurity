import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import Panel from '../Panel';
import { BOUNDARY_CONTRAST_MINIMUM, TEXT_CONTRAST_MINIMUM, compositeOver, contrastRatio, parseColour } from '../contrast';

interface ColourToken {
  name: string;
  use: string;
  /** What the token must be told apart from, when it carries text or an edge. */
  measure?: { against: string; minimum: number };
}

const ON_PANEL_TEXT = { against: '--lab-panel', minimum: TEXT_CONTRAST_MINIMUM } as const;
const ON_PANEL_EDGE = { against: '--lab-panel', minimum: BOUNDARY_CONTRAST_MINIMUM } as const;

const COLOUR_TOKENS: readonly ColourToken[] = [
  { name: '--lab-ground', use: 'Page ground' },
  { name: '--lab-panel', use: 'Panels, fields' },
  { name: '--lab-panel-raised', use: 'Drawers, popovers' },
  { name: '--lab-material', use: 'Translucent bars' },
  { name: '--lab-ink', use: 'Text, marks', measure: ON_PANEL_TEXT },
  { name: '--lab-ink-soft', use: 'Labels, quiet rows', measure: ON_PANEL_TEXT },
  { name: '--lab-ink-faint', use: 'Least text', measure: ON_PANEL_TEXT },
  { name: '--lab-line', use: 'Dividers' },
  { name: '--lab-control-line', use: 'Field and button edges', measure: ON_PANEL_EDGE },
  { name: '--lab-hover', use: 'Hovered and lit rows' },
  { name: '--lab-select', use: 'Selected, links', measure: ON_PANEL_TEXT },
  { name: '--lab-select-ink', use: 'Words on a selected fill', measure: { against: '--lab-select', minimum: TEXT_CONTRAST_MINIMUM } },
  { name: '--lab-select-soft', use: 'Selected row' },
  { name: '--lab-focus', use: 'Focus ring', measure: ON_PANEL_EDGE },
  { name: '--lab-critical', use: 'Critical stripe only', measure: ON_PANEL_EDGE },
  { name: '--lab-caution', use: 'Notice borders only', measure: ON_PANEL_EDGE },
  { name: '--lab-flow', use: 'Payload tracks', measure: ON_PANEL_EDGE },
];
const TYPE_TOKENS = ['--lab-text-meta', '--lab-text-body', '--lab-text-title', '--lab-text-screen', '--lab-text-figure'] as const;
const RADIUS_TOKENS = ['--lab-radius-s', '--lab-radius-m', '--lab-radius-l'] as const;
const SPACE_TOKENS = ['--lab-gap', '--lab-pad', '--lab-row'] as const;
const DURATION_TOKENS = ['--lab-dur-1', '--lab-dur-2', '--lab-dur-3'] as const;
const EASING_TOKENS = ['--lab-ease', '--lab-spring'] as const;
const ALL_TOKEN_NAMES = [...COLOUR_TOKENS.map((entry) => entry.name), ...TYPE_TOKENS, ...RADIUS_TOKENS, ...SPACE_TOKENS, ...DURATION_TOKENS, ...EASING_TOKENS, '--lab-font', '--lab-mono', '--lab-measure'];

type TokenValues = ReadonlyMap<string, string>;

/** Reads each token as the browser resolves it inside this theme, so the page prints the stylesheet's values and none of its own. */
function useTokenValues(): { hostRef: RefObject<HTMLDivElement | null>; values: TokenValues | null } {
  const hostRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<TokenValues | null>(null);
  useEffect(() => {
    if (hostRef.current === null) return;
    const computed = getComputedStyle(hostRef.current);
    setValues(new Map(ALL_TOKEN_NAMES.map((name) => [name, computed.getPropertyValue(name).trim()])));
  }, []);
  return { hostRef, values };
}

/** The measured ratio of a token against what it sits on, with translucent colours laid over the panel first. Empty until the stylesheet has given every value. */
function measureToken(values: TokenValues, token: ColourToken): string {
  if (token.measure === undefined) return '';
  const [foreground, against, panel] = [token.name, token.measure.against, '--lab-panel'].map((name) => values.get(name) ?? '');
  if (foreground === '' || against === '' || panel === '') return '';
  const background = compositeOver(parseColour(against), parseColour(panel));
  const ratio = contrastRatio(parseColour(foreground), background);
  return ` · ${ratio.toFixed(2)}:1 on ${token.measure.against.replace('--lab-', '')} (needs ${token.measure.minimum}:1)`;
}

function MotionSpecimen({ values }: { values: TokenValues }) {
  const [isMoved, setMoved] = useState(false);
  return (
    <div className="kit-stack">
      <div className="kit-row">
        <button type="button" className="lab-button" onClick={() => setMoved((current) => !current)}>Move once</button>
        <span className="lab-soft">Nothing here moves until this is pressed.</span>
      </div>
      {DURATION_TOKENS.map((duration, index) => {
        const easing = EASING_TOKENS[index % EASING_TOKENS.length];
        return (
          <div key={duration}>
            <span className="lab-id">{duration} {values.get(duration)}, {easing}</span>
            <div className="kit-track"><div className="kit-runner" data-moved={isMoved} style={{ '--kit-duration': `var(${duration})`, '--kit-easing': `var(${easing})` } as CSSProperties} /></div>
          </div>
        );
      })}
    </div>
  );
}

/** Every token, drawn in the theme of the column it sits in, with the value the stylesheet gives it. */
export default function TokenSpecimens() {
  const { hostRef, values } = useTokenValues();
  return (
    <div className="kit-stack" ref={hostRef}>
      <Panel title="Colour">
        <table className="kit-tokens">
          <thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col">Use and measured contrast</th></tr></thead>
          <tbody>
            {COLOUR_TOKENS.map((token) => (
              <tr key={token.name}>
                <td><span className="kit-swatch" style={{ background: `var(${token.name})` }} /> <span className="lab-id">{token.name}</span></td>
                <td className="lab-id">{values?.get(token.name)}</td>
                <td>{token.use}{values !== null && <span className="lab-soft">{measureToken(values, token)}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      {values !== null && (
        <div className="kit-grid">
          <Panel title="Type">
            <p className="lab-id">--lab-font {values.get('--lab-font')}</p>
            {TYPE_TOKENS.map((name) => <p key={name} style={{ fontSize: `var(${name})` }}>{name.replace('--lab-text-', '')} {values.get(name)}</p>)}
            <p><b>Weight 600</b> and weight 400. <span className="lab-id">--lab-mono</span> is for identifiers and code only.</p>
            <p className="lab-soft">Prose is capped at {values.get('--lab-measure')}.</p>
          </Panel>
          <Panel title="Shape, space and depth">
            <div className="kit-row">
              {RADIUS_TOKENS.map((name) => <span key={name} className="kit-shape lab-id" style={{ borderRadius: `var(${name})` }}>{values.get(name)}</span>)}
            </div>
            <p className="lab-id">{SPACE_TOKENS.map((name) => `${name} ${values.get(name)}`).join(' · ')}</p>
            <div className="kit-float">Floating layers carry <span className="lab-id">--lab-shadow-float</span>. Panels are flat.</div>
            <div className="kit-material-stage">
              <div className="kit-material-bar lab-material lab-label">A bar in <span className="lab-id">--lab-material</span>; scroll the text beneath it</div>
              {COLOUR_TOKENS.map((token) => <p key={token.name}>{token.use}</p>)}
            </div>
          </Panel>
          <Panel title="Motion">
            <MotionSpecimen values={values} />
          </Panel>
        </div>
      )}
    </div>
  );
}
