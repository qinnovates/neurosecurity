import * as THREE from 'three';

// Ported from the retired HeroParticles.tsx (commit 019d3a35^), vanilla three.js, no React Three Fiber.
const GRID_SPACING = 100;
const WAVE_AMPLITUDE = 50;
const COMPACT_VIEWPORT_PX = 768;
const CAMERA_HEIGHT = 350;
const CAMERA_DISTANCE = 1000;
const CAMERA_EASING = 0.05;
const POINTER_PARALLAX = 0.5;

const WAVE_VERTEX_SHADER = `
  uniform float uTime;
  attribute vec2 aIndex;
  varying float vY;

  void main() {
    float ix = aIndex.x;
    float iy = aIndex.y;
    float count = uTime * 1.5;

    float y = sin((ix + count) * 0.3) * ${WAVE_AMPLITUDE.toFixed(1)} + sin((iy + count) * 0.5) * ${WAVE_AMPLITUDE.toFixed(1)};
    vY = y;

    float scale = (sin((ix + count) * 0.3) + 1.0) * 20.0 + (sin((iy + count) * 0.5) + 1.0) * 20.0;

    vec3 pos = position;
    pos.y = y;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = scale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const WAVE_FRAGMENT_SHADER = `
  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  varying float vY;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.475) discard;

    float clamped = clamp((vY + ${WAVE_AMPLITUDE.toFixed(1)} * 2.0) / (${WAVE_AMPLITUDE.toFixed(1)} * 4.0), 0.0, 1.0);
    vec3 vColor = clamped < 0.5
      ? mix(uColorLow, uColorMid, clamped * 2.0)
      : mix(uColorMid, uColorHigh, (clamped - 0.5) * 2.0);

    float ring = smoothstep(0.35, 0.475, dist) * 0.6;
    float fill = smoothstep(0.475, 0.0, dist) * 0.45;
    gl_FragColor = vec4(vColor + ring * 0.4, fill + ring);
  }
`;

// Brand palette, low to high: periwinkle (orb colour) -> logo-dot blue -> ink white at the crests.
const WAVE_COLORS = {
  low: '#818cf8',
  mid: '#0ea5e9',
  high: '#f5f6f8',
} as const;

export interface EndWaveGrid {
  readonly amountX: number;
  readonly amountY: number;
}

export interface EndWave {
  start(): void;
  stop(): void;
  dispose(): void;
}

export interface EndWaveOptions {
  readonly reducedMotion: boolean;
}

export function getEndWaveGrid(viewportWidthPx: number): EndWaveGrid {
  const isCompact = viewportWidthPx < COMPACT_VIEWPORT_PX;
  const side = isCompact ? 30 : 50;
  return { amountX: side, amountY: side };
}

export function buildEndWaveGeometry({ amountX, amountY }: EndWaveGrid): THREE.BufferGeometry {
  const count = amountX * amountY;
  const positions = new Float32Array(count * 3);
  const gridIndices = new Float32Array(count * 2);
  const halfWidth = (amountX * GRID_SPACING) / 2;
  const halfDepth = (amountY * GRID_SPACING) / 2;

  let particle = 0;
  for (let ix = 0; ix < amountX; ix++) {
    for (let iy = 0; iy < amountY; iy++) {
      positions[particle * 3] = ix * GRID_SPACING - halfWidth;
      positions[particle * 3 + 1] = 0;
      positions[particle * 3 + 2] = iy * GRID_SPACING - halfDepth;
      gridIndices[particle * 2] = ix;
      gridIndices[particle * 2 + 1] = iy;
      particle++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aIndex', new THREE.BufferAttribute(gridIndices, 2));
  return geometry;
}

/**
 * Builds the particle wave on `canvas`. Returns null when WebGL cannot be created,
 * so the caller can keep the section's copy without the render.
 */
export function createEndWave(canvas: HTMLCanvasElement, options: EndWaveOptions): EndWave | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 5, 10000);
  camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);

  const geometry = buildEndWaveGeometry(getEndWaveGrid(window.innerWidth));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorLow: { value: new THREE.Color(WAVE_COLORS.low) },
      uColorMid: { value: new THREE.Color(WAVE_COLORS.mid) },
      uColorHigh: { value: new THREE.Color(WAVE_COLORS.high) },
    },
    vertexShader: WAVE_VERTEX_SHADER,
    fragmentShader: WAVE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
  });
  scene.add(new THREE.Points(geometry, material));

  const pointer = { x: 0, y: 0 };
  const hasPointer = !('ontouchstart' in window);
  const onPointerMove = (event: PointerEvent): void => {
    pointer.x = event.clientX - window.innerWidth / 2;
    pointer.y = event.clientY - window.innerHeight / 2;
  };
  if (hasPointer) window.addEventListener('pointermove', onPointerMove, { passive: true });

  const resize = (): void => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const startedAt = performance.now();
  let frameId: number | null = null;

  const draw = (): void => {
    camera.position.x += (pointer.x * POINTER_PARALLAX - camera.position.x) * CAMERA_EASING;
    camera.position.y += (-pointer.y * POINTER_PARALLAX + CAMERA_HEIGHT - camera.position.y) * CAMERA_EASING;
    camera.lookAt(0, 0, 0);
    material.uniforms.uTime.value = (performance.now() - startedAt) / 1000;
    renderer.render(scene, camera);
  };

  const tick = (): void => {
    draw();
    frameId = requestAnimationFrame(tick);
  };

  return {
    start(): void {
      if (options.reducedMotion) {
        draw();
        return;
      }
      if (frameId === null) frameId = requestAnimationFrame(tick);
    },
    stop(): void {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
    },
    dispose(): void {
      this.stop();
      if (hasPointer) window.removeEventListener('pointermove', onPointerMove);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
