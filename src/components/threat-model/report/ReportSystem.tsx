import type { DeviceModel, ModelComponent, ModelLink } from '@/lib/threat-model/device-model';
import { PAYLOAD_LABELS } from '@/lib/threat-model/match-techniques';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import { derivePayloadFlows, type PayloadFlow } from '@/lib/threat-model/payload-flow';
import { KIND_LABELS, MEDIUM_LABELS, ZONE_LABELS } from '../editor/model-labels';
import { ReportSection, ReportTable, type ReportColumn } from './ReportSection';

interface Props {
  model: DeviceModel;
}

const YES = 'Yes';
const NO = 'No';
const CARRIES_NOTHING = 'Nothing recorded';
const UNKNOWN_PART = 'Not in the model';

const PART_COLUMNS: readonly ReportColumn<ModelComponent>[] = [
  { id: 'part', header: 'Part', render: (part) => part.label },
  { id: 'kind', header: 'Kind', render: (part) => KIND_LABELS[part.kind] },
  { id: 'zone', header: 'Trust zone', render: (part) => ZONE_LABELS[part.trustZone] },
  { id: 'shared', header: 'Shared across patients', render: (part) => (part.isSharedAcrossPatients ? YES : NO) },
  { id: 'interface', header: 'In contact with neural tissue or the scalp', render: (part) => (part.isNeuralInterface ? YES : NO) },
];

function describeFlow(flow: PayloadFlow): string {
  const payload = PAYLOAD_LABELS[flow.payload];
  if (flow.sense === null) return `${payload}, direction not derived`;
  return `${payload}, ${flow.sense === 'away' ? 'away from' : 'toward'} the neural interface`;
}

/** Parts and connections as the model holds them, in the order the diagram draws them. */
export default function ReportSystem({ model }: Props) {
  const order = listElementsInModelOrder(model).map((element) => element.id);
  const byOrder = <Item extends { id: string }>(items: readonly Item[]): Item[] => [...items].sort((left, right) => order.indexOf(left.id) - order.indexOf(right.id));
  const labelOf = (componentId: string): string => model.components.find((component) => component.id === componentId)?.label ?? UNKNOWN_PART;
  const flows = derivePayloadFlows(model);
  const connectionColumns: readonly ReportColumn<ModelLink>[] = [
    { id: 'from', header: 'From', render: (link) => labelOf(link.fromComponentId) },
    { id: 'to', header: 'To', render: (link) => labelOf(link.toComponentId) },
    { id: 'medium', header: 'Medium', render: (link) => MEDIUM_LABELS[link.medium] },
    {
      id: 'carries', header: 'Carries (direction derived)',
      render: (link) => {
        const carried = flows.get(link.id) ?? [];
        return carried.length === 0 ? CARRIES_NOTHING : <ul className="report-cell-list">{carried.map((flow) => <li key={flow.payload}>{describeFlow(flow)}</li>)}</ul>;
      },
    },
  ];
  return (
    <ReportSection id="system">
      <ReportTable caption={`${model.components.length} parts`} columns={PART_COLUMNS} rows={byOrder(model.components)} rowKey={(part) => part.id} emptyMessage="The model has no parts. Add them in the device editor." />
      <ReportTable caption={`${model.links.length} connections`} columns={connectionColumns} rows={byOrder(model.links)} rowKey={(link) => link.id} emptyMessage="The model has no connections. Add them in the device editor." />
    </ReportSection>
  );
}
