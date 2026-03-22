# Runemate

Rendering pipeline for BCI neural content delivery. Compiles semantic content into compact bytecode (Staves format) with 67.8% compression, encrypted via NSP for secure transmission to implant-class interpreters.

But Runemate is more than a compiler. It is the foundation of a neural operating system — one where patients own their interface, navigate on their own terms, and never cede control to a middleman.

## Table of Contents

- [The Mission: A Terminal for the Mind](#the-mission-a-terminal-for-the-mind)
- [Why No Browser](#why-no-browser)
- [Patient Control and Self-Sovereignty](#patient-control-and-self-sovereignty)
- [Security Architecture](#security-architecture)
- [The Steering Argument](#the-steering-argument-why-consent-is-the-core)
- [Autonomy Guardrails](#autonomy-guardrails-the-lane-keep-problem)
- [Vision Restoration Pipeline](#vision-restoration-pipeline)
- [Neural OS Architecture](#neural-os-architecture)
- [Architecture](#architecture)
- [Forge (Gateway Compiler)](#forge-gateway-compiler)
- [Building](#building)
- [Specification](#specification)

## The Mission: A Terminal for the Mind

A sighted person opens a browser, types a URL, and sees a webpage. A person with a cortical visual prosthesis will need something fundamentally different — not a browser, but a terminal.

Browsers are rendering engines built for screens. They parse HTML, execute JavaScript, render CSS, composite layers, and paint pixels. None of that maps to electrode arrays on V1. A browser is a translation layer designed for a display technology that does not exist inside the skull.

Runemate replaces the browser entirely. It compiles semantic content — what a person should see, hear, or feel — directly into electrode-addressable stimulation patterns. There is no DOM. No pixel grid. No compositor. The "rendering engine" IS the compiler, and the "display" is the visual cortex itself.

But the interface is not just about rendering. It is about control.

A terminal gives the user a direct line to the system. They can inspect what is running, modify how content is delivered, set their own preferences, build their own navigation patterns, and troubleshoot when something goes wrong. This is not a luxury — it is a medical necessity. When the device IS the patient's sensory system, they must be able to understand and control it at the most fundamental level.

With a terminal, a patient can literally design their own way of navigating information based on their preferences and cognitive style. It does not force someone new to the system to learn a prescribed interface. Instead, the terminal adapts — autodidactically — to how the user thinks and moves. The user teaches the system, not the other way around.

## Why No Browser

Browsers and app stores are middlemen. Each middleman is an additional layer, and each additional layer is an additional attack surface.

| Layer | What It Adds | What It Risks |
|-------|-------------|---------------|
| **Browser engine** | HTML/CSS/JS parsing, V8/SpiderMonkey, compositor | XSS, CSRF, memory corruption, supply chain (npm), extension attacks, fingerprinting |
| **App store** | Distribution, review, payment processing | Censorship, surveillance, forced updates, single point of compromise, vendor lock-in |
| **OS window manager** | Display server, input routing, accessibility APIs | Privilege escalation, screen capture, clipboard interception |

None of these layers exist in a neural interface. There is no screen to composite. There is no mouse to route. There is no app store review board deciding what a patient is allowed to perceive.

Runemate eliminates all three. Content goes from source to compiler to encrypted bytecode to cortical stimulation. Every unnecessary layer removed is an attack surface eliminated.

**The security argument is simple:** the fewer layers between the user and their experience, the fewer places an attacker can intervene.

## Patient Control and Self-Sovereignty

The argument for a neural terminal is the same argument that made the Unix shell indispensable: users who can inspect, modify, and script their own systems are more resilient than users who depend on opaque interfaces controlled by someone else.

For neural devices, this is not about convenience — it is about rights.

**Right to repair.** When a cortical implant is your visual system, you cannot wait for a manufacturer's scheduled update to fix a rendering artifact in your field of vision. A terminal lets you adjust stimulation parameters, recalibrate electrode mappings, and verify that firmware updates have not altered your perceptual baseline.

**Right to inspect.** Every packet entering your nervous system should be auditable. A terminal lets you examine what content is being delivered, what patterns are being generated, and what safety bounds are active. `runemate log --stream` is the neural equivalent of `tcpdump`.

**Right to customize.** Sighted users choose dark mode, font sizes, and color schemes. A patient with a cortical prosthesis should be able to adjust contrast curves, phosphene brightness, temporal refresh rates, and spatial resolution — not through a settings menu designed by someone who can see, but through direct parameter control.

**Right to disconnect.** `runemate --offline` should work. The device must function without a network connection, without a cloud service, and without phoning home. The terminal makes this verifiable.

**Autodidactic navigation.** With a terminal, each patient builds their own mental model of how to navigate information. One person might prefer spatial audio cues to locate content. Another might use haptic pulses as navigation anchors. A third might develop a completely novel interaction pattern that no UX designer anticipated. The terminal does not prescribe — it provides the primitives for users to compose their own experience.

This is the same philosophy that made Linux the foundation of every server, every supercomputer, and every Android phone: give people the tools, and they will build what they need.

## Security Architecture

A neural device cannot use passwords. The patient may not have the motor function to type one. The device may not have a keyboard. And a password transmitted to an implanted chip is a password that can be intercepted.

### Passwordless Authentication with PQKC + Biomarker MFA

Runemate's security architecture is passwordless by design, using two factors that are intrinsic to the patient:

**Factor 1: Post-Quantum Key Cryptography (PQKC)**

The NSP handshake establishes a session using ML-KEM-768 (NIST FIPS 203) for key encapsulation and ML-DSA-65 (NIST FIPS 204) for digital signatures. The device's identity is a hardware-bound keypair provisioned at implantation. There is no password to remember, no token to carry, and no credential to phish.

```
Patient Device ──── ML-KEM-768 ────► Gateway
     │                                    │
     └──── ML-DSA-65 signature ──────────►│
           (hardware-bound key)           │
                                          │
     ◄──── Encrypted session key ─────────┘
           (AES-256-GCM-SIV)
```

**Factor 2: Biomarker MFA**

The second factor is the patient themselves. Neural biomarkers — unique patterns in EEG/ECoG signals that are as individual as fingerprints — provide continuous authentication without any conscious action from the patient.

| Biomarker | Signal | Uniqueness |
|-----------|--------|------------|
| **Resting-state EEG** | Alpha rhythm signature (8-13 Hz) | Stable across sessions, unique to individual |
| **Evoked potentials** | P300/N170 response patterns | Stimulus-locked, difficult to spoof |
| **Neural handwriting** | Motor cortex activation patterns | Behavioral biometric, continuous |
| **Coherence profile** | Cross-channel phase synchrony | Structural, tied to individual connectome |

This is not a login ceremony. It is continuous, passive verification that the person using the device is the person it was calibrated for. If the biomarker drifts outside the patient's baseline envelope, the device can lock sensitive operations while maintaining basic function — the neural equivalent of a screen lock, not a shutdown.

### Capability-Based Access Control

The terminal does not grant root. It uses capability-based security, where each session, script, and command has explicitly declared capabilities:

```
# Patient session — full perceptual control, no firmware access
capabilities: [perceive.visual, perceive.auditory, perceive.haptic,
               config.contrast, config.refresh, config.spatial,
               log.read, device.status]

# Clinician session — calibration access, audit trail
capabilities: [calibrate.electrodes, calibrate.thresholds,
               log.read, log.export, device.diagnostics]

# Firmware update — one-time, cryptographically signed
capabilities: [firmware.apply]
requires: [device.owner.approval, manufacturer.signature]
```

No command can exceed its declared capabilities. `runemate config --contrast 1.2` works because the patient session includes `config.contrast`. `runemate firmware --flash` fails unless both the device owner and the manufacturer have signed the update. This is not sudo — it is a capability token system where escalation requires multi-party cryptographic consent.

### Neurorights as Access Control Flags

The five proposed neurorights map directly to access control flags on every operation:

| Neurorights | Flag | What It Controls |
|-------------|------|-----------------|
| Mental Privacy (MP) | `privacy.*` | Whether neural data can be read, exported, or shared |
| Cognitive Liberty (CL) | `liberty.*` | Whether stimulation patterns can be externally imposed |
| Mental Integrity (MI) | `integrity.*` | Whether device parameters can be modified without consent |
| Psychological Continuity (PC) | `continuity.*` | Whether changes can alter baseline perceptual experience |
| Equal Access (EA) | `access.*` | Whether content or capabilities can be restricted by provider |

These are not philosophical concepts in this architecture. They are ACL flags enforced at the protocol level. A content provider that attempts to modify stimulation parameters without the `integrity.write` capability gets a permission denied — not a policy discussion.

> **Epistemic note:** Neurorights as a concept are proposed and under active academic debate (Yuste et al. 2017, Ienca & Andorno 2017). The operational definitions used here are QIF-specific mappings for threat modeling purposes, not settled legal or philosophical standards. See [QIF Guardrails](https://qinnovate.com/guardrails/) for full context.

## The Steering Argument: Why Consent Is the Core

If we don't have free will through consent and agency, then who is driving the car if you're not steering?

That is the analogy most people will understand. And it is the design principle behind every layer of this architecture.

In a neural OS, the user controls AI through methods like subvocalization — thinking commands rather than typing them. The AI is the tool. It processes, suggests, retrieves, compiles, renders. But the decision to act, the consent to a thought becoming an action, the creative impulse that initiates a query or dismisses a suggestion — that is the human. That is what the terminal protects.

Without this boundary, AI does not augment human capability. It replaces it. The patient becomes a passenger in their own perceptual system — receiving whatever the algorithm decides to deliver, with no mechanism to inspect, reject, or redirect.

This is not a theoretical concern. It is the difference between:

- **A tool:** "Show me what's on this webpage" (patient initiates, AI compiles, Runemate delivers)
- **A feed:** Content streams continuously, selected by an algorithm, with no patient-initiated gate

The terminal ensures the first model. Every interaction begins with patient intent. Every delivery requires patient consent. The creative core — the part of cognition that decides what to think about, what to explore, what to build — stays with the human.

Neurorights (MP, CL, MI, PC, EA) are the formal expression of this principle. But the terminal is what makes them enforceable. Without a CLI, neurorights are policy. With a CLI, they are access control.

This is also why the system must protect creativity specifically. Creativity requires agency — the ability to combine ideas in unexpected ways, to follow a thought that no algorithm would predict, to say "no, show me something else." If the AI drives and the patient rides, creativity dies. Not because AI cannot generate — but because the human loses the muscle of choosing. And a muscle you do not use atrophies.

The analogy scales: if you are not steering the car, you are cargo. Neural interfaces must be steering wheels, not conveyor belts.

## Autonomy Guardrails: The Lane-Keep Problem

A car with lane-keep assist nudges you back into your lane. You can override it. A car with full autonomous driving does not ask. Where is the line for a neural interface?

### The Autonomy Spectrum

| Level | Car Analogy | Neural Equivalent | Who Steers |
|-------|------------|-------------------|------------|
| 0 | No assist | Raw BCI, no correction | Patient 100% |
| 1 | Lane-keep assist | Gait correction for nerve damage | Patient steers, system nudges |
| 2 | Lane-keep control | Active motor pattern stabilization | System steers, patient can override |
| 3 | Highway autopilot | AI manages routine motor function | System steers, patient supervises |
| 4 | Full autonomous | AI modifies thought patterns | System drives, patient is cargo |

Level 1-2 is clearly medical necessity. Level 4 is clearly a violation. The war is fought at Level 3.

### The Escalation Problem

Consider a patient with nerve damage who receives a BCI to walk again:

1. **Walk assistance** (motor cortex). Level 2. Clear medical need. Measurable physical outcome. Consent is informed because the patient understands "help me walk straight."
2. **Quit painkillers** (reward circuits, prefrontal cortex). Crosses from motor to limbic. The neuron is still a neuron, but the territory changed from muscle control to emotion regulation. The system that corrected a gait is now modifying a craving.
3. **Quit alcohol** (behavioral patterns). Still therapeutic, but the patient is now asking the BCI to modify behavioral patterns, not motor patterns. The crutch for walking has become a governor for decision-making.
4. **Run faster than body allows** (motor cortex, exceeding biological limits). The patient is asking the system to override fatigue signals. If the BCI can stimulate motor cortex past the body's safety limits, it can damage tendons, joints, and tissue.

Each step is reasonable in isolation. Together, they are a ramp from assistive tool to autonomous controller.

And both motor movement and thought patterns are neurons firing — just in different parts of the brain. If we allow assistive control over motor neurons, the same architecture can apply to cognitive neurons. The question is not whether it *can* — it is whether it *should*, and under what constraints.

### Ghost in the Shell

If the kernel has immutable rules the patient cannot override, then the patient's consciousness (the ghost) is constrained by a system (the shell) that answers to someone else — the manufacturer, the regulator, the clinician.

This is the tension. And the resolution is: **the kernel protects the hardware, not the software.**

A seatbelt does not control where you drive. It prevents the physics of a crash from killing you. The immutable kernel layer works the same way:

- **Amplitude ceiling** — the signal cannot exceed the tissue damage threshold. This is physics, not policy.
- **Rate limiting** — stimulation cannot fire faster than neurons can recover. This is biology, not opinion.
- **Thermal bounds** — the electrode array cannot heat past safe limits. This is thermodynamics.

These are not cognitive restrictions. They do not say "you cannot think that." They say "the signal cannot physically exceed what your tissue can survive." The ghost is free. The shell has material limits.

But the escalation scenario above breaks this clean separation. When the patient asks to quit alcohol, the relevant "tissue" is the reward circuit. The "safe amplitude" for modifying dopamine pathways is not a physics question — it is a neuroscience question with no settled answer. And "run faster than body allows" puts the motor cortex in conflict with the musculoskeletal system.

### The Five-Tier Guardrail Model

| Tier | Domain | Immutable? | Who Decides |
|------|--------|-----------|-------------|
| **1. Hardware safety** | Amplitude, rate, thermal limits | Yes — kernel level | Physics and biology. Not negotiable. |
| **2. Biological safety** | Tissue damage, seizure threshold | Yes — kernel level | Clinical evidence. Updated by clinician, co-signed by patient. |
| **3. Therapeutic bounds** | Dosage, duration, target region | No — configurable | Clinician sets defaults. Patient adjusts within range. |
| **4. Behavioral scope** | What the BCI is allowed to modify | No — consent-gated | Patient decides. Requires explicit informed consent per domain. |
| **5. Enhancement limits** | Beyond therapeutic into augmentation | No — policy layer | Patient + clinician + regulatory framework. Evolving. |

The kernel (Neurowall) enforces Tiers 1-2. These cannot be overridden by the patient, the clinician, or the manufacturer. They are the physics of the system.

Tiers 3-5 live in the capability system, where consent is explicit, domain-scoped, and revocable.

### Operationalized: The Addiction Scenario

The patient's walk-assist BCI was consented for motor cortex (M1). When they say "help me quit painkillers":

1. **Domain recognition.** The system recognizes the request targets limbic/prefrontal cortex — a different neural region than the consented motor scope.
2. **Consent gate.** The system requires explicit informed consent for the new domain, with clinician co-signature. The patient cannot accidentally expand their BCI's scope.
3. **Therapeutic bounds.** The clinician and patient establish bounds together — dosage, duration, success criteria, exit conditions — as a separate capability grant.
4. **Audit trail.** Everything is logged. The patient's future self, their clinician, or their advocate can review every decision.

When they then say "help me run faster than my body allows":

5. **Kernel enforcement.** The stimulation pattern would exceed musculoskeletal safety thresholds (Tier 1). Permission denied at the hardware level. Not because someone decided the patient should not want to run fast, but because the physics would damage their body.

The patient's cognitive liberty is preserved. Their body's physical limits are enforced. The ghost is free. The shell does not break.

> **Epistemic note:** The five-tier model is a proposed framework within QIF. The specific thresholds for each tier (especially Tiers 2-3) are subjects of active neuroscience research and clinical debate. No consensus exists on safe stimulation parameters for reward circuits or cognitive modification. This model is a starting point for the conversation, not a settled answer.

## Vision Restoration Pipeline

How Runemate and NSP work together to restore vision:

```
Internet Content          The Forge (Gateway)           NSP Wire              The Scribe (Implant)
─────────────────    ──────────────────────────    ───────────────    ─────────────────────────────
                     ┌─────────────────────────┐
  HTML/media    ──►  │ 1. Parse semantic content│
                     │ 2. Extract visual intent │
                     │ 3. Compile to Staves     │
                     │ 4. TARA safety check     │──► REJECT if unsafe
                     │ 5. Compress (67.8%)      │
                     │ 6. NSP encrypt (PQ)      │
                     └────────────┬────────────┘
                                  │
                          Encrypted Staves
                           bytecode (341 B
                           avg per frame)
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │ Neurowall inspection   │──► REJECT if bounds exceeded
                     │ (amplitude, rate, DoS) │
                     └────────────┬───────────┘
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │ 7. Decrypt + verify    │
                     │ 8. Decode bytecode     │
                     │ 9. Retinotopic map     │──► V1 electrode coordinates
                     │10. Stimulate cortex    │
                     └────────────────────────┘
                                  │
                                  ▼
                         Patient perceives
                         visual content
```

The same pipeline handles auditory (tonotopic mapping to A1) and haptic (somatotopic mapping to S1) content. A single Staves file can contain all three modalities, synchronized to the same timestamp.

This means a blind patient can browse a website, watch a video, read a meme, or build with AI — the same content sighted users access, compiled into a format their visual cortex can interpret. No browser required. No app store. Just a compiler, a protocol, and a terminal.

> **Epistemic note:** Cortical visual prostheses are an active area of research (Second Sight Orion, Gennaris, CORTIVIS). The pipeline described here is a proposed architecture — the retinotopic coordinate transforms, stimulation patterns, and perceptual quality are all subjects of ongoing research and have not been independently validated. Compression ratios (67.8%) are from the v1.0 Forge benchmark; clinical efficacy is unknown.

## Neural OS Architecture

Runemate is not just a compiler. It is the userspace layer of a proposed neural operating system — open-source, auditable, patient-controlled.

The architecture maps directly to Linux:

```
┌─────────────────────────────────────────────────────────────┐
│                    NEURAL OS STACK                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  Applications                              │
│  │  Runemate   │  Compiler, content delivery, rendering     │
│  │  (Userspace)│  = Programs, utilities, package manager    │
│  └──────┬──────┘                                            │
│         │                                                   │
│  ┌──────┴──────┐  Shell                                     │
│  │   Terminal  │  Patient CLI, scripting, automation        │
│  │   (Shell)   │  = bash/zsh — inspect, configure, compose  │
│  └──────┬──────┘                                            │
│         │                                                   │
│  ┌──────┴──────┐  System Calls                              │
│  │    NSP      │  Encrypted communication, key management   │
│  │  (Drivers)  │  = Device drivers, socket layer            │
│  └──────┬──────┘                                            │
│         │                                                   │
│  ┌──────┴──────┐  Kernel                                    │
│  │  Neurowall  │  Zero-trust firewall, amplitude bounds,    │
│  │  (Kernel)   │  rate limiting, DoS detection, integrity   │
│  │             │  = iptables + SELinux + kernel security     │
│  └──────┬──────┘                                            │
│         │                                                   │
│  ┌──────┴──────┐  Permissions                               │
│  │ Neurorights │  MP, CL, MI, PC, EA as ACL flags           │
│  │   (perms)   │  = File permissions + capabilities         │
│  └─────────────┘                                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Hardware: Cortical electrode array + implanted processor   │
│  = CPU + RAM + NIC                                          │
└─────────────────────────────────────────────────────────────┘
```

| Linux | Neural OS | Component |
|-------|-----------|-----------|
| Kernel | Neurowall | Zero-trust at I0 (hardware-biology boundary). Amplitude bounds, rate limiting, DoS detection |
| Device drivers | NSP | Encrypted wire protocol. PQ key exchange, session management, frame authentication |
| Userspace | Runemate | Content compilation, rendering pipeline, multimodal delivery |
| Shell (bash) | Terminal | Patient CLI. Inspect, configure, script, troubleshoot, customize |
| File permissions | Neurorights | MP, CL, MI, PC, EA as capability-based ACL flags |
| Package manager | Staves registry | Verified, signed content packages (proposed) |
| System logs | `runemate log` | Auditable record of every packet delivered to the nervous system |

### Why Open Source

The same reasons Linux won:

1. **Auditability.** Anyone can read the code that runs inside a patient's skull. No black boxes.
2. **No vendor lock-in.** A patient's perceptual system should not be tied to a single manufacturer's proprietary stack.
3. **Community security.** More eyes on the code means more vulnerabilities found before they reach patients.
4. **Longevity.** Implants outlast companies. Open-source code outlasts both.
5. **Right to fork.** If the maintainers make decisions a patient disagrees with, the patient (or their advocate) can fork the stack and run their own.

### Does the CLI Introduce New Attack Surface?

No. The CLI does not expand the attack surface beyond what already exists.

Runemate already executes bytecode — the Scribe interpreter processes arbitrary compiled content. A CLI is a structured, capability-gated interface to that same execution engine. It is a subset of what the interpreter already does, constrained by explicit capability tokens.

The Rust `no_std` runtime eliminates the class of vulnerabilities that make traditional shells dangerous: no buffer overflows (Rust's borrow checker), no heap corruption (no allocator abuse), no shell injection (no `exec()`, no string interpolation into commands). The CLI parses commands through the same recursive descent parser that handles Staves bytecode — same security properties, same input validation, same bounds checking.

A capability-based shell is strictly less powerful than the bytecode interpreter it sits on top of. It cannot do anything the interpreter cannot already do. It can only do less, with more visibility.

## Architecture

Runemate splits into two components:

| Component | Environment | Rust Mode | Size |
|-----------|-------------|-----------|------|
| **Forge** | Gateway/server | `std` | Full compiler |
| **Scribe** | Implant/device | `no_std` | ~200 KB interpreter |

The Forge compiles content from the Runemate DSL into Staves bytecode. The Scribe interprets that bytecode on-device. TARA validates every output pattern before delivery, bounding both attack severity and therapeutic safety.

## Forge (Gateway Compiler)

The `forge/` crate is the DSL-to-Staves compiler. It handles lexing, parsing, code generation, disassembly, and NSP-encrypted output.

**Modules:**

| Module | Purpose |
|--------|---------|
| `lexer.rs` | Tokenizer for the Runemate DSL |
| `parser.rs` | AST construction from token stream |
| `ast.rs` | Abstract syntax tree definitions |
| `codegen.rs` | Staves bytecode generation |
| `disasm.rs` | Bytecode disassembler |
| `secure.rs` | NSP encryption integration |
| `tara.rs` | TARA safety validation |
| `error.rs` | Error types |

Depends on `nsp-core` for post-quantum encryption of compiled output.

## Building

Requires Rust (edition 2024).

```bash
# Build the compiler
cd model/runemate/forge
cargo build

# Run tests
cargo test

# Run the demo binary
cargo run --bin demo

# Run benchmarks
cargo bench
```

## Specification

- Full DSL spec: [RUNEMATE.md](../RUNEMATE.md) (173 KB, 19 sections, ~2900 lines)
- Website: [qinnovate.com/runemate](https://qinnovate.com/runemate/)

---

*v1.0, Native DSL Compiler. Apache 2.0.*
