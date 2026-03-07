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

  uniform float concaveStrength;

  void main() {
    // Raw UV spans full extended grid
    vec2 rawUv = vec2(position.x / gridWidth, position.y / height);
    // Clamp to video bounds so edge pixels extend outward
    vUv = clamp(rawUv, vec2(0.0), vec2(1.0));
    vec4 color = texture2D(map, vUv);

    float depth = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vDepth = depth;

    // Fade factor: 1.0 inside video, fading to 0.0 at extended edges
    float distFromCenter = abs(rawUv.x - 0.5) * 2.0;
    vFade = 1.0 - smoothstep(0.85, 1.4, distFromCenter);

    float z = (1.0 - depth) * (farClipping - nearClipping) + nearClipping;

    // Shift coordinate origin to right-aligned (0 = right edge, -1 = left edge)
    float xNorm = position.x / gridWidth - 0.5;
    float yNorm = position.y / height - 0.5;

    // Asymmetric concave warp: left side curves more, right side subtle
    float leftDist = max(-xNorm, 0.0);  // 0 at center/right, up to 0.5 at left edge
    float rightDist = max(xNorm, 0.0);  // 0 at center/left, up to 0.5 at right edge
    float warpZ = leftDist * leftDist * concaveStrength * 14.0   // left: 70% of original
                + rightDist * rightDist * concaveStrength * 4.0;  // right: 20% intensity

    vec4 pos = vec4(
      xNorm * z * XtoZ,
      yNorm * z * YtoZ,
      -z + zOffset + warpZ,
      1.0
    );

    gl_PointSize = pointSize;
    gl_Position = projectionMatrix * modelViewMatrix * pos;
  }
`;

// Fragment shader: color variant with boosted saturation
const FRAGMENT_WHITE = `
  uniform sampler2D map;
  varying vec2 vUv;
  varying float vDepth;
  varying float vFade;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    vec4 color = texture2D(map, vUv);
    // Boost saturation and brightness for vivid depth aesthetic
    float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 saturated = mix(vec3(lum), color.rgb, 1.4); // 40% saturation boost
    vec3 bright = saturated * 1.2 + vec3(0.05); // slight lift
    float alpha = smoothstep(0.5, 0.2, dist) * 0.75 * vFade;
    gl_FragColor = vec4(bright, alpha);
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
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
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
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 10000);
    // Shift camera + orbit center right for hero so cloud fills right side
    const xShift = isGreen ? 0 : 350;
    camera.position.set(xShift, 0, 500);
    const center = new THREE.Vector3(xShift, 0, -1000);

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

    // Geometry: grid of vertices — extended width for hero to fill viewport
    const geometry = new THREE.BufferGeometry();
    const totalVerts = GRID_W * H;
    const vertices = new Float32Array(totalVerts * 3);
    for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
      vertices[i] = j % GRID_W;
      vertices[i + 1] = Math.floor(j / GRID_W);
      vertices[i + 2] = 0;
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
        pointSize: { value: 2 },
        zOffset: { value: 1000 },
        concaveStrength: { value: isGreen ? 0 : 4000 },
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
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Orbit state (smoothed)
    const orbit = { theta: 0, phi: 0 };
    const orbitRadius = 1500; // distance from center (0,0,-1000) to camera

    // Animate: orbit camera around center based on mouse
    const animate = () => {
      // Decay mouse target back to center when not moving
      mouseRef.current.x *= 0.96;
      mouseRef.current.y *= 0.96;

      // Target angles from mouse (-0.6 to 0.6 radians)
      const targetTheta = mouseRef.current.x * 0.6;
      const targetPhi = -mouseRef.current.y * 0.4;

      // Smooth interpolation
      orbit.theta += (targetTheta - orbit.theta) * 0.05;
      orbit.phi += (targetPhi - orbit.phi) * 0.05;

      // Spherical to cartesian, orbiting around center
      camera.position.x = center.x + orbitRadius * Math.sin(orbit.theta) * Math.cos(orbit.phi);
      camera.position.y = center.y + orbitRadius * Math.sin(orbit.phi);
      camera.position.z = center.z + orbitRadius * Math.cos(orbit.theta) * Math.cos(orbit.phi);
      camera.lookAt(center);

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

      {/* Left fade gradient for hero variant — seamless blend into page background */}
      {!isGreen && fullBleed && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to right, #050a08 0%, #050a08 10%, transparent 55%)',
        }} />
      )}

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
