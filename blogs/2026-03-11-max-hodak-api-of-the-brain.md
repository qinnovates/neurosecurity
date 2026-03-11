---
title: "I Mapped the Risks and Cures of What May Happen When Neuralink Cures ADHD"
subtitle: "Neuralink's co-founder describes digital Adderall via brain stimulation. We already mapped what can go wrong -- and how to stop it."
date: 2026-03-11
tags: [BCI, neurosecurity, QIF, TARA, clinical-mapping, interview-analysis, ADHD]
author: Qinnovate
fact_checked: false
fact_check_notes:
  - "Source: 'How to Build the Future' interview with Max Hodak by Garry Tan (Y Combinator), published March 9, 2026"
  - "All quotes attributed to Hodak are from the auto-generated transcript of the interview"
  - "QIF mappings referenced are from the proposed TARA threat catalog (unvalidated framework)"
---

Max Hodak, co-founder of Neuralink and CEO of Science Corp, wants to cure ADHD with a "digital Adderall" -- a brain-computer interface that stimulates focus without pharmaceuticals. In his words: "Can you stimulate part of the brain to cause focus or sleep? That would not surprise me if that was possible, and I could see that as being more of a consumer application."

Here is the problem: the same stimulation that induces focus can be weaponized. And we already mapped exactly how.

The proposed [TARA threat catalog](/atlas/tara/) contains [109 attack techniques](/atlas/tara/ttps/) mapped across the BCI stack. For ADHD treatment alone, TARA identifies over 40 techniques that share the same physical mechanisms as therapeutic stimulation. Here is what that looks like in practice:

- **ELF neural entrainment** ([QIF-T0010](/atlas/tara/QIF-T0010)): The same low-frequency stimulation used therapeutically for ADHD and cognitive enhancement can be applied covertly to entrain brainwave patterns without the user's knowledge.
- **Neurofeedback falsification** ([QIF-T0022](/atlas/tara/QIF-T0022)): ADHD neurofeedback training relies on accurate EEG readings. An attacker who falsifies that feedback can train the brain toward a harmful state instead of a therapeutic one.
- **Working memory poisoning** ([QIF-T0034](/atlas/tara/QIF-T0034)): Working memory deficits define ADHD. A BCI that can strengthen working memory can also degrade it -- same circuit, opposite dosage.
- **Cognitive state capture** ([QIF-T0053](/atlas/tara/QIF-T0053)): Attention-training BCIs for ADHD continuously read cognitive state. That stream is also a surveillance channel -- your focus patterns, distractibility, and mental fatigue, captured in real time.
- **Coherence mimicry** ([QIF-T0061](/atlas/tara/QIF-T0061)): SMR (sensorimotor rhythm) training is a standard ADHD neurofeedback protocol. An attacker can mimic the coherence signature of a healthy brain state to mask ongoing interference.

Every one of these maps to DSM-5-TR code F90 (ADHD) in the TARA catalog -- for threat modeling purposes, not diagnostic claims. The same signal-level mechanisms that restore attention can disrupt it.

In a March 2026 interview with Garry Tan, days after closing a $230M Series C, Hodak laid out the full vision: restoring vision to the blind, curing deafness, treating ADHD, and eventually consumer brain stimulation. He frames the stimulation work as a broader industry trajectory, not a Science Corp product -- noting explicitly that he does not work on ultrasound himself.

But the security implications are real regardless of which company ships it first. QIF's [framework](/framework/) exists because the difference between therapy and attack is not the signal -- it is the governance around it.

### Who Is Max Hodak?

Hodak co-founded Neuralink with Elon Musk in 2016 and served as its president until 2021. He now runs Science Corp, which is building brain-computer interfaces to restore lost sensory function. Their PRIMA retinal prosthesis took patients who had been unable to see faces for a decade and allowed them to read every letter on an eye chart -- results published in the New England Journal of Medicine in October 2025. In his words: "If someone has gone blind, you can restore the ability to see. If they've gone deaf, you can restore the ability to hear. If they're paralyzed, you can restore the ability to move."

### The API of the Brain

Hodak explains the retina as a layered compression pipeline: 150 million rods and cones connect to bipolar cells, which compress down to 1.5 million retinal ganglion cells that form the optic nerve -- roughly a 100x compression before the signal even reaches the brain. (Hodak cites 100 million bipolar cells; standard estimates vary, but the compression ratio holds.)

Science Corp's retinal prosthesis bypasses the dead rods and cones to stimulate the bipolar cells directly -- upstream of the compression layer. In the PRIMAvera pivotal trial (38 patients), the mean improvement was 23 letters of visual acuity, with the best patient gaining 59 letters. This dramatically outperformed Second Sight's Argus II, which stimulated the ganglion cells downstream of the compression and produced limited real-world utility -- and eventually left 350+ patients with obsolete, unsupported devices.

Tan summarizes it: there is "some kind of latent space mapping, and then the job of science in terms of being sort of like the API to the brain" is figuring out how to interface with it.

Hodak extends this: "You can think of that as like the API of the brain." If you can characterize the signal representations at each layer, you can write to them. The brain handles the rest through plasticity.

This is the computer-per-nerves framing. The brain is not a black box -- it is a layered signal processing system, and each layer has discoverable input/output characteristics. Neurons fire, signals propagate, representations form. Recent work has demonstrated this concretely: a Stanford team decoded speech at 62 words per minute from intracortical recordings, while Neuralink's PRIME study achieved wireless motor decoding at 8.0 bits/second in their first human participant. The engineering challenge is getting the right signals into the right layer at the right resolution.

### Digital Adderall, Digital Ambien

Hodak's most commercially significant observation: non-invasive brain stimulation could deliver "a digital Ambien or like a digital Adderall" -- targeting specific brain regions to induce focus or sleep without pharmaceuticals, potentially as a consumer device that does not require surgery. He frames this as an industry direction, not a Science Corp project -- Hodak explicitly states "I don't work on ultrasound."

This is not speculative. A systematic review of 35 human transcranial focused ultrasound studies (677 subjects) found dose-dependent cognitive and mood effects with no severe adverse events. A controlled study showed 30 seconds of tFUS to the right prefrontal cortex produced mood improvement lasting 30+ minutes and measurably altered resting-state fMRI connectivity. The mechanism works. TMS has already been studied extensively for cognitive enhancement in both clinical and healthy populations.

This is exactly the dual-use boundary that QIF's clinical [TARA mappings](/atlas/tara/) exist to describe. The proposed TARA catalog maps [109 threat techniques](/atlas/tara/ttps/) across [7 neural band regions](/framework/) (N1-N7). Many of those techniques describe the same physical mechanisms Hodak is proposing for therapeutic use -- amplitude modulation, frequency-targeted stimulation, signal injection at specific cortical regions. Tennison and Moreno established this dual-use framework for neuroscience in a foundational 2012 paper: the same neural interface technologies that restore function can be turned to surveillance, coercion, or cognitive manipulation.

The difference between a digital Adderall and a neural attack is not the physics. It is consent, dosage calibration, and oversight. QIF's proposed [framework](/framework/) maps both sides of that boundary because the signal-level mechanisms are identical. The [therapeutic overlap analysis](/atlas/therapeutics/) maps this dual-use boundary explicitly. Researchers building adaptive deep brain stimulators have raised the same concern: closed-loop stimulators that read and write to neural circuits can modulate mood, cognition, and impulse control beyond therapeutic intent.

### "We Thought Neuroscience Would Teach AI. It's Been the Other Way Around."

One of Hodak's most striking observations: "I can tell you 10 years ago we thought it would go the other way and that the AI people would learn a lot from neuroscience and it's really been the other way around."

AI research is now driving neuroscience forward. The tools, models, and computational frameworks built for artificial intelligence turned out to map onto biological neural systems in ways nobody predicted. The direction of insight reversed.

The same cross-domain transfer applies to neurosecurity. What cybersecurity has learned about signal integrity, access control, threat modeling, and defense-in-depth applies to the BCI attack surface. [QIF](/framework/) is the hypothesis that security engineering -- built over decades for silicon systems -- provides the missing implementation layer for BCI protection. The principles transfer because the underlying physics of signal processing is shared. Different substrate, same architecture.

### Bio-Hybrid: The Permanent Attack Surface

Hodak's bio-hybrid neural interfaces program is building probes that grow into the brain using living neurons. Preclinical results showed engrafted optogenetically-enabled neurons survived, integrated with host brain tissue, and transmitted information enabling goal-directed behavior in mice. The pitch: biological integration eliminates the foreign-body immune response that degrades conventional electrodes over time.

The security implication: a bio-hybrid implant cannot be removed without destroying the neural tissue it has integrated with. Every conventional BCI at least has a theoretical extraction path. Bio-hybrid interfaces are permanent by design. Hodak himself wrote about this boundary as early as 2016: at sufficient bandwidth, "the border around a brain" becomes ambiguous. He put it more directly in a December 2025 interview: "You could really, in a very fundamental sense, talk about redrawing the border around a brain, possibly to include four hemispheres, or a device, or a whole group of people."

In [QIF terms](/framework/), this is the I0 boundary -- the hardware-biology interface where silicon meets tissue. QIF's proposed [neural firewall](/guardrails/) concept sits at exactly this boundary because it is the last point where signal validation is technically possible before the signal becomes biology.

### "I Worry More About Twitter"

Hodak explicitly downplays BCI security risks: he is more concerned about social media's influence on cognition than about someone hacking a brain implant. His reasoning -- current BCIs have limited bandwidth, physical access requirements, and the attack surface is small compared to the information firehose people voluntarily consume.

He is right about the current state. Today's implanted BCIs are low-bandwidth, require surgical placement, and serve small patient populations.

He is wrong about the trajectory. The entire interview is a roadmap for making BCIs higher-bandwidth, less invasive (ultrasound), consumer-facing (digital Adderall), and permanently integrated (bio-hybrid). Every advance he describes expands the attack surface he dismisses. The security research community has already mapped this surface: Denning, Matsuoka, and Kohno defined neurosecurity in 2009. Pycroft et al. cataloged brainjacking attacks against implanted stimulators in 2016. Ienca and Haselager framed neurocrime as an extension of cybercrime to neural devices that same year. A 2021 ACM survey mapped the full BCI lifecycle attack taxonomy. And Meng et al. demonstrated in 2023 that EEG-based BCIs are vulnerable to backdoor attacks via narrow-period pulse injection into training data.

This is not a criticism of Hodak's engineering. It is an observation that the security architecture needs to be designed now, while the bandwidth is low and the patient population is small, not after ultrasound-based consumer stimulation devices ship at scale.

The proposed [TARA catalog](/atlas/tara/) does not claim these attacks are happening today. It maps the physical mechanisms so that defensive controls can be designed before the technology scales. Each technique is scored using [NISS](/atlas/scoring/) (Neural Impact Scoring System) to estimate signal-level disruption severity.

### The Takeaway

Hodak is building the future of BCIs. The engineering is real -- PRIMA restored vision to patients who had been blind for a decade. The trajectory toward consumer stimulation devices, bio-hybrid integration, and brain-to-brain interfaces is credible.

The security gap is also real. When the co-founder of the field's most prominent company says he worries more about Twitter than BCI hacking, it means the security architecture will not come from inside the BCI industry. It has to come from security engineers who understand both the threat landscape and the neural substrate.

That is what [QIF](/framework/) is attempting to build.

### About Qinnovate

[Qinnovate](/) is an open research initiative building the security and governance layer for brain-computer interfaces. The BCI industry is moving fast -- restoring vision, decoding speech, stimulating cognition. But nobody is building the security architecture at the same pace.

That is the gap Qinnovate exists to close. The [Quantitative Intelligence Framework (QIF)](/framework/) is a proposed 11-band security model that maps the full BCI stack from physical signal integrity to governance policy. The [TARA threat catalog](/atlas/tara/) maps [109 attack techniques](/atlas/tara/ttps/) across every neural band region, scored by the [Neural Impact Scoring System (NISS)](/atlas/scoring/). The [therapeutic overlap analysis](/atlas/therapeutics/) maps where clinical applications and attack techniques share the same physical mechanisms -- because the difference between treatment and threat is governance, not physics.

Every tool, dataset, and mapping is open source. Every AI contribution is [documented](/governance/). Every claim is classified by evidence level and held to [neuromodesty constraints](/research/validation/) -- because the field does not need more hype. It needs engineering.

If the next decade of neurotechnology is going to be built by companies like Science Corp and Neuralink, the security architecture needs to be built in parallel -- not bolted on after the first breach. [Explore the full framework](/framework/).

---

*Source: ["How to Build the Future: Max Hodak"](https://youtu.be/5gspRJVp9dI) by Garry Tan (Y Combinator), published March 9, 2026. [Full transcript](/learn/autodidactive/neuroscience/vision/max-hodak-bci-future-2026.md).*

*Written with AI assistance (Claude). All claims verified by the author. QIF, TARA, and NISS are proposed frameworks, not validated standards.*

---

### References

**Science Corp / PRIMA**
- Holz FG, Le Mer Y, Muqit MMK, et al. "Subretinal Photovoltaic Implant to Restore Vision in Geographic Atrophy Due to AMD." *NEJM* 394(3):232–242, 2026. [DOI: 10.1056/NEJMoa2501396](https://www.nejm.org/doi/full/10.1056/NEJMoa2501396)
- Muqit MMK, et al. "Prosthetic Visual Acuity with the PRIMA Subretinal Microchip at 4 Years Follow-up." *Ophthalmology Science* 4(5):100510, 2024. [PMID: 38881600](https://pubmed.ncbi.nlm.nih.gov/38881600/)
- PRIMAvera Pivotal Trial. [ClinicalTrials.gov NCT04676854](https://clinicaltrials.gov/study/NCT04676854)
- Science Corp. ["Positive Preliminary Results for Vision Restoration."](https://science.xyz/news/primavera-trial-preliminary-results/) Oct 2024.
- Science Corp. ["Biohybrid Neural Interfaces."](https://science.xyz/news/biohybrid-neural-interfaces/) Nov 2024.
- Brown J, Zappitelli KM, et al. "Optogenetic stimulation of a cortical biohybrid implant guides goal directed behavior." *bioRxiv* 2024. [DOI: 10.1101/2024.11.22.624907](https://www.biorxiv.org/content/10.1101/2024.11.22.624907v1)

**Neuralink**
- Neuralink. ["PRIME Study Progress Update."](https://neuralink.com/updates/prime-study-progress-update/) Apr 2024.
- Neuralink. ["PRIME Study — User Experience."](https://neuralink.com/updates/prime-study-progress-update-user-experience/) May 2024.
- Neuralink. ["PRIME Study — Second Participant."](https://neuralink.com/updates/prime-study-progress-update-second-participant/) Aug 2024.
- PRIME Study. [ClinicalTrials.gov NCT06429735](https://clinicaltrials.gov/study/NCT06429735)

**Neurostimulation & Dual-Use**
- Sanguinetti JL, et al. "Transcranial Focused Ultrasound to the Right Prefrontal Cortex Improves Mood." *Front Hum Neurosci* 14:52, 2020. [PMID: 32184714](https://pmc.ncbi.nlm.nih.gov/articles/PMC7058635/)
- Sarica C, et al. "Human Studies of Transcranial Ultrasound Neuromodulation: Systematic Review." *Brain Stimulation* 15(3):737–746, 2022. [PMID: 35533835](https://pubmed.ncbi.nlm.nih.gov/35533835/)
- Kim TD, et al. "Cognitive Enhancement Using TMS: A Review." *Exp Neurobiol* 28(1):1–16, 2019. [PMID: 30853820](https://pmc.ncbi.nlm.nih.gov/articles/PMC6401552/)
- Kostick-Quenet K, et al. "Researchers' Ethical Concerns About Using Adaptive DBS for Enhancement." *Front Hum Neurosci* 16:813922, 2022. [PMID: 35496073](https://pmc.ncbi.nlm.nih.gov/articles/PMC9050172/)
- Tennison MN, Moreno JD. "Neuroscience, Ethics, and National Security." *PLoS Biol* 10(3):e1001289, 2012. [DOI: 10.1371/journal.pbio.1001289](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1001289)

**BCI Security**
- Denning T, Matsuoka Y, Kohno T. "Neurosecurity: Security and Privacy for Neural Devices." *Neurosurg Focus* 27(1):E7, 2009. [DOI: 10.3171/2009.4.FOCUS0985](https://thejns.org/focus/view/journals/neurosurg-focus/27/1/2009.4.focus0985.xml)
- Pycroft L, et al. "Brainjacking: Implant Security Issues in Invasive Neuromodulation." *World Neurosurg* 92:454–462, 2016. [PMID: 27184896](https://pubmed.ncbi.nlm.nih.gov/27184896/)
- Ienca M, Haselager P. "Hacking the Brain: BCI Technology and the Ethics of Neurosecurity." *Ethics Inf Technol* 18(2):117–129, 2016. [DOI: 10.1007/s10676-016-9398-9](https://link.springer.com/article/10.1007/s10676-016-9398-9)
- López Bernal S, et al. "Security in Brain-Computer Interfaces: State-of-the-Art." *ACM Comput Surv* 54(1):1–35, 2021. [DOI: 10.1145/3427376](https://dl.acm.org/doi/abs/10.1145/3427376)
- Meng L, et al. "EEG-Based BCIs are Vulnerable to Backdoor Attacks." *IEEE Trans Neural Syst Rehabil Eng* 31:2224–2234, 2023. [PMID: 37145943](https://pubmed.ncbi.nlm.nih.gov/37145943/)

**Bio-Hybrid Interfaces**
- Boufidis D, et al. "Bio-inspired Electronics: Soft, Biohybrid, and Living Neural Interfaces." *Nat Commun* 16:1861, 2025. [DOI: 10.1038/s41467-025-57016-0](https://www.nature.com/articles/s41467-025-57016-0)
- Boulingre M, et al. "Biohybrid Neural Interfaces: Improving Biological Integration." *Chem Commun* 59(100):14745–14758, 2023. [PMID: 37991846](https://pmc.ncbi.nlm.nih.gov/articles/PMC10720954/)

**Neural Decoding & Plasticity**
- Willett FR, et al. "A High-Performance Speech Neuroprosthesis." *Nature* 620:1031–1036, 2023. [DOI: 10.1038/s41586-023-06377-x](https://www.nature.com/articles/s41586-023-06377-x)
- Xu L, et al. "Review of Brain Encoding and Decoding Mechanisms for EEG-based BCI." *Cogn Neurodynamics* 15(4):569–584, 2021. [PMID: 34367361](https://pmc.ncbi.nlm.nih.gov/articles/PMC8286913/)

**Second Sight / Argus II**
- Humayun MS, et al. "Interim Results from the International Trial of Second Sight's Visual Prosthesis." *Ophthalmology* 119(4):779–788, 2012. [PMID: 22244176](https://pubmed.ncbi.nlm.nih.gov/22244176/)
- Strickland E, Harris M. ["Their Bionic Eyes Are Now Obsolete and Unsupported."](https://spectrum.ieee.org/bionic-eye-obsolete) *IEEE Spectrum*, 2022.

**Journalism & Interviews**
- Loizos C. ["After Neuralink, Max Hodak Is Building Something Even Wilder."](https://techcrunch.com/2025/12/05/after-neuralink-max-hodak-is-building-something-stranger/) *TechCrunch*, Dec 2025.
- Nye M. ["Max Hodak Is More Worried About Twitter Than BCI Hacking."](https://techcrunch.com/podcast/max-hodak-is-more-worried-about-twitter-than-brain-computer-interface-hacking/) *TechCrunch StrictlyVC*, Dec 2025.
- Loizos C. ["Science Corp. Raises $230M."](https://techcrunch.com/2026/03/05/science-corp-closes-230m-round-as-it-pushes-to-get-its-brain-implant-to-patients/) *TechCrunch*, Mar 2026.
- Hodak M. ["Where Is the Border?"](https://maxhodak.com/writings/2016/03/30/where-is-the-border) Blog, Mar 2016.
- Vance A. ["Science Corp. Explains How Its Biohybrid Neural Interfaces Work."](https://www.corememory.com/p/science-corp-explains-how-its-biohybrid) *Core Memory*, Jan 2025.
