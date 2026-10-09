import { useMemo } from 'react';
import DataTable, { type DataTableColumn } from '@/components/lab-kit/DataTable';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import { scopeLabelOf } from '../scope-words';
import type { ClassDifference, ComparedDevice } from './class-scopes';

interface Props {
  devices: readonly ComparedDevice[];
  differences: readonly ClassDifference[];
  onOpenTechnique: (techniqueId: string) => void;
}

const CAPTION = 'Techniques that apply to one of these and not to another';
const EMPTY_MESSAGE = 'No technique applies to one of these and not to another.';

/** Where the compared devices differ: one line per technique, with where it stands on each. */
export default function ClassDifferenceTable({ devices, differences, onOpenTechnique }: Props) {
  const columns = useMemo((): readonly DataTableColumn<ClassDifference>[] => [
    { id: 'name', header: 'Technique', render: (difference) => difference.name, sortValue: (difference) => difference.name },
    {
      id: 'id', header: 'ID', sortValue: (difference) => difference.techniqueId,
      render: (difference) => <TechniqueLink techniqueId={difference.techniqueId} techniqueName={difference.name} onOpen={onOpenTechnique} />,
    },
    ...devices.map((device, index): DataTableColumn<ClassDifference> => ({
      id: `device-${device.id}`, header: device.label,
      render: (difference) => <span data-term={difference.entries[index].term}>{scopeLabelOf(difference.entries[index])}</span>,
      sortValue: (difference) => difference.entries[index].term,
    })),
  ], [devices, onOpenTechnique]);

  return (
    <div className="explore-differences">
      <DataTable caption={CAPTION} columns={columns} rows={differences} rowKey={(difference) => difference.techniqueId} emptyMessage={EMPTY_MESSAGE} />
    </div>
  );
}
