# Quantum Encryption and Neural Interface Security: A Framework for Post-Quantum BCI Protection

*Bridging Physics-Based Security and the ONI Framework*

**Kevin L. Qi**

Independent Researcher

---

## Abstract

This paper examines the intersection of quantum encryption technologies and brain-computer interface (BCI) security within the context of the Open Neural Interface (ONI) Framework. As quantum computing advances threaten classical cryptographic systems through algorithms such as Shor's factorization method, a parallel development in quantum security offers physics-based protections that do not rely on computational hardness. This work synthesizes seven layers of quantum encryption technology—from foundational principles like the no-cloning theorem through quantum key distribution (QKD), quantum secure direct communication (QSDC), and post-quantum cryptography—into a unified architecture applicable to neural interfaces. The ONI Framework's extension of the OSI model into neural territory (Layers 8–14) provides a structured threat surface for applying these quantum security principles. We propose that quantum tunneling, while serving as a conceptual entry point, yields to a more practical insight: physics-based key distribution offers observer-detectable interception without requiring data itself to traverse quantum channels. The Scale-Frequency Invariant (f × S ≈ k) is applied as a cross-domain coherence metric spanning quantum computing vulnerabilities, QKD security features, and neural interface protection. This framework positions BCIs not merely as classical endpoints requiring encryption, but as potential quantum terminals in a distributed quantum network architecture.

*Keywords:* quantum key distribution, brain-computer interface, ONI Framework, post-quantum cryptography, neural security, Bell states, coherence

---

## 1. Introduction

### 1.1 The Quantum Security Paradox

The same physics that enables quantum tunneling—superposition, entanglement, the uncertainty principle—creates both the greatest threat to current encryption and the ultimate solution for future security. This paradox lies at the heart of the quantum encryption revolution: the quantum mechanics that will break RSA encryption also provides mathematically unbreakable security when applied correctly.

This paper extends the analysis presented in the companion blog article, "Can Hackers Attack Quantum Computers Across Time and Space?" (Qi, 2026), by providing rigorous technical depth on quantum encryption mechanisms and their application to the ONI Framework's neural security layers.

### 1.2 The ONI Framework Context

The Open Neural Interface (ONI) Framework extends the traditional OSI networking model into biological territory:

| Layer Range | Domain | Examples |
|-------------|--------|----------|
| L1–L7 | Classical OSI | Physical, Data Link, Network, Transport, Session, Presentation, Application |
| L8–L10 | Neural Interface | Electrode, Local Field Potential, Oscillatory |
| L11–L14 | Cognitive | Working Memory, Attention, Executive, Identity |

Classical encryption can protect data *between* these layers but cannot guarantee that observation at any layer is detectable. Quantum security offers a fundamentally different guarantee: interception becomes physically self-defeating.

### 1.3 Reframing: From Tunneling to Key Distribution

Quantum tunneling served as a conceptual lens—a way to reason about barriers and bypass. However, the practical security application does not require data to tunnel through barriers. It requires *keys* that cannot be intercepted without detection.

| Concept | What It Describes |
|---------|-------------------|
| Quantum tunneling | Particles crossing barriers (physics of matter/energy) |
| Quantum information | Data encoded in quantum states (qubits, entanglement) |
| Quantum communication | Transmitting quantum states (QKD, teleportation protocols) |

QKD delivers the security benefit of quantum mechanics—observer-detectable interception—without requiring data itself to travel as qubits. The keys traverse the quantum channel; the data travels classically, protected by those keys. Tunneling was the metaphor; key distribution is the mechanism.

---

## 2. The Quantum Threat Landscape

### 2.1 Shor's Algorithm and Classical Encryption Vulnerability

Peter Shor's 1994 algorithm factors large integers in polynomial time on a quantum computer (Shor, 1994). The implications are severe:

- **RSA-2048**: Approximately 1 billion years to crack classically; potentially hours on a sufficiently powerful quantum computer
- **Elliptic Curve Cryptography (ECC)**: Equivalent vulnerability through quantum discrete logarithm attacks
- **Infrastructure at risk**: Every HTTPS connection, VPN, and digital signature using these algorithms becomes eventually breakable

Current estimates from Google's Craig Gidney suggest fewer than 1 million noisy qubits could break RSA-2048 in under a week (Gidney & Ekerå, 2021).

### 2.2 The HNDL Threat Model

Harvest Now, Decrypt Later (HNDL) attacks represent an immediate concern despite quantum computers not yet achieving cryptographic relevance:

| Data Type | Required Secrecy Period | Risk Level |
|-----------|------------------------|------------|
| Medical records | 50+ years | High |
| State secrets | 25–75 years | High |
| Financial transactions | 7 years | Medium |
| Session tokens | Hours | Low |

Nation-state actors are presumed to be stockpiling encrypted communications for future decryption once quantum capabilities mature.

---

## 3. The Seven Layers of Quantum Encryption

### 3.1 Layer 1: The No-Cloning Theorem

In 1982, Wootters, Zurek, and Dieks proved that it is impossible to create an identical copy of an arbitrary unknown quantum state (Wootters & Zurek, 1982). This is not a technological limitation but a mathematical necessity arising from the linearity of quantum mechanics.

**Security Flow:**

1. Eve attempts to intercept and copy quantum key
2. No-cloning theorem prevents perfect copy
3. Eve's measurement disturbs quantum state
4. Alice and Bob detect anomalies in error rate
5. Key is discarded—Eve learns nothing

The best an attacker can achieve is 5/6 fidelity (83.3%), and even this imperfect cloning is detectable through error rate analysis.

### 3.2 Layer 2: Quantum Random Number Generation (QRNG)

Every encryption system depends on randomness. Classical pseudo-random number generators (PRNGs) are deterministic; given the seed, the entire sequence is predictable.

QRNG measures true randomness from quantum phenomena—typically photon arrival times, vacuum fluctuations, or beam splitter outputs. This randomness is fundamentally unpredictable because it arises from quantum indeterminacy, not algorithmic complexity.

**Current implementations:**
- ID Quantique (commercial QRNG chips)
- Quantinuum Quantum Origin
- Cisco Outshift QRNG
- Space-grade QRNGs for satellite communications

### 3.3 Layer 3: Quantum Key Distribution (QKD)

QKD protocols use quantum states to distribute encryption keys with information-theoretic security—security that does not depend on computational assumptions.

#### 3.3.1 BB84 Protocol

Charles Bennett and Gilles Brassard's 1984 protocol operates as follows (Bennett & Brassard, 1984):

1. Alice generates random bits and random polarization bases (rectilinear or diagonal)
2. Alice encodes bits in photon polarizations and sends to Bob
3. Bob measures using randomly chosen bases
4. Alice and Bob publicly compare bases (not values)
5. They keep only bits where bases matched
6. They check a sample for errors—high error rate indicates eavesdropping

#### 3.3.2 E91 Protocol

Artur Ekert's 1991 protocol uses entangled photon pairs (Bell states) (Ekert, 1991):

**|Φ⁺⟩ = (1/√2)(|00⟩ + |11⟩)**

When Alice and Bob share entangled pairs:
- Their measurements are perfectly correlated
- Any eavesdropping breaks the entanglement
- Bell inequality violations confirm the channel is secure

#### 3.3.3 Hybrid Protocols (2025)

New frameworks combine BB84, B92, E91, and GHZ protocols with AI-assisted dynamic selection:
- Average quantum bit error rate (QBER): 0.02
- Key generation rate: 12 bits per round
- E91 consistently produces Bell violation S = 2.5, confirming entanglement fidelity

### 3.4 Layer 4: Quantum Secure Direct Communication (QSDC)

QSDC transmits messages directly through quantum channels without using keys:

**Traditional approach:** QKD distributes key → Classical encryption → Message transmission

**QSDC approach:** Message encoded in quantum states → Transmitted directly → Decoded at destination

**Advantages:**
- No key storage or management
- Eliminates key distribution vulnerabilities
- Any attack yields only random noise

**Current state:** 15-user networks demonstrated over 40 km fiber, achieving 50 bps at 1.5 km—sufficient for text, images, and audio.

### 3.5 Layer 5: Post-Quantum Cryptography (PQC)

While QKD provides physics-based security, classical algorithms resistant to quantum attack are needed where QKD is impractical.

**NIST-Standardized Algorithms (2024):**

| Algorithm | Type | Standard | Use Case |
|-----------|------|----------|----------|
| CRYSTALS-Kyber (ML-KEM) | Lattice-based | FIPS 203 | Key encapsulation |
| CRYSTALS-Dilithium (ML-DSA) | Lattice-based | FIPS 204 | Digital signatures |
| SPHINCS+ (SLH-DSA) | Hash-based | FIPS 205 | Digital signatures |
| FALCON | Lattice-based | Pending | Compact signatures |

**Mathematical Foundation—Module Learning With Errors (M-LWE):**

**b(x) = a(x) · s(x) + e(x)**

Where:
- a(x) = public polynomial (random coefficients)
- s(x) = secret polynomial (small coefficients)
- e(x) = error polynomial (small coefficients)

Finding s from (a, b) is computationally hard—even for quantum computers. Unlike RSA or ECC, lattice problems have no known efficient quantum algorithm.

### 3.6 Layer 6: Quantum Digital Signatures

**Post-Quantum Signatures (Classical Algorithms):**
- Dilithium/ML-DSA: Lattice-based, NIST standardized
- SPHINCS+: Hash-based, relies only on hash function security
- Google Cloud KMS now offers both ML-DSA-65 and SLH-DSA-SHA2-128S

**True Quantum Signatures:**
- Use quantum states as signature keys
- Security based on no-cloning theorem
- Public keys are quantum states that can only be created by someone knowing the private classical key

### 3.7 Layer 7: Quantum Homomorphic Encryption (QHE)

QHE enables computation on encrypted data without decryption:

1. Client encrypts data and sends to quantum server
2. Server performs computation on encrypted data
3. Server returns encrypted result
4. Client decrypts to obtain answer

The server never sees plaintext data, enabling secure cloud quantum computing with complete privacy delegation.

---

## 4. Bell States and Quantum Security Foundations

### 4.1 The Four Bell States

These maximally entangled two-qubit states form the foundation of quantum security protocols:

**|Φ⁺⟩ = (1/√2)(|00⟩ + |11⟩)**
**|Φ⁻⟩ = (1/√2)(|00⟩ − |11⟩)**

**|Ψ⁺⟩ = (1/√2)(|01⟩ + |10⟩)**

**|Ψ⁻⟩ = (1/√2)(|01⟩ − |10⟩)**

### 4.2 Security Implications

When Alice and Bob share a Bell state:

1. **Perfect correlation**: Measuring one qubit instantly determines the other's state
2. **Non-locality**: Correlation exists regardless of distance
3. **Eavesdropping detection**: Any measurement by Eve breaks the correlation
4. **Bell inequality violation**: Quantum correlations exceed classical limits (S > 2), proving the channel is genuinely quantum

In E91 protocol, security verification occurs through Bell inequality testing. If S > 2 (the classical limit), the channel is quantum and secure. If S ≤ 2, either the source is not entangled or eavesdropping is occurring.

---

## 5. The Complete Quantum Encryption Stack

The seven layers integrate into a unified architecture:

| Layer | Function | Technologies |
|-------|----------|--------------|
| 7: Computation | Compute on encrypted data | Quantum Homomorphic Encryption |
| 6: Authentication | Verify identity | Post-Quantum Signatures, True Quantum Signatures |
| 5: Key Distribution | Secure key exchange | QKD (BB84, E91), QSDC, Post-Quantum KEMs |
| 4: Data Encryption | Protect content | Symmetric encryption with quantum-distributed keys |
| 3: Randomness | Generate unpredictable values | QRNG |
| 2: Entanglement Infrastructure | Distribute quantum correlations | Bell state generation, Quantum repeaters, Quantum memories |
| 1: Physical Principles | Foundational security | No-Cloning, Heisenberg Uncertainty, Superposition |

---

## 6. Lunar Quantum Computing Infrastructure

### 6.1 Permanently Shadowed Regions (PSRs)

Near the lunar poles—particularly the South Pole at craters like Shackleton and Faustini—exist regions that never receive direct sunlight. Temperatures reach 20–40 Kelvin (-253°C to -233°C), colder than Pluto.

### 6.2 Physics Case for Lunar Quantum Computing

| Property | Earth Requirement | Lunar PSR Provides |
|----------|-------------------|-------------------|
| Temperature | 10–20 mK (dilution refrigerator) | 20–40 K (natural) |
| Cooling energy | Massive infrastructure | Up to 85% reduction |
| Vacuum | Complex chambers | Natural (~10⁻¹² torr) |
| Vibration | Isolation systems | Seismically quiet |
| EM interference | Extensive shielding | Far-side: complete radio silence |

**Note:** Superconducting qubits still require 10–20 millikelvin—1,000× colder than PSR temperatures. Dilution refrigerators remain necessary but operate far more efficiently starting from 40 K versus 300 K.

### 6.3 Earth-Moon Quantum Links

NASA's Deep Space Quantum Link project aims to establish quantum communication between Earth and Lunar Gateway.

**Current state:**
- Maximum demonstrated entanglement distribution: ~2,000 km
- Earth-Moon distance: 384,400 km
- Gap factor: 192×

**Progress indicators (2025):**
- 10 secret bits/second over 1,000 km with 9 repeater stations
- 90% storage-and-retrieval efficiency in quantum memories (Welinq QDrive)
- 99% fidelity entanglement over 30 km for 17 days (Deutsche Telekom)

---

## 7. Neural Terminals and Quantum Computing

### 7.1 The Universal Quantum Terminal Architecture

A 2024 paper in *Scientific Reports* describes distributed quantum computing where simple quantum devices (terminals) connect via entanglement to powerful quantum servers (cloud). The terminal needs only to generate and measure entangled photons—not perform full quantum computation.

### 7.2 IBM and Inclusive Brains Initiative

In June 2025, IBM and Inclusive Brains announced a joint study to:
- Apply quantum machine learning to brain activity classification
- Boost performance of multi-modal brain-machine interfaces

### 7.3 Quantum Effects in Biological Systems

Research suggests quantum coherence may exist in biological neural systems:

| System | Quantum Effect | Coherence Duration |
|--------|---------------|-------------------|
| Photosynthesis | Quantum coherence | Hundreds of femtoseconds |
| Bird navigation | Entanglement in cryptochrome proteins | Microseconds |
| Microtubules | Room-temperature quantum oscillations | Under investigation |

If biological neural systems exhibit quantum effects, BCIs may need to preserve quantum coherence—making them natural quantum terminals.

---

## 8. Application to the ONI Framework

### 8.1 Mapping Quantum Security to ONI Layers

The ONI Framework's upper layers (L8–L14) represent attack surfaces where quantum security principles apply:

| ONI Layer | Name | Classical Security | Quantum Security Potential |
|-----------|------|-------------------|---------------------------|
| L8 | Electrode | Encryption of recorded signals | Hardware tampering detection via quantum sensing |
| L9 | Local Field Potential | Encrypted transmission | Signal injection detection |
| L10 | Oscillatory | Pattern obfuscation | Coherence-based authentication |
| L11 | Working Memory | Access control | Observer-detectable read attempts |
| L12 | Attention | Salience filtering | Priority manipulation detection |
| L13 | Executive | Decision audit trails | Intent verification |
| L14 | Identity | Sovereignty protection | Physics-guaranteed observation detection |

### 8.2 Two Security Paradigms at the Neural Interface

**Classical BCI Security:** Encrypts the neural data stream. An attacker could intercept traffic between L8 (Electrode) and L10 (Oscillatory), but sees gibberish. Protection is computational—vulnerable to quantum threats.

**Quantum BCI Security:** Encodes neural signals in quantum states before transmission. An attacker attempting interception at any layer cannot observe without detection. Protection is physical.

| Model | Attack Vector | Protection | Weakness |
|-------|--------------|------------|----------|
| Classical | MITM at L8–L10 | Computational hardness | Shor's algorithm, key compromise |
| Quantum | Observation at L8–L14 | Physics guarantees detection | Implementation error, decoherence |

### 8.3 The Scale-Frequency Invariant Applied

The formula f × S ≈ k provides a cross-domain coherence metric:

**In Quantum Computing (Vulnerability):** When an attacker probes a quantum computer (increasing f), coherence (S) collapses. The computation fails—a denial-of-service attack written into physics.

**In QKD (Security Feature):** If an attacker increases interaction frequency with a quantum channel, spatial coherence of the key collapses. Collapse becomes the alarm—eavesdropping is detected.

**In Neural Interfaces (The Bridge):** If biological neural systems exhibit quantum coherence:
- Neural interfaces must preserve coherence to function optimally
- Attacks that disrupt coherence degrade BCI performance
- The f × S ≈ k framework applies to neural-quantum security

**Unifying insight:** Coherence is the fundamental resource. Whether protecting quantum computers, quantum networks, or quantum-biological interfaces, the physics is the same. The difference is whether coherence collapse is a vulnerability or a security feature.

---

## 9. Discussion

### 9.1 Classical Versus Quantum Security Models

The distinction between classical and quantum security is not merely technical—it is architectural:

| Aspect | Classical Security | Quantum Security |
|--------|-------------------|------------------|
| Protection basis | Mathematical complexity | Physical law |
| Attacker observation | Sees encrypted data | Cannot observe without detection |
| Vulnerability | Computational breakthroughs | Implementation flaws |
| Trust model | Math holds | Physics works |

Classical security bets that math is hard. Quantum security bets that physics is law.

### 9.2 Implications for BCI Development

As BCIs transition from research to clinical deployment, security architecture decisions made now will determine long-term sovereignty:

1. **Short-term (2025–2030):** Post-quantum cryptography adoption for BCI data encryption
2. **Medium-term (2030–2040):** QKD integration at the electrode-to-processor boundary
3. **Long-term (2040+):** Full quantum terminal architecture with physics-based neural sovereignty

### 9.3 The Sovereignty Question

At L14—Identity—the stakes transcend data confidentiality. A compromised channel to executive and identity layers is not merely a privacy breach; it is a breach of sovereignty.

Classical security asks: *Can they read it?*
Quantum security asks: *Can they touch it without us knowing?*

For BCIs operating at the cognitive boundary, the second question matters more.

---

## 10. Limitations

1. **Quantum hardware maturity:** Current quantum computers lack the qubit counts and coherence times for practical cryptographic attacks. Timelines remain uncertain.

2. **QKD distance constraints:** Point-to-point QKD is limited to approximately 100 km without repeaters. Earth-Moon links remain experimental.

3. **Neural quantum effects:** Evidence for quantum coherence in neural systems remains contested. BCI quantum terminal architectures are speculative.

4. **Implementation security:** Quantum protocols are theoretically secure but vulnerable to side-channel attacks in physical implementations.

5. **Cost and infrastructure:** QKD and quantum computing infrastructure remain expensive and inaccessible for most applications.

---

## 11. Future Work

1. **ONI-specific threat modeling:** Develop detailed attack trees for quantum threats at each ONI layer (L8–L14).

2. **QKD-BCI integration protocols:** Design practical protocols for quantum key distribution at the neural interface boundary.

3. **Coherence metrics for BCI security:** Apply the Scale-Frequency Invariant (f × S ≈ k) to quantify security states in neural systems.

4. **Hybrid classical-quantum architectures:** Develop transitional security models that gracefully upgrade from post-quantum cryptography to full QKD as infrastructure matures.

5. **Lunar quantum infrastructure roadmap:** Assess feasibility and timeline for quantum computing facilities in permanently shadowed regions.

---

## 12. Conclusion

The convergence of quantum encryption and neural interface security represents a critical juncture in BCI development. The same quantum mechanics that threatens classical encryption provides physics-based security guarantees unavailable through computational methods alone.

The ONI Framework's extension into neural territory (L8–L14) provides a structured approach to this challenge. By understanding quantum encryption's seven layers—from the no-cloning theorem through quantum homomorphic encryption—and mapping them to ONI's threat surfaces, we can architect BCIs that leverage physics rather than merely computation for security.

The parallel between quantum tunneling and VPN tunneling is ultimately less about data transport and more about the nature of barriers and observation. Classical security builds walls the enemy can see but not understand. Quantum security builds channels the enemy cannot observe without destroying.

For neural interfaces that will eventually connect to human cognition's deepest layers, the choice between these paradigms is not merely technical—it is foundational to whether human sovereignty remains inviolable in an age of neural integration.

---

## References

Bennett, C. H., & Brassard, G. (1984). Quantum cryptography: Public key distribution and coin tossing. *Proceedings of IEEE International Conference on Computers, Systems and Signal Processing*, 175–179.

Buzsáki, G. (2006). *Rhythms of the brain*. Oxford University Press.

Ekert, A. K. (1991). Quantum cryptography based on Bell's theorem. *Physical Review Letters*, *67*(6), 661–663. https://doi.org/10.1103/PhysRevLett.67.661

Gidney, C., & Ekerå, M. (2021). How to factor 2048 bit RSA integers in 8 hours using 20 million noisy qubits. *Quantum*, *5*, 433. https://doi.org/10.22331/q-2021-04-15-433

National Institute of Standards and Technology. (2024). *Post-quantum cryptography standardization*. https://csrc.nist.gov/projects/post-quantum-cryptography

Qi, K. L. (2026). Can hackers attack quantum computers across time and space? The truth is far more terrifying. *Cybersecurity Writeups*. https://cybersecuritywriteups.com/can-hackers-attack-quantum-computers-across-time-and-space-the-truth-is-far-more-terrifying-d74e41a2223a

Qi, K. L. (2026). The OSI of mind: Securing human-AI interfaces. *Medium*. https://medium.com/@qikevinl/the-osi-of-mind-securing-human-ai-interfaces-3ca381b95c29

Shor, P. W. (1994). Algorithms for quantum computation: Discrete logarithms and factoring. *Proceedings of the 35th Annual Symposium on Foundations of Computer Science*, 124–134. https://doi.org/10.1109/SFCS.1994.365700

Wootters, W. K., & Zurek, W. H. (1982). A single quantum cannot be cloned. *Nature*, *299*(5886), 802–803. https://doi.org/10.1038/299802a0

---

## Acknowledgments

The author wishes to acknowledge the support of colleagues and mentors in the development of this work. Initial research validation was conducted through LMArena (LMSYS, 2024-2025), enabling cross-model verification of hypotheses and findings to mitigate single-model bias. Deep research synthesis and writing assistance was provided by Claude (Anthropic, 2025). All original ideas, theoretical frameworks, analyses, and conclusions are the author's own. Final revisions, editing, and validation were performed by the author.

---

## Appendix A: Quantum Neural Network Architecture

*Figure A1. End-to-end quantum neural network architecture showing the signal flow from brain-computer interface through quantum infrastructure to lunar-based fault-tolerant computation.*

### A.1 Architecture Components

| Component | Location | Function | Connection Type |
|-----------|----------|----------|-----------------|
| **Neural Interface (BCI)** | User | Capture and encode neural signals | Bidirectional with Quantum Terminal |
| **Quantum Terminal** | Local | Generate/measure entangled photons, QKD operations | Bidirectional with Repeater Chain |
| **Quantum Repeater Chain** | Earth-to-Moon | Entanglement swapping, extend quantum links | Bidirectional relay |
| **Lunar PSR Quantum Computer** | Moon (Permanently Shadowed Region) | Fault-tolerant quantum computation | Receives delegated computations |

### A.2 Signal Flow Description

| Stage | Signal Type | Security Layer |
|-------|-------------|----------------|
| **Stage 1: Neural Capture** | Classical + potentially quantum neural signals | ONI Layers 8–14 monitoring |
| **Stage 2: Local Processing** | QKD-secured classical channel | Quantum key distribution |
| **Stage 3: Long-Distance Transmission** | Earth-Moon entanglement distribution | Bell state verification |
| **Stage 4: Remote Computation** | Fault-tolerant quantum processing | Natural cryogenic environment (20–40 K) |

### A.3 Security Framework

**Coherence Monitoring Principle:** f × S ≈ k

At every layer of the architecture, the Scale-Frequency Invariant applies:

| Layer | Frequency (f) | Spatial Coherence (S) | Security Implication |
|-------|---------------|----------------------|---------------------|
| Neural Interface | Neural oscillation rate | BCI field of view | Attack detection via coherence disruption |
| Quantum Terminal | QKD pulse rate | Local entanglement region | Eavesdropping detection |
| Repeater Chain | Entanglement swap rate | Inter-node distance | Channel integrity verification |
| Lunar Quantum Computer | Gate operation frequency | Qubit coherence length | Computation integrity |

---

## Appendix B: Related ONI Framework Publications

| Publication | Focus | Link |
|-------------|-------|------|
| The OSI of Mind | Framework introduction | [Blog-ONI_Framework.md](../0-oni-framework/Blog-ONI_Framework.md) |
| Your Brain Has a Spam Filter | Coherence metric | [Blog-Coherence_Metric.md](../coherence-metric/Blog-Coherence_Metric.md) |
| Your Brain Needs a Firewall | Neural firewall | [Blog-Neural_Firewall.md](../neural-firewall/Blog-Neural_Firewall.md) |
| Neural Ransomware | Cognitive threats | [Blog-Neural_Ransomware.md](../neural-ransomware/Blog-Neural_Ransomware.md) |
| The Hidden Equation | Scale-frequency invariant | [Blog-Scale_Frequency.md](../scale-frequency/Blog-Scale_Frequency.md) |
| Neuroethics Alignment | Ethics-to-framework mapping | [NEUROETHICS_ALIGNMENT.md](../../governance/NEUROETHICS_ALIGNMENT.md) |
| UNESCO Alignment | UNESCO 2025 Recommendation mapping | [UNESCO_ALIGNMENT.md](../../governance/UNESCO_ALIGNMENT.md) |
| Regulatory Compliance | US & international regulatory mapping | [REGULATORY_COMPLIANCE.md](../../governance/REGULATORY_COMPLIANCE.md) |

---

*Document Version: 1.0*
*Date: January 22, 2026*
*Series: ONI Framework Publications*
*Classification: Technical Document (TechDoc)*
