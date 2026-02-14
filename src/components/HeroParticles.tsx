import { useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const SEPARATION = 100;
const AMOUNTX = 50;
const AMOUNTY = 50;

function WavePoints() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { camera } = useThree();
  const numParticles = AMOUNTX * AMOUNTY;

  // Initialize static attributes
  const { positions, originalIndices } = useMemo(() => {
    const pos = new Float32Array(numParticles * 3);
    const indices = new Float32Array(numParticles * 2); // ix, iy

    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        pos[i * 3] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        indices[i * 2] = ix;
        indices[i * 2 + 1] = iy;
        i++;
      }
    }

    return { positions: pos, originalIndices: indices };
  }, [numParticles]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    mouseRef.current.x = e.clientX - window.innerWidth / 2;
    mouseRef.current.y = e.clientY - window.innerHeight / 2;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [onPointerMove]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorLow: { value: new THREE.Color('#0f172a') },
    uColorMid: { value: new THREE.Color('#2563eb') },
    uColorHigh: { value: new THREE.Color('#7dd3fc') },
  }), []);

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;

    // Camera movement (kept for interactivity)
    camera.position.x += (mouseRef.current.x * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (-mouseRef.current.y * 0.5 + 350 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    // Single uniform update - much faster than O(N) loop
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  const vertexShader = `
    uniform float uTime;
    attribute vec2 aIndex;
    varying float vY;
    
    void main() {
      float ix = aIndex.x;
      float iy = aIndex.y;
      float count = uTime * 1.5; // Adjusted speed scale
      
      // Calculate Wave Y in shader
      float y = sin((ix + count) * 0.3) * 50.0 + sin((iy + count) * 0.5) * 50.0;
      vY = y;
      
      // Calculate Scale in shader
      float scale = (sin((ix + count) * 0.3) + 1.0) * 20.0 + (sin((iy + count) * 0.5) + 1.0) * 20.0;
      
      vec3 pos = position;
      pos.y = y;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = scale * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColorLow;
    uniform vec3 uColorMid;
    uniform vec3 uColorHigh;
    varying float vY;
    
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.475) discard;
      
      // Map Y position (-100 to 100) to color in fragment shader
      float t = (vY + 100.0) / 200.0;
      float clamped = clamp(t, 0.0, 1.0);
      
      vec3 vColor;
      if (clamped < 0.5) {
        vColor = mix(uColorLow, uColorMid, clamped * 2.0);
      } else {
        vColor = mix(uColorMid, uColorHigh, (clamped - 0.5) * 2.0);
      }
      
      // Glass effect: brighter edge ring, softer center
      float ring = smoothstep(0.35, 0.475, dist) * 0.6;
      float fill = smoothstep(0.475, 0.0, dist) * 0.45;
      float alpha = fill + ring;
      vec3 col = vColor + ring * 0.4;
      gl_FragColor = vec4(col, alpha);
    }
  `;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        {/* @ts-expect-error: R3F type mismatch */}
        <bufferAttribute
          attach="attributes-position"
          count={numParticles}
          array={positions}
          itemSize={3}
        />
        {/* @ts-expect-error: R3F type mismatch */}
        <bufferAttribute
          attach="attributes-aIndex"
          count={numParticles}
          array={originalIndices}
          itemSize={2}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

export default function HeroParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 350, 1000], fov: 75, near: 5, far: 10000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <WavePoints />
      </Canvas>
    </div>
  );
}
