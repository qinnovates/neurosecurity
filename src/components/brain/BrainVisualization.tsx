import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { BrainView, BrainViewRegion } from '../../lib/brain-view-data';

interface Props {
  views: BrainView[];
  defaultView?: string;
}

/**
 * 3D hotspot positions mapped to QIF neural bands (N7-N1).
 * Positioned anatomically on the brain.glb model (scale 18).
 */
const REGION_HOTSPOTS: Record<string, [number, number, number]> = {
  N7: [0, 8, 10],
  N6: [0, 2, 5],
  N5: [0, 3, 8],
  N4: [0, 0, 0],
  N3: [0, -5, -10],
  N2: [0, -8, -4],
  N1: [0, -13, 0],
};

const HOTSPOT_SIZES: Record<string, number> = {
  N7: 3.0, N6: 2.2, N5: 1.8, N4: 1.8, N3: 2.2, N2: 1.8, N1: 1.5,
};

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
  region: BrainViewRegion;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

function Hotspot({ region, isActive, onHover, onClick }: HotspotProps) {
  const position = REGION_HOTSPOTS[region.id];
  const size = HOTSPOT_SIZES[region.id] ?? 2.0;
  if (!position) return null;

  const primaryColor = region.color;

  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

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

function BrainScene({ regions, activeRegion, onHover, onClick }: {
  regions: BrainViewRegion[];
  activeRegion: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-5, -5, 10]} intensity={0.4} color="#93c5fd" />
      <Suspense fallback={null}>
        <group ref={groupRef}>
          <BrainGhost />
          <BrainWireframe />
          {regions.map(region => (
            <Hotspot
              key={region.id}
              region={region}
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

const VIEW_ICONS: Record<string, JSX.Element> = {
  shield: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  heart: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  scale: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  ),
};

export default function BrainVisualization({ views, defaultView }: Props) {
  const [activeViewId, setActiveViewId] = useState(defaultView ?? views[0]?.id ?? 'security');
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const isSafari = useSafariDetect();
  const [dismissed, setDismissed] = useState(false);

  const activeView = views.find(v => v.id === activeViewId) ?? views[0];
  const activeRegionData = activeRegion
    ? activeView.regions.find(r => r.id === activeRegion)
    : null;

  // Reset selected region when switching views
  const handleViewChange = (viewId: string) => {
    setActiveViewId(viewId);
    setActiveRegion(null);
  };

  return (
    <div className="relative">
      {/* Safari warning */}
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

      {/* View toggle */}
      <div className="flex items-center justify-center gap-1 mb-5">
        {views.map(view => {
          const isActive = view.id === activeViewId;
          return (
            <button
              key={view.id}
              onClick={() => handleViewChange(view.id)}
              className="relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all"
              style={{
                background: isActive ? `${view.accentColor}15` : 'transparent',
                color: isActive ? view.accentColor : 'var(--color-text-faint)',
                border: `1px solid ${isActive ? `${view.accentColor}30` : 'transparent'}`,
              }}
            >
              {VIEW_ICONS[view.icon]}
              {view.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: view.accentColor }}
                />
              )}
            </button>
          );
        })}
      </div>

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
              regions={activeView.regions}
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
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                {activeRegionData.description}
              </p>

              {/* Primary stat */}
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-faint)' }}>
                <span
                  className="text-base font-bold mr-1"
                  style={{ color: activeView.accentColor, fontFamily: 'var(--font-heading)' }}
                >
                  {activeRegionData.stat.value}
                </span>
                {activeRegionData.stat.label}
              </p>

              {/* Badges */}
              {activeRegionData.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {activeRegionData.badges.map((badge, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: `${badge.color}15`,
                        color: badge.color,
                        border: `1px solid ${badge.color}30`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: badge.color }}
                      />
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Details list */}
              {activeRegionData.details.length > 0 && (
                <div className="space-y-1">
                  {activeRegionData.details.map(detail => (
                    <a
                      key={detail.id}
                      href={detail.href}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: detail.color }}
                      />
                      <span className="truncate">{detail.label}</span>
                      <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--color-text-faint)' }}>
                        {detail.id}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {activeViewId === 'security' && 'Click or hover over a glowing region to see the attack techniques targeting it and their severity.'}
                {activeViewId === 'clinical' && 'Click or hover over a glowing region to see the therapeutic techniques that interact with it.'}
                {activeViewId === 'governance' && 'Click or hover over a glowing region to see which neurorights protect it and how many attack techniques target it.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
