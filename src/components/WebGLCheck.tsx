/**
 * Shared WebGL support detection and fallback UI.
 * Use in any component that renders a Three.js Canvas.
 */
import { useState, useEffect } from 'react';

/** Returns false if WebGL is not available in this browser. */
export function useWebGLSupport(): boolean {
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setSupported(false);
    } catch {
      setSupported(false);
    }
  }, []);
  return supported;
}

/** Fallback banner shown when WebGL is unavailable. */
export function WebGLFallback({ feature = '3D visualization' }: { feature?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl text-center"
      style={{
        background: 'var(--color-glass-bg, rgba(255,255,255,0.06))',
        border: '1px solid var(--color-glass-border, rgba(255,255,255,0.1))',
        minHeight: 260,
      }}
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-faint, #94a3b8)' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary, #e2e8f0)' }}>
        WebGL Not Supported
      </p>
      <p className="text-xs max-w-md" style={{ color: 'var(--color-text-muted, #94a3b8)' }}>
        This {feature} requires WebGL, which is not available in your browser.
        For the best experience, use a recent version of{' '}
        <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#3b82f6' }}>Chrome</a>,{' '}
        <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#f59e0b' }}>Firefox</a>, or{' '}
        <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#10b981' }}>Edge</a>.
      </p>
    </div>
  );
}
