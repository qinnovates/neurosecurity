/**
 * PhospheneGrid — Canvas 2D renderer showing what a cortical prosthesis patient sees.
 *
 * Based on van der Grinten et al. (2024) eLife phosphene model.
 * Each phosphene is a Gaussian blob whose size varies with eccentricity
 * (cortical magnification) and whose brightness fades with continuous stimulation.
 *
 * DISCLAIMER: Research simulation for threat modeling purposes.
 * Not a clinical instrument. Phosphene appearance is patient-specific.
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  type Phosphene,
  type ElectrodeConfig,
  ELECTRODE_CONFIGS,
  generatePhospheneMap,
  rfSceneToPhosphenes,
} from './phosphene-model';

interface PhospheneGridProps {
  width: number;
  height: number;
  configId: string;
  /** Scene objects from RF environment (normalized 0-1 coords) */
  sceneObjects: Array<{ x: number; y: number; radius: number; intensity: number }>;
  /** Sequential stimulation mode (Beauchamp 2020 skywriting) */
  sequential: boolean;
  /** Simulation time in seconds */
  time: number;
}

export default function PhospheneGrid({
  width,
  height,
  configId,
  sceneObjects,
  sequential,
  time,
}: PhospheneGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const config = useMemo(
    () => ELECTRODE_CONFIGS.find(c => c.id === configId) || ELECTRODE_CONFIGS[0],
    [configId],
  );

  const basePhosphenes = useMemo(() => generatePhospheneMap(config), [config]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use logical dimensions (DPR scaling handled by ctx.scale in the size effect)
    const w = width;
    const h = height;

    // Black background (blind person's baseline)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // Compute active phosphenes from scene
    const currentUA = config.thresholdUA * 1.8;
    let phosphenes: Phosphene[];

    if (sequential) {
      // Beauchamp 2020 skywriting: activate electrodes in sequence
      const cycleTime = 0.2; // 200ms per electrode
      const activeIdx = Math.floor((time / cycleTime) % basePhosphenes.length);
      const trailLength = 5;
      const activeObjects = sceneObjects.length > 0 ? sceneObjects : [
        { x: 0.5, y: 0.5, radius: 0.4, intensity: 0.8 },
      ];
      phosphenes = rfSceneToPhosphenes(
        basePhosphenes, activeObjects, currentUA, config.thresholdUA, 0,
      );
      // Only show trail of recently activated
      phosphenes = phosphenes.map((p, i) => {
        const dist = (activeIdx - i + basePhosphenes.length) % basePhosphenes.length;
        if (dist < trailLength && p.active) {
          return { ...p, brightness: p.brightness * (1 - dist / trailLength) };
        }
        return { ...p, brightness: 0, active: false };
      });
    } else {
      const activeObjects = sceneObjects.length > 0 ? sceneObjects : [
        { x: 0.3, y: 0.4, radius: 0.15, intensity: 0.9 },
        { x: 0.7, y: 0.5, radius: 0.12, intensity: 0.7 },
        { x: 0.5, y: 0.7, radius: 0.2, intensity: 0.6 },
      ];
      phosphenes = rfSceneToPhosphenes(
        basePhosphenes, activeObjects, currentUA, config.thresholdUA, time % 30,
      );
    }

    // Draw each phosphene as a radial gradient (Gaussian blob)
    for (const p of phosphenes) {
      if (p.brightness <= 0.01) continue;

      const cx = p.x * w;
      const cy = p.y * h;
      // Size in pixels: map degrees to pixels — enlarged for visibility in simulation
      const basePxPerDeg = Math.min(w, h) / 12;
      const radiusPx = Math.max(4, p.sizeDeg * basePxPerDeg * 0.7);

      // Boost alpha for visibility (real phosphenes are perceived as bright spots)
      const alpha = Math.min(1, p.brightness * 1.8);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusPx);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.3, `rgba(220, 230, 255, ${alpha * 0.7})`);
      grad.addColorStop(0.7, `rgba(180, 200, 255, ${alpha * 0.25})`);
      grad.addColorStop(1, `rgba(160, 180, 240, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
      ctx.fill();
    }

    // Overlay: visual field grid (faint)
    ctx.strokeStyle = 'rgba(60, 80, 120, 0.15)';
    ctx.lineWidth = 0.5;
    // Concentric eccentricity rings
    const centerX = w / 2;
    const centerY = h / 2;
    for (let deg = 2; deg <= 10; deg += 2) {
      const r = (deg / 10) * Math.min(w, h) * 0.45;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Meridians
    for (let a = 0; a < Math.PI; a += Math.PI / 4) {
      const r = Math.min(w, h) * 0.45;
      ctx.beginPath();
      ctx.moveTo(centerX - Math.cos(a) * r, centerY - Math.sin(a) * r);
      ctx.lineTo(centerX + Math.cos(a) * r, centerY + Math.sin(a) * r);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = 'rgba(100, 140, 200, 0.5)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('fovea', centerX, centerY + 4);
    ctx.fillText('2°', centerX + (2 / 10) * Math.min(w, h) * 0.45 + 12, centerY + 4);
    ctx.fillText('6°', centerX + (6 / 10) * Math.min(w, h) * 0.45 + 12, centerY + 4);
    ctx.fillText('10°', centerX + Math.min(w, h) * 0.45 + 14, centerY + 4);

    // Stats overlay
    const activeCount = phosphenes.filter(p => p.brightness > 0.01).length;
    ctx.fillStyle = 'rgba(140, 180, 255, 0.7)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${config.name}`, 8, 16);
    ctx.fillText(`${config.electrodeCount} electrodes | ${activeCount} active`, 8, 30);
    ctx.fillText(`${config.type} | ${config.thresholdUA}µA threshold`, 8, 44);
    ctx.fillText(sequential ? 'MODE: Sequential (skywriting)' : 'MODE: Simultaneous', 8, 58);

    // Disclaimer
    ctx.fillStyle = 'rgba(255, 180, 100, 0.5)';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('RESEARCH SIMULATION — NOT CLINICAL', w - 8, h - 8);
  }, [basePhosphenes, config, sceneObjects, sequential, time]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
  }, [width, height]);

  useEffect(() => {
    drawFrame();
  }, [drawFrame]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: '0.75rem',
        border: '1px solid rgba(100, 140, 200, 0.2)',
        background: '#000',
      }}
    />
  );
}
