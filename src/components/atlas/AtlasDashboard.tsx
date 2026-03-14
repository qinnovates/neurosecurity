/**
 * AtlasDashboard — unified dashboard putting hourglass and 3D brain side-by-side.
 * Linked interaction: clicking either side updates both + detail panel.
 * All data driven from JSON via atlas-data.ts.
 */

import { Component, Suspense, useState, useEffect, useCallback, lazy, type ReactNode } from 'react';
import { AtlasProvider, useAtlas, type ViewMode } from './AtlasContext';
import HourglassVisualization from './HourglassVisualization';
import AtlasDetailPanel from './AtlasDetailPanel';
import ThreatMap from './ThreatMap';
import { THREAT_VECTORS, THREAT_TACTICS } from '../../lib/threat-data';
import { HOURGLASS_BANDS } from '../../lib/qif-constants';
import type { AtlasData } from '../../lib/atlas-data';
import type { BrainView } from '../../lib/brain-view-data';

// Lazy-load with retry — if the chunk fails to load (network issue, stale cache),
// retry up to 3 times with increasing delay before giving up.
function lazyWithRetry<T extends { default: React.ComponentType<any> }>(
  loader: () => Promise<T>,
  retries = 3,
): React.LazyExoticComponent<T['default']> {
  return lazy(() => {
    let attempt = 0;
    const tryLoad = (): Promise<T> =>
      loader().catch((err) => {
        attempt++;
        if (attempt >= retries) throw err;
        // Increasing delay: 1s, 2s, 3s — gives cache/network time to recover
        return new Promise<T>((resolve) =>
          setTimeout(() => resolve(tryLoad()), attempt * 1000)
        );
      });
    return tryLoad();
  });
}

const BrainVisualization = lazyWithRetry(() => import('../brain/BrainVisualization'));

// Error boundary — catches WebGL crashes, chunk load failures, and Three.js errors.
// Shows a useful fallback instead of a blank page.
interface ErrorBoundaryProps {
  fallback: (props: { error: Error; retry: () => void }) => ReactNode;
  children: ReactNode;
}
interface ErrorBoundaryState {
  error: Error | null;
}
class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  retry = () => { this.setState({ error: null }); };
  render() {
    if (this.state.error) return this.props.fallback({ error: this.state.error, retry: this.retry });
    return this.props.children;
  }
}

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

function SafariDialog({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{ background: 'rgba(245, 158, 11, 0.12)' }}
          >
            <svg className="w-5 h-5" style={{ color: '#f59e0b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
            >
              Browser Compatibility
            </h2>
          </div>
        </div>

        <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
          The QIF Atlas uses WebGL for 3D brain visualization, which has limited support in Safari.
        </p>
        <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
          For the best experience, please use <strong style={{ color: 'var(--color-text-primary)' }}>Google Chrome</strong> or <strong style={{ color: 'var(--color-text-primary)' }}>Mozilla Firefox</strong>.
        </p>

        <div className="flex flex-col gap-2">
          <a
            href="https://www.google.com/chrome/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-accent-primary)',
              color: '#fff',
            }}
          >
            Download Chrome
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-faint)',
              border: '1px solid var(--color-border)',
            }}
          >
            Continue with Safari anyway
          </button>
        </div>
      </div>
    </div>
  );
}

type DashboardView = 'hourglass' | 'threatmap';

function DashboardInner({ atlasData, brainViews, threatDetails }: Props) {
  const { selectedBandId, activeTab, viewMode, selectBand, setActiveTab, setViewMode } = useAtlas();
  const [mobileTab, setMobileTab] = useState<'hourglass' | 'brain'>('hourglass');
  const [showSafariDialog, setShowSafariDialog] = useState(false);
  const [dashView, setDashView] = useState<DashboardView>('hourglass');

  const handleThreatMapBandHighlight = useCallback((bandIds: string[]) => {
    // Highlight first band in the list
    if (bandIds.length > 0 && !selectedBandId) {
      // Don't auto-select, just let the threat map manage its own state
    }
  }, [selectedBandId]);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
    if (isSafari) setShowSafariDialog(true);
  }, []);

  const selectedBand = selectedBandId
    ? atlasData.bands.find(b => b.id === selectedBandId) ?? null
    : null;

  // Map hourglass band ID to brain view region ID (they're the same: N7, N6, etc.)
  const brainViewId = VIEW_MODE_CONFIG.find(v => v.id === viewMode)?.brainViewId ?? 'security';

  const handleBrainRegionSelect = (regionId: string | null) => {
    selectBand(regionId);
  };

  return (
    <div className="space-y-4">
      {showSafariDialog && <SafariDialog onDismiss={() => setShowSafariDialog(false)} />}

      {/* Dashboard view toggle — command bar */}
      <div className="flex items-center justify-center gap-4 glass rounded-xl px-4 py-2" style={{ background: 'var(--color-glass-bg)' }}>
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
                    className="px-4 py-2 rounded-full text-xs font-medium transition-all"
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
              onClick={() => setMobileTab('brain')}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: mobileTab === 'brain' ? 'var(--color-bg-secondary)' : 'transparent',
                color: mobileTab === 'brain' ? 'var(--color-text-primary)' : 'var(--color-text-faint)',
                border: `1px solid ${mobileTab === 'brain' ? 'var(--color-border)' : 'transparent'}`,
              }}
            >
              Brain
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

            {/* Brain render (60% desktop, full mobile when active) */}
            <div
              className={`lg:w-[60%] glass rounded-xl overflow-hidden ${mobileTab !== 'brain' ? 'hidden lg:block' : ''}`}
              style={{ minHeight: '400px' }}
            >
              <WebGLErrorBoundary fallback={({ error, retry }) => (
                <div className="flex flex-col items-center justify-center h-full gap-3" style={{ minHeight: '400px' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
                    3D visualization failed to load
                  </p>
                  <p className="text-xs max-w-xs text-center" style={{ color: 'var(--color-text-faint)' }}>
                    {error.message.includes('WebGL')
                      ? 'Your browser may not support WebGL. Try Chrome or Firefox.'
                      : 'A loading error occurred. This can happen with cached or interrupted page loads.'}
                  </p>
                  <button
                    onClick={retry}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: 'var(--color-accent-primary)',
                      color: '#fff',
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full" style={{ minHeight: '400px' }}>
                    <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Loading 3D brain...</p>
                  </div>
                }>
                  <BrainVisualization
                    views={brainViews}
                    defaultView={brainViewId}
                    externalActiveRegion={selectedBandId}
                    onRegionSelect={handleBrainRegionSelect}
                    externalViewId={brainViewId}
                    onViewChange={(id) => {
                      const mode = VIEW_MODE_CONFIG.find(v => v.brainViewId === id);
                      if (mode) setViewMode(mode.id);
                    }}
                    hideViewToggle
                  />
                </Suspense>
              </WebGLErrorBoundary>
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
                  Select a band or brain region to explore
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
