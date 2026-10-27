import { useMemo } from 'react';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { LensKind } from '@/lib/atlas-explorer/lens-state';
import { listDeviceOptions, listTechniqueOptions, type SubjectOption } from '@/lib/atlas-explorer/subject-options';
import SubjectPicker from './SubjectPicker';

/** The kinds a highlight drives. Both are selections of a thing, not facts about a region. */
type HighlightKind = Extract<LensKind, 'technique' | 'stated_targets'>;

const DEVICE_DETAIL_PREFIX = 'device record';

interface Props {
  model: ExplorerModel;
  /** The chosen subject's id when a highlight is carrying the colour, or null. */
  chosenId: string | null;
  onChoose: (kind: HighlightKind, subjectId: string) => void;
}

interface Highlights {
  options: SubjectOption[];
  kindById: ReadonlyMap<string, HighlightKind>;
}

/**
 * Every technique and every device in one list, with the kind each drives.
 * A technique id and a device id have never collided in this data, and if one
 * ever does the technique wins, because a technique's links are the richer
 * answer and the id is shown beside every option either way.
 */
export function buildHighlights(model: ExplorerModel): Highlights {
  const techniques = listTechniqueOptions(model);
  const devices = listDeviceOptions(model).map((device) => ({ ...device, detail: `${DEVICE_DETAIL_PREFIX}; ${device.detail}` }));
  const kindById = new Map<string, HighlightKind>(devices.map((device) => [device.id, 'stated_targets' as HighlightKind]));
  for (const technique of techniques) kindById.set(technique.id, 'technique');
  return { options: [...techniques, ...devices], kindById };
}

/**
 * One picker for the whole "what should I pick out?" question: the catalog's
 * techniques and the atlas file's devices in one type-ahead list. It replaces
 * two lens buttons, each of which coloured nothing until its own picker had
 * been found and used, and the two pickers behind them.
 */
export default function HighlightPicker({ model, chosenId, onChoose }: Props) {
  const { options, kindById } = useMemo(() => buildHighlights(model), [model]);
  return (
    <div className="atlas-highlight">
      <SubjectPicker
        noun="technique or device" options={options} chosenId={chosenId}
        onChoose={(subjectId) => {
          const kind = kindById.get(subjectId);
          if (kind !== undefined) onChoose(kind, subjectId);
        }}
      />
    </div>
  );
}
