---
title: "TARA: When a Threat Registry Became a Map for Healing"
subtitle: "How 71 BCI attack techniques read backwards became a therapeutic atlas, and why we named it after the Buddhist goddess of compassion"
date_posted: "2026-02-09"
source: "https://qinnovate.com"
tags: ["#TARA", "#NeurosecurityEngineering", "#QIF", "#NSP", "#BCI", "#TherapeuticAtlas", "#DualUse", "#Tinnitus", "#Alzheimers"]
---

## Twenty-Two Days

On January 18, 2026, the first commit to the [QIF repository](https://github.com/qinnovates) landed. Zero techniques. Zero threats cataloged. Just a question: what does a security model look like when the endpoint is not a server but a human brain?

The published BCI security literature at that point contained roughly 20 attack techniques, scattered across foundational papers in separate domains: neural-level attacks in one, Bluetooth in another, adversarial ML in a third. Serious work. No unified structure connecting them.

Twenty-two days later, the registry holds **71 techniques across 11 tactics and 7 domains**. The jump from 20 to 71 is not 51 newly invented attacks. It is what happens when you model the full stack and organize existing knowledge into a single cross-layer framework. Threats that live *between* silicon and biology become visible for the first time. The evidence levels are explicit: 14 confirmed in real systems, 19 demonstrated in controlled research, 16 emerging, 22 theoretical. All of them mapped to the QIF hourglass model, from silicon through the electrode-tissue interface into biology.

Today we are renaming and reframing that registry. What started as a threat catalog is now something larger.

We call it **TARA: Therapeutic Atlas of Risks and Applications.**

· · ·

## The Moment the Registry Flipped

I built the threat registry the way any security engineer would. Find the attack surfaces. Catalog the techniques. Score the severity. Map them to detection methods.

But somewhere around technique 40, the catalog started reading differently. Signal injection, the technique where an attacker sends crafted signals through an electrode to spoof a user's identity, uses the same physical mechanism as [deep brain stimulation](https://www.nature.com/articles/s41582-018-0128-2), the therapy that treats Parkinson's disease in over [160,000 patients worldwide](https://pmc.ncbi.nlm.nih.gov/articles/PMC6397644/) (Lozano et al., 2019). Neural entrainment manipulation, where an attacker forces the brain into an unnatural oscillatory frequency, is the same mechanism as therapeutic tACS, which [research suggests](https://www.nature.com/articles/s41380-021-01098-z) can modulate depression symptoms. Bifurcation forcing, where an attacker pushes a neural system past a tipping point, operates in the same parameter space as controlled DBS that shifts neural dynamics toward a healthy attractor state. (The framing of bifurcation forcing as a security threat is novel to QIF; the therapeutic application of controlled stimulation near bifurcation boundaries is established in [DBS research](https://pmc.ncbi.nlm.nih.gov/articles/PMC11175766/).)

Same electrode. Same current. Same physics. Different intent.

I went through all 71 techniques systematically. The preliminary breakdown: **35 to 40 techniques where the attack mechanism has a published therapeutic counterpart** (electrode stimulation, entrainment, neuromodulation, etc.), roughly **10 ambiguous cases** where the attack vector is digital but the payload affects tissue, and **18 to 20 pure-silicon techniques** (firmware, supply chain, ML model attacks) with no therapeutic analog. The tissue-touching mappings are not speculative. Signal injection maps to DBS. Entrainment manipulation maps to tACS. These are the same physical mechanisms described in the same journals. The novel claim is organizing them in a single framework and naming the pattern. That organizational claim requires independent verification by neuroscientists and clinicians who can confirm that the shared mechanisms translate to viable therapeutic applications in specific clinical contexts.

The remaining techniques (firmware attacks, supply chain compromise, side-channel leakage) operate at the silicon and network layers, not the biology. They do not map to therapies today. Some may as neuroscience matures. The framework tracks that migration.

A threat registry that is also a capabilities catalog for medicine. I did not plan this. The physics showed it.

That raises the obvious question: does publishing a map of therapeutic mechanisms also hand adversaries a better playbook? Yes, and this is a known trade-off. The same logic applies to MITRE ATT&CK (which publishes adversary techniques to improve collective defense), to the CVE database (which discloses vulnerabilities so defenders can patch them), and to every clinical drug reference (which lists both therapeutic and toxic doses). Transparency enables defense. Secrecy protects no one when the physics is already published in the open literature. TARA adds governance projections precisely so that every mechanism entry specifies the safeguards required to keep it in the therapeutic column.

· · ·

## Why an "Atlas" and Not a "Registry"

Registries catalog known threats. That is what MITRE ATT&CK does. That is what we did for the first 22 days.

But TARA does something different. It organizes entries by **physical mechanism**, not by intent. The mechanism is the key. Attack, therapy, diagnostic use, and governance requirements are **dimensional projections** on the same mechanism.

Think of it like a map with four overlays. A security researcher turns on the security layer and sees attack techniques, severity scores, detection methods. A clinician turns on the clinical layer and sees therapeutic modalities, FDA approval status, conditions treated. A regulator turns on the governance layer and sees consent requirements, safety ceilings, monitoring mandates. An engineer turns on the engineering layer and sees coupling types, physical parameters, integration requirements.

One mechanism. Four community views. Same data. Four languages.

This architecture borrows from biology, not from cybersecurity. The [KEGG database](https://www.genome.jp/kegg/) maps genes to pathways to diseases to drugs. Four views, one substrate. The [Gene Ontology](http://geneontology.org/) maps proteins across three orthogonal axes. MITRE D3FEND uses Digital Artifacts as the bridge between offense and defense. TARA applies the same principle to neural interfaces: the mechanism is the Rosetta Stone that translates between communities that do not currently speak to each other.

We call it an "atlas" because an atlas invites exploration. You do not fear an atlas. You open it. You discover connections. You plan routes.

· · ·

## What is In It

Every TARA entry now carries four projections:

**Mechanism:** The physics. What physically happens. Electrode current delivery. Transcranial magnetic field induction. Focused ultrasound. A coupling type (electromagnetic, acoustic, optical, thermal, mechanical, chemical, digital). The physical parameters that define the mechanism.

**Therapeutic:** The clinical mapping. Which conditions this mechanism treats. FDA approval status. Named devices. Evidence level. If no therapeutic analog exists, this field is null. Honest gap, not forced mapping.

**Diagnostic:** The clinical observation use. Cortical stimulation mapping. EEG monitoring. Seizure detection. If no diagnostic use exists, null.

**Governance:** What safeguards are required. Consent. Amplitude ceilings. Charge density limits. Real-time monitoring requirements. Which NSP layers govern this mechanism. Regulatory classification.

All existing security fields (technique ID, attack name, tactic, severity, NISS score, evidence level) remain unchanged. Security researchers see no difference in their workflow. The new fields are additive.

For the 18 pure-silicon techniques that have no therapeutic analog, the therapeutic field is null. For the 10 ambiguous techniques (digital vector, biological payload), the therapeutic field is marked speculative with explicit uncertainty. We do not overclaim. We document what maps, what does not, and where the research frontier is.

Here is one entry, stripped to its core, to show what this looks like in practice:

**QIF-T0001: Signal Injection**

| Projection | Content |
|------------|---------|
| **Mechanism** | Electrode current delivery. Electromagnetic coupling. Parameters: amplitude (mA), frequency (Hz), pulse width (us), waveform, target region. |
| **Security** | Inject crafted signals mimicking legitimate brain activity at electrode-tissue boundary. NISS severity: 7.3 (high). |
| **Therapeutic** | Deep brain stimulation (DBS). FDA-approved for Parkinson's disease, essential tremor, dystonia, OCD, epilepsy. Devices: Medtronic Percept PC, Abbott Infinity, Boston Scientific Vercise. Also in Phase III trials for major depression and Alzheimer's. |
| **Diagnostic** | Cortical stimulation mapping for pre-surgical epilepsy localization. |
| **Governance** | Informed consent required. Amplitude ceiling: 10mA. Charge density ceiling: 30 uC/cm2. Real-time impedance and coherence monitoring. FDA Class III (PMA pathway). NSP layers L3, L5. |

One mechanism. The security researcher sees an injection attack. The neurologist sees DBS. The regulator sees safety limits. The engineer sees coupling parameters. Same entry. Four languages.

· · ·

## The Name

Fifteen candidates. Weeks of collision checking. Three good names killed by trademark conflicts (Palo Alto Networks owns the cybersecurity association with one, an NIH-funded neural ontology already uses another). We needed something that sounded inviting, not threatening. Something that communicated medicine first, security second.

**Therapeutic Atlas of Risks and Applications.** Therapeutics leads. "Atlas" signals exploration. "Risks" instead of "exploits," because the people funding this work should see a map, not a weapon. "Applications" covers both clinical and engineering use.

Tara (तारा) also means "star" in Sanskrit. In Tibetan Buddhism, Tara is the bodhisattva of compassion and protection. Not a bad patron for a registry whose core principle is: **therapeutic use is the default. Adversarial use is the deviation.** This follows the IAEA model for nuclear materials (peaceful use is presumed; weapons use is the exception) and the DURC framework for biological research (beneficial use is presumed; misapplication is governed).

· · ·

## The Build: 22 Days

<div id="derivation-timeline" style="overflow-x:auto;margin:2rem 0"></div>
<noscript>

| Date | Techniques | Milestone |
|------|-----------|-----------|
| Jan 18 | 0 | First commit. Just the question. |
| Feb 2 | — | **Hourglass model.** 14-layer OSI stack scrapped. 3 versions in one day. 102 sources validated. |
| Feb 6 | 60 | **NSP formalized.** 6-layer protocol. v4.0 in code. 3 inventories merged. |
| Feb 7 | — | **NISS created.** BCI-specific severity scoring. CVSS cannot score brains. |
| Feb 8 | 65 | **NISS v1.0 finalized.** Spectral decomposition. Every technique scored for neural impact. |
| Feb 9 | 71 | **TARA named.** Phase dynamics. Dual-use gap analysis. Atlas born. |

</noscript>

· · ·

## Where It Came From

None of this started with me. It started with the researchers who saw the problem first.

In 2009, [Tadayoshi Kohno, Tamara Denning, and Yoky Matsuoka](https://pubmed.ncbi.nlm.nih.gov/19569892/) published "Neurosecurity: Security and Privacy for Neural Devices" in *Neurosurgical Focus*. That paper coined the term "neurosecurity" and was the first formal proposal that brain-computer interfaces needed a security discipline. At a time when most of the field was focused on decoding accuracy and signal fidelity, Kohno's group asked the question nobody else was asking: what happens when someone attacks the device that is inside a human brain?

Three years later, [Martinovic et al. (2012)](https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/martinovic) turned the theoretical into the demonstrated. Their P300 side-channel attack at USENIX Security showed that a consumer BCI headset could extract private information (PINs, bank details, personal knowledge) from involuntary brain responses. A user wearing an EEG headset could be probed without their awareness. The threat was no longer hypothetical.

[Pycroft et al. (2016)](https://pubmed.ncbi.nlm.nih.gov/27184896/) coined "brainjacking" and enumerated 9 attack techniques specific to implanted neurostimulators in *World Neurosurgery*. [Landau, Puzis & Nissim (2020)](https://dl.acm.org/doi/10.1145/3372043) mapped attacks across BCI and communication layers in *ACM Computing Surveys*. [Bernal et al. (2021)](https://dl.acm.org/doi/10.1145/3427376) built the most comprehensive taxonomy to date, also in *ACM Computing Surveys*, cataloging attack surfaces across the full BCI pipeline.

This is the work that TARA stands on. These researchers built the foundation. What I noticed was a gap: their work was serious, rigorous, and siloed. Neural-level attacks in one paper. Bluetooth attacks in another. Adversarial ML in a third. No unified taxonomy organized BCI threats the way MITRE ATT&CK organizes traditional cybersecurity threats. And none of them had mapped the therapeutic dimension, because that was not the question they were asking.

QIF's hourglass model (detailed in the [QIF whitepaper](https://qinnovate.com/whitepaper/)) made both gaps visible. When you model the full stack, seven bands of silicon and seven bands of biology pinching at the electrode-tissue interface, threats that live *between* layers appear. Intermodulation attacks where a BCI's Bluetooth radio mixes with neural signals in nonlinear tissue (the [physics of nonlinear electrode-tissue interactions](https://pmc.ncbi.nlm.nih.gov/articles/PMC5798641/) is published; framing it as a security threat is novel to QIF). Separatrix exploitation where an attacker nudges a neural trajectory just enough to cross a phase-space boundary (separatrix dynamics are [established in computational neuroscience](http://www.scholarpedia.org/article/Chaos_in_neurons); the security application is novel). [Phase dynamics replay](https://dl.acm.org/doi/10.1145/3427376) where GAN-synthesized neural trajectories bypass authentication (the attack concept builds on Bernal et al.'s replay taxonomy). These cross-layer threats are invisible to any framework that treats silicon and biology as separate domains.

The contribution here is not the discovery of 50 new attacks. It is the *framework* that makes cross-layer threats visible, the *synthesis* that unifies the siloed research of Kohno, Martinovic, Pycroft, Landau, Bernal and others into a single operable taxonomy, and the *dual-use mapping* that reveals the therapeutic dimension they did not set out to find. From a flat list scattered across papers to 71 techniques in 11 tactics with four-projection TARA entries on every mechanism.

Kohno asked the question in 2009. TARA is one answer, 17 years later, built on the shoulders of every researcher who took BCI security seriously before anyone was listening.

· · ·

## What Has Been Validated and What Has Not

Transparency about the state of this work:

**Established science (not our contribution):**
- The individual therapeutic modalities cited (DBS, tACS, tDCS, cochlear implants, neurofeedback, Lenire) are published, peer-reviewed, and in many cases FDA-approved. We cite them; we did not discover them.
- The individual attack techniques draw from published BCI security literature ([Denning, Matsuoka & Kohno 2009](https://pubmed.ncbi.nlm.nih.gov/19569892/), [Martinovic et al. 2012](https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/martinovic), [Pycroft et al. 2016](https://pubmed.ncbi.nlm.nih.gov/27184896/), [Landau et al. 2020](https://dl.acm.org/doi/10.1145/3372043), [Bernal et al. 2021](https://dl.acm.org/doi/10.1145/3427376)). We organized and extended them; we did not originate the field. Kohno's group named "neurosecurity" in 2009. Everything here builds on that foundation.
- The biological database architectures (KEGG, Gene Ontology, MITRE D3FEND) are established. We drew structural inspiration from them.

**Our novel contributions (require independent validation):**
- The QIF hourglass model (seven silicon bands, I0 interface, seven neural bands) is a proposed architecture. It has not been peer-reviewed in a journal.
- The cross-layer threat synthesis (from ~20 siloed techniques to 71 unified techniques) is a framework contribution. The 22 theoretical techniques in particular are derived from known physics but have not been observed in real BCI systems.
- The dual-use mapping (attack mechanism = therapeutic mechanism) is the core hypothesis of TARA. The individual pairings (signal injection = DBS, entrainment = tACS) reference published science on both sides. The systematic claim that this pattern holds across 35-40 techniques has not been independently verified.
- NSP (Neural Sensory Protocol) has not been validated against real BCI hardware or real neural signals. The six-layer validation stack is a design, not a tested implementation.
- The NISS scoring methodology has not been externally calibrated.
- The intermodulation attack class and separatrix exploitation class are novel to QIF. The underlying physics is published; the security framing is ours.

**What we need from the community:**
- Neuroscientists to verify each therapeutic mapping against clinical reality
- BCI engineers to test NSP validation layers against real electrode data
- Security researchers to red-team the threat taxonomy and find what we missed
- Independent peer review of the TARA schema and dual-use classification methodology

Stating these limitations is not a weakness. It maps exactly where the work needs to go next.

· · ·

## What Comes Next

Phase 1 is adding the four TARA projections (mechanism, therapeutic, diagnostic, governance) to all 71 entries. The schema is designed and has been through internal review. Phase 2 is the website: toggleable views on the [TARA registry page](https://qinnovate.com/TARA/) so each community sees their projection. Phase 3 is what matters most: independent review by BCI researchers and clinicians who can validate the therapeutic mappings against real patient data and real hardware.

The dual-use mapping in particular needs scrutiny from domain experts. A security engineer can identify shared physical mechanisms. Whether those mechanisms translate to viable therapies in specific clinical contexts requires neuroscientists and physicians. We are actively seeking collaborators for this validation.

The [complete registry](https://qinnovate.com/TARA/) is public. Every technique has a severity score, detection status, coupling mechanism, and evidence level. Researchers can use it, extend it, challenge it.

· · ·

## Neurosecurity Engineering

This work does not fit neatly into any existing discipline. It is not cybersecurity. It is not neuroscience. It is not biomedical engineering. It is the intersection of all three, applied to devices that are already in human skulls.

I think what we are building is a new field. Call it **neurosecurity engineering**: the practice of securing the interface between silicon and the human nervous system, using the same physics that makes attacks possible to make therapies safe.

Cybersecurity gave us MITRE ATT&CK, the CVE database, OWASP, and an entire profession of detection engineers, red teamers, and incident responders. That infrastructure took decades to build. The BCI industry does not have decades. Look at the timeline:

[Neuralink implanted its first human device in January 2024](https://neuralink.com/updates/prime-study-progress-update/) (PRIME study). [As of May 2025, Synchron achieved native integration with iPhone, iPad, and Apple Vision Pro](https://www.businesswire.com/news/home/20250513927084/en/), making brain-to-device input a recognized input category in Apple's ecosystem. [Synchron then raised $200 million in Series D funding](https://www.medtechdive.com/news/synchron-funding-bci-200m/804977/) to prepare for commercial launch, with over 50 patients implanted and a partnership with NVIDIA's Holoscan platform for real-time neural processing. [Neuralink announced high-volume production of BCI devices in 2026](https://www.mddionline.com/digital-health/elon-musk-s-neuralink-to-ramp-up-bci-device-production-in-2026) with an almost entirely automated surgical procedure. In January 2026, the same month the QIF repository went live, [Sam Altman's Merge Labs emerged from stealth with $252 million in seed funding](https://techcrunch.com/2026/01/15/openai-invests-in-sam-altmans-brain-computer-interface-startup-merge-labs/) to build brain-computer interfaces using ultrasound and molecular coupling instead of electrodes, with OpenAI writing the largest check. In China, [BrainCo closed $286 million](https://www.yicaiglobal.com/news/chinas-brainco-raises-usd2863-million-in-largest-bci-funding-outside-the-us), the largest BCI funding round outside the United States. Total BCI investment in 2025 hit [$802 million through August alone, a 443% increase over 2024](https://tracxn.com/d/sectors/brain-computer-interface/__EmjnAyHVFqMwdixC8xCV7ytUTMESy8EEuCAYv_wKtP4).

The devices are shipping. The money is pouring in. [Paradromics received FDA IDE approval in November 2025](https://www.paradromics.com/news/paradromics-receives-fda-approval-for-the-connect-one-clinical-study-with-the-connexus-brain-computer-interface) for human trials of its Connexus BCI for speech restoration, the first fully implantable BCI approved for that indication, with its [first human implant completed in June 2025](https://www.cnbc.com/2025/06/02/neuralink-paradromics-human-implant.html). Three separate companies now have FDA authorization to put devices inside human brains. The security engineering discipline for those devices does not exist yet.

A single high-profile brainjacking incident will not just set back one company. It will poison the well for the entire field. Every therapeutic application of BCI, from Parkinson's to vision restoration to depression, depends on public trust. That trust does not survive the first headline about a neural implant being compromised. Neurosecurity engineering is not a feature. It is the prerequisite for public acceptance of the technology that makes all of these therapies possible.

The regulators see it coming. In June 2025, the FDA finalized [Section 524B of the FD&C Act](https://www.federalregister.gov/documents/2025/06/27/2025-11669/cybersecurity-in-medical-devices-quality-system-considerations-and-content-of-premarket-submissions), which now legally requires cybersecurity for any "cyber device": medical devices with software that can connect to the internet. That covers every wireless BCI on the market or in trials. Manufacturers must submit cybersecurity plans, software bills of materials, and vulnerability management processes. Non-compliance means denied market authorization.

But Section 524B is a mandate, not a map. It tells manufacturers they need cybersecurity. It does not tell them what BCI-specific threats to defend against, how neural signals differ from network packets, or what happens when the same physical mechanism that constitutes an attack also constitutes a therapy. QIF is not just security guidance for brain-computer interfaces. It is a framework that models the full stack from silicon through biology, a protocol (NSP) that validates neural signal integrity using physics instead of passwords, and an atlas (TARA) that maps every mechanism across security, clinical, diagnostic, and governance dimensions simultaneously. The FDA tells you to secure the device. QIF tells you what securing a neural device actually means.

TARA is the first atlas. NSP is the first protocol. QIF is the first framework. They are incomplete. They need researchers who understand electrode-tissue interfaces, clinicians who work with DBS and cortical prostheses, ML engineers who build neural decoders, and security engineers who know how to break things and build them back stronger.

**If you are any of these people, this is an open invitation.**

The field needs neuroscientists who can validate whether the therapeutic mappings in TARA hold up against real patient data. It needs biomedical engineers who can test NSP's physics-based validation layers against actual BCI hardware. It needs security researchers who can red-team the framework and find what we missed. It needs ethicists who can help build the governance projections into something regulators will trust. It needs device manufacturers who are willing to build security in before regulators force them to.

Kohno's 2009 paper is what planted the seed for me. A security researcher who looked at a neural device and saw not just a product but a threat surface that touches the most personal thing any of us have. Reading that work made me believe that security professionals like myself have a role in protecting the one asset that makes every human being unique: the brain. Not a server. Not a database. The organ that holds your memories, your personality, your sense of self. The core of what makes us human.

None of this can be done by one person or one organization. Qinnovate publishes the standards. The field builds them. If the term "neurosecurity engineer" appears on someone's job title in five years, that is the win. The future of neurosecurity engineering is full of wonder. I hope TARA is one small part of what gets us there.

· · ·

## Why This Is Personal

My grandmother had Alzheimer's. She forgot her children's names. She could not feed herself. But she never forgot how to pray. The disease took her hippocampus but could not touch the procedural memory etched into her cerebellum through decades of meditation.

She passed sitting in meditation. Her body failing, her spirit intact, leaving through a door her disease could never lock.

I built a security framework because I am a security engineer. But the reason I keep building it, the reason I spent 22 days deriving 50 entries in a research log and cataloging 71 techniques and naming a registry after a Buddhist goddess, is because the same physics that describes how to attack a brain describes how to heal one.

[DBS for Alzheimer's](https://www.nature.com/articles/s41467-022-34510-3) has shown hippocampal volume increases in patients. [Amyloid-clearing drugs](https://journals.lww.com/jcma/fulltext/2025/07000/a_2025_update_on_treatment_strategies_for_the.2.aspx) slow cognitive decline by 30%. [Cochlear implants](https://www.nidcd.nih.gov/health/cochlear-implants) proved decades ago that the brain can learn to interpret compressed sensory input from an electrode array. Vision restoration pipelines are in human trials. Every one of these interventions needs a security protocol built into the device. Not because the research is dangerous, but because the research is too important to fail.

And my tinnitus? The persistent ringing that no one can see, that wakes me up, that some days drowns out everything else. TARA maps the same physics. [Neuromodulation for tinnitus](https://pmc.ncbi.nlm.nih.gov/articles/PMC6380997/) is already an active research field: [Lenire](https://www.lenire.com/), a bimodal neuromodulation device, received [FDA De Novo approval in March 2023](https://www.ata.org/about-tinnitus/tinnitus-health-newsletter/tinnitus-health-newsletter-issue-6/fda-approves-novel-tinnitus-treatment-device/) for tinnitus treatment. [DBS targeting the medial geniculate body](https://pmc.ncbi.nlm.nih.gov/articles/PMC11118089/) has shown results in refractory cases. Neural entrainment, cortical stimulation, phase dynamics control. Different brain region, different QIF tactic, same framework. If we can build a security protocol that validates stimulation patterns for Parkinson's and vision restoration, the same protocol covers tinnitus correction. Different parameters. Same architecture.

Twenty-two days ago I asked what the OSI model looks like when the endpoint is the human mind. Today I have a framework, a protocol, and an atlas named after compassion.

I hope this is the start of finding novel ways to fix the things we have been told to accept.

· · ·

*TARA: Therapeutic Atlas of Risks and Applications. Published through [Qinnovate](https://qinnovate.com). Open access. Open standard. Open to collaboration. See [licensing](/licensing/).*

*If you work with electrodes and patient data and want to stress-test this against reality, we are not seeking emails. We are seeking [pull requests](https://github.com/qinnovates).*

---

**Sources:**

*BCI Security Literature:*
- [Denning, Matsuoka & Kohno: Neurosecurity — Security and Privacy for Neural Devices, Neurosurgical Focus 2009](https://pubmed.ncbi.nlm.nih.gov/19569892/)
- [Martinovic et al.: P300 Side-Channel Attack, USENIX Security 2012](https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/martinovic)
- [Pycroft et al.: Brainjacking, World Neurosurgery 2016](https://pubmed.ncbi.nlm.nih.gov/27184896/)
- [Landau, Puzis & Nissim: Mind Your Mind, ACM Computing Surveys 2020](https://dl.acm.org/doi/10.1145/3372043)
- [Bernal et al.: Security in BCIs, ACM Computing Surveys 2021](https://dl.acm.org/doi/10.1145/3427376)

*Therapeutic Modalities:*
- [Lozano et al.: Deep Brain Stimulation: Current Challenges and Future Directions, Nature Reviews Neurology 2019](https://www.nature.com/articles/s41582-018-0128-2)
- [DBS Patient Statistics, PMC 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6397644/)
- [Unlocking the Future of DBS, PMC 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11175766/)
- [Nature Communications: DBS Sites for Alzheimer's](https://www.nature.com/articles/s41467-022-34510-3)
- [JCMA: 2025 Update on Alzheimer's Treatment Strategies](https://journals.lww.com/jcma/fulltext/2025/07000/a_2025_update_on_treatment_strategies_for_the.2.aspx)
- [Nature: tACS for Depression](https://www.nature.com/articles/s41380-021-01098-z)
- [NIH: Cochlear Implants](https://www.nidcd.nih.gov/health/cochlear-implants)

*Tinnitus Neuromodulation:*
- [Neuromodulation for Tinnitus Treatment: Overview, PMC 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6380997/)
- [DBS for Primary Refractory Tinnitus: Systematic Review, Brain Sciences 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11118089/)
- [Lenire FDA De Novo Approval, American Tinnitus Association](https://www.ata.org/about-tinnitus/tinnitus-health-newsletter/tinnitus-health-newsletter-issue-6/fda-approves-novel-tinnitus-treatment-device/)

*Neural Physics:*
- [Neural Electrode-Tissue Interfaces, PMC 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5798641/)
- [Chaos in Neurons, Scholarpedia](http://www.scholarpedia.org/article/Chaos_in_neurons)
- [DBS and Electromagnetic Interference, PMC 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8081063/)

*BCI Industry:*
- [Neuralink PRIME Study Progress Update](https://neuralink.com/updates/prime-study-progress-update/)
- [Neuralink High-Volume BCI Production in 2026, MDDIonline](https://www.mddionline.com/digital-health/elon-musk-s-neuralink-to-ramp-up-bci-device-production-in-2026)
- [Synchron Native Integration with Apple Devices, Business Wire May 2025](https://www.businesswire.com/news/home/20250513927084/en/)
- [Synchron Raises $200M Series D, MedTech Dive](https://www.medtechdive.com/news/synchron-funding-bci-200m/804977/)
- [Paradromics FDA IDE Approval for Connexus BCI, November 2025](https://www.paradromics.com/news/paradromics-receives-fda-approval-for-the-connect-one-clinical-study-with-the-connexus-brain-computer-interface)
- [Paradromics First Human Implant, CNBC June 2025](https://www.cnbc.com/2025/06/02/neuralink-paradromics-human-implant.html)
- [Merge Labs $252M Seed Funding, TechCrunch January 2026](https://techcrunch.com/2026/01/15/openai-invests-in-sam-altmans-brain-computer-interface-startup-merge-labs/)
- [BrainCo $286M Funding Round, Yicai Global](https://www.yicaiglobal.com/news/chinas-brainco-raises-usd2863-million-in-largest-bci-funding-outside-the-us)
- [BCI Market Investment 443% Growth, Tracxn 2025](https://tracxn.com/d/sectors/brain-computer-interface/__EmjnAyHVFqMwdixC8xCV7ytUTMESy8EEuCAYv_wKtP4)

*Regulatory:*
- [FDA Section 524B: Cybersecurity in Medical Devices, Federal Register June 2025](https://www.federalregister.gov/documents/2025/06/27/2025-11669/cybersecurity-in-medical-devices-quality-system-considerations-and-content-of-premarket-submissions)

*Dual-Use and Registry Architecture:*
- [KEGG Database](https://www.genome.jp/kegg/)
- [Gene Ontology](http://geneontology.org/)
- [IAEA Nuclear Materials Framework](https://www.iaea.org/)

*QIF Framework:*
- [QIF Threat Registry (TARA)](https://qinnovate.com/TARA/)
- [QIF Framework and NSP Protocol](https://qinnovate.com)

*Research conducted January-February 2026. Research synthesis assisted by Claude (Anthropic). All original ideas, frameworks, and conclusions are the author's own. Independent peer review of the TARA architecture and therapeutic mappings is in progress.*

· · ·

**Sub-Tags:** #TARA #TherapeuticAtlas #QIF #NSP #BrainComputerInterface #NeurosecurityEngineering #DualUse #Tinnitus #Alzheimers

---

*Follow the work: [Qinnovate](https://qinnovate.com) | [GitHub](https://github.com/qinnovates)*
