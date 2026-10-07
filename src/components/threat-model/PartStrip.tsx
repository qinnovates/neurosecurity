import FilterChip from '@/components/lab-kit/FilterChip';
import type { Lens } from '@/lib/threat-model/lens';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { describeElement } from '@/lib/threat-model/stride';

interface Props {
  model: DeviceModel;
  lens: Lens;
  /** Open catalog risks per component or link id, under the other lenses. */
  openRiskCounts: ReadonlyMap<string, number>;
  onLensChange: (lens: Lens) => void;
}

/**
 * The device folded to one row: each part with its open risks. It stands in for the
 * diagram when the diagram is out of view, and filters the same way.
 */
export default function PartStrip({ model, lens, openRiskCounts, onLensChange }: Props) {
  const elementIds = [
    ...model.components.map((component) => component.id),
    ...model.links.map((link) => link.id).filter((linkId) => (openRiskCounts.get(linkId) ?? 0) > 0 || linkId === lens.elementId),
  ];
  return (
    <div className="model-strip tm-no-print" role="group" aria-label="Parts of the device">
      {elementIds.map((elementId) => (
        <FilterChip
          key={elementId} label={describeElement(model, elementId)} count={openRiskCounts.get(elementId) ?? 0}
          isPressed={lens.elementId === elementId}
          onToggle={() => onLensChange({ ...lens, elementId: lens.elementId === elementId ? null : elementId })}
        />
      ))}
    </div>
  );
}
