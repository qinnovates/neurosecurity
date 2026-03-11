import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

interface Props {
  className?: string;
  fullBleed?: boolean;
  variant?: 'white' | 'green';
}

// Vertex shader: displace vertices based on video luminance (Kinect depth style)
// Supports extended geometry — UVs outside 0..1 clamp to edge pixels
const VERTEX_SHADER = `
  uniform sampler2D map;
  uniform float width;
  uniform float height;
  uniform float nearClipping;
  uniform float farClipping;
  uniform float pointSize;
  uniform float zOffset;
  uniform float gridWidth;

  varying vec2 vUv;
  varying float vDepth;
  varying float vFade;

  const float XtoZ = 1.11146;
  const float YtoZ = 0.83359;

  uniform float uFisheye;
  uniform vec2 uMousePos;

  void main() {
    vec2 rawUv = vec2(position.x / gridWidth, position.y / height);
    vUv = clamp(rawUv, vec2(0.0), vec2(1.0));
    vec4 color = texture2D(map, vUv);

    float depth = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vDepth = depth;

    // Fade: 1.0 inside video frame, fading to 0.0 at extended edges
    float distFromCenter = abs(rawUv.x - 0.5) * 2.0;
    vFade = 1.0 - smoothstep(0.85, 1.4, distFromCenter);

    float z = (1.0 - depth) * (farClipping - nearClipping) + nearClipping;

    float xNorm = position.x / gridWidth - 0.5;
    float yNorm = position.y / height - 0.5;

    // Fisheye/concave distortion driven by mouse movement
    // Distance from mouse position in normalized space
    vec2 toMouse = vec2(xNorm, yNorm) - uMousePos * 0.5;
    float r = length(toMouse);
    // Barrel distortion: push vertices forward based on distance from center
    float barrel = r * r * uFisheye * 600.0;
    // Also scale outward slightly for 3D depth pop
    float radialPush = 1.0 + r * uFisheye * 0.3;

    // Left-only concave warp — left edge flares forward, right stays flat
    float leftDist = max(-xNorm, 0.0); // 0 at center/right, 0.5 at left edge
    float edgeY = yNorm * yNorm;
    float cornerWarp = (leftDist * leftDist + edgeY * 0.3) * 180.0;

    vec4 pos = vec4(
      xNorm * radialPush * z * XtoZ,
      yNorm * radialPush * z * YtoZ,
      -z + zOffset + barrel + cornerWarp,
      1.0
    );

    gl_PointSize = pointSize;
    gl_Position = projectionMatrix * modelViewMatrix * pos;
  }
`;

// Fragment shader: natural color + purple/blue depth layers on mouse move
const FRAGMENT_WHITE = `
  uniform sampler2D map;
  uniform float uFisheye;
  varying vec2 vUv;
  varying float vDepth;
  varying float vFade;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    vec4 color = texture2D(map, vUv);
    vec3 col = color.rgb * 1.1 + vec3(0.03);

    // Boost greens/browns toward red to make leaves pop
    float greenness = color.g - max(color.r, color.b);
    float leafMask = smoothstep(0.02, 0.15, greenness);
    col.r += leafMask * 0.4;
    col.g *= 1.0 - leafMask * 0.15;

    // Depth-based purple/blue layers when fisheye is active
    vec3 deepBlue = vec3(0.15, 0.2, 0.8);
    vec3 purple = vec3(0.55, 0.15, 0.85);
    // Near vertices get blue, far get purple
    vec3 depthTint = mix(deepBlue, purple, vDepth);
    col = mix(col, depthTint, uFisheye * 0.45);
    // Brighten edges during distortion for glow effect
    col += depthTint * uFisheye * (1.0 - vDepth) * 0.2;

    float alpha = smoothstep(0.5, 0.2, dist) * 0.7 * vFade;
    gl_FragColor = vec4(col, alpha);
  }
`;

// Fragment shader: original cyan/green Kinect aesthetic
const FRAGMENT_GREEN = `
  uniform sampler2D map;
  varying vec2 vUv;
  varying float vDepth;
  varying float vFade;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    vec4 color = texture2D(map, vUv);
    vec3 tinted = mix(color.rgb, vec3(0.0, color.g * 1.2, color.b * 0.8), 0.3);
    float alpha = smoothstep(0.5, 0.2, dist) * 0.7 * vFade;
    gl_FragColor = vec4(tinted, alpha);
  }
`;

export default function KinectVision({ className = '', fullBleed = false, variant = 'white' }: Props) {
  const isGreen = variant === 'green';
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const [scanText, setScanText] = useState('INITIALIZING DEPTH SENSOR...');
  const [videoReady, setVideoReady] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = 640;
    const H = 480;
    // Extended grid: wider for hero variant to fill widescreen
    const GRID_W = isGreen ? W : Math.round(W * 2.2);

    // Scene
    const scene = new THREE.Scene();
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, cw / ch, 1, 10000);
    camera.position.set(0, 0, 500);
    // Shift view right for hero: offset the frustum so cloud appears right-aligned
    if (!isGreen) {
      const shift = Math.round(cw * 0.3);
      camera.setViewOffset(cw, ch, -shift, 0, cw, ch);
    }
    const center = new THREE.Vector3(0, 0, -1000);

    // Video element with webm + mp4 fallback
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    // Try webm first, fallback to mp4
    const sourceWebm = document.createElement('source');
    sourceWebm.src = isGreen ? '/videos/service-dog.webm' : '/videos/IMG_3445.webm';
    sourceWebm.type = 'video/webm';
    const sourceMp4 = document.createElement('source');
    sourceMp4.src = isGreen ? '/videos/service-dog.mp4' : '/videos/IMG_3445.mp4';
    sourceMp4.type = 'video/mp4';
    video.appendChild(sourceWebm);
    video.appendChild(sourceMp4);

    video.addEventListener('canplay', () => setVideoReady(true), { once: true });

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;

    // Geometry: grid of vertices — skip every other pixel for softer look
    const STEP = 2;
    const geometry = new THREE.BufferGeometry();
    const cols = Math.floor(GRID_W / STEP);
    const rows = Math.floor(H / STEP);
    const totalVerts = cols * rows;
    const vertices = new Float32Array(totalVerts * 3);
    for (let i = 0, idx = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++, idx++) {
        vertices[idx * 3] = j * STEP;
        vertices[idx * 3 + 1] = i * STEP;
        vertices[idx * 3 + 2] = 0;
      }
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        width: { value: W },
        height: { value: H },
        gridWidth: { value: GRID_W },
        nearClipping: { value: 850 },
        farClipping: { value: 4000 },
        pointSize: { value: 3 },
        zOffset: { value: 1000 },
        uFisheye: { value: 0 },
        uMousePos: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: isGreen ? FRAGMENT_GREEN : FRAGMENT_WHITE,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    materialRef.current = material;

    const mesh = new THREE.Points(geometry, material);
    scene.add(mesh);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Start video
    video.play().catch(() => {
      const startVideo = () => { video.play(); document.removeEventListener('click', startVideo); };
      document.addEventListener('click', startVideo, { once: true });
    });

    // Mouse orbit (normalized -1 to 1 relative to container center)
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener('mousemove', onMouseMove, { passive: true });

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      if (!isGreen) {
        const shift = Math.round(w * 0.3);
        camera.setViewOffset(w, h, -shift, 0, w, h);
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    let fisheyeAmount = 0;
    let autoAngle = 0;
    // Smoothed mouse for lerping (separate from raw input)
    const smoothMouse = { x: 0, y: 0 };
    // Smooth camera offsets for 3D depth parallax
    const camOffset = { x: 0, y: 0 };

    // Animate: fixed camera base + subtle parallax offset for 3D depth
    const animate = () => {
      // Slow continuous auto-movement
      autoAngle += 0.002;

      // Smooth mouse lerp (slow follow, no snapping)
      smoothMouse.x += (mouseRef.current.x - smoothMouse.x) * 0.04;
      smoothMouse.y += (mouseRef.current.y - smoothMouse.y) * 0.04;

      // Gentle decay of raw mouse back toward center when idle
      mouseRef.current.x *= 0.985;
      mouseRef.current.y *= 0.985;

      // Fisheye intensity from mouse movement magnitude
      const mouseSpeed = Math.sqrt(smoothMouse.x ** 2 + smoothMouse.y ** 2);
      const targetFisheye = Math.min(mouseSpeed * 1.2, 0.8);
      fisheyeAmount += (targetFisheye - fisheyeAmount) * 0.06;

      // Update shader uniforms
      if (materialRef.current) {
        materialRef.current.uniforms.uFisheye.value = fisheyeAmount;
        materialRef.current.uniforms.uMousePos.value.set(
          smoothMouse.x,
          smoothMouse.y
        );
      }

      // Subtle auto-drift + mouse-driven parallax offset
      const autoX = Math.sin(autoAngle) * 30;
      const autoY = Math.cos(autoAngle * 0.7) * 15;
      const targetX = autoX + smoothMouse.x * 80;
      const targetY = autoY - smoothMouse.y * 50;

      camOffset.x += (targetX - camOffset.x) * 0.03;
      camOffset.y += (targetY - camOffset.y) * 0.03;

      // Apply offset to camera position (base at 0,0,500)
      camera.position.x = camOffset.x;
      camera.position.y = camOffset.y;
      camera.position.z = 500;
      camera.lookAt(center.x, center.y, center.z);

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      resizeObserver.disconnect();
      video.pause();
      video.removeAttribute('src');
      while (video.firstChild) video.removeChild(video.firstChild);
      video.load();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      cleanup();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cleanup, isGreen]);

  // Scan text cycling
  useEffect(() => {
    const lines = isGreen ? [
      'DEPTH SENSOR ACTIVE...',
      'OBJECT: Canis lupus familiaris',
      'CLASS: Service dog (harnessed)',
      'CONFIDENCE: 0.97',
      'HARNESS: "SERVICE DOG" — DETECTED',
      'RENDERING TO VISUAL CORTEX...',
      'POINT CLOUD: 307,200 vertices',
      'LUMINANCE DISPLACEMENT: ACTIVE',
    ] : [
      'DEPTH SENSOR ACTIVE...',
      'SCANNING ENVIRONMENT...',
      'POINT CLOUD: 307,200 vertices',
      'LUMINANCE DISPLACEMENT: ACTIVE',
      'RENDERING TO VISUAL CORTEX...',
      'DEPTH MAP: NEAR 850 / FAR 4000',
      'SIGNAL PROCESSING: NOMINAL',
      'NEURAL INTERFACE: STANDBY',
    ];
    let idx = 0;
    setScanText(lines[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % lines.length;
      setScanText(lines[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isGreen]);

  const hud = isGreen
    ? { pri: '#00ff88', sec: '#00cc6a', accent: '#00ff88', border: 'rgba(0,255,136,0.15)' }
    : { pri: '#ffffff', sec: '#ffffff', accent: '#ffffff', border: 'rgba(255,255,255,0.15)' };

  const hudTitle = isGreen ? 'KINECT DEPTH SENSOR: SERVICE DOG' : 'DEPTH SENSOR ACTIVE';
  const hudSub = isGreen ? 'For the blind — neural vision prosthetic' : 'Neural vision prosthetic';
  const hudBottom = isGreen ? 'Object recognition via BCI visual cortex stimulation' : 'BCI visual cortex rendering pipeline';

  return (
    <div className={`relative w-full overflow-hidden ${fullBleed ? '' : 'rounded-2xl'} ${className}`} style={{
      background: '#050a08',
      ...(fullBleed ? {} : { border: `1px solid ${hud.border}`, height: '480px' }),
      ...(fullBleed ? { height: '100%' } : {}),
    }}>
      {/* WebGL not supported fallback */}
      {!webglSupported && (
        <div className="absolute inset-0 flex items-center justify-center z-20" style={{ fontFamily: 'var(--font-mono, monospace)', background: '#050a08' }}>
          <div className="text-center px-6">
            <p className="text-sm text-white mb-2">WebGL is not supported in this browser.</p>
            <p className="text-xs text-zinc-400">For the full 3D experience, please use <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300">Chrome</a>, <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300">Firefox</a>, or <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300">Edge</a>.</p>
          </div>
        </div>
      )}

      {/* Three.js canvas */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Loading state */}
      {!videoReady && webglSupported && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
          <p className="text-[11px] animate-pulse" style={{ color: `${hud.pri}aa` }}>LOADING DEPTH SENSOR...</p>
        </div>
      )}



      {/* Watermark */}
      <div className="absolute bottom-3 right-3 pointer-events-none z-10" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: isGreen ? '#00ff8833' : '#ffffff33' }}>qinnovate</p>
      </div>

      {/* HUD Overlay — green variant only */}
      {isGreen && (
        <div className="absolute inset-0 pointer-events-none" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
          {/* Top-left */}
          <div className="absolute top-4 left-4">
            <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: `${hud.pri}cc` }}>
              {hudTitle}
            </p>
            <p className="text-[11px]" style={{ color: `${hud.sec}`, opacity: 0.8 }}>
              {hudSub}
            </p>
          </div>

          {/* Top-right: info */}
          <div className="absolute top-4 right-4 text-right">
            <p className="text-[10px] tracking-wider" style={{ color: `${hud.pri}66` }}>640 x 480 @ 30fps</p>
            <p className="text-[9px] mt-0.5" style={{ color: `${hud.pri}44` }}>307,200 point cloud</p>
          </div>

          {/* Bottom-left: Scan output */}
          <div className="absolute bottom-4 left-4">
            <p className="text-[10px] mb-1" style={{ color: `${hud.pri}`, opacity: 0.5 }}>
              {'>'} {scanText}<span className="animate-pulse">_</span>
            </p>
            <p className="text-[9px]" style={{ color: `${hud.sec}`, opacity: 0.4 }}>
              {hudBottom}
            </p>
          </div>

          {/* Bottom-right */}
          <div className="absolute bottom-4 right-4 text-right">
            <p className="text-[9px] tracking-[0.15em] uppercase" style={{ color: hud.pri, opacity: 0.3 }}>
              Runemate Neural Compiler
            </p>
            <p className="text-[8px]" style={{ color: hud.sec, opacity: 0.2 }}>
              Proposed BCI rendering pipeline
            </p>
          </div>

          {/* Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 relative">
              <div className="absolute top-0 left-1/2 w-px h-2 -translate-x-1/2" style={{ background: `${hud.accent}33` }} />
              <div className="absolute bottom-0 left-1/2 w-px h-2 -translate-x-1/2" style={{ background: `${hud.accent}33` }} />
              <div className="absolute top-1/2 left-0 w-2 h-px -translate-y-1/2" style={{ background: `${hud.accent}33` }} />
              <div className="absolute top-1/2 right-0 w-2 h-px -translate-y-1/2" style={{ background: `${hud.accent}33` }} />
            </div>
          </div>

          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l" style={{ borderColor: `${hud.accent}22` }} />
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r" style={{ borderColor: `${hud.accent}22` }} />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l" style={{ borderColor: `${hud.accent}22` }} />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r" style={{ borderColor: `${hud.accent}22` }} />
        </div>
      )}
    </div>
  );
}
