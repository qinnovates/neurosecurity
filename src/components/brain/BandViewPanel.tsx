import { useState } from 'react';
import { QIF_BANDS_FRAMEWORK_NOTE, type BrainView, type BrainViewRegion } from '../../lib/brain-view-data';
import type { Lens } from '../../lib/atlas-explorer/lens-state';
import RegionViewMount from '../atlas-scene/RegionViewMount';
import AtlasExplorerLink from './AtlasExplorerLink';

export interface BandViewPanelProps {
  views: BrainView[];
  defaultView?: string;
  /** Given by a page that keeps the selected band itself; left out, the panel keeps it. */
  selectedBandId?: string | null;
  onBandSelect?: (bandId: string | null) => void;
  /** Given by a page that keeps the view itself; left out, the panel keeps it. */
  viewId?: string;
  onViewChange?: (viewId: string) => void;
  hideViewToggle?: boolean;
  /**
   * Given by a page that wants the 3D view under the list: the lens that decides its fills. The band selected in the
   * list is passed to the view as the visitor's selection, which is marked and never filled. The page must also carry
   * the index pin (AtlasIndexPin.astro). Left out, the panel stays a list.
   */
  regionViewLens?: Lens;
}

const FALLBACK_VIEW_ID = 'security';

const EMPTY_STATE_BY_VIEW: Record<string, string> = {
  security: 'Select a band to see the attack techniques the catalog files under it and their severity.',
  clinical: 'Select a band to see the therapeutic techniques the catalog files under it.',
  governance: 'Select a band to see the neurorights mapped to it and how many attack techniques are filed under it.',
};
const EMPTY_STATE_DEFAULT = 'Select a band to see what is filed under it.';

function ViewToggle({ views, activeViewId, onChange }: { views: BrainView[]; activeViewId: string; onChange: (viewId: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 mb-5">
      {views.map((view) => {
        const isActive = view.id === activeViewId;
        return (
          <button
            key={view.id} type="button" onClick={() => onChange(view.id)} aria-pressed={isActive}
            className="px-4 py-2 rounded-full text-xs font-medium transition-all"
            style={{
              background: isActive ? `${view.accentColor}15` : 'transparent',
              color: isActive ? view.accentColor : 'var(--color-text-faint)',
              border: `1px solid ${isActive ? `${view.accentColor}30` : 'transparent'}`,
            }}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}

function BandList({ bands, selectedBandId, onToggle }: { bands: BrainViewRegion[]; selectedBandId: string | null; onToggle: (bandId: string) => void }) {
  return (
    <ul className="w-full lg:w-[45%] flex-shrink-0 space-y-1.5 list-none p-0 m-0">
      {bands.map((band) => {
        const isSelected = band.id === selectedBandId;
        return (
          <li key={band.id}>
            <button
              type="button" onClick={() => onToggle(band.id)} aria-pressed={isSelected}
              className="w-full flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg px-3 py-2 text-left transition-colors"
              style={{
                background: isSelected ? 'var(--color-bg-secondary)' : 'transparent',
                border: `1px solid ${isSelected ? band.color : 'var(--color-border)'}`,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: band.color }} aria-hidden="true" />
              <span className="text-xs font-bold shrink-0" style={{ color: 'var(--color-text-faint)' }}>{band.id}</span>
              <span className="text-sm font-medium flex-1 whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>{band.name}</span>
              <span className="text-xs ml-auto" style={{ color: 'var(--color-text-muted)' }}>{band.stat.value} {band.stat.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function BandDetail({ band, accentColor }: { band: BrainViewRegion; accentColor: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: 'var(--color-text-faint)' }}>Band {band.id}</p>
      <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>{band.name}</h3>
      <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>{band.description}</p>
      <p className="text-xs mb-3" style={{ color: 'var(--color-text-faint)' }}>
        <span className="text-base font-bold mr-1" style={{ color: accentColor, fontFamily: 'var(--font-heading)' }}>{band.stat.value}</span>
        {band.stat.label}
      </p>
      {band.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {band.badges.map((badge) => (
            <span
              key={badge.label} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: `${badge.color}15`, color: badge.color, border: `1px solid ${badge.color}30` }}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}
      {band.details.length > 0 && (
        <ul className="space-y-1 list-none p-0 m-0">
          {band.details.map((detail) => (
            <li key={detail.id}>
              <a href={detail.href} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: detail.color }} aria-hidden="true" />
                <span className="truncate">{detail.label}</span>
                <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-faint)' }}>{detail.id}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The seven neural bands of one view, as a list: what the catalog files under each band.
 * The list itself draws no anatomy and puts nothing at a position. A page may ask for the 3D
 * view under it (`regionViewLens`), which loads only when the visitor presses its button.
 */
export default function BandViewPanel({ views, defaultView, selectedBandId, onBandSelect, viewId, onViewChange, hideViewToggle, regionViewLens }: BandViewPanelProps) {
  const [internalViewId, setInternalViewId] = useState(defaultView ?? views[0]?.id ?? FALLBACK_VIEW_ID);
  const [internalBandId, setInternalBandId] = useState<string | null>(null);
  const activeViewId = viewId ?? internalViewId;
  const activeBandId = selectedBandId !== undefined ? selectedBandId : internalBandId;
  const activeView = views.find((view) => view.id === activeViewId) ?? views[0];
  if (activeView === undefined) return null;
  const activeBand = activeView.regions.find((band) => band.id === activeBandId) ?? null;

  const selectBand = (bandId: string | null) => {
    if (onBandSelect) onBandSelect(bandId);
    else setInternalBandId(bandId);
  };
  const toggleBand = (bandId: string) => selectBand(activeBandId === bandId ? null : bandId);
  /** A region picked in the 3D view selects its band in the list, when the list holds that band. */
  const selectBandOf = (bandIds: readonly string[]) => {
    const listedBandId = bandIds.find((bandId) => activeView.regions.some((band) => band.id === bandId));
    if (listedBandId !== undefined && listedBandId !== activeBandId) selectBand(listedBandId);
  };

  return (
    <div>
      {!hideViewToggle && <ViewToggle views={views} activeViewId={activeView.id} onChange={onViewChange ?? setInternalViewId} />}
      <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-10">
        <BandList bands={activeView.regions} selectedBandId={activeBandId} onToggle={toggleBand} />
        <div className="flex-1 min-w-0" aria-live="polite">
          {activeBand !== null
            ? <BandDetail band={activeBand} accentColor={activeView.accentColor} />
            : <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-faint)' }}>{EMPTY_STATE_BY_VIEW[activeView.id] ?? EMPTY_STATE_DEFAULT}</p>}
        </div>
      </div>
      {regionViewLens !== undefined && <RegionViewMount lens={regionViewLens} selectedBandId={activeBandId} onRegionPick={(pick) => selectBandOf(pick.bandIds)} />}
      <p className="text-xs mt-5" style={{ color: 'var(--color-text-faint)' }}>
        {QIF_BANDS_FRAMEWORK_NOTE} This list draws no anatomy and counts by band, not by brain region.{' '}
        <AtlasExplorerLink className="underline">See the brain itself in the TARA Brain Atlas</AtlasExplorerLink>.
      </p>
    </div>
  );
}
