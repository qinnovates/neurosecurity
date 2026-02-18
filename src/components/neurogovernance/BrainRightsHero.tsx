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
const REGION_HOTSPOTS: Record<string, [number, number, number]> = {
  prefrontal: [0, 4, 14],        // front-top of frontal lobe
  frontal:    [0, 8, 8],         // top-front, motor strip area
  temporal:   [-12, -2, 5],      // side of brain, above ear
  limbic:     [0, -1, 3],        // deep center, hippocampus/amygdala
  motor:      [0, 10, 2],        // top of brain, central sulcus
  occipital:  [0, 2, -12],       // back of brain
  cerebellum: [0, -7, -10],      // lower back
  brainstem:  [0, -10, -3],      // bottom center
};

const HOTSPOT_SIZES: Record<string, number> = {
  prefrontal: 2.5,
  frontal: 2.5,
  temporal: 2.5,
  limbic: 1.8,
  motor: 2.2,
  occipital: 2.2,
  cerebellum: 2.2,
  brainstem: 1.5,
};

function BrainModel() {
  const { scene } = useGLTF('/models/brain.glb');
  const clonedScene = useRef<THREE.Group | null>(null);

  useEffect(() => {
    // Override all materials to create a digital/holographic look
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshPhongMaterial({
          color: new THREE.Color('#2563eb'),
          emissive: new THREE.Color('#3b82f6'),
          emissiveIntensity: 0.08,
          transparent: true,
          opacity: 0.55,
          wireframe: false,
          shininess: 100,
          specular: new THREE.Color('#93c5fd'),
          side: THREE.DoubleSide,
        });
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={18} />;
}

/** Wireframe overlay for digital aesthetic */
function BrainWireframe() {
  const { scene } = useGLTF('/models/brain.glb');
  const wireframeScene = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#3b82f6'),
          wireframe: true,
          transparent: true,
          opacity: 0.15,
        });
      }
    });
    wireframeScene.current = cloned;
  }, [scene]);

  if (!wireframeScene.current) return null;
  return <primitive object={wireframeScene.current} scale={18} />;
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
  const primaryColor = regionRights.length > 0 ? regionRights[0].color : '#94a3b8';

  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Pulse animation for active hotspot
  useFrame((state) => {
    if (ref.current) {
      const scale = isActive
        ? 1.0 + Math.sin(state.clock.elapsedTime * 3) * 0.2
        : 1.0 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      ref.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
      const ringScale = isActive
        ? 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1
        : 1.0;
      ringRef.current.scale.setScalar(ringScale);
    }
  });

  return (
    <group position={position}>
      {/* Core sphere */}
      <mesh
        ref={ref}
        onPointerOver={(e) => { e.stopPropagation(); onHover(region.id); }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onClick(region.id); }}
      >
        <sphereGeometry args={[size * 0.5, 16, 16]} />
        <meshStandardMaterial
          color={primaryColor}
          transparent
          opacity={isActive ? 0.6 : 0.3}
          emissive={primaryColor}
          emissiveIntensity={isActive ? 0.6 : 0.2}
        />
      </mesh>
      {/* Outer ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[size * 0.6, size * 0.7, 32]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={isActive ? 0.4 : 0.1}
          side={THREE.DoubleSide}
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
          <BrainModel />
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

export default function BrainRightsHero({ neurorights, brainRegions, totalThreats }: Props) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  const activeRegionData = activeRegion ? brainRegions.find(r => r.id === activeRegion) : null;
  const activeRights = activeRegionData
    ? neurorights.filter(nr => activeRegionData.neurorights.includes(nr.id))
    : [];

  return (
    <div className="relative">
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
