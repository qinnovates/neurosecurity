import type { APIRoute } from 'astro';
import { THREAT_VECTORS, THREAT_CATEGORIES, THREAT_TACTICS, THREAT_DOMAINS, NISS_SPEC, TARA_SPEC, DSM5_SPEC, getRegistryStats, getChangelog, getTaraStats, getDsm5Stats, getPhysicsFeasibilityStats, getNeurorightStats, getRegulatoryStats } from '../../lib/threat-data';
import { HOURGLASS_BANDS } from '../../lib/qif-constants';
import { getBciDevices, getBciStats } from '../../lib/bci-data';
import { BCI_CONSTRAINTS, BCI_CONSTRAINT_CATEGORIES, BCI_PHYSICS_CONSTANTS, BCI_VALIDATION } from '../../lib/bci-limits-constants';
import atlas from '@shared/qif-brain-bci-atlas.json';
import timeline from '../../data/qif-timeline.json';

export const GET: APIRoute = async () => {
    const data = {
        version: '1.0',
        generated: new Date().toISOString(),
        description: 'Unified QIF dataset: threat techniques, BCI devices, brain atlas, physics constraints, and scoring systems. All cross-referenced by QIF hourglass band IDs.',

        // ── QIF Model ──
        hourglass_bands: HOURGLASS_BANDS,

        // ── Threats (TARA) ──
        threats: {
            techniques: THREAT_VECTORS,
            categories: THREAT_CATEGORIES,
            tactics: THREAT_TACTICS,
            domains: THREAT_DOMAINS,
            changelog: getChangelog(),
            stats: getRegistryStats(),
            tara_stats: getTaraStats(),
            dsm5_stats: getDsm5Stats(),
            physics_feasibility: getPhysicsFeasibilityStats(),
            neurorights: getNeurorightStats(),
            regulatory: getRegulatoryStats(),
        },

        // ── BCI Devices ──
        devices: {
            inventory: getBciDevices(),
            stats: getBciStats(),
        },

        // ── Brain Atlas ──
        brain_atlas: {
            regions: (atlas as any).brain_regions ?? [],
            device_mappings: (atlas as any).device_region_mappings ?? [],
            neural_latency: (atlas as any).neural_latency_metrics ?? [],
            physics_constraints: (atlas as any).physics_constraints ?? [],
        },

        // ── Physics (BCI Limits Equation) ──
        physics: {
            constraints: BCI_CONSTRAINTS,
            categories: BCI_CONSTRAINT_CATEGORIES,
            constants: BCI_PHYSICS_CONSTANTS,
            validation: BCI_VALIDATION,
        },

        // ── Specifications ──
        specs: {
            niss: NISS_SPEC,
            tara: TARA_SPEC,
            dsm5: DSM5_SPEC,
        },

        // ── Timeline ──
        timeline: timeline.milestones,
        current_stats: timeline.current_stats,
    };

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
