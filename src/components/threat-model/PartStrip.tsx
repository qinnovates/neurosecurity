import FilterChip from '@/components/lab-kit/FilterChip';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import type { Lens } from '@/lib/threat-model/lens';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import type { ElementRowCounts } from '@/lib/threat-model/register-counts';
import { useModelHighlight } from './model-highlight';
import './threat-model.css';

interface Props {
  model: DeviceModel;
  lens: Lens;
  /** Open catalog risks per component or link id, under the other lenses. */
  openRiskCounts: ReadonlyMap<string, number>;
  onLensChange: (lens: Lens) => void;
  /**
   * Rows per part and connection from the whole register. When given, every connection is
   * listed and one with nothing placed on it says "not assessed". Without it the strip cannot
   * tell "nothing placed" from "none open", so a connection with no open risk is left out.
   */
  elementCounts?: readonly ElementRowCounts[];
}

/**
 * The device folded to one row, in the diagram's order: each part and connection with its
 * open risks. It stands in for the diagram when the diagram is out of view, filters the same
 * way, and lights with it.
 */
export default function PartStrip({ model, lens, openRiskCounts, onLensChange, elementCounts }: Props) {
  const { bind } = useModelHighlight();
  const placedRows = elementCounts === undefined ? null : new Map(elementCounts.map((counts) => [counts.id, counts.catalogRows]));
  const isShown = (elementId: string, kind: 'part' | 'connection'): boolean =>
    kind === 'part' || placedRows !== null || (openRiskCounts.get(elementId) ?? 0) > 0 || elementId === lens.elementId;

  return (
    <div className="lab-diagram-strip" role="group" aria-label="Parts of the device">
      {listElementsInModelOrder(model).filter((element) => isShown(element.id, element.kind)).map((element) => (
        <span key={element.id} className="lab-diagram-strip-item" {...bind(element.id)}>
          <FilterChip
            label={element.label} count={openRiskCounts.get(element.id) ?? 0}
            isNotAssessed={placedRows?.get(element.id) === 0}
            isPressed={lens.elementId === element.id}
            onToggle={() => onLensChange({ ...lens, elementId: lens.elementId === element.id ? null : element.id })}
          />
        </span>
      ))}
    </div>
  );
}
