/**
 * ONI Demo Video Theme - Motion Canvas
 * Psychology-optimized colors for trust, curiosity, innovation
 */

export const colors = {
  // Primary palette - deep blue-purple for sophistication
  background: '#080b16',
  backgroundLight: '#0d0f1a',
  backgroundMid: '#1a1a3e',

  // Accent colors
  accent: '#00e5ff',       // Cyan - technology, clarity
  accentPurple: '#a855f7', // Purple - innovation, curiosity
  accentPink: '#ec4899',   // Pink - energy, warmth

  // Text
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textMuted: 'rgba(255, 255, 255, 0.5)',

  // Layer colors (14-layer model)
  silicon: {
    L1: '#3b82f6',  // Physical Carrier
    L2: '#2563eb',  // Signal Conditioning
    L3: '#1d4ed8',  // Analog Processing
    L4: '#1e40af',  // Digital Conversion
    L5: '#1e3a8a',  // Protocol Layer
    L6: '#172554',  // Data Transport
    L7: '#0f172a',  // Application Interface
  },
  gateway: '#a855f7',  // L8 - Neural Gateway (purple)
  biology: {
    L9: '#4ade80',   // Signal Processing (Filtering)
    L10: '#22c55e',  // Neural Protocol (Encoding)
    L11: '#16a34a',  // Cognitive Transport (Delivery)
    L12: '#15803d',  // Cognitive Session (Context)
    L13: '#166534',  // Semantic Layer (Intent)
    L14: '#14532d',  // Identity Layer (Self)
  },

  // Security states
  safe: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

// Easing functions (Apple-style)
export const easing = {
  // Smooth deceleration
  out: (t: number) => 1 - Math.pow(1 - t, 4),
  // Smooth acceleration
  in: (t: number) => Math.pow(t, 4),
  // Smooth both
  inOut: (t: number) => t < 0.5
    ? 8 * Math.pow(t, 4)
    : 1 - Math.pow(-2 * t + 2, 4) / 2,
  // Spring-like bounce
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};
