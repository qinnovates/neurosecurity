import { useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const SEPARATION = 100;
const AMOUNTX = 50;
const AMOUNTY = 50;

function WavePoints() {
  const pointsRef = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const countRef = useRef(0);
  const { camera } = useThree();
  const numParticles = AMOUNTX * AMOUNTY;

  const { positions, scales, colors } = useMemo(() => {
    const pos = new Float32Array(numParticles * 3);
    const sc = new Float32Array(numParticles);
    const col = new Float32Array(numParticles * 3);

    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        pos[i * 3] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
        sc[i] = 1;
        col[i * 3] = 0.23;
        col[i * 3 + 1] = 0.51;
        col[i * 3 + 2] = 0.96;
        i++;
      }
    }

    return { positions: pos, scales: sc, colors: col };
  }, [numParticles]);

  // Color stops for Y-based gradient
  const colorLow = useMemo(() => new THREE.Color('#0f172a'), []);   // deep navy (troughs)
  const colorMid = useMemo(() => new THREE.Color('#2563eb'), []);   // blue (neutral)
  const colorHigh = useMemo(() => new THREE.Color('#7dd3fc'), []);  // sky blue (peaks)
  const tmpColor = useMemo(() => new THREE.Color(), []);

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

  useFrame(() => {
    if (!pointsRef.current) return;

    camera.position.x += (mouseRef.current.x * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (-mouseRef.current.y * 0.5 + 350 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const scaleAttr = geo.attributes.scale;
    const colAttr = geo.attributes.color;
    const count = countRef.current;

    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        // Base wave
        const y =
          Math.sin((ix + count) * 0.3) * 50 +
          Math.sin((iy + count) * 0.5) * 50;

        const baseScale =
          (Math.sin((ix + count) * 0.3) + 1) * 20 +
          (Math.sin((iy + count) * 0.5) + 1) * 20;

        posAttr.array[i * 3 + 1] = y;
        scaleAttr.array[i] = baseScale;

        // Map Y position (-100 to 100) to color
        const t = (y + 100) / 200;
        const clamped = Math.max(0, Math.min(1, t));

        if (clamped < 0.5) {
          tmpColor.lerpColors(colorLow, colorMid, clamped * 2);
        } else {
          tmpColor.lerpColors(colorMid, colorHigh, (clamped - 0.5) * 2);
        }

        colAttr.array[i * 3] = tmpColor.r;
        colAttr.array[i * 3 + 1] = tmpColor.g;
        colAttr.array[i * 3 + 2] = tmpColor.b;

        i++;
      }
    }

    posAttr.needsUpdate = true;
    scaleAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Slower speed
    countRef.current += 0.04;
  });

  const vertexShader = `
    attribute float scale;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = scale * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.475) discard;
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
        <bufferAttribute
          attach="attributes-position"
          count={numParticles}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={numParticles}
          array={scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={numParticles}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
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
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <WavePoints />
      </Canvas>
    </div>
  );
}
