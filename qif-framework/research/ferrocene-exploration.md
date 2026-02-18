---
title: "Ferrocene: Safety-Critical Rust Compiler for BCI Devices"
status: "exploration"
updated: "2026-02-18"
---

## What Ferrocene Is

Rust's safety guarantees only hold if the compiler itself is trustworthy. For safety-critical medical devices, "trust us, it works" is not sufficient. The compiler must be independently qualified to the same standards as the device it targets. That is what Ferrocene provides.

**Ferrocene** is a safety-critical Rust compiler toolchain developed by Ferrous Systems. It is a fork of `rustc` with qualification from TUV SUD, one of the major European certification bodies. The source code is open under MIT/Apache-2.0 dual license.

## Certifications

| Domain | Standard | Level | Notes |
|--------|----------|-------|-------|
| Medical Devices | IEC 62304 | Class C | Achieved January 2025. First Rust toolchain with medical device qualification. |
| Automotive | ISO 26262 | ASIL D | Highest automotive safety level |
| Industrial | IEC 61508 | SIL 3 | Functional safety |

**First of its kind:** Ferrocene is the first Rust toolchain to achieve IEC 62304 Class C qualification for medical devices. This is the highest software safety classification under IEC 62304, required for software whose failure can result in death or serious injury.

## How Ferrocene Complements Runemate

Ferrocene operates at the **compiler layer**; Runemate operates at the **application layer**. They are complementary, not competing. Ferrocene certifies that the compiled binary faithfully represents the source code. Runemate's TARA system certifies that the source code itself produces only safe stimulation patterns.

**Concrete target:** Compile the Scribe runtime (the `no_std` bytecode interpreter from Phase 2) with Ferrocene, targeting `thumbv7em-none-eabihf` (ARM Cortex-M4F / M7F). This is the exact class of microcontroller found in implantable SoCs.

**Certified core library:** Ferrocene's qualified `core` library subset (SIL 2) covers exactly the types a `no_std` interpreter needs: `Option<T>`, `Result<T, E>`, `str`, slices, raw pointers. No heap allocation required.

**Formal specification:** The Ferrocene Language Specification (FLS) is the only formal specification of the Rust language. For a safety case argument submitted to the FDA, "the language behaves as specified in the FLS" is a concrete, auditable claim. Without a formal spec, there is no baseline to argue against.

## Layered Defense Stack

| Layer | Component | Function |
|-------|-----------|----------|
| Compiler | Ferrocene | Certified compiler produces trustworthy binaries from source |
| App Logic | TARA Safety Bounds | Compile-time validation that all outputs are within safe stimulation limits |
| Transport | NSP + PQC Encryption | Post-quantum secure wire protocol protects data in transit |

Each layer is independently verifiable. A vulnerability in one does not compromise the guarantees of the others.

## Current Limitations

- **No RISC-V support.** Only ARM Cortex-M4 and Cortex-M7 targets are qualified. RISC-V BCI SoCs would need a separate qualification effort.
- **Qualification docs are paid.** 25 EUR/month per developer for signed TUV SUD qualification documents. The compiler source code itself is free and open.
- **Application-level V&V still required.** Ferrocene certifies the compiler, not your code. The Scribe runtime itself must undergo separate verification and validation for FDA submission.

## Status

**Exploration phase.** Research is underway to evaluate Ferrocene integration with the Scribe runtime. No code has been compiled with Ferrocene yet. The qualified target (`thumbv7em-none-eabihf`) aligns with our on-chip requirements, and the certified `core` subset covers our `no_std` needs.

### Next Steps

1. Build a minimal Scribe prototype with the Ferrocene toolchain
2. Assess the qualification document workflow
3. Evaluate cost/benefit for the project's current stage
4. Test compilation of `no_std` core interpreter on Cortex-M4F target

## Research Notes

*This section is updated as research progresses.*

### 2026-02-18: Initial Assessment
- Ferrocene source: https://github.com/ferrocene/ferrocene (MIT/Apache-2.0)
- FLS (Ferrocene Language Specification): https://spec.ferrocene.dev/
- IEC 62304 Class C = highest medical software safety class (failure can cause death/serious injury)
- Key gap: no RISC-V support limits applicability to ARM-based BCI SoCs only
- Discovered via derivation session on BCI hardware limits (Entry 66)
