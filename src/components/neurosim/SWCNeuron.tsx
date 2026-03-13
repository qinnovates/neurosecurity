/**
 * SWC Neuron Renderer — Parses NeuroMorpho.org SWC files and renders
 * realistic neuron morphology using Three.js LineSegments + InstancedMesh.
 *
 * SWC format: id type x y z radius parent_id
 * Types: 1=soma, 2=axon, 3=basal dendrite, 4=apical dendrite
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SWCNode {
  id: number;
  type: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  parent: number;
}

// Type → color mapping (matches neuroscience conventions)
const TYPE_COLORS: Record<number, THREE.Color> = {
  1: new THREE.Color('#e879f9'), // soma — magenta
  2: new THREE.Color('#3b82f6'), // axon — blue
  3: new THREE.Color('#ef4444'), // basal dendrite — red
  4: new THREE.Color('#10b981'), // apical dendrite — green
};

function parseSWC(text: string): SWCNode[] {
  const nodes: SWCNode[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 7) continue;
    nodes.push({
      id: parseInt(parts[0], 10),
      type: parseInt(parts[1], 10),
      x: parseFloat(parts[2]),
      y: parseFloat(parts[3]),
      z: parseFloat(parts[4]),
      radius: parseFloat(parts[5]),
      parent: parseInt(parts[6], 10),
    });
  }
  return nodes;
}

function buildGeometry(nodes: SWCNode[], scale: number) {
  const nodeMap = new Map<number, SWCNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Center calculation
  let cx = 0, cy = 0, cz = 0;
  const somaNodes = nodes.filter(n => n.type === 1);
  if (somaNodes.length > 0) {
    for (const s of somaNodes) { cx += s.x; cy += s.y; cz += s.z; }
    cx /= somaNodes.length; cy /= somaNodes.length; cz /= somaNodes.length;
  }

  // Build line segments (pairs of positions + colors for each segment)
  const positions: number[] = [];
  const colors: number[] = [];
  const somaPositions: { x: number; y: number; z: number; r: number }[] = [];

  for (const node of nodes) {
    if (node.type === 1) {
      somaPositions.push({
        x: (node.x - cx) * scale,
        y: (node.y - cy) * scale,
        z: (node.z - cz) * scale,
        r: Math.max(node.radius * scale, 0.05),
      });
      continue;
    }
    if (node.parent < 0) continue;
    const parent = nodeMap.get(node.parent);
    if (!parent) continue;

    const color = TYPE_COLORS[node.type] || TYPE_COLORS[2];

    // Parent position
    positions.push((parent.x - cx) * scale, (parent.y - cy) * scale, (parent.z - cz) * scale);
    colors.push(color.r, color.g, color.b);
    // Child position
    positions.push((node.x - cx) * scale, (node.y - cy) * scale, (node.z - cz) * scale);
    colors.push(color.r, color.g, color.b);
  }

  return {
    linePositions: new Float32Array(positions),
    lineColors: new Float32Array(colors),
    somaPositions,
  };
}

interface SWCNeuronProps {
  url: string;
  scale?: number;
  isAnimating?: boolean;
  phaseColor?: string;
  axonColor?: string;
}

export default function SWCNeuron({
  url,
  scale = 0.012,
  isAnimating = false,
  phaseColor = '#f59e0b',
}: SWCNeuronProps) {
  const [swcData, setSwcData] = useState<SWCNode[] | null>(null);
  const [error, setError] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseProgress = useRef(0);

  useEffect(() => {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => setSwcData(parseSWC(text)))
      .catch(() => setError(true));
  }, [url]);

  const geometry = useMemo(() => {
    if (!swcData) return null;
    return buildGeometry(swcData, scale);
  }, [swcData, scale]);

  // Build axon path for AP animation
  const axonPath = useMemo(() => {
    if (!swcData) return null;
    const nodeMap = new Map<number, SWCNode>();
    for (const n of swcData) nodeMap.set(n.id, n);

    // Find soma center
    const somaNodes = swcData.filter(n => n.type === 1);
    let cx = 0, cy = 0, cz = 0;
    if (somaNodes.length > 0) {
      for (const s of somaNodes) { cx += s.x; cy += s.y; cz += s.z; }
      cx /= somaNodes.length; cy /= somaNodes.length; cz /= somaNodes.length;
    }

    // Find longest axon chain from soma
    const axonNodes = swcData.filter(n => n.type === 2);
    if (axonNodes.length === 0) return null;

    // Build children map
    const children = new Map<number, number[]>();
    for (const n of axonNodes) {
      if (n.parent >= 0) {
        const arr = children.get(n.parent) || [];
        arr.push(n.id);
        children.set(n.parent, arr);
      }
    }

    // Find axon root (connected to soma)
    const somaIds = new Set(somaNodes.map(n => n.id));
    let axonRoot = axonNodes.find(n => somaIds.has(n.parent));
    if (!axonRoot) axonRoot = axonNodes[0];

    // Trace longest path
    const path: THREE.Vector3[] = [];
    let current: SWCNode | undefined = axonRoot;
    const visited = new Set<number>();
    while (current && path.length < 200) {
      visited.add(current.id);
      path.push(new THREE.Vector3(
        (current.x - cx) * scale,
        (current.y - cy) * scale,
        (current.z - cz) * scale,
      ));
      const kids = children.get(current.id)?.filter(id => !visited.has(id));
      current = kids && kids.length > 0 ? nodeMap.get(kids[0]) : undefined;
    }

    return path.length > 2 ? new THREE.CatmullRomCurve3(path) : null;
  }, [swcData, scale]);

  useFrame((state) => {
    if (isAnimating && pulseRef.current && axonPath) {
      pulseProgress.current = (pulseProgress.current + 0.005) % 1;
      const pt = axonPath.getPoint(pulseProgress.current);
      pulseRef.current.position.copy(pt);
      const glow = 0.5 + Math.sin(state.clock.elapsedTime * 8) * 0.3;
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = glow;
    }
  });

  if (error || !geometry) return null;

  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute('position', new THREE.BufferAttribute(geometry.linePositions, 3));
  lineGeom.setAttribute('color', new THREE.BufferAttribute(geometry.lineColors, 3));

  return (
    <group ref={groupRef}>
      {/* Neuron branches as line segments */}
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial vertexColors transparent opacity={0.7} />
      </lineSegments>

      {/* Soma spheres */}
      {geometry.somaPositions.map((s, i) => (
        <mesh key={`soma-${i}`} position={[s.x, s.y, s.z]}>
          <sphereGeometry args={[s.r, 16, 16]} />
          <meshStandardMaterial
            color="#e879f9"
            transparent
            opacity={0.8}
            emissive={isAnimating ? phaseColor : '#000000'}
            emissiveIntensity={isAnimating ? 0.4 : 0}
          />
        </mesh>
      ))}

      {/* Soma glow */}
      {geometry.somaPositions.length > 0 && (
        <mesh position={[geometry.somaPositions[0].x, geometry.somaPositions[0].y, geometry.somaPositions[0].z]}>
          <sphereGeometry args={[geometry.somaPositions[0].r * 2, 12, 12]} />
          <meshBasicMaterial color="#e879f9" transparent opacity={0.08} />
        </mesh>
      )}

      {/* Action potential pulse traveling along axon */}
      {isAnimating && axonPath && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color={phaseColor} transparent opacity={0.9} />
          <pointLight color={phaseColor} intensity={3} distance={3} />
        </mesh>
      )}
    </group>
  );
}
