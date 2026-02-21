# Neural Firewall Neckband — Hardware Blueprint

> **Status:** Concept / Early Research
> **Date:** 2026-02-21
> **Origin:** [Field Journal Entry 018](../qif-framework/QIF-FIELD-JOURNAL.md#entry-018) — "Building the Moat Around the Castle"
> **Related:** [BCI Limits Equation](../qif-framework/research/bci-limits-equation.md) | [Architecture](./BRAIN_FIREWALL_ARCHITECTURE.md) | [MVP Prototype](./MVP_PROTOTYPE.md)

---

## The Idea

A neckband-style wearable that wraps around the back of the neck, like the old behind-the-neck headphones (Sony, LG Tone, etc.). It serves as the Neural Firewall's physical host, sitting between an EEG headset (like OpenBCI Cyton) and the outside world.

The neckband does two things:
1. **Ground reference** for the EEG chips (replacing the traditional ear-clip ground electrode)
2. **Security processor** running the full Neural Firewall stack (NSP + Runemate + DP noise injection)

The EEG headset captures signals. The neckband secures them before they leave the body.

---

## Architecture Diagram

```
                        ┌─────────────────────────────────┐
                        │         EEG HEADSET              │
                        │    (OpenBCI Cyton / Ganglion)     │
                        │                                   │
                        │  ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
                        │  │E1 │ │E2 │ │E3 │ │E8 │ ...     │
                        │  └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘        │
                        │    │     │     │     │           │
                        │    └─────┴─────┴─────┘           │
                        │           │ SPI/UART              │
                        │    ┌──────┴──────┐               │
                        │    │  ADS1299    │               │
                        │    │  24-bit ADC │               │
                        │    └──────┬──────┘               │
                        └───────────┼───────────────────────┘
                                    │
                          Wired ribbon cable
                          (shielded, short run)
                                    │
             ┌──────────────────────┼──────────────────────────┐
             │                 NECKBAND                         │
             │          (Behind-the-neck wearable)              │
             │                                                  │
             │  ┌──────────────────────────────────────────┐   │
             │  │           GROUND ELECTRODE                │   │
             │  │     (Ag/AgCl pad on mastoid/neck)         │   │
             │  │  Replaces traditional ear-clip ground     │   │
             │  └──────────────────────────────────────────┘   │
             │                                                  │
             │  ┌──────────────────────────────────────────┐   │
             │  │         SECURITY PROCESSOR                │   │
             │  │        (NXP i.MX RT685 or equiv)          │   │
             │  │                                           │   │
             │  │  ┌─────────┐  ┌─────────┐  ┌──────────┐ │   │
             │  │  │   L1    │  │   L2    │  │    L3    │ │   │
             │  │  │ Signal  │  │Inference│  │ Policy   │ │   │
             │  │  │Boundary │→ │ Guard   │→ │ Agent    │ │   │
             │  │  │         │  │         │  │(Runemate)│ │   │
             │  │  │ SSVEP   │  │Local-DP │  │ Scribe   │ │   │
             │  │  │ Notch   │  │ε=0.5   │  │ Staves   │ │   │
             │  │  │Impedance│  │Temporal │  │ NISS     │ │   │
             │  │  │ Guard   │  │Jitter   │  │ Triggers │ │   │
             │  │  └─────────┘  └─────────┘  └──────────┘ │   │
             │  │                                           │   │
             │  │  ┌─────────────────────────────────────┐ │   │
             │  │  │        NSP TRANSPORT ENGINE          │ │   │
             │  │  │  ML-KEM-768 + AES-256-GCM-SIV       │ │   │
             │  │  │  Delta+LZ4 compression               │ │   │
             │  │  │  Merkle tree signature amortization   │ │   │
             │  │  └─────────────────────────────────────┘ │   │
             │  └──────────────────────────────────────────┘   │
             │                                                  │
             │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
             │  │ BLE 5.0  │  │ Battery  │  │ USB-C        │  │
             │  │ Radio    │  │ Li-Po    │  │ Charge/Debug │  │
             │  │ (nRF9160)│  │ 500mAh   │  │              │  │
             │  └────┬─────┘  └──────────┘  └──────────────┘  │
             │       │                                          │
             └───────┼──────────────────────────────────────────┘
                     │
                     │ BLE (NSP-encrypted)
                     │
              ┌──────┴──────┐
              │  GATEWAY    │
              │  (Phone /   │
              │   Laptop)   │
              │             │
              │ NSP client  │
              │ Runemate    │
              │   Forge     │
              │ Policy UI   │
              └─────────────┘
```

---

## Why a Neckband?

| Factor | Ear-clip ground (traditional) | Neckband ground |
|--------|-------------------------------|-----------------|
| **Comfort** | Pinches earlobe, falls off | Rests on neck, stable |
| **Ground quality** | Small contact area | Larger Ag/AgCl pad, better contact |
| **Space for electronics** | None (passive clip) | Room for MCU, battery, radio |
| **Aesthetics** | Clinical, obvious | Looks like regular neckband headphones |
| **Cable management** | Dangles from ear | Routes cleanly to headset |

The neckband form factor solves two problems at once: it provides a better ground reference AND it gives you a physical location to house the security processor without adding bulk to the headset itself.

---

## Hardware Constraints (from BCI Limits Equation)

The neckband is non-invasive, so the thermal ceiling (1°C tissue rise, 15-40mW) does not apply. But power and size still matter for wearability.

### Target Specs

| Parameter | Target | Rationale |
|-----------|--------|-----------|
| **MCU** | NXP i.MX RT685 (Cortex-M33 @ 300MHz + HiFi4 DSP) | Hardware crypto engine, 4.5MB SRAM, enough for NSP+Runemate |
| **SRAM** | 4.5 MB | Streaming buffers, LZ4 window (4KB), Scribe context (64KB) |
| **Flash** | 16 MB (QSPI) | Scribe executable (200KB) + NIST policy matrices (32KB) + firmware |
| **Radio** | nRF9160 companion (BLE 5.0) | Proven BLE stack, low power |
| **Battery** | 500 mAh Li-Po | ~8-12 hours with duty cycling |
| **Weight** | < 40g total | Comparable to LG Tone neckband headphones |
| **Charging** | USB-C | Standard, no proprietary charger |
| **Ground electrode** | Ag/AgCl pad (2cm x 3cm) | Neck/mastoid contact, low impedance |

### Power Budget (Non-invasive, battery-powered)

| Component | Active Power | Duty-Cycled Avg |
|-----------|-------------|-----------------|
| i.MX RT685 (DSP active) | ~25 mW | ~8 mW (30% duty) |
| nRF9160 BLE TX | ~15 mW | ~3 mW (20% duty) |
| AES-256-GCM-SIV (hardware) | ~5 mW | ~2 mW |
| LZ4 compression | ~2 mW | ~1 mW |
| Misc (voltage reg, LED) | ~3 mW | ~3 mW |
| **Total** | **~50 mW** | **~17 mW avg** |

At 17 mW average from a 500 mAh / 3.7V cell (1.85 Wh), runtime = ~109 hours theoretical, ~12 hours practical (accounting for BLE overhead, peak crypto bursts, and battery derating).

---

## OpenBCI Integration

### Cyton Board (8-channel, ADS1299)

| Spec | Value |
|------|-------|
| Channels | 8 (16 with Daisy) |
| ADC | TI ADS1299, 24-bit |
| Sample rate | 250 SPS (125 SPS with Daisy) |
| Input noise | 0.09-0.14 uVrms |
| Interface | SPI (on-board), Bluetooth (via RFDuino dongle) |
| Gain | Programmable: 1, 2, 4, 6, 8, 12, 24x |
| Power | 3.3V digital, ±2.5V analog |

### Connection Strategy

The neckband intercepts the data path between the Cyton's ADC output and its Bluetooth radio:

1. **Tap the SPI bus** between ADS1299 and the Cyton's on-board PIC32 microcontroller
2. Route raw 24-bit samples to the neckband's i.MX RT685 via shielded ribbon cable
3. Neckband applies L1/L2/L3 firewall pipeline
4. Neckband transmits via its own BLE radio (nRF9160) over NSP-encrypted channel
5. Cyton's original Bluetooth radio is disabled (or used as fallback in bypass mode)

**Alternative (simpler, Phase 0):** Use the Cyton's existing Bluetooth output, receive on the neckband's BLE radio, process, and re-transmit. This adds latency (~20ms) but requires zero hardware modification to the Cyton.

### Ganglion Board (4-channel, budget option)

Same architecture, fewer channels. 200 SPS, BLE native, 18-bit transmitted. Good for proof-of-concept since it's $250 cheaper than the Cyton.

---

## Ground Electrode Design

Traditional EEG requires a reference/ground electrode, typically clipped to the earlobe (A1/A2 in 10-20 system). The neckband replaces this with a larger, more comfortable contact:

```
    ┌──────────────────────────────────┐
    │          NECKBAND (top view)       │
    │                                    │
    │   Left arm ──────────── Right arm  │
    │          ╲                ╱         │
    │           ╲   ┌──────┐  ╱          │
    │            ╲  │Ground│ ╱           │
    │             ╲ │ Pad  │╱            │
    │              ╲│2x3cm │             │
    │               └──────┘             │
    │           (back of neck)           │
    └──────────────────────────────────┘
```

| Property | Spec |
|----------|------|
| Material | Ag/AgCl (silver/silver-chloride) |
| Size | ~2 cm x 3 cm (6 cm²) |
| Placement | Posterior neck, over C7 vertebra or mastoid process |
| Contact | Hydrogel adhesive pad (replaceable) |
| Impedance target | < 5 kOhm (vs 10-20 kOhm for ear clip) |

**Advantage over ear clip:** Larger surface area = lower contact impedance = cleaner ground reference = better signal quality. The neck has consistent contact pressure from the neckband's spring tension (like neckband headphones already achieve).

---

## Security Stack (On-Neckband)

Everything runs on the neckband's i.MX RT685. The EEG headset is a dumb sensor array.

### L1: Signal Boundary
- SSVEP notch filter array (8.57, 10.9, 15, 20 Hz + harmonics)
- Impedance stability monitor (50ms lockout on spike)
- HPF at 0.5 Hz (motion artifact rejection)
- Adaptive 50/60 Hz line noise notch

### L2: Inference Guard
- Local differential privacy (Laplace noise, ε=0.5)
- Temporal jitter (5-15ms random delay on BLE TX)
- MFCC guardrails (if EMG channels present, Phase 2)

### L3: Policy Agent
- Runemate Scribe (Staves v2 bytecode interpreter, < 200KB)
- NISS trigger evaluation (BI, CG, CV, RV, NP thresholds)
- Policy hot-swap via signed Stave payloads over NSP
- NIST AC-3 / SC-28 audit tagging on all outbound frames

### Transport
- NSP v0.5 session (ML-KEM-768 hybrid PQ key exchange)
- AES-256-GCM-SIV frame encryption (hardware-accelerated)
- Delta + LZ4 compression (65-90% payload reduction)
- Merkle tree signature amortization (100-frame groups, ~144 bytes/frame)
- PQ session resumption via HKDF-derived PSK tickets (< 500ms reconnect)

---

## Physical Design

```
                    ┌─── Ribbon cable to EEG headset
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    │  ┌─────────┐  │  ┌─────────┐  │
    │  │ Battery │  │  │  BLE    │  │
    │  │ 500mAh │  │  │ nRF9160 │  │
    │  │ Li-Po  │  │  │         │  │
    │  └─────────┘  │  └─────────┘  │
    │               │               │
    │  Left arm     │    Right arm  │
    │               │               │
    └───────┐   ┌───┴───┐   ┌──────┘
            │   │       │   │
            │   │ MCU   │   │
            │   │RT685  │   │
            │   │       │   │
            │   │Ground │   │
            │   │ Pad   │   │
            │   └───────┘   │
            │               │
            └───────────────┘
              (back of neck)

    Total weight: < 40g
    Dimensions: ~15cm arm-to-arm, ~2cm wide band
    Material: Medical-grade silicone + flexible PCB
    Color: Matte black (discreet)
```

---

## Feasibility Assessment (vs BCI Limits)

| Constraint | Neckband Status | Notes |
|-----------|----------------|-------|
| **Thermal** | N/A | Non-invasive, no tissue heating concern |
| **Power** | ~17 mW avg | Well within battery budget |
| **Size** | 15cm band | Fits standard neck sizes |
| **Weight** | < 40g | Lighter than LG Tone Flex (~33g) |
| **Compute** | RT685 @ 300MHz | Sufficient for NSP + Runemate at 250 SPS |
| **SRAM** | 4.5 MB | 70x more than the 64KB Scribe minimum |
| **Latency** | < 10ms added | L1+L2+L3 pipeline at 250 SPS |
| **PQC overhead** | ~20KB handshake, ~144B/frame ongoing | Amortized to near-zero per-sample |

The neckband sits comfortably within all physical constraints. Unlike invasive BCIs, we are not fighting thermodynamics. The main engineering challenge is signal integrity through the ribbon cable and ground electrode impedance.

---

## Phases

### Phase 0 — Bench Prototype (no neckband hardware)
- OpenBCI Cyton + standard ear-clip ground
- Firewall runs on host PC (Python/Rust), intercepts BLE stream
- Validates L1/L2/L3 pipeline logic

### Phase 1 — Neckband v0.1 (dev board in enclosure)
- NXP i.MX RT685 eval board in 3D-printed neckband shell
- Ag/AgCl ground pad (off-the-shelf EEG electrode taped to shell)
- Wired SPI to Cyton
- BLE out via nRF9160 DK

### Phase 2 — Neckband v0.2 (custom PCB)
- Flexible PCB designed for neckband form factor
- Integrated ground electrode
- Integrated battery + USB-C charging
- NSP + Runemate running on-device
- OpenBCI Cyton mounted on headband, ribbon cable to neckband

### Phase 3 — Integrated headset (long-term)
- Custom EEG headset with neckband as single product
- Ground electrode, security processor, and radio all integrated
- Possible EMG channels on neckband arms (jaw/neck) for subvocal input

---

## Open Questions

1. **Signal quality through ribbon cable** — Does the shielded cable between headset and neckband introduce noise? Need to measure SNR with and without.
2. **Ground electrode placement** — C7 vertebra vs mastoid process vs both? Need impedance testing on multiple subjects.
3. **OpenBCI firmware modification** — Can we disable the Cyton's on-board Bluetooth and route SPI output externally without forking their firmware?
4. **Regulatory classification** — Is a neckband that processes EEG data a medical device? Likely not for research/consumer use (same as OpenBCI), but needs legal review for clinical applications.
5. **NSP handshake over BLE** — The ML-KEM-768 handshake is ~20KB. Does this fit within BLE MTU negotiation? May need fragmentation.

---

*Concept by Kevin L. Qi. See [Field Journal Entry 018](../qif-framework/QIF-FIELD-JOURNAL.md#entry-018) for the origin story.*
