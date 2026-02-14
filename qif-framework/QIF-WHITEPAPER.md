# QIF Whitepaper v5.2

## QIF: Quantified Interconnection Framework for Neural Security

### A Unified Physics-Based Security Architecture for Brain-Computer Interfaces

---

> *"The brain doesn't run on ones and zeros. Its security shouldn't either."*
> — Kevin Qi

**Version:** 5.2 (Working Draft)
**Date:** 2026-02-10
**Author:** Kevin Qi
**Predecessor:** QIF Whitepaper v3.1 (2026-02-03)
**Status:** DRAFT

---

## The Three Pillars of Qinnovate

Securing a brain-computer interface is not a single problem --- it is three interlocking problems that must be solved together. Qinnovate addresses all three with an integrated stack: a threat model, a wire protocol, and a compression engine. Each pillar is independently useful, but their power is in the combination.

### QIF --- Quantified Interconnection Framework

**The threat model.** An 11-band hourglass architecture that maps every attack surface from neural tissue to synthetic systems into a single equation: `QI(b,t) = e^{-S(b,t)}`. Defines *what* to defend and *how to measure* whether it's working.

### NSP --- Neural Sensory Protocol

**The wire protocol.** A five-layer post-quantum specification that wraps every BCI data frame in ML-KEM key exchange, ML-DSA signatures, and AES-256-GCM encryption --- at 3.25% power overhead on implanted devices.

### Runemate --- Project Runemate / Runemate Forge

**The compression engine.** An HTML-to-bytecode compiler (Staves) that compresses BCI interface content 65--90%, making post-quantum encryption cost-free for pages above 23 KB. Built in Rust with IEC 62304 Class C certification path.

### Why all three are required

**QIF without NSP** is a theoretical architecture with no wire format. It can identify threats but cannot stop them in transit.

**NSP without QIF** lacks a threat model and has no signal integrity layer. It encrypts data but cannot tell whether the data itself has been manipulated at the electrode-tissue boundary.

**Both without Runemate** face a bandwidth wall. Post-quantum key sizes are 18--46x larger than classical equivalents. On a device with a 40 mW power budget transmitting over BLE, this overhead is the primary barrier to PQC adoption.

**Together:** a fully post-quantum-secured BCI stack that is feasible today, on current hardware, at 3.25% power overhead, with net bandwidth savings for typical interface content. QIF defines *what* to protect. NSP defines *how* to protect it. Runemate makes that protection *practical*.

> QIF --> threat model feeds --> NSP --> bandwidth unlocked by --> Runemate

---

## 1. Abstract

Brain-computer interfaces are advancing from experimental medical devices toward consumer technology, yet their security architectures remain grounded in classical computing paradigms. This paper presents the Quantified Interconnection Framework (QIF), an 11-band hourglass security architecture spanning the neural-synthetic boundary, and proposes a unified security equation: `QI(b,t) = e^{-S(b,t)}`. The per-band formulation is grounded in spectral decomposition via the Short-Time Fourier Transform (STFT), which serves as both the bridge from raw time-domain signals to band-indexed security scoring and the primary detection mechanism for three of five identified attack coupling mechanisms. The QI equation combines four classical signal integrity terms (phase coherence, normalized transport entropy, amplitude stability, and a scale-frequency validity check derived from `L = v/f`) with three quantum terms (indeterminacy and entanglement gated by decoherence; tunneling ungated, as it persists in classical regimes).

We identify five cross-domain attack coupling mechanisms by which synthetic-domain signals reach neural tissue, with intermodulation attacks representing the most dangerous class because they are undetectable from signal data alone. We propose the Neural Sensory Protocol (NSP), a five-layer post-quantum communication protocol integrating QI scoring with ML-KEM key exchange, ML-DSA authentication, and AES-256-GCM encryption, scaled across three device tiers and reframed as the trust layer enabling therapeutic BCI deployment.

We additionally present Project Runemate, a content compression pipeline that converts HTML to a compact bytecode format (Staves), offsetting PQC bandwidth overhead by 65--90% and achieving net bandwidth savings over classical transport for pages above 23 KB. Five falsifiability conditions are specified. QIF treats unresolved questions in quantum neuroscience, particularly the decoherence timescale in neural tissue, as tunable parameters rather than fixed assumptions. The framework degrades gracefully: if all quantum terms are zero, QIF reduces to a classical 11-band signal integrity architecture that retains independent utility.

---

## 2. Introduction

### 2.1 The Containment Principle

Every civilization that has built critical infrastructure has independently converged on a single architectural pattern: *containment*. The word "paradise" descends from the Old Persian *pairi-daeza* --- a walled enclosure designed to separate a restorative interior from a hostile exterior [74]. This is not metaphor. It is engineering.

The pattern is invariant across domains and millennia. The Theater of Epidaurus (~340 BCE) uses corrugated limestone seating as a frequency filter, suppressing crowd noise below 500 Hz while passing human speech --- a principle confirmed to be identical to modern acoustic padding [77]. Frederick Law Olmsted's Central Park (1858) implements a layered acoustic defense: walls, vegetation, sunken roads, water features, and 18,000 trees attenuate Manhattan's 85 dB street noise to 54 dB at the interior --- making the park sound four times quieter than the city surrounding it [75][76]. The blood-brain barrier (BBB) imposes a molecular weight cutoff at approximately 400 Daltons, blocking over 98% of small-molecule drugs [78]. Network firewalls, cell membranes, and Faraday cages all implement the same strategy: selective, threshold-based attenuation that preserves necessary signals while blocking harmful ones.

Seven invariant properties emerge across all containment architectures: (1) **selective permeability**; (2) **frequency-dependent attenuation**; (3) **threshold-based design**; (4) **layered redundancy**; (5) **active maintenance**; (6) **adaptation to threat spectrum**; (7) **breach consequence cascade**. Maturana and Varela (1972) formalized this in their theory of autopoiesis: a living system produces and maintains its own boundary, and that boundary is a *precondition* for cognition, not incidental to it [79].

The brain already has containment architecture, and it is layered. The BBB's endothelial tight junctions, backed by astrocyte endfeet and pericytes, have maintained neural tissue integrity for hundreds of millions of years. Beneath the BBB, **myelin sheaths** provide a second containment layer: lipid-rich insulation that maintains action potential propagation velocity and prevents signal crosstalk between adjacent axons. When myelin degrades --- whether from autoimmune demyelination (multiple sclerosis), nutritional deficiency (B12-dependent subacute combined degeneration), or chronic inflammation --- the consequences are precisely what the classical terms in Section 5.3 measure: phase coherence collapses as signals desynchronize across channels, transport entropy rises as transmission becomes unreliable, and amplitude stability deteriorates as saltatory conduction fails. The clinical result is cognitive impairment, peripheral neuropathy, and in severe cases, irreversible neural pathway reorganization. A vitamin deficiency can degrade a person's neural containment architecture to the point of incoherence. The fragility is real.

BCI electrode implantation *physically breaches* both layers, creating localized BBB disruption, immune cascades, glial scarring, and chronic neuronal loss [82]. The classical physics of what this containment protects was formalized by Hodgkin and Huxley (1952) [73], whose conductance model treats ion channels as deterministic gates --- effective, but incomplete at the nanoscale where quantum tunneling permits ion current through classically "closed" channels. Any containment architecture for BCIs must account for both classical and quantum-scale signal propagation.

QIF is, at its foundation, containment architecture for the electrode-tissue interface --- the first proposed engineered boundary designed to attenuate harmful signals below a neural damage threshold while preserving the functional signaling the interface exists to measure. The 11-band hourglass is the architecture of that boundary. The QI equation is its measurement. NSP is the protocol that enforces it.

That boundary is no longer theoretical. The devices that need it are already inside human skulls.

### 2.2 The BCI Revolution

Brain-computer interfaces have crossed a critical threshold. Neuralink's N1 implant records from 1,024 electrodes sampling at approximately 20 kHz, transmitted wirelessly over Bluetooth Low Energy [38]. What was once a laboratory instrument confined to severely disabled patients is on a trajectory toward consumer adoption.

The scale of BCI development is accelerating. The BISC platform (Columbia/Stanford, 2025) achieved 65,536 electrodes with 100 Mbps wireless bandwidth [60]. Chinese programs at NeuCyber, NeuroXess, and Wuhan University have demonstrated bidirectional interfaces with up to 65,000 channels. Merge Labs raised $252M for ultrasound-based noninvasive high-bandwidth neural interfaces. Battelle's BrainSTORMS program (DARPA N3) uses injectable magnetoelectric nanoparticles.

The concept of a brain-computer interface is not new. The reader processing this sentence is demonstrating one. Photons from a display strike the retina, triggering phototransduction cascades that propagate through the optic nerve to the visual cortex. At every synapse along this pathway, neurotransmitter vesicles dock via SNARE protein complexes involving quantum-scale energy transfers [12], and ions traverse voltage-gated channels through quantum tunneling even when the channels are classically closed [11], [14]. The information on the screen reaches the reader's neurons through a chain that already includes quantum-mechanical processes at every synaptic junction. What implanted BCIs change is not the fundamental physics but the *distance* of the tunnel: replacing centimeters of optical and neural relay with millimeters of electrode-tissue contact. The underlying quantum phenomena at the synaptic interface remain identical. This is why a security framework must be grounded in the physics of that interface rather than the engineering of the sensor alone.

### 2.3 The Security Gap

Current BCI security treats the neural interface as a classical digital system: a sensor that produces voltage readings to be encrypted, transmitted, and authenticated using standard computing paradigms. This framing misses a physical reality. The electrode-tissue interface sits at the boundary between quantum and classical physics. Ion channels are nanometer-scale structures where quantum tunneling is experimentally observed [11], [14]. Synaptic transmission involves quantum-scale energy transfers along protein alpha-helices [12].

Physics has always been part of BCI engineering. Individual physics checks exist. What nobody has done is: (1) combine them into a composite security score, (2) add scale-frequency validation as a physics constraint, (3) provide a principled extension path to quantum terms, or (4) tie band-specific scoring to neural architecture. This is the gap QIF occupies.

### 2.4 Statement of Novelty

The core novelty of the Quantified Interconnection Framework is the **synthesis of three disparate research fields --- quantum biology, BCI security, and post-quantum cryptography --- into a single, unified, and empirically falsifiable architecture.** While prior work exists in each domain individually, QIF is the first framework to formally connect them.

Specifically, the contributions are not the individual components, but their integration:

- **From Physics to Protocol.** QIF provides a continuous architectural path from quantum-scale phenomena at the electrode-tissue boundary (ion channel tunneling, decoherence dynamics) to a post-quantum cryptographic wire protocol (NSP). No other framework bridges this physical-to-digital gap.
- **A Unified Metric.** The QI equation (QI = e^{-S}) provides a single mathematical object combining classical signal integrity with hypothesized quantum terms. It makes security a measurable, physics-based quantity at the neural interface itself, rather than a property of the downstream digital system alone.
- **Mechanism-First Taxonomy.** The Locus Taxonomy and TARA registry are the first threat classification systems designed for the unique dual-use nature of neural interfaces, where attack vectors and therapeutic mechanisms share the same physics.

Previous BCI security frameworks have treated the brain as a classical data source. QIF rejects this premise and builds a new architecture from the physical reality of the neural-synthetic boundary. This synthesis creates a new paradigm for neurosecurity engineering.

### 2.5 What This Paper Delivers

This paper presents seven contributions:

1. An **11-band hourglass architecture** (v4.0) spanning the neural-synthetic boundary with 7-1-3 asymmetry, derived from neuroanatomy and quantum physics rather than networking analogy.
2. A **unified QI equation**, QI(b,t) = e^{-S(b,t)}, that subsumes the previously separate coherence metric and two candidate QI equations into a single exponential form.
3. Identification of **five cross-domain attack coupling mechanisms** and honest assessment of which attacks the QI equation can and cannot detect.
4. **TARA** (Therapeutic Atlas of Risks and Applications), a mechanism-first dual-use registry that maps every technique to its security, clinical, diagnostic, and governance projections.
5. The **Neural Sensory Protocol (NSP)**, a five-layer post-quantum communication protocol for BCI data, reframed as the trust layer enabling therapeutic deployment.
6. **Project Runemate**, a content compression pipeline that offsets PQC bandwidth overhead by 65--90%.
7. **Falsifiability conditions** specifying what experimental findings would weaken or invalidate specific framework components.

---

## 3. Background and Related Work

### 3.1 BCI Security Literature

Denning, Matsuoka and Kohno (2009) published the foundational paper "Neurosecurity: Security and Privacy for Neural Devices" in *Neurosurgical Focus*, coining the term "neurosecurity" and establishing BCI security as a formal research discipline [83]. Martinovic et al. (2012) provided the first experimental demonstration, showing that commercial EEG-based BCIs could be exploited as side-channel attack vectors to extract private information from involuntary brain responses [51]. Pycroft et al. (2016) coined "brainjacking" and enumerated 9 attack techniques specific to implanted neurostimulators [84]. Bonaci et al. (2014) showed that subliminal stimuli embedded in BCI applications could extract private information without the user's awareness [52]. Landau, Puzis and Nissim (2020) mapped attacks across BCI and communication layers in *ACM Computing Surveys* [85]. Frank et al. (2017) provided the first systematic threat taxonomy for BCI systems [53]. Bernal et al. (2022) built the most comprehensive taxonomy to date, cataloging BCI security vulnerabilities across wireless protocols, firmware, and signal processing pipelines [54].

This body of work established BCI security as a legitimate research area. However, the existing literature exhibits three gaps. First, no unified taxonomy organizes BCI threats the way MITRE ATT&CK organizes traditional cybersecurity threats --- techniques remain scattered across domain-specific papers. Second, none address quantum-scale phenomena at the electrode-tissue boundary. Third, none map the therapeutic dimension: the observation that many attack mechanisms share the same physics as established medical therapies. QIF addresses all three gaps. Spectral analysis --- specifically the Fourier transform and its derivatives --- is already foundational in network intrusion detection, side-channel analysis, and adversarial ML; QIF extends this paradigm to the neural-synthetic boundary, where frequency-domain decomposition becomes a security primitive (Section 5.4).

### 3.2 Quantum Biology

Lambert et al. (2013) surveyed evidence for quantum effects in biological systems [18]. Tegmark (2000) argued that thermal decoherence in the brain occurs on the order of 10^{-13} seconds [15]. Fisher (2015) proposed that nuclear spin states in Posner molecules could maintain coherence for hours [39]. Perry (2025), in a recent theoretical preprint, suggested collective coherence times of 1--10 ms [55]. QIF sidesteps this unresolved debate by treating the decoherence time as a tunable parameter.

### 3.3 Quantum Tunneling in Neural Systems

The classical foundation for neural signal modeling was established by Hodgkin and Huxley (1952), whose Nobel Prize-winning conductance model described action potential propagation through voltage-gated ion channels using deterministic differential equations [73]. The Hodgkin-Huxley model treats ion channels as classical gates --- either open or closed, with transition rates governed by macroscopic voltage. Subsequent work has revealed quantum-mechanical phenomena at the same ion channel scale that the classical model cannot capture. Qaswal (2019) developed mathematical models for quantum tunneling through *closed* voltage-gated ion channels [11] --- a process forbidden by the Hodgkin-Huxley framework but permitted by quantum mechanics. Summhammer et al. (2012) described quantum-mechanical ion motion within voltage-gated channels [14]. Georgiev and Glazebrook (2018) analyzed quantum physics of synaptic communication via the SNARE protein complex [12]. Kim et al. (2025) discovered under-the-barrier recollision (UBR), revealing tunneling dynamics are more complex than the WKB approximation assumes [57]. The 2025 Nobel Prize in Physics demonstrated quantum tunneling at macroscopic scales in Josephson junction circuits [56]. QIF's tunneling term $\hat{Q}_t$ is, in effect, the quantum correction to Hodgkin-Huxley: it quantifies the security-relevant leakage current that the classical model assumes to be zero.

### 3.4 Post-Quantum Cryptography

NIST finalized three post-quantum cryptography standards in 2024: ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205) [37]. Gidney and Ekera (2021) estimated RSA-2048 could be factored in approximately 8 hours with 20 million noisy qubits [33]. Gidney (2025) revised the estimate downward to fewer than 1 million noisy qubits in under one week [34]. No prior work applies post-quantum cryptography specifically to the BCI electrode-tissue interface.

### 3.5 The Gap QIF Addresses

Despite advances in BCI security, quantum biology, and post-quantum cryptography, no prior work synthesizes these three domains into a unified framework. The intersection of quantum security, quantum biology, and the unique physics of the electrode-tissue boundary remains unfilled. This is the gap QIF occupies.

---

## 4. QIF Hourglass Model (v4.0)

### 4.1 3D Hourglass Visualization Standard

The complexity of an 11-band neural-synthetic stack requires more than a 2D diagram can provide. QIF v5.2 adopts the **3D Hourglass Model** as its canonical visualization.

- **Vertical Axis (Z)**: Represents **Temporal Depth**. Lower frequencies (Delta) occupy the broader base/top, while high-frequency interfaces (I0/S1) form the narrow, high-density center.
- **Radial Axis (XY)**: Represents **State Space Complexity**. The width of each band corresponds to the number of degrees of freedom (e.g., N7 Neocortex having the highest radial extent).
- **Core Stability**: The central Scribe/Forge interaction forms the "axle" of the hourglass, representing the minimal trusted computing base (TCB) of the entire system.

### 4.2 Impact Chain Visualization

Aggregated threats are visualized using a **Neural Impact Chain (Network Graph)**. This creates a directed acyclic graph (DAG) where nodes represent hourglass bands and edges represent exploit paths (Mechanism A--E). This allow security operators to see not just *what* is targeted, but the **propagation path** through the neural hierarchy.

### 4.1 Design Principles

Three principles govern the design. **Width represents state space**: how many possible states exist at each band. The architecture is widest at the extremes and narrowest at the center. The **7-1-3 asymmetry** (7 neural bands, 1 interface band, 3 synthetic bands) reflects the real structure: two domains converging on a single bottleneck. The neural domain is wider because the brain has 500 million years of evolutionary complexity; the synthetic domain is human-designed with bounded complexity. **Bands are severity-stratified**: higher neural bands represent higher clinical severity if compromised.

### 4.2 The 11-Band Stack

**Neural Domain (Upper Hourglass) --- 7 bands, severity-stratified**

| Band | Name | Key Structures | Determinacy | QI Range |
|------|------|---------------|-------------|----------|
| N7 | Neocortex | PFC, M1, V1, A1, Broca, Wernicke, PMC, SMA, PPC | Quantum Uncertain | 0.3--0.5 |
| N6 | Limbic System | Hippocampus, BLA, insula, ACC, cingulate | Chaotic to QU | 0.2--0.4 |
| N5 | Basal Ganglia | Striatum, GPi/GPe, STN, substantia nigra | Chaotic | 0.15--0.35 |
| N4 | Diencephalon | Thalamus, hypothalamus, VIM, ANT | Stochastic to Chaotic | 0.1--0.3 |
| N3 | Cerebellum | Cerebellar cortex, deep nuclei, vermis | Stochastic | 0.1--0.25 |
| N2 | Brainstem | Medulla, pons, midbrain, reticular formation | Stochastic | 0.05--0.15 |
| N1 | Spinal Cord | Cervical, thoracic, lumbar, sacral, cauda equina | Stochastic | 0.01--0.1 |

**Interface Zone (Bottleneck)**

| Band | Name | Function | Determinacy | QI Range |
|------|------|----------|-------------|----------|
| I0 | Neural Interface | Electrode-tissue boundary, measurement/collapse | Quasi-quantum ($\Gamma_D \in (0,1)$) | 0.01--0.1 |

**Synthetic Domain (Lower Hourglass)**

| Band | Name | Function | Determinacy | QI Range |
|------|------|----------|-------------|----------|
| S1 | Analog Front-End | Amplification, filtering, ADC/DAC | Stochastic (analog noise) | 0.001--0.01 |
| S2 | Digital Processing | Decoding, algorithms, classification | Deterministic | ~0 |
| S3 | Application | Clinical software, UI, data storage | Deterministic | 0 |

### 4.3 I0: The Bottleneck

I0 is the most critical band. Unlike v2.0's "Layer 8" which was modeled as a thin boundary, I0 has real thickness: it is a quasi-quantum zone where the decoherence factor $\Gamma_D$ lies between 0 and 1. I0 is the physical layer, not an abstraction above it. The hourglass resolves a common objection: I0 is the waist --- the most physical, most constrained point in the system. It is where platinum touches tissue, where electrons become ions, where classical measurement encounters quantum states.

The bottleneck geometry means all information must pass through the narrowest point. This provides maximum security leverage: secure I0, and you secure the chokepoint through which all data flows.

### 4.4 The Classical Ceiling

The boundary between N6 (chaotic to quantum uncertain) and N7 (quantum uncertain) is the classical ceiling. Below it, all unpredictability is in principle resolvable with better measurement. Above it, the unpredictability is ontic, as established by Bell's theorem [64]. Classical security tools operate below the ceiling. QIF operates across the full spectrum.

### 4.5 Severity Stratification

The 7-band neural decomposition enables severity-aware threat assessment. An attack targeting N7 (neocortex: cognition, language, executive function) has categorically higher clinical severity than one targeting N1 (spinal cord: reflex arcs). This maps directly to medical device risk classification. The threat taxonomy (Section 6.3--6.4) assigns band-level targeting to each attack, enabling severity-scored risk assessment via the NISS framework (Section 6.5).

### 4.6 Why Three Synthetic Bands: Frequency-Regime Security

| Band | Physics Regime | Frequency Range | Attack Physics |
|------|---------------|----------------|---------------|
| S1 | Near-field (analog) | 0--10 kHz | Side-channel leakage, analog noise injection |
| S2 | Guided-wave (digital) | 10 kHz--1 GHz | Firmware exploits, fault injection |
| S3 | Far-field (RF/wireless) | 1 GHz+ | Wireless interception, protocol attacks |

---

## 5. The Unified QI Equation

### 5.1 Core Equation

$$QI(b, t) = e^{-S(b, t)}$$

> b = band index, t = time window, S = S_c + S_q, QI $\in$ (0, 1]

The exponential form is not arbitrary. It is a **Boltzmann factor**. S plays the role of "energy" (anomaly), and QI is the probability of the signal being legitimate. This is the same mathematical structure as thermal physics ($P \propto e^{-E/kT}$), Shannon entropy, and the coherence metric $C_s$ [46].

### 5.2 The Unification

Before this version, QIF maintained three separate equations: the coherence metric $C_s$ and two competing QI candidates. The key insight is that these are the same equation viewed in different mathematical spaces.

$$QI = C_s \cdot e^{-S_q}$$
$$= e^{-S_c} \cdot e^{-S_q}$$
$$= e^{-(S_c + S_q)}$$

> Log-space: additive (engineering). Real-space: multiplicative (theoretical). Same equation, different views.

### 5.3 Classical Terms ($S_c$)

$$S_c(b) = w_1 \sigma^2_\phi + w_2 H_t / \ln(N) + w_3 \sigma^2_\gamma + w_4 D_{sf}$$

| Term | Symbol | What It Measures |
|------|--------|-----------------|
| Phase coherence | $\sigma^2_\phi$ | Cross-channel phase synchronization |
| Transport entropy | $H_t / \ln(N)$ | Pathway transmission reliability (normalized) |
| Amplitude stability | $\sigma^2_\gamma$ | Signal amplitude consistency |
| Scale-frequency validity | $D_{sf}$ | Whether signal obeys L = v/f physics |

**Phase coherence** is grounded in Fries' Communication Through Coherence framework [25], [26]. **Transport entropy** uses Shannon surprise, normalized by $\ln(N)$ to ensure the term lies in ~[0, 1] regardless of channel count. **Amplitude stability** measures relative fluctuation around the baseline mean. **Scale-frequency validity ($D_{sf}$)** measures whether the signal's frequency and spatial extent obey L = v/f. The logarithmic scale handles orders-of-magnitude range.

Weights $w_1$--$w_4$ are calibratable parameters representing the relative importance of each signal integrity dimension. Their values are not yet determined experimentally. Establishing a baseline calibration using public BCI datasets (e.g., PhysioNet EEGBCI, 109 subjects) is the immediate priority outlined in Section 10.1.

**In plain English:** the classical score asks four questions about each frequency band. Are the channels in sync? Is the signal getting through reliably? Is the amplitude stable? Does the signal obey the physics of wave propagation in its medium? If any answer is "no," the score rises, and QI drops.

Each of these terms is computed *per band*, which raises a practical question: how does the system separate a raw BCI signal into individual frequency bands in the first place? The next section addresses this.

### 5.4 Spectral Decomposition: From Time Domain to Per-Band Security

The QI equation is indexed by band: `QI(b, t)`. But raw BCI signals arrive as a single time-domain voltage trace --- a composite of every frequency band superimposed. Before any band-level security scoring can occur, the signal must be decomposed into its constituent frequency components. This is the role of the **Fourier transform**.

$$X(f) = \int_{-\infty}^{\infty} x(t) \cdot e^{-i2\pi ft} \, dt$$

> Decomposes a time-domain signal x(t) into its frequency-domain representation X(f)

The analogy is a prism splitting white light into a rainbow. A raw EEG trace is "white light" --- all neural oscillations mixed together. The Fourier transform is the prism: it separates the signal into delta (0.5--4 Hz), theta (4--8 Hz), alpha (8--12 Hz), beta (12--30 Hz), and gamma (30--100+ Hz) components, each of which maps to a specific neural band in the hourglass model.

#### 5.4.1 The Signal Processing Pipeline: From Voltage to Verdict

In practice, BCI signals are non-stationary --- their frequency content changes over time. A standard Fourier transform gives global frequency content but loses temporal resolution. QIF therefore specifies the **Short-Time Fourier Transform (STFT)** as the core decomposition method. The STFT windows the signal into overlapping segments and transforms each independently, producing a **spectrogram**: a 2D map of frequency power over time. Each time-frequency bin becomes a data point for QI computation. The pipeline acts as a prism, then a set of judges for each color:

> x(t) Raw Voltage --> STFT Spectral Prism --> P(b, t) Spectrogram (Time-Frequency Map) --> S(b,t) = S_c + S_q Per-Band Scoring (Anomaly Detection) --> QI Verdict

The STFT equation that powers this decomposition:

$$STFT\{x(t)\}(\tau, f) = \int_{-\infty}^{\infty} x(t) \cdot w(t - \tau) \cdot e^{-i2\pi ft} \, dt$$

> $w(t - \tau)$ = sliding window function, $\tau$ = window center time

The detailed pipeline steps:

| Step | Operation | Output | Feeds Into |
|------|-----------|--------|-----------|
| 1 | Raw signal acquisition (S1 band) | x(t) --- voltage trace | Step 2 |
| 2 | STFT / wavelet decomposition (S2 band) | P(b, t) --- per-band power | Steps 3 & 4 |
| 3 | Per-band classical anomaly scoring | $S_c(b, t)$ | QI equation |
| 4 | Spectral anomaly detection | Attack signature flags | Coupling analysis (Section 6.1) |

#### 5.4.2 Why Spectral Decomposition Is a Security Primitive

The frequency decomposition is not just preprocessing --- it is the primary attack detection mechanism for three of the five coupling mechanisms defined in Section 6.1:

**Mechanism A (Direct) --- Spectral power spike.** An injected 40 Hz signal appears as anomalous power in the gamma band. The STFT reveals it directly: P(gamma, t) exceeds baseline. The $\sigma^2_\gamma$ term in $S_c$ catches this as amplitude instability.

**Mechanism B (Harmonic) --- Unexpected spectral peaks.** An 80 Hz attack exciting 40 Hz gamma via subharmonic resonance produces spectral energy at both 80 Hz and 40 Hz. The decomposition reveals the 80 Hz peak --- an anomalous component absent from the patient's baseline spectral fingerprint.

**Mechanism D (Temporal Interference) --- Beat frequency detection.** Two kHz-range signals (e.g., 2000 Hz + 2004 Hz) create a 4 Hz beat. The STFT shows anomalous power in the theta band *and* at the kHz carriers --- a spectral signature that no natural neural process produces. While QI alone cannot detect this from neural-band data (Section 6.2), broadband spectral monitoring at I0/S1 can.

The spectral decomposition also enables **baseline fingerprinting**: a patient's resting-state power spectrum (the relative power in each band) presents a **highly individualized signature** suitable for biometric authentication [25]. While less immutable than physical biometrics (the spectrum varies with cognitive state, fatigue, and alertness), the spectral baseline is stable enough that deviations --- unexpected energy in a band, shifted peak frequencies, anomalous cross-frequency coupling --- are reliable attack indicators even when the injected signal individually appears innocuous.

This is the formal bridge between the Fourier transform (row 7 in the Physics Table) and the per-band QI equation. Without spectral decomposition, the band index *b* in `QI(b, t)` has no computable meaning. With it, every classical term in $S_c$ --- phase coherence, transport entropy, amplitude stability, scale-frequency validity --- can be independently evaluated per band. By resolving the phase and amplitude per band, the STFT provides the necessary inputs to compute phase coherence ($\sigma^2_\phi$), transport entropy ($H_t$), and amplitude stability ($\sigma^2_\gamma$) independently for each band.

#### 5.4.3 Practical Constraints and Complementary Methods

**Artifact rejection.** Raw BCI signals are contaminated by non-neural sources: muscle activity (EMG), eye blinks (EOG), and 50/60 Hz power line noise. These artifacts create massive power fluctuations in specific bands that could be misidentified as Mechanism A attacks. Any credible implementation of the pipeline **must** include artifact detection and removal --- via independent component analysis (ICA), spatial filtering, or targeted regression --- *before* the signal reaches QI scoring. This is a preprocessing requirement at S2, not an optional enhancement.

**The time-frequency tradeoff (Heisenberg-Gabor limit).** The STFT window function w(t) imposes a fundamental resolution tradeoff: a short window provides good temporal resolution (pinpointing *when* an event occurs) but poor frequency resolution, while a long window provides good frequency resolution but poor temporal resolution. An attacker could exploit a long window by using a very short, pulsed injection that gets temporally smeared and lost. QIF implementations must tune the window size to the threat model of the specific BCI application --- therapeutic devices prioritize frequency resolution (steady-state stimulation attacks), while high-bandwidth interfaces prioritize temporal resolution (event-related attacks).

**Real-time constraints.** Implanted BCIs operate under severe power and compute budgets (typical: 40 mW, ARM Cortex-M class processor). A full STFT on every sample is expensive. QIF permits a tiered approach: a simple bandpass filter bank for real-time on-device triage (lightweight, catches Mechanism A), with the full STFT and spectral anomaly analysis computed in S2/S3 on the external processor or in offline post-hoc analysis. The real-time filter bank approach is standard in commercial BCI firmware (Medtronic Percept, Neuralink N1).

**Complementary metrics.** Two additional spectral measures strengthen attack detection beyond per-band power: **Spectral entropy** measures the disorder of the frequency distribution; an injected pure tone drastically reduces entropy in its band even at low power, catching subtle Mechanism A attacks that fall below simple power thresholds. **Cross-frequency coupling (CFC)** --- particularly phase-amplitude coupling between theta and gamma --- is a well-studied neural phenomenon whose baseline patterns are patient-specific; an attacker disrupting or mimicking CFC constitutes a more sophisticated attack that per-band power alone would miss. Both metrics can be derived from the same STFT output with minimal additional computation.

With the spectral decomposition pipeline established, we can now address the physics that governs the spatial extent of each band --- and thus the fourth classical term, $D_{sf}$, which validates whether the measured scale-frequency product falls within physically plausible bounds.

### 5.5 L = v/f: The Unified Wave Equation

$$L = v / f$$

> L = length of one wave, v = wave velocity, f = frequency

Previous versions used $\lambda$ for electromagnetic wavelength and S for neural spatial extent. These are the same physical quantity: the length of one complete oscillation measured in its medium. The only variable that changes across the BCI system is v, the propagation velocity.

**Validated Spatial Extents**

| Band | Frequency | Spatial Extent | f x S (m/s) |
|------|-----------|---------------|-------------|
| High gamma | 60--100 Hz | 0.3--5 mm | ~0.08--0.4 |
| Low gamma | 30--60 Hz | 1--10 mm | ~0.04--0.4 |
| Alpha | 8--12 Hz | 10--20 cm | 1--2 |
| Theta | 4--8 Hz | 4--5 cm | 0.24--0.40 |
| Delta | 0.5--4 Hz | 15--20 cm | 0.15--0.20 |

### 5.6 Quantum Terms ($S_q$)

$$S_q(b, t) = (1 - \Gamma_D(t)) \cdot [\psi_1 \cdot \hat{Q}_i - \psi_3 \cdot \hat{Q}_e] + \psi_2 \cdot \hat{Q}_t$$

| Term | Symbol | Formula | Gated? |
|------|--------|---------|--------|
| Indeterminacy$^\dagger$ | $\hat{Q}_i$ | $S_{vN}(\rho) / \ln(d)$ | Yes |
| Tunneling | $\hat{Q}_t$ | $e^{-2\kappa d}$ (WKB) | **No** |
| Entanglement | $\hat{Q}_e$ | $E(\rho_{AB}) / \ln(d)$ | Yes |
| Decoherence | $\Gamma_D$ | $1 - e^{-t/\tau_D}$ | N/A (is the gate) |

$^\dagger$ The indeterminacy term $\hat{Q}_i$ is derived from the von Neumann entropy of the subsystem density matrix ($S_{vN}(\rho)$), normalized by the logarithm of the Hilbert space dimension ($\ln(d)$). It quantifies the irreducible quantum uncertainty at the measurement interface, distinct from classical thermal noise. When the interface is fully decohered ($\Gamma_D \to 1$), this term is gated to zero.

> **Critical correction in v5.0:** Tunneling is ungated. Unlike indeterminacy and entanglement, quantum tunneling does not require maintained quantum coherence. Tunneling is a single-particle phenomenon that persists even in thermally noisy environments. This correction was identified during independent Gemini peer review.

**In plain English:** the quantum score captures three phenomena. Can ions tunnel through barriers they classically should not cross? Are quantum states at the interface entangled in ways an attacker could exploit or an eavesdropper could detect? And how much quantum randomness exists at the electrode tip? All three are gated by decoherence: as the warm, wet environment destroys quantum coherence, these terms fade to zero and QI reduces to a purely classical metric. The one exception is tunneling, which persists regardless of coherence because it does not require a maintained quantum state.

### 5.7 Properties of the Unified Equation

1. **Bounded.** QI lies in (0, 1]. The exponential of a non-negative quantity is always positive and at most 1.
2. **Monotonic.** Higher QI means more secure. QI = 1 means S = 0 (no anomaly).
3. **Graceful degradation.** When quantum terms are zero, $QI = e^{-S_c} = C_s$.
4. **Band-specific.** Each hourglass band receives its own QI score.
5. **Time-dependent.** The decoherence gate fades quantum terms as the system becomes classical.
6. **Composable.** Every component is a small, independently testable function.
---

## 6. Attack Surface Analysis

Section 5 defined *what* the QI equation measures and *how* spectral decomposition feeds it. This section asks the harder question: what can an attacker actually do to a BCI, and can QI catch it?

### 6.1 Five Cross-Domain Attack Coupling Mechanisms

A signal injected in the synthetic domain does not need to match the neural target frequency to cause harm. We propose this taxonomy as a contribution to BCI threat modeling.

#### Mechanism A: Direct Frequency Match

$f_{\text{attack}} = f_{\text{neural}}$

Strongest coupling. The attack signal passes through I0 with minimal attenuation. Example: a 40 Hz injection directly entrains gamma oscillations.

#### Mechanism B: Harmonic Coupling

$f_{\text{attack}} = n \cdot f_{\text{neural}}$ (coupling $\propto 1/n^2$)

Neural tissue is nonlinear and generates harmonics. An attack at 80 Hz excites 40 Hz gamma via subharmonic resonance.

#### Mechanism C: Envelope Modulation

$A(t) \cdot \sin(2\pi f_{\text{carrier}} t)$ --- tissue demodulates to $f_{\text{mod}}$

Stealth attacks. A carrier at 200 kHz modulated at 10 Hz looks like normal S2 digital processing, but the brain responds to the 10 Hz alpha envelope. Published neuroscience (tACS) [63].

#### Mechanism D: Temporal Interference

$f_{\text{beat}} = |f_1 - f_2|$ --- deep brain targeting

Published by Grossman et al. (2017) in *Cell* [63]. Two signals at 2000 Hz and 2004 Hz create a 4 Hz beat targeting theta oscillations in deep brain structures.

#### Mechanism E: Intermodulation

$f_{\text{attack}} + f_{\text{BCI}} = f_{\text{neural}}$ --- the BCI becomes the weapon

The most dangerous class. The attacker's signal mixes with the BCI's own therapeutic signal in nonlinear neural tissue. Both signals individually appear harmless. The harmful signal is generated inside the patient's tissue.

### 6.2 Detection Boundaries

An honest assessment of what QI can and cannot detect:

| Attack | Mechanism | QI Detects? |
|--------|-----------|-------------|
| Signal injection | A (Direct) | **Yes** |
| Phase disruption | A (Direct) | **Yes** |
| Amplitude manipulation | A (Direct) | **Yes** |
| Replay | A (Direct) | **No** |
| Slow drift | A (Direct) | **Partial** |
| Harmonic coupling | B (Harmonic) | **Partial** |
| Envelope modulation | C (Envelope) | **Partial** |
| Temporal interference | D (Beat) | **Partial**^+^ |
| Intermodulation | E (Intermod) | **No** |

QI catches direct attacks (Mechanism A). It partially catches harmonic and envelope attacks (B, C). Intermodulation (E) is undetectable from signal data alone, requiring hardware-level defense (e.g., a proposed "resonance shield" based on active EM cancellation; see Section 10.2 for feasibility research), as the resulting harmful signal is generated in situ within neural tissue. ^+^Temporal interference (D) cannot be detected from neural-band QI scoring alone, but broadband spectral monitoring at I0/S1 reveals the kHz-range carrier signals as anomalous spectral energy absent from any natural neural process (Section 5.4.2). This elevates Mechanism D from "undetectable" to "detectable with extended monitoring."

### 6.3 Unified Threat Taxonomy

QIF maintains a registry of **71 attack techniques** organized into **11 tactics** across **7 operational domains** using the **QIF Locus Taxonomy v1.0**, a BCI-native threat classification system. Each technique is scored using **NISS v1.0** (Neural Impact Scoring System), a purpose-built alternative to CVSS that prioritizes human impact over system impact. Full specifications for both systems follow in Sections 6.4 and 6.5.

## 6.4 QIF Locus Taxonomy

*BCI-native threat classification system*

### 6.4.1 Design Rationale

Existing threat taxonomies (MITRE ATT&CK, CAPEC, CWE) were designed for traditional IT systems. They classify attacks by what happens to *software and networks*. Brain-computer interfaces require a taxonomy that classifies attacks by what happens to *neural tissue, cognition, and human identity*. This is a fundamentally different attack surface.

The QIF Locus Taxonomy, developed by Qinnovate, addresses this gap. "Locus" refers to the anatomical or functional *location* where the attack operates --- neural, cognitive, physiological, data, device, model, or energy domain. The taxonomy was derived from an analysis of all 71 known BCI attack techniques, grouping them by the primary system they target rather than the IT tactic they employ. It is the first threat classification system purpose-built for neural interfaces.

### 6.4.2 Nomenclature

Each tactic and technique follows a structured naming convention:

**`QIF-N.IJ`**

*Example: Neural Injection tactic*

| Component | Example | Description |
|-----------|---------|-------------|
| Prefix | `QIF-` | Framework namespace |
| Domain Code | `N` | One of 7 domains (Neural) |
| Action Code | `IJ` | Two-letter action verb (Injection) |

Technique IDs use flat sequential numbering:

`QIF-T0001 ... QIF-T0071`

No hierarchy encoded in IDs. New techniques append to the end.

### 6.4.3 7 Operational Domains

The 7 domains partition the BCI attack surface by the system being targeted:

| Code | Domain | Description |
|------|--------|-------------|
| N | Neural | Direct interface with neural tissue --- signal manipulation, electrode boundary, ion channels. |
| C | Cognitive | Higher-order psychological processes --- memory, attention, identity, agency. |
| P | Physiological | Somatic systems --- motor control, autonomic functions, physical harm. |
| D | Data | Information acquisition and manipulation --- brainwave recordings, neural metadata. |
| B | BCI System | Hardware/software of the BCI device --- firmware, protocols, authentication. |
| M | Model | Machine learning models used in BCI --- decoders, classifiers, feedback systems. |
| E | Energy | Directed energy attacks --- ELF, microwave, RF, temporal interference. |

Domains N, C, and P have **no equivalent** in traditional cybersecurity taxonomies. They represent attack surfaces that only exist when one endpoint of the system is a human brain. This is the fundamental gap that the Locus Taxonomy fills.

### 6.4.4 11 Tactics

Each domain contains one or more tactics, each describing an adversary's operational objective:

| Tactic ID | Name | Domain | Techniques | Description |
|-----------|------|--------|------------|-------------|
| QIF-N.SC | Neural Scan | Neural | 3 | Profiling neural signals, mapping BCI topology, fingerprinting devices and neural activity patterns. |
| QIF-B.IN | BCI Intrusion | BCI System | 5 | Gaining initial access to a BCI system or neural pathway via electrodes, RF, firmware, or supply chain. |
| QIF-N.IJ | Neural Injection | Neural | 6 | Injecting malicious signals at the electrode-tissue boundary or into the BCI data pipeline. |
| QIF-C.IM | Cognitive Imprinting | Cognitive | 5 | Maintaining foothold across BCI sessions via calibration poisoning, learned neural patterns, or memory implants. |
| QIF-B.EV | BCI Evasion | BCI System | 5 | Avoiding detection by QI coherence metrics, anomaly detectors, and safety mechanisms. |
| QIF-D.HV | Data Harvest | Data | 9 | Harvesting neural data, cognitive states, memory patterns, ERP responses, and biometric signatures. |
| QIF-P.DS | Physiological Disruption | Physiological | 7 | Disrupting neural function, causing physical harm, denying BCI service, or weaponizing motor output. |
| QIF-N.MD | Neural Modulation | Neural | 5 | Direct neural state modification via stimulation, entrainment, or signal injection. No traditional cybersecurity equivalent. |
| QIF-C.EX | Cognitive Exploitation | Cognitive | 11 | Exploiting cognitive processes including memory, attention, identity, and agency. No traditional cybersecurity equivalent. |
| QIF-E.RD | Energy Radiation | Energy | 6 | EM/RF attacks on neural tissue or BCI hardware via frequency-domain coupling. No traditional cybersecurity equivalent. |
| QIF-M.SV | Model Subversion | Model | 9 | Attacking BCI decoder/classifier models via poisoning, backdoors, adversarial inputs, or gradient leakage. |

**Key distinction:** Tactics QIF-N.MD (Neural Modulation), QIF-C.EX (Cognitive Exploitation), QIF-E.RD (Energy Radiation), and QIF-M.SV (Model Subversion) have **no equivalent in any existing cybersecurity taxonomy**. They were created for BCI-specific attack objectives that traditional frameworks cannot represent.

### 6.4.5 Registry Structure

Each of the 99 techniques records: the Locus tactic it belongs to, the hourglass bands it targets, physical coupling mechanism (where applicable), detection capability (classical vs. QI-enhanced), evidence sources, evidence status (Confirmed / Demonstrated / Theoretical / Emerging), a NISS severity score, and legacy cross-references to prior identifiers. The full registry is machine-readable JSON, updated as new techniques are identified.

Evidence status breakdown:

| Status | Count | Description |
|--------|-------|-------------|
| Confirmed | 14 | Real-world incidents |
| Demonstrated | 19 | Lab-proven attacks |
| Theoretical | 22 | Plausible from principles |
| Emerging | 16 | Newly identified |

## 6.5 NISS v1.0 --- Neural Impact Scoring System

*BCI-native vulnerability scoring system*

### 6.5.1 Why Not CVSS?

CVSS (Common Vulnerability Scoring System), maintained by FIRST.org, is the industry standard for vulnerability scoring in traditional IT systems. However, CVSS measures impact in terms of confidentiality, integrity, and availability of *data and services*. It has no concept of:

- **Biological damage** --- can this attack cause tissue harm, seizures, or neurological damage?
- **Cognitive integrity** --- can this attack alter memory, perception, or sense of agency?
- **Reversibility** --- can the damage be undone, or is it permanent?
- **Violation of consent** --- does this attack bypass the subject's informed consent?
- **Neuroplasticity effects** --- can repeated exposure cause lasting changes to neural pathways?

NISS v1.0, developed by Qinnovate as a purpose-built alternative, retains the 0--10 scoring scale familiar from CVSS but replaces the CIA triad with **five BCI-native impact dimensions**: Biological Impact (BI), Cognitive Integrity (CG), Consent Violation (CV), Reversibility (RV), and Neuroplasticity (NP). The default NISS score is a simple equal-weight average of these five dimensions, ensuring no single dimension dominates without domain-specific justification. Optional **context profiles** (Clinical, Research, Consumer, Military) provide weight overrides for domain-specific scoring.

### 6.5.2 Score Formula

**Default profile (equal weights):**

$$\text{NISS} = \frac{BI + CG + CV + RV + NP}{5}$$

Each dimension is scored on a 0.0--10.0 scale. The default equal-weight average ensures no single impact dimension dominates without domain-specific justification. All fractional results are ceiling-rounded to the nearest 0.1.

**Context profile (weighted):**

$$\text{NISS} = \frac{w_{BI} \cdot BI + w_{CG} \cdot CG + w_{CV} \cdot CV + w_{RV} \cdot RV + w_{NP} \cdot NP}{\sum w}$$

Context profiles provide optional weight overrides for domain-specific environments where certain impact dimensions carry disproportionate significance. See Section 6.5.6 for profile definitions.

### 6.5.3 Metric Groups

#### Impact Dimensions (NISS Score)

The five core dimensions constitute the NISS score. Each is scored on a 0.0--10.0 scale using discrete severity levels.

| Metric | Code | Levels | Scale | Description |
|--------|------|--------|-------|-------------|
| **Biological Impact** | BI | N / L / H / C | 0.0 / 3.3 / 6.7 / 10.0 | Physical harm to neural tissue. None = no tissue effect. Low = transient discomfort. High = seizure risk, tissue stress. Critical = tissue damage, life-threatening. |
| **Cognitive Integrity** | CG | N / L / H / C | 0.0 / 3.3 / 6.7 / 10.0 | Alteration of thought, memory, or identity. None = no cognitive effect. Low = minor cognitive interference. High = significant cognitive disruption. Critical = involuntary behavioral change, identity compromise. |
| **Consent Violation** | CV | N / P / E / I | 0.0 / 3.3 / 6.7 / 10.0 | Degree to which informed consent is bypassed. None = fully consented. Partial = incomplete disclosure. Explicit = clear neurological autonomy violation. Implicit = covert manipulation without the subject's awareness. |
| **Reversibility** | RV | F / T / P / I | 0.0 / 3.3 / 6.7 / 10.0 | Whether the damage can be undone. Fully reversible = spontaneous recovery. Temporary = resolves with clinical support. Partial = incomplete recovery even with intervention. Irreversible = permanent neural change. |
| **Neuroplasticity** | NP | N / T / S | 0.0 / 5.0 / 10.0 | Lasting changes to neural pathways from repeated exposure. None = no pathway modification. Temporary = transient plasticity that reverses when exposure stops. Structural = irreversible pathway reorganization via LTP/LTD. |

Note: "Therapeutic" is a *use case*, not a severity level. A therapeutic intervention that causes structural neuroplasticity scores NP=S regardless of clinical intent --- the NISS score measures impact magnitude, not purpose.

#### PINS Trigger (Potential Impact to Neural Safety)

An attack triggers PINS --- immediate escalation to clinical and security teams --- when:

> **BI $\in$ {H, C}** OR **RV = I**

This threshold captures the two conditions where delayed response risks irreversible patient harm: high or critical biological impact, or irreversible damage of any kind.

#### Exploitability Qualifiers

Exploitability metrics characterize the attack vector but do not contribute to the NISS score. They are recorded in the vector string for threat intelligence and risk triage.

| Metric | Values | Description |
|--------|--------|-------------|
| AV | Network / Wireless / Local / Physical | **Attack Vector.** Network = internet-reachable (cloud BCI platforms). Wireless = RF/BLE/ultrasonic attacks on implant telemetry. Local = on-device firmware or app-level access. Physical = direct electrode contact or surgical-phase tampering. |
| AC | Low / High | **Attack Complexity.** High requires specialized neuroscience knowledge or calibrated equipment. |
| PR | None / Low / High | **Privileges Required.** Low = BCI app-level access. High = firmware or clinical access. |
| UI | None / Passive / Active | **User Interaction.** None = attack succeeds on an idle implant. Passive = user must be wearing or transmitting with the BCI. Active = user must perform a specific cognitive task (e.g., motor imagery, P300 response) that opens the attack window. |

#### Supplemental Threat Metadata

| Metric | Values | Description |
|--------|--------|-------------|
| S | Unchanged / Changed | **Scope.** Changed = attack affects systems beyond the target BCI (e.g., shared neural network). |
| E | Unproven / PoC / Active | **Exploit Maturity.** Evidence level: Active = used in real-world incidents. |

### 6.5.4 Vector Format

Example: Signal Injection (QIF-T0001)

`NISS:1.0/AV:P/AC:L/PR:L/UI:N/BI:H/CG:H/CV:E/RV:T/NP:T/S:U/E:A`

**Impact dimensions (NISS score):**

- `BI:H` --- High biological impact (6.7): seizure risk, neural tissue stress
- `CG:H` --- High cognitive integrity impact (6.7): significant cognitive disruption
- `CV:E` --- Explicit consent violation (6.7): clear neurological autonomy violation
- `RV:T` --- Temporary reversibility (3.3): resolves with clinical support
- `NP:T` --- Temporary neuroplasticity (5.0): transient pathway effects

$$\text{NISS} = \frac{6.7 + 6.7 + 6.7 + 3.3 + 5.0}{5} = \frac{28.4}{5} = 5.7$$

**Score: 5.7 / 10.0** --- MEDIUM

**Exploitability qualifiers:**

- `AV:P` --- Physical access required (electrode contact)
- `AC:L` --- Low complexity (known technique)

**PINS trigger:** BI = H $\rightarrow$ **PINS activated** (immediate clinical escalation)

### 6.5.5 Severity Levels

| Range | Severity | Description |
|-------|----------|-------------|
| 9.0--10.0 | Critical | Irreversible neural damage or complete cognitive compromise |
| 7.0--8.9 | High | Significant biological or cognitive harm, clinical intervention required |
| 4.0--6.9 | Medium | Moderate impact, self-resolving or minor intervention |
| 0.1--3.9 | Low | Minimal human impact, primarily device/data level |

### 6.5.6 Context Profiles

The default equal-weight formula treats all five impact dimensions as equally important. In practice, different deployment contexts have different risk priorities. NISS v1.0 defines four optional context profiles that override the default weights:

| Profile | $w_{BI}$ | $w_{CG}$ | $w_{CV}$ | $w_{RV}$ | $w_{NP}$ | Rationale |
|---------|----------|----------|----------|----------|----------|-----------|
| **Clinical** | 2.0 | 1.5 | 1.0 | 2.0 | 1.0 | Patient safety paramount; biological harm and irreversibility dominate risk calculus. |
| **Research** | 1.0 | 2.0 | 2.0 | 1.0 | 1.5 | Subject cognitive integrity and informed consent are the primary ethical obligations. |
| **Consumer** | 1.0 | 1.5 | 2.0 | 1.0 | 1.0 | Consent and cognitive integrity weigh heavily; users cannot be expected to understand technical risk. |
| **Military** | 2.0 | 2.0 | 0.5 | 1.5 | 1.5 | Biological and cognitive impact are mission-critical; consent weight reduced in operational context. |

Context profiles are applied using the weighted formula from Section 6.5.2. The profile is recorded in the vector string (e.g., `CP:Clinical`). When no profile is specified, the default equal-weight average applies.

### 6.5.7 Registry Distribution

Across all 99 techniques in the TARA registry, NISS scoring produces the following severity distribution:

| Severity | Count |
|----------|-------|
| Critical (9.0+) | 3 techniques |
| High (7.0--8.9) | 44 techniques |
| Medium (4.0--6.9) | 20 techniques |
| Low (0.1--3.9) | 4 techniques |

The skew toward high severity is expected: BCI attacks inherently involve the human body, so most techniques carry significant biological, cognitive, or consent implications that inflate impact scores relative to traditional IT vulnerabilities.

## 6.6 Case Study: Algorithmic Psychosis Induction

QIF-T0065 -- NISS 8.7 (High) -- Status: Confirmed

### 6.6.1 The Attack

An adversary can induce psychotic-spectrum experiences in a vulnerable user without writing a single line of exploit code. A recommendation algorithm profiles the user's psychological vulnerabilities through behavioral data --- watch time, engagement spikes, emotional triggers, search history --- then systematically curates content designed to destabilize cognitive function. The algorithm is both the reconnaissance tool and the delivery mechanism. No malware is installed. The platform functions exactly as designed.

This is not hypothetical. Internal research from major social media platforms, leaked in 2021, documented that recommendation algorithms amplified content associated with eating disorders, self-harm, and suicidal ideation in adolescent users [88]. Longitudinal studies have linked algorithmic feed exposure to increased rates of anxiety, depression, and psychotic-spectrum experiences in vulnerable populations [89]. Sub-clinical psychotic experiences are common and exacerbated by environmental stressors [90], and the dopaminergic mechanisms underlying psychosis --- the system that assigns salience to stimuli --- are precisely what engagement-optimized algorithms exploit [91]. The algorithm does not need to "intend" harm --- optimization for engagement metrics produces the same outcome as a deliberate attack when the most engaging content is also the most destabilizing.

### 6.6.2 Kill Chain Through the Locus Taxonomy

This attack traverses five QIF Locus tactics in sequence. Traditional taxonomies would classify it as "misinformation" or "content moderation failure" --- categories that obscure the neurological mechanism and severity. The Locus Taxonomy maps the actual path of harm:

**Stage 1: Data Harvest** (`QIF-D.HV`, Band S3)

The algorithm collects behavioral signals: dwell time on distressing content, late-night usage patterns, engagement with conspiracy or paranoia-adjacent material, social isolation indicators. This builds a vulnerability profile without the user's knowledge or consent.

**Stage 2: Model Subversion** (`QIF-M.SV`, Band S3 -> S2)

The recommendation model is weaponized --- not through external compromise, but through its own optimization objective. This is endogenous subversion: the model's legitimate goal (maximize engagement) is perverted to serve a harmful outcome, distinguishing it from external model poisoning or tampering. Maximizing engagement selects for emotionally destabilizing content. The model's reward function and the attacker's intent become indistinguishable.

**Stage 3: Cognitive Imprinting** (`QIF-C.IM`, Band S2 -> N7)

Repeated exposure to curated triggering content rewrites cognitive patterns over days and weeks. The user sees the content consciously, but the curation itself is invisible. Each piece of content reinforces a narrative framework that progressively distorts perception of reality.

**Stage 4: Cognitive Exploitation** (`QIF-C.EX`, Band N6 -> N7)

The brain's pattern-matching and threat-detection systems are exploited until they malfunction. Paranoia, hypervigilance, and conspiratorial thinking emerge as the limbic system (N6) receives persistent false-threat signals, and the prefrontal cortex (N7) cannot override them fast enough.

**Stage 5: Physiological Disruption** (`QIF-P.DS`, Band N5 -> N7)

Psychosis manifests as a neurological event: measurable changes in dopaminergic signaling, prefrontal cortex function, and sleep architecture. This is not metaphorical harm --- it is physiological damage mediated through cognitive channels.

### 6.6.3 NISS Scoring Breakdown

CVSS cannot score this attack. It has no concept of cognitive integrity, neuroplasticity, or consent violation. Under CVSS, a recommendation algorithm is not a vulnerability. Under NISS, it scores 8.7 (High):

| NISS Metric | Value | Score | Rationale |
|-------------|-------|-------|-----------|
| **Impact Dimensions** | | | |
| BI (Biological Impact) | **High** | 6.7 | Psychosis involves measurable neurochemical and structural changes |
| CG (Cognitive Integrity) | **Critical** | 10.0 | Reality perception fundamentally altered; sense of agency compromised |
| CV (Consent Violation) | **Implicit** | 10.0 | User never consented to psychological targeting; manipulation is covert --- ToS do not constitute informed consent |
| RV (Reversibility) | **Partial** | 6.7 | Psychotic episodes can cause lasting cognitive changes; recovery not guaranteed |
| NP (Neuroplasticity) | **Structural** | 10.0 | Repeated exposure reshapes neural pathways via LTP/LTD; adolescent brains especially vulnerable |
| **Exploitability Qualifiers** | | | |
| AV (Attack Vector) | Network | --- | Delivered over the internet to any connected device |
| AC (Complexity) | Low | --- | Algorithm operates autonomously; no per-target customization needed |
| PR (Privileges) | None | --- | Any user who opens the app is a target |
| UI (User Interaction) | Passive | --- | User opens the app and scrolls; no out-of-the-ordinary action required beyond normal platform use |

$$\text{NISS} = \frac{6.7 + 10.0 + 10.0 + 6.7 + 10.0}{5} = \frac{43.4}{5} = 8.7$$

**Final score: 8.7 / 10.0 (High).** PINS triggered: BI = H. The NISS score captures the severity of human impact across all five dimensions. The exploitability qualifiers (all favorable to the attacker: wireless, low complexity, no privileges, no interaction) make this attack particularly dangerous in practice, though they do not inflate the impact score itself.

### 6.6.4 The BCI Amplifier

This attack already works through a screen. A brain-computer interface makes it catastrophically more effective across every dimension of the kill chain:

| Dimension | Via Screen (Today) | Via BCI (Tomorrow) |
|-----------|-------------------|-------------------|
| Profiling | Behavioral proxies (watch time, clicks, scrolling speed) | Direct neural state: knows you are anxious, not just that you paused on a video |
| Delivery | Visual/auditory via screen (conscious filtering possible) | Neural stimulation that bypasses conscious filtering entirely |
| Feedback loop | Minutes to hours (engagement metrics, session-level) | Milliseconds (real-time neural response monitoring, stimulus-level) |
| Neuroplasticity | Gradual (weeks to months of repeated viewing) | Accelerated (direct stimulation reshapes pathways faster than sensory input) |
| Detection | User can recognize content as disturbing and close the app | Stimulation may not be consciously perceptible at all |

### 6.6.5 Implications

**Intent is irrelevant to the score.** NISS produces the same 8.7 whether a nation-state deliberately weaponizes a feed to induce psychosis in a target population, or a platform negligently optimizes for engagement while ignoring psychiatric harm. This is a deliberate departure from traditional threat modeling, which assumes an adversary with intent. In BCI security, the outcome is the threat --- not the motivation behind it.

**The legal vacuum.** This attack operates in a regulatory gray area. Current frameworks for negligence and product liability have not been tested against cognitive manipulation at scale. Terms of service do not constitute informed consent for neurological targeting. QIF provides a formal language to describe the harm --- a prerequisite for future legal and regulatory frameworks that do not yet exist.

**Population-level risk.** This case study describes an individual target, but the attack scales to millions simultaneously. Algorithmic destabilization of cognitive function across a population produces mass delusion, social fracturing, and public health crises that are currently framed as political or cultural problems --- not security incidents. QIF reframes them as what they are: attacks on cognitive integrity, scoreable, classifiable, and defensible.

This analysis demonstrates that QIF's taxonomy and scoring systems are not speculative. They provide a necessary framework for formalizing neurological harm that is already occurring, and for securing the technologies that will define the next decade of human-computer interaction.

## 6.7 TARA --- Therapeutic Atlas of Risks and Applications

*Dual-use mechanism registry bridging security and medicine*

### 6.7.1 The Dual-Use Observation

A systematic audit of the 71-technique registry revealed an unexpected pattern: the physical mechanisms underlying many attack techniques are identical to the mechanisms underlying established medical therapies. Signal injection (QIF-T0001) uses the same electrode current delivery as deep brain stimulation (DBS), which treats Parkinson's disease, essential tremor, dystonia, OCD, and epilepsy in over 160,000 patients worldwide [86]. Neural entrainment manipulation uses the same frequency-locking physics as therapeutic transcranial alternating current stimulation (tACS). Bifurcation forcing operates in the same dynamical parameter space as controlled DBS that shifts neural dynamics toward a healthy attractor state.

The preliminary breakdown: **35 to 40 techniques** where the attack mechanism has a published therapeutic counterpart (electrode stimulation, entrainment, neuromodulation), roughly **10 ambiguous cases** where the attack vector is digital but the payload affects tissue, and **18 to 20 pure-silicon techniques** (firmware, supply chain, ML model attacks) with no therapeutic analog. Same electrode. Same current. Same physics. Different intent, consent, and oversight.

This dual-use reality is not abstract. Deep brain stimulation treats Parkinson's tremor in 160,000 patients. Transcranial stimulation protocols are in clinical trials for treatment-resistant depression, chronic pain, tinnitus, and early-stage Alzheimer's disease. The patients who need these therapies are aging into a world where the devices that could restore their quality of life share the same physical mechanisms catalogued in this paper's threat registry. A generation of children is growing up with computing capabilities that previous generations required desktop hardware to access; a generation of patients is aging into neurodegenerative conditions that emerging BCI therapies may be able to treat. Neither population will be served by a security framework that treats therapeutic mechanisms and attack vectors as unrelated phenomena.

### 6.7.2 Mechanism-First Architecture

TARA reorganizes the threat registry by **physical mechanism** rather than by adversarial intent. Each mechanism entry carries four dimensional projections:

**Security Projection**

Attack technique, tactic, severity (NISS), detection methods, evidence status. The view a security researcher needs.

**Clinical Projection**

Therapeutic modality, conditions treated, FDA approval status, named devices, evidence level. The view a clinician needs.

**Diagnostic Projection**

Clinical observation use: cortical stimulation mapping, EEG monitoring, seizure detection. Null if no diagnostic application exists.

**Governance Projection**

Consent requirements, amplitude ceilings, charge density limits, real-time monitoring mandates, regulatory classification, applicable NSP layers.

This architecture draws structural inspiration from biological databases: the [KEGG database](https://www.genome.jp/kegg/) maps genes to pathways to diseases to drugs (four views, one substrate), the [Gene Ontology](http://geneontology.org/) maps proteins across three orthogonal axes, and MITRE D3FEND uses Digital Artifacts as the bridge between offense and defense. TARA applies the same principle to neural interfaces: the mechanism is the Rosetta Stone that translates between communities that do not currently speak to each other.

### 6.7.3 Framing Principle

**Therapeutic use is the default. Adversarial use is the deviation.** This follows the IAEA model for nuclear materials (peaceful use is presumed; weapons use is the exception) and the DURC framework for biological research (beneficial use is presumed; misapplication is governed). The governance projection on every TARA entry specifies the safeguards required to keep a mechanism in the therapeutic column.

### 6.7.4 Regulatory Context

In June 2025, the FDA finalized [Section 524B of the FD&C Act](https://www.federalregister.gov/documents/2025/06/27/2025-11669/cybersecurity-in-medical-devices-quality-system-considerations-and-content-of-premarket-submissions) [87], which legally requires cybersecurity for any "cyber device": medical devices with software that can connect to the internet. Every wireless BCI on the market or in clinical trials falls under this mandate. Manufacturers must submit cybersecurity plans, software bills of materials (SBOMs), and vulnerability management processes. Non-compliance means denied market authorization.

Section 524B is a mandate, not a map. It tells manufacturers they need cybersecurity but does not specify BCI-specific threats, how neural signals differ from network packets, or what happens when the same physical mechanism constitutes both an attack and a therapy. QIF provides the framework. NSP provides the protocol. NISS provides the scoring. TARA provides the atlas that maps every mechanism across all four dimensions simultaneously, giving manufacturers, clinicians, regulators, and engineers a shared language for securing neural devices.

## 7. Neural Sensory Protocol (NSP)

The QI equation measures integrity. The Locus Taxonomy classifies threats. NISS scores their severity. TARA maps them across security and medicine. What is missing is the wire protocol that enforces these protections in real time on a living neural interface.

NSP is not only a security protocol. It is the trust layer that enables therapeutic BCI deployment. Without a validated, physics-based integrity protocol built into the device, no regulator will approve consumer neural stimulation. NSP provides that foundation: a protocol analogous to TLS for the web, but designed for the unique physics of the electrode-tissue interface. Where TLS validates the integrity of data in transit between servers, NSP validates the integrity of signals crossing the boundary between silicon and biology.

### 7.1 The HNDL Threat

Neuralink's N1 is designed to remain in a patient's brain for 10--20 years. NIST estimates cryptographically relevant quantum computers by 2030--2035. Current BCI wireless (BLE) uses ECDH for key exchange, which is broken by Shor's algorithm [48]. Neural data is permanently sensitive: unlike a credit card number, brain patterns cannot be reissued.

### 7.2 Five-Layer Architecture

**L1 --- EM Environment Monitoring**

Passive/active electromagnetic environment sensing at the I0 boundary. Detects unauthorized RF signals and intermodulation attack signatures.

**L2 --- Signal Physics (QI Score)**

The unified QI equation applied per band per time window. Works even if cryptographic layers are compromised.

**L3 --- Post-Quantum Key Exchange (ML-KEM)**

ML-KEM (Kyber), FIPS 203. Lattice-based key encapsulation replacing ECDH. Hybrid construction for defense in depth.

**L4 --- Post-Quantum Authentication (ML-DSA)**

ML-DSA (Dilithium), FIPS 204. Lattice-based digital signatures replacing ECDSA. Every NSP frame is signed.

**L5 --- Payload Encryption (AES-256-GCM)**

Authenticated encryption. AES-256 remains quantum-resistant under Grover's algorithm.

### 7.3 Device Tiers

| Device Class | Channels | Active Layers | Key Threat |
|-------------|----------|---------------|------------|
| Consumer headband | 4--16 | L2, L5 | Direct injection via BLE |
| Clinical EEG | 32--256 | L2, L3, L4, L5 | Replay, slow drift |
| Implanted BCI/DBS | 16--1024 | All five | Intermodulation, nation-state HNDL |

### 7.4 Standardized Threat Intelligence (STIX 2.1)

To bridge the gap between neurosecurity and traditional SOC operations, TARA data is exported as **STIX 2.1 (Structured Threat Information Expression)**. 

QIF mappings to STIX 2.1 objects:
- **TARA Mechanisms** -> `attack-pattern`
- **Neural Impacts** -> `relationship` (targeting)
- **Clinical Modalities** -> `identity` (targeting sector: medical)
- **NISS Scores** -> `external_references` (custom metadata)

This enables existing Security Information and Event Management (SIEM) systems to ingest BCI threat data alongside traditional network indicators, the first such integration in the neurosecurity domain.

### 7.5 Reference Implementation: `qtara` Python Package

QIF provides an official reference implementation for researchers and developers: the **`qtara` Python Library**. `qtara` serves as the CLI and SDK for the framework, enabling:
- **Registry Management**: Programmatic access to the TARA registry.
- **Compliance Export**: Automated conversion of local threat data to STIX 2.1 JSON.
- **Academic Tooling**: Automated BibTeX generation for framework citations (`qtara cite`).

```bash
pip install qtara
qtara list --severity critical
```

### 7.6 Project Runemate: Offsetting PQC Overhead

Post-quantum keys are significantly larger: ML-KEM-768 public keys are 1,184 bytes vs 65 bytes for ECDH-P256 (18.2x). Project Runemate converts HTML-based BCI interface content into a compact bytecode format called **Staves**, achieving 65--90% compression.

| Page Complexity | Raw HTML | Staves | PQ+Staves | Classical | Net |
|----------------|----------|--------|-----------|-----------|-----|
| Minimal alert | 5 KB | 0.5 KB | 21.1 KB | 5.8 KB | +15.3 KB |
| Standard UI | 50 KB | 5 KB | 25.6 KB | 50.8 KB | **-25.2 KB** |
| Rich dashboard | 200 KB | 20 KB | 40.6 KB | 200.8 KB | **-160.2 KB** |
| Complex interface | 500 KB | 50 KB | 70.6 KB | 500.8 KB | **-430.2 KB** |

Runemate Forge is implemented in **Rust**. Rust provides compile-time memory safety, type-level sanitization, and bare-metal deployment via `no_std` (64 KB RAM floor). The Ferrocene Rust compiler has achieved IEC 62304 Class C certification for medical device software.

## 8. Falsifiability

A framework that cannot be disproven is not science. QIF is designed to be empirically testable.

### 8.1 Universal Fast Decoherence

If $\tau_D < 10^{-12}$ s universally at the electrode-tissue boundary, quantum terms become negligible. QIF degrades gracefully to a classical-only model: $QI(t) \approx e^{-S_c}$. This does not break QIF --- it reduces it to its classical foundation.

### 8.2 Ion Channel Tunneling Not Individually Unique

If tunneling coefficients $T(E)$ do not vary significantly between individuals, the quantum biometric hypothesis is invalid. The tunneling term $\hat{Q}_t$ would still function as a threat model but the biometric application would be falsified.

### 8.3 No Measurable Quantum Effects at I0

If quantum state tomography consistently shows fully classical statistics at the BCI junction, quantum corrections are zero. The classical architecture, attack taxonomy, and NSP retain independent value.

### 8.4 Zeno Effect Impossible at BCI Rates

If Zeno stabilization requires measurement rates exceeding $10^9$ Hz at the electrode interface, the conditional Zeno-BCI hypothesis is removed. This hypothesis is already framed as conditional on decoherence timescale.

### 8.5 Davydov Soliton Attacks Cannot Be Generated

If terahertz radiation cannot generate Davydov solitons in SNARE protein complexes, this attack vector is falsified. The other four coupling mechanisms remain valid independently.

**Graceful Degradation:** QIF's parameterized design means most falsification scenarios reduce the framework's scope rather than destroying it. The worst case for QIF is the current assumption of most BCI security researchers: that quantum effects do not matter. The framework is designed so that this assumption is *testable*, not axiomatic.

## 9. Discussion

### 9.1 What QIF Is

This paper delivered the seven contributions outlined in Section 2.5:

1. An **11-band hourglass architecture** (v4.0) spanning the neural-synthetic boundary, derived from neuroanatomy and quantum physics (Section 4).
2. A **unified QI equation**, $QI(b,t) = e^{-S(b,t)}$, grounded in spectral decomposition via the STFT and combining classical signal integrity with quantum terms (Section 5).
3. Identification of **five cross-domain attack coupling mechanisms** with honest detection boundaries, supported by the **QIF Locus Taxonomy** (8 domains, 15 tactics, 99 techniques) and **NISS v1.0** neural impact scoring (Section 6).
4. **TARA** (Therapeutic Atlas of Risks and Applications), a mechanism-first dual-use registry bridging security and clinical communities through four dimensional projections of every catalogued technique (Section 6.7).
5. The **Neural Sensory Protocol (NSP)**, a five-layer post-quantum communication protocol integrating QI scoring with ML-KEM, ML-DSA, and AES-256-GCM, serving as the trust layer for therapeutic BCI deployment (Section 7).
6. **Project Runemate**, a content compression pipeline offsetting PQC bandwidth overhead by 65--90% (Section 7).
7. **Falsifiability conditions** specifying what experimental findings would weaken or invalidate specific framework components (Section 8).

### 9.2 What QIF Is Not

QIF is **not experimentally validated**. No QI score has been computed from real BCI data under attack conditions. The scaling coefficients have not been calibrated. QIF does not model consciousness. QIF does not prove that quantum effects matter for BCI security --- the quantum terms are hypothesized contributions. QIF does not replace formal cryptographic security proofs.

### 9.3 Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| No experimental validation | Equations are theoretical | Testable predictions provided |
| Coefficients uncalibrated | No absolute QI values | Valid for relative comparisons |
| Decoherence time disputed | Quantum terms may be negligible | Tunable $\tau_D$; graceful degradation |
| Resonance shield is concept only | Layer 1 defense unimplemented | Defines the engineering target |
| No tampered BCI dataset | Cannot validate against real attacks | Synthetic attack generation proposed |

### 9.4 Energy Bounds

Landauer's Principle [61] establishes the fundamental thermodynamic cost: $E_{\text{min}} = kT \cdot \ln(2)$ per bit erasure. At body temperature (310 K), this is $\approx 2.97 \times 10^{-21}$ J per bit. This replaces Moore's Law (an empirical trend, not a physical law) as the correct reference for energy scaling arguments.

## 10. Future Work

### 10.1 Immediate Priorities

1. **Phase 1 Validation.** Implement classical QI ($S_c$ only) against PhysioNet EEGBCI dataset (109 subjects) and BrainFlow live data. Generate synthetic attacks. Publish results regardless of outcome.
2. **Synthetic Attack Dataset.** No public "tampered BCI" dataset exists. Creating one would itself be a publishable contribution.
3. **Consumer $D_{\text{spec}}$ Validation.** Test the spectral consistency proxy on consumer-grade EEG data (Muse, Emotiv).

### 10.2 Medium-Term Research

4. **$H_{\text{interface}}$ Formulation.** Write down the total Hamiltonian $H_{\text{total}} = H_{\text{neuron}} + H_{\text{electrode}} + H_{\text{interface}} + H_{\text{environment}}$ for a specific BCI system.
5. **NSP Reference Implementation.** Build in Python (OpenBCI) and C (firmware-embeddable), integrating liboqs.
6. **Resonance Shield Feasibility Study.** Determine whether active EM cancellation can be miniaturized to implant-compatible dimensions.
7. **Intermodulation Detection Research.** Solve the detection gap identified in Section 6.
8. **TARA Clinical Validation.** Populate the clinical and diagnostic projections of TARA with practising neurologists and BCI researchers. Priority: validate the ~35--40 Category 1 (clear therapeutic mapping) entries against published neuromodulation protocols, and resolve the ~10 ambiguous Category 2 entries through expert panel consensus.
9. **TARA Governance Projection.** Map each TARA entry to applicable regulatory frameworks (FDA 524B, EU MDR, ISO 14971) and generate per-technique compliance checklists for manufacturers.

### 10.3 Long-Term Goals

8. **Quantum State Tomography at the BCI Interface.** Measure the actual decoherence time $\tau_D$ at a BCI electrode-tissue junction.
9. **Tunneling Biometric Feasibility.** Single-channel patch clamp studies to determine individual variability.
10. **Zeno-BCI Experimental Test.** Vary BCI sampling rate from 100 Hz to 20 kHz and measure coherence time.
11. **v4.0 Architecture Validation.** Map historical BCI adverse events to specific bands to test severity stratification.
12. **Socio-Legal Framework Integration.** Investigate how QIF/NISS/TARA can provide a concrete technical foundation for emerging legal and policy frameworks addressing cognitive liberty, neurological privacy, and algorithmic accountability.

---

The physics described in this paper is already operating in the reader's nervous system. Every sentence processed here traverses synaptic junctions where ions tunnel through voltage-gated channels, where neurotransmitter release depends on quantum-scale energy transfers along SNARE complexes, and where the resulting neural patterns physically restructure through long-term potentiation. The interface between this text and the reader's comprehension is a brain-computer interface --- one mediated by photons, retinal transduction, and cortical processing rather than by implanted electrodes. The electrode simply shortens the path. The physics at the destination does not change.

If the framework in this paper succeeds, it will not be measured by citation count or adoption metrics. It will be measured by whether a patient with treatment-resistant depression can trust the device implanted in their brain. Whether a child with drug-resistant epilepsy receives a responsive neurostimulator whose security architecture was designed for the physics of neural tissue, not retrofitted from a network packet model. Whether the people aging into neurodegenerative disease --- the patients with Alzheimer's who cannot advocate for themselves, the patients with demyelinating conditions whose neural containment is already compromised --- have access to therapeutic BCIs that are safe enough to deploy and trustworthy enough to prescribe.

Time is the variable that constrains all of this. The devices are shipping. The patients are waiting. The security architecture must be ready before the technology outpaces it.

## 11. References

**Quantum Indeterminacy and Uncertainty Relations**

[1] Heisenberg, W. (1927). Uber den anschaulichen Inhalt der quantentheoretischen Kinematik und Mechanik. *Zeitschrift fur Physik*, 43(3-4), 172--198.

[2] Robertson, H. P. (1929). The uncertainty principle. *Physical Review*, 34(1), 163--164.

[3] Schrodinger, E. (1930). Zum Heisenbergschen Unscharfeprinzip. *Sitzungsberichte der Preussischen Akademie der Wissenschaften*, 296--303.

[4] Kimura, G., Endo, S., & Fujii, K. (2025). Beyond Robertson-Schrodinger. *arXiv*, 2504.20404.

[5] Maccone, L., & Pati, A. K. (2014). Stronger uncertainty relations. *Physical Review Letters*, 113(26), 260401.

[6] Kochen, S., & Specker, E. P. (1967). The problem of hidden variables. *Journal of Mathematics and Mechanics*, 17(1), 59--87.

**Von Neumann Entropy and Density Matrix**

[7] Von Neumann, J. (1932). *Mathematische Grundlagen der Quantenmechanik*. Springer.

[8] Nielsen, M. A., & Chuang, I. L. (2010). *Quantum Computation and Quantum Information*. Cambridge University Press.

**Born Rule**

[9] Born, M. (1926). Zur Quantenmechanik der Stossvorgange. *Zeitschrift fur Physik*, 37(12), 863--867.

[10] Masanes, L., Galley, T. D., & Muller, M. P. (2019). The measurement postulates of quantum mechanics are operationally redundant. *Nature Communications*, 10(1), 1361.

**Quantum Tunneling in Neural Systems**

[11] Qaswal, A. B. (2019). Quantum tunneling of ions through closed voltage-gated channels. *Quantum Reports*, 1(2), 219--225.

[12] Georgiev, D. D., & Glazebrook, J. F. (2018). Quantum physics of synaptic communication via SNARE. *Progress in Biophysics and Molecular Biology*, 135, 16--29.

[13] Walker, E. H. (1977). Quantum mechanical tunneling in synaptic and ephaptic transmission. *Int. J. Quantum Chemistry*, 11(1), 103--127.

[14] Summhammer, J., Salari, V., & Bernroider, G. (2012). Quantum-mechanical description of ion motion within voltage-gated ion channels. *J. Integrative Neuroscience*, 11(2), 123--135.

**Decoherence in Neural Tissue**

[15] Tegmark, M. (2000). Importance of quantum decoherence in brain processes. *Physical Review E*, 61(4), 4194--4206.

[16] Jedlicka, P. (2017). Revisiting the quantum brain hypothesis. *Frontiers in Molecular Neuroscience*, 10, 366.

[17] Sattin, D. et al. (2023). A quantum-classical model of brain dynamics. *Entropy*, 25(4), 592.

[18] Lambert, N. et al. (2013). Quantum biology. *Nature Physics*, 9(1), 10--18.

**Quantum Zeno Effect**

[19] Misra, B., & Sudarshan, E. C. G. (1977). Zeno's paradox in quantum theory. *J. Mathematical Physics*, 18(4), 756--763.

[20] Itano, W. M. et al. (1990). Quantum Zeno effect. *Physical Review A*, 41(5), 2295--2300.

**Quantum Cryptography and Security**

[21] Bennett, C. H., & Brassard, G. (1984). Quantum cryptography. *Proc. IEEE ICCSSP*, 175--179.

[22] Ekert, A. K. (1991). Quantum cryptography based on Bell's theorem. *Physical Review Letters*, 67(6), 661--663.

[23] Gottesman, D., & Chuang, I. (2001). Quantum digital signatures. *arXiv*, quant-ph/0105032.

[24] Wootters, W. K., & Zurek, W. H. (1982). A single quantum cannot be cloned. *Nature*, 299(5886), 802--803.

**Neuroscience**

[25] Fries, P. (2005). A mechanism for cognitive dynamics: Neuronal communication through neuronal coherence. *Trends in Cognitive Sciences*, 9(10), 474--480.

[26] Fries, P. (2015). Rhythms for cognition: Communication through coherence. *Neuron*, 88(1), 220--235.

[27] Markram, H. et al. (1997). Regulation of synaptic efficacy by coincidence of postsynaptic APs and EPSPs. *Science*, 275(5297), 213--215.

[28] Bi, G. Q., & Poo, M. M. (1998). Synaptic modifications in cultured hippocampal neurons. *J. Neuroscience*, 18(24), 10464--10472.

[29] Borst, J. G. G. (2010). The low synaptic release probability in vivo. *Trends in Neurosciences*, 33(6), 259--266.

[30] Buzsaki, G., & Draguhn, A. (2004). Neuronal oscillations in cortical networks. *Science*, 304(5679), 1926--1929.

[31] Hodgkin, A. L., & Huxley, A. F. (1952). Membrane current and conduction in nerve. *J. Physiology*, 117(4), 500--544.

[32] Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379--423.

**Quantum Computing Threats**

[33] Gidney, C., & Ekera, M. (2021). How to factor 2048 bit RSA integers in 8 hours. *Quantum*, 5, 433.

[34] Gidney, C. (2025). Factoring integers with sublinear resources on a superconducting quantum processor. *arXiv*, 2505.15917.

[35] Bennett, C. H. et al. (1997). Strengths and weaknesses of quantum computing. *SIAM J. Computing*, 26(5), 1510--1523.

[36] Zalka, C. (1999). Grover's quantum searching algorithm is optimal. *Physical Review A*, 60(4), 2746--2751.

[37] NIST. (2024). *Post-Quantum Cryptography Standardization*. FIPS 203, 204, 205.

**BCI Technology**

[38] Musk, E., & Neuralink. (2019). An integrated brain-machine interface platform. *J. Medical Internet Research*, 21(10), e16194.

[39] Fisher, M. P. A. (2015). Quantum cognition: Processing with nuclear spins. *Annals of Physics*, 362, 593--602.

[40] Koch, K. et al. (2006). How much the eye tells the brain. *Current Biology*, 16(14), 1428--1434.

[41] Norretranders, T. (1998). *The User Illusion*. Viking.

[42] Srinivasan, R. et al. (1999). Increased synchronization during conscious perception. *J. Neuroscience*, 19(13), 5435--5448.

[43] Massimini, M. et al. (2004). The sleep slow oscillation as a traveling wave. *J. Neuroscience*, 24(31), 6862--6870.

**Foundational Physics**

[44] Nernst, W. (1889). Die elektromotorische Wirksamkeit der Ionen. *Z. Phys. Chem.*, 4, 129--181.

[45] Cole, K. S., & Cole, R. H. (1941). Dispersion and absorption in dielectrics. *J. Chemical Physics*, 9(4), 341--351.

[46] Boltzmann, L. (1877). Uber die Beziehung zwischen dem zweiten Hauptsatze. *Wiener Berichte*, 76, 373--435.

[47] Grover, L. K. (1996). A fast quantum mechanical algorithm for database search. *Proc. 28th ACM STOC*, 212--219.

[48] Shor, P. W. (1994). Algorithms for quantum computation. *Proc. 35th FOCS*, 124--134.

**Neuroethics**

[49] Yuste, R. et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159--163.

[50] Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience. *Life Sciences, Society and Policy*, 13(1), 5.

**BCI Security**

[51] Martinovic, I. et al. (2012). Side-channel attacks with brain-computer interfaces. *Proc. 21st USENIX Security*, 143--158.

[52] Bonaci, T. et al. (2014). App stores for the brain. *IEEE Technology and Society*, 34(2), 32--39.

[53] Frank, M. et al. (2017). Using EEG-based BCI devices to probe for private information. *PETS*, 2017(3), 133--152.

[54] Bernal, S. L. et al. (2022). Security in brain-computer interfaces: State-of-the-art. *ACM Computing Surveys*, 54(1), 1--35.

**Recent Developments (2022--2025)**

[55] Perry, C. (2025). Quantum sensing approaches to microtubule coherence measurement. *SSRN preprint*.

[56] Clarke, J. et al. (2025). Macroscopic quantum tunneling in Josephson junction circuits. *Nobel Prize in Physics 2025*.

[57] Kim, H. et al. (2025). Under-the-barrier recollision in quantum tunneling. *Physical Review Letters*.

[58] Wiest, R. (2025). NeuroQ: Quantum-inspired neural dynamics via stochastic mechanics. *Neuroscience of Consciousness*.

[59] Qaswal, A. B. et al. (2022). Mathematical models for quantum tunneling through voltage-gated ion channels. *Quantum Reports*.

[60] BISC Consortium (2025). 65,536-channel brain-computer interface with 100 Mbps wireless. *Nature Electronics*.

**Thermodynamics and Information Theory**

[61] Landauer, R. (1961). Irreversibility and heat generation in computing. *IBM J. Research and Development*, 5(3), 183--191.

**Black Hole Physics and Information Theory**

[62] Sekino, Y., & Susskind, L. (2008). Fast scramblers. *JHEP*, 2008(10), 065.

[63] Grossman, N. et al. (2017). Noninvasive deep brain stimulation via temporally interfering electric fields. *Cell*, 169(6), 1029--1041.

[64] Bell, J. S. (1964). On the Einstein Podolsky Rosen paradox. *Physics Physique Fizika*, 1(3), 195--200.

[65] 't Hooft, G. (1993). Dimensional reduction in quantum gravity. In *Salamfestschrift*. World Scientific.

[66] Susskind, L. (1995). The world as a hologram. *J. Mathematical Physics*, 36(11), 6377--6396.

[67] Bekenstein, J. D. (1981). Universal upper bound on entropy-to-energy ratio. *Physical Review D*, 23(2), 287--298.

[68] Page, D. N. (1993). Average entropy of a subsystem. *Physical Review Letters*, 71(9), 1291--1294.

[69] Dvali, G. (2018). Black holes as brains: Neural networks with area law entropy. *Fortschritte der Physik*, 66(4), 1800007.

[70] Tozzi, A. et al. (2023). From black holes entropy to consciousness. *Physica A*, 626, 129112.

[71] Pastawski, F. et al. (2015). Holographic quantum error-correcting codes. *JHEP*, 2015(6), 149.

[72] Hawking, S. W. (1975). Particle creation by black holes. *Comm. Mathematical Physics*, 43(3), 199--220.

[73] Hodgkin, A. L., & Huxley, A. F. (1952). A quantitative description of membrane current and its application to conduction and excitation in nerve. *Journal of Physiology*, 117(4), 500--544.

[74] UNESCO World Heritage Centre. (2011). The Persian Garden. Inscription on the World Heritage List, No. 1372.

[75] Olmsted, F. L., & Vaux, C. (1858). Description of a plan for the improvement of the Central Park: "Greensward." Board of Commissioners of the Central Park.

[76] King, A., Caltagirone, C., Steers, C., & Slaboch, N. (2018). Mapping tranquility --- a case study of the Central Park soundscape. *INTER-NOISE 2018*, Chicago.

[77] Declercq, N. F., & Dekeyser, C. S. A. (2007). Acoustic diffraction effects at the Hellenistic amphitheatre of Epidaurus. *Journal of the Acoustical Society of America*, 121(4), 2011--2022.

[78] Pardridge, W. M. (2005). The blood-brain barrier: bottleneck in brain drug development. *NeuroRx*, 2(1), 3--14.

[79] Maturana, H. R., & Varela, F. J. (1972). *Autopoiesis and Cognition: The Realization of the Living*. D. Reidel Publishing.

[80] Kaplan, R., & Kaplan, S. (1989). *The Experience of Nature: A Psychological Perspective*. Cambridge University Press.

[81] Ulrich, R. S. (1984). View through a window may influence recovery from surgery. *Science*, 224(4647), 420--421.

[82] Polikov, V. S., Tresco, P. A., & Reichert, W. M. (2005). Response of brain tissue to chronically implanted neural electrodes. *Journal of Neuroscience Methods*, 148(1), 1--18.

**BCI Security Lineage**

[83] Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: security and privacy for neural devices. *Neurosurgical Focus*, 27(1), E7. DOI: 10.3171/2009.4.FOCUS0985

[84] Pycroft, L. et al. (2016). Brainjacking: implant security issues in invasive neuromodulation. *World Neurosurgery*, 92, 454--462. DOI: 10.1016/j.wneu.2016.05.010

[85] Landau, O., Cohen, A., Gordon, S., & Nissim, N. (2020). Mind your mind: EEG-based brain-computer interfaces and their security in cyber space. *ACM Computing Surveys*, 53(1), Article 1. DOI: 10.1145/3372043

[86] Lozano, A. M. et al. (2019). Deep brain stimulation: current challenges and future directions. *Nature Reviews Neurology*, 15(3), 148--160. DOI: 10.1038/s41582-018-0128-2

[87] U.S. Food and Drug Administration. (2023). Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions. Section 524B of the FD&C Act (as amended by the Consolidated Appropriations Act, 2023).

**Algorithmic Psychosis Case Study**

[88] Wells, G., Horwitz, J., & Seetharaman, D. (2021). Facebook knows Instagram is toxic for teen girls, company documents show. *The Wall Street Journal*, September 14, 2021.

[89] Twenge, J. M., Haidt, J., Lozano, J., & Cummins, K. M. (2022). Specification curve analysis shows that social media use is linked to poor mental health, especially among girls. *Acta Psychologica*, 223, 103512. DOI: 10.1016/j.actpsy.2022.103512

[90] Kelleher, I., Connor, D., Clarke, M. C., Devlin, N., Harley, M., & Cannon, M. (2012). Prevalence of psychotic symptoms in childhood and adolescence: a systematic review and meta-analysis. *Psychological Medicine*, 42(9), 1857--1863. DOI: 10.1017/S0033291711002960

[91] Howes, O. D., & Kapur, S. (2009). The dopamine hypothesis of schizophrenia: version III --- the final common pathway. *Schizophrenia Bulletin*, 35(3), 549--562. DOI: 10.1093/schbul/sbp006

---

*Version 5.2 Working Draft -- Last updated 2026-02-10 -- Kevin Qi*

*Source of Truth: QIF-TRUTH.md*
