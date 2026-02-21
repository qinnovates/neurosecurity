# Future Work: Live BCI Device Rendering on Website

**Status:** Planned (pending hardware testing)
**Priority:** Medium
**Target:** Post-v1.0
**Author:** Kevin Qi
**Created:** 2026-02-02

---

## Summary

When a visitor enables BCI-friendly mode via the dedicated BCI toggle on the website, render live or simulated content driven by an actual BCI device. This transforms the BCI toggle from a UI accommodation into a demonstration of the technology the framework is designed to protect.

## Motivation

The current BCI toggle applies CSS accommodations (large targets, no hover, paginated nav). That's necessary but passive — it adapts the site for BCI users without showing what BCI can do. This enhancement would:

1. **Demonstrate BCI in context** — Visitors see real neural signal data rendered on the page they're already browsing
2. **Validate the framework experientially** — ONI's 14-layer model becomes tangible when you can see actual signals flowing through layers
3. **Attract researchers and collaborators** — A live BCI demo is a compelling proof-of-concept that invites contribution
4. **Dogfood our own accessibility work** — Testing with a real device surfaces issues no spec can predict

## Concept

When BCI mode is toggled ON:

- **If a BCI device is connected** (detected via Web Bluetooth, Web Serial, or WebSocket bridge):
  - Stream live EEG/neural data from the device
  - Render real-time visualizations (e.g., brainwave spectrum, coherence metric computed live)
  - Overlay signal data onto existing ONI visualizations (layer explorer, wave spectrum)
  - Show the user's own neural coherence score in real-time

- **If no device is connected** (fallback):
  - Show a simulated demo using synthetic data from `qif-lab/src/synthetic_data.py`
  - Offer a "Connect Device" prompt with supported hardware list
  - Link to documentation on setting up a BCI device with the site

## Hardware Candidates for Testing

| Device | Interface | Data | Price Range | Notes |
|--------|-----------|------|-------------|-------|
| **OpenBCI Cyton** | Serial / WiFi | 8-16ch EEG | ~$500-1000 | Open source, well-documented |
| **Muse 2 / Muse S** | Bluetooth LE | 4ch EEG | ~$250-400 | Consumer-grade, good for demos |
| **Emotiv EPOC X** | Bluetooth | 14ch EEG | ~$850 | Research-grade, SDK available |
| **Neurosity Crown** | WiFi | 8ch EEG | ~$1000 | Developer-focused, JS SDK |

**Primary candidate for initial testing:** TBD after hands-on evaluation.

## Technical Architecture

```
BCI Device
    │
    ├── Web Bluetooth API (Muse, Emotiv)
    ├── Web Serial API (OpenBCI)
    └── WebSocket bridge (any device via local server)
         │
         ▼
Browser: BCI Data Stream
    │
    ├── Signal Processing (bandpass filter, artifact rejection)
    │   └── Use Web Workers for real-time DSP
    │
    ├── Coherence Computation
    │   └── Port qif_equations.py coherence metric to JS
    │
    └── Visualization Rendering
        ├── Wave Spectrum Explorer (viz 11) — live brainwave overlay
        ├── ONI Layer Explorer (viz 02) — signal flow through layers
        └── New: Real-Time Coherence Dashboard
```

## Implementation Phases

### Phase A: Hardware Acquisition & Testing
- Acquire 1-2 BCI devices from candidates above
- Test signal quality, latency, and browser API compatibility
- Document findings in this file

### Phase B: Browser-Device Bridge
- Implement Web Bluetooth / Web Serial connection handler
- Build WebSocket bridge for devices without direct browser support
- Create device detection and pairing UI

### Phase C: Signal Processing Pipeline
- Port essential DSP (bandpass, notch filter, artifact rejection) to JS Web Workers
- Port coherence metric from `qif_equations.py` to browser-compatible JS
- Validate JS implementation against Python reference (must match within tolerance)

### Phase D: Visualization Integration
- Overlay live data onto existing visualization pages
- Build real-time coherence dashboard component
- Add simulated-data fallback for visitors without hardware

### Phase E: Documentation & Demo
- Record demo video with actual device
- Write setup guide for supported hardware
- Publish as a blog post / case study

## Dependencies

- BCI toggle component: **Done** (implemented 2026-02-02 in `docs/index.html`)
- BCI feedback modal: **Done** (collects user input on what they want to see)
- Immersive whitepaper (V1): **Done** (3D curved display, AI voiceover stub, BCI-mode adaptations in `docs/whitepaper/index.html`)
- `qif_equations.py` coherence metric: **Done** (needs JS port)
- Synthetic data generator: **Done** (`qif-lab/src/synthetic_data.py`, needs JS port)
- Visualization pages: In progress (11 of 11 built, refinements ongoing)

## As-Code Compliance

Per the as-code principle:
- All signal processing must be implemented in code, not hardcoded values
- Coherence computation must reference the same constants as `qif_equations.py`
- Visualizations must be generated programmatically from live/synthetic data
- Device configuration (sample rates, channel maps, filter params) stored in config, not prose

## References

- BCI Mode specification: `MAIN/governance/ACCESSIBILITY.md` (Section 5)
- Coherence metric implementation: `qif-lab/src/qif_equations.py`
- Synthetic data generator: `qif-lab/src/synthetic_data.py`
- Web Bluetooth API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- Web Serial API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API

## Exit Criteria

- [ ] BCI device acquired and tested with browser APIs
- [ ] Device-to-browser data pipeline working (latency < 100ms)
- [ ] Coherence metric ported to JS and validated against Python reference
- [ ] Live visualization rendering on at least one existing viz page
- [ ] Simulated fallback working for visitors without hardware
- [ ] Demo video recorded
- [ ] Setup documentation published

---

*This document tracks planned work. Hardware testing must happen before implementation phases can be scoped accurately.*
