/**
 * BrainMapView — SIEM-style Brain Security Dashboard.
 *
 * Layout: Hourglass Spine (left) | Brain SVG (center) | Cascade Panels (right)
 * Below: Technique x Band heatmap | Technique x DSM heatmap
 * Bottom: Selection breadcrumb bar
 *
 * Modeled after SOC/SIEM dashboards (Splunk ES, QRadar) — same architecture,
 * different layer of the stack.
 */

import { useState, useMemo, useCallback } from 'react';
import type { ClinicalData } from '../../../lib/clinical-data';
import { THREAT_VECTORS } from '../../../lib/threat-data';
import HourglassSpine from './HourglassSpine';
import BrainSvg from './BrainSvg';
import CascadePanelStack from './CascadePanelStack';
import HeatmapMatrix from './HeatmapMatrix';
import BreadcrumbBar from './BreadcrumbBar';
import {
  getRegionsForBand,
  buildTechniqueBandMatrix,
  buildTechniqueDsmMatrix,
  getTopTechniqueIds,
  getUniqueDsmCodes,
  getHighlightedRegionsFromCell,
} from './brainmap-utils';

const BAND_IDS = ['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1', 'I0', 'S1', 'S2', 'S3'];

const BAND_COLORS: Record<string, string> = {
  N7: '#166534', N6: '#3a7d44', N5: '#5c7a38', N4: '#72772f',
  N3: '#877226', N2: '#9b6c1e', N1: '#ae6616', I0: '#f59e0b',
  S1: '#93c5fd', S2: '#60a5fa', S3: '#3b82f6',
};

interface Props {
  data: ClinicalData;
}

export default function BrainMapView({ data }: Props) {
  // Selection state
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | null>(null);
  const [selectedNtId, setSelectedNtId] = useState<string | null>(null);
  const [selectedDsmCode, setSelectedDsmCode] = useState<string | null>(null);

  // Heatmap hover state
  const [heatmapHighlight, setHeatmapHighlight] = useState<string[]>([]);
  const [heatmapBandHighlight, setHeatmapBandHighlight] = useState<string[]>([]);

  // Computed: highlighted regions based on band selection or heatmap hover
  const highlightedRegionIds = useMemo(() => {
    if (heatmapHighlight.length > 0) return heatmapHighlight;
    if (!selectedBandId) return [];
    return getRegionsForBand(data, selectedBandId).map(r => r.id);
  }, [data, selectedBandId, heatmapHighlight]);

  // Computed: highlighted bands from heatmap hover
  const highlightedBandIds = useMemo(() => {
    return heatmapBandHighlight;
  }, [heatmapBandHighlight]);

  // ═══ Heatmap data ═══

  const topTechniqueIds = useMemo(
    () => getTopTechniqueIds(data.impactChains, THREAT_VECTORS, 25),
    [data.impactChains]
  );

  const dsmCodes = useMemo(
    () => getUniqueDsmCodes(data.impactChains),
    [data.impactChains]
  );

  const bandMatrix = useMemo(
    () => buildTechniqueBandMatrix(data.impactChains, topTechniqueIds, BAND_IDS),
    [data.impactChains, topTechniqueIds]
  );

  const dsmMatrix = useMemo(
    () => buildTechniqueDsmMatrix(data.impactChains, topTechniqueIds, dsmCodes),
    [data.impactChains, topTechniqueIds, dsmCodes]
  );

  const threatMap = useMemo(() => {
    const map = new Map(THREAT_VECTORS.map(t => [t.id, t]));
    return map;
  }, []);

  const bandRows = useMemo(
    () => topTechniqueIds.map(id => ({
      id,
      label: threatMap.get(id)?.name?.slice(0, 22) || id,
    })),
    [topTechniqueIds, threatMap]
  );

  const bandCols = useMemo(
    () => BAND_IDS.map(id => ({ id, label: id, color: BAND_COLORS[id] })),
    []
  );

  const dsmCols = useMemo(
    () => dsmCodes.map(code => {
      const cond = data.dsmConditions.find(d => d.code === code);
      return { id: code, label: cond?.name?.slice(0, 12) || code };
    }),
    [dsmCodes, data.dsmConditions]
  );

  // ═══ Handlers ═══

  const handleBandSelect = useCallback((bandId: string | null) => {
    setSelectedBandId(bandId);
    setSelectedRegionId(null);
    setSelectedPathwayId(null);
    setSelectedNtId(null);
    setSelectedDsmCode(null);
  }, []);

  const handleRegionSelect = useCallback((regionId: string | null) => {
    if (regionId) {
      const region = data.regions.find(r => r.id === regionId);
      if (region) setSelectedBandId(region.band);
    }
    setSelectedRegionId(regionId);
    setSelectedPathwayId(null);
    setSelectedNtId(null);
    setSelectedDsmCode(null);
  }, [data.regions]);

  const handleBandHeatmapHover = useCallback((rowId: string, colId: string) => {
    const regions = getHighlightedRegionsFromCell(data, data.impactChains, rowId, colId, 'band');
    setHeatmapHighlight(regions);
    setHeatmapBandHighlight([colId]);
  }, [data]);

  const handleDsmHeatmapHover = useCallback((rowId: string, colId: string) => {
    const regions = getHighlightedRegionsFromCell(data, data.impactChains, rowId, colId, 'dsm');
    setHeatmapHighlight(regions);
    setHeatmapBandHighlight([]);
  }, [data]);

  const handleHeatmapLeave = useCallback(() => {
    setHeatmapHighlight([]);
    setHeatmapBandHighlight([]);
  }, []);

  const handleNavigate = useCallback((level: 'band' | 'region' | 'pathway' | 'nt' | 'dsm') => {
    switch (level) {
      case 'band':
        setSelectedRegionId(null);
        setSelectedPathwayId(null);
        setSelectedNtId(null);
        setSelectedDsmCode(null);
        break;
      case 'region':
        setSelectedPathwayId(null);
        setSelectedNtId(null);
        setSelectedDsmCode(null);
        break;
      case 'pathway':
        setSelectedNtId(null);
        setSelectedDsmCode(null);
        break;
      case 'nt':
        setSelectedDsmCode(null);
        break;
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Main 3-panel layout */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_280px] gap-3">
        {/* Left: Hourglass */}
        <div className="rounded-xl p-3"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}>
          <HourglassSpine
            data={data}
            selectedBandId={selectedBandId}
            highlightedBandIds={highlightedBandIds}
            onBandSelect={handleBandSelect}
          />
        </div>

        {/* Center: Brain SVG */}
        <div className="rounded-xl p-3"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}>
          <div className="text-[10px] font-mono uppercase tracking-wider mb-1 text-center"
            style={{ color: 'var(--color-text-faint)' }}>
            Neural Topology (Medial View)
          </div>
          <BrainSvg
            regions={data.regions}
            selectedRegionId={selectedRegionId}
            highlightedRegionIds={highlightedRegionIds}
            onRegionSelect={handleRegionSelect}
          />
        </div>

        {/* Right: Cascade Panels */}
        <div>
          <CascadePanelStack
            data={data}
            selectedRegionId={selectedRegionId}
            onPathwaySelect={setSelectedPathwayId}
            onNtSelect={setSelectedNtId}
            onDsmSelect={setSelectedDsmCode}
          />
        </div>
      </div>

      {/* Breadcrumb */}
      <BreadcrumbBar
        selectedBandId={selectedBandId}
        selectedRegionId={selectedRegionId}
        selectedPathwayId={selectedPathwayId}
        selectedNtId={selectedNtId}
        selectedDsmCode={selectedDsmCode}
        data={data}
        onNavigate={handleNavigate}
      />

      {/* Heatmap matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <HeatmapMatrix
          title="Technique x Band"
          rows={bandRows}
          columns={bandCols}
          cells={bandMatrix}
          baseColor="#f59e0b"
          onCellHover={handleBandHeatmapHover}
          onCellLeave={handleHeatmapLeave}
        />
        <HeatmapMatrix
          title="Technique x DSM"
          rows={bandRows}
          columns={dsmCols}
          cells={dsmMatrix}
          baseColor="#ef4444"
          onCellHover={handleDsmHeatmapHover}
          onCellLeave={handleHeatmapLeave}
        />
      </div>

      <div className="text-[9px] font-mono text-center"
        style={{ color: 'var(--color-text-faint)' }}>
        Heatmap hover highlights corresponding brain regions above. Top {topTechniqueIds.length} techniques by NISS score.
      </div>
    </div>
  );
}
