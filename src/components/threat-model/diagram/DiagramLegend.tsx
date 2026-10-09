import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import Legend, { type LegendItem } from '@/components/lab-kit/Legend';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { CATALOG_SEVERITY_LABELS } from '@/lib/threat-model/lab-terms';
import { LINK_PAYLOADS } from '@/lib/threat-model/reference-data-types';
import type { ElementBadge } from './element-badges';
import type { PayloadFlows } from './payload-tags';
import { SHARE_HEIGHT } from './SeverityBadge';

const KEY_SHARE_WIDTH = 7;
const KEY_SHARE_GAP = 1;
const KEY_HEIGHT = 12;
const MARK_WIDTH = 24;

interface Props {
  model: DeviceModel;
  flows: PayloadFlows;
  badges: ReadonlyMap<string, ElementBadge>;
  hasChainSteps: boolean;
}

/** The four share heights of a badge, most severe first. It shows the encoding, not a count. */
function SeverityKey() {
  const width = CATALOG_SEVERITIES.length * (KEY_SHARE_WIDTH + KEY_SHARE_GAP);
  return (
    <svg className="lab-diagram-key" width={width} height={KEY_HEIGHT} viewBox={`0 0 ${width} ${KEY_HEIGHT}`} aria-hidden="true" focusable="false">
      {CATALOG_SEVERITIES.map((severity, index) => (
        <rect
          key={severity} className="lab-diagram-badge-share" data-severity={severity}
          x={index * (KEY_SHARE_WIDTH + KEY_SHARE_GAP)} y={KEY_HEIGHT - 1 - SHARE_HEIGHT[severity]} width={KEY_SHARE_WIDTH} height={SHARE_HEIGHT[severity]}
        />
      ))}
    </svg>
  );
}

function ArrowKey() {
  return (
    <svg className="lab-diagram-key" width={MARK_WIDTH} height={KEY_HEIGHT} viewBox={`0 0 ${MARK_WIDTH} ${KEY_HEIGHT}`} aria-hidden="true" focusable="false">
      <path className="lab-diagram-arrow" d="M 3 6 H 21 M 16.5 2 L 21 6 L 16.5 10" />
    </svg>
  );
}

function TissueContactKey() {
  return (
    <svg className="lab-diagram-key" width={MARK_WIDTH} height={KEY_HEIGHT + 2} viewBox={`0 0 ${MARK_WIDTH} ${KEY_HEIGHT + 2}`} aria-hidden="true" focusable="false">
      <rect className="lab-diagram-key-border" x="0.75" y="0.75" width={MARK_WIDTH - 1.5} height={KEY_HEIGHT + 0.5} rx="3.5" />
      <rect className="lab-diagram-key-border" x="3.75" y="3.75" width={MARK_WIDTH - 7.5} height={KEY_HEIGHT - 5.5} rx="1.5" />
    </svg>
  );
}

function PlainLineKey() {
  return (
    <svg className="lab-diagram-key" width={MARK_WIDTH} height={KEY_HEIGHT} viewBox={`0 0 ${MARK_WIDTH} ${KEY_HEIGHT}`} aria-hidden="true" focusable="false">
      <path className="lab-diagram-line" d="M 2 6 H 22" />
    </svg>
  );
}

function StepKey() {
  return (
    <svg className="lab-diagram-key" width={MARK_WIDTH} height={KEY_HEIGHT + 2} viewBox={`0 0 ${MARK_WIDTH} ${KEY_HEIGHT + 2}`} aria-hidden="true" focusable="false">
      <g className="lab-diagram-step" data-step="reached"><rect x="2" y="1" width={MARK_WIDTH - 4} height={KEY_HEIGHT} rx={KEY_HEIGHT / 2} /></g>
    </svg>
  );
}

function badgeItems(badges: ReadonlyMap<string, ElementBadge>): LegendItem[] {
  const kinds = new Set([...badges.values()].map((badge) => badge.kind));
  const severities = CATALOG_SEVERITIES.map((severity) => CATALOG_SEVERITY_LABELS[severity].toLowerCase()).join(', ');
  const items: LegendItem[] = [];
  if (kinds.has('split')) {
    items.push({
      id: 'badge', mark: <SeverityKey />, name: 'Badge',
      detail: `counts the open catalog rows on that part or connection, under the filters in use. The bar splits them by catalog severity: ${severities}, tallest first.`,
    });
  } else if (kinds.has('total')) {
    items.push({ id: 'badge', mark: null, name: 'Badge', detail: 'counts the open catalog rows on that part or connection.' });
  }
  if (kinds.has('not-assessed')) {
    items.push({ id: 'not-assessed', mark: <HatchSwatch />, name: 'Not assessed', detail: 'no catalog technique is placed on that part or connection. It is not a count of zero.' });
  }
  return items;
}

function payloadItems(model: DeviceModel, flows: PayloadFlows): LegendItem[] {
  const shown = [...flows.values()].flat();
  const items: LegendItem[] = [];
  if (shown.length > 0) {
    const undecided = shown.some((flow) => flow.isFromTo === null) ? ' A payload with no arrow has no direction the rule can decide.' : '';
    items.push({
      id: 'payload', mark: <ArrowKey />, name: 'Payload tag',
      detail: `direction derived, not entered: neural data moves away from the part in contact with tissue; commands and updates move toward it.${undecided}`,
    });
  }
  if (model.links.some((link) => !flows.has(link.id))) {
    items.push({ id: 'no-payload', mark: <PlainLineKey />, name: 'No payload tag', detail: `the connection carries none of the ${LINK_PAYLOADS.length} payloads the model records.` });
  }
  return items;
}

/** What each mark on the device diagram means, limited to the marks the diagram is showing. */
export default function DiagramLegend({ model, flows, badges, hasChainSteps }: Props) {
  const items: LegendItem[] = [...badgeItems(badges), ...payloadItems(model, flows)];
  if (model.components.some((component) => component.isNeuralInterface)) {
    items.push({ id: 'tissue-contact', mark: <TissueContactKey />, name: 'Tissue contact', detail: 'the part in contact with neural tissue or the scalp.' });
  }
  if (hasChainSteps) items.push({ id: 'step', mark: <StepKey />, name: 'Numbered mark', detail: 'the steps of the chain shown that act on that part or connection.' });
  if (items.length === 0) return null;
  return <Legend label="Diagram legend" items={items} isStacked />;
}
