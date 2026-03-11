/**
 * CascadePanelStack — right panel with expandable cascade panels.
 * Shows: Pathways → Neurotransmitters → Molecules/Receptors → DSM Outcomes
 * Filtered by the selected region on the brain SVG.
 */

import { useState, useMemo } from 'react';
import type { ClinicalData } from '../../../lib/clinical-data';

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

const CLUSTER_COLORS: Record<string, string> = {
  cognitive_psychotic: '#f59e0b',
  mood_trauma: '#eab308',
  motor_neurocognitive: '#ef4444',
  persistent_personality: '#a855f7',
  non_diagnostic: '#94a3b8',
};

interface Props {
  data: ClinicalData;
  selectedRegionId: string | null;
  onPathwaySelect?: (pathwayId: string) => void;
  onNtSelect?: (ntId: string) => void;
  onDsmSelect?: (dsmCode: string) => void;
}

interface PanelState {
  pathways: boolean;
  neurotransmitters: boolean;
  molecules: boolean;
  dsm: boolean;
}

export default function CascadePanelStack({ data, selectedRegionId, onPathwaySelect, onNtSelect, onDsmSelect }: Props) {
  const [expanded, setExpanded] = useState<PanelState>({
    pathways: true,
    neurotransmitters: true,
    molecules: false,
    dsm: true,
  });

  const toggle = (panel: keyof PanelState) =>
    setExpanded(prev => ({ ...prev, [panel]: !prev[panel] }));

  // Compute filtered data based on selected region
  const filtered = useMemo(() => {
    if (!selectedRegionId) return null;

    const pathways = data.pathways.filter(p =>
      p.originRegions.includes(selectedRegionId) || p.targetRegions.includes(selectedRegionId)
    );

    const ntIds = new Set<string>();
    for (const p of pathways) {
      if (p.neurotransmitter) ntIds.add(p.neurotransmitter.toLowerCase());
    }
    const region = data.regions.find(r => r.id === selectedRegionId);
    if (region) {
      for (const nt of region.neurotransmitters) ntIds.add(nt.toLowerCase());
    }

    const neurotransmitters = data.neurotransmitters.filter(nt =>
      ntIds.has(nt.id.toLowerCase()) || ntIds.has(nt.name.toLowerCase())
    );

    const dsmCodes = new Set<string>();
    for (const p of pathways) {
      for (const code of p.dsmCodes) dsmCodes.add(code);
    }
    if (region) {
      for (const code of region.dsmCodes) dsmCodes.add(code);
    }

    const dsmConditions = data.dsmConditions.filter(d => dsmCodes.has(d.code));

    // Molecules: collect receptors and cofactors from neurotransmitters
    const molecules: { name: string; type: string; detail: string }[] = [];
    for (const nt of neurotransmitters) {
      for (const rId of nt.receptorIds.slice(0, 5)) {
        molecules.push({ name: rId, type: 'receptor', detail: nt.name });
      }
      for (const cof of nt.cofactors.slice(0, 3)) {
        molecules.push({ name: cof.name, type: 'cofactor', detail: cof.role });
      }
    }

    return { pathways, neurotransmitters, dsmConditions, molecules };
  }, [data, selectedRegionId]);

  if (!selectedRegionId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] rounded-xl"
        style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div className="text-center px-6">
          <div className="text-2xl mb-2" style={{ color: 'var(--color-text-faint)' }}>
            Select a region
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            Click a brain region or hourglass band to see pathways, neurotransmitters, and DSM outcomes.
          </p>
        </div>
      </div>
    );
  }

  if (!filtered) return null;

  const region = data.regions.find(r => r.id === selectedRegionId);

  return (
    <div className="flex flex-col gap-2">
      {/* Region header */}
      {region && (
        <div className="rounded-lg px-3 py-2"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {region.name}
          </div>
          <div className="text-[10px] font-mono" style={{ color: 'var(--color-text-faint)' }}>
            {region.band} | {region.pathwayCount} pathways | {region.threatCount} threats
          </div>
          <div className="text-[10px] mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
            {region.function}
          </div>
        </div>
      )}

      {/* Pathways Panel */}
      <CascadePanel
        title="Pathways"
        icon="-->"
        count={filtered.pathways.length}
        color="#8b5cf6"
        expanded={expanded.pathways}
        onToggle={() => toggle('pathways')}
      >
        {filtered.pathways.map(p => (
          <button
            key={p.id}
            className="w-full text-left flex items-center gap-2 px-2 py-1 rounded transition-colors hover:bg-white/5"
            onClick={() => onPathwaySelect?.(p.id)}
          >
            <span className="w-2 h-2 rounded-full shrink-0"
              style={{ background: PATHWAY_TYPE_COLORS[p.type] || '#666' }} />
            <span className="text-[11px] truncate" style={{ color: 'var(--color-text-primary)' }}>
              {p.name}
            </span>
            <span className="text-[9px] font-mono ml-auto shrink-0"
              style={{ color: 'var(--color-text-faint)' }}>
              {p.type.replace('_', ' ')}
            </span>
          </button>
        ))}
      </CascadePanel>

      {/* Neurotransmitters Panel */}
      <CascadePanel
        title="Neurotransmitters"
        icon="NT"
        count={filtered.neurotransmitters.length}
        color="#3b82f6"
        expanded={expanded.neurotransmitters}
        onToggle={() => toggle('neurotransmitters')}
      >
        {filtered.neurotransmitters.map(nt => (
          <button
            key={nt.id}
            className="w-full text-left flex items-center gap-2 px-2 py-1 rounded transition-colors hover:bg-white/5"
            onClick={() => onNtSelect?.(nt.id)}
          >
            <span className="text-[11px] font-semibold" style={{ color: '#3b82f6' }}>
              {nt.abbreviation}
            </span>
            <span className="text-[11px] truncate" style={{ color: 'var(--color-text-primary)' }}>
              {nt.name}
            </span>
            <span className="text-[9px] font-mono ml-auto shrink-0"
              style={{ color: 'var(--color-text-faint)' }}>
              {nt.receptorCount}R
            </span>
          </button>
        ))}
      </CascadePanel>

      {/* Molecules Panel */}
      <CascadePanel
        title="Molecules"
        icon="Mx"
        count={filtered.molecules.length}
        color="#ec4899"
        expanded={expanded.molecules}
        onToggle={() => toggle('molecules')}
      >
        {filtered.molecules.map((m, i) => (
          <div key={`${m.name}-${i}`}
            className="flex items-center gap-2 px-2 py-0.5">
            <span className="text-[9px] font-mono px-1 rounded"
              style={{
                background: m.type === 'receptor' ? '#ec489915' : '#14b8a615',
                color: m.type === 'receptor' ? '#ec4899' : '#14b8a6',
              }}>
              {m.type === 'receptor' ? 'R' : 'C'}
            </span>
            <span className="text-[10px] truncate" style={{ color: 'var(--color-text-primary)' }}>
              {m.name}
            </span>
            <span className="text-[9px] ml-auto truncate" style={{ color: 'var(--color-text-faint)' }}>
              {m.detail}
            </span>
          </div>
        ))}
      </CascadePanel>

      {/* DSM Outcomes Panel */}
      <CascadePanel
        title="DSM Outcomes"
        icon="Dx"
        count={filtered.dsmConditions.length}
        color="#f59e0b"
        expanded={expanded.dsm}
        onToggle={() => toggle('dsm')}
      >
        {filtered.dsmConditions.map(d => (
          <button
            key={d.code}
            className="w-full text-left flex items-center gap-2 px-2 py-1 rounded transition-colors hover:bg-white/5"
            onClick={() => onDsmSelect?.(d.code)}
          >
            <span className="w-2 h-2 rounded-full shrink-0"
              style={{ background: CLUSTER_COLORS[d.cluster] || '#94a3b8' }} />
            <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--color-text-faint)' }}>
              {d.code}
            </span>
            <span className="text-[11px] truncate" style={{ color: 'var(--color-text-primary)' }}>
              {d.name}
            </span>
          </button>
        ))}
      </CascadePanel>

      <div className="text-[9px] text-center mt-1 font-mono" style={{ color: 'var(--color-text-faint)' }}>
        Diagnostic category references for threat modeling. Not clinical diagnosis.
      </div>
    </div>
  );
}

// ═══ Reusable Cascade Panel ═══

function CascadePanel({
  title,
  icon,
  count,
  color,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: string;
  count: number;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}>
      <button
        className="w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/5"
        onClick={onToggle}
      >
        <span className="text-[10px] font-mono font-semibold w-5 text-center"
          style={{ color }}>{icon}</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </span>
        <span className="text-[10px] font-mono px-1.5 rounded-full ml-auto"
          style={{ background: `${color}15`, color }}>
          {count}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          style={{ color: 'var(--color-text-faint)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && count > 0 && (
        <div className="px-1 pb-2 max-h-[200px] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}
