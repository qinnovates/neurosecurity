/**
 * PDB Molecule Renderer — Parses RCSB Protein Data Bank files and renders
 * molecular structures using Three.js InstancedMesh for performance.
 *
 * Shows backbone CA atoms by default for clarity, with option for all atoms.
 * Supports AMPA receptor (7LDD), K+ channel (2R9R), NMDA receptor (4PE5).
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PDBAtom {
  x: number;
  y: number;
  z: number;
  element: string;
  name: string;
  chain: string;
  resName: string;
}

// CPK coloring convention
const ELEMENT_COLORS: Record<string, THREE.Color> = {
  C: new THREE.Color('#909090'),
  N: new THREE.Color('#3050F8'),
  O: new THREE.Color('#FF0D0D'),
  S: new THREE.Color('#FFFF30'),
  P: new THREE.Color('#FF8000'),
  H: new THREE.Color('#FFFFFF'),
  FE: new THREE.Color('#E06633'),
  CA: new THREE.Color('#3DFF00'),
  ZN: new THREE.Color('#7D80B0'),
  MG: new THREE.Color('#8AFF00'),
  NA: new THREE.Color('#AB5CF2'),
  CL: new THREE.Color('#1FF01F'),
  K: new THREE.Color('#8F40D4'),
};

const DEFAULT_COLOR = new THREE.Color('#FF69B4');

// Chain-based coloring for multi-subunit visualization
const CHAIN_COLORS: Record<string, THREE.Color> = {
  A: new THREE.Color('#3b82f6'),
  B: new THREE.Color('#10b981'),
  C: new THREE.Color('#f59e0b'),
  D: new THREE.Color('#ef4444'),
  E: new THREE.Color('#8b5cf6'),
  F: new THREE.Color('#06b6d4'),
  G: new THREE.Color('#ec4899'),
  H: new THREE.Color('#84cc16'),
};

function parsePDB(text: string): PDBAtom[] {
  const atoms: PDBAtom[] = [];
  for (const line of text.split('\n')) {
    if (!line.startsWith('ATOM') && !line.startsWith('HETATM')) continue;
    atoms.push({
      x: parseFloat(line.substring(30, 38)),
      y: parseFloat(line.substring(38, 46)),
      z: parseFloat(line.substring(46, 54)),
      element: line.substring(76, 78).trim() || line.substring(12, 14).trim().replace(/[0-9]/g, ''),
      name: line.substring(12, 16).trim(),
      chain: line.substring(21, 22).trim(),
      resName: line.substring(17, 20).trim(),
    });
  }
  return atoms;
}

type ColorMode = 'element' | 'chain';

interface PDBMoleculeProps {
  url: string;
  backboneOnly?: boolean;
  colorMode?: ColorMode;
  atomScale?: number;
  sceneScale?: number;
}

export default function PDBMolecule({
  url,
  backboneOnly = true,
  colorMode = 'chain',
  atomScale = 0.4,
  sceneScale = 0.06,
}: PDBMoleculeProps) {
  const [atoms, setAtoms] = useState<PDBAtom[] | null>(null);
  const [error, setError] = useState(false);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => setAtoms(parsePDB(text)))
      .catch(() => setError(true));
  }, [url]);

  const { displayAtoms, center } = useMemo(() => {
    if (!atoms) return { displayAtoms: [], center: new THREE.Vector3() };

    // Filter to backbone CA atoms if requested (much faster, cleaner view)
    let filtered = backboneOnly
      ? atoms.filter(a => a.name === 'CA')
      : atoms;

    // If backbone-only produced too few atoms, show all
    if (filtered.length < 50) filtered = atoms;

    // Compute center
    let cx = 0, cy = 0, cz = 0;
    for (const a of filtered) { cx += a.x; cy += a.y; cz += a.z; }
    cx /= filtered.length; cy /= filtered.length; cz /= filtered.length;

    return {
      displayAtoms: filtered,
      center: new THREE.Vector3(cx, cy, cz),
    };
  }, [atoms, backboneOnly]);

  // Build instanced mesh
  useEffect(() => {
    if (!meshRef.current || displayAtoms.length === 0) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < displayAtoms.length; i++) {
      const a = displayAtoms[i];
      dummy.position.set(
        (a.x - center.x) * sceneScale,
        (a.y - center.y) * sceneScale,
        (a.z - center.z) * sceneScale,
      );

      // Scale by element (heavy atoms bigger)
      const s = a.element === 'H' ? atomScale * 0.5 : atomScale;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color
      if (colorMode === 'chain') {
        color.copy(CHAIN_COLORS[a.chain] || DEFAULT_COLOR);
      } else {
        color.copy(ELEMENT_COLORS[a.element.toUpperCase()] || DEFAULT_COLOR);
      }
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [displayAtoms, center, colorMode, atomScale, sceneScale]);

  // Gentle rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  if (error || !atoms || displayAtoms.length === 0) return null;

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, displayAtoms.length]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </instancedMesh>
    </group>
  );
}
