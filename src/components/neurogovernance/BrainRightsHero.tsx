import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { NeurorightInfo, BrainRegion } from '../../lib/neurogovernance-data';

interface Props {
  neurorights: NeurorightInfo[];
  brainRegions: BrainRegion[];
  totalThreats: number;
}

/**
 * 3D hotspot positions mapped to the brain.glb model coordinate space.
 * Brain model is scaled 18x. Positions tuned to sit ON the brain surface.
 * Coordinates are in the rotating group's local space (they rotate with the brain).
 */
/**
 * 3D hotspot positions mapped to QIF neural bands (N7–N1).
 * Positioned anatomically on the brain.glb model (scale 18).
 */
const REGION_HOTSPOTS: Record<string, [number, number, number]> = {
  N7: [0, 8, 10],         // Neocortex — top/front (PFC, motor cortex)
  N6: [0, 2, 5],          // Limbic System — deep center, slightly anterior (hippocampus, amygdala)
  N5: [0, 3, 8],          // Basal Ganglia — deep center, anterior to thalamus (bilateral, midline)
  N4: [0, 0, 0],          // Diencephalon — geometric center (thalamus, hypothalamus)
  N3: [0, -5, -10],       // Cerebellum — lower posterior
  N2: [0, -8, -4],        // Brainstem — below cerebellum, slightly anterior
  N1: [0, -13, 0],        // Spinal Cord — lowest, below brainstem
};

const HOTSPOT_SIZES: Record<string, number> = {
  N7: 3.0,
  N6: 2.2,
  N5: 1.8,
  N4: 1.8,
  N3: 2.2,
  N2: 1.8,
  N1: 1.5,
};

/** Primary wireframe brain — the main visible layer */
function BrainWireframe() {
  const { scene } = useGLTF('/models/brain.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#3b82f6'),
          wireframe: true,
          transparent: true,
          opacity: 0.35,
        });
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={18} />;
}

/** Faint solid fill underneath wireframe for depth */
function BrainGhost() {
  const { scene } = useGLTF('/models/brain.glb');
  const ghostScene = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#dbeafe'),
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
        });
      }
    });
    ghostScene.current = cloned;
  }, [scene]);

  if (!ghostScene.current) return null;
  return <primitive object={ghostScene.current} scale={18} />;
}

interface HotspotProps {
  region: BrainRegion;
  neurorights: NeurorightInfo[];
  isActive: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

function Hotspot({ region, neurorights: rights, isActive, onHover, onClick }: HotspotProps) {
  const position = REGION_HOTSPOTS[region.id];
  const size = HOTSPOT_SIZES[region.id] ?? 2.0;
  if (!position) return null;

  const regionRights = rights.filter(nr => region.neurorights.includes(nr.id));

  // Color by severity: purple = highest, orange = medium, yellow = low
  const threats = region.threatCount;
  const primaryColor =
    threats >= 60 ? '#7c3aed'   // purple — highest severity
    : threats >= 40 ? '#a855f7' // violet — high severity
    : threats >= 20 ? '#f97316' // orange — medium severity
    : '#eab308';                // yellow — low severity

  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const glowRef = useRef<THREE.Mesh>(null);

  // Continuous pulse animation so hotspots always glow
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      const scale = isActive
        ? 1.0 + Math.sin(t * 3) * 0.25
        : 1.0 + Math.sin(t * 2 + position[0]) * 0.1;
      ref.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      const glowScale = isActive
        ? 1.3 + Math.sin(t * 2.5) * 0.15
        : 1.0 + Math.sin(t * 1.5 + position[1]) * 0.08;
      glowRef.current.scale.setScalar(glowScale);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        isActive ? 0.25 + Math.sin(t * 3) * 0.1 : 0.12 + Math.sin(t * 2 + position[0]) * 0.05;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      const ringScale = isActive
        ? 1.3 + Math.sin(t * 2) * 0.15
        : 1.0 + Math.sin(t * 1.5 + position[2]) * 0.06;
      ringRef.current.scale.setScalar(ringScale);
    }
  });

  return (
    <group position={position} renderOrder={10}>
      {/* Outer glow sphere — always visible on top */}
      <mesh ref={glowRef} renderOrder={10}>
        <sphereGeometry args={[size * 1.0, 16, 16]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={0.12}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Core sphere — clickable, always on top */}
      <mesh
        ref={ref}
        renderOrder={11}
        onPointerOver={(e) => { e.stopPropagation(); onHover(region.id); }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onClick(region.id); }}
      >
        <sphereGeometry args={[size * 0.5, 16, 16]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={isActive ? 0.85 : 0.55}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Spinning ring — always on top */}
      <mesh ref={ringRef} renderOrder={10}>
        <ringGeometry args={[size * 0.65, size * 0.75, 32]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={isActive ? 0.5 : 0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

function BrainScene({ brainRegions, neurorights, activeRegion, onHover, onClick }: {
  brainRegions: BrainRegion[];
  neurorights: NeurorightInfo[];
  activeRegion: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // No auto-rotation — user drags to rotate via OrbitControls

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-5, -5, 10]} intensity={0.4} color="#93c5fd" />
      <Suspense fallback={null}>
        <group ref={groupRef}>
          <BrainGhost />
          <BrainWireframe />
          {brainRegions.map(region => (
            <Hotspot
              key={region.id}
              region={region}
              neurorights={neurorights}
              isActive={activeRegion === region.id}
              onHover={onHover}
              onClick={onClick}
            />
          ))}
        </group>
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={30}
        maxDistance={80}
        target={[0, 0, 0]}
      />
    </>
  );
}

function useSafariDetect() {
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setIsSafari(/Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua));
  }, []);
  return isSafari;
}

export default function BrainRightsHero({ neurorights, brainRegions, totalThreats }: Props) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const isSafari = useSafariDetect();
  const [dismissed, setDismissed] = useState(false);

  const activeRegionData = activeRegion ? brainRegions.find(r => r.id === activeRegion) : null;
  const activeRights = activeRegionData
    ? neurorights.filter(nr => activeRegionData.neurorights.includes(nr.id))
    : [];

  return (
    <div className="relative">
      {isSafari && !dismissed && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 mb-4 rounded-lg text-xs"
          style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: 'var(--color-text-muted)' }}
        >
          <span>
            This 3D visualization works best in <strong style={{ color: 'var(--color-text-primary)' }}>Chrome</strong> or <strong style={{ color: 'var(--color-text-primary)' }}>Firefox</strong>. Safari may have limited WebGL support.
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
        {/* 3D Brain Canvas */}
        <div
          className="w-full lg:w-[55%] flex-shrink-0"
          style={{ height: '420px', cursor: 'grab' }}
        >
          <Canvas
            camera={{ position: [0, 5, 50], fov: 50 }}
            gl={{ alpha: true, antialias: true }}
          >
            <BrainScene
              brainRegions={brainRegions}
              neurorights={neurorights}
              activeRegion={activeRegion}
              onHover={setActiveRegion}
              onClick={(id) => setActiveRegion(prev => prev === id ? null : id)}
            />
          </Canvas>
          <p
            className="text-center mt-1 text-[10px]"
            style={{ color: 'var(--color-text-faint)' }}
          >
            Drag to rotate. Click a region to learn more.
          </p>
        </div>

        {/* Info panel */}
        <div className="flex-1 min-w-0">
          {activeRegionData ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <p
                className="text-xs font-medium tracking-widest uppercase mb-2"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Brain Region
              </p>
              <h3
                className="text-xl font-bold mb-1"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
              >
                {activeRegionData.name}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                {activeRegionData.description}
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-faint)' }}>
                {activeRegionData.threatCount} techniques target this region
              </p>
              <div className="flex flex-wrap gap-2">
                {activeRights.map(nr => (
                  <span
                    key={nr.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: `${nr.color}15`,
                      color: nr.color,
                      border: `1px solid ${nr.color}30`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: nr.color }}
                    />
                    {nr.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Click or hover over a glowing region on the brain to see which neurorights protect it and how many attack techniques target it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
