
import type { APIRoute } from 'astro';
import { THREAT_VECTORS, TECHNIQUE_VARIANTS } from '@/lib/threat-data';
import type { TechniqueVariant, ThreatVector } from '@/lib/threat-data';
import { attackPatternStixId, variantRelationshipStixId } from '@/lib/stix-ids';

const STIX_CREATED = "2026-01-01T00:00:00.000Z";
// A variant points at its parent with the standard STIX 2.1 common relationship `related-to`.
// `derived-from` is the other standard candidate, but the specification defines it for an object
// whose information was derived from another object (provenance), which is not what a variant is.
// ATT&CK's `subtechnique-of` is a custom type and is deliberately not used. The specific meaning
// travels in the description and in x_qif_relationship.
const VARIANT_RELATIONSHIP_TYPE = "related-to";
const VARIANT_RELATIONSHIP_LABEL = "variant-of";

// --- Helper: a variant as an attack-pattern plus a relationship to its parent ---
function convertVariantToStix(variant: TechniqueVariant, parent: ThreatVector, timestamp: string) {
    const variantStixId = attackPatternStixId(variant.id);
    const inheritsScore = variant.inheritsNiss && parent.niss.scoring_state === 'scored';
    const attackPattern = {
        type: "attack-pattern",
        id: variantStixId,
        spec_version: "2.1",
        created: STIX_CREATED,
        modified: timestamp,
        name: variant.name,
        description: variant.description,
        external_references: [
            {
                source_name: "QIF TARA",
                external_id: variant.id,
                url: `https://qinnovate.com/atlas/tara/${parent.id}/#${variant.id}`
            }
        ],
        x_qif_variant_of: parent.id,
        x_qif_alias: variant.alias,
        x_qif_differs_in: variant.differsIn,
        x_qif_status: variant.status,
        x_qif_peer_review_status: variant.peerReviewStatus,
        // The scoring state is the variant's own; only an inherited vector is read from the parent.
        x_qif_niss_scoring_state: variant.niss.scoring_state,
        ...(inheritsScore
            ? { x_qif_niss_score: parent.niss.score, x_qif_niss_vector: parent.niss.vector, x_qif_niss_inherited_from: parent.id }
            : { x_qif_niss_unscored_reason: variant.niss.unscored_reason ?? null }),
    };
    const relationship = {
        type: "relationship",
        id: variantRelationshipStixId(variant.id, parent.id),
        spec_version: "2.1",
        created: STIX_CREATED,
        modified: timestamp,
        relationship_type: VARIANT_RELATIONSHIP_TYPE,
        description: `${variant.id} is a variant of ${parent.id}; it differs in ${variant.differsIn}.`,
        source_ref: variantStixId,
        target_ref: attackPatternStixId(parent.id),
        x_qif_relationship: VARIANT_RELATIONSHIP_LABEL,
    };
    return [attackPattern, relationship];
}

// --- Helper: Convert TARA to STIX 2.1 Objects ---
function convertToStix(threats: typeof THREAT_VECTORS, variants: TechniqueVariant[]) {
    const timestamp = new Date().toISOString();
    const stixObjects: Record<string, unknown>[] = [];

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
        contact_information: "https://qinnovate.com"
    });

    threats.forEach(t => {
        // 2. Attack Pattern Object
        // Deterministic UUIDv5, the same scheme and namespace as the Python SDK (see src/lib/stix-ids.ts),
        // so the two exports give one technique one id. The helper rejects a malformed technique id.
        const attackId = attackPatternStixId(t.id);

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

    // 3. Variants. One whose parent is not exported is left out, so no relationship points at a missing object.
    const exportedById = new Map(threats.map(t => [t.id, t]));
    variants.forEach(variant => {
        const parent = exportedById.get(variant.parent);
        if (parent) stixObjects.push(...convertVariantToStix(variant, parent, timestamp));
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
    const stixBundle = convertToStix(enrichedVectors, TECHNIQUE_VARIANTS);

    return new Response(JSON.stringify(stixBundle, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // NOTE: wildcard CORS is intentional for public data. Do NOT add credentials support without restricting origin.
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
    });
};
