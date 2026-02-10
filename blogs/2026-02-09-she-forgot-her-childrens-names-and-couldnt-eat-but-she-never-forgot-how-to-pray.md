---
title: "She Forgot Her Children's Names and Couldn't Eat, But She Never Forgot How to Pray"
subtitle: "How a security engineer's question about the OSI model led to a framework protecting the most intimate technology ever built"
date_posted: "2026-02-09"
source: "https://qinnovate.com"
tags: ["#BCI", "#Alzheimers", "#Neurosecurity", "#QIF", "#NSP", "#Tinnitus", "#VisionRestoration", "#CognitiveSovereignty"]
---

## The Framework That Came From a Question

I believe we can treat conditions we have been told to accept.

Tinnitus. Vision loss. The slow erasure of memory itself. Not in some distant generation. Within reach of the science and engineering we have right now.

I arrived at this belief through an unusual door. I am a security engineer who studies neuroscience independently. I am not a neuroscientist or a physician. I identified a gap at the intersection of these fields and built a framework to address it. Validating that framework requires collaboration with domain experts in neuroscience, biomedical engineering, and clinical practice.

In January 2026, I published an essay called ["The OSI of Mind"](https://qinnovate.com/publications/osi-of-mind/) that asked one question: **what does the OSI model look like if the endpoint is the human mind?**

If you have worked in IT, you know the OSI model. Seven layers that standardize how computers communicate. It is how we reason about everything from physical cables to application exploits. Silicon is now in the brain. Neuralink, Synchron, Blackrock Neurotech. These devices have been in human skulls since 2004. They are tested for safety and efficacy. They are not tested against adversarial threats.

So I asked: where are the layer boundaries between silicon and neuron? What are the attack surfaces at each? How do we authenticate signals between device and brain?

That question became a framework. I combined what I knew about cybersecurity architecture with what I had studied in neuroscience and the physical sciences. The result is [QIF](https://qinnovate.com) (Quantum Indeterministic Framework for Neural Security). QIF models the BCI security boundary as an hourglass: seven bands of silicon on one side, seven bands of biology on the other, pinching at I0, the physical interface where electrode meets tissue. Every band has characteristic frequencies, spatial scales, coupling mechanisms, and attack surfaces.

When I started mapping threats to those layers, something unexpected happened. The attack catalog read, from the other direction, as a capabilities catalog for medicine.

Many of the techniques that could harm a brain through a BCI could also heal one. The physics of signal injection and neural modulation is identical whether the intent is adversarial or therapeutic. The difference is consent, oversight, and a verified security envelope.

That realization changed the entire direction of my work.

· · ·

## If We Can Inject Memory, Why Can't We Inject Senses?

[Research documents](https://www.sciencedirect.com/science/article/pii/S0925753522003903) that adversarial signal injection can compromise brain-computer interfaces, spoofing a user's identity or manipulating their cognition. [GAN-based toolkits](https://dl.acm.org/doi/10.1145/3427376) can generate synthetic neural signals realistic enough to fool a classifier. Phase dynamics replay can mimic an individual's neural trajectory well enough to bypass authentication.

If an attacker can inject false signals that the brain interprets as real, then a clinician, with the right protocol, can inject *real* signals that the brain interprets correctly. Sensory signals. Therapeutic stimulation. Corrective patterns.

The question is not whether the physics allows it. The physics allows it. The question is whether we can do it ethically, within reason, with security at the core.

I believe vision is the first place the industry can prove this framework works.

· · ·

## Vision Restoration: The First Proof Case

Cortical visual prostheses are already in human trials. [Neuralink's Blindsight](https://neuralink.com/) has FDA Breakthrough Device Designation. [High-performance speech neuroprostheses](https://doi.org/10.1038/s41586-023-06377-x) have decoded attempted speech at 62 words per minute (Willett et al., 2023) and driven digital avatars from brain signals ([Metzger et al., 2023](https://doi.org/10.1038/s41586-023-06443-4)). The hardware to build a complete vision restoration pipeline exists as commercial products today.

The chain: iPhone LiDAR and Intel RealSense capture depth and scene data. Unity or Unreal Engine renders visual information in 8-16ms. A neural encoder translates visual features into electrode stimulation patterns. The electrode array delivers those patterns to visual cortex.

Estimated total pipeline latency from sensor to electrode: 24-71ms (based on component specifications; not yet validated as an integrated system). The cortex has a roughly 100ms temporal integration window linked to alpha-band oscillations. The signal fits. The neural encoding step remains a significant research challenge, the subject of active investigation across multiple labs. But the component latency demonstrates that real-time translation is within engineering reach.

Every component ships commercially. The integration problem is solvable. [Cochlear implants proved](https://www.nidcd.nih.gov/health/cochlear-implants) decades ago that the brain can learn to interpret compressed sensory input from an electrode array. Cortical plasticity handles the rest.

What does not exist yet is the security protocol that validates every signal in this pipeline. That the scene data is authentic, not injected. That the rendering has not been tampered with. That the stimulation pattern was prescribed by a physician, not crafted by an attacker. That the electrode is talking to real visual cortex, not being spoofed.

Without that protocol, no ophthalmologist signs off on a cortical vision prosthesis. The device works. The trust layer does not exist yet.

· · ·

## Building on the Field

QIF is not the first effort to address BCI security. [Bernal et al. (2021)](https://dl.acm.org/doi/10.1145/3427376) in *ACM Computing Surveys* established a foundational taxonomy of roughly 20 attack techniques. The [University of Murcia group (Lopez Bernal et al.)](https://cacm.acm.org/research/eight-reasons-to-prioritize-brain-computer-interface-cybersecurity/) has published extensively on neural cyberattacks and named eight reasons to prioritize BCI cybersecurity in *Communications of the ACM*. [Landau, Puzis & Nissim (2020)](https://dl.acm.org/doi/10.1145/3372043) mapped attacks across BCI and Bluetooth layers. [Pycroft et al. (2016)](https://pubmed.ncbi.nlm.nih.gov/27184896/) named 9 brainjacking attacks against invasive neuromodulators in *World Neurosurgery*. [Martinovic et al. (2012)](https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/martinovic) demonstrated the foundational P300 side-channel attack at USENIX Security, proving that consumer EEG headsets could extract private information from users who did not know they were being probed.

More recently, [Schroder et al. (2025)](https://doi.org/10.1007/s12152-025-09607-3) at the Yale Digital Ethics Center published "Cyber Risks to Next-Gen Brain-Computer Interfaces" in *Neuroethics*, proposing security recommendations for manufacturers and regulators. The [U.S. GAO published a policy report (GAO-25-106952)](https://www.gao.gov/products/gao-25-106952) on BCI challenges including cybersecurity. The [FDA finalized medical device cybersecurity guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-system-considerations-and-content-premarket-submissions) in June 2025, now requiring cybersecurity documentation for all "cyber devices." IEEE has [active standardization work](https://standards.ieee.org/wp-content/uploads/import/documents/presentations/ieee-neurotech-for-bmi-standards-roadmap.pdf) for brain-machine interfaces. China implemented the first national BCI medical device standard ([YY/T 1987-2025](https://www.tomshardware.com/peripherals/wearable-tech/china-targets-brain-computer-interface-race-with-new-standard-new-bci-standard-could-lead-to-breakthroughs-as-soon-as-2027)) effective January 2026. Chile has [constitutional neurorights protection](https://courier.unesco.org/en/articles/chile-pioneering-protection-neurorights). [UNESCO published global neurotechnology standards](https://captaincompliance.com/education/unescos-global-neurotechnology-standards/) in November 2025.

QIF builds on this collective work and addresses a specific gap: no existing framework provides a physics-based, cross-layer validation protocol that spans the full stack from silicon to synapse. NSP is designed to complement these regulatory and policy efforts with a concrete technical implementation.

## The Unified Registry

Before QIF, no published taxonomy organized BCI attacks into the tactic-technique-procedure hierarchy that makes MITRE ATT&CK operationally useful for detection engineering and red team operations. The existing work was serious and foundational, but siloed by domain: neural-level attacks in one paper, Bluetooth attacks in another, adversarial ML attacks in a third.

Building on these foundational taxonomies, QIF synthesized a unified registry by applying cross-layer analysis across the full silicon-to-synapse stack. After years of independent study in both cybersecurity and neuroscience, a focused sprint consolidated the existing research, three prior inventories, and novel cross-layer analysis into one taxonomy: **71 techniques across 11 tactics**, formatted in MITRE ATT&CK's native structure.

Of those 71 techniques, the evidence levels are explicit: 14 are CONFIRMED (observed in real systems), 19 DEMONSTRATED (proven in controlled research), 16 EMERGING (partial evidence), and 22 THEORETICAL (derived from known physics but not yet demonstrated). Unlike MITRE ATT&CK, which catalogs only observed adversary behavior, this registry includes theoretical techniques at the frontier of BCI attack research, marked accordingly, because waiting for the first brain implant breach to document the technique is not an acceptable timeline.

The reason the count exceeds prior work is not speed of derivation. It is the cross-layer architecture. Threats that live *between* layers only become visible when you model the full stack. For example: intermodulation attacks where the BCI's own Bluetooth radio mixes with neural signals in nonlinear tissue to create unintended stimulation at harmonic frequencies. Or separatrix exploitation, where an attacker nudges a neural system's dynamical trajectory just enough to cross a phase-space boundary, triggering a state transition the patient never consented to. These cross-layer threats are invisible to any framework that treats silicon and biology as separate domains.

The [complete registry is public](https://qinnovate.com/runemate/). Every technique has a severity score, detection status, coupling mechanism, and evidence level. Researchers can use it, extend it, challenge it. Device manufacturers can audit against it.

· · ·

## The Same Physics, Different Intent

A replay attack injects synthesized neural trajectories to spoof a user's identity. Therapeutic neural stimulation delivers optimized patterns to suppress tinnitus percepts. Same mechanism: inject signals the brain interprets as genuine. The difference is consent, medical oversight, and a verified security envelope.

Bifurcation forcing pushes a neural system past a tipping point to induce a seizure. Controlled deep brain stimulation applies calibrated stimulation to shift neural dynamics toward a healthy attractor state. Same mechanism: move the system across a bifurcation boundary. The difference is the same.

Our [threat registry](https://qinnovate.com/runemate/), read from the other direction, is a **capabilities catalog for medicine**. Every technique where the mechanism touches neural tissue, from signal injection to bifurcation control to neural entrainment, maps directly to a therapeutic modality when the adversarial intent is replaced with clinical intent and appropriate safeguards. The difference between a harmful injection and a beneficial stimulation is the protocol governing consent, authentication, and signal validation.

The remaining techniques (firmware attacks, supply chain compromise, side-channel leakage, data harvesting) operate at the silicon and network layers, not the biology. They do not map to therapies today. But we know far less about the brain than we know about silicon. As BCI research matures and we understand more about how system-level behavior affects neural outcomes, those gaps may close. The framework exists precisely to make those connections visible as they emerge.

· · ·

## The Protocol

Here is where I need to be precise about language, because the framing matters.

Clinical BCI research should proceed at full pace. It is proceeding at full pace. Clinical trials have controlled environments, institutional review boards, informed consent, and researchers monitoring every session. That is appropriate and necessary. I want more of it, faster.

The transition I am focused on is from clinical to consumer. As BCIs become more widely adopted and more researchers identify vulnerabilities that are not just at the silicon layer anymore, we are talking about cognitive sovereignty. The security of the mind itself.

When a BCI leaves the lab and enters someone's home, the threat surface changes. The device connects over Bluetooth or Wi-Fi. It receives firmware updates over the air. No researcher monitors the session. The patient is alone.

[Yale researchers warn](https://news.yale.edu/2025/07/23/study-offers-measures-safeguarding-brain-implants): "A widespread security breach in standardized BCI systems could affect millions of users simultaneously, leading to mass manipulation of neural data or impairment of cognitive functions."

No audiologist prescribes a tinnitus correction implant if the stimulation patterns can be replayed or corrupted. No ophthalmologist signs off on a cortical vision prosthesis if the rendering pipeline has no authentication between sensor and electrode. No neurologist recommends a hippocampal bypass if the firmware can be tampered with over Bluetooth.

I have spent the past year building that protocol. It is called the **Neural Sensory Protocol (NSP)**, part of the QIF framework, published through [Qinnovate](https://qinnovate.com).

NSP is not a certification you buy. It is a protection protocol built into the device at the hardware level, the way TLS is built into every web browser. Your browser does not "pass TLS." Your browser *runs* TLS. If it is not running, the connection does not open. NSP works the same way. If it is not running, the neural connection does not open.

The protocol validates signals through six layers of physics-based checks we call **Biological TLS**:

**Layer 1, Spatial Physics.** Is this signal from a brain? Check the electromagnetic dipole pattern. Electronic injection from an external antenna has the wrong spatial signature. A brain produces it. A signal generator does not.

**Layer 2, Temporal Physics.** Does the signal obey Hodgkin-Huxley neural dynamics? Biological neurons have refractory periods, specific action potential waveforms, characteristic burst patterns. Synthetic signals fail this.

**Layer 3, Statistical Physics.** Does the signal show biological randomness? Real neural signals have [1/f spectral scaling](https://www.jneurosci.org/content/23/35/11167), [power-law avalanches](https://www.jneurosci.org/content/23/35/11167), and long-range temporal correlations. To our knowledge, no current GAN has demonstrated simultaneous replication of all these features, though this is an active area of adversarial ML research.

**Layer 4, Microstate Compliance.** Does the signal cycle through the [four canonical EEG microstates](https://doi.org/10.1007/s10548-023-00993-6)? These four spatial configurations (A, B, C, D) were discovered in 1987 and [replicated extensively across studies](https://doi.org/10.1007/s10548-023-00993-6) (Koenig et al., 2024 meta-analysis). Any signal not cycling through them is not from a human brain. Note: microstates are a scalp-level phenomenon; their applicability to local field potentials from cortical implants is a hypothesis requiring empirical validation.

**Layer 5, Challenge-Response.** Does the brain respond involuntarily to stimuli? Flash a light: the visual cortex produces a steady-state evoked potential locked to that frequency. Play a click: the brainstem produces 5 peaks within 10ms. These responses cannot be faked without a biological nervous system generating them.

**Layer 6, Dynamical Fingerprint (optional).** For individual identification: validate phase space geometry, Lyapunov exponents, and attractor topology.

Layers 1 through 5 require no enrollment, no stored baseline, and no prior knowledge of the user. They validate that the signal comes from *a* brain, not that it comes from a *specific* brain (Layer 6 addresses individual identification). The security comes from physics, not identity. Estimated power budget for all five layers: roughly 310 microwatts, an engineering target based on component power analysis, not yet validated on hardware. Well within the 15-40mW thermal safety ceiling of implanted BCI devices.

The entire protocol, threat model, and framework are open access. Qinnovate is an open research initiative, not a vendor. We publish the spec. BCI researchers and manufacturers implement it. The protocol improves through collaboration with the people who work directly with electrodes, stimulation patterns, and patient data. I need those researchers. Not as customers. As collaborators who can stress-test this against real hardware and real neural signals.

## What Has Not Been Tested

NSP has not been validated against real BCI hardware or real neural signals. The 71-technique registry has not been peer-reviewed in a formal journal. The power budget estimate is theoretical, not measured. The claim that no GAN can match all five statistical features simultaneously is a hypothesis, not a demonstrated result. The vision restoration pipeline latency is an aggregate of individual component specifications, not an integrated system measurement. Layer 4's microstate assumption at the implant level has not been tested against electrode-tissue interface data from actual devices.

The next steps are concrete: hardware validation of NSP against a specific BCI platform, formal peer review submission of the threat registry, and collaboration with neuroscience and biomedical engineering labs that can provide the domain expertise this framework requires. The [EEG authentication threat literature](https://pmc.ncbi.nlm.nih.gov/articles/PMC11824856/) identifies liveness detection gaps that are precisely what NSP's physics-based layers are designed to address.

These are the open questions. Stating them does not weaken the framework. It maps exactly where the work needs to go next.

· · ·

## What the Soul Remembers

My grandmother had Alzheimer's disease.

In the end, she could not remember my name. She could not remember her children's names. She could not feed herself. The most basic act of survival, something infants figure out without instruction, was gone.

But she never forgot how to meditate. She never forgot how to pray.

The human brain does not have one memory system. It has several, and they live in different neighborhoods. **Explicit (declarative) memory** handles the conscious recollection of facts, faces, and events. It depends on the **hippocampus** and **medial temporal lobe**. **Implicit (procedural) memory** handles the unconscious knowledge of *how* to do things. It relies on the **cerebellum**, **basal ganglia**, and **motor cortex**.

[Alzheimer's attacks the medial temporal lobe first](https://pmc.ncbi.nlm.nih.gov/articles/PMC2655107/), particularly the entorhinal cortex and hippocampus. This is where amyloid plaques and tau tangles take hold earliest, following the progression that Braak staging has mapped across decades of neuropathology. But the cerebellum, home of procedural memory, [remains relatively preserved until later stages](https://journals.sagepub.com/doi/pdf/10.1177/1533317507303761), though [emerging research](https://pmc.ncbi.nlm.nih.gov/articles/PMC11245631/) suggests earlier cerebellar involvement than previously thought.

This is why my grandmother could forget her own daughter but still fold her hands in prayer. Meditation was not a memory she *recalled*. It was a skill her body *knew*. The disease took everything stored in her hippocampus. It could not touch the patterns etched into her cerebellum through decades of practice.

[Research confirms](https://pmc.ncbi.nlm.nih.gov/articles/PMC7889687/) that "procedural memory is relatively preserved in patients with Alzheimer's dementia" and that patients "demonstrate a long retention time, indicating they are able to retain procedural skills." This preservation is strongest in mild cognitive impairment; the picture grows more variable as the disease progresses.

She did not remember *to* pray. Her body simply *prayed*, the way it breathed, the way her heart beat.

When she passed, she was sitting in meditation. Her body failing, her spirit intact, leaving this world through a door her disease could never lock.

[An estimated 57 million people](https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2025.1585711/full) globally live with dementia (GBD 2019 baseline). By 2050: an estimated 153 million. [7.2 million Americans](https://pmc.ncbi.nlm.nih.gov/articles/PMC12040760/) age 65 and older have Alzheimer's. Deaths from Alzheimer's have [increased 142%](https://www.alz.org/news/2025/facts-figures-report-alzheimers-treatment) since 2000.

The convergence of DBS, amyloid-targeting therapies, and BCI-mediated stimulation suggests that meaningful intervention in neurodegenerative disease progression is within reach. DBS targeting the **fornix** showed [trends toward slowed cognitive decline](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2023.1154180/full) in 5 of 6 patient cohorts, though pooled analysis did not reach statistical significance in the meta-analysis (small sample sizes remain a limitation). Two patients showed [hippocampal volume increases](https://www.nature.com/articles/s41467-022-34510-3) of 5.6% and 8.2%, with [2025 biomarker data](https://pmc.ncbi.nlm.nih.gov/articles/PMC12198481/) supporting the disease-modification potential. [Nanoparticle research in preclinical models](https://www.sciencedaily.com/releases/2025/10/251029100154.htm) has achieved 50-60% reduction in brain amyloid within one hour. [Lecanemab and donanemab](https://journals.lww.com/jcma/fulltext/2025/07000/a_2025_update_on_treatment_strategies_for_the.2.aspx) clear amyloid plaques and slow decline by roughly 30% (27% and 35% respectively).

Those devices, those stimulation patterns, those molecular therapies: they all need a security protocol built into the silicon. Not because the research is dangerous. Because the research is too important to let a preventable security failure give regulators a reason to say no.

Every family watching someone they love disappear deserves both the technology and the assurance that it will not be turned against them.

And my tinnitus? That will be solved too, if we can fix memories and vision. Different parts of the brain, different QIF tactics and techniques, but one framework that we in neuroscience and security can approach together, today.

· · ·

*This essay is dedicated to my grandmother. May her meditation never end.*

*The technical components for these interventions exist. The missing layer is a validated security protocol that makes clinical deployment trustworthy. That is the gap QIF and NSP are designed to fill.*

---

**Sources:**
- [2025 Alzheimer's Disease Facts and Figures, Alzheimer's Association](https://www.alz.org/news/2025/facts-figures-report-alzheimers-treatment)
- [PMC: 2025 Alzheimer's Disease Facts and Figures](https://pmc.ncbi.nlm.nih.gov/articles/PMC12040760/)
- [Cell: The Evolving Landscape of Alzheimer's Therapy](https://www.cell.com/cell/fulltext/S0092-8674(25)01368-6)
- [NIA: What Happens to the Brain in Alzheimer's Disease](https://www.nia.nih.gov/health/alzheimers-causes-and-risk-factors/what-happens-brain-alzheimers-disease)
- [PMC: Preserved Implicit Memory in Dementia](https://journals.sagepub.com/doi/pdf/10.1177/1533317507303761)
- [PMC: Procedural Learning in MCI and Alzheimer's](https://pmc.ncbi.nlm.nih.gov/articles/PMC7889687/)
- [Nature Communications: Optimal DBS Sites for Alzheimer's](https://www.nature.com/articles/s41467-022-34510-3)
- [ScienceDirect: BCIs in Safety and Security Fields](https://www.sciencedirect.com/science/article/pii/S0925753522003903)
- [Yale: Safeguarding Brain Implants](https://news.yale.edu/2025/07/23/study-offers-measures-safeguarding-brain-implants)
- [Schroder et al.: Cyber Risks to Next-Gen BCIs, Neuroethics 2025](https://doi.org/10.1007/s12152-025-09607-3)
- [GAO-25-106952: Brain-Computer Interfaces](https://www.gao.gov/products/gao-25-106952)
- [FDA: Cybersecurity in Medical Devices, Final Guidance 2025](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-system-considerations-and-content-premarket-submissions)
- [Martinovic et al.: On the Feasibility of Side-Channel Attacks with BCIs, USENIX Security 2012](https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/martinovic)
- [Bernal et al.: Security in BCIs, ACM Computing Surveys 2021](https://dl.acm.org/doi/10.1145/3427376)
- [Lopez Bernal et al.: Eight Reasons to Prioritize BCI Cybersecurity, CACM](https://cacm.acm.org/research/eight-reasons-to-prioritize-brain-computer-interface-cybersecurity/)
- [Landau, Puzis & Nissim: Mind Your Mind, ACM Computing Surveys 2020](https://dl.acm.org/doi/10.1145/3372043)
- [Pycroft et al.: Brainjacking, World Neurosurgery 2016](https://pubmed.ncbi.nlm.nih.gov/27184896/)
- [Willett et al.: High-Performance Speech Neuroprosthesis, Nature 2023](https://doi.org/10.1038/s41586-023-06377-x)
- [Metzger et al.: Neuroprosthesis for Speech and Avatar Control, Nature 2023](https://doi.org/10.1038/s41586-023-06443-4)
- [Koenig et al.: EEG-Meta-Microstates, Brain Topography 2024](https://doi.org/10.1007/s10548-023-00993-6)
- [Germann et al.: Biomarker Changes in Fornix DBS for Alzheimer's, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12198481/)
- [PMC: EEG Authentication Threats and Mitigations, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11824856/)
- [IEEE: Neurotechnologies for BMI Standards Roadmap](https://standards.ieee.org/wp-content/uploads/import/documents/presentations/ieee-neurotech-for-bmi-standards-roadmap.pdf)
- [Chile Neurorights, UNESCO Courier](https://courier.unesco.org/en/articles/chile-pioneering-protection-neurorights)
- [Cerebellum in Alzheimer's, MedComm 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11245631/)
- [Neuralink](https://neuralink.com/)
- [Synchron](https://synchron.com/)
- [Lenire](https://www.lenire.com/)
- [QIF Threat Registry (Runemate)](https://qinnovate.com/runemate/)
- [QIF Framework and NSP Protocol](https://qinnovate.com)

*The original grandmother essay was written in January 2026. This version incorporates the origin story of QIF, the threat registry timeline, and the NSP reframing from Derivation Log Entry 48. Research conducted January-February 2026. Research synthesis assisted by Claude (Anthropic, 2025-2026). All original ideas, frameworks, and conclusions are the author's own.*

· · ·

**Sub-Tags:** #Alzheimers #Neuroscience #BrainComputerInterface #Cybersecurity #QIF #NSP #CognitiveSovereignty #Tinnitus #VisionRestoration #Neurotechnology

---

*Follow the work: [Qinnovate](https://qinnovate.com) | [GitHub](https://github.com/qinnovates)*
