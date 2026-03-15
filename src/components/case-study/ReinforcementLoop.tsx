import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollVisible } from '../../lib/useScrollVisible';
import { useReducedMotion } from '../../lib/useReducedMotion';

// --- Constants ---
const NODE_COUNT = 4;
const PARTICLE_COUNT = 50;

const NODES = [
  { label: 'T0066', sublabel: 'Slow Drift', color: '#f59e0b', angle: 0 },
  { label: 'T0067', sublabel: 'Replay', color: '#06b6d4', angle: Math.PI * 0.5 },
  { label: 'T0039', sublabel: 'Self-Model', color: '#ef4444', angle: Math.PI },
  { label: 'Reduced', sublabel: 'Detection', color: '#a855f7', angle: Math.PI * 1.5 },
];

// Elliptical path parameters
const RX = 2.2;
const RY = 1.2;

function getEllipsePos(t: number): [number, number, number] {
  return [Math.cos(t) * RX, Math.sin(t) * RY, 0];
}

// --- Node spheres ---
function LoopNode({ node, index }: { node: typeof NODES[0]; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseScale = useRef(1);
  const color = useMemo(() => new THREE.Color(node.color), [node.color]);
  const pos = getEllipsePos(node.angle);

  useFrame((state) => {
    if (!meshRef.current) return;
    // Pulse effect
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.08;
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, pulse * baseScale.current, 0.1));
  });

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.9} />
      </mesh>
      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.28, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <Html center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${node.color}40`,
          borderRadius: '8px',
          padding: '4px 10px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: node.color, fontFamily: 'monospace' }}>
            {node.label}
          </div>
          <div style={{ fontSize: '9px', color: '#6b7280' }}>
            {node.sublabel}
          </div>
        </div>
      </Html>
    </group>
  );
}

// --- Orbiting particles via InstancedMesh ---
function OrbitalParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Each particle: offset along the path + speed variation
  const particleData = useMemo(() => {
    const data: { offset: number; speed: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      data.push({
        offset: (i / PARTICLE_COUNT) * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.15,
      });
    }
    return data;
  }, []);

  const nodeColors = useMemo(
    () => NODES.map((n) => new THREE.Color(n.color)),
    [],
  );

  const colorAttr = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    // Initialize white
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) arr[i] = 1;
    return arr;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const pd = particleData[i];
      let angle = pd.offset + t * pd.speed;

      // Acceleration between "Reduced detection" (1.5pi) and "T0066" (0/2pi)
      const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      if (normalizedAngle > Math.PI * 1.5 || normalizedAngle < Math.PI * 0.25) {
        angle += t * pd.speed * 0.3; // extra speed in this segment
      }

      const pos = getEllipsePos(angle);
      dummy.position.set(pos[0], pos[1], pos[2] + (Math.random() - 0.5) * 0.05);
      dummy.scale.setScalar(0.04 + Math.sin(t * 3 + i) * 0.01);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color transitions: interpolate to nearest node color
      const na = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const segIndex = Math.floor((na / (Math.PI * 2)) * NODE_COUNT) % NODE_COUNT;
      const nextIndex = (segIndex + 1) % NODE_COUNT;
      const segFrac = ((na / (Math.PI * 2)) * NODE_COUNT) % 1;

      const c = new THREE.Color().lerpColors(nodeColors[segIndex], nodeColors[nextIndex], segFrac);
      colorAttr[i * 3] = c.r;
      colorAttr[i * 3 + 1] = c.g;
      colorAttr[i * 3 + 2] = c.b;
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    const colBuf = meshRef.current.geometry.getAttribute('color');
    if (colBuf) (colBuf as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 8, 8]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorAttr, 3]} />
      </sphereGeometry>
      <meshBasicMaterial vertexColors transparent opacity={0.85} />
    </instancedMesh>
  );
}

// --- Ellipse path outline ---
function EllipsePath() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const [x, y, z] = getEllipsePos(a);
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, []);

  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line>
      <primitive object={geo} attach="geometry" />
      <lineBasicMaterial color="#4b5563" transparent opacity={0.3} />
    </line>
  );
}

// --- Scene ---
function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 3]} intensity={0.4} />

      <EllipsePath />

      {NODES.map((node, i) => (
        <LoopNode key={node.label} node={node} index={i} />
      ))}

      <OrbitalParticles />
    </>
  );
}

// --- Static fallback for reduced motion ---
function StaticFallback() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      gap: '24px',
      flexWrap: 'wrap',
      padding: '24px',
    }}>
      {NODES.map((node) => (
        <div
          key={node.label}
          style={{
            background: 'rgba(255,255,255,0.8)',
            border: `2px solid ${node.color}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: node.color, fontFamily: 'monospace' }}>
            {node.label}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>{node.sublabel}</div>
        </div>
      ))}
    </div>
  );
}

// --- Exported component ---
export default function ReinforcementLoop() {
  const { ref, isVisible } = useScrollVisible(0.1);
  const reducedMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '300px',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {reducedMotion ? (
        <StaticFallback />
      ) : isVisible ? (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
        >
          <Scene />
        </Canvas>
      ) : null}
    </div>
  );
}
