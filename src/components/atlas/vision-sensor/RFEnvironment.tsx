/**
 * RFEnvironment — Three.js room with simulated WiFi/BLE wave propagation.
 *
 * Shows:
 * - Room geometry (walls, floor, furniture silhouettes)
 * - WiFi router emitting expanding wavefronts
 * - BLE beacons with RSSI distance rings
 * - CSI heatmap on floor plane
 * - Human silhouette inferred from RF-Pose (Katabi/MIT CSAIL)
 *
 * Physics source: DensePose from WiFi (CMU, arXiv 2301.00250)
 * WiFi 5GHz: ~6cm resolution floor, body pose via ML inference
 * BLE 5.1 AoA: ~0.5m positioning accuracy
 *
 * DISCLAIMER: This is a simulated visualization. Consumer WiFi chipsets
 * do not expose CSI data. Real RF sensing requires specialized hardware.
 */

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// --- WiFi Wavefront Ring ---

function WavefrontRing({ position, color, speed }: {
  position: [number, number, number];
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !materialRef.current) return;
    const t = (clock.getElapsedTime() * speed) % 4;
    const scale = 0.5 + t * 1.5;
    ref.current.scale.set(scale, scale, scale);
    materialRef.current.opacity = Math.max(0, 0.4 - t * 0.1);
  });

  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.95, 1, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// --- Multiple Wavefront Pulses ---

function WavefrontPulses({ position, count, color }: {
  position: [number, number, number];
  count: number;
  color: string;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <WavefrontRing
          key={i}
          position={position}
          color={color}
          speed={0.3 + i * 0.15}
        />
      ))}
    </>
  );
}

// --- BLE Beacon ---

function BleBeacon({ position, label }: {
  position: [number, number, number];
  label: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current || !matRef.current) return;
    const pulse = 0.5 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
    ringRef.current.scale.set(pulse, pulse, pulse);
    matRef.current.opacity = 0.2 + Math.sin(clock.getElapsedTime() * 3) * 0.1;
  });

  return (
    <group position={position}>
      {/* Beacon body */}
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 8]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} />
      </mesh>
      {/* RSSI distance ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[0.4, 0.45, 32]} />
        <meshBasicMaterial ref={matRef} color="#22d3ee" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// --- Human Silhouette (RF-Pose inference) ---

function HumanSilhouette({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Subtle sway
    groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#60a5fa" wireframe opacity={0.6} transparent />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.35, 0.6, 0.2]} />
        <meshStandardMaterial color="#60a5fa" wireframe opacity={0.4} transparent />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.1, 0.5, 0]}>
        <boxGeometry args={[0.12, 0.7, 0.12]} />
        <meshStandardMaterial color="#60a5fa" wireframe opacity={0.3} transparent />
      </mesh>
      <mesh position={[0.1, 0.5, 0]}>
        <boxGeometry args={[0.12, 0.7, 0.12]} />
        <meshStandardMaterial color="#60a5fa" wireframe opacity={0.3} transparent />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.25, 1.2, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color="#60a5fa" wireframe opacity={0.3} transparent />
      </mesh>
      <mesh position={[0.25, 1.2, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color="#60a5fa" wireframe opacity={0.3} transparent />
      </mesh>
      {/* DensePose label */}
      <mesh position={[0, 1.85, 0]}>
        <planeGeometry args={[0.6, 0.12]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// --- Floor Heatmap (CSI signal strength) ---

function FloorHeatmap() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    const routerX = size * 0.7;
    const routerZ = size * 0.3;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - routerX;
        const dz = y - routerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const strength = Math.max(0, 1 - dist / (size * 0.8));
        const idx = (y * size + x) * 4;

        // Blue to cyan to green gradient based on signal strength
        data[idx] = strength > 0.6 ? 0 : Math.floor(60 * (1 - strength));
        data[idx + 1] = Math.floor(strength * 180);
        data[idx + 2] = Math.floor(strength * 255);
        data[idx + 3] = Math.floor(strength * 80);
      }
    }

    const tex = new THREE.DataTexture(data, size, size);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <planeGeometry args={[6, 6]} />
      <meshBasicMaterial map={texture} transparent opacity={0.5} />
    </mesh>
  );
}

// --- Room ---

function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Walls (3 sides, open front) */}
      {/* Back wall */}
      <mesh position={[0, 1.5, -3]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#16213e" side={THREE.DoubleSide} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-3, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#0f3460" side={THREE.DoubleSide} opacity={0.6} transparent />
      </mesh>
      {/* Right wall */}
      <mesh position={[3, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#0f3460" side={THREE.DoubleSide} opacity={0.6} transparent />
      </mesh>

      {/* Furniture silhouettes */}
      {/* Table */}
      <mesh position={[1.5, 0.4, -1]}>
        <boxGeometry args={[1, 0.05, 0.6]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[1.5, 0.2, -1]}>
        <boxGeometry args={[0.05, 0.4, 0.05]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      {/* Chair */}
      <mesh position={[-1, 0.25, 0.5]}>
        <boxGeometry args={[0.4, 0.5, 0.4]} />
        <meshStandardMaterial color="#2d3748" wireframe opacity={0.5} transparent />
      </mesh>

      {/* WiFi Router */}
      <mesh position={[2, 2.2, -2.8]}>
        <boxGeometry args={[0.2, 0.05, 0.15]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
      </mesh>
      {/* Router antenna */}
      <mesh position={[2.06, 2.35, -2.8]}>
        <cylinderGeometry args={[0.008, 0.008, 0.25, 6]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}

// --- Main Scene ---

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 2.8, 0]} intensity={0.5} color="#e2e8f0" />
      <pointLight position={[2, 2.2, -2.8]} intensity={0.3} color="#22c55e" />

      <Room />
      <FloorHeatmap />

      {/* WiFi wavefronts from router */}
      <WavefrontPulses position={[2, 1.5, -2.8]} count={5} color="#22c55e" />

      {/* BLE beacons */}
      <BleBeacon position={[-2.5, 0.1, -2.5]} label="BLE-1" />
      <BleBeacon position={[2.5, 0.1, 2]} label="BLE-2" />
      <BleBeacon position={[-2, 0.1, 1.5]} label="BLE-3" />

      {/* Human silhouette (RF-Pose inferred) */}
      <HumanSilhouette position={[0, 0, 0.5]} />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        target={[0, 1, 0]}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function RFEnvironment({ width, height }: { width: number; height: number }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      border: '1px solid rgba(100, 140, 200, 0.2)',
      position: 'relative',
    }}>
      <Canvas
        camera={{ position: [4, 3, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0e1a' }}
      >
        <Scene />
      </Canvas>

      {/* Overlay labels */}
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        color: 'rgba(140,180,255,0.7)',
        fontSize: 11,
        fontFamily: 'monospace',
        lineHeight: 1.6,
        pointerEvents: 'none',
      }}>
        <div><span style={{ color: '#22c55e' }}>&#9679;</span> WiFi 5GHz Router (CSI source)</div>
        <div><span style={{ color: '#22d3ee' }}>&#9679;</span> BLE 5.1 Beacons (AoA positioning)</div>
        <div><span style={{ color: '#60a5fa' }}>&#9679;</span> RF-Pose Silhouette (ML inference)</div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        color: 'rgba(255,180,100,0.5)',
        fontSize: 9,
        fontFamily: 'system-ui',
        pointerEvents: 'none',
      }}>
        SIMULATED — Not real RF data
      </div>
    </div>
  );
}
