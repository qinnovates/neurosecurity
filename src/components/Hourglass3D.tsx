import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface BandData {
  id: string;
  name: string;
  domain: string;
  color: string;
  description: string;
}

const BANDS: BandData[] = [
  { id: 'N7', name: 'Neocortex', domain: 'Neural', color: '#22c55e', description: 'PFC, M1, V1, Broca, Wernicke — executive function, language, movement, perception' },
  { id: 'N6', name: 'Limbic System', domain: 'Neural', color: '#4ade80', description: 'Hippocampus, amygdala, insula — emotion, memory, interoception' },
  { id: 'N5', name: 'Basal Ganglia', domain: 'Neural', color: '#86efac', description: 'Striatum, STN, substantia nigra — motor selection, reward, habit' },
  { id: 'N4', name: 'Diencephalon', domain: 'Neural', color: '#a3e635', description: 'Thalamus, hypothalamus — sensory gating, consciousness relay' },
  { id: 'N3', name: 'Cerebellum', domain: 'Neural', color: '#bef264', description: 'Cerebellar cortex, deep nuclei — motor coordination, timing' },
  { id: 'N2', name: 'Brainstem', domain: 'Neural', color: '#d9f99d', description: 'Medulla, pons, midbrain — vital functions, arousal, reflexes' },
  { id: 'N1', name: 'Spinal Cord', domain: 'Neural', color: '#ecfccb', description: 'Cervical through sacral — reflexes, peripheral relay' },
  { id: 'I0', name: 'Neural Interface', domain: 'Interface', color: '#f59e0b', description: 'Electrode-tissue boundary — measurement/collapse, quasi-quantum zone' },
  { id: 'S1', name: 'Analog / Near-Field', domain: 'Silicon', color: '#93c5fd', description: 'Amplification, ADC, near-field EM (0-10 kHz)' },
  { id: 'S2', name: 'Digital / Telemetry', domain: 'Silicon', color: '#60a5fa', description: 'Decoding, BLE/WiFi, telemetry (10 kHz - 1 GHz)' },
  { id: 'S3', name: 'Radio / Wireless / DE', domain: 'Silicon', color: '#3b82f6', description: 'RF, directed energy, application layer (1 GHz+)' },
];

const BAND_RADII = [1.4, 1.3, 1.15, 1.0, 0.85, 0.7, 0.55, 0.45, 0.7, 0.9, 1.2];
const BAND_HEIGHT = 0.35;
const GAP = 0.08;

function HourglassBand({
  band,
  index,
  radius,
  isHovered,
  onHover,
}: {
  band: BandData;
  index: number;
  radius: number;
  isHovered: boolean;
  onHover: (idx: number | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const totalHeight = BANDS.length * (BAND_HEIGHT + GAP) - GAP;
  const y = (totalHeight / 2) - index * (BAND_HEIGHT + GAP) - BAND_HEIGHT / 2;

  const color = useMemo(() => new THREE.Color(band.color), [band.color]);

  useFrame(() => {
    if (!meshRef.current) return;
    const scale = isHovered ? 1.05 : 1.0;
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.1);
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, scale, 0.1);
  });

  return (
    <group position={[0, y, 0]}>
      <mesh
        ref={meshRef}
        onPointerEnter={() => onHover(index)}
        onPointerLeave={() => onHover(null)}
      >
        <cylinderGeometry args={[radius, radius, BAND_HEIGHT, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.5 : 0.25}
          roughness={0.3}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Edge glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, BAND_HEIGHT / 2, 0]}>
        <ringGeometry args={[radius - 0.02, radius, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.8 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Label */}
      <Text
        position={[radius + 0.3, 0, 0]}
        fontSize={0.12}
        color={isHovered ? '#e2e8f0' : '#94a3b8'}
        anchorX="left"
        anchorY="middle"
        font="/fonts/Inter-Variable.woff2"
      >
        {band.id} — {band.name}
      </Text>
    </group>
  );
}

function Scene({ onBandHover }: { onBandHover: (idx: number | null) => void }) {
  const [hoveredBand, setHoveredBand] = useState<number | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && hoveredBand === null) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const handleHover = (idx: number | null) => {
    setHoveredBand(idx);
    onBandHover(idx);
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.6} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#8b5cf6" />

      <group ref={groupRef}>
        {BANDS.map((band, i) => (
          <HourglassBand
            key={band.id}
            band={band}
            index={i}
            radius={BAND_RADII[i]}
            isHovered={hoveredBand === i}
            onHover={handleHover}
          />
        ))}
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 3 / 4}
        autoRotate={false}
      />
    </>
  );
}

export default function Hourglass3D() {
  const [hoveredBand, setHoveredBand] = useState<number | null>(null);
  const band = hoveredBand !== null ? BANDS[hoveredBand] : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <Canvas
        camera={{ position: [0, 0.5, 4], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene onBandHover={setHoveredBand} />
      </Canvas>

      {/* Info panel */}
      {band && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 20, 32, 0.85)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${band.color}40`,
            borderRadius: '12px',
            padding: '12px 20px',
            maxWidth: '400px',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: band.color, marginBottom: '4px' }}>
            {band.id} — {band.domain}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
            {band.name}
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            {band.description}
          </div>
        </div>
      )}
    </div>
  );
}
