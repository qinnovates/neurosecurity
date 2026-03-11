/**
 * Brain Map utility functions — data lookups, matrix computation, color helpers.
 */

import type { ClinicalData, ClinicalRegion, NeuralImpactChain } from '../../../lib/clinical-data';
import type { ThreatVector } from '../../../lib/threat-data';

// ═══ Region Lookups ═══

export function getRegionsForBand(data: ClinicalData, bandId: string): ClinicalRegion[] {
  return data.regions.filter(r => r.band === bandId);
}

export function getRegionById(data: ClinicalData, regionId: string): ClinicalRegion | undefined {
  return data.regions.find(r => r.id === regionId);
}

// ═══ Matrix Builders ═══

export interface MatrixCell {
  rowId: string;
  colId: string;
  value: number;
}

/** Build technique x band count matrix from impact chains */
export function buildTechniqueBandMatrix(
  chains: NeuralImpactChain[],
  techniqueIds: string[],
  bandIds: string[],
): MatrixCell[] {
  const counts = new Map<string, number>();
  for (const chain of chains) {
    const key = `${chain.technique.id}|${chain.band.id}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const cells: MatrixCell[] = [];
  for (const tId of techniqueIds) {
    for (const bId of bandIds) {
      const value = counts.get(`${tId}|${bId}`) || 0;
      if (value > 0) {
        cells.push({ rowId: tId, colId: bId, value });
      }
    }
  }
  return cells;
}

/** Build technique x DSM count matrix from impact chains */
export function buildTechniqueDsmMatrix(
  chains: NeuralImpactChain[],
  techniqueIds: string[],
  dsmCodes: string[],
): MatrixCell[] {
  const counts = new Map<string, number>();
  for (const chain of chains) {
    for (const dsm of chain.dsmConditions) {
      const key = `${chain.technique.id}|${dsm.code}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  const cells: MatrixCell[] = [];
  for (const tId of techniqueIds) {
    for (const code of dsmCodes) {
      const value = counts.get(`${tId}|${code}`) || 0;
      if (value > 0) {
        cells.push({ rowId: tId, colId: code, value });
      }
    }
  }
  return cells;
}

// ═══ Color Helpers ═══

/** Interpolate heat color from transparent to solid based on value/max */
export function interpolateHeatColor(value: number, max: number, baseColor: string): string {
  if (max === 0 || value === 0) return 'transparent';
  const opacity = Math.min(0.15 + (value / max) * 0.75, 0.9);
  return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

/** Get max value in a matrix cell array */
export function getMatrixMax(cells: MatrixCell[]): number {
  return cells.reduce((max, c) => Math.max(max, c.value), 0);
}

/** Get cell value from matrix */
export function getCellValue(cells: MatrixCell[], rowId: string, colId: string): number {
  return cells.find(c => c.rowId === rowId && c.colId === colId)?.value || 0;
}

// ═══ Highlight Resolution ═══

/** Given a heatmap hover, resolve which region IDs should highlight on the brain SVG */
export function getHighlightedRegionsFromCell(
  data: ClinicalData,
  chains: NeuralImpactChain[],
  techniqueId: string,
  targetId: string,
  type: 'band' | 'dsm',
): string[] {
  const regionSet = new Set<string>();
  for (const chain of chains) {
    if (chain.technique.id !== techniqueId) continue;
    if (type === 'band' && chain.band.id !== targetId) continue;
    if (type === 'dsm' && !chain.dsmConditions.some(d => d.code === targetId)) continue;
    for (const r of chain.regions) {
      regionSet.add(r.id);
    }
  }
  return Array.from(regionSet);
}

/** Get all unique technique IDs from impact chains, sorted by highest NISS */
export function getTopTechniqueIds(
  chains: NeuralImpactChain[],
  threats: ThreatVector[],
  limit = 30,
): string[] {
  const ids = new Set<string>();
  for (const chain of chains) {
    ids.add(chain.technique.id);
  }
  // Sort by NISS score descending
  const threatMap = new Map(threats.map(t => [t.id, t]));
  return Array.from(ids)
    .sort((a, b) => {
      const ta = threatMap.get(a);
      const tb = threatMap.get(b);
      return (tb?.niss?.score || 0) - (ta?.niss?.score || 0);
    })
    .slice(0, limit);
}

/** Get all unique DSM codes from impact chains */
export function getUniqueDsmCodes(chains: NeuralImpactChain[]): string[] {
  const codes = new Set<string>();
  for (const chain of chains) {
    for (const d of chain.dsmConditions) {
      codes.add(d.code);
    }
  }
  return Array.from(codes).sort();
}
