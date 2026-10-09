import { useId } from 'react';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { listElementsInModelOrder, type ModelElement } from '@/lib/threat-model/model-order';
import { ZONE_LABELS } from '../diagram-layout';
import type { DiagramHighlight, StepMark } from './diagram-types';
import { HatchDefs } from './DiagramMarks';
import { TISSUE_CONTACT_TAG } from './DiagramPart';
import { describeBadge, type ElementBadge } from './element-badges';
import { buildPayloadTags, describePayloadTags, type PayloadFlows, type PayloadTag } from './payload-tags';
import SeverityBadge, { BADGE_ROW_HEIGHT } from './SeverityBadge';
import type { DiagramInteraction } from './use-diagram-interaction';

/** Wide enough for the bar with a three-digit count, or for the words "not assessed". */
const BADGE_BOX_WIDTH = 96;
const KIND_LABELS: Readonly<Record<ModelElement['kind'], string>> = { part: 'Part', connection: 'Connection' };

interface Props {
  model: DeviceModel;
  title: string;
  flows: PayloadFlows;
  badges: ReadonlyMap<string, ElementBadge>;
  stepMarks: ReadonlyMap<string, StepMark>;
  highlight: DiagramHighlight | null;
  selectedElementId: string | null;
  interaction: DiagramInteraction;
}

function PayloadWords({ tag }: { tag: PayloadTag }) {
  return (
    <span className="lab-diagram-row-payload" data-payload={tag.payload}>
      {tag.label}{tag.towardLabel !== null && <> <span aria-hidden="true">→</span><span className="lab-diagram-sr"> to</span> {tag.towardLabel}</>}
    </span>
  );
}

/**
 * The device as a list, for a screen too narrow for the drawing: every part and every
 * connection in the drawing's order, each with what it carries and its badge. A connection
 * is listed whether or not anything is placed on it.
 */
export default function DiagramList({ model, title, flows, badges, stepMarks, highlight, selectedElementId, interaction }: Props) {
  const hatchId = useId();
  const partById = new Map(model.components.map((component) => [component.id, component]));

  const renderRow = (element: ModelElement) => {
    const part = partById.get(element.id);
    // A row has no line to point along; the tag names the part the payload travels to instead.
    const tags = part === undefined ? buildPayloadTags(flows.get(element.id) ?? [], { model, linkId: element.id, lineHeading: 'right' }) : [];
    const badge = badges.get(element.id);
    const stepMark = stepMarks.get(element.id);
    const isHighlighted = highlight === null || (part === undefined ? highlight.linkIds : highlight.componentIds).includes(element.id);
    const facts = part === undefined ? describePayloadTags(tags) : `${ZONE_LABELS[part.trustZone]}${part.isNeuralInterface ? `, ${TISSUE_CONTACT_TAG}` : ''}`;
    const name = `${KIND_LABELS[element.kind]}, ${element.label}${facts === '' ? '' : `, ${facts}`}. ${describeBadge(badge)}`.trim();
    return (
      <li key={element.id}>
        <div
          className="lab-diagram-row" data-kind={element.kind} data-selected={element.id === selectedElementId} data-dimmed={!isHighlighted}
          data-tissue-contact={part?.isNeuralInterface ?? false} {...interaction.controlProps(element.id, name)} data-lit={interaction.isLit(element.id)}
        >
          <span className="lab-diagram-row-kind">{KIND_LABELS[element.kind]}</span>
          <span className="lab-diagram-row-name">{element.label}</span>
          <span className="lab-diagram-row-facts">
            {part !== undefined && <span>{ZONE_LABELS[part.trustZone]}</span>}
            {part?.isNeuralInterface === true && <span className="lab-diagram-row-tag">{TISSUE_CONTACT_TAG}</span>}
            {tags.map((tag) => <PayloadWords key={tag.payload} tag={tag} />)}
            {stepMark !== undefined && <span className="lab-diagram-row-step" data-step={stepMark.state}>step {stepMark.text}</span>}
          </span>
          {badge !== undefined && (
            <svg className="lab-diagram-row-badge" width={BADGE_BOX_WIDTH} height={BADGE_ROW_HEIGHT} viewBox={`0 0 ${BADGE_BOX_WIDTH} ${BADGE_ROW_HEIGHT}`} aria-hidden="true" focusable="false">
              <SeverityBadge badge={badge} x={0} y={0} hatchId={hatchId} />
            </svg>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="lab-diagram-narrow">
      <svg className="lab-diagram-defs" width="0" height="0" aria-hidden="true" focusable="false"><HatchDefs id={hatchId} /></svg>
      <ol className="lab-diagram-list" aria-label={title}>{listElementsInModelOrder(model).map(renderRow)}</ol>
    </div>
  );
}
