
import type { APIRoute } from 'astro';
import { THREAT_VECTORS } from '@/lib/threat-data';

// --- Helper: Convert TARA to STIX 2.1 Objects ---
function convertToStix(threats: typeof THREAT_VECTORS) {
    const timestamp = new Date().toISOString();
    const stixObjects: any[] = [];

    // 1. Identity Object (Qinnovate)
    const identityId = "identity--qinnovate-tara";
    stixObjects.push({
        type: "identity",
        id: identityId,
        spec_version: "2.1",
        created: "2026-01-01T00:00:00.000Z",
        modified: timestamp,
        name: "Qinnovate Interface Framework (QIF)",
        identity_class: "organization",
        sectors: ["technology", "healthcare", "research"],
        contact_information: "security@qinnovate.com"
    });

    threats.forEach(t => {
        // 2. Attack Pattern Object
        // STIX IDs must be UUIDv4 - for stability we'd hash the ID, 
        // but here we'll use a deterministic prefix for demo durability
        // (In production, use UUIDv5 with namespace)
        // Validate technique ID to prevent injection into STIX identifiers
        const safeId = t.id.replace(/[^a-zA-Z0-9\-]/g, '');
        const attackId = `attack-pattern--${safeId.toLowerCase().replace(/-/g, '')}`;

        const stixAttack = {
            type: "attack-pattern",
            id: attackId,
            spec_version: "2.1",
            created: "2026-01-01T00:00:00.000Z",
            modified: timestamp,
            name: t.name,
            description: t.description,
            kill_chain_phases: [
                {
                    kill_chain_name: "qif-interaction-chain",
                    phase_name: "exploitation" // default for now
                }
            ],
            external_references: [
                {
                    source_name: "QIF TARA",
                    external_id: t.id,
                    url: `https://qinnovate.com/atlas/tara/${t.id}`
                }
            ],
            x_qif_severity: t.severity,
            x_qif_bands: t.bands,
            x_qif_dual_use: t.tara?.dual_use || "unknown"
        };

        stixObjects.push(stixAttack);
    });

    // Bundle it all up
    return {
        type: "bundle",
        id: `bundle--${crypto.randomUUID()}`,
        spec_version: "2.1",
        objects: stixObjects
    };
}

export const GET: APIRoute = async () => {
    const enrichedVectors = THREAT_VECTORS.filter((t) => t.enriched);
    const stixBundle = convertToStix(enrichedVectors);

    return new Response(JSON.stringify(stixBundle, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // NOTE: wildcard CORS is intentional for public data. Do NOT add credentials support without restricting origin.
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
    });
};
