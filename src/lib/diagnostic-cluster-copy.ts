/**
 * The sentence the Clinical page shows under each diagnostic cluster, built
 * from what the registrar records for the cluster: how many techniques carry
 * its tag, and the chapters it lists. The registrar says nothing about what a
 * cluster does to anyone, so neither does the sentence.
 */

import registry from '@shared/qtara-registrar.json';
import type { DiagnosticCluster } from './threat-data';

interface RegistrarCluster {
  dsm_chapters?: readonly string[];
}

const NOT_AN_EFFECT = 'A threat-modelling grouping, not a statement of effect.';

/** The chapters the registrar lists for a cluster, in file order. Empty when it lists none. */
export function listClusterChapters(cluster: DiagnosticCluster): readonly string[] {
  const clusters: Readonly<Record<string, RegistrarCluster | undefined>> = registry.dsm5_spec.diagnostic_clusters;
  return clusters[cluster]?.dsm_chapters ?? [];
}

/** The clusters the registrar lists chapters for, in the registrar's order. */
export function listClustersWithChapters(): DiagnosticCluster[] {
  return (Object.keys(registry.dsm5_spec.diagnostic_clusters) as DiagnosticCluster[]).filter((cluster) => listClusterChapters(cluster).length > 0);
}

export function describeDiagnosticCluster(techniqueCount: number, chapters: readonly string[]): string {
  const tagged = `The catalog tags ${techniqueCount} ${techniqueCount === 1 ? 'technique' : 'techniques'} with this cluster`;
  const grouped = chapters.length === 0 ? 'the registrar lists no chapters for it' : `it groups references to ${chapters.join(', ')}`;
  return `${tagged}; ${grouped}. ${NOT_AN_EFFECT}`;
}
