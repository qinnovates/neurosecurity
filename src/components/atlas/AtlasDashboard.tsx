/**
 * AtlasDashboard — unified dashboard putting the hourglass and the per-band list side-by-side.
 * Linked interaction: clicking either side updates both + detail panel. The brain itself is on the atlas explorer page.
 * All data driven from JSON via atlas-data.ts.
 */

import { useState, useCallback } from 'react';
import { AtlasProvider, useAtlas, type ViewMode } from './AtlasContext';
import BandViewPanel from '../brain/BandViewPanel';
import HourglassVisualization from './HourglassVisualization';
import AtlasDetailPanel from './AtlasDetailPanel';
import ThreatMap from './ThreatMap';
import { THREAT_VECTORS, THREAT_TACTICS } from '../../lib/threat-data';
import { HOURGLASS_BANDS } from '../../lib/qif-constants';
import { BAND_LENS } from '../atlas-scene/RegionViewMount';
import type { AtlasData } from '../../lib/atlas-data';
import type { BrainView } from '../../lib/brain-view-data';

interface Props {
  atlasData: AtlasData;
  brainViews: BrainView[];
  threatDetails: Record<string, {
    total: number;
    categories: Record<string, number>;
    bySeverity: Record<string, number>;
    avgNiss: number;
  }>;
}

const VIEW_MODE_CONFIG: { id: ViewMode; label: string; color: string; brainViewId: string }[] = [
  { id: 'security', label: 'Security', color: '#ef4444', brainViewId: 'security' },
  { id: 'clinical', label: 'Clinical', color: '#10b981', brainViewId: 'clinical' },
  { id: 'governance', label: 'Governance', color: '#8b5cf6', brainViewId: 'governance' },
];

export default function AtlasDashboard({ atlasData, brainViews, threatDetails }: Props) {
  return (
    <AtlasProvider>
      <DashboardInner atlasData={atlasData} brainViews={brainViews} threatDetails={threatDetails} />
    </AtlasProvider>
  );
}

type DashboardView = 'hourglass' | 'threatmap';

function DashboardInner({ atlasData, brainViews, threatDetails }: Props) {
  const { selectedBandId, activeTab, viewMode, selectBand, setActiveTab, setViewMode } = useAtlas();
  const [mobileTab, setMobileTab] = useState<'hourglass' | 'bands'>('hourglass');
  const [dashView, setDashView] = useState<DashboardView>('hourglass');

  const handleThreatMapBandHighlight = useCallback((bandIds: string[]) => {
    // Highlight first band in the list
    if (bandIds.length > 0 && !selectedBandId) {
      // Don't auto-select, just let the threat map manage its own state
    }
  }, [selectedBandId]);

  const selectedBand = selectedBandId
    ? atlasData.bands.find(b => b.id === selectedBandId) ?? null
    : null;

  // The band list is keyed by the same band ids as the hourglass (N7, N6, etc.)
  const brainViewId = VIEW_MODE_CONFIG.find(v => v.id === viewMode)?.brainViewId ?? 'security';

  return (
    <div className="space-y-4">
      {/* Dashboard view toggle — command bar */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 glass rounded-xl px-4 py-2" style={{ background: 'var(--color-glass-bg)' }}>
        <span className="text-[9px] font-mono uppercase tracking-[0.1em] hidden sm:block" style={{ color: 'var(--color-text-faint)' }}>VIEW</span>
        <div className="flex items-center gap-1 rounded-full p-0.5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          {([
            { id: 'hourglass' as DashboardView, label: 'Hourglass' },
            { id: 'threatmap' as DashboardView, label: 'Threat Map' },
          ]).map(v => (
            <button
              key={v.id}
              onClick={() => setDashView(v.id)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: dashView === v.id ? 'var(--color-accent-primary)' : 'transparent',
                color: dashView === v.id ? '#fff' : 'var(--color-text-faint)',
                boxShadow: dashView === v.id ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* View mode toggle (only for hourglass view) */}
        {dashView === 'hourglass' && (
          <>
            <div className="w-px h-5 hidden sm:block" style={{ background: 'var(--color-border)' }} />
            <span className="text-[9px] font-mono uppercase tracking-[0.1em] hidden sm:block" style={{ color: 'var(--color-text-faint)' }}>MODE</span>
            <div className="flex items-center gap-1">
              {VIEW_MODE_CONFIG.map(mode => {
                const isActive = viewMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className="px-3 sm:px-4 py-2 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: isActive ? `${mode.color}15` : 'transparent',
                      color: isActive ? mode.color : 'var(--color-text-faint)',
                      border: `1px solid ${isActive ? `${mode.color}30` : 'transparent'}`,
                      boxShadow: isActive ? `0 0 10px ${mode.color}20` : 'none',
                    }}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {dashView === 'hourglass' ? (
        <>
          {/* Mobile tab switcher */}
          <div className="flex lg:hidden items-center justify-center gap-1">
            <button
              onClick={() => setMobileTab('hourglass')}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: mobileTab === 'hourglass' ? 'var(--color-bg-secondary)' : 'transparent',
                color: mobileTab === 'hourglass' ? 'var(--color-text-primary)' : 'var(--color-text-faint)',
                border: `1px solid ${mobileTab === 'hourglass' ? 'var(--color-border)' : 'transparent'}`,
              }}
            >
              Hourglass
            </button>
            <button
              onClick={() => setMobileTab('bands')}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: mobileTab === 'bands' ? 'var(--color-bg-secondary)' : 'transparent',
                color: mobileTab === 'bands' ? 'var(--color-text-primary)' : 'var(--color-text-faint)',
                border: `1px solid ${mobileTab === 'bands' ? 'var(--color-border)' : 'transparent'}`,
              }}
            >
              Band list
            </button>
          </div>

          {/* Main visualization area */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Hourglass (40% desktop, full mobile when active) */}
            <div
              className={`lg:w-[40%] shrink-0 glass rounded-xl p-4 ${mobileTab !== 'hourglass' ? 'hidden lg:block' : ''}`}
              style={{
                backgroundImage: 'radial-gradient(circle, var(--color-border) 0.5px, transparent 0.5px)',
                backgroundSize: '24px 24px',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-mono uppercase tracking-[0.12em]" style={{ color: 'var(--color-accent-secondary)' }}>
                  Hourglass Architecture
                </span>
                <span className="text-[9px] font-mono" style={{ color: 'var(--color-text-faint)' }}>
                  11 bands
                </span>
              </div>
              <HourglassVisualization
                bands={atlasData.bands}
                selectedBandId={selectedBandId}
                onBandSelect={selectBand}
              />
            </div>

            {/* Band list (60% desktop, full mobile when active) */}
            <div className={`lg:w-[60%] glass rounded-xl p-4 ${mobileTab !== 'bands' ? 'hidden lg:block' : ''}`}>
              <BandViewPanel
                views={brainViews}
                selectedBandId={selectedBandId}
                onBandSelect={selectBand}
                viewId={brainViewId}
                hideViewToggle
                regionViewLens={BAND_LENS}
              />
            </div>
          </div>

          {/* Detail panel */}
          {selectedBand && (
            <AtlasDetailPanel
              band={selectedBand}
              devices={atlasData.devices}
              neurorights={atlasData.neurorights}
              dsmClusters={atlasData.dsmClusters}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              threatDetail={threatDetails[selectedBand.id] ?? { total: 0, categories: {}, bySeverity: {}, avgNiss: 0 }}
            />
          )}

          {/* Empty state */}
          {!selectedBand && (
            <div
              className="text-center py-10 rounded-xl glass relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'radial-gradient(circle, var(--color-border) 0.5px, transparent 0.5px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                  <svg className="w-5 h-5" style={{ color: 'var(--color-accent-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Select a band to explore
                </p>
                <p className="text-xs mt-1.5 font-mono" style={{ color: 'var(--color-text-faint)' }}>
                  11 bands &middot; {atlasData.devices.length} devices &middot; {atlasData.neurorights.length} neurorights
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Threat Map view */
        <ThreatMap
          threats={THREAT_VECTORS}
          tactics={THREAT_TACTICS}
          bands={HOURGLASS_BANDS.map(b => ({ id: b.id, name: b.name, zone: b.zone }))}
          onBandHighlight={handleThreatMapBandHighlight}
        />
      )}
    </div>
  );
}
