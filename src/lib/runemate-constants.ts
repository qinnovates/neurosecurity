/**
 * Project Runemate Constants — derived from RUNEMATE.md and benchmark-results.json
 * Single source of truth for all Runemate values used on the site.
 */

export const RUNEMATE_VERSION = '1.0';
export const RUNEMATE_STATUS = 'v1.0 — Native DSL Compiler + TARA Safety';
export const RUNEMATE_PROJECT_NAME = 'Project Runemate';
export const RUNEMATE_TOOL_NAME = 'Runemate Forge';
export const RUNEMATE_OUTPUT_FORMAT = 'Staves';

/** How BCIs work today vs. what Runemate is designing for */
export const BCI_STATE_OF_ART = {
  today: {
    label: 'Today\'s BCIs (Neuralink N1, BrainGate, etc.)',
    direction: 'Outward only',
    description: 'Record neural signals, stream them out wirelessly to an external device',
    rendering: 'Standard phone/tablet app (Swift/UIKit, Android)',
    implantRole: 'Sensor — records and transmits, renders nothing',
    processing: 'All decoding and UI rendering happens off-chip (iPhone, tablet, PC)',
  },
  future: {
    label: 'Inward-rendering BCIs (what Runemate targets)',
    direction: 'Inward — content delivered to cortex',
    description: 'Receive structured payloads and render information directly to cortical tissue',
    rendering: 'On-chip Staves interpreter drives electrode stimulation patterns',
    implantRole: 'Renderer — decodes bytecode, produces cortical percepts',
    processing: 'Decode, safety-check, and render must happen on bare metal, on-chip, with no phone in the loop',
  },
  priorArt: [
    { study: 'Beauchamp et al. 2020 (Cell)', finding: 'Drew letter shapes on V1 via microstimulation — subjects identified them', modality: 'Visual' },
    { study: 'Flesher et al. 2021 (Science)', finding: 'Produced tactile percepts via intracortical microstimulation in human S1', modality: 'Somatosensory' },
    { study: 'BrainGate (ongoing)', finding: 'Demonstrated cursor control and typing via motor cortex recordings', modality: 'Motor (outward)' },
  ],
  caveat: 'No commercial BCI ships inward rendering today. Runemate is infrastructure for the next generation.',
  citationNote: 'All citations require manual DOI verification per our Citation Verification Protocol.',
} as const;

/** Theoretical compression data — PQ overhead derived from NSP-PROTOCOL-SPEC.md Section 4.8 message structs */
export const COMPRESSION_THEORETICAL = [
  { label: 'Minimal alert', rawSize_KB: 5, stavesSize_KB: 0.5, pqHandshake_KB: 20.6, pqStavesTotal_KB: 21.1, classicalTotal_KB: 5.8, netVsClassical_KB: 15.3, netSavings: false },
  { label: 'Simple notification', rawSize_KB: 15, stavesSize_KB: 1.5, pqHandshake_KB: 20.6, pqStavesTotal_KB: 22.1, classicalTotal_KB: 15.8, netVsClassical_KB: 6.3, netSavings: false },
  { label: 'Standard UI page', rawSize_KB: 50, stavesSize_KB: 5, pqHandshake_KB: 20.6, pqStavesTotal_KB: 25.6, classicalTotal_KB: 50.8, netVsClassical_KB: -25.2, netSavings: true },
  { label: 'Rich dashboard', rawSize_KB: 200, stavesSize_KB: 20, pqHandshake_KB: 20.6, pqStavesTotal_KB: 40.6, classicalTotal_KB: 200.8, netVsClassical_KB: -160.2, netSavings: true },
  { label: 'Complex interface', rawSize_KB: 500, stavesSize_KB: 50, pqHandshake_KB: 20.6, pqStavesTotal_KB: 70.6, classicalTotal_KB: 500.8, netVsClassical_KB: -430.2, netSavings: true },
] as const;

/** v1.0 benchmark data (from cargo run --bin demo) */
export const COMPRESSION_V1_BENCHMARK = {
  sourceBytes: 1059,
  bytecodeBytes: 341,
  compressionPercent: 67.8,
  encryptionOverheadBytes: 16,
  compileEncryptMicros: 430,
  pipeline: 'PQ handshake + compile + encrypt + decrypt verified end-to-end',
} as const;

/** Legacy PoC benchmark data (from benchmark-results.json — v0.2, NSP-derived PQ overhead) */
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

/** Compression techniques — v1.0 native DSL compiler */
export const COMPRESSION_TECHNIQUES = [
  { name: 'Native DSL opcodes', mechanism: 'Purpose-built language compiles directly to bytecode — no HTML parsing overhead', savings: '65-90%' },
  { name: 'String table dedup', mechanism: 'Shared string pool with 2-byte indices; identical strings stored once', savings: '80-90%' },
  { name: 'Style table dedup', mechanism: 'Identical style sets collapsed into a single table entry, referenced by index', savings: '85-90%' },
  { name: 'Multimodal encoding', mechanism: 'Tone and pulse entries packed into 8-byte compact representations', savings: '70-80%' },
  { name: 'Closed vocabulary', mechanism: 'Compile-time rejection of unknown elements — no runtime validation needed', savings: '100%' },
  { name: 'Safety by construction', mechanism: 'No JS, no URLs, no executable code — nothing to sanitize or strip', savings: '100%' },
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

/** Multimodal modalities supported in v1.0 */
export const MULTIMODAL_MODALITIES = [
  {
    modality: 'Visual',
    staveConstruct: 'stave / layout',
    parameters: 'Position, size, color, text, borders',
    corticalTarget: 'V1-V3 (retinotopic)',
    description: 'Spatial layouts rendered as visual percepts via retinotopic electrode arrays',
  },
  {
    modality: 'Auditory',
    staveConstruct: 'tone',
    parameters: 'Frequency (Hz), duration (ms), amplitude',
    corticalTarget: 'A1 (tonotopic)',
    description: 'Frequency-mapped alerts and feedback via tonotopic cortical stimulation',
  },
  {
    modality: 'Haptic',
    staveConstruct: 'pulse',
    parameters: 'Intensity, duration (ms), location',
    corticalTarget: 'S1 (somatotopic)',
    description: 'Tactile feedback mapped to body regions via somatotopic cortical stimulation',
  },
] as const;

/** v1.0 test status — granular engineering truth */
export const FORGE_TEST_STATUS = {
  totalTests: 25,
  totalModules: 7,
  totalLines: 2740,
  modules: [
    { name: 'lib.rs', tests: 6, lines: 189, covers: 'Full compile pipeline, error handling, multimodal, input size limit' },
    { name: 'lexer.rs', tests: 4, lines: 286, covers: 'Tokenization, colors, units, comments' },
    { name: 'parser.rs', tests: 4, lines: 670, covers: 'Staves, styles, tones, full documents, depth guard' },
    { name: 'tara.rs', tests: 4, lines: 261, covers: 'Element limits, frequency, charge, bytecode size' },
    { name: 'codegen.rs', tests: 5, lines: 571, covers: 'Magic bytes, string dedup, size consistency, string/style/tone limits' },
    { name: 'disasm.rs', tests: 1, lines: 287, covers: 'Compile-disassemble roundtrip, bounds-checked reads' },
    { name: 'secure.rs', tests: 1, lines: 61, covers: 'Compile-encrypt-decrypt roundtrip' },
  ],
  knownGaps: [
    'No fuzz testing on lexer/parser',
    'No element balance assertion in codegen',
    'No Unicode control char stripping (THREAT-MODEL M8)',
    'No standalone CLI tool',
    'No benchmarks (criterion available but unused)',
    'Disassembler: no adversarial input tests',
    'Secure module: no error path coverage',
  ],
} as const;

/** Neuroscience foundations — topographic cortical maps that justify the multimodal architecture */
export const NEUROSCIENCE_FOUNDATIONS = [
  {
    modality: 'Visual',
    corticalMap: 'Retinotopic (V1-V3)',
    staveConstruct: 'stave / layout',
    keyResearch: 'Tootell et al. 1998',
    description: 'Primary visual cortex preserves spatial relationships from the retina. Neighboring points in visual space activate neighboring neurons in V1. Cortical magnification = DPI scaling for the brain.',
  },
  {
    modality: 'Auditory',
    corticalMap: 'Tonotopic (A1)',
    staveConstruct: 'tone',
    keyResearch: 'Formisano et al. 2003',
    description: 'Primary auditory cortex organizes neurons by preferred frequency. Low frequencies at one end, high at the other. The Staves tone construct maps directly to this frequency gradient.',
  },
  {
    modality: 'Somatosensory',
    corticalMap: 'Somatotopic (S1)',
    staveConstruct: 'pulse',
    keyResearch: 'Penfield 1937, Flesher et al. 2021',
    description: 'Primary somatosensory cortex maps body surface regions to cortical locations (the homunculus). Flesher et al. demonstrated tactile percepts via intracortical microstimulation in human S1.',
  },
] as const;
