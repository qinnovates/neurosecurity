
import type { APIRoute } from 'astro';
import { THREAT_VECTORS } from '../../lib/threat-data';

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
        const attackId = `attack-pattern--${t.id.toLowerCase().replace(/-/g, '')}`;

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
                    url: `https://qinnovate.com/TARA/${t.id}`
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
    const stixBundle = convertToStix(THREAT_VECTORS);

    return new Response(JSON.stringify(stixBundle, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Public API
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            'X-Generator': 'Qinnovate-QIF-Stix-Engine/1.0'
        }
    });
};
