import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { describeDiagnosticCluster, listClusterChapters, listClustersWithChapters } from '../diagnostic-cluster-copy';
import { getDsm5Stats } from '../threat-data';

const registrar = JSON.parse(readFileSync('datalake/qtara-registrar.json', 'utf8')) as {
  dsm5_spec: { diagnostic_clusters: Record<string, { dsm_chapters: string[] }> };
};
const CLAIM_WORDS = /\b(causes?|leads? to|results? in|disrupts?|impairs?|persists?|manifests?|produces?|symptoms?|diagnos(?:is|es|ed))\b/i;

describe('the Clinical page\'s cluster sentences', () => {
  it('lists exactly the chapters the registrar holds for each cluster, in file order', () => {
    for (const [cluster, record] of Object.entries(registrar.dsm5_spec.diagnostic_clusters)) {
      expect(listClusterChapters(cluster as Parameters<typeof listClusterChapters>[0])).toEqual(record.dsm_chapters);
    }
    expect(listClustersWithChapters()).toEqual(Object.entries(registrar.dsm5_spec.diagnostic_clusters).filter(([, record]) => record.dsm_chapters.length > 0).map(([cluster]) => cluster));
  });

  it('fills the count and the chapters into the one pattern, and says it is not a statement of effect', () => {
    expect(describeDiagnosticCluster(3, ['First (F00)', 'Second (F01)'])).toBe('The catalog tags 3 techniques with this cluster; it groups references to First (F00), Second (F01). A threat-modelling grouping, not a statement of effect.');
    expect(describeDiagnosticCluster(1, ['Only (F00)'])).toBe('The catalog tags 1 technique with this cluster; it groups references to Only (F00). A threat-modelling grouping, not a statement of effect.');
    expect(describeDiagnosticCluster(0, [])).toBe('The catalog tags 0 techniques with this cluster; the registrar lists no chapters for it. A threat-modelling grouping, not a statement of effect.');
  });

  it('on the real data, words no cluster as a cause, an effect or a diagnosis in the page\'s own words', () => {
    const counts = getDsm5Stats().clusters;
    const clusters = listClustersWithChapters();
    expect(clusters).toHaveLength(4);
    for (const cluster of clusters) {
      const sentence = describeDiagnosticCluster(counts[cluster], listClusterChapters(cluster));
      // The chapter names are the registrar's; everything else in the sentence is the page's.
      const ownWords = sentence.replace(listClusterChapters(cluster).join(', '), '').replace('not a statement of effect', '');
      expect(sentence).toContain(`tags ${counts[cluster]} techniques`);
      expect(ownWords).not.toMatch(CLAIM_WORDS);
    }
  });
});
