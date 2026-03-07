import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Dog point cloud shape (Kinect depth-map aesthetic) ---
function generateDogPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const section = Math.random();

    if (section < 0.35) {
      // Body (ellipsoid)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random());
      positions[i3] = r * Math.sin(phi) * Math.cos(theta) * 1.4;
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7 - 0.2;
      positions[i3 + 2] = r * Math.cos(phi) * 0.8;
    } else if (section < 0.55) {
      // Head (sphere, offset forward)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * 0.55;
      positions[i3] = r * Math.sin(phi) * Math.cos(theta) + 1.6;
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 0.35;
      positions[i3 + 2] = r * Math.cos(phi) * 0.5;
    } else if (section < 0.65) {
      // Snout
      const theta = Math.random() * Math.PI * 2;
      const r = Math.cbrt(Math.random()) * 0.25;
      positions[i3] = 2.05 + Math.random() * 0.3;
      positions[i3 + 1] = r * Math.sin(theta) * 0.2 + 0.2;
      positions[i3 + 2] = r * Math.cos(theta) * 0.2;
    } else if (section < 0.75) {
      // Ears (two triangular clusters)
      const ear = Math.random() > 0.5 ? 1 : -1;
      positions[i3] = 1.4 + Math.random() * 0.3;
      positions[i3 + 1] = 0.7 + Math.random() * 0.45;
      positions[i3 + 2] = ear * (0.25 + Math.random() * 0.2);
    } else if (section < 0.85) {
      // Legs (4 cylinders)
      const leg = Math.floor(Math.random() * 4);
      const legX = leg < 2 ? -0.7 : 0.7;
      const legZ = leg % 2 === 0 ? -0.35 : 0.35;
      positions[i3] = legX + (Math.random() - 0.5) * 0.2;
      positions[i3 + 1] = -0.9 - Math.random() * 0.7;
      positions[i3 + 2] = legZ + (Math.random() - 0.5) * 0.15;
    } else if (section < 0.92) {
      // Tail (curved upward)
      const t = Math.random();
      positions[i3] = -1.4 - t * 0.6;
      positions[i3 + 1] = -0.1 + t * 0.8 + (Math.random() - 0.5) * 0.1;
      positions[i3 + 2] = (Math.random() - 0.5) * 0.1;
    } else {
      // Harness (seeing eye dog vest — band around body)
      const theta = Math.random() * Math.PI * 2;
      const r = 0.72 + Math.random() * 0.06;
      positions[i3] = 0.6 + (Math.random() - 0.5) * 0.3;
      positions[i3 + 1] = r * Math.sin(theta) * 0.6 - 0.2;
      positions[i3 + 2] = r * Math.cos(theta) * 0.7;
    }
  }
  return positions;
}

// --- Face point cloud (AI OCR reconstructed face) ---
function generateFacePoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const section = Math.random();

    if (section < 0.5) {
      // Head oval
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random());
      positions[i3] = r * Math.sin(phi) * Math.cos(theta) * 0.7;
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.95;
      positions[i3 + 2] = r * Math.cos(phi) * 0.65;
    } else if (section < 0.6) {
      // Eyes (two small clusters)
      const eye = Math.random() > 0.5 ? 1 : -1;
      const r = Math.cbrt(Math.random()) * 0.12;
      const theta = Math.random() * Math.PI * 2;
      positions[i3] = eye * 0.25 + r * Math.cos(theta) * 0.5;
      positions[i3 + 1] = 0.15 + r * Math.sin(theta) * 0.3;
      positions[i3 + 2] = 0.55 + Math.random() * 0.1;
    } else if (section < 0.7) {
      // Nose
      const r = Math.cbrt(Math.random()) * 0.1;
      const theta = Math.random() * Math.PI * 2;
      positions[i3] = r * Math.cos(theta) * 0.3;
      positions[i3 + 1] = -0.15 + r * Math.sin(theta) * 0.2;
      positions[i3 + 2] = 0.6 + Math.random() * 0.08;
    } else if (section < 0.8) {
      // Mouth
      const t = Math.random() * Math.PI;
      positions[i3] = Math.cos(t) * 0.25;
      positions[i3 + 1] = -0.4 + Math.sin(t) * 0.05;
      positions[i3 + 2] = 0.5 + Math.random() * 0.08;
    } else {
      // Jaw/chin contour
      const t = Math.random() * Math.PI;
      const r = 0.65 + Math.random() * 0.05;
      positions[i3] = Math.cos(t) * r * 0.7;
      positions[i3 + 1] = -0.7 + Math.sin(t) * 0.3;
      positions[i3 + 2] = Math.random() * 0.3;
    }
  }
  return positions;
}

// --- Kinect-style depth color (blue→cyan→green based on Z-depth) ---
function generateDepthColors(positions: Float32Array, count: number, hueShift: number = 0): Float32Array {
  const colors = new Float32Array(count * 3);
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < count; i++) {
    const z = positions[i * 3 + 2];
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const range = maxZ - minZ || 1;
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const z = positions[i * 3 + 2];
    const t = (z - minZ) / range;
    // Kinect depth palette: deep blue → cyan → green → yellow
    const hue = (0.55 + hueShift - t * 0.25) % 1;
    color.setHSL(hue, 0.9, 0.45 + t * 0.25);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  return colors;
}

// --- Animated point cloud ---
function PointCloud({ positions, colors, size = 0.03, rotationSpeed = 0.15 }: {
  positions: Float32Array;
  colors: Float32Array;
  size?: number;
  rotationSpeed?: number;
}) {
  const ref = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// --- Scanning line effect ---
function ScanLine() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 1.5;
    }
  });
  return (
    <mesh ref={ref} rotation={[0, 0, 0]}>
      <planeGeometry args={[6, 0.015]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.3} />
    </mesh>
  );
}

// --- Grid floor (depth sensor grid) ---
function DepthGrid() {
  return (
    <gridHelper
      args={[8, 20, '#0a3d2a', '#0a3d2a']}
      position={[0, -1.8, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// --- Scene switching between dog and face ---
function Scene({ mode }: { mode: 'dog' | 'face' }) {
  const dogData = useMemo(() => {
    const pos = generateDogPoints(6000);
    const col = generateDepthColors(pos, 6000, 0);
    return { positions: pos, colors: col };
  }, []);

  const faceData = useMemo(() => {
    const pos = generateFacePoints(5000);
    const col = generateDepthColors(pos, 5000, 0.3);
    return { positions: pos, colors: col };
  }, []);

  const data = mode === 'dog' ? dogData : faceData;

  return (
    <>
      <PointCloud
        positions={data.positions}
        colors={data.colors}
        size={mode === 'face' ? 0.025 : 0.03}
        rotationSpeed={0.12}
      />
      <ScanLine />
      <DepthGrid />
    </>
  );
}

// --- Main component ---
export default function KinectVision() {
  const [mode, setMode] = useState<'dog' | 'face'>('dog');
  const [scanText, setScanText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const labels = useMemo(() => ({
    dog: {
      title: 'DEPTH SENSOR: SEEING EYE DOG',
      subtitle: 'For the blind — neural vision prosthetic',
      detail: 'Object recognition via BCI visual cortex stimulation',
      scan: ['SCANNING DEPTH FIELD...', 'OBJECT: Canis lupus familiaris', 'CLASS: Guide dog (harnessed)', 'CONFIDENCE: 0.97', 'RENDERING TO VISUAL CORTEX...'],
    },
    face: {
      title: 'AI OCR: REAL-TIME FACE RECONSTRUCTION',
      subtitle: 'Neural rendering pipeline for BCI patients',
      detail: 'Facial feature extraction + depth-mapped cortical encoding',
      scan: ['AI OCR ACTIVE...', 'FACE DETECTED', 'LANDMARKS: 68 points mapped', 'EXPRESSION: Neutral', 'ENCODING TO NEURAL STREAM...'],
    },
  }), []);

  const cycleText = useCallback((lines: string[]) => {
    let idx = 0;
    setScanText(lines[0]);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % lines.length;
      setScanText(lines[idx]);
    }, 1800);
  }, []);

  useEffect(() => {
    cycleText(labels[mode].scan);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [mode, labels, cycleText]);

  const current = labels[mode];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{
      background: '#050a08',
      border: '1px solid rgba(0,255,136,0.15)',
      height: '480px',
    }}>
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0.5, 4.5], fov: 45 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene mode={mode} />
      </Canvas>

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {/* Top-left: Title + subtitle */}
        <div className="absolute top-4 left-4">
          <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: '#00ff88' }}>
            {current.title}
          </p>
          <p className="text-[11px]" style={{ color: '#00cc6a', opacity: 0.8 }}>
            {current.subtitle}
          </p>
        </div>

        {/* Top-right: Mode indicator */}
        <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
          <button
            onClick={() => setMode('dog')}
            className="px-3 py-1 rounded text-[10px] tracking-wider uppercase transition-all"
            style={{
              background: mode === 'dog' ? 'rgba(0,255,136,0.15)' : 'transparent',
              border: `1px solid ${mode === 'dog' ? 'rgba(0,255,136,0.4)' : 'rgba(0,255,136,0.1)'}`,
              color: mode === 'dog' ? '#00ff88' : '#00ff8855',
            }}
          >
            Guide Dog
          </button>
          <button
            onClick={() => setMode('face')}
            className="px-3 py-1 rounded text-[10px] tracking-wider uppercase transition-all"
            style={{
              background: mode === 'face' ? 'rgba(0,255,136,0.15)' : 'transparent',
              border: `1px solid ${mode === 'face' ? 'rgba(0,255,136,0.4)' : 'rgba(0,255,136,0.1)'}`,
              color: mode === 'face' ? '#00ff88' : '#00ff8855',
            }}
          >
            AI OCR Face
          </button>
        </div>

        {/* Bottom-left: Scan output */}
        <div className="absolute bottom-4 left-4">
          <p className="text-[10px] mb-1" style={{ color: '#00ff88', opacity: 0.5 }}>
            {'>'} {scanText}<span className="animate-pulse">_</span>
          </p>
          <p className="text-[9px]" style={{ color: '#00cc6a', opacity: 0.4 }}>
            {current.detail}
          </p>
        </div>

        {/* Bottom-right: Pipeline label */}
        <div className="absolute bottom-4 right-4 text-right">
          <p className="text-[9px] tracking-[0.15em] uppercase" style={{ color: '#00ff88', opacity: 0.3 }}>
            Runemate Neural Compiler
          </p>
          <p className="text-[8px]" style={{ color: '#00cc6a', opacity: 0.2 }}>
            Proposed BCI rendering pipeline
          </p>
        </div>

        {/* Crosshair center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 relative">
            <div className="absolute top-0 left-1/2 w-px h-2 -translate-x-1/2" style={{ background: '#00ff8833' }} />
            <div className="absolute bottom-0 left-1/2 w-px h-2 -translate-x-1/2" style={{ background: '#00ff8833' }} />
            <div className="absolute top-1/2 left-0 w-2 h-px -translate-y-1/2" style={{ background: '#00ff8833' }} />
            <div className="absolute top-1/2 right-0 w-2 h-px -translate-y-1/2" style={{ background: '#00ff8833' }} />
          </div>
        </div>

        {/* Corner brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l" style={{ borderColor: '#00ff8822' }} />
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r" style={{ borderColor: '#00ff8822' }} />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l" style={{ borderColor: '#00ff8822' }} />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r" style={{ borderColor: '#00ff8822' }} />
      </div>
    </div>
  );
}
