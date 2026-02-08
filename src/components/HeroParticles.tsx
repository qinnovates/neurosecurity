import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 120;
const FIELD_SIZE = 12;
const CONNECTION_DISTANCE = 2.5;

/** Single particle with drift behavior */
function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  // Generate initial positions and velocities
  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);

    const palette = [
      new THREE.Color('#3b82f6'), // blue
      new THREE.Color('#06b6d4'), // teal
      new THREE.Color('#8b5cf6'), // violet
      new THREE.Color('#10b981'), // green
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * FIELD_SIZE;
      pos[i3 + 1] = (Math.random() - 0.5) * FIELD_SIZE;
      pos[i3 + 2] = (Math.random() - 0.5) * 4;

      vel[i3] = (Math.random() - 0.5) * 0.003;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.003;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.001;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }

    return { positions: pos, velocities: vel, colors: col };
  }, []);

  // Lines for connections
  const lineGeo = useRef<THREE.BufferGeometry>(null);
  const linePositions = useMemo(() => new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6), []);
  const lineColors = useMemo(() => new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Track mouse for parallax
  const onPointerMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  useMemo(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pointermove', onPointerMove);
      }
    };
  }, [onPointerMove]);

  useFrame((_, delta) => {
    if (!meshRef.current || !lineGeo.current) return;
    const dt = Math.min(delta, 0.05);

    let lineIdx = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Update position
      positions[i3] += velocities[i3] * 60 * dt;
      positions[i3 + 1] += velocities[i3 + 1] * 60 * dt;
      positions[i3 + 2] += velocities[i3 + 2] * 60 * dt;

      // Wrap around field
      const half = FIELD_SIZE / 2;
      if (positions[i3] > half) positions[i3] = -half;
      if (positions[i3] < -half) positions[i3] = half;
      if (positions[i3 + 1] > half) positions[i3 + 1] = -half;
      if (positions[i3 + 1] < -half) positions[i3 + 1] = half;
      if (positions[i3 + 2] > 2) positions[i3 + 2] = -2;
      if (positions[i3 + 2] < -2) positions[i3 + 2] = 2;

      // Mouse parallax
      const mx = mouseRef.current.x * 0.3;
      const my = mouseRef.current.y * 0.3;

      dummy.position.set(
        positions[i3] + mx,
        positions[i3 + 1] + my,
        positions[i3 + 2]
      );
      const scale = 0.02 + Math.random() * 0.005;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Connection lines
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const j3 = j * 3;
        const dx = positions[i3] - positions[j3];
        const dy = positions[i3 + 1] - positions[j3 + 1];
        const dz = positions[i3 + 2] - positions[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECTION_DISTANCE) {
          const alpha = 1 - dist / CONNECTION_DISTANCE;
          const li = lineIdx * 6;
          linePositions[li] = positions[i3] + mx;
          linePositions[li + 1] = positions[i3 + 1] + my;
          linePositions[li + 2] = positions[i3 + 2];
          linePositions[li + 3] = positions[j3] + mx;
          linePositions[li + 4] = positions[j3 + 1] + my;
          linePositions[li + 5] = positions[j3 + 2];

          // Blend colors
          const a = alpha * 0.15;
          lineColors[li] = colors[i3] * a;
          lineColors[li + 1] = colors[i3 + 1] * a;
          lineColors[li + 2] = colors[i3 + 2] * a;
          lineColors[li + 3] = colors[j3] * a;
          lineColors[li + 4] = colors[j3 + 1] * a;
          lineColors[li + 5] = colors[j3 + 2] * a;

          lineIdx++;
        }
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Update line geometry
    lineGeo.current.setDrawRange(0, lineIdx * 2);
    lineGeo.current.attributes.position.needsUpdate = true;
    lineGeo.current.attributes.color.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
      </instancedMesh>

      <lineSegments>
        <bufferGeometry ref={lineGeo}>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={lineColors.length / 3}
            array={lineColors}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.5} />
      </lineSegments>
    </>
  );
}

export default function HeroParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Particles />
      </Canvas>
    </div>
  );
}
