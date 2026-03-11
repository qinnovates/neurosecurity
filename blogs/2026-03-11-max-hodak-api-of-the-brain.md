---
title: "How Ethical Hackers Can Cure Blindness"
subtitle: "A capture-process-inject attack chain maps 1:1 to a vision restoration pipeline. I mapped every stage through TARA."
date: 2026-03-11
tags: [BCI, neurosecurity, QIF, TARA, clinical-mapping, vision-restoration, dual-use, interview-analysis, case-study]
type: case-study
author: Qinnovate
fact_checked: true
fact_check_notes:
  - "Source: 'How to Build the Future' interview with Max Hodak by Garry Tan (Y Combinator), published March 9, 2026"
  - "All quotes attributed to Hodak are from the auto-generated transcript of the interview"
  - "QIF mappings referenced are from the proposed TARA threat catalog (unvalidated framework)"
  - "GeRaF citation removed — paper not found in NeurIPS 2025 proceedings or any indexed database. Replaced with verified GSRF reference."
  - "Rayleigh diffraction claim softened — wavelength is correct but Rayleigh criterion is a physics misapplication for CSI-based WiFi sensing."
  - "DensePose from WiFi — removed '5 GHz' qualifier (paper does not specify frequency band)."
  - "BionicVisionXR — clarified 90 FPS is VR display rate, not phosphene computation benchmark."
  - "eLife 2024 phosphene simulation — corrected lead author from Granley to van der Grinten."
  - "FlexLED — corrected from 'cortical' to 'retinal (epiretinal)' stimulation."
  - "PRIMA bandwidth — labeled as estimated calculation, not published specification."
  - "de Ruyter van Steveninck 2022 — corrected mechanism description."
  - "Elnabawy 2022 — corrected from 'geometric primitives' to 'simplified visual representations' (clip-art GAN)."
---

Unreal Engine renders textures and objects without needing to know what it is simply using transform (position, rotation, scale). Who's to say this isn't possible. Your eyes are already rendering this screen. One day, the blind will be able to actually see a web browser and laugh at memes with the rest of us.

When they do, what would that look like? Besides just more meme spamming, I mean... if we were to redesign the browser and optimize it for the brain, where do we start? Would it look like DOS? White phosphenes are easier to induce after all.

Per a recent interview between Y Combinator and Max Hodak, co-founder of Neuralink, Big Pharma executives are now likely repositioning themselves for a digital future. [Full transcript](/learn/autodidactive/neuroscience/vision/max-hodak-bci-future-2026.md).

Over the past 3 months, I've asked how a security engineer with an admiration for art and therapy can bring a fresh lens on how BCIs can not only continue rapid innovations but also do so in a fashion that's secure and protects the user's free agency.

During my endeavors, I realized what now is clearly obvious -- that by mapping and threat modeling attacks with a risk score using what's already in the DSM provides a dual-lens perspective that may potentially provide therapeutic analogues. You can see the full [clinical TARA view here](/atlas/therapeutics/).

The same stimulation that Max alludes to in the interview to stimulate dopamine receptors can introduce threat vectors. That's where my work is different because rather than entering BCI research through the front door, I am entering through the backdoor. That's how my brain was trained by design. The Greeks didn't build the Trojan Horse to go through the front door, but rather, to get past a barrier they couldn't breach head-on.

For me, this is my metaphorical barrier -- using security-backed research and science. I don't come from the world of BCIs but the past 3 months have taught me immensely that while the industry is busy bringing medical equity to the subset of our population that need it the most, my goal is to ensure we have not only the security frameworks that BCI companies can reference, but also identify how unique backgrounds can bring a fresh perspective to the engineering world of BCIs.

What if the same attack chain a hacker uses to compromise a brain-computer interface is the exact same pipeline a clinician needs to restore sight? That's not a hypothetical. I mapped it.

Here's the chain: capture the world with a sensor, process it into neural-compatible signals, and inject it into the visual system. An attacker does this to manipulate what someone sees. A clinician does it to give sight to someone who lost it. The physics doesn't care about intent.

### The Attack Chain That Cures Blindness

My proposed [TARA threat catalog](/atlas/tara/) contains [109 attack techniques](/atlas/tara/ttps/) mapped across the BCI stack. When I traced the full capture-to-injection pipeline for vision, 11 TARA techniques formed a 5-stage chain -- and every single stage has a clinical analogue:

**Stage 1 — Capture** | Sense the physical environment
[QIF-T0090](/atlas/tara/QIF-T0090) WiFi CSI body sensing | Band: S1→S3 | Status: DEMONSTRATED

**Stage 2 — Eavesdrop** | Extract signal features
[QIF-T0003](/atlas/tara/QIF-T0003) Signal eavesdropping | Band: S1→S2 | Status: DEMONSTRATED

**Stage 3 — Encode** | Convert to neural-compatible format
[QIF-T0067](/atlas/tara/QIF-T0067) Phase dynamics replay | Band: S1→I0→N1-N7 | Status: DEMONSTRATED

**Stage 4 — Inject** | Deliver to neural tissue
[QIF-T0001](/atlas/tara/QIF-T0001), [T0009](/atlas/tara/QIF-T0009), [T0010](/atlas/tara/QIF-T0010), [T0014](/atlas/tara/QIF-T0014) | Band: I0→N1-N7 | Status: DEMONSTRATED

**Stage 5 — Replay** | Sustain continuous stimulation
[QIF-T0107](/atlas/tara/QIF-T0107) Neural nonce replay | Band: I0→N1 | Status: THEORETICAL

The pivot point is **T0067 -- phase dynamics replay**. In attack mode, it replays or synthesizes neural trajectories to spoof legitimate brain activity. In clinical mode, it's the exact mechanism cochlear implants and retinal prostheses use to encode sensory information into stimulation patterns the brain can interpret. Same physics. Different governance.

### The API of the Brain

Hodak explains the retina as a layered compression pipeline: roughly 126 million rods and cones connect to bipolar cells, which compress down to about 1.2-1.5 million retinal ganglion cells that form the optic nerve -- roughly a 100x compression before the signal even reaches the brain. (Hodak cites higher figures in the interview; standard neuroscience estimates are ~120M rods + 6M cones. The compression ratio holds either way.)

Science Corp's retinal prosthesis bypasses the dead rods and cones to stimulate the bipolar cells directly -- upstream of the compression layer. In the PRIMAvera pivotal trial (38 patients), the final NEJM results showed a mean improvement of 25.5 letters of visual acuity, with the best patient gaining 59 letters. This dramatically outperformed Second Sight's Argus II, which stimulated the ganglion cells downstream of the compression and produced limited real-world utility -- and eventually left 350+ patients with obsolete, unsupported devices.

Hodak puts it simply: "You can think of that as like the API of the brain." If you can characterize the signal representations at each layer, you can write to them. The brain handles the rest through plasticity.

The brain is not a black box -- it is a layered signal processing system, and each layer has discoverable input/output characteristics. A Stanford team decoded speech at 62 words per minute from intracortical recordings. Neuralink's PRIME study achieved wireless motor decoding at 8.0 bits/second in their first human participant. The engineering challenge is getting the right signals into the right layer at the right resolution.

If hackers can create a realistic digital map today using Bluetooth or Wi-Fi, then who is to say we can't couple it with OCR and AI to render the world. We have the full capability to do it -- it's just a matter of ethics and safety. That's why clinical testing takes so long, but it's exciting to see where the world is heading.

### The Sensor Rabbit Hole

This is where I went down a rabbit hole with the Kinect. I started experimenting with depth sensors -- taking video, converting it to point clouds, and rendering it in 3D with shaders. The [depth visualizations I built](/vision) take a standard video feed and displace every pixel based on luminance to reconstruct spatial depth. It's rough, but the principle is sound: all you need is a sensor and the right processing pipeline to reconstruct a usable representation of the world.

And that got me thinking. Theoretically, the phone already in someone's pocket has everything you need -- LiDAR on newer iPhones, the TrueDepth camera, accelerometers, gyroscopes. You don't need a dedicated depth sensor bolted to someone's head. The phone is always with them. It's always collecting spatial data. Pair that with OCR and AI models and you have a real-time rendering pipeline that could feed a visual prosthesis.

But here's the security engineering perspective: the moment you make the phone the sensor for a BCI vision system, you've introduced an attack surface that didn't exist before. The phone connects to cell towers, Wi-Fi, Bluetooth. It runs third-party apps. It syncs to the cloud. Every one of those is a vector. An attacker who compromises the phone now has a pathway to manipulate what gets fed to the implant -- and by extension, what the user sees.

That's exactly why I'm approaching this from security first. For the sake of demonstrating from a security engineering perspective, I used the Kinect as a controlled sensor -- isolated, no network stack, no app store. It lets me show the vision reconstruction concept without introducing the risks that come with a consumer device. But make no mistake: the industry will reach for the phone. And when it does, the security architecture needs to already be there.

This maps directly to what TARA catalogs at the [I0 boundary](/framework/) -- the interface between external hardware and biology. Whether the sensor is a Kinect, a phone, or AR glasses, the signal has to pass through a trust boundary before it reaches the implant. That's where [Neurowall](/guardrails/) sits.

### Walking the Chain: What Works, What Doesn't

Now that I've laid out the chain and the sensor question, let me walk through each stage with honest labels on what's demonstrated today, what's feasible near-term, and what's still theoretical.

**Stage 1: Capture — The Physics Ceiling**

Cameras work. Every vision prosthesis in clinical trials uses a camera mounted on glasses. But WiFi Channel State Information ([T0090](/atlas/tara/QIF-T0090)) can reconstruct 3D body pose through walls -- DensePose from WiFi (CMU, 2023) achieves body-part UV mapping from WiFi CSI signals, no camera required.

The problem is resolution. WiFi at 5 GHz has a wavelength of ~6cm, which sets a practical resolution floor for RF-based sensing. Deep learning adds learned priors from training data, but it cannot exceed the physics -- below the wavelength scale, it's filling in gaps from training data, not measuring.

**Resolution by frequency:**

- **2.4 GHz** (12.5 cm wavelength) — Room occupancy, breathing detection
- **5 GHz** (6 cm wavelength) — Body pose, gait, gestures
- **60 GHz / mmWave** (5 mm wavelength) — Hand gestures, facial features
- **77 GHz / automotive radar** (3.9 mm wavelength) — mm-level geometry (PanoRadar, MobiCom 2024)

WiFi alone cannot produce the resolution needed for a visual scene. But mmWave radar at 77 GHz achieves millimeter-level geometry. PanoRadar (MobiCom 2024) demonstrated panoramic 3D reconstruction from a single spinning radar. RF-based 3D Gaussian Splatting from radar is an active research area (GSRF, NeurIPS 2025) -- rendering novel views from radio signals alone, no camera. Feasible near-term, but not yet integrated into any BCI pipeline.

*Camera capture = demonstrated and in clinical use. WiFi/radar capture for BCI = theoretically possible but resolution-limited. mmWave capture = feasible near-term but not yet coupled to neural encoding.*

**Stage 2: Process — Game Engines Already Know How**

If gaming engines can identify and create texture models based on an object's dimension, density (sheen, surface, hue, saturation, lighting, depth), and relation in vector space -- then the future is looking very positive. The tools already exist:

- **BionicVisionXR** (Unity-based): Real-time phosphene simulation running at VR display rates. Renders what a prosthetic user would actually perceive through a given electrode array.
- **3D Gaussian Splatting** (SIGGRAPH 2023): 100+ FPS photorealistic novel-view synthesis. Already has Unreal Engine plugins.
- **4D Gaussian Splatting** (CVPR 2024): 82 FPS for dynamic scenes. Time-varying geometry.

Here's the counterintuitive finding: photorealism is **not what prosthetic vision needs.** Elnabawy et al. (2022) demonstrated that simplified visual representations -- generated by a GAN to produce high-contrast, clip-art-style imagery -- outperform photorealistic rendering for prosthetic users. The visual cortex, working with limited electrode resolution, does better with less information, not more.

The bottleneck is **live sensor to scene reconstruction** in real time. Material estimation takes ~3 seconds per object. The components exist separately -- sensors capture geometry, AI estimates materials, engines render -- but no integrated pipeline runs the full chain at the latency a prosthesis demands (<50ms). Each piece works. The plumbing between them doesn't exist yet.

*Individual rendering components = demonstrated. Full sensor-to-render at prosthetic latency = not yet demonstrated. Simplified rendering for prosthetic users = demonstrated to outperform photorealism.*

**Stage 3: Encode — Teaching the Brain to See**

This is where [T0067](/atlas/tara/QIF-T0067) (phase dynamics replay) sits. The sensor captured the world, the engine rendered it, and now the signal has to be translated into something neural tissue can interpret.

The encoding problem is not just "send a signal" -- it's "send a signal the brain will interpret as vision." AI is driving the real progress here:

- **End-to-end optimization** (de Ruyter van Steveninck, *J Vision* 2022): Optimizes the visual scene-to-stimulation mapping using a differentiable phosphene simulator.
- **Hybrid Neural Autoencoders** (Granley, NeurIPS 2022): Combine physics-based phosphene models with learned encoding.
- **Human-in-the-Loop optimization** (Granley, NeurIPS 2023): Patient provides feedback to iteratively refine the encoding model. The patient is literally training the encoder.
- **Differentiable phosphene simulation** (van der Grinten et al., *eLife* 2024): Makes the entire pipeline end-to-end differentiable -- from image to stimulation to predicted percept -- so gradient descent can optimize the encoding.

**Bandwidth reality across delivery methods:**

- **PRIMA** (photovoltaic, subretinal) — 378 channels | ~3.8 kbps estimated* | <10ms estimated* | In pivotal trial
- **Argus II** (epiretinal) — 60 channels | ~600 bps estimated | ~20ms | Defunct
- **Utah array** (cortical) — 96-1024 channels | ~10-100 kbps | <5ms | Research
- **FlexLED** (optogenetic, epiretinal) — 8,192 micro-LEDs | ~82 kbps estimated | ~5ms | Preclinical

*\*Estimated from published specs (378 pixels, 30 Hz frame rate, 0.7-9.8ms pulse width). Not published as cited specifications.*

PRIMA is a **write-only, passive implant** -- no bidirectional communication. The encoding is done entirely on the glasses-mounted processor. This matters for security because it means there's no way to validate signals at the implant itself.

*Subretinal encoding (PRIMA) = demonstrated in clinical trial. AI-optimized encoding = demonstrated in research. Full sensor-to-encode-to-stimulate from non-camera input = not yet demonstrated.*

**Stage 4: Inject — The I0 Boundary Problem**

This maps to multiple TARA injection techniques: [T0001](/atlas/tara/QIF-T0001) (electromagnetic injection), [T0009](/atlas/tara/QIF-T0009) (amplitude modulation), [T0010](/atlas/tara/QIF-T0010) (ELF entrainment), [T0014](/atlas/tara/QIF-T0014) (photonic/optogenetic injection). In attack mode, these inject unauthorized signals. In clinical mode, they deliver therapeutic stimulation. The injection physics is identical.

Every injection technique crosses the I0 boundary -- the interface between hardware and biology in [QIF](/framework/). For PRIMA, the I0 boundary is at the glasses processor: the implant is passive, so there's no way to validate signals at the implant itself. The goggles are the last trust boundary. Compromise the goggles, compromise the visual input.

This means the [Neurowall](/guardrails/) concept -- signal validation at I0 -- must run on the external processor for passive implants. The implant can't protect itself. The architecture has to protect it.

*Signal injection for vision restoration = demonstrated and in clinical use. Security validation at I0 for these devices = not implemented in any current clinical system.*

**Stage 5: Replay — Sustaining Vision**

[T0107](/atlas/tara/QIF-T0107) (neural nonce replay) in attack mode replays previously valid neural signals to bypass authentication. In clinical mode, this is just... continuous stimulation. A retinal prosthesis that stops replaying the encoded visual signal every frame would produce blackout, not vision.

*Continuous stimulation replay = demonstrated (every working prosthesis does this). Replay validation / freshness checking for therapeutic systems = not implemented.*

### The Gap Analysis

Here's what's missing to connect the full pipeline for clinical use:

**Gap 1: Sensor-to-scene reconstruction at prosthetic latency (<50ms)**
Components exist separately. No integrated pipeline runs end-to-end at the required speed. Severity: Critical -- this is the primary engineering bottleneck. Feasibility: Near-term (2-4 years). Each component is individually fast enough; the integration work is engineering, not physics.

**Gap 2: Non-camera sensor encoding pathways**
All current clinical systems use cameras. No encoding pipeline takes WiFi CSI, mmWave radar, or LiDAR as input. Severity: High -- limits prosthetic vision to camera-sighted scenarios. Feasibility: Medium-term (3-5 years). The encoding AI is sensor-agnostic in principle -- it needs geometry and features, not pixels specifically. But nobody has trained an encoder on radar input.

**Gap 3: Security architecture at I0 for passive implants**
PRIMA's passive photovoltaic design means zero computational capacity for signal validation. All trust resides in the glasses. No current prosthesis implements any signal validation, replay detection, or authentication. Severity: High today, Critical as devices become consumer-facing. Feasibility: Near-term. The Neurowall concept is architecturally defined; implementation requires engineering a lightweight validation layer on the glasses processor.

**Gap 4: Regulatory framework for dual-use techniques**
The same techniques classified as attacks in TARA are used therapeutically. No regulatory framework explicitly addresses this boundary. FDA 510(k)/PMA evaluates safety of intended use, not adversarial misuse. Severity: Medium -- not blocking clinical use, but blocking responsible deployment at scale. Feasibility: Long-term (5-10 years). Policy gap, not an engineering gap.

### The Flip

The attack chain: WiFi sense → eavesdrop → synthesize neural trajectory → inject → replay.
The clinical chain: Sense environment → extract features → encode for neural interface → stimulate → sustain.

Same chain. Same physics. Same TARA technique IDs. The difference is:

**Consent** — Attack: Absent. Therapy: Informed, documented, IRB-approved.

**Calibration** — Attack: Uncalibrated or weaponized. Therapy: Patient-specific, clinically validated.

**Validation** — Attack: Bypasses or doesn't exist. Therapy: Safety bounds, impedance monitoring.

**Oversight** — Attack: None. Therapy: Clinical team, FDA regulation, IEC 60601.

**Intent** — Attack: Disrupt, surveil, manipulate. Therapy: Restore function.

TARA wasn't built to catalog cures. But when you map 109 attack techniques across the BCI stack with enough granularity, the therapeutic analogues fall out because the physics is shared. The governance is what separates the two. The [therapeutic overlap analysis](/atlas/therapeutics/) maps this dual-use boundary technique by technique.

### Digital Adderall, Digital Ambien

The vision pipeline isn't the only place the dual-lens shows up. Hodak's most commercially significant observation: non-invasive brain stimulation could deliver "a digital Ambien or like a digital Adderall" -- targeting specific brain regions to induce focus or sleep without pharmaceuticals, potentially as a consumer device that does not require surgery. He frames this as an industry direction, not a Science Corp project -- Hodak explicitly states "I don't work on ultrasound."

This is not speculative. A systematic review of 35 human transcranial focused ultrasound studies (677 subjects) found dose-dependent cognitive and mood effects with no severe adverse events. A controlled study showed 30 seconds of tFUS to the right prefrontal cortex produced mood improvement lasting 30+ minutes and measurably altered resting-state fMRI connectivity.

The difference between a digital Adderall and a neural attack is not the physics. It is consent, dosage calibration, and oversight. The same pattern. Every time.

### "We Thought Neuroscience Would Teach AI. It's Been the Other Way Around."

One of Hodak's most striking observations: "I can tell you 10 years ago we thought it would go the other way and that the AI people would learn a lot from neuroscience and it's really been the other way around."

The same cross-domain transfer applies to neurosecurity. What cybersecurity has learned about signal integrity, access control, threat modeling, and defense-in-depth applies to the BCI attack surface. [QIF](/framework/) is the hypothesis that security engineering -- built over decades for silicon systems -- provides the missing implementation layer for BCI protection. The principles transfer because the underlying physics of signal processing is shared. Different substrate, same architecture.

### Bio-Hybrid: The Permanent Attack Surface

Hodak's bio-hybrid neural interfaces program is building probes that grow into the brain using living neurons. A preprint (not yet peer-reviewed) showed engrafted optogenetically-enabled neurons survived, integrated with host brain tissue, and transmitted information enabling goal-directed behavior in mice. The pitch: biological integration eliminates the foreign-body immune response that degrades conventional electrodes over time.

The security implication: a bio-hybrid implant cannot be removed without destroying the neural tissue it has integrated with. Every conventional BCI at least has a theoretical extraction path. Bio-hybrid interfaces are permanent by design. Hodak has written about this boundary since 2016, when he explored where the line between a person and their device blurs at high bandwidth. By December 2025, he put it more directly: "You could really, in a very fundamental sense, talk about redrawing the border around a brain, possibly to include four hemispheres, or a device, or a whole group of people."

In [QIF terms](/framework/), this is the I0 boundary -- the hardware-biology interface where silicon meets tissue. The proposed [neural firewall](/guardrails/) concept sits at exactly this boundary because it is the last point where signal validation is technically possible before the signal becomes biology.

### "I Worry More About Twitter"

Hodak explicitly downplays BCI security risks: he is more concerned about social media's influence on cognition than about someone hacking a brain implant. His reasoning -- current BCIs have limited bandwidth, physical access requirements, and the attack surface is small compared to the information firehose people voluntarily consume.

He is right about the current state. Today's implanted BCIs are low-bandwidth, require surgical placement, and serve small patient populations.

He is wrong about the trajectory. The entire interview is a roadmap for making BCIs higher-bandwidth, less invasive (ultrasound), consumer-facing (digital Adderall), and permanently integrated (bio-hybrid). Every advance he describes expands the attack surface he dismisses. Denning, Matsuoka, and Kohno defined neurosecurity in 2009. Pycroft et al. cataloged brainjacking attacks against implanted stimulators in 2016. Ienca and Haselager framed neurocrime as an extension of cybercrime to neural devices that same year. A 2021 ACM survey mapped the full BCI lifecycle attack taxonomy. And Meng et al. demonstrated in 2023 that EEG-based BCIs are vulnerable to backdoor attacks via narrow-period pulse injection into training data.

This is not a criticism of Hodak's engineering. It is an observation that the security architecture needs to be designed now, while the bandwidth is low and the patient population is small, not after consumer stimulation devices ship at scale.

### What This Means

This use-case validates something about the [QIF](/framework/) architecture: the 11-band model and the I0 boundary aren't just security concepts. They're the same boundaries that clinical engineering has to deal with. The I0 boundary where Neurowall sits is the same boundary where PRIMA's encoding happens. The signal validation that prevents an attack is the same signal validation that ensures a prosthesis delivers the right stimulation.

Security and clinical safety are not separate problems at the neural interface. They're the same problem described in different vocabularies.

That's why a security engineer can enter this field through the backdoor and find something useful to say about clinical applications. The architecture is shared. The threat model is the safety model, inverted.

### About Qinnovate

[Qinnovate](/) is an open research initiative building the security and governance layer for brain-computer interfaces. The BCI industry is moving fast -- restoring vision, decoding speech, stimulating cognition. But nobody is building the security architecture at the same pace.

That is the gap Qinnovate exists to close. [QIF](/framework/) is a proposed 11-band security model that maps the full BCI stack from physical signal integrity to governance policy. The [TARA threat catalog](/atlas/tara/) maps [109 attack techniques](/atlas/tara/ttps/) across every neural band region, scored by [NISS](/atlas/scoring/). The [therapeutic overlap analysis](/atlas/therapeutics/) maps where clinical applications and attack techniques share the same physical mechanisms -- because the difference between treatment and threat is governance, not physics.

Every tool, dataset, and mapping is open source. Every AI contribution is [documented](/governance/). Every claim is classified by evidence level and held to [neuromodesty constraints](/research/validation/) -- because the field does not need more hype. It needs engineering.

If the next decade of neurotechnology is going to be built by companies like Science Corp and Neuralink, the security architecture needs to be built in parallel -- not bolted on after the first breach. [Explore the full framework](/framework/).

---

*Source: ["How to Build the Future: Max Hodak"](https://youtu.be/5gspRJVp9dI) by Garry Tan (Y Combinator), published March 9, 2026. [Full transcript](/learn/autodidactive/neuroscience/vision/max-hodak-bci-future-2026.md).*

*Written with AI assistance (Claude). All claims verified by the author. QIF, TARA, and NISS are proposed frameworks, not validated standards. Research claims classified per evidence level: DEMONSTRATED (published, reproduced), FEASIBLE (components exist, integration pending), or THEORETICAL (architecturally sound, not yet built).*

---

### References

**Science Corp / PRIMA**
- Holz FG, Le Mer Y, Muqit MMK, et al. "Subretinal Photovoltaic Implant to Restore Vision in Geographic Atrophy Due to AMD." *NEJM* 394(3):232-242, 2026. [DOI: 10.1056/NEJMoa2501396](https://www.nejm.org/doi/full/10.1056/NEJMoa2501396)
- Muqit MMK, et al. "Prosthetic Visual Acuity with the PRIMA Subretinal Microchip at 4 Years Follow-up." *Ophthalmology Science* 4(5):100510, 2024. [PMID: 38881600](https://pubmed.ncbi.nlm.nih.gov/38881600/)
- PRIMAvera Pivotal Trial. [ClinicalTrials.gov NCT04676854](https://clinicaltrials.gov/study/NCT04676854)
- Science Corp. ["Positive Preliminary Results for Vision Restoration."](https://science.xyz/news/primavera-trial-preliminary-results/) Oct 2024.
- Science Corp. ["Biohybrid Neural Interfaces."](https://science.xyz/news/biohybrid-neural-interfaces/) Nov 2024.
- Brown J, Zappitelli KM, et al. "Optogenetic stimulation of a cortical biohybrid implant guides goal directed behavior." *bioRxiv* 2024. [DOI: 10.1101/2024.11.22.624907](https://www.biorxiv.org/content/10.1101/2024.11.22.624907v1)

**Neuralink**
- Neuralink. ["PRIME Study Progress Update."](https://neuralink.com/updates/prime-study-progress-update/) Apr 2024.
- Neuralink. ["PRIME Study -- User Experience."](https://neuralink.com/updates/prime-study-progress-update-user-experience/) May 2024.
- Neuralink. ["PRIME Study -- Second Participant."](https://neuralink.com/updates/prime-study-progress-update-second-participant/) Aug 2024.
- PRIME Study. [ClinicalTrials.gov NCT06429735](https://clinicaltrials.gov/study/NCT06429735)

**WiFi Sensing & RF Imaging**
- Geng J, et al. "DensePose From WiFi." arXiv:2301.00250, 2023. [arXiv](https://arxiv.org/abs/2301.00250)
- Li H, et al. "PanoRadar: Enabling Visual Recognition at Radio Frequency." ACM MobiCom 2024. [DOI: 10.1145/3636534.3649369](https://doi.org/10.1145/3636534.3649369)
- GSRF. "Complex-Valued 3D Gaussian Splatting for Efficient Radio-Frequency Data Synthesis." NeurIPS 2025.
- Liu J, et al. "Wireless Sensing for Human Activity: A Survey." *IEEE Communications Surveys & Tutorials* 21(2):1810-1836, 2019.

**Neural Encoding for Vision Prosthetics**
- de Ruyter van Steveninck J, et al. "End-to-End Optimization of Prosthetic Vision." *J Vision* 22(2):20, 2022. [DOI: 10.1167/jov.22.2.20](https://doi.org/10.1167/jov.22.2.20)
- Granley J, Beyeler M. "Hybrid Neural Autoencoders for Stimulus Encoding in Visual and Other Sensory Neuroprostheses." NeurIPS 2022.
- Granley J, et al. "Human-in-the-Loop Optimization for Deep Stimulus Encoding in Visual Prostheses." NeurIPS 2023.
- van der Grinten M, de Ruyter van Steveninck J, et al. "Towards Biologically Plausible Phosphene Simulation for the Differentiable Optimization of Visual Cortical Prostheses." *eLife* 13:e85812, 2024. [DOI: 10.7554/eLife.85812](https://elifesciences.org/articles/85812)
- Elnabawy R, et al. "PVGAN: A Generative Adversarial Network for Object Simplification in Prosthetic Vision." *J Neural Engineering*, 2022. [PMID: 35981530](https://pubmed.ncbi.nlm.nih.gov/35981530/)

**Game Engine Rendering & 3D Reconstruction**
- Kerbl B, et al. "3D Gaussian Splatting for Real-Time Radiance Field Rendering." *ACM Trans Graphics* (SIGGRAPH) 42(4):139, 2023. [DOI: 10.1145/3592433](https://doi.org/10.1145/3592433)
- Lin JT, et al. "BionicVisionXR: An Open-Source Virtual Reality Toolbox for Bionic Vision Research." bioRxiv 2024.
- Wu G, et al. "4D Gaussian Splatting for Real-Time Dynamic Scene Rendering." CVPR 2024.

**Neurostimulation & Dual-Use**
- Sanguinetti JL, et al. "Transcranial Focused Ultrasound to the Right Prefrontal Cortex Improves Mood." *Front Hum Neurosci* 14:52, 2020. [PMID: 32184714](https://pmc.ncbi.nlm.nih.gov/articles/PMC7058635/)
- Sarica C, et al. "Human Studies of Transcranial Ultrasound Neuromodulation: Systematic Review." *Brain Stimulation* 15(3):737-746, 2022. [PMID: 35533835](https://pubmed.ncbi.nlm.nih.gov/35533835/)
- Tennison MN, Moreno JD. "Neuroscience, Ethics, and National Security." *PLoS Biol* 10(3):e1001289, 2012. [DOI: 10.1371/journal.pbio.1001289](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1001289)

**BCI Security**
- Denning T, Matsuoka Y, Kohno T. "Neurosecurity: Security and Privacy for Neural Devices." *Neurosurg Focus* 27(1):E7, 2009. [DOI: 10.3171/2009.4.FOCUS0985](https://thejns.org/focus/view/journals/neurosurg-focus/27/1/2009.4.focus0985.xml)
- Pycroft L, et al. "Brainjacking: Implant Security Issues in Invasive Neuromodulation." *World Neurosurg* 92:454-462, 2016. [PMID: 27184896](https://pubmed.ncbi.nlm.nih.gov/27184896/)
- Ienca M, Haselager P. "Hacking the Brain: BCI Technology and the Ethics of Neurosecurity." *Ethics Inf Technol* 18(2):117-129, 2016. [DOI: 10.1007/s10676-016-9398-9](https://link.springer.com/article/10.1007/s10676-016-9398-9)
- Lopez Bernal S, et al. "Security in Brain-Computer Interfaces: State-of-the-Art." *ACM Comput Surv* 54(1):1-35, 2021. [DOI: 10.1145/3427376](https://dl.acm.org/doi/abs/10.1145/3427376)
- Meng L, et al. "EEG-Based BCIs are Vulnerable to Backdoor Attacks." *IEEE Trans Neural Syst Rehabil Eng* 31:2224-2234, 2023. [PMID: 37145943](https://pubmed.ncbi.nlm.nih.gov/37145943/)

**Bio-Hybrid Interfaces**
- Boufidis D, et al. "Bio-inspired Electronics: Soft, Biohybrid, and Living Neural Interfaces." *Nat Commun* 16:1861, 2025. [DOI: 10.1038/s41467-025-57016-0](https://www.nature.com/articles/s41467-025-57016-0)
- Boulingre M, et al. "Biohybrid Neural Interfaces: Improving Biological Integration." *Chem Commun* 59(100):14745-14758, 2023. [PMID: 37991846](https://pmc.ncbi.nlm.nih.gov/articles/PMC10720954/)

**Neural Decoding & Plasticity**
- Willett FR, et al. "A High-Performance Speech Neuroprosthesis." *Nature* 620:1031-1036, 2023. [DOI: 10.1038/s41586-023-06377-x](https://www.nature.com/articles/s41586-023-06377-x)
- Xu L, et al. "Review of Brain Encoding and Decoding Mechanisms for EEG-based BCI." *Cogn Neurodynamics* 15(4):569-584, 2021. [PMID: 34367361](https://pmc.ncbi.nlm.nih.gov/articles/PMC8286913/)

**Second Sight / Argus II**
- Humayun MS, et al. "Interim Results from the International Trial of Second Sight's Visual Prosthesis." *Ophthalmology* 119(4):779-788, 2012. [PMID: 22244176](https://pubmed.ncbi.nlm.nih.gov/22244176/)
- Strickland E, Harris M. ["Their Bionic Eyes Are Now Obsolete and Unsupported."](https://spectrum.ieee.org/bionic-eye-obsolete) *IEEE Spectrum*, 2022.

**Vision Prostheses (Additional)**
- Sahel JA, et al. "Partial Recovery of Visual Function in a Blind Patient After Optogenetic Therapy." *Nature Medicine* 27:1223-1229, 2021. [DOI: 10.1038/s41591-021-01351-4](https://doi.org/10.1038/s41591-021-01351-4)
- Beauchamp MS, et al. "Dynamic Stimulation of Visual Cortex Produces Form Vision in Sighted and Blind Humans." *Cell* 181(4):774-783, 2020. [DOI: 10.1016/j.cell.2020.04.033](https://doi.org/10.1016/j.cell.2020.04.033)

**Journalism & Interviews**
- Loizos C. ["After Neuralink, Max Hodak Is Building Something Even Wilder."](https://techcrunch.com/2025/12/05/after-neuralink-max-hodak-is-building-something-stranger/) *TechCrunch*, Dec 2025.
- Nye M. ["Max Hodak Is More Worried About Twitter Than BCI Hacking."](https://techcrunch.com/podcast/max-hodak-is-more-worried-about-twitter-than-brain-computer-interface-hacking/) *TechCrunch StrictlyVC*, Dec 2025.
- Loizos C. ["Science Corp. Raises $230M."](https://techcrunch.com/2026/03/05/science-corp-closes-230m-round-as-it-pushes-to-get-its-brain-implant-to-patients/) *TechCrunch*, Mar 2026.
- Hodak M. ["Where Is the Border?"](https://maxhodak.com/writings/2016/03/30/where-is-the-border) Blog, Mar 2016.
- Vance A. ["Science Corp. Explains How Its Biohybrid Neural Interfaces Work."](https://www.corememory.com/p/science-corp-explains-how-its-biohybrid) *Core Memory*, Jan 2025.
