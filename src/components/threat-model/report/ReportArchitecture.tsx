import type { DeviceModel } from '@/lib/threat-model/device-model';
import type { ArchitectureViewSelection } from '@/lib/threat-model/report-types';
import { describeElement } from '@/lib/threat-model/stride';
import ArchitectureDiagram from '../ArchitectureDiagram';
import { ReportSection } from './ReportSection';
import { VIEW_LABELS } from './report-sections';

interface Props {
  model: DeviceModel;
  views: readonly ArchitectureViewSelection[];
}

const NONE_IN_VIEW = 'None in this view.';
/** Printed in place of the drawing: scaled to a page its labels fall under the smallest type size, so paper carries the tables. */
export const PRINTED_DIAGRAM_NOTE = 'The diagram is not printed. See the parts and connections tables.';

function ElementList({ label, model, elementIds }: { label: string; model: DeviceModel; elementIds: readonly string[] }) {
  return (
    <div>
      <p className="lab-label">{label}: {elementIds.length}</p>
      {elementIds.length === 0 ? <p className="lab-soft">{NONE_IN_VIEW}</p> : <ul className="report-list">{elementIds.map((elementId) => <li key={elementId}>{describeElement(model, elementId)}</li>)}</ul>}
    </div>
  );
}

/** The system drawn once, then each architecture view as the parts and connections it takes in. */
export default function ReportArchitecture({ model, views }: Props) {
  return (
    <ReportSection id="architecture">
      <div className="report-diagram"><ArchitectureDiagram model={model} title={`${VIEW_LABELS.global_system} of ${model.name}`} /></div>
      <p className="report-print-block">{PRINTED_DIAGRAM_NOTE}</p>
      {views.map((selection) => (
        <div key={selection.view} className="report-view">
          <h3 className="report-subheading">{VIEW_LABELS[selection.view]}</h3>
          <p>{selection.explanation}</p>
          <div className="report-view-lists">
            <ElementList label="Parts" model={model} elementIds={selection.highlightedComponentIds} />
            <ElementList label="Connections" model={model} elementIds={selection.highlightedLinkIds} />
          </div>
        </div>
      ))}
    </ReportSection>
  );
}
