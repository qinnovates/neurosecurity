import { useEffect, useRef } from 'react';
import AtlasExplorerLink from '@/components/brain/AtlasExplorerLink';
import { MOUNT_COPY } from '@/lib/anatomy/mount-copy';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { noteRegionById, type NotedRegion, type RegionViewNotes as Notes } from '@/lib/atlas-explorer/region-view-notes';
import LimitNote from './LimitNote';

interface Props {
  model: ExplorerModel;
  notes: Notes;
  /** Whether the page has a list of its own to choose in. Only then is the visitor sent there when the view lists no region to pick. */
  canChooseInList: boolean;
  pickedRegionId: string | null;
  onPickRegion: (regionId: string) => void;
}

/** One picked region: its name, band and shape status, and the way to everything else about it. */
function PickedRegion({ region }: { region: NotedRegion }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  // A pick made with the keyboard moves on to what it opened.
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), [region.id]);
  return (
    <div className="atlas-view-picked" data-picked-region={region.id} aria-live="polite">
      <h3 className="atlas-subheading" tabIndex={-1} ref={headingRef}>{region.name}</h3>
      <p className="atlas-fact">Band {region.bandNames}. In this atlas: {region.geometryLabel}.</p>
      <LimitNote limit={region.geometryLimit} />
      <p className="atlas-fact"><AtlasExplorerLink>Open the TARA Brain Atlas explorer for everything linked to this region</AtlasExplorerLink></p>
    </div>
  );
}

/**
 * The words beside an embedded 3D view, in one group with it: the regions it
 * marks or fills (each a button, so a region can be picked without a pointer),
 * and every sentence that limits what the picture says.
 */
export default function RegionViewNotes({ model, notes, canChooseInList, pickedRegionId, onPickRegion }: Props) {
  const picked = pickedRegionId === null ? null : noteRegionById(model, pickedRegionId);
  return (
    <div className="atlas-panel atlas-view-notes" data-view-notes="true">
      {notes.lists.map((list) => (
        <div key={list.heading} data-view-list={list.heading}>
          <h3 className="atlas-minor-heading">{list.heading} ({list.regions.length})</h3>
          <ul className="atlas-view-regions">
            {list.regions.map((region) => (
              <li key={region.id}>
                <button type="button" className="atlas-chip" aria-pressed={region.id === pickedRegionId} onClick={() => onPickRegion(region.id)}>{region.name}</button>
                <span className="atlas-id">{region.geometryLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {canChooseInList && notes.lists.length === 0 && <p className="atlas-fact" data-view-hint="choose-in-list">{MOUNT_COPY.choose_in_list}</p>}
      {picked !== null && <PickedRegion region={picked} />}
      {notes.limits.map((limit) => <LimitNote key={`${limit.id}:${limit.text}`} limit={limit} />)}
    </div>
  );
}
