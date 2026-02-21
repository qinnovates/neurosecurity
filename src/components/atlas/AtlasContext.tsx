/**
 * AtlasContext — shared state for the unified Atlas Dashboard.
 * Links hourglass, brain visualization, and detail panel interactions.
 * Syncs selected band + tab to URL hash for deep-linking.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type ViewMode = 'security' | 'clinical' | 'governance';
export type DetailTab = 'overview' | 'devices' | 'controls' | 'dsm' | 'security';

interface AtlasState {
  selectedBandId: string | null;
  activeTab: DetailTab;
  viewMode: ViewMode;
  selectBand: (bandId: string | null) => void;
  setActiveTab: (tab: DetailTab) => void;
  setViewMode: (mode: ViewMode) => void;
}

const AtlasCtx = createContext<AtlasState | null>(null);

export function useAtlas(): AtlasState {
  const ctx = useContext(AtlasCtx);
  if (!ctx) throw new Error('useAtlas must be used within AtlasProvider');
  return ctx;
}

function parseHash(): { bandId: string | null; tab: DetailTab | null } {
  if (typeof window === 'undefined') return { bandId: null, tab: null };
  const hash = window.location.hash.replace('#', '');
  if (!hash) return { bandId: null, tab: null };
  const [bandId, tab] = hash.split('/');
  const validTabs: DetailTab[] = ['overview', 'devices', 'controls', 'dsm', 'security'];
  return {
    bandId: bandId || null,
    tab: validTabs.includes(tab as DetailTab) ? (tab as DetailTab) : null,
  };
}

function updateHash(bandId: string | null, tab: DetailTab) {
  if (typeof window === 'undefined') return;
  if (bandId) {
    const newHash = `#${bandId}/${tab}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  } else if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname);
  }
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('security');

  // Initialize from hash on mount
  useEffect(() => {
    const { bandId, tab } = parseHash();
    if (bandId) setSelectedBandId(bandId);
    if (tab) setActiveTab(tab);
  }, []);

  // Sync hash on state change
  useEffect(() => {
    updateHash(selectedBandId, activeTab);
  }, [selectedBandId, activeTab]);

  // Listen for hash changes (back/forward navigation)
  useEffect(() => {
    const handler = () => {
      const { bandId, tab } = parseHash();
      setSelectedBandId(bandId);
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const selectBand = useCallback((bandId: string | null) => {
    setSelectedBandId(prev => prev === bandId ? null : bandId);
  }, []);

  return (
    <AtlasCtx.Provider value={{ selectedBandId, activeTab, viewMode, selectBand, setActiveTab, setViewMode }}>
      {children}
    </AtlasCtx.Provider>
  );
}
