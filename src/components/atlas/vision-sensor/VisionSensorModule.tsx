/**
 * VisionSensorModule — Orchestrator for the RF→Cortical Vision simulation.
 *
 * Three panels:
 *   1. RF Environment (Three.js) — room with WiFi/BLE wave propagation
 *   2. Phosphene Grid (Canvas 2D) — what the patient sees
 *   3. Visual Cortex Diagram (SVG) — V1-V5 hierarchy with active regions
 *
 * The novel pipeline (no published work connects these):
 *   WiFi CSI → scene inference → phosphene rendering → V1 stimulation mapping
 *
 * All parameters from published sources. See phosphene-model.ts for citations.
 */

import { useState, useEffect, useCallback } from 'react';
import RFEnvironment from './RFEnvironment';
import PhospheneGrid from './PhospheneGrid';
import VisualCortexDiagram from './VisualCortexDiagram';
import { ELECTRODE_CONFIGS, RF_LIMITS } from './phosphene-model';

const S: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'var(--font-sans, system-ui)',
    color: 'var(--color-text-primary, #e2e8f0)',
    background: 'rgba(10, 14, 26, 0.95)',
    borderRadius: '1rem',
    padding: '1.5rem',
    border: '1px solid rgba(100, 140, 200, 0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading, system-ui)',
    margin: 0,
  },
  badge: {
    fontSize: '0.6875rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '9999px',
    background: 'rgba(255, 180, 100, 0.15)',
    color: 'rgba(255, 180, 100, 0.8)',
    border: '1px solid rgba(255, 180, 100, 0.2)',
  },
  panels: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 200px',
    gap: '1rem',
    marginBottom: '1rem',
  },
  panelLabel: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'rgba(140, 180, 255, 0.6)',
    marginBottom: '0.5rem',
  },
  controls: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    marginBottom: '1rem',
    alignItems: 'center',
  },
  select: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-mono, monospace)',
    background: 'rgba(30, 40, 60, 0.8)',
    border: '1px solid rgba(100, 140, 200, 0.2)',
    borderRadius: '0.375rem',
    color: '#e2e8f0',
  },
  toggleBtn: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    borderRadius: '0.375rem',
    cursor: 'pointer',
    border: '1px solid rgba(100, 140, 200, 0.3)',
    background: 'rgba(30, 40, 60, 0.8)',
    color: '#e2e8f0',
  },
  toggleActive: {
    background: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  signalBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(15, 20, 35, 0.8)',
    borderRadius: '0.5rem',
    border: '1px solid rgba(100, 140, 200, 0.1)',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono, monospace)',
    color: 'rgba(200, 210, 240, 0.7)',
  },
  signalLabel: {
    fontSize: '0.625rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'rgba(100, 140, 200, 0.5)',
    marginBottom: '0.25rem',
  },
  signalValue: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#60a5fa',
  },
  disclaimer: {
    marginTop: '1rem',
    padding: '0.625rem 0.875rem',
    background: 'rgba(255, 180, 100, 0.05)',
    border: '1px solid rgba(255, 180, 100, 0.15)',
    borderRadius: '0.5rem',
    fontSize: '0.6875rem',
    color: 'rgba(255, 180, 100, 0.6)',
    lineHeight: 1.5,
  },
  pipelineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: 'rgba(15, 20, 35, 0.6)',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono, monospace)',
    color: 'rgba(200, 210, 240, 0.7)',
    overflowX: 'auto' as const,
  },
  pipelineStep: {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    whiteSpace: 'nowrap' as const,
  },
  arrow: {
    color: 'rgba(100, 140, 200, 0.4)',
    fontSize: '0.875rem',
  },
};

export default function VisionSensorModule() {
  const [configId, setConfigId] = useState('cortivis');
  const [sequential, setSequential] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Animation loop
  useEffect(() => {
    if (!playing) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      setTime(t => t + (now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Simulated scene objects (would come from RF sensing in a real system)
  const sceneObjects = [
    { x: 0.4, y: 0.35, radius: 0.25, intensity: 0.95 }, // Person (large, close)
    { x: 0.7, y: 0.55, radius: 0.18, intensity: 0.7 },  // Furniture
    { x: 0.25, y: 0.7, radius: 0.15, intensity: 0.5 },  // Object
  ];

  // Active visual cortex regions based on stimulation
  const activeRegions = ['v1', 'v2']; // V1 always active with prosthetic; V2 gets feedforward

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <h2 style={S.title}>Vision Sensor Module</h2>
        <span style={S.badge}>RESEARCH SIMULATION</span>
      </div>

      {/* Pipeline visualization */}
      <div style={S.pipelineRow}>
        <span style={{ ...S.pipelineStep, background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
          WiFi CSI
        </span>
        <span style={S.arrow}>+</span>
        <span style={{ ...S.pipelineStep, background: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee' }}>
          BLE AoA
        </span>
        <span style={S.arrow}>&rarr;</span>
        <span style={{ ...S.pipelineStep, background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' }}>
          ML Scene Inference
        </span>
        <span style={S.arrow}>&rarr;</span>
        <span style={{ ...S.pipelineStep, background: 'rgba(244, 114, 182, 0.15)', color: '#f472b6' }}>
          Phosphene Encoding
        </span>
        <span style={S.arrow}>&rarr;</span>
        <span style={{ ...S.pipelineStep, background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc' }}>
          V1 Stimulation
        </span>
      </div>

      {/* Controls */}
      <div style={S.controls}>
        <select
          value={configId}
          onChange={e => setConfigId(e.target.value)}
          style={S.select}
        >
          {ELECTRODE_CONFIGS.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.electrodeCount}ch)
            </option>
          ))}
        </select>
        <button
          onClick={() => setSequential(!sequential)}
          style={{ ...S.toggleBtn, ...(sequential ? S.toggleActive : {}) }}
        >
          {sequential ? 'Sequential (Skywriting)' : 'Simultaneous'}
        </button>
        <button
          onClick={() => setPlaying(!playing)}
          style={{ ...S.toggleBtn, ...(playing ? S.toggleActive : {}) }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => setTime(0)}
          style={S.toggleBtn}
        >
          Reset
        </button>
      </div>

      {/* Three panels */}
      <div style={S.panels}>
        <div>
          <div style={S.panelLabel}>RF Environment</div>
          <RFEnvironment width={380} height={300} />
        </div>
        <div>
          <div style={S.panelLabel}>Phosphene Perception (Patient View)</div>
          <PhospheneGrid
            width={380}
            height={300}
            configId={configId}
            sceneObjects={sceneObjects}
            sequential={sequential}
            time={time}
          />
        </div>
        <div>
          <div style={S.panelLabel}>Visual Cortex</div>
          <VisualCortexDiagram
            width={200}
            height={300}
            activeRegions={activeRegions}
          />
        </div>
      </div>

      {/* Signal Dashboard */}
      <div style={S.signalBar}>
        <div>
          <div style={S.signalLabel}>WiFi 5GHz CSI</div>
          <div style={S.signalValue}>-42 dBm</div>
          <div>{RF_LIMITS.wifi_5ghz.bandwidth_mhz}MHz BW | ~{RF_LIMITS.wifi_5ghz.rangeResolutionM}m res</div>
        </div>
        <div>
          <div style={S.signalLabel}>BLE 5.1 AoA</div>
          <div style={S.signalValue}>3 beacons</div>
          <div>~{RF_LIMITS.ble_5_1.positionAccuracyM}m accuracy | {RF_LIMITS.ble_5_1.angularAccuracyDeg}° angular</div>
        </div>
        <div>
          <div style={S.signalLabel}>Scene Objects</div>
          <div style={S.signalValue}>{sceneObjects.length} detected</div>
          <div>RF-Pose: {RF_LIMITS.wifi_5ghz.poseAccuracy}</div>
        </div>
        <div>
          <div style={S.signalLabel}>Stimulation</div>
          <div style={S.signalValue}>
            {ELECTRODE_CONFIGS.find(c => c.id === configId)?.thresholdUA ?? 0}µA
          </div>
          <div>
            {sequential ? 'Sequential 200ms/electrode' : 'Simultaneous multi-electrode'}
          </div>
        </div>
        <div>
          <div style={S.signalLabel}>Simulation Time</div>
          <div style={S.signalValue}>{time.toFixed(1)}s</div>
          <div>{playing ? 'Running' : 'Paused'}</div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={S.disclaimer}>
        <strong>Research simulation for threat modeling purposes.</strong> This visualization demonstrates
        a proposed pipeline connecting RF environment sensing to cortical visual prosthetic stimulation.
        No published work connects these systems. WiFi CSI achieves pose estimation through ML inference
        over learned statistical associations, not direct imaging. Phosphene appearance is patient-specific
        and depends on individual cortical geometry and electrode placement. Consumer WiFi chipsets do not
        expose CSI data; real RF sensing requires specialized hardware. All electrode parameters from
        published clinical data (Fernández 2021 JCI, Cortigent 2026, Troyk/IIT 2024).
      </div>
    </div>
  );
}
