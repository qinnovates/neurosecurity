/**
 * RegionPicker — the brain regions of the clinical data as a list, grouped by QIF band.
 * It takes the place of the hand-drawn medial brain: it selects a region for the panels
 * beside it and places nothing at a position. The brain itself is on the atlas explorer page.
 */

import type { ClinicalRegion } from '../../../lib/clinical-data';
import AtlasExplorerLink from '../../brain/AtlasExplorerLink';

/** Neural bands from the outer surface inward, the order the hourglass beside this list uses. */
const NEURAL_BAND_ORDER = ['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1'];

interface Props {
  regions: ClinicalRegion[];
  selectedRegionId: string | null;
  highlightedRegionIds: string[];
  onRegionSelect: (regionId: string | null) => void;
}

interface RegionButtonProps {
  region: ClinicalRegion;
  isSelected: boolean;
  isHighlighted: boolean;
  onToggle: (regionId: string) => void;
}

function RegionButton({ region, isSelected, isHighlighted, onToggle }: RegionButtonProps) {
  return (
    <button
      type="button" onClick={() => onToggle(region.id)} aria-pressed={isSelected} title={region.function}
      className="rounded-md px-2 py-1 text-xs font-medium transition-colors"
      style={{
        background: isSelected ? 'var(--color-accent-primary)' : 'var(--color-bg-primary)',
        color: isSelected ? '#fff' : 'var(--color-text-primary)',
        border: `1px solid ${isSelected || isHighlighted ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
      }}
    >
      {region.name}
    </button>
  );
}

function SelectedRegionNote({ region }: { region: ClinicalRegion }) {
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
      <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{region.name}</div>
      <div className="mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
        Band {region.band}, {region.pathwayCount} {region.pathwayCount === 1 ? 'pathway' : 'pathways'} in the clinical data
      </div>
      {region.function !== '' && <div className="mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{region.function}</div>}
    </div>
  );
}

export default function RegionPicker({ regions, selectedRegionId, highlightedRegionIds, onRegionSelect }: Props) {
  const toggleRegion = (regionId: string) => onRegionSelect(selectedRegionId === regionId ? null : regionId);
  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? null;
  const bandIds = [...NEURAL_BAND_ORDER, ...new Set(regions.map((region) => region.band).filter((bandId) => !NEURAL_BAND_ORDER.includes(bandId)))];

  return (
    <div className="space-y-3">
      {bandIds.map((bandId) => {
        const bandRegions = regions.filter((region) => region.band === bandId);
        if (bandRegions.length === 0) return null;
        return (
          <div key={bandId} role="group" aria-label={`Regions in band ${bandId}`}>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-faint)' }}>{bandId}</div>
            <div className="flex flex-wrap gap-1.5">
              {bandRegions.map((region) => (
                <RegionButton
                  key={region.id} region={region} isSelected={region.id === selectedRegionId}
                  isHighlighted={highlightedRegionIds.includes(region.id)} onToggle={toggleRegion}
                />
              ))}
            </div>
          </div>
        );
      })}
      {selectedRegion !== null && <SelectedRegionNote region={selectedRegion} />}
      <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
        A list, not a drawing. The catalog files techniques under bands, so no technique count is shown against a region.{' '}
        <AtlasExplorerLink className="underline">Look these regions up in the TARA Brain Atlas, which draws the ones it has geometry for</AtlasExplorerLink>.
      </p>
    </div>
  );
}
