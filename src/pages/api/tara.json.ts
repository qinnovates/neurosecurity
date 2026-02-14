import type { APIRoute } from 'astro';
import { THREAT_VECTORS, getRegistryStats, getChangelog } from '../../lib/threat-data';

export const GET: APIRoute = async () => {
    const data = {
        version: '1.0',
        generated: new Date().toISOString(),
        stats: getRegistryStats(),
        changelog: getChangelog(),
        techniques: THREAT_VECTORS,
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

export function getStaticPaths() {
    return [
        { params: { path: 'tara.json' } }
    ];
}
