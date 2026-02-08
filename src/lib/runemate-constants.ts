/**
 * Project Runemate Constants — derived from RUNEMATE.md and benchmark-results.json
 * Single source of truth for all Runemate values used on the site.
 */

export const RUNEMATE_VERSION = '0.1';
export const RUNEMATE_STATUS = 'PoC Complete';
export const RUNEMATE_PROJECT_NAME = 'Project Runemate';
export const RUNEMATE_TOOL_NAME = 'Runemate Forge';
export const RUNEMATE_OUTPUT_FORMAT = 'Staves';

/** Theoretical compression data (from RUNEMATE.md Section 4) */
/** Theoretical compression data — PQ overhead derived from NSP-PROTOCOL-SPEC.md Section 4.8 message structs */
export const COMPRESSION_THEORETICAL = [
  { label: 'Minimal alert', rawSize_KB: 5, stavesSize_KB: 0.5, pqHandshake_KB: 20.6, pqStavesTotal_KB: 21.1, classicalTotal_KB: 5.8, netVsClassical_KB: 15.3, netSavings: false },
  { label: 'Simple notification', rawSize_KB: 15, stavesSize_KB: 1.5, pqHandshake_KB: 20.6, pqStavesTotal_KB: 22.1, classicalTotal_KB: 15.8, netVsClassical_KB: 6.3, netSavings: false },
  { label: 'Standard UI page', rawSize_KB: 50, stavesSize_KB: 5, pqHandshake_KB: 20.6, pqStavesTotal_KB: 25.6, classicalTotal_KB: 50.8, netVsClassical_KB: -25.2, netSavings: true },
  { label: 'Rich dashboard', rawSize_KB: 200, stavesSize_KB: 20, pqHandshake_KB: 20.6, pqStavesTotal_KB: 40.6, classicalTotal_KB: 200.8, netVsClassical_KB: -160.2, netSavings: true },
  { label: 'Complex interface', rawSize_KB: 500, stavesSize_KB: 50, pqHandshake_KB: 20.6, pqStavesTotal_KB: 70.6, classicalTotal_KB: 500.8, netVsClassical_KB: -430.2, netSavings: true },
] as const;

/** PoC benchmark data (from benchmark-results.json — v0.2, NSP-derived PQ overhead) */
export const COMPRESSION_POC = [
  {
    file: 'bci-alert.html',
    originalBytes: 2393,
    stavesBytes: 911,
    compressionPercent: 61.9,
    classicalTotal: 3232,
    pqPlusStavesTotal: 22028,
    sessionsToOffset: 14,
  },
  {
    file: 'bci-dashboard.html',
    originalBytes: 20633,
    stavesBytes: 4784,
    compressionPercent: 76.8,
    classicalTotal: 21472,
    pqPlusStavesTotal: 25901,
    sessionsToOffset: 2,
  },
  {
    file: 'bci-settings.html',
    originalBytes: 10500,
    stavesBytes: 3509,
    compressionPercent: 66.6,
    classicalTotal: 11339,
    pqPlusStavesTotal: 24626,
    sessionsToOffset: 3,
  },
] as const;

/** Breakeven point — NSP-derived (pages above this size save bandwidth with PQ+Staves) */
export const BREAKEVEN_KB = 23;

/** PQ handshake overhead — derived from NSP-PROTOCOL-SPEC.md Section 4.8 message structs */
export const PQ_HANDSHAKE_OVERHEAD = {
  bytes: 21117,
  label: '~20.6 KB',
  classicalBytes: 839,
  classicalLabel: '~0.8 KB',
  deltaBytes: 20278,
  note: 'One-time per session. Amortized across all page loads.',
} as const;

/** Session amortization (the real win) — NSP-derived */
export const SESSION_AMORTIZATION = {
  pqSessionOverhead_KB: 145.3,
  overheadNote: 'Handshake delta (20.3 KB) + 60 key rotations (128.5 KB) per hour',
  savingsPerDashboardLoad_KB: 180,
  loadsPerHour: { min: 10, max: 50 },
  netSavingsPerHour_MB: { min: 1.6, max: 8.6 },
  headline: 'PQ tax pays for itself on the FIRST dashboard load',
} as const;

/** Streaming overhead (PQ adds zero per-frame cost) */
export const STREAMING_OVERHEAD = {
  symmetricCipher: 'AES-256-GCM',
  perFrameOverhead_bytes: 41,
  streamRate: '64ch @ 250 fps',
  bandwidth_KBps: 56.9,
  pqDifference: 0,
  note: 'AES-256 is already quantum-resistant. PQ algorithms only used during handshake.',
} as const;

/** Compression techniques */
export const COMPRESSION_TECHNIQUES = [
  { name: 'Tokenized DOM', mechanism: '<div class="container"> (25 B) becomes opcode + index (2 B)', savings: '85-95%' },
  { name: 'Style table dedup', mechanism: 'CSS property sets defined once, referenced by 1-byte index', savings: '85-90%' },
  { name: 'Semantic packing', mechanism: 'display (20 values = 5 bits), position (5 values = 3 bits)', savings: '70-80%' },
  { name: 'Delta encoding', mechanism: 'Repeated elements encoded as diffs from template', savings: '60-80%' },
  { name: 'JS elimination', mechanism: 'JavaScript stripped entirely (not supported on-chip)', savings: '100%' },
  { name: 'Dictionary coding', mechanism: 'Common HTML patterns become single opcodes', savings: '80-90%' },
] as const;

/** On-chip requirements */
export const ONCHIP_REQUIREMENTS = [
  { requirement: 'Secure storage', value: '128 KB', rationale: 'PQ keys + certs (46 KB) + headroom' },
  { requirement: 'SRAM for runtime', value: '128-256 KB', rationale: 'Staves interpreter + layout + framebuffer' },
  { requirement: 'Flash for firmware', value: '512 KB - 1 MB', rationale: 'Rust no_std binary + PQ primitives' },
  { requirement: 'ISA target', value: 'RISC-V or ARM Cortex-M', rationale: 'Open (RISC-V) or established (ARM)' },
  { requirement: 'Power budget', value: '<100 mW total', rationale: 'Rendering + crypto + radio' },
  { requirement: 'Key rotation', value: 'Every 30-60 seconds', rationale: '2.2 KB per rotation (negligible)' },
] as const;

/** Why Rust (language comparison from RUNEMATE.md) */
export const LANGUAGE_COMPARISON = [
  { criterion: 'Binary size (renderer)', c: '~500 KB', go: '~5-8 MB', rust: '~800 KB (no_std: ~200 KB)' },
  { criterion: 'RAM floor', c: '~64 KB', go: '~2-4 MB', rust: '~64 KB (no_std)' },
  { criterion: 'Memory safety', c: 'Manual (CVE-prone)', go: 'GC (unpredictable pauses)', rust: 'Compile-time (zero-cost)' },
  { criterion: 'Sanitization', c: 'Runtime-only', go: 'Runtime-only', rust: 'Type-level (compile error)' },
  { criterion: 'WASM target', c: 'Via Emscripten', go: '~2+ MB', rust: '~10-100 KB (native)' },
  { criterion: 'Medical device path', c: 'Established (MISRA-C)', go: 'None', rust: 'Emerging (Ferrocene IEC 62304)' },
  { criterion: 'Bare metal BCI chip', c: 'Yes', go: 'No (needs OS)', rust: 'Yes (no_std)' },
  { criterion: 'PQ crypto libraries', c: 'Good', go: 'Good', rust: 'pqcrypto-rs (safe wrapper)' },
  { criterion: 'Browser engine parts', c: 'NetSurf (old)', go: 'None', rust: 'Servo (modular crates)' },
] as const;
