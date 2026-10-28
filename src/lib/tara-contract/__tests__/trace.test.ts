// @vitest-environment node
import registrar from '@shared/qtara-registrar.json';
import tara from '@shared/tara-chains.json';
import { describe, expect, it } from 'vitest';
import type { BandId } from '@/lib/threat-model/catalog-types';
import { buildChainTrace, resolveTraceEndpoint } from '../trace';
import type { AnchorLookup, TraceTechnique } from '../types';

interface RegistrarTechnique { id: string; band_ids?: string[] }
interface ChainStep { position: number; technique_id: string }
interface Chain { chain_id: string; steps: ChainStep[] }

const registrarTechniques = (registrar as { techniques: RegistrarTechnique[] }).techniques;
const chains = (tara as { chains: Chain[] }).chains;

/** No region has an AI-drafted lit link wired to a built anchor in these tests — matching the real branch, where §5.19 R2–R11 have not shipped. */
function techniquesById(litRegionsByTechnique: Record<string, string[]> = {}): Map<string, TraceTechnique> {
  return new Map(registrarTechniques.map((technique) => [
    technique.id,
    { id: technique.id, bandIds: (technique.band_ids ?? []) as BandId[], litRegionIds: litRegionsByTechnique[technique.id] ?? [] },
  ]));
}

function chainById(chainId: string): Chain {
  const chain = chains.find((candidate) => candidate.chain_id === chainId);
  if (chain === undefined) throw new Error(`fixture chain "${chainId}" is missing from datalake/tara-chains.json`);
  return chain;
}

function traceFor(chainId: string, litRegionsByTechnique: Record<string, string[]> = {}, anchors?: AnchorLookup) {
  const chain = chainById(chainId);
  return buildChainTrace(chain.chain_id, chain.steps.map((step) => ({ position: step.position, techniqueId: step.technique_id })), techniquesById(litRegionsByTechnique), { anchors });
}

describe('resolveTraceEndpoint — rev 8 device-interface default (G6 §5.20.2 rule 3, AC 149)', () => {
  it('never produces a scalp or ear coordinate for CHAIN-EAR-001\'s I0 step, only the unresolved badge', () => {
    const trace = traceFor('CHAIN-EAR-001');
    const entrySteps = trace.steps.filter((step) => step.endpoint.kind === 'entry' || step.via.some((w) => w.kind === 'entry'));
    expect(entrySteps.length).toBeGreaterThan(0);
    for (const step of trace.steps) {
      if (step.endpoint.kind === 'entry') {
        expect(step.endpoint.source).toBe('unresolved');
        expect(step.endpoint.tier).toBe('schematic');
        expect(step.endpoint).not.toHaveProperty('pointMm');
        expect(step.endpoint).not.toHaveProperty('electrode');
      }
    }
  });

  it('CHAIN-EEG-001 (no I0 step today) and CHAIN-DBS-001\'s I0 step both default to unresolved, never Cz', () => {
    for (const chainId of ['CHAIN-EEG-001', 'CHAIN-DBS-001'] as const) {
      const trace = traceFor(chainId);
      for (const step of trace.steps) {
        if (step.endpoint.kind === 'entry') expect(step.endpoint.source).toBe('unresolved');
      }
    }
  });
});

describe('buildChainTrace — worked examples (G6 §5.20.10, verified against the real registrar and tara-chains.json this session)', () => {
  it('CHAIN-DBS-001: rail, rail, rail, envelope N5/N6/N7 (via entry), envelope N7', () => {
    const trace = traceFor('CHAIN-DBS-001');
    const kinds = trace.steps.map((s) => s.endpoint.kind);
    expect(kinds).toEqual(['rail', 'rail', 'rail', 'envelope', 'envelope']);
    expect(trace.steps[3].endpoint).toMatchObject({ kind: 'envelope', addresses: ['N5', 'N6', 'N7'], primaryAddress: null });
    expect(trace.steps[3].via).toEqual([{ kind: 'entry' }]);
    expect(trace.steps[4].endpoint).toMatchObject({ kind: 'envelope', addresses: ['N7'] });
    expect(trace.railOnly).toBe(false);
  });

  it('CHAIN-VIS-001: N1 is dotted (excluded), never a primary; fans to N3/N5/N6/N7', () => {
    const trace = traceFor('CHAIN-VIS-001');
    const fanOutStep = trace.steps[3];
    expect(fanOutStep.endpoint).toMatchObject({ kind: 'envelope', addresses: ['N3', 'N5', 'N6', 'N7'], primaryAddress: null });
    expect(fanOutStep.endpoint.kind === 'envelope' ? fanOutStep.endpoint.addresses : []).not.toContain('N1');
  });

  it('CHAIN-VIS-002: back-out to the rail, then re-entry via the device interface for the one lit hop', () => {
    const trace = traceFor('CHAIN-VIS-002');
    const kinds = trace.steps.map((s) => s.endpoint.kind);
    expect(kinds).toEqual(['envelope', 'rail', 'envelope', 'envelope', 'envelope']); // falls through region->envelope: no anchor is built yet
    expect(trace.steps[0].via).toEqual([]); // first step: no preceding hop
    expect(trace.steps[1].via).toEqual([{ kind: 'edge', side: 'bottom' }]); // back out to rail S2
    expect(trace.steps[3].via).toEqual([{ kind: 'entry' }]); // QIF-T0103 carries I0
  });

  it('CHAIN-VIS-002 step 4 resolves to the region v1 once a caller supplies a real anchor (today none is built; this proves the mechanism)', () => {
    const anchors: AnchorLookup = { stateFor: (regionId) => (regionId === 'v1' ? 'provisional' : null) };
    const trace = traceFor('CHAIN-VIS-002', { 'QIF-T0103': ['v1'] }, anchors);
    expect(trace.steps[3].endpoint).toMatchObject({ kind: 'region', regionIds: ['v1'], tier: 'provisional' });
  });

  it('CHAIN-EAR-001: enters tissue, stays, backs out to the rail, re-enters — matches G6 §0.1\'s band pattern', () => {
    const trace = traceFor('CHAIN-EAR-001');
    const kinds = trace.steps.map((s) => s.endpoint.kind);
    expect(kinds).toEqual(['rail', 'envelope', 'envelope', 'rail', 'envelope']);
    expect(trace.steps[3].via).toEqual([{ kind: 'edge', side: 'bottom' }]); // T0079 backs out to rail S1
  });

  it('CHAIN-RBCI-001 never leaves the rail', () => {
    const trace = traceFor('CHAIN-RBCI-001');
    expect(trace.railOnly).toBe(true);
    expect(trace.steps.every((s) => s.endpoint.kind === 'rail')).toBe(true);
  });

  it('CHAIN-IMP-001: I0 at step 2, rail at step 3, then fans to N6/N7 and N3/N6/N7', () => {
    const trace = traceFor('CHAIN-IMP-001');
    const kinds = trace.steps.map((s) => s.endpoint.kind);
    expect(kinds).toEqual(['rail', 'entry', 'rail', 'envelope', 'envelope']);
    expect(trace.steps[3].endpoint).toMatchObject({ addresses: ['N6', 'N7'] });
    expect(trace.steps[4].endpoint).toMatchObject({ addresses: ['N3', 'N7', 'N6'] }); // datalake order: QIF-T0032's band_ids list N7 before N6
  });
});

describe('resolveTraceEndpoint — edge cases', () => {
  it('a step whose technique is missing from the registrar resolves to none, not a crash', () => {
    expect(resolveTraceEndpoint(undefined)).toEqual({ kind: 'none', reason: 'no registrar entry for this step\'s technique' });
  });

  it('an N1-only technique (no computed envelope yet) resolves to none with the §15 reason, never a guessed point', () => {
    const technique: TraceTechnique = { id: 'FIXTURE-N1-ONLY', bandIds: ['N1'], litRegionIds: [] };
    expect(resolveTraceEndpoint(technique)).toEqual({ kind: 'none', reason: 'every N-tag on this step is outside the addresses with a computed envelope (N1, pending §15)' });
  });

  it('a technique with no band tags at all resolves to none with the no-band reason', () => {
    const technique: TraceTechnique = { id: 'FIXTURE-NO-BANDS', bandIds: [], litRegionIds: [] };
    expect(resolveTraceEndpoint(technique)).toEqual({ kind: 'none', reason: 'this technique carries no signal, interface or neural band tag' });
  });
});
