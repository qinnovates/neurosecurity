import type { APIRoute } from 'astro';
import { THREAT_VECTORS } from '@/lib/threat-data';
import type { Severity } from '@/lib/threat-data';

/** Map severity to ATT&CK Navigator color */
function severityToColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return '#ff0000';
    case 'high': return '#ff6600';
    case 'medium': return '#ffcc00';
    case 'low': return '#99cc00';
    default: return '';
  }
}

export const GET: APIRoute = async () => {
  const enrichedVectors = THREAT_VECTORS.filter((t) => t.enriched);
  const techniques = enrichedVectors.map((t) => ({
    techniqueID: t.id,
    tactic: t.tactic,
    color: severityToColor(t.severity),
    comment: t.description || t.name,
    enabled: true,
    metadata: [],
    links: [
      {
        label: 'QIF Detail',
        url: `https://qinnovate.com/atlas/tara/${t.id}/`,
      },
    ],
    showSubtechniques: false,
    score: t.niss.score,
  }));

  const layer = {
    name: 'QIF TARA - BCI Threat Techniques',
    versions: {
      attack: '14',
      navigator: '4.9.1',
      layer: '4.5',
    },
    domain: 'enterprise-attack',
    description: 'QIF TARA threat techniques mapped to biological domains',
    filters: { platforms: ['BCI'] },
    sorting: 0,
    layout: { layout: 'flat' },
    hideDisabled: false,
    techniques,
    gradient: {
      colors: ['#ff6666', '#ffe766', '#8ec843'],
      minValue: 0,
      maxValue: 10,
    },
    metadata: [],
    links: [],
    showTacticRowBackground: false,
    tacticRowBackground: '#dddddd',
  };

  return new Response(JSON.stringify(layer), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

export function getStaticPaths() {
  return [{ params: { path: 'navigator.json' } }];
}
