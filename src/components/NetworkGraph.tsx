
import React, { useMemo, useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useWindowSize } from '@react-hook/window-size';
import * as THREE from 'three';

interface Node {
    id: string;
    group: number;
    type: 'threat' | 'band' | 'symptom' | 'diagnosis';
    val: number; // size
    color: string;
    name: string;
}

interface Link {
    source: string;
    target: string;
    color?: string;
}

interface ThreatVector {
    id: string;
    name: string;
    bands: string[];
    dsm5?: {
        cluster: string;
        primary: { code: string; name: string }[];
    };
}

interface NetworkGraphProps {
    threats: ThreatVector[];
    width?: number;
    height?: number;
}

const TYPE_COLORS = {
    threat: '#ef4444',   // Red-500
    band: '#3b82f6',     // Blue-500
    symptom: '#f59e0b',  // Amber-500
    diagnosis: '#8b5cf6' // Violet-500
};

export default function NetworkGraph({ threats, width = 800, height = 600 }: NetworkGraphProps) {
    // Generate graph data from threats
    const gData = useMemo(() => {
        const nodes: Map<string, Node> = new Map();
        const links: Link[] = [];

        threats.forEach(t => {
            // 1. Threat Node
            if (!nodes.has(t.id)) {
                nodes.set(t.id, {
                    id: t.id,
                    group: 1,
                    type: 'threat',
                    val: 10,
                    color: TYPE_COLORS.threat,
                    name: t.name
                });
            }

            // 2. Band Nodes & Links
            t.bands.forEach(bandId => {
                if (!nodes.has(bandId)) {
                    nodes.set(bandId, {
                        id: bandId,
                        group: 2,
                        type: 'band',
                        val: 15,
                        color: TYPE_COLORS.band,
                        name: `Band ${bandId}`
                    });
                }
                links.push({ source: t.id, target: bandId, color: '#94a3b8' });

                // 3. Diagnosis Nodes & Links (if diagnostic mode data exists)
                if (t.dsm5?.primary) {
                    t.dsm5.primary.forEach(diag => {
                        const diagId = diag.code;
                        if (!nodes.has(diagId)) {
                            nodes.set(diagId, {
                                id: diagId,
                                group: 3,
                                type: 'diagnosis',
                                val: 8,
                                color: TYPE_COLORS.diagnosis,
                                name: `${diag.code}: ${diag.name}`
                            });
                        }
                        // Connect Band -> Diagnosis (Simplified Neural Impact Chain)
                        // In a real model, this would go Band -> Structure -> Function -> Diagnosis
                        links.push({ source: bandId, target: diagId, color: '#cbd5e1' });
                    });
                }
            });
        });

        return {
            nodes: Array.from(nodes.values()),
            links: links
        };
    }, [threats]);

    const fgRef = useRef<any>(null);

    const handleNodeClick = useCallback((node: any) => {
        if (!node) return;
        // Aim at node from outside it
        const distance = 40;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

        if (fgRef.current) {
            fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
                node, // lookAt ({ x, y, z })
                3000  // ms transition duration
            );
        }
    }, []);

    return (
        <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
            <ForceGraph3D
                ref={fgRef}
                width={width}
                height={height}
                graphData={gData}
                nodeLabel="name"
                nodeColor="color"
                nodeVal="val"
                linkColor={(link: any) => link.color || '#ffffff'}
                linkWidth={1}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={2}
                onNodeClick={handleNodeClick}
                backgroundColor="#020617" // slate-950
                enablePointerInteraction={true}
            />
            <div className="absolute bottom-4 right-4 bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-xs text-slate-300">
                <div className="font-bold mb-2">Neural Impact Chain</div>
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Threat Vector</div>
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Neural Band</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-violet-500"></span> Clinical Diagnosis</div>
            </div>
        </div>
    );
}
