import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWebGLSupport, WebGLFallback } from './WebGLCheck';

// ONI Layer config — 7 concentric spheres from the original ONI Framework site
const LAYERS = [
  { id: 'S3', r: 1.72, c: [0.20, 0.55, 0.60], fp: 2.0, label: 'Radio / Wireless' },
  { id: 'S2', r: 1.52, c: [0.20, 0.87, 0.87], fp: 2.8, label: 'Telemetry' },
  { id: 'S1', r: 1.38, c: [0.50, 0.93, 0.93], fp: 2.6, label: 'Analog / Near-Field' },
  { id: 'I0', r: 1.24, c: [1.00, 0.85, 0.30], fp: 2.4, label: 'Neural Gateway' },
  { id: 'N1', r: 1.10, c: [0.30, 0.90, 0.50], fp: 2.3, label: 'Peripheral Nerve' },
  { id: 'N4', r: 0.96, c: [0.40, 0.95, 0.60], fp: 2.2, label: 'Thalamic Relay' },
  { id: 'N7', r: 0.82, c: [0.80, 0.55, 0.75], fp: 2.0, label: 'Cortical Target' },
];

const VERT = `
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mv.xyz;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uFresnelPower;
  uniform float uGlowIntensity;
  uniform float uTime;
  uniform float uBubbleMix;

  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vWorldPos;

  void main() {
    vec3 vd = normalize(vViewPos);
    float NdotV = abs(dot(vd, vNormal));
    float fresnel = pow(1.0 - NdotV, uFresnelPower);
    float shimmer = 1.0 + 0.08 * sin(uTime * 2.0 + vNormal.x * 12.0);

    float ripple1 = sin(vWorldPos.x * 4.0 + uTime * 0.8) * cos(vWorldPos.z * 3.5 + uTime * 0.6);
    float ripple2 = sin(vWorldPos.x * 6.0 - uTime * 0.5 + 1.7) * cos(vWorldPos.z * 5.0 + uTime * 0.4);
    float poolEffect = 0.5 + 0.3 * ripple1 + 0.2 * ripple2;
    float electricPool = mix(1.0, poolEffect * 1.4 + 0.3, 0.3);

    vec3 stdCol = uColor * (1.0 + fresnel * uGlowIntensity);
    float stdAlpha = fresnel * uOpacity * shimmer * electricPool;

    float thickness = NdotV * 2.5
      + sin(vWorldPos.x * 3.0 + vWorldPos.z * 2.0 + uTime * 0.2) * 0.3
      + sin(vWorldPos.y * 4.0 - vWorldPos.x * 1.5 + uTime * 0.15) * 0.2;
    float filmR = 0.5 + 0.5 * cos(thickness * 6.2832 * 1.0);
    float filmG = 0.5 + 0.5 * cos(thickness * 6.2832 * 1.15 + 1.2);
    float filmB = 0.5 + 0.5 * cos(thickness * 6.2832 * 1.35 + 2.5);
    vec3 filmColor = vec3(filmR, filmG, filmB);
    float iriStrength = 0.3 + fresnel * 0.7;
    vec3 bubbleCol = mix(uColor * 0.4, filmColor, iriStrength);
    float rim = pow(fresnel, 2.0);
    bubbleCol += mix(filmColor, vec3(1.0), 0.5) * rim * 0.6;
    float bubbleAlpha = rim * 0.5 + (1.0 - fresnel) * 0.08 + fresnel * 0.35 * uOpacity;

    float purplePulse = 0.5 + 0.5 * sin(uTime * 0.5 + vWorldPos.y * 2.0);
    bubbleCol += vec3(0.85, 0.15, 0.95) * purplePulse * (1.0 - fresnel) * uBubbleMix * 1.4;

    float coreGlow = pow(NdotV, 3.0) * uBubbleMix * 0.35;
    bubbleCol += vec3(1.0) * coreGlow;
    bubbleAlpha += coreGlow * 0.3;

    float outerRim = pow(fresnel, 1.5) * uBubbleMix * 0.7;
    bubbleCol += vec3(1.0) * outerRim;
    bubbleAlpha += outerRim * 0.5;

    vec3 col = mix(stdCol, bubbleCol, uBubbleMix);
    float alpha = mix(stdAlpha, bubbleAlpha, uBubbleMix);

    gl_FragColor = vec4(col, alpha);
  }
`;

// Individual shell with scroll-driven Y offset
function Shell({ layer, index, scrollExpand }: {
  layer: typeof LAYERS[number];
  index: number;
  scrollExpand: React.MutableRefObject<number>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const bubbleMix = useMemo(() => {
    return Math.max(0, 0.80 - (LAYERS.length - 1 - index) * 0.13);
  }, [index]);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Vector3(layer.c[0], layer.c[1], layer.c[2]) },
    uOpacity: { value: bubbleMix > 0.3 ? 0.7 : 0.45 },
    uFresnelPower: { value: layer.fp },
    uGlowIntensity: { value: bubbleMix > 0.3 ? 2.5 : 1.2 },
    uTime: { value: 0 },
    uBubbleMix: { value: bubbleMix },
  }), [layer, bubbleMix]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
    if (meshRef.current) {
      // Scroll-driven vertical expansion: outer layers move up, inner layers move down
      // Center index (I0, index 3) stays put. Layers fan out from center.
      const centerIdx = 3; // I0 is the gateway
      const offset = (index - centerIdx) * scrollExpand.current * 0.6;
      const targetY = offset;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} scale={layer.r}>
      <sphereGeometry args={[1, 64, 48]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        side={THREE.FrontSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Dust({ count = 200 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#60a5fa"
        size={0.015}
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function Scene({ scrollExpand }: { scrollExpand: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
      const tx = mouseRef.current.x * 0.3;
      const ty = -mouseRef.current.y * 0.3;
      groupRef.current.rotation.x += (ty * 0.5 - groupRef.current.rotation.x) * 0.02;
      groupRef.current.position.x += (tx - groupRef.current.position.x) * 0.02;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} color="#1a2744" />
      <pointLight position={[4, 3, 5]} intensity={2.0} color="#3b82f6" distance={25} />
      <pointLight position={[-3, -2, 3]} intensity={1.2} color="#8b5cf6" distance={20} />
      <pointLight position={[0, 1, -5]} intensity={1.5} color="#06b6d4" distance={20} />
      <pointLight position={[0, 0, 3]} intensity={1.0} color="#1a8cb3" distance={12} />

      <group ref={groupRef} position={[0, 0.5, 0]}>
        {LAYERS.map((layer, i) => (
          <Shell key={layer.id} layer={layer} index={i} scrollExpand={scrollExpand} />
        ))}
      </group>

      <Dust />
      <fog attach="fog" args={['#050a14', 5, 18]} />
    </>
  );
}

export default function OniSpheres({ className = '' }: { className?: string }) {
  const webglSupported = useWebGLSupport();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollExpand = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;

      // Calculate how far through the section we've scrolled
      // 0 = section just entered viewport from bottom
      // 1 = section is leaving viewport from top
      const sectionHeight = rect.height;
      const scrolled = (vh - rect.top) / (sectionHeight + vh);
      const progress = Math.max(0, Math.min(1, scrolled));

      // Expansion curve: start collapsed (0), expand mid-scroll, collapse again at end
      // Bell curve: peaks at 0.5
      const bell = Math.sin(progress * Math.PI);
      scrollExpand.current = bell * 2.5; // max expansion multiplier
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!webglSupported) return null;

  return (
    <div ref={containerRef} className={className} style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 1.07, 7.87], fov: 40, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: 'transparent' }}
      >
        <Scene scrollExpand={scrollExpand} />
      </Canvas>
    </div>
  );
}
