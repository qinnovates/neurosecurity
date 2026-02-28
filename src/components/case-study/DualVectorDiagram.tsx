import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollVisible } from '../../lib/useScrollVisible';
import { useReducedMotion } from '../../lib/useReducedMotion';

// --- Constants ---
const COVID_COUNT = 120;
const PTSD_COUNT = 120;
const FEEDBACK_COUNT = 30;
const TOTAL = COVID_COUNT + PTSD_COUNT + FEEDBACK_COUNT;

// Layout Y positions (top to bottom)
const SRC_Y = 3.2;
const BRANCH_Y = 2.0;
const CONVERGE_Y = 0.2;
const CASCADE_Y = -0.8;
const CORRUPT_Y = -1.8;

// Source X positions
const COVID_X = -1.5;
const PTSD_X = 1.5;

const COLOR_COVID = new THREE.Color('#ef4444');
const COLOR_PTSD = new THREE.Color('#06b6d4');
const COLOR_AMBER = new THREE.Color('#f59e0b');
const COLOR_PURPLE = new THREE.Color('#a855f7');
const COLOR_RED = new THREE.Color('#ef4444');
const COLOR_FEEDBACK = new THREE.Color('#94a3b8');

// --- Label nodes ---
const LABELS = [
  { text: 'COVID', sub: 'Inflammatory', x: COVID_X, y: SRC_Y, color: '#ef4444' },
  { text: 'PTSD', sub: 'Experiential', x: PTSD_X, y: SRC_Y, color: '#06b6d4' },
  { text: 'Weakened', sub: 'Neural Substrate', x: 0, y: CONVERGE_Y, color: '#f59e0b' },
  { text: 'Cascade', sub: 'Activation', x: 0, y: CASCADE_Y, color: '#a855f7' },
  { text: 'Self-Model', sub: 'Corruption', x: 0, y: CORRUPT_Y, color: '#ef4444' },
];

// --- Particle system ---
function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Per-particle persistent state
  const pData = useMemo(() => {
    const data: {
      type: 'covid' | 'ptsd' | 'feedback';
      progress: number;
      speed: number;
      xOffset: number;
      zOffset: number;
    }[] = [];

    for (let i = 0; i < COVID_COUNT; i++) {
      data.push({
        type: 'covid',
        progress: Math.random(),
        speed: 0.08 + Math.random() * 0.06,
        xOffset: (Math.random() - 0.5) * 0.4,
        zOffset: (Math.random() - 0.5) * 0.3,
      });
    }
    for (let i = 0; i < PTSD_COUNT; i++) {
      data.push({
        type: 'ptsd',
        progress: Math.random(),
        speed: 0.08 + Math.random() * 0.06,
        xOffset: (Math.random() - 0.5) * 0.4,
        zOffset: (Math.random() - 0.5) * 0.3,
      });
    }
    for (let i = 0; i < FEEDBACK_COUNT; i++) {
      data.push({
        type: 'feedback',
        progress: Math.random(),
        speed: 0.05 + Math.random() * 0.04,
        xOffset: (Math.random() - 0.5) * 0.2,
        zOffset: (Math.random() - 0.5) * 0.2,
      });
    }
    return data;
  }, []);

  const colorAttr = useMemo(() => new Float32Array(TOTAL * 3), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    for (let i = 0; i < TOTAL; i++) {
      const p = pData[i];
      p.progress += p.speed * delta;
      if (p.progress > 1) p.progress -= 1;

      let x: number, y: number, z: number;
      const c = new THREE.Color();
      const t = p.progress;

      if (p.type === 'covid') {
        // COVID path: source -> branch -> convergence -> cascade -> corruption
        if (t < 0.2) {
          // Source to branch
          const f = t / 0.2;
          x = COVID_X + p.xOffset;
          y = THREE.MathUtils.lerp(SRC_Y, BRANCH_Y, f);
          z = p.zOffset;
          c.copy(COLOR_COVID);
        } else if (t < 0.5) {
          // Branch to convergence
          const f = (t - 0.2) / 0.3;
          x = THREE.MathUtils.lerp(COVID_X, 0, f) + p.xOffset * (1 - f);
          y = THREE.MathUtils.lerp(BRANCH_Y, CONVERGE_Y, f);
          z = p.zOffset * (1 - f * 0.5);
          c.lerpColors(COLOR_COVID, COLOR_AMBER, f);
        } else if (t < 0.7) {
          // Convergence to cascade
          const f = (t - 0.5) / 0.2;
          x = p.xOffset * 0.3;
          y = THREE.MathUtils.lerp(CONVERGE_Y, CASCADE_Y, f);
          z = p.zOffset * 0.3;
          c.lerpColors(COLOR_AMBER, COLOR_PURPLE, f);
        } else {
          // Cascade to corruption
          const f = (t - 0.7) / 0.3;
          x = p.xOffset * 0.2;
          y = THREE.MathUtils.lerp(CASCADE_Y, CORRUPT_Y, f);
          z = p.zOffset * 0.2;
          c.lerpColors(COLOR_PURPLE, COLOR_RED, f);
        }
      } else if (p.type === 'ptsd') {
        // PTSD path: mirror of COVID from right side
        if (t < 0.2) {
          const f = t / 0.2;
          x = PTSD_X + p.xOffset;
          y = THREE.MathUtils.lerp(SRC_Y, BRANCH_Y, f);
          z = p.zOffset;
          c.copy(COLOR_PTSD);
        } else if (t < 0.5) {
          const f = (t - 0.2) / 0.3;
          x = THREE.MathUtils.lerp(PTSD_X, 0, f) + p.xOffset * (1 - f);
          y = THREE.MathUtils.lerp(BRANCH_Y, CONVERGE_Y, f);
          z = p.zOffset * (1 - f * 0.5);
          c.lerpColors(COLOR_PTSD, COLOR_AMBER, f);
        } else if (t < 0.7) {
          const f = (t - 0.5) / 0.2;
          x = p.xOffset * 0.3;
          y = THREE.MathUtils.lerp(CONVERGE_Y, CASCADE_Y, f);
          z = p.zOffset * 0.3;
          c.lerpColors(COLOR_AMBER, COLOR_PURPLE, f);
        } else {
          const f = (t - 0.7) / 0.3;
          x = p.xOffset * 0.2;
          y = THREE.MathUtils.lerp(CASCADE_Y, CORRUPT_Y, f);
          z = p.zOffset * 0.2;
          c.lerpColors(COLOR_PURPLE, COLOR_RED, f);
        }
      } else {
        // Feedback: curves from corruption back up to sources
        const f = t;
        const feedbackX = 2.5;
        // Bezier curve: corruption -> right side -> back to top
        const cp1x = feedbackX;
        const cp1y = CORRUPT_Y;
        const cp2x = feedbackX;
        const cp2y = SRC_Y;
        // Simple quadratic bezier
        const u = 1 - f;
        x = u * u * 0 + 2 * u * f * feedbackX + f * f * (Math.random() > 0.5 ? COVID_X : PTSD_X);
        y = u * u * CORRUPT_Y + 2 * u * f * ((CORRUPT_Y + SRC_Y) / 2) + f * f * SRC_Y;
        z = p.zOffset + Math.sin(f * Math.PI) * 0.3;
        c.copy(COLOR_FEEDBACK);
        c.lerp(f > 0.7 ? COLOR_COVID : COLOR_FEEDBACK, f > 0.7 ? (f - 0.7) / 0.3 : 0);
      }

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.03 + Math.sin(state.clock.elapsedTime * 3 + i * 0.5) * 0.008);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      colorAttr[i * 3] = c.r;
      colorAttr[i * 3 + 1] = c.g;
      colorAttr[i * 3 + 2] = c.b;
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    const colBuf = meshRef.current.geometry.getAttribute('color');
    if (colBuf) (colBuf as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TOTAL]}>
      <sphereGeometry args={[1, 8, 8]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorAttr, 3]} />
      </sphereGeometry>
      <meshBasicMaterial vertexColors transparent opacity={0.8} />
    </instancedMesh>
  );
}

// --- Convergence zone pulsing torus ---
function ConvergenceZone() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    meshRef.current.scale.setScalar(s);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
  });

  return (
    <mesh ref={meshRef} position={[0, CONVERGE_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.5, 0.12, 12, 32]} />
      <meshBasicMaterial color={COLOR_AMBER} transparent opacity={0.15} side={THREE.DoubleSide} />
    </mesh>
  );
}

// --- HTML labels ---
function Labels() {
  return (
    <>
      {LABELS.map((label) => (
        <Html
          key={label.text}
          center
          position={[label.x, label.y, 0]}
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${label.color}40`,
            borderRadius: '8px',
            padding: '4px 12px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: label.color }}>
              {label.text}
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280' }}>
              {label.sub}
            </div>
          </div>
        </Html>
      ))}
    </>
  );
}

// --- Scene ---
function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 4, 3]} intensity={0.3} />

      <ParticleSystem />
      <ConvergenceZone />
      <Labels />
    </>
  );
}

// --- Static fallback ---
function StaticFallback() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '24px',
    }}>
      <div style={{ display: 'flex', gap: '48px' }}>
        {[LABELS[0], LABELS[1]].map((l) => (
          <div key={l.text} style={{
            border: `2px solid ${l.color}`,
            borderRadius: '12px',
            padding: '8px 16px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.8)',
          }}>
            <div style={{ fontWeight: 700, color: l.color, fontSize: '13px' }}>{l.text}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>{l.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ color: '#6b7280', fontSize: '20px' }}>&#8595; &#8595;</div>
      {LABELS.slice(2).map((l) => (
        <div key={l.text}>
          <div style={{
            border: `2px solid ${l.color}`,
            borderRadius: '12px',
            padding: '8px 16px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.8)',
          }}>
            <div style={{ fontWeight: 700, color: l.color, fontSize: '13px' }}>{l.text}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>{l.sub}</div>
          </div>
          {l.text !== 'Self-Model' && (
            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '16px', margin: '4px 0' }}>&#8595;</div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Exported component ---
export default function DualVectorDiagram() {
  const { ref, isVisible } = useScrollVisible(0.1);
  const reducedMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '500px',
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
          camera={{ position: [0, 0.5, 7], fov: 45 }}
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
