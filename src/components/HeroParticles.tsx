import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useWebGLSupport } from './WebGLCheck';
import { useReducedMotion } from '../lib/useReducedMotion';

const SEPARATION = 100;

function getParticleCounts() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return { amountX: isMobile ? 30 : 50, amountY: isMobile ? 30 : 50 };
}

const VERTEX_SHADER = `
  uniform float uTime;
  attribute vec2 aIndex;
  varying float vY;

  void main() {
    float ix = aIndex.x;
    float iy = aIndex.y;
    float count = uTime * 1.5;

    float y = sin((ix + count) * 0.3) * 50.0 + sin((iy + count) * 0.5) * 50.0;
    vY = y;

    float scale = (sin((ix + count) * 0.3) + 1.0) * 20.0 + (sin((iy + count) * 0.5) + 1.0) * 20.0;

    vec3 pos = position;
    pos.y = y;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = scale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  varying float vY;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.475) discard;

    float t = (vY + 100.0) / 200.0;
    float clamped = clamp(t, 0.0, 1.0);

    vec3 vColor;
    if (clamped < 0.5) {
      vColor = mix(uColorLow, uColorMid, clamped * 2.0);
    } else {
      vColor = mix(uColorMid, uColorHigh, (clamped - 0.5) * 2.0);
    }

    float ring = smoothstep(0.35, 0.475, dist) * 0.6;
    float fill = smoothstep(0.475, 0.0, dist) * 0.45;
    float alpha = fill + ring;
    vec3 col = vColor + ring * 0.4;
    gl_FragColor = vec4(col, alpha);
  }
`;

interface HeroParticlesProps {
  variant?: 'light' | 'dark';
}

/**
 * Revived legacy particle-wave hero background (originally @react-three/fiber,
 * removed in commit 019d3a3), ported to raw three.js so it shares this repo's
 * existing 3D stack instead of reintroducing r3f/drei as dependencies. Renders
 * behind BrainHeroMount: its own lightweight canvas, own rAF loop, paused off-
 * screen (IntersectionObserver) and under reduced-motion — the brain's orbit
 * controls and region-pick are untouched, this is a static backdrop only.
 */
export default function HeroParticles({ variant = 'light' }: HeroParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const webglSupported = useWebGLSupport();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !webglSupported) return;

    const { amountX, amountY } = getParticleCounts();
    const numParticles = amountX * amountY;

    const positions = new Float32Array(numParticles * 3);
    const indices = new Float32Array(numParticles * 2);
    let i = 0;
    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        positions[i * 3] = ix * SEPARATION - (amountX * SEPARATION) / 2;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = iy * SEPARATION - (amountY * SEPARATION) / 2;
        indices[i * 2] = ix;
        indices[i * 2 + 1] = iy;
        i++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aIndex', new THREE.BufferAttribute(indices, 2));

    const colors = variant === 'dark'
      ? { low: '#1a0a2e', mid: '#8b5cf6', high: '#c4b5fd' }
      : { low: '#0f172a', mid: '#2563eb', high: '#7dd3fc' };

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorLow: { value: new THREE.Color(colors.low) },
        uColorMid: { value: new THREE.Color(colors.mid) },
        uColorHigh: { value: new THREE.Color(colors.high) },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    const scene = new THREE.Scene();
    scene.add(points);

    const camera = new THREE.PerspectiveCamera(75, 1, 5, 10000);
    camera.position.set(0, 350, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const mouse = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      mouse.x = e.clientX - window.innerWidth / 2;
      mouse.y = e.clientY - window.innerHeight / 2;
    };
    const isTouch = 'ontouchstart' in window;
    if (!isTouch) window.addEventListener('pointermove', onPointerMove, { passive: true });

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let isOnScreen = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => { isOnScreen = entry.isIntersecting; },
      { threshold: 0 },
    );
    intersectionObserver.observe(container);

    const timer = new THREE.Timer();
    let frameId = 0;
    const renderFrame = () => {
      frameId = requestAnimationFrame(renderFrame);
      if (!isOnScreen) return;

      timer.update();
      if (!reducedMotion) {
        camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (-mouse.y * 0.5 + 350 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
        material.uniforms.uTime.value = timer.getElapsed();
      }
      renderer.render(scene, camera);
    };
    renderFrame();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (!isTouch) window.removeEventListener('pointermove', onPointerMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [webglSupported, reducedMotion, variant]);

  if (!webglSupported) return null;

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden="true" />;
}
