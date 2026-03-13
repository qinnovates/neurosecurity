/**
 * NeuroSIM — Interactive 3D neuron simulation visualization.
 *
 * Three.js (react-three-fiber) with brain.glb model for immersive 3D
 * from brain networks down to molecular machinery.
 * All parameters from published neuroscience literature (see qif-neurosim.json).
 */

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useWebGLSupport, WebGLFallback } from '../WebGLCheck';
import SWCNeuron from './SWCNeuron';
import PDBMolecule from './PDBMolecule';

// ═══ Types ═══

interface NeuronType {
  id: string;
  name: string;
  category: string;
  neurotransmitter: string;
  regions: string[];
  proportion: number;
  morphology: {
    somaSize_um: number;
    somaShape: string;
    apicalDendrite: { length_um: number; branches: number; diameter_um: number } | null;
    basalDendrites: { count: number; length_um: number; branches: number; diameter_um: number } | null;
    axon: { length_um: number; myelinated: boolean; collaterals: number; diameter_um: number };
    spineCount: number;
    color: string;
  };
  electrophysiology: {
    restingPotential_mV: number;
    threshold_mV: number;
    peakAmplitude_mV: number;
    afterHyperpolarization_mV: number;
    apDuration_ms: number;
    firingRate_Hz: { min: number; typical: number; max: number };
    refractoryAbsolute_ms: number;
    refractoryRelative_ms: number;
  };
}

interface CorticalLayer {
  id: string;
  name: string;
  thickness_um: number;
  cellTypes: string[];
  description: string;
  color: string;
}

interface APPhase {
  id: string;
  label: string;
  voltage_mV: number;
  duration_ms: number;
  description: string;
  color: string;
}

interface IonChannel {
  id: string;
  name: string;
  ion: string;
  direction: string;
  activation: string;
  color: string;
  conductance_pS: number;
}

interface Receptor {
  id: string;
  name: string;
  type: string;
  neurotransmitter: string;
  ions: string[];
  conductance_pS: number;
  kinetics: string;
  color: string;
  notes?: string;
}

interface SpineType {
  id: string;
  name: string;
  headDiameter_um: number;
  neckLength_um: number;
  neckDiameter_um: number;
  stability: string;
  ampaCount: number;
  color: string;
}

interface BrainRegionSim {
  id: string;
  name: string;
  dominantNeurons: string[];
  function: string;
  firingRate_Hz: number;
  position: { x: number; y: number };
}

interface NetworkDef {
  id: string;
  name: string;
  regions: string[];
  tract: string;
  color: string;
}

interface SimData {
  neuronTypes: NeuronType[];
  corticalLayers: CorticalLayer[];
  synapse: {
    cleftWidth_nm: number;
    presynapticTerminal: { diameter_um: number; vesicleCount_rrp: number; vesicleCount_reserve: number; vesicle_diameter_nm: number };
    postsynapticDensity: { diameter_nm: number; thickness_nm: number };
    timing: Record<string, number>;
  };
  actionPotential: {
    phases: APPhase[];
    ionChannels: IonChannel[];
    equilibriumPotentials: Record<string, number>;
  };
  receptors: Receptor[];
  spineTypes: SpineType[];
  brainRegions: BrainRegionSim[];
  networks: NetworkDef[];
}

type ZoomLevel = 'network' | 'region' | 'neuron' | 'synapse' | 'molecular';

// ═══ Constants ═══

const ZOOM_LEVELS: { id: ZoomLevel; label: string; icon: string; color: string; description: string; scale: string }[] = [
  { id: 'network', label: 'Network', icon: '\u25c8', color: '#3b82f6', description: 'Brain regions & functional networks', scale: '~15 cm' },
  { id: 'region', label: 'Cortical Layers', icon: '\u2261', color: '#10b981', description: 'Six-layer cortical column', scale: '~2 mm' },
  { id: 'neuron', label: 'Neuron', icon: '\u2b22', color: '#8b5cf6', description: 'Morphology & action potential', scale: '~100 \u00b5m' },
  { id: 'synapse', label: 'Synapse', icon: '\u25c9', color: '#f59e0b', description: 'Vesicle release & receptor binding', scale: '~1 \u00b5m' },
  { id: 'molecular', label: 'Molecular', icon: '\u269b', color: '#ef4444', description: 'Ion channels, spines & receptors', scale: '~10 nm' },
];

const CAMERA_CONFIGS: Record<ZoomLevel, { position: [number, number, number]; target: [number, number, number]; fov: number }> = {
  network:   { position: [0, 5, 50],  target: [0, 0, 0],   fov: 50 },
  region:    { position: [0, 2, 12],  target: [0, 0, 0],   fov: 40 },
  neuron:    { position: [0, 3, 16],  target: [0, 2, 0],   fov: 42 },
  synapse:   { position: [0, 0, 12],  target: [0, 0, 0],   fov: 38 },
  molecular: { position: [0, 0, 10],  target: [0, -1, 0],  fov: 35 },
};

const REGION_3D_POS: Record<string, [number, number, number]> = {
  prefrontal:     [0, 8, 12],
  motor:          [-3, 10, 5],
  somatosensory:  [-4, 9, -2],
  visual:         [0, 3, -13],
  auditory:       [-11, 1, 3],
  temporal:       [-9, -3, 6],
  parietal:       [-1, 11, -5],
  hippocampus:    [-4, -4, 0],
  amygdala:       [-6, -6, 6],
  thalamus:       [0, 0, 0],
  basal_ganglia:  [3, -2, 3],
};

// ═══ Shared UI Components ═══

function GlassCard({ children, className = '', style = {}, ...props }: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: 'var(--color-glass-bg)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid var(--color-glass-border)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="text-xs font-mono font-semibold" style={{ color: color || 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h4 className="text-xs font-mono tracking-[0.12em] uppercase mb-3 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <span style={{ color }}>{children}</span>
    </h4>
  );
}

function PillSelector<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string; color: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="px-3 py-1.5 text-xs font-mono rounded-lg transition-all duration-200"
            style={{
              background: active ? opt.color + '18' : 'var(--color-bg-surface)',
              color: active ? opt.color : 'var(--color-text-muted)',
              border: `1px solid ${active ? opt.color + '40' : 'var(--color-border)'}`,
              fontWeight: active ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ═══ Depth Gauge Sidebar ═══

function DepthGauge({ zoom, onZoom }: { zoom: ZoomLevel; onZoom: (z: ZoomLevel) => void }) {
  const currentIdx = ZOOM_LEVELS.findIndex(z => z.id === zoom);

  return (
    <div className="flex flex-col gap-1 relative">
      <div
        className="absolute left-[15px] top-[20px] w-[2px] rounded-full"
        style={{ height: 'calc(100% - 40px)', background: `linear-gradient(to bottom, ${ZOOM_LEVELS[0].color}30, ${ZOOM_LEVELS[4].color}30)` }}
      />
      <div
        className="absolute left-[15px] top-[20px] w-[2px] rounded-full transition-all duration-500"
        style={{
          height: `${(currentIdx / (ZOOM_LEVELS.length - 1)) * 100}%`,
          maxHeight: 'calc(100% - 40px)',
          background: `linear-gradient(to bottom, ${ZOOM_LEVELS[0].color}, ${ZOOM_LEVELS[currentIdx].color})`,
        }}
      />
      {ZOOM_LEVELS.map((level, i) => {
        const isActive = level.id === zoom;
        const isPast = i < currentIdx;
        const isFuture = i > currentIdx;
        return (
          <button
            key={level.id}
            onClick={() => onZoom(level.id)}
            className="relative flex items-start gap-3 p-2 rounded-lg text-left transition-all duration-200 group"
            style={{ background: isActive ? level.color + '10' : 'transparent', opacity: isFuture ? 0.5 : 1 }}
          >
            <div
              className="relative z-10 flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm transition-all duration-300"
              style={{
                background: isActive ? level.color + '25' : isPast ? level.color + '10' : 'var(--color-bg-surface)',
                border: `2px solid ${isActive ? level.color : isPast ? level.color + '50' : 'var(--color-border)'}`,
                boxShadow: isActive ? `0 0 12px ${level.color}30` : 'none',
                color: isActive ? level.color : isPast ? level.color + '80' : 'var(--color-text-faint)',
              }}
            >
              {level.icon}
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="text-sm font-semibold leading-tight transition-colors duration-200" style={{ color: isActive ? level.color : 'var(--color-text-primary)' }}>
                {level.label}
              </div>
              <div className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>{level.description}</div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: isActive ? level.color + 'aa' : 'var(--color-text-faint)' }}>{level.scale}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  THREE.JS SCENE COMPONENTS
// ═══════════════════════════════════════════════════

useGLTF.preload('/models/brain.glb');

// --- Scene Controls (camera + orbit) ---

function SceneControls({ zoom }: { zoom: ZoomLevel }) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const config = CAMERA_CONFIGS[zoom];

  useEffect(() => {
    if (!controlsRef.current) return;
    camera.position.set(...config.position);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = config.fov;
      camera.updateProjectionMatrix();
    }
    controlsRef.current.target.set(...config.target);
    controlsRef.current.update();
  }, [zoom, camera, config]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      autoRotate={zoom !== 'synapse'}
      autoRotateSpeed={0.4}
      minDistance={3}
      maxDistance={80}
    />
  );
}

// --- Brain Model ---

function BrainWireframe({ color }: { color: string }) {
  const { scene } = useGLTF('/models/brain.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          wireframe: true,
          transparent: true,
          opacity: 0.35,
        });
      }
    });
  }, [scene, color]);

  return <primitive object={scene} scale={18} />;
}

function BrainGhost({ color }: { color: string }) {
  const { scene } = useGLTF('/models/brain.glb');
  const [ghostScene, setGhostScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
        });
      }
    });
    setGhostScene(cloned);
  }, [scene, color]);

  if (!ghostScene) return null;
  return <primitive object={ghostScene} scale={18} />;
}

// --- Region Hotspot ---

function RegionHotspot3D({ position, color, size, isActive, onHover, onClick }: {
  position: [number, number, number];
  color: string;
  size: number;
  isActive: boolean;
  onHover: (active: boolean) => void;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      const s = isActive ? 1.0 + Math.sin(t * 3) * 0.25 : 1.0 + Math.sin(t * 2 + position[0]) * 0.1;
      ref.current.scale.setScalar(s);
    }
    if (glowRef.current) {
      const gs = isActive ? 1.3 + Math.sin(t * 2.5) * 0.15 : 1.0 + Math.sin(t * 1.5 + position[1]) * 0.08;
      glowRef.current.scale.setScalar(gs);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = isActive ? 0.25 + Math.sin(t * 3) * 0.1 : 0.12;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
    }
  });

  return (
    <group position={position} renderOrder={10}>
      <mesh ref={glowRef} renderOrder={10}>
        <sphereGeometry args={[size * 1.0, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh
        ref={ref}
        renderOrder={11}
        onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <sphereGeometry args={[size * 0.5, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={isActive ? 0.85 : 0.55} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh ref={ringRef} renderOrder={10}>
        <ringGeometry args={[size * 0.65, size * 0.75, 24]} />
        <meshBasicMaterial color={color} transparent opacity={isActive ? 0.5 : 0.2} side={THREE.DoubleSide} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  );
}

// --- Signal Pulses ---

function SignalPulses({ data }: { data: SimData }) {
  const poolSize = 20;
  const meshRefs = useRef<(THREE.Mesh | null)[]>(new Array(poolSize).fill(null));
  const pulseState = useRef(
    Array.from({ length: poolSize }).map(() => ({
      from: new THREE.Vector3(), to: new THREE.Vector3(), t: 0, speed: 0, active: false, color: '#60a5fa',
    }))
  );

  useFrame((_, delta) => {
    pulseState.current.forEach((pulse, i) => {
      if (!pulse.active) {
        if (Math.random() < delta * 1.5 && data.networks.length > 0) {
          const net = data.networks[Math.floor(Math.random() * data.networks.length)];
          if (net.regions.length >= 2) {
            const fi = Math.floor(Math.random() * net.regions.length);
            let ti = Math.floor(Math.random() * (net.regions.length - 1));
            if (ti >= fi) ti++;
            const fp = REGION_3D_POS[net.regions[fi]];
            const tp = REGION_3D_POS[net.regions[ti]];
            if (fp && tp) {
              pulse.from.set(...fp);
              pulse.to.set(...tp);
              pulse.t = 0;
              pulse.speed = 0.4 + Math.random() * 0.4;
              pulse.active = true;
              pulse.color = net.color;
            }
          }
        }
      } else {
        pulse.t += delta * pulse.speed;
        if (pulse.t >= 1) pulse.active = false;
      }

      const mesh = meshRefs.current[i];
      if (mesh) {
        if (pulse.active) {
          mesh.visible = true;
          mesh.position.lerpVectors(pulse.from, pulse.to, pulse.t);
          const opacity = Math.sin(pulse.t * Math.PI);
          (mesh.material as THREE.MeshBasicMaterial).opacity = opacity * 0.8;
          (mesh.material as THREE.MeshBasicMaterial).color.set(pulse.color);
          mesh.scale.setScalar(0.3 + opacity * 0.4);
        } else {
          mesh.visible = false;
        }
      }
    });
  });

  return (
    <>
      {Array.from({ length: poolSize }).map((_, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }} visible={false}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

// --- Network Scene (3D Brain) ---

function NetworkScene3D({ data, hoveredRegion, activeNetwork, onHoverRegion, onClickRegion }: {
  data: SimData;
  hoveredRegion: string | null;
  activeNetwork: string | null;
  onHoverRegion: (id: string | null) => void;
  onClickRegion: (id: string) => void;
}) {
  return (
    <group>
      <BrainGhost color="#dbeafe" />
      <BrainWireframe color="#3b82f6" />
      {data.brainRegions.map(region => {
        const pos = REGION_3D_POS[region.id];
        if (!pos) return null;
        const neuronType = data.neuronTypes.find(n => n.id === region.dominantNeurons[0]);
        const color = neuronType?.morphology.color || '#64748b';
        const inActive = activeNetwork ? data.networks.find(n => n.id === activeNetwork)?.regions.includes(region.id) : true;
        if (!inActive) return null;
        return (
          <RegionHotspot3D
            key={region.id}
            position={pos}
            color={color}
            size={2.0 + region.firingRate_Hz * 0.04}
            isActive={hoveredRegion === region.id}
            onHover={(active) => onHoverRegion(active ? region.id : null)}
            onClick={() => onClickRegion(region.id)}
          />
        );
      })}
      <SignalPulses data={data} />
    </group>
  );
}

// --- Cortical Column Scene ---

function CorticalColumn3D({ layers }: { layers: CorticalLayer[] }) {
  const totalH = layers.reduce((s, l) => s + l.thickness_um, 0);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  let yOffset = 0;
  return (
    <group ref={groupRef}>
      {layers.map((layer) => {
        const h = (layer.thickness_um / totalH) * 10;
        const yPos = 5 - yOffset - h / 2;
        yOffset += h;
        return (
          <group key={layer.id}>
            <mesh position={[0, yPos, 0]}>
              <cylinderGeometry args={[2.5, 2.5, h * 0.92, 32]} />
              <meshStandardMaterial color={layer.color} transparent opacity={0.25} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, yPos, 0]}>
              <cylinderGeometry args={[2.52, 2.52, h * 0.92, 32]} />
              <meshBasicMaterial color={layer.color} wireframe transparent opacity={0.15} />
            </mesh>
          </group>
        );
      })}
      {/* Column outline */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2.55, 2.55, 10.2, 32, 1, true]} />
        <meshBasicMaterial color="#64748b" wireframe transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

// --- Neuron Scene (SWC-based with procedural fallback) ---

function Neuron3D({ neuron, isAnimating, phaseColor }: {
  neuron: NeuronType;
  isAnimating: boolean;
  phaseColor: string;
}) {
  return (
    <group>
      {/* Real neuron morphology from NeuroMorpho.org SWC data */}
      <SWCNeuron
        url="/models/neuron.swc"
        scale={0.012}
        isAnimating={isAnimating}
        phaseColor={phaseColor}
      />
    </group>
  );
}

// --- Synapse Scene ---

function Synapse3D({ synapse, receptors, isReleasing }: {
  synapse: SimData['synapse'];
  receptors: Receptor[];
  isReleasing: boolean;
}) {
  const vesicleRef = useRef<THREE.InstancedMesh>(null);
  const count = synapse.presynapticTerminal.vesicleCount_rrp;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);
  const positionsRef = useRef(
    Array.from({ length: count }).map((_, i) => ({
      x: (i % 4 - 1.5) * 0.7,
      y: 2.5 + Math.floor(i / 4) * 0.45,
      z: (Math.random() - 0.5) * 1.2,
      released: false,
    }))
  );

  useEffect(() => {
    if (!isReleasing) {
      timeRef.current = 0;
      positionsRef.current = positionsRef.current.map((_, i) => ({
        x: (i % 4 - 1.5) * 0.7,
        y: 2.5 + Math.floor(i / 4) * 0.45,
        z: (Math.random() - 0.5) * 1.2,
        released: false,
      }));
    }
  }, [isReleasing]);

  useFrame((_, delta) => {
    if (!vesicleRef.current) return;
    if (isReleasing) {
      timeRef.current += delta;
      positionsRef.current.forEach((p) => {
        if (!p.released && timeRef.current > 0.2 + Math.random() * 0.8) {
          p.released = true;
        }
        if (p.released) {
          p.y -= delta * 2.5;
          p.x += (Math.random() - 0.5) * delta * 0.8;
          if (p.y < -1.3) p.y = -1.3;
        }
      });
    }
    positionsRef.current.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(0.12);
      dummy.updateMatrix();
      vesicleRef.current!.setMatrixAt(i, dummy.matrix);
    });
    vesicleRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Pre-synaptic membrane */}
      <mesh position={[0, 1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 3.5]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* Post-synaptic membrane */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 3.5]} />
        <meshStandardMaterial color="#8b5cf6" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* PSD */}
      <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.5, 2.2]} />
        <meshStandardMaterial color="#8b5cf6" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Active zone */}
      <mesh position={[0, 1.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.5, 2.2]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* Ca2+ channels */}
      {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
        <mesh key={`ca-${i}`} position={[x, 1.55, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 6]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={isReleasing ? 0.6 : 0.1} />
        </mesh>
      ))}

      {/* Vesicles (instanced) */}
      <instancedMesh ref={vesicleRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.55} />
      </instancedMesh>

      {/* Receptors */}
      {receptors.slice(0, 5).map((rec, i) => (
        <group key={rec.id} position={[(i - 2) * 1.0, -1.3, 0]}>
          <mesh>
            <boxGeometry args={[0.22, 0.4, 0.22]} />
            <meshStandardMaterial color={rec.color} transparent opacity={0.65} />
          </mesh>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.15, 4]} />
            <meshStandardMaterial color={rec.color} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Spine head */}
      <mesh position={[0, -2.5, 0]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial color="#8b5cf6" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// --- Molecular Scene (PDB-based real molecular structures) ---

const PDB_MODELS: Record<string, { url: string; label: string }> = {
  ampa: { url: '/models/ampa-receptor.pdb', label: 'AMPA Receptor (7LDD)' },
  kchannel: { url: '/models/k-channel.pdb', label: 'K+ Channel (2R9R)' },
  nmda: { url: '/models/nmda-receptor.pdb', label: 'NMDA Receptor (4PE5)' },
};

function Molecular3D({ channels, spine, moleculeId }: {
  channels: IonChannel[];
  spine: SpineType;
  moleculeId: string;
}) {
  const model = PDB_MODELS[moleculeId] || PDB_MODELS.ampa;
  return (
    <group>
      {/* Real molecular structure from RCSB PDB */}
      <PDBMolecule
        url={model.url}
        backboneOnly={true}
        colorMode="chain"
        atomScale={0.35}
        sceneScale={0.055}
      />
    </group>
  );
}

// ═══════════════════════════════════════════════════
//  HTML INFO PANELS
// ═══════════════════════════════════════════════════

function NetworkInfoPanel({ data, hoveredRegion, activeNetwork }: {
  data: SimData;
  hoveredRegion: string | null;
  activeNetwork: string | null;
}) {
  const region = hoveredRegion ? data.brainRegions.find(r => r.id === hoveredRegion) : null;
  const network = activeNetwork ? data.networks.find(n => n.id === activeNetwork) : null;

  return (
    <div className="space-y-3">
      {region ? (
        <GlassCard className="p-3">
          <SectionLabel color="#3b82f6">{region.name}</SectionLabel>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>{region.function}</p>
          <InfoRow label="Firing rate" value={`${region.firingRate_Hz} Hz`} color="#3b82f6" />
          <InfoRow label="Dominant neurons" value={region.dominantNeurons.map(id => data.neuronTypes.find(n => n.id === id)?.name.split(' ')[0] || id).join(', ')} />
        </GlassCard>
      ) : (
        <GlassCard className="p-3">
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            Hover over a glowing region to see details. Click to zoom into its cortical layers.
          </p>
        </GlassCard>
      )}
      {network && (
        <GlassCard className="p-3" style={{ borderColor: network.color + '30' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: network.color }} />
            <span className="text-xs font-semibold" style={{ color: network.color }}>{network.name}</span>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {network.tract} {'\u00b7'} {network.regions.length} regions
          </p>
        </GlassCard>
      )}
      <GlassCard className="p-3">
        <SectionLabel color="#8b5cf6">Stats</SectionLabel>
        <InfoRow label="Regions" value={data.brainRegions.length} />
        <InfoRow label="Networks" value={data.networks.length} />
        <InfoRow label="Neuron types" value={data.neuronTypes.length} />
      </GlassCard>
    </div>
  );
}

function RegionInfoPanel({ data, selectedRegion }: { data: SimData; selectedRegion: string | null }) {
  const region = selectedRegion ? data.brainRegions.find(r => r.id === selectedRegion) : null;
  const totalThickness = data.corticalLayers.reduce((s, l) => s + l.thickness_um, 0);

  return (
    <div className="space-y-3">
      {region && (
        <GlassCard className="p-3">
          <span className="text-xs font-mono" style={{ color: '#10b981' }}>Column in:</span>
          <span className="ml-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{region.name}</span>
        </GlassCard>
      )}
      <GlassCard className="p-3">
        <SectionLabel color="#10b981">Layers</SectionLabel>
        {data.corticalLayers.map(layer => (
          <div key={layer.id} className="flex items-center gap-2 py-0.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: layer.color }} />
            <span className="text-xs flex-1" style={{ color: 'var(--color-text-muted)' }}>{layer.name}</span>
            <span className="text-[10px] font-mono" style={{ color: layer.color }}>{layer.thickness_um} {'\u00b5m'}</span>
          </div>
        ))}
      </GlassCard>
      <GlassCard className="p-3">
        <SectionLabel color="#3b82f6">Column Stats</SectionLabel>
        <InfoRow label="Total thickness" value={`${totalThickness} \u00b5m`} color="#3b82f6" />
        <InfoRow label="Excitatory" value="~80% pyramidal" />
        <InfoRow label="Inhibitory" value="~20% interneurons" />
        <InfoRow label="Synapses" value="~40M per column" color="#8b5cf6" />
      </GlassCard>
      <GlassCard className="p-3">
        <SectionLabel color="#f59e0b">Canonical Circuit</SectionLabel>
        {[
          { from: 'Thalamus', to: 'L-IV', color: '#f59e0b' },
          { from: 'L-IV', to: 'L-II/III', color: '#10b981' },
          { from: 'L-III', to: 'Cortex', color: '#3b82f6' },
          { from: 'L-V', to: 'Subcortical', color: '#ef4444' },
          { from: 'L-VI', to: 'Thalamus', color: '#8b5cf6' },
        ].map(c => (
          <div key={c.from} className="flex items-center gap-1.5 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
            <span className="text-[10px] font-mono" style={{ color: c.color }}>{c.from}</span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>{'\u2192'}</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{c.to}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function NeuronInfoPanel({ neuron, isAnimating, phases, apPhase }: {
  neuron: NeuronType;
  isAnimating: boolean;
  phases: APPhase[];
  apPhase: number;
}) {
  return (
    <div className="space-y-3">
      <GlassCard className="p-3">
        <SectionLabel color={neuron.morphology.color}>Electrophysiology</SectionLabel>
        <InfoRow label="Resting" value={`${neuron.electrophysiology.restingPotential_mV} mV`} color="#64748b" />
        <InfoRow label="Threshold" value={`${neuron.electrophysiology.threshold_mV} mV`} color="#f59e0b" />
        <InfoRow label="Peak" value={`+${neuron.electrophysiology.peakAmplitude_mV} mV`} color="#ef4444" />
        <InfoRow label="AHP" value={`${neuron.electrophysiology.afterHyperpolarization_mV} mV`} color="#8b5cf6" />
        <InfoRow label="Duration" value={`${neuron.electrophysiology.apDuration_ms} ms`} color="#10b981" />
        <InfoRow label="Refractory" value={`${neuron.electrophysiology.refractoryAbsolute_ms} ms`} />
      </GlassCard>
      <GlassCard className="p-3">
        <SectionLabel color={neuron.morphology.color}>Morphology</SectionLabel>
        <InfoRow label="Soma" value={`${neuron.morphology.somaSize_um} \u00b5m ${neuron.morphology.somaShape}`} />
        <InfoRow label="Spines" value={neuron.morphology.spineCount.toLocaleString()} />
        <InfoRow label="Axon" value={`${neuron.morphology.axon.length_um} \u00b5m`} />
        <InfoRow label="Myelinated" value={neuron.morphology.axon.myelinated ? 'Yes' : 'No'} />
        <InfoRow label="Transmitter" value={neuron.neurotransmitter} />
      </GlassCard>
      <GlassCard className="p-3">
        <SectionLabel color="#f59e0b">AP Phases</SectionLabel>
        {phases.map((phase, i) => (
          <div key={phase.id} className="flex items-center gap-2 py-0.5 px-1 rounded"
            style={{
              background: isAnimating && apPhase === i ? phase.color + '10' : 'transparent',
              border: `1px solid ${isAnimating && apPhase === i ? phase.color + '30' : 'transparent'}`,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: phase.color }} />
            <span className="text-[11px] flex-1" style={{ color: isAnimating && apPhase === i ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
              {phase.label}
            </span>
            <span className="text-[10px] font-mono" style={{ color: phase.color }}>
              {phase.voltage_mV > 0 ? '+' : ''}{phase.voltage_mV}mV
            </span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function SynapseInfoPanel({ synapse, receptors, selectedReceptor, onSelectReceptor }: {
  synapse: SimData['synapse'];
  receptors: Receptor[];
  selectedReceptor: string | null;
  onSelectReceptor: (id: string | null) => void;
}) {
  const rec = selectedReceptor ? receptors.find(r => r.id === selectedReceptor) : null;

  return (
    <div className="space-y-3">
      <GlassCard className="p-3">
        <SectionLabel color="#f59e0b">Vesicle Pools</SectionLabel>
        <InfoRow label="RRP" value={synapse.presynapticTerminal.vesicleCount_rrp} color="#3b82f6" />
        <InfoRow label="Reserve" value={synapse.presynapticTerminal.vesicleCount_reserve} />
        <InfoRow label="Vesicle size" value={`${synapse.presynapticTerminal.vesicle_diameter_nm} nm`} />
        <InfoRow label="Cleft width" value={`${synapse.cleftWidth_nm} nm`} />
        <InfoRow label="PSD" value={`${synapse.postsynapticDensity.diameter_nm} nm`} />
      </GlassCard>
      <GlassCard className="p-3">
        <SectionLabel color="#10b981">Kinetics (ms)</SectionLabel>
        <InfoRow label="Fusion" value={synapse.timing.fusionLatency_ms} color="#10b981" />
        <InfoRow label="AMPA" value={`${synapse.timing.ampaRise_ms}/${synapse.timing.ampaDecay_ms}`} />
        <InfoRow label="NMDA" value={`${synapse.timing.nmdaRise_ms}/${synapse.timing.nmdaDecay_ms}`} />
        <InfoRow label="GABA-A" value={`${synapse.timing.gabaARise_ms}/${synapse.timing.gabaADecay_ms}`} />
      </GlassCard>
      <GlassCard className="p-3">
        <SectionLabel color="#06b6d4">Receptors</SectionLabel>
        {receptors.map(r => (
          <button key={r.id} onClick={() => onSelectReceptor(selectedReceptor === r.id ? null : r.id)}
            className="flex items-center gap-2 py-0.5 w-full text-left rounded px-1"
            style={{ background: selectedReceptor === r.id ? r.color + '10' : 'transparent' }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
            <span className="text-[11px] font-semibold" style={{ color: r.color }}>{r.name}</span>
            <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-faint)' }}>{r.type}</span>
          </button>
        ))}
      </GlassCard>
      {rec && (
        <GlassCard className="p-3" style={{ borderColor: rec.color + '30' }}>
          <SectionLabel color={rec.color}>{rec.name}</SectionLabel>
          <InfoRow label="Ligand" value={rec.neurotransmitter} />
          <InfoRow label="Ions" value={rec.ions.join(', ') || 'G-protein'} />
          <InfoRow label="Conductance" value={`${rec.conductance_pS} pS`} />
          <InfoRow label="Kinetics" value={rec.kinetics} />
          {rec.notes && <p className="text-[10px] mt-1 pt-1" style={{ color: 'var(--color-text-faint)', borderTop: '1px solid var(--color-border)' }}>{rec.notes}</p>}
        </GlassCard>
      )}
    </div>
  );
}

function MolecularInfoPanel({ channels, spine, eqPotentials, receptors }: {
  channels: IonChannel[];
  spine: SpineType;
  eqPotentials: Record<string, number>;
  receptors: Receptor[];
}) {
  return (
    <div className="space-y-3">
      <GlassCard className="p-3">
        <SectionLabel color="#ef4444">Ion Channels</SectionLabel>
        {channels.map(ch => (
          <div key={ch.id} className="flex items-center gap-2 py-0.5">
            <div className="w-2 h-2 rounded-full" style={{ background: ch.color }} />
            <span className="text-[11px] font-mono font-semibold" style={{ color: ch.color }}>{ch.ion}</span>
            <span className="text-[10px] flex-1" style={{ color: 'var(--color-text-muted)' }}>{ch.name}</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-faint)' }}>{ch.conductance_pS}pS</span>
          </div>
        ))}
      </GlassCard>
      <GlassCard className="p-3">
        <SectionLabel color="#f59e0b">Equilibrium (mV)</SectionLabel>
        {Object.entries(eqPotentials).map(([ion, mV]) => (
          <InfoRow key={ion} label={`E_${ion}`} value={`${mV} mV`} color={channels.find(c => c.ion.startsWith(ion))?.color} />
        ))}
        <InfoRow label="V_rest" value="-70 mV" color="var(--color-text-faint)" />
      </GlassCard>
      <GlassCard className="p-3">
        <SectionLabel color={spine.color}>{spine.name} Spine</SectionLabel>
        <InfoRow label="Head" value={`${spine.headDiameter_um} \u00b5m`} color={spine.color} />
        <InfoRow label="Neck" value={`${spine.neckLength_um} \u00d7 ${spine.neckDiameter_um} \u00b5m`} />
        <InfoRow label="AMPA" value={`~${spine.ampaCount}`} />
        <InfoRow label="Stability" value={spine.stability} />
      </GlassCard>
      <GlassCard className="p-3">
        <SectionLabel color="#06b6d4">Receptor Catalog</SectionLabel>
        {receptors.map(rec => (
          <div key={rec.id} className="flex items-center gap-1.5 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: rec.color }} />
            <span className="text-[10px] font-semibold" style={{ color: rec.color }}>{rec.name}</span>
            <span className="text-[9px] truncate" style={{ color: 'var(--color-text-faint)' }}>{rec.type} {'\u00b7'} {rec.kinetics}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════

interface NeuroSIMProps {
  simData: SimData;
}

export default function NeuroSIM({ simData }: NeuroSIMProps) {
  const webglSupported = useWebGLSupport();
  const [zoom, setZoom] = useState<ZoomLevel>('network');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);
  const [selectedNeuron, setSelectedNeuron] = useState<string>('pyramidal');
  const [isAnimatingAP, setIsAnimatingAP] = useState(false);
  const [apPhase, setApPhase] = useState(0);
  const [isReleasing, setIsReleasing] = useState(false);
  const [selectedSpine, setSelectedSpine] = useState<string>('mushroom');
  const [selectedReceptor, setSelectedReceptor] = useState<string | null>(null);
  const [selectedMolecule, setSelectedMolecule] = useState<string>('ampa');
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const currentLevel = ZOOM_LEVELS.find(z => z.id === zoom)!;
  const neuron = simData.neuronTypes.find(n => n.id === selectedNeuron)!;
  const phases = simData.actionPotential.phases;
  const spine = simData.spineTypes.find(s => s.id === selectedSpine)!;

  const handleSelectRegion = useCallback((id: string) => {
    setSelectedRegion(id);
    setZoom('region');
  }, []);

  // AP animation
  useEffect(() => {
    if (!isAnimatingAP) return;
    let lastTime = 0;
    const totalDuration = phases.reduce((s, p) => s + p.duration_ms, 0);
    timeRef.current = 0;
    const tick = (time: number) => {
      const dt = lastTime ? (time - lastTime) : 0;
      lastTime = time;
      timeRef.current += dt * 0.5;
      if (timeRef.current > totalDuration * 1000) timeRef.current = 0;
      let elapsed = 0;
      for (let i = 0; i < phases.length; i++) {
        elapsed += phases[i].duration_ms * 1000;
        if (timeRef.current < elapsed) { setApPhase(i); break; }
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isAnimatingAP, phases]);

  // Auto-reset vesicle release
  useEffect(() => {
    if (!isReleasing) return;
    const timer = setTimeout(() => setIsReleasing(false), 4000);
    return () => clearTimeout(timer);
  }, [isReleasing]);

  const currentPhase = phases[apPhase];

  return (
    <div className="flex gap-6" style={{ minHeight: 700 }}>
      {/* Left: Depth Gauge */}
      <div className="hidden lg:block flex-shrink-0" style={{ width: 220 }}>
        <div className="sticky top-24">
          <GlassCard className="p-4">
            <div className="text-[10px] font-mono tracking-[0.15em] uppercase mb-4" style={{ color: 'var(--color-text-faint)' }}>
              Zoom Level
            </div>
            <DepthGauge zoom={zoom} onZoom={setZoom} />
          </GlassCard>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { label: 'Neurons', value: simData.neuronTypes.length, color: '#3b82f6' },
              { label: 'Regions', value: simData.brainRegions.length, color: '#10b981' },
              { label: 'Receptors', value: simData.receptors.length, color: '#ef4444' },
              { label: 'Networks', value: simData.networks.length, color: '#8b5cf6' },
            ].map(stat => (
              <GlassCard key={stat.label} className="p-2.5 text-center card-hover">
                <div className="text-lg font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>{stat.label}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile zoom selector */}
      <div className="lg:hidden w-full mb-4">
        <PillSelector
          options={ZOOM_LEVELS.map(z => ({ id: z.id, label: z.label, color: z.color }))}
          value={zoom}
          onChange={setZoom}
        />
      </div>

      {/* Center: 3D Canvas + Right: Info Panels */}
      <div className="flex-1 min-w-0">
        {/* Level header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-10 rounded-full" style={{ background: currentLevel.color }} />
          <div>
            <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
              {currentLevel.label}
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {currentLevel.description}
              <span className="ml-2 font-mono" style={{ color: currentLevel.color + 'aa' }}>{currentLevel.scale}</span>
            </p>
          </div>
          {/* Voltage indicator */}
          {isAnimatingAP && zoom === 'neuron' && (
            <div className="ml-auto px-3 py-1.5 rounded-lg" style={{ background: currentPhase.color + '15', border: `1px solid ${currentPhase.color}30` }}>
              <span className="text-lg font-bold font-mono" style={{ color: currentPhase.color }}>
                {currentPhase.voltage_mV > 0 ? '+' : ''}{currentPhase.voltage_mV}mV
              </span>
              <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>{currentPhase.label}</span>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {/* Three.js Canvas */}
          <div className="flex-1 min-w-0">
            <GlassCard style={{ height: 550 }} className="overflow-hidden cursor-grab active:cursor-grabbing">
              {!webglSupported ? <WebGLFallback feature="neural simulation" /> : <Canvas
                gl={{ alpha: true, antialias: true }}
                camera={{ position: [0, 5, 50], fov: 50 }}
              >
                <Suspense fallback={null}>
                  <ambientLight intensity={0.45} />
                  <directionalLight position={[10, 10, 5]} intensity={0.8} />
                  <directionalLight position={[-5, -5, 10]} intensity={0.3} color="#93c5fd" />

                  {zoom === 'network' && (
                    <NetworkScene3D
                      data={simData}
                      hoveredRegion={hoveredRegion}
                      activeNetwork={activeNetwork}
                      onHoverRegion={setHoveredRegion}
                      onClickRegion={handleSelectRegion}
                    />
                  )}
                  {zoom === 'region' && <CorticalColumn3D layers={simData.corticalLayers} />}
                  {zoom === 'neuron' && <Neuron3D neuron={neuron} isAnimating={isAnimatingAP} phaseColor={currentPhase.color} />}
                  {zoom === 'synapse' && <Synapse3D synapse={simData.synapse} receptors={simData.receptors} isReleasing={isReleasing} />}
                  {zoom === 'molecular' && <Molecular3D channels={simData.actionPotential.ionChannels} spine={spine} moleculeId={selectedMolecule} />}

                  <SceneControls zoom={zoom} />
                </Suspense>
              </Canvas>}
            </GlassCard>

            {/* Controls bar */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {zoom === 'network' && (
                <PillSelector
                  options={[
                    { id: '__all__' as string, label: 'All Networks', color: '#64748b' },
                    ...simData.networks.map(n => ({ id: n.id, label: n.name, color: n.color })),
                  ]}
                  value={activeNetwork || '__all__'}
                  onChange={(v) => setActiveNetwork(v === '__all__' ? null : v)}
                />
              )}
              {zoom === 'neuron' && (
                <>
                  <PillSelector
                    options={simData.neuronTypes.map(nt => ({ id: nt.id, label: nt.name, color: nt.morphology.color }))}
                    value={selectedNeuron}
                    onChange={setSelectedNeuron}
                  />
                  <button
                    onClick={() => setIsAnimatingAP(!isAnimatingAP)}
                    className="px-4 py-1.5 text-xs font-mono rounded-lg transition-all"
                    style={{
                      background: isAnimatingAP ? '#ef444415' : neuron.morphology.color + '15',
                      color: isAnimatingAP ? '#ef4444' : neuron.morphology.color,
                      border: `1px solid ${isAnimatingAP ? '#ef444440' : neuron.morphology.color + '40'}`,
                    }}
                  >
                    {isAnimatingAP ? 'Stop AP' : 'Fire Action Potential'}
                  </button>
                </>
              )}
              {zoom === 'synapse' && (
                <button
                  onClick={() => { if (!isReleasing) setIsReleasing(true); }}
                  disabled={isReleasing}
                  className="px-4 py-1.5 text-xs font-mono rounded-lg transition-all"
                  style={{
                    background: isReleasing ? '#f59e0b15' : '#10b98115',
                    color: isReleasing ? '#f59e0b' : '#10b981',
                    border: `1px solid ${isReleasing ? '#f59e0b40' : '#10b98140'}`,
                    opacity: isReleasing ? 0.6 : 1,
                  }}
                >
                  {isReleasing ? 'Releasing...' : 'Trigger NT Release'}
                </button>
              )}
              {zoom === 'molecular' && (
                <PillSelector
                  options={[
                    { id: 'ampa', label: 'AMPA Receptor', color: '#3b82f6' },
                    { id: 'nmda', label: 'NMDA Receptor', color: '#10b981' },
                    { id: 'kchannel', label: 'K+ Channel', color: '#f59e0b' },
                  ]}
                  value={selectedMolecule}
                  onChange={setSelectedMolecule}
                />
              )}
              <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-faint)' }}>
                Drag to rotate {'\u00b7'} Scroll to zoom
              </span>
            </div>
          </div>

          {/* Right: Info Panels */}
          <div className="hidden xl:block w-[260px] flex-shrink-0 space-y-3 max-h-[600px] overflow-y-auto">
            {zoom === 'network' && <NetworkInfoPanel data={simData} hoveredRegion={hoveredRegion} activeNetwork={activeNetwork} />}
            {zoom === 'region' && <RegionInfoPanel data={simData} selectedRegion={selectedRegion} />}
            {zoom === 'neuron' && <NeuronInfoPanel neuron={neuron} isAnimating={isAnimatingAP} phases={phases} apPhase={apPhase} />}
            {zoom === 'synapse' && <SynapseInfoPanel synapse={simData.synapse} receptors={simData.receptors} selectedReceptor={selectedReceptor} onSelectReceptor={setSelectedReceptor} />}
            {zoom === 'molecular' && <MolecularInfoPanel channels={simData.actionPotential.ionChannels} spine={spine} eqPotentials={simData.actionPotential.equilibriumPotentials} receptors={simData.receptors} />}
          </div>
        </div>
      </div>
    </div>
  );
}
