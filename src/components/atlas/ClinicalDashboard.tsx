/**
 * ClinicalDashboard — Neural Impact Chain visualization.
 *
 * Four-column flow: Technique → Band → Pathway/Region → DSM Outcome
 * All data dynamic from shared JSON files — any update propagates automatically.
 * SVG-first pattern (following NeurorightsPentagon.tsx).
 *
 * For threat modeling purposes — diagnostic category references, not diagnostic claims.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  ClinicalData,
  ClinicalPathway,
  ClinicalNeurotransmitter,
  ClinicalRegion,
  ClinicalDsmCondition,
  NeuralImpactChain,
} from '../../lib/clinical-data';
import { THREAT_VECTORS, type ThreatVector, type BandId } from '../../lib/threat-data';

// ═══ Types ═══

type ViewTab = 'zoom' | 'chain' | 'pathways' | 'neurotransmitters' | 'dsm';
type ChainDirection = 'attack' | 'therapy' | 'dual';

/** Semantic zoom levels — from macro (band) to micro (synapse) */
type ZoomLevel = 'techniques' | 'bands' | 'regions' | 'pathways' | 'neurotransmitters' | 'receptors' | 'molecular';

interface ZoomState {
  level: ZoomLevel;
  techniqueId: string | null;
  bandId: string | null;
  regionId: string | null;
  pathwayId: string | null;
  neurotransmitterId: string | null;
  receptorId: string | null;
}

const ZOOM_LEVELS: { id: ZoomLevel; label: string; icon: string; color: string }[] = [
  { id: 'techniques', label: 'Techniques', icon: '!', color: '#dc2626' },
  { id: 'bands', label: 'QIF Bands', icon: '◇', color: '#f59e0b' },
  { id: 'regions', label: 'Brain Regions', icon: '◈', color: '#10b981' },
  { id: 'pathways', label: 'Neural Pathways', icon: '⟶', color: '#8b5cf6' },
  { id: 'neurotransmitters', label: 'Neurotransmitters', icon: '⬡', color: '#3b82f6' },
  { id: 'receptors', label: 'Receptors', icon: '◉', color: '#ec4899' },
  { id: 'molecular', label: 'Molecular', icon: '⚛', color: '#ef4444' },
];

interface Props {
  data: ClinicalData;
}

// ═══ Colors ═══

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#84cc16',
};

const PATHWAY_TYPE_COLORS: Record<string, string> = {
  neurotransmitter: '#8b5cf6',
  sensory_ascending: '#3b82f6',
  motor_descending: '#10b981',
  limbic_circuit: '#f59e0b',
  cortical_network: '#ec4899',
  cerebellar_loop: '#06b6d4',
  association_tract: '#6366f1',
  autonomic: '#14b8a6',
};

const BAND_COLORS: Record<string, string> = {
  N7: '#166534', N6: '#3a7d44', N5: '#5c7a38', N4: '#72772f',
  N3: '#877226', N2: '#9b6c1e', N1: '#ae6616', I0: '#f59e0b',
  S1: '#93c5fd', S2: '#60a5fa', S3: '#3b82f6',
};

const CLUSTER_COLORS: Record<string, string> = {
  cognitive_psychotic: '#f59e0b',
  mood_trauma: '#eab308',
  motor_neurocognitive: '#ef4444',
  persistent_personality: '#a855f7',
  non_diagnostic: '#94a3b8',
};

// ═══ Stats Banner ═══

function StatsBanner({ stats }: { stats: ClinicalData['stats'] }) {
  const items = [
    { label: 'Pathways', value: stats.totalPathways, color: '#8b5cf6' },
    { label: 'Neurotransmitters', value: stats.totalNeurotransmitters, color: '#3b82f6' },
    { label: 'Brain Regions', value: stats.totalRegions, color: '#10b981' },
    { label: 'DSM Conditions', value: stats.totalDsmConditions, color: '#f59e0b' },
    { label: 'Receptors', value: stats.totalReceptors, color: '#ec4899' },
    { label: 'Impact Chains', value: stats.chainLinks, color: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg p-3 text-center"
          style={{
            background: `${item.color}08`,
            border: `1px solid ${item.color}20`,
          }}
        >
          <div
            className="text-xl font-bold"
            style={{ color: item.color, fontFamily: 'var(--font-heading)' }}
          >
            {item.value}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══ Tab Bar ═══

const TABS: { id: ViewTab; label: string; icon: string }[] = [
  { id: 'zoom', label: 'Drill-Down', icon: '⊕' },
  { id: 'chain', label: 'Impact Chain', icon: '⟶' },
  { id: 'pathways', label: 'Pathways', icon: '◈' },
  { id: 'neurotransmitters', label: 'Neurotransmitters', icon: '⬡' },
  { id: 'dsm', label: 'DSM-5-TR', icon: '◉' },
];

function TabBar({ active, onChange }: { active: ViewTab; onChange: (t: ViewTab) => void }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full p-0.5 mb-6 w-fit mx-auto"
      style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
          style={{
            background: active === tab.id ? 'var(--color-accent-primary)' : 'transparent',
            color: active === tab.id ? '#fff' : 'var(--color-text-faint)',
          }}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ═══ Neural Impact Chain View ═══

// ═══ Semantic Zoom View ═══

function SemanticZoomView({ data }: { data: ClinicalData }) {
  const [zoom, setZoom] = useState<ZoomState>({
    level: 'techniques',
    techniqueId: null,
    bandId: null,
    regionId: null,
    pathwayId: null,
    neurotransmitterId: null,
    receptorId: null,
  });

  // Breadcrumb trail
  const breadcrumbs = useMemo(() => {
    const resetZoom: ZoomState = { level: 'techniques', techniqueId: null, bandId: null, regionId: null, pathwayId: null, neurotransmitterId: null, receptorId: null };
    const crumbs: { label: string; level: ZoomLevel; onClick: () => void }[] = [
      {
        label: 'All Techniques',
        level: 'techniques',
        onClick: () => setZoom(resetZoom),
      },
    ];
    if (zoom.techniqueId) {
      const tech = THREAT_VECTORS.find((t) => t.id === zoom.techniqueId);
      crumbs.push({
        label: tech ? (tech.name.length > 20 ? tech.name.slice(0, 20) + '...' : tech.name) : zoom.techniqueId,
        level: 'bands',
        onClick: () => setZoom({ ...resetZoom, level: 'bands', techniqueId: zoom.techniqueId }),
      });
    }
    if (zoom.bandId) {
      crumbs.push({
        label: zoom.bandId,
        level: 'regions',
        onClick: () => setZoom({ ...zoom, level: 'regions', regionId: null, pathwayId: null, neurotransmitterId: null, receptorId: null }),
      });
    }
    if (zoom.regionId) {
      const region = data.regions.find((r) => r.id === zoom.regionId);
      crumbs.push({
        label: region?.abbreviation ?? zoom.regionId,
        level: 'pathways',
        onClick: () => setZoom({ ...zoom, level: 'pathways', pathwayId: null, neurotransmitterId: null, receptorId: null }),
      });
    }
    if (zoom.pathwayId) {
      const pathway = data.pathways.find((p) => p.id === zoom.pathwayId);
      crumbs.push({
        label: pathway?.name.split(' ')[0] ?? zoom.pathwayId,
        level: 'neurotransmitters',
        onClick: () => setZoom({ ...zoom, level: 'neurotransmitters', neurotransmitterId: null, receptorId: null }),
      });
    }
    if (zoom.neurotransmitterId) {
      const nt = data.neurotransmitters.find((n) => n.id === zoom.neurotransmitterId);
      crumbs.push({
        label: nt?.abbreviation ?? zoom.neurotransmitterId,
        level: 'receptors',
        onClick: () => setZoom({ ...zoom, level: 'receptors', receptorId: null }),
      });
    }
    if (zoom.receptorId) {
      crumbs.push({
        label: zoom.receptorId,
        level: 'molecular',
        onClick: () => setZoom({ ...zoom, level: 'molecular' }),
      });
    }
    return crumbs;
  }, [zoom, data]);

  // Get the current zoom level index
  const currentLevelIdx = ZOOM_LEVELS.findIndex((z) => z.id === zoom.level);

  return (
    <div>
      {/* Zoom level indicator */}
      <div className="flex items-center gap-1 mb-4">
        {ZOOM_LEVELS.map((level, i) => (
          <div key={level.id} className="flex items-center">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all"
              style={{
                background: i <= currentLevelIdx ? `${level.color}15` : 'transparent',
                color: i <= currentLevelIdx ? level.color : 'var(--color-text-faint)',
                opacity: i <= currentLevelIdx ? 1 : 0.4,
              }}
            >
              <span>{level.icon}</span>
              <span className="hidden sm:inline">{level.label}</span>
            </div>
            {i < ZOOM_LEVELS.length - 1 && (
              <span className="text-[10px] mx-0.5" style={{ color: 'var(--color-text-faint)', opacity: 0.3 }}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Breadcrumb trail */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {breadcrumbs.map((crumb, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={crumb.onClick}
              className="text-[11px] font-medium px-2 py-0.5 rounded transition-colors"
              style={{
                color: i === breadcrumbs.length - 1 ? 'var(--color-text-primary)' : 'var(--color-accent-primary)',
                background: i === breadcrumbs.length - 1 ? 'var(--color-bg-secondary)' : 'transparent',
              }}
            >
              {crumb.label}
            </button>
            {i < breadcrumbs.length - 1 && (
              <span className="text-[10px] mx-0.5" style={{ color: 'var(--color-text-faint)' }}>/</span>
            )}
          </div>
        ))}
      </div>

      {/* Content based on zoom level */}
      {zoom.level === 'techniques' && (
        <TechniquesZoom
          data={data}
          onSelect={(techniqueId) => setZoom({ ...zoom, level: 'bands', techniqueId })}
          onSkip={() => setZoom({ ...zoom, level: 'bands', techniqueId: null })}
        />
      )}
      {zoom.level === 'bands' && (
        <BandsZoom
          data={data}
          techniqueId={zoom.techniqueId}
          onSelect={(bandId) => setZoom({ ...zoom, level: 'regions', bandId })}
          onBack={zoom.techniqueId ? () => setZoom({ ...zoom, level: 'techniques', techniqueId: null, bandId: null }) : undefined}
        />
      )}
      {zoom.level === 'regions' && zoom.bandId && (
        <RegionsZoom
          data={data}
          bandId={zoom.bandId}
          onSelect={(regionId) => setZoom({ ...zoom, level: 'pathways', regionId })}
          onBack={() => setZoom({ ...zoom, level: 'bands', bandId: null })}
        />
      )}
      {zoom.level === 'pathways' && (zoom.regionId || zoom.bandId) && (
        <PathwaysZoom
          data={data}
          regionId={zoom.regionId}
          bandId={zoom.bandId!}
          onSelect={(pathwayId) => setZoom({ ...zoom, level: 'neurotransmitters', pathwayId })}
          onBack={() => setZoom({ ...zoom, level: 'regions', regionId: null, pathwayId: null })}
        />
      )}
      {zoom.level === 'neurotransmitters' && (
        <NeurotransmitterZoom
          data={data}
          pathwayId={zoom.pathwayId}
          bandId={zoom.bandId}
          onSelect={(ntId) => setZoom({ ...zoom, level: 'receptors', neurotransmitterId: ntId })}
          onBack={() => setZoom({ ...zoom, level: 'pathways', pathwayId: null, neurotransmitterId: null })}
        />
      )}
      {zoom.level === 'receptors' && zoom.neurotransmitterId && (
        <ReceptorZoom
          data={data}
          neurotransmitterId={zoom.neurotransmitterId}
          onSelect={(rId) => setZoom({ ...zoom, level: 'molecular', receptorId: rId })}
          onBack={() => setZoom({ ...zoom, level: 'neurotransmitters', neurotransmitterId: null, receptorId: null })}
        />
      )}
      {zoom.level === 'molecular' && zoom.neurotransmitterId && (
        <MolecularZoom
          data={data}
          neurotransmitterId={zoom.neurotransmitterId}
          receptorId={zoom.receptorId}
          onBack={() => setZoom({ ...zoom, level: 'receptors', receptorId: null })}
        />
      )}
    </div>
  );
}

// ═══ Zoom Sub-Views ═══

function TechniquesZoom({ data, onSelect, onSkip }: {
  data: ClinicalData;
  onSelect: (techniqueId: string) => void;
  onSkip: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  const techniques = useMemo(() => {
    let filtered = THREAT_VECTORS;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) => t.name.toLowerCase().includes(term) || t.id.toLowerCase().includes(term) || t.description.toLowerCase().includes(term)
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }
    if (selectedSeverity) {
      filtered = filtered.filter((t) => t.severity === selectedSeverity);
    }
    return filtered.sort((a, b) => b.niss.score - a.niss.score);
  }, [searchTerm, selectedCategory, selectedSeverity]);

  const categories = useMemo(() => {
    const catMap = new Map<string, number>();
    for (const t of THREAT_VECTORS) {
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + 1);
    }
    return Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search techniques by name, ID, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs flex-1 min-w-[200px]"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          onClick={onSkip}
          className="px-3 py-1.5 rounded-lg text-[11px] font-medium"
          style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-faint)', border: '1px solid var(--color-border)' }}
        >
          Skip to Bands →
        </button>
      </div>

      {/* Severity + Category filters */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setSelectedSeverity(selectedSeverity === sev ? null : sev)}
            className="px-2 py-1 rounded-full text-[10px] font-medium"
            style={{
              background: selectedSeverity === sev ? `${SEVERITY_COLORS[sev]}20` : 'var(--color-bg-secondary)',
              color: selectedSeverity === sev ? SEVERITY_COLORS[sev] : 'var(--color-text-faint)',
            }}
          >
            {sev}
          </button>
        ))}
        <span className="text-[10px] self-center mx-1" style={{ color: 'var(--color-text-faint)' }}>|</span>
        {categories.map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className="px-2 py-1 rounded-full text-[10px] font-medium"
            style={{
              background: selectedCategory === cat ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
              color: selectedCategory === cat ? '#fff' : 'var(--color-text-faint)',
            }}
          >
            {cat} ({count})
          </button>
        ))}
      </div>

      <div className="text-[10px] mb-3" style={{ color: 'var(--color-text-faint)' }}>
        {techniques.length} technique{techniques.length !== 1 ? 's' : ''} | Select one to trace its full neural impact chain
      </div>

      {/* Technique grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[600px] overflow-y-auto pr-1">
        {techniques.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="text-left rounded-lg p-3 transition-all hover:shadow-md group"
            style={{ background: 'var(--color-bg-primary)', border: `1px solid var(--color-border)` }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SEVERITY_COLORS[t.severity] }} />
                <span className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {t.name}
                </span>
              </div>
              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" style={{ color: 'var(--color-accent-primary)' }}>
                Drill in →
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-faint)' }}>{t.id}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${SEVERITY_COLORS[t.severity]}12`, color: SEVERITY_COLORS[t.severity] }}>
                {t.niss.score}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>{t.category}</span>
              <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-faint)' }}>
                {t.status}
              </span>
            </div>
            {/* Band pills */}
            <div className="flex flex-wrap gap-1">
              {t.bands.map((b) => (
                <span
                  key={b}
                  className="px-1 py-0.5 rounded text-[9px] font-mono"
                  style={{ background: `${BAND_COLORS[b] ?? '#6b7280'}12`, color: BAND_COLORS[b] ?? '#6b7280' }}
                >
                  {b}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {techniques.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-faint)' }}>
          No techniques match your filters.
        </p>
      )}
    </div>
  );
}

function BandsZoom({ data, techniqueId, onSelect, onBack }: {
  data: ClinicalData;
  techniqueId?: string | null;
  onSelect: (bandId: string) => void;
  onBack?: () => void;
}) {
  const bandOrder = ['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1', 'I0', 'S1', 'S2', 'S3'];
  const technique = techniqueId ? THREAT_VECTORS.find((t) => t.id === techniqueId) : null;
  const filteredBands = technique ? bandOrder.filter((b) => technique.bands.includes(b as BandId)) : bandOrder;

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--color-accent-primary)' }}>
          ← Back to techniques
        </button>
      )}
      {technique && (
        <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS[technique.severity] }} />
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{technique.name}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${SEVERITY_COLORS[technique.severity]}15`, color: SEVERITY_COLORS[technique.severity] }}>
              NISS {technique.niss.score}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-faint)' }}>{technique.id}</span>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
            Showing {filteredBands.length} affected band{filteredBands.length !== 1 ? 's' : ''} | {technique.category} | {technique.status}
          </p>
        </div>
      )}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {filteredBands.map((bandId) => {
        const bcd = data.bandClinicalData[bandId];
        if (!bcd) return null;
        const color = BAND_COLORS[bandId] ?? '#6b7280';
        const regions = data.regions.filter((r) => r.band === bandId);

        return (
          <button
            key={bandId}
            onClick={() => onSelect(bandId)}
            className="text-left rounded-xl p-4 transition-all hover:shadow-md group"
            style={{
              background: 'var(--color-bg-primary)',
              border: `1px solid ${color}20`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="px-2 py-1 rounded-lg text-sm font-mono font-bold"
                style={{ background: `${color}15`, color }}
              >
                {bandId}
              </span>
              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-accent-primary)' }}>
                Drill in →
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color }}>{regions.length}</div>
                <div className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>Regions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color }}>{bcd.pathways.length}</div>
                <div className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>Pathways</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color }}>{bcd.neurotransmitters.length}</div>
                <div className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>NTs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color }}>{bcd.dsmCodes.length}</div>
                <div className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>DSM</div>
              </div>
            </div>
            {/* Mini region pills */}
            <div className="flex flex-wrap gap-1 mt-3">
              {regions.slice(0, 4).map((r) => (
                <span key={r.id} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${color}08`, color: 'var(--color-text-faint)' }}>
                  {r.abbreviation}
                </span>
              ))}
              {regions.length > 4 && (
                <span className="text-[9px] px-1.5 py-0.5" style={{ color: 'var(--color-text-faint)' }}>
                  +{regions.length - 4}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
    </div>
  );
}

function RegionsZoom({
  data, bandId, onSelect, onBack,
}: { data: ClinicalData; bandId: string; onSelect: (regionId: string) => void; onBack: () => void }) {
  const regions = data.regions.filter((r) => r.band === bandId);
  const color = BAND_COLORS[bandId] ?? '#6b7280';

  return (
    <div>
      <button onClick={onBack} className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--color-accent-primary)' }}>
        ← Back to bands
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() => onSelect(region.id)}
            className="text-left rounded-lg p-4 transition-all hover:shadow-md group"
            style={{ background: 'var(--color-bg-primary)', border: `1px solid var(--color-border)` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {region.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${color}10`, color }}>
                  {region.abbreviation}
                </span>
              </div>
              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-accent-primary)' }}>
                Drill in →
              </span>
            </div>
            <p className="text-[11px] mb-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {region.function}
            </p>
            <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
              <span>{region.pathwayCount} pathways</span>
              <span>{region.neurotransmitters.length} NTs</span>
              <span>{region.dsmCodes.length} DSM</span>
              <span>{region.threatCount} threats</span>
            </div>
            {/* NT pills */}
            {region.neurotransmitters.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {region.neurotransmitters.slice(0, 5).map((ntId) => {
                  const nt = data.neurotransmitters.find((n) => n.id === ntId);
                  return (
                    <span key={ntId} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: '#8b5cf608', color: '#8b5cf6' }}>
                      {nt?.abbreviation ?? ntId}
                    </span>
                  );
                })}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function PathwaysZoom({
  data, regionId, bandId, onSelect, onBack,
}: { data: ClinicalData; regionId: string | null; bandId: string; onSelect: (pathwayId: string) => void; onBack: () => void }) {
  const pathways = regionId
    ? data.pathways.filter((p) => p.originRegions.includes(regionId) || p.targetRegions.includes(regionId))
    : data.pathways.filter((p) => p.originBand === bandId || p.targetBands.includes(bandId));

  return (
    <div>
      <button onClick={onBack} className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--color-accent-primary)' }}>
        ← Back to regions
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {pathways.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="text-left rounded-lg p-4 transition-all hover:shadow-md group"
            style={{ background: 'var(--color-bg-primary)', border: `1px solid var(--color-border)` }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: PATHWAY_TYPE_COLORS[p.type] }} />
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
              </div>
              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-accent-primary)' }}>
                Drill in →
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px]" style={{ color: PATHWAY_TYPE_COLORS[p.type] }}>{p.type.replace(/_/g, ' ')}</span>
              {p.neurotransmitter && (
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#8b5cf610', color: '#8b5cf6' }}>
                  {p.neurotransmitter}
                </span>
              )}
            </div>
            <p className="text-[10px] line-clamp-2" style={{ color: 'var(--color-text-faint)' }}>
              {p.function}
            </p>
            {p.disruptionEffects && (
              <p className="text-[10px] mt-1" style={{ color: '#ef4444' }}>
                Disruption: {p.disruptionEffects.slice(0, 80)}{p.disruptionEffects.length > 80 ? '...' : ''}
              </p>
            )}
            {p.dsmNames.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {p.dsmNames.slice(0, 3).map((name, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: '#f59e0b10', color: '#f59e0b' }}>
                    {name.length > 25 ? name.slice(0, 25) + '...' : name}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
      {pathways.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-faint)' }}>
          No pathways mapped for this region yet.
        </p>
      )}
    </div>
  );
}

function NeurotransmitterZoom({
  data, pathwayId, bandId, onSelect, onBack,
}: { data: ClinicalData; pathwayId: string | null; bandId: string | null; onSelect: (ntId: string) => void; onBack: () => void }) {
  // If we came from a pathway, show NTs related to that pathway
  const pathway = pathwayId ? data.pathways.find((p) => p.id === pathwayId) : null;
  const nts = pathway?.neurotransmitter
    ? data.neurotransmitters.filter((nt) => nt.id === pathway.neurotransmitter)
    : bandId
    ? data.neurotransmitters.filter((nt) => nt.primaryBands.includes(bandId))
    : data.neurotransmitters;

  // If pathway has a specific NT, also show related NTs in same bands
  const relatedNTs = pathway?.neurotransmitter
    ? data.neurotransmitters.filter(
        (nt) => nt.id !== pathway.neurotransmitter && pathway.targetBands.some((b) => nt.primaryBands.includes(b))
      ).slice(0, 4)
    : [];

  const allNTs = [...nts, ...relatedNTs.filter((r) => !nts.find((n) => n.id === r.id))];

  return (
    <div>
      <button onClick={onBack} className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--color-accent-primary)' }}>
        ← Back to pathways
      </button>
      {pathway && (
        <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <p className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
            Showing neurotransmitters for: <strong style={{ color: 'var(--color-text-primary)' }}>{pathway.name}</strong>
            {pathway.neurotransmitter && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#8b5cf610', color: '#8b5cf6' }}>
                Primary: {pathway.neurotransmitter}
              </span>
            )}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {allNTs.map((nt) => (
          <button
            key={nt.id}
            onClick={() => onSelect(nt.id)}
            className="text-left rounded-lg p-4 transition-all hover:shadow-md group"
            style={{ background: 'var(--color-bg-primary)', border: `1px solid var(--color-border)` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{nt.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: '#8b5cf610', color: '#8b5cf6' }}>
                  {nt.abbreviation}
                </span>
              </div>
              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-accent-primary)' }}>
                Drill in →
              </span>
            </div>
            <div className="text-[10px] mb-2" style={{ color: 'var(--color-text-faint)' }}>
              {nt.chemicalClass.replace(/_/g, ' ')} | {nt.receptorCount} receptors | {nt.synthesisSteps} synthesis steps
            </div>
            {/* Cofactor pills */}
            <div className="flex flex-wrap gap-1">
              {nt.cofactors.slice(0, 3).map((c, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: '#ef444408', color: '#ef4444' }}>
                  {c.name.split('(')[0].trim()}
                </span>
              ))}
              {nt.cofactors.length > 3 && (
                <span className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>+{nt.cofactors.length - 3}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReceptorZoom({
  data, neurotransmitterId, onSelect, onBack,
}: { data: ClinicalData; neurotransmitterId: string; onSelect: (rId: string) => void; onBack: () => void }) {
  // Get receptor data from the raw neurotransmitter JSON
  const nt = data.neurotransmitters.find((n) => n.id === neurotransmitterId);

  return (
    <div>
      <button onClick={onBack} className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--color-accent-primary)' }}>
        ← Back to neurotransmitters
      </button>
      {nt && (
        <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <p className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>{nt.name} ({nt.abbreviation})</strong> — {nt.receptorCount} receptor subtypes
          </p>
        </div>
      )}
      {nt?.receptorIds && nt.receptorIds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {nt.receptorIds.map((rId) => (
            <button
              key={rId}
              onClick={() => onSelect(rId)}
              className="text-left rounded-lg p-4 transition-all hover:shadow-md group"
              style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-mono" style={{ color: '#ec4899' }}>{rId}</span>
                <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-accent-primary)' }}>
                  Molecular →
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-faint)' }}>
          Receptor subtype data will be populated when research agents complete.
        </p>
      )}
    </div>
  );
}

function MolecularZoom({
  data, neurotransmitterId, receptorId, onBack,
}: { data: ClinicalData; neurotransmitterId: string; receptorId: string | null; onBack: () => void }) {
  const nt = data.neurotransmitters.find((n) => n.id === neurotransmitterId);

  return (
    <div>
      <button onClick={onBack} className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--color-accent-primary)' }}>
        ← Back to receptors
      </button>
      <div className="rounded-xl p-5" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
          Molecular Detail — {nt?.name ?? neurotransmitterId}
          {receptorId && <span className="ml-2 font-mono text-xs" style={{ color: '#ec4899' }}>{receptorId}</span>}
        </h3>

        {/* Synthesis pathway */}
        {nt && (
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
              Synthesis Pathway
            </h4>
            <div className="flex items-center flex-wrap gap-2">
              {nt.keyEnzymes.map((gene, i) => (
                <div key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>→</span>}
                  <span className="px-2 py-1 rounded text-[11px] font-mono" style={{ background: '#ef444410', color: '#ef4444' }}>
                    {gene}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cofactor dependency chain */}
        {nt && nt.cofactors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
              Cofactor Dependencies
            </h4>
            <div className="space-y-2">
              {nt.cofactors.map((c, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {c.name}
                    </span>
                  </div>
                  <p className="text-[11px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Role: {c.role}
                  </p>
                  {c.deficiencyEffect && (
                    <p className="text-[11px]" style={{ color: '#ef4444' }}>
                      Deficiency: {c.deficiencyEffect}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DSM conditions */}
        {nt && nt.dsmConditions.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
              DSM-5-TR Conditions (for threat modeling)
            </h4>
            <div className="space-y-1">
              {nt.dsmConditions.map((d, i) => (
                <div key={i} className="text-[11px] flex items-start gap-2">
                  <span className="font-mono shrink-0" style={{ color: '#f59e0b' }}>{d.code}</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{d.name}</span>
                  {d.mechanism && (
                    <span style={{ color: 'var(--color-text-faint)' }}>— {d.mechanism}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[9px] mt-4 italic" style={{ color: 'var(--color-text-faint)' }}>
          Molecular data dynamically compiled from shared/qif-neurotransmitters.json.
          Gene names follow HGNC conventions. Diagnostic references for threat modeling only.
        </p>
      </div>
    </div>
  );
}

// ═══ Neural Impact Chain View ═══

function ImpactChainView({ data }: { data: ClinicalData }) {
  const [direction, setDirection] = useState<ChainDirection>('attack');
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<NeuralImpactChain | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter chains by band and search
  const filteredChains = useMemo(() => {
    let chains = data.impactChains;
    if (selectedBand) {
      chains = chains.filter((c) => c.band.id === selectedBand);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      chains = chains.filter(
        (c) =>
          c.technique.name.toLowerCase().includes(term) ||
          c.pathways.some((p) => p.name.toLowerCase().includes(term)) ||
          c.dsmConditions.some((d) => d.name.toLowerCase().includes(term))
      );
    }
    // Deduplicate by technique+band
    const seen = new Set<string>();
    return chains.filter((c) => {
      const key = `${c.technique.id}:${c.band.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data.impactChains, selectedBand, searchTerm]);

  // Get unique bands from chains
  const activeBands = useMemo(() => {
    const bandMap = new Map<string, { id: string; name: string; count: number }>();
    for (const chain of data.impactChains) {
      const existing = bandMap.get(chain.band.id);
      if (existing) {
        existing.count++;
      } else {
        bandMap.set(chain.band.id, { ...chain.band, count: 1 });
      }
    }
    return Array.from(bandMap.values()).sort((a, b) => {
      const order = ['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1', 'I0', 'S1', 'S2', 'S3'];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });
  }, [data.impactChains]);

  return (
    <div>
      {/* Direction toggle */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-1 rounded-full p-0.5" style={{ background: 'var(--color-bg-secondary)' }}>
          {(['attack', 'therapy', 'dual'] as ChainDirection[]).map((d) => {
            const colors = { attack: '#ef4444', therapy: '#10b981', dual: '#f59e0b' };
            const labels = { attack: 'Attack Vector', therapy: 'Therapeutic', dual: 'Dual-Use' };
            return (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
                style={{
                  background: direction === d ? `${colors[d]}15` : 'transparent',
                  color: direction === d ? colors[d] : 'var(--color-text-faint)',
                }}
              >
                {labels[d]}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Search techniques, pathways, conditions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs w-64"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Band filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setSelectedBand(null)}
          className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
          style={{
            background: selectedBand === null ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
            color: selectedBand === null ? '#fff' : 'var(--color-text-faint)',
          }}
        >
          All Bands
        </button>
        {activeBands.map((band) => (
          <button
            key={band.id}
            onClick={() => setSelectedBand(band.id === selectedBand ? null : band.id)}
            className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1"
            style={{
              background: selectedBand === band.id ? `${BAND_COLORS[band.id]}20` : 'var(--color-bg-secondary)',
              color: selectedBand === band.id ? BAND_COLORS[band.id] : 'var(--color-text-faint)',
              border: `1px solid ${selectedBand === band.id ? `${BAND_COLORS[band.id]}40` : 'transparent'}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: BAND_COLORS[band.id] }}
            />
            {band.id} ({band.count})
          </button>
        ))}
      </div>

      {/* Chain flow header */}
      <div
        className="grid grid-cols-4 gap-2 mb-2 px-3"
        style={{ color: 'var(--color-text-faint)' }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-wider">Technique</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider">Band</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider">Pathway</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider">DSM Outcome</div>
      </div>

      {/* Chain rows */}
      <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
        {filteredChains.slice(0, 100).map((chain, i) => (
          <button
            key={`${chain.technique.id}-${chain.band.id}-${i}`}
            onClick={() => setSelectedChain(chain)}
            className="w-full grid grid-cols-4 gap-2 px-3 py-2 rounded-lg transition-all text-left"
            style={{
              background:
                selectedChain?.technique.id === chain.technique.id &&
                selectedChain?.band.id === chain.band.id
                  ? 'var(--color-bg-secondary)'
                  : 'transparent',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-secondary)';
            }}
            onMouseLeave={(e) => {
              if (
                selectedChain?.technique.id !== chain.technique.id ||
                selectedChain?.band.id !== chain.band.id
              ) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            {/* Technique */}
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: SEVERITY_COLORS[chain.technique.severity] ?? '#94a3b8' }}
              />
              <span
                className="text-xs truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {chain.technique.name}
              </span>
            </div>

            {/* Band */}
            <div className="flex items-center gap-1.5">
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                style={{
                  background: `${BAND_COLORS[chain.band.id]}15`,
                  color: BAND_COLORS[chain.band.id],
                }}
              >
                {chain.band.id}
              </span>
              <span className="text-[10px] truncate" style={{ color: 'var(--color-text-faint)' }}>
                {chain.band.name}
              </span>
            </div>

            {/* Pathways */}
            <div className="flex flex-wrap gap-1">
              {chain.pathways.slice(0, 2).map((p) => (
                <span
                  key={p.id}
                  className="px-1.5 py-0.5 rounded text-[10px] truncate max-w-[120px]"
                  style={{
                    background: `${PATHWAY_TYPE_COLORS[p.type] ?? '#6b7280'}10`,
                    color: PATHWAY_TYPE_COLORS[p.type] ?? '#6b7280',
                  }}
                >
                  {p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name}
                </span>
              ))}
              {chain.pathways.length > 2 && (
                <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                  +{chain.pathways.length - 2}
                </span>
              )}
            </div>

            {/* DSM Outcomes */}
            <div className="flex flex-wrap gap-1">
              {chain.dsmConditions.slice(0, 2).map((d) => (
                <span
                  key={d.code}
                  className="px-1.5 py-0.5 rounded text-[10px] truncate max-w-[120px]"
                  style={{
                    background: `${CLUSTER_COLORS[d.cluster] ?? '#94a3b8'}15`,
                    color: CLUSTER_COLORS[d.cluster] ?? '#94a3b8',
                  }}
                >
                  {d.code}
                </span>
              ))}
              {chain.dsmConditions.length > 2 && (
                <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                  +{chain.dsmConditions.length - 2}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {filteredChains.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
            No impact chains match your filters
          </p>
        </div>
      )}

      {filteredChains.length > 100 && (
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--color-text-faint)' }}>
          Showing 100 of {filteredChains.length} chains. Use filters to narrow.
        </p>
      )}

      {/* Detail panel */}
      {selectedChain && (
        <ChainDetailPanel chain={selectedChain} data={data} onClose={() => setSelectedChain(null)} />
      )}
    </div>
  );
}

// ═══ Chain Detail Panel ═══

function ChainDetailPanel({
  chain,
  data,
  onClose,
}: {
  chain: NeuralImpactChain;
  data: ClinicalData;
  onClose: () => void;
}) {
  const technique = chain.technique;
  const pathwayDetails = chain.pathways
    .map((p) => data.pathways.find((dp) => dp.id === p.id))
    .filter(Boolean) as ClinicalPathway[];

  return (
    <div
      className="mt-4 rounded-xl p-5"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: SEVERITY_COLORS[technique.severity] }}
            />
            <h3
              className="text-sm font-bold"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
            >
              {technique.name}
            </h3>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: `${SEVERITY_COLORS[technique.severity]}15`,
                color: SEVERITY_COLORS[technique.severity],
              }}
            >
              NISS {technique.niss}
            </span>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
            Band: {chain.band.name} ({chain.band.id}) — {chain.pathways.length} pathways affected, {chain.dsmConditions.length} diagnostic categories
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-sm px-2 py-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-faint)' }}
        >
          Close
        </button>
      </div>

      {/* SVG Flow Diagram */}
      <div className="mb-4">
        <ImpactFlowSVG chain={chain} />
      </div>

      {/* Pathway details */}
      {pathwayDetails.length > 0 && (
        <div className="space-y-2">
          <h4
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-faint)' }}
          >
            Affected Pathways
          </h4>
          {pathwayDetails.map((p) => (
            <div
              key={p.id}
              className="rounded-lg p-3"
              style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: PATHWAY_TYPE_COLORS[p.type] ?? '#6b7280' }}
                />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {p.name}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                  {p.type.replace(/_/g, ' ')}
                </span>
                {p.neurotransmitter && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background: '#8b5cf615', color: '#8b5cf6' }}
                  >
                    {p.neurotransmitter}
                  </span>
                )}
              </div>
              <p className="text-[11px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {p.function}
              </p>
              {p.disruptionEffects && (
                <p className="text-[11px]" style={{ color: '#ef4444' }}>
                  Disruption: {p.disruptionEffects}
                </p>
              )}
              {p.therapeuticApplications.length > 0 && (
                <p className="text-[11px] mt-0.5" style={{ color: '#10b981' }}>
                  Therapeutic: {p.therapeuticApplications.join('; ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[9px] mt-3 italic" style={{ color: 'var(--color-text-faint)' }}>
        Diagnostic category references for threat modeling purposes. Not clinical diagnosis.
      </p>
    </div>
  );
}

// ═══ Impact Flow SVG ═══

function ImpactFlowSVG({ chain }: { chain: NeuralImpactChain }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const width = 700;
  const height = 120;
  const colWidth = width / 4;

  // Columns: Technique, Band, Pathways, DSM
  const columns = [
    { label: 'Technique', x: colWidth * 0.5, color: SEVERITY_COLORS[chain.technique.severity] ?? '#94a3b8' },
    { label: 'Band', x: colWidth * 1.5, color: BAND_COLORS[chain.band.id] ?? '#6b7280' },
    { label: 'Pathways', x: colWidth * 2.5, color: '#8b5cf6' },
    { label: 'DSM', x: colWidth * 3.5, color: '#f59e0b' },
  ];

  // Node positions
  const techY = height / 2;
  const bandY = height / 2;
  const pathwayYs = chain.pathways.map((_, i) => {
    const total = chain.pathways.length;
    const spread = Math.min(80, total * 20);
    return height / 2 - spread / 2 + (i * spread) / Math.max(total - 1, 1);
  });
  const dsmYs = chain.dsmConditions.map((_, i) => {
    const total = chain.dsmConditions.length;
    const spread = Math.min(80, total * 20);
    return height / 2 - spread / 2 + (i * spread) / Math.max(total - 1, 1);
  });

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ maxHeight: '140px' }}
    >
      {/* Connection lines */}
      <g opacity={revealed ? 1 : 0} style={{ transition: 'opacity 0.6s ease' }}>
        {/* Tech → Band */}
        <line
          x1={columns[0].x + 50}
          y1={techY}
          x2={columns[1].x - 30}
          y2={bandY}
          stroke={columns[0].color}
          strokeWidth={1.5}
          strokeDasharray={revealed ? '0' : '200'}
          style={{ transition: 'stroke-dasharray 0.8s ease 0.2s' }}
          opacity={0.4}
        />
        {/* Band → Pathways */}
        {pathwayYs.map((py, i) => (
          <line
            key={`b-p-${i}`}
            x1={columns[1].x + 30}
            y1={bandY}
            x2={columns[2].x - 50}
            y2={py}
            stroke={PATHWAY_TYPE_COLORS[chain.pathways[i]?.type] ?? '#6b7280'}
            strokeWidth={1}
            opacity={0.3}
          />
        ))}
        {/* Pathways → DSM */}
        {pathwayYs.map((py, pi) =>
          dsmYs.map((dy, di) => (
            <line
              key={`p-d-${pi}-${di}`}
              x1={columns[2].x + 50}
              y1={py}
              x2={columns[3].x - 30}
              y2={dy}
              stroke={CLUSTER_COLORS[chain.dsmConditions[di]?.cluster] ?? '#94a3b8'}
              strokeWidth={0.5}
              opacity={0.15}
            />
          ))
        )}
      </g>

      {/* Nodes */}
      <g style={{ transition: 'opacity 0.4s ease 0.4s' }} opacity={revealed ? 1 : 0}>
        {/* Technique node */}
        <g>
          <circle cx={columns[0].x} cy={techY} r={6} fill={columns[0].color} />
          <text
            x={columns[0].x + 12}
            y={techY + 4}
            fontSize={9}
            fill="var(--color-text-primary)"
            fontFamily="var(--font-body)"
          >
            {chain.technique.name.length > 25
              ? chain.technique.name.slice(0, 25) + '...'
              : chain.technique.name}
          </text>
        </g>

        {/* Band node */}
        <g>
          <rect
            x={columns[1].x - 18}
            y={bandY - 10}
            width={36}
            height={20}
            rx={4}
            fill={`${columns[1].color}20`}
            stroke={columns[1].color}
            strokeWidth={1}
          />
          <text
            x={columns[1].x}
            y={bandY + 4}
            fontSize={10}
            fill={columns[1].color}
            fontWeight="bold"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
          >
            {chain.band.id}
          </text>
        </g>

        {/* Pathway nodes */}
        {chain.pathways.map((p, i) => (
          <g key={p.id}>
            <circle
              cx={columns[2].x}
              cy={pathwayYs[i]}
              r={4}
              fill={PATHWAY_TYPE_COLORS[p.type] ?? '#6b7280'}
            />
            <text
              x={columns[2].x + 8}
              y={pathwayYs[i] + 3}
              fontSize={8}
              fill="var(--color-text-secondary)"
              fontFamily="var(--font-body)"
            >
              {p.name.length > 22 ? p.name.slice(0, 22) + '...' : p.name}
            </text>
          </g>
        ))}

        {/* DSM nodes */}
        {chain.dsmConditions.map((d, i) => (
          <g key={d.code}>
            <circle
              cx={columns[3].x}
              cy={dsmYs[i]}
              r={4}
              fill={CLUSTER_COLORS[d.cluster] ?? '#94a3b8'}
            />
            <text
              x={columns[3].x + 8}
              y={dsmYs[i] + 3}
              fontSize={8}
              fill="var(--color-text-secondary)"
              fontFamily="var(--font-body)"
            >
              {d.code} {d.name.length > 18 ? d.name.slice(0, 18) + '...' : d.name}
            </text>
          </g>
        ))}
      </g>

      {/* Column headers */}
      {columns.map((col) => (
        <text
          key={col.label}
          x={col.x}
          y={12}
          fontSize={9}
          fill="var(--color-text-faint)"
          fontWeight="600"
          fontFamily="var(--font-heading)"
          textAnchor="middle"
          style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          {col.label}
        </text>
      ))}
    </svg>
  );
}

// ═══ Pathways View ═══

function PathwaysView({ data }: { data: ClinicalData }) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPathway, setSelectedPathway] = useState<ClinicalPathway | null>(null);

  const types = useMemo(() => {
    const typeMap = new Map<string, number>();
    for (const p of data.pathways) {
      typeMap.set(p.type, (typeMap.get(p.type) ?? 0) + 1);
    }
    return Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [data.pathways]);

  const filtered = selectedType
    ? data.pathways.filter((p) => p.type === selectedType)
    : data.pathways;

  return (
    <div>
      {/* Type filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setSelectedType(null)}
          className="px-2.5 py-1 rounded-full text-[10px] font-medium"
          style={{
            background: selectedType === null ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
            color: selectedType === null ? '#fff' : 'var(--color-text-faint)',
          }}
        >
          All ({data.pathways.length})
        </button>
        {types.map(([type, count]) => (
          <button
            key={type}
            onClick={() => setSelectedType(type === selectedType ? null : type)}
            className="px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1"
            style={{
              background: selectedType === type ? `${PATHWAY_TYPE_COLORS[type]}15` : 'var(--color-bg-secondary)',
              color: selectedType === type ? PATHWAY_TYPE_COLORS[type] : 'var(--color-text-faint)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: PATHWAY_TYPE_COLORS[type] }} />
            {type.replace(/_/g, ' ')} ({count})
          </button>
        ))}
      </div>

      {/* Pathway grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPathway(selectedPathway?.id === p.id ? null : p)}
            className="text-left rounded-lg p-3 transition-all"
            style={{
              background: selectedPathway?.id === p.id ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
              border: `1px solid ${selectedPathway?.id === p.id ? `${PATHWAY_TYPE_COLORS[p.type]}40` : 'var(--color-border)'}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: PATHWAY_TYPE_COLORS[p.type] }} />
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {p.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: `${BAND_COLORS[p.originBand]}15`, color: BAND_COLORS[p.originBand] }}
              >
                {p.originBand}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>→</span>
              {p.targetBands.map((tb) => (
                <span
                  key={tb}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: `${BAND_COLORS[tb]}15`, color: BAND_COLORS[tb] }}
                >
                  {tb}
                </span>
              ))}
              {p.neurotransmitter && (
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#8b5cf615', color: '#8b5cf6' }}>
                  {p.neurotransmitter}
                </span>
              )}
            </div>
            <p className="text-[10px] line-clamp-2" style={{ color: 'var(--color-text-faint)' }}>
              {p.function}
            </p>

            {/* Expanded detail */}
            {selectedPathway?.id === p.id && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Origin: </span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{p.originRegions.join(', ')}</span>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Targets: </span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{p.targetRegions.join(', ')}</span>
                  </div>
                  {p.disruptionEffects && (
                    <div>
                      <span className="font-semibold" style={{ color: '#ef4444' }}>Disruption: </span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{p.disruptionEffects}</span>
                    </div>
                  )}
                  {p.therapeuticApplications.length > 0 && (
                    <div>
                      <span className="font-semibold" style={{ color: '#10b981' }}>Therapeutic: </span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{p.therapeuticApplications.join('; ')}</span>
                    </div>
                  )}
                  {p.dsmNames.length > 0 && (
                    <div>
                      <span className="font-semibold" style={{ color: '#f59e0b' }}>DSM: </span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{p.dsmNames.join('; ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                      Confidence: {p.confidence} | BCI: {p.bciRelevance.split('—')[0].trim()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══ Neurotransmitters View ═══

function NeurotransmittersView({ data }: { data: ClinicalData }) {
  const [selectedNT, setSelectedNT] = useState<ClinicalNeurotransmitter | null>(null);

  // Group by chemical class
  const classes = useMemo(() => {
    const classMap = new Map<string, ClinicalNeurotransmitter[]>();
    for (const nt of data.neurotransmitters) {
      const cls = nt.chemicalClass;
      if (!classMap.has(cls)) classMap.set(cls, []);
      classMap.get(cls)!.push(nt);
    }
    return Array.from(classMap.entries());
  }, [data.neurotransmitters]);

  return (
    <div>
      {classes.map(([cls, nts]) => (
        <div key={cls} className="mb-4">
          <h4
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-text-faint)' }}
          >
            {cls.replace(/_/g, ' ')} ({nts.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {nts.map((nt) => (
              <button
                key={nt.id}
                onClick={() => setSelectedNT(selectedNT?.id === nt.id ? null : nt)}
                className="text-left rounded-lg p-3 transition-all"
                style={{
                  background: selectedNT?.id === nt.id ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                  border: `1px solid ${selectedNT?.id === nt.id ? '#8b5cf640' : 'var(--color-border)'}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {nt.name}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                      style={{ background: '#8b5cf610', color: '#8b5cf6' }}
                    >
                      {nt.abbreviation}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                    {nt.receptorCount} receptors
                  </span>
                </div>

                {/* Band pills */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {nt.primaryBands.map((b) => (
                    <span
                      key={b}
                      className="px-1 py-0.5 rounded text-[9px] font-mono"
                      style={{ background: `${BAND_COLORS[b]}15`, color: BAND_COLORS[b] }}
                    >
                      {b}
                    </span>
                  ))}
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                  <span>{nt.synthesisSteps} steps</span>
                  <span>{nt.cofactors.length} cofactors</span>
                  <span>{nt.dsmConditions.length} DSM</span>
                </div>

                {/* Expanded detail */}
                {selectedNT?.id === nt.id && (
                  <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                    {/* Cofactor dependencies */}
                    {nt.cofactors.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          Cofactor Dependencies:
                        </span>
                        <div className="mt-1 space-y-1">
                          {nt.cofactors.map((c, i) => (
                            <div key={i} className="text-[10px] flex items-start gap-1">
                              <span style={{ color: '#8b5cf6' }}>→</span>
                              <div>
                                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                  {c.name}:
                                </span>{' '}
                                <span style={{ color: 'var(--color-text-secondary)' }}>{c.role}</span>
                                {c.deficiencyEffect && (
                                  <span style={{ color: '#ef4444' }}> | Deficiency: {c.deficiencyEffect}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DSM conditions */}
                    {nt.dsmConditions.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          DSM Conditions:
                        </span>
                        <div className="mt-1 space-y-1">
                          {nt.dsmConditions.map((d, i) => (
                            <div key={i} className="text-[10px]">
                              <span className="font-mono" style={{ color: '#f59e0b' }}>{d.code}</span>{' '}
                              <span style={{ color: 'var(--color-text-primary)' }}>{d.name}</span>
                              {d.mechanism && (
                                <span style={{ color: 'var(--color-text-faint)' }}> — {d.mechanism}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key enzymes */}
                    {nt.keyEnzymes.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          Key Genes: </span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-primary)' }}>
                          {nt.keyEnzymes.join(', ')}
                        </span>
                      </div>
                    )}

                    <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                      BCI: {nt.bciRelevance.length > 100 ? nt.bciRelevance.slice(0, 100) + '...' : nt.bciRelevance}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══ DSM View ═══

function DsmView({ data }: { data: ClinicalData }) {
  const [selectedCondition, setSelectedCondition] = useState<ClinicalDsmCondition | null>(null);

  // Group by cluster
  const clusters = useMemo(() => {
    const clusterMap = new Map<string, ClinicalDsmCondition[]>();
    for (const cond of data.dsmConditions) {
      if (!clusterMap.has(cond.cluster)) clusterMap.set(cond.cluster, []);
      clusterMap.get(cond.cluster)!.push(cond);
    }
    return Array.from(clusterMap.entries());
  }, [data.dsmConditions]);

  return (
    <div>
      <p className="text-[10px] mb-4 italic" style={{ color: 'var(--color-text-faint)' }}>
        DSM-5-TR diagnostic category references for threat modeling purposes. Not clinical diagnosis. Requires clinical validation.
      </p>

      {clusters.map(([cluster, conditions]) => (
        <div key={cluster} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: CLUSTER_COLORS[cluster] ?? '#94a3b8' }}
            />
            <h4
              className="text-xs font-semibold"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
            >
              {cluster.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </h4>
            <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
              ({conditions.length} conditions)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {conditions.map((cond) => (
              <button
                key={cond.code}
                onClick={() => setSelectedCondition(selectedCondition?.code === cond.code ? null : cond)}
                className="text-left rounded-lg p-3 transition-all"
                style={{
                  background: selectedCondition?.code === cond.code ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                  border: `1px solid ${selectedCondition?.code === cond.code ? `${CLUSTER_COLORS[cond.cluster]}40` : 'var(--color-border)'}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{ background: `${cond.clusterColor}15`, color: cond.clusterColor }}
                    >
                      {cond.code}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                      {cond.name}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                    {cond.threatCount} threats
                  </span>
                </div>

                {/* Band pills */}
                <div className="flex flex-wrap gap-1">
                  {cond.bands.map((b) => (
                    <span
                      key={b}
                      className="px-1 py-0.5 rounded text-[9px] font-mono"
                      style={{ background: `${BAND_COLORS[b]}15`, color: BAND_COLORS[b] }}
                    >
                      {b}
                    </span>
                  ))}
                </div>

                {/* Expanded */}
                {selectedCondition?.code === cond.code && (
                  <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                    {cond.pathways.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          Affected Pathways:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cond.pathways.map((pid) => {
                            const p = data.pathways.find((dp) => dp.id === pid);
                            return p ? (
                              <span
                                key={pid}
                                className="px-1.5 py-0.5 rounded text-[10px]"
                                style={{
                                  background: `${PATHWAY_TYPE_COLORS[p.type]}10`,
                                  color: PATHWAY_TYPE_COLORS[p.type],
                                }}
                              >
                                {p.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {cond.neurotransmitters.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          Neurotransmitters:
                        </span>
                        <span className="text-[10px] ml-1" style={{ color: 'var(--color-text-primary)' }}>
                          {cond.neurotransmitters.join(', ')}
                        </span>
                      </div>
                    )}
                    {cond.regions.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          Brain Regions:
                        </span>
                        <span className="text-[10px] ml-1" style={{ color: 'var(--color-text-primary)' }}>
                          {cond.regions.slice(0, 8).join(', ')}
                          {cond.regions.length > 8 ? ` +${cond.regions.length - 8} more` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══ Main Component ═══

export default function ClinicalDashboard({ data }: Props) {
  const [activeTab, setActiveTab] = useState<ViewTab>('zoom');

  return (
    <div>
      <StatsBanner stats={data.stats} />
      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'zoom' && <SemanticZoomView data={data} />}
      {activeTab === 'chain' && <ImpactChainView data={data} />}
      {activeTab === 'pathways' && <PathwaysView data={data} />}
      {activeTab === 'neurotransmitters' && <NeurotransmittersView data={data} />}
      {activeTab === 'dsm' && <DsmView data={data} />}
    </div>
  );
}
