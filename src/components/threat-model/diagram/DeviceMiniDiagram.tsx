import { useMemo } from 'react';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { computeDiagramLayout } from '../diagram-layout';
import { MINI_METRICS } from './diagram-metrics';
import '../threat-model.css';

const ZONE_RADIUS = 5;
const PART_RADIUS = 4;
const INNER_BORDER_INSET = 3;

interface Props {
  model: DeviceModel;
}

function counted(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * A small still drawing of any device, for a card: its zones, parts and connections in the
 * same arrangement as the full diagram, with the tissue-contact part double-bordered. It
 * carries no text, so nothing in it can fall under the smallest type size; its accessible
 * name gives the counts.
 */
export default function DeviceMiniDiagram({ model }: Props) {
  const layout = useMemo(() => computeDiagramLayout(model, MINI_METRICS), [model]);
  const name = `Diagram of ${model.name}: ${counted(model.components.length, 'part', 'parts')}, ${counted(model.links.length, 'connection', 'connections')}`;
  return (
    <svg className="lab-diagram-mini" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label={name}>
      {layout.zones.map((zone) => <rect key={zone.zone} className="lab-diagram-mini-zone" x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx={ZONE_RADIUS} />)}
      {layout.edges.map((edge) => <path key={edge.id} className="lab-diagram-mini-line" d={edge.path} />)}
      {layout.nodes.map((node) => (
        <g key={node.id} className="lab-diagram-mini-part" data-tissue-contact={node.isTissueContact}>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={PART_RADIUS} />
          {node.isTissueContact && (
            <rect
              x={node.x + INNER_BORDER_INSET} y={node.y + INNER_BORDER_INSET} width={node.width - 2 * INNER_BORDER_INSET}
              height={node.height - 2 * INNER_BORDER_INSET} rx={PART_RADIUS - 2}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
