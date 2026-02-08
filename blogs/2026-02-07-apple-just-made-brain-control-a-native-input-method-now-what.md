---
title: "Apple Just Made Brain Control a Native Input Method. Now What?"
subtitle: "The BCI-HID protocol, Synchron's thought-controlled iPad, and why the MIND Act needs a technical standard"
date_posted: "2026-02-07"
source: "https://qinnovate.com"
tags: ["#BCI", "#Apple", "#Synchron", "#Neurosecurity", "#QIF", "#PostQuantum", "#NeuralPrivacy", "#MINDAct", "#NSP"]
---

# Apple Just Made Brain Control a Native Input Method. Now What?

### *The BCI-HID protocol, Synchron's thought-controlled iPad, and why the MIND Act needs a technical standard*

· · ·

On August 4, 2025, a 64-year-old man named Mark opened an iPad, browsed the home screen, launched apps, and typed a message. He did not use his hands. He did not use his voice. He did not use his eyes.

Mark has ALS. He is a participant in Synchron's COMMAND clinical trial. A device called the Stentrode sits inside a blood vessel on the surface of his motor cortex, implanted through his jugular vein without ever opening his skull. It reads his neural signals, translates motor intention into digital commands, and sends them to the iPad over Bluetooth.

The iPad treated those commands the same way it treats a finger tap.

This was the first public demonstration of Apple's BCI Human Interface Device (BCI-HID) protocol. Brain control now sits alongside touch, voice, and typing as an official input method in iOS, iPadOS, and visionOS. Not a third-party hack. Not an accessibility workaround. A native input pathway, built into the operating system.

The implications of that architectural decision are enormous. And almost nobody is talking about the most important one.

· · ·

## What Apple Actually Built

Apple announced the BCI-HID protocol in May 2025, ahead of WWDC. Synchron was the first (and so far only) BCI company to achieve native integration.

Here is what the protocol does. It accepts neural signals, captured by the Stentrode implant, as a standard HID input. The same class of input that handles keyboards, mice, game controllers, and trackpads. But it goes further: the protocol supports closed-loop communication. The iPad shares contextual screen data back to the BCI decoder, so the system knows what is on screen and can optimize signal translation in real time.

That last part matters. This is not a one-way pipe. The Apple device and the brain implant are having a conversation. The implant reads intent. The device provides context. The decoder refines its interpretation. Loop closed.

Apple activated this through Switch Control, the existing accessibility framework. The framing is deliberate. This is not "cyborg technology." This is an accessibility feature for people with severe mobility impairments. That framing is how you get through FDA. It is how you get through institutional review boards. And it is how you normalize brain-computer interfaces for the broader public.

· · ·

## The Company Behind the Implant

Synchron was founded in 2016 by Tom Oxley, an Australian neurologist and neuroscientist, and Nick Opie. Their first funding came from DARPA's Reliable Neural Interfaces program. Oxley took that initial million back to Melbourne and built a lab.

The company has since raised $345 million. A $110 million Series C was led by ARCH Venture Partners, with the personal venture funds of Jeff Bezos (Bezos Expeditions) and Bill Gates (Gates Frontier) participating. A $200 million Series D followed in November 2025, backed by Khosla Ventures, the Qatar Investment Authority, and In-Q-Tel, the CIA's venture capital arm. When intelligence agencies invest in brain-computer interfaces, that tells you something about the strategic stakes. In 2022, Synchron became the first BCI company to receive an FDA Investigational Device Exemption for a permanently implanted BCI, and the first to begin U.S. clinical trials.

The Stentrode itself is the key differentiator. It is a self-expanding nitinol stent embedded with 16 platinum electrodes, about 5 centimeters long. Unlike Neuralink's N1, which requires a craniotomy (cutting through the skull to place electrodes directly on brain tissue), the Stentrode is implanted endovascularly. A catheter goes through the jugular vein and parks the device inside a blood vessel on the surface of the motor cortex. A lead connects it to a receiver-transmitter unit in the chest, similar to a pacemaker. The procedure takes about two hours. Patients are typically home within 48 hours.

Safety data from the SWITCH study, published in JAMA Neurology in January 2023, showed four patients followed for 12 months with no serious adverse events related to the device. No clots. No migration. Signal quality remained stable throughout.

In March 2025, at NVIDIA's GTC conference, Synchron unveiled Chiral, which they describe as the world's first Cognitive AI Brain Foundation Model. Built on NVIDIA's Holoscan platform and trained on 20 patient-years of Stentrode data, Chiral is designed to learn from neural activity across patients and improve as more devices are deployed. At the same event, they demonstrated a Synchron user controlling Apple Vision Pro.

· · ·

## The BCI Race Is Getting Crowded

Synchron is not alone. The competitive field has accelerated faster in the last 18 months than in the previous decade.

**Neuralink** raised $650 million in a 2025 Series E and received FDA Breakthrough Device Designation for both speech and vision applications. Their N1 chip is in clinical trials, with a commercial target of 2027 under a Humanitarian Device Exemption (4,000 patients per year).

**Paradromics** received FDA Breakthrough Device Designation and had their clinical trial approved in November 2025. Their Connexus system takes a different approach: high-density cortical surface electrodes with thousands of channels.

**Precision Neuroscience** received the first approved BCI implant in 2025, using a thin-film electrode array they call the Layer 7 Cortical Interface.

And then there is **Merge Labs**. This one flew under most people's radar. Founded by Sam Altman, Merge Labs raised $250 million in a seed round led by OpenAI at an $850 million valuation. Bain Capital, Interface Fund, Fifty Years, and Gabe Newell also invested. The approach is entirely different: non-invasive neural interfaces using ultrasound instead of electrodes. No surgery at all. Merge Labs describes their mission as "bridging biological and artificial intelligence to maximize human ability."

The significance of the OpenAI investment is hard to overstate. The company building the most capable large language models is now funding hardware to read brain activity directly. The convergence of AI and neural interfaces is not theoretical. It is being capitalized.

More than $2 billion has been invested in the US brain-tech sector alone, with China accelerating parallel efforts. Morgan Stanley estimates the early total addressable market at $80 billion across three million U.S. adults, potentially reaching $320 billion with further advances. Even the conservative estimates (Precedence Research: $2.94 billion in 2025 to $13.86 billion by 2035) show a 16.77% compound annual growth rate.

· · ·

## Apple's Longer Game

The BCI-HID protocol is not Apple's first move in neurotechnology. It is the most visible one.

Sterling Crispin, who spent over three years as a neurotechnology prototyping researcher on the Vision Pro team before leaving in 2021, filed multiple patents while at Apple. One describes detecting cognitive states (curiosity, mind-wandering, fear, focused attention) from body signals including eye movements, brain electrical activity, heartbeat, muscle activity, blood density in the brain, and skin conductance. Another describes predicting user actions from pupil dilation patterns: your pupil dilates before you tap because you expect something to happen. The system can learn to anticipate your intent from that dilation.

A separate patent, filed in January 2023, describes AirPods equipped with electrodes capable of measuring EEG, EMG, EOG, ECG, galvanic skin response, and blood volume pulse. In November 2025, Apple published a research paper introducing PARS (Pairwise Relative Shift), an AI model that teaches itself to interpret brain signals from raw, unlabeled EEG data.

And the Cognixion study, pairing a non-invasive BCI headband with Apple Vision Pro, launched in 2025 and runs through April 2026.

The pattern is clear. Apple is building an ecosystem where neural signals are a first-class data type. Vision Pro's eye tracking is the thin edge of the wedge. AirPods with EEG are next. Synchron's Stentrode provides the invasive option for those who need it. Each layer collects more intimate data than the last.

· · ·

## The Question Nobody Is Asking

Here is what the press coverage misses.

Every article about Mark controlling his iPad by thought focuses on the marvel of the technology. And it is a marvel. But the Stentrode communicates with the iPad over Bluetooth Low Energy. The same protocol your wireless headphones use. The same protocol that a security analysis found 300+ vulnerabilities across in consumer BCI devices. The same protocol where researchers have demonstrated interception and replay of unencrypted neural data streams on devices from Muse, OpenBCI, and Neuroelectrics.

Twenty-nine out of thirty consumer BCI companies surveyed provide no meaningful limitations on access to users' neural data.

Apple's BCI-HID protocol likely wraps this in Apple's proprietary security layer. That is better than nothing. But "better than nothing" is a low bar when the data in question is a continuous stream of motor intentions decoded from your brain.

Three problems remain, regardless of how good Apple's security is:

**The post-quantum problem.** NIST's own post-quantum cryptography program exists because classical encryption has an expiration date. Quantum computers capable of breaking today's cryptography are estimated to arrive between 2030 and 2035. A Stentrode implanted today will still be transmitting neural data when that happens. If the key exchange uses classical ECDH (as most Bluetooth protocols do), every neural stream transmitted between now and then can be stored and decrypted retroactively. NIST calls this "harvest now, decrypt later." You can reissue a compromised credit card. You cannot reissue your brain.

**The fragmentation problem.** If every BCI manufacturer builds their own proprietary security, the field gets what early networking had before TCP/IP: incompatible protocols, inconsistent security, and an attack surface that depends on which vendor you chose. A patient with a Synchron implant cannot switch to a Neuralink decoder. A researcher cannot build cross-platform tools. And security depends on the weakest implementation in the ecosystem. One vendor's mistake exposes their entire patient base.

**The regulatory vacuum.** No existing standard addresses post-quantum cryptography for implanted neural devices. The FDA's cybersecurity guidance for medical devices is evolving but does not mandate PQ crypto. Four states (Colorado, California, Montana, Connecticut) have passed neural data privacy laws. Senators Cantwell, Schumer, and Markey proposed the MIND Act in 2025 to protect neural data at the federal level. But legislation without a technical standard is a mandate without a method. The MIND Act says "protect neural data." It does not say how. And the 46 states that have not passed neurorights laws have no framework at all.

· · ·

## What Would a Solution Look Like?

Not a proprietary wrapper. An open standard. Specifically, an RFC-style protocol specification that any manufacturer can implement, any researcher can audit, and any regulator can reference.

The analogy is HTTPS. Nobody asks whether web encryption should be open or proprietary. The answer is obvious: security protocols must be open so they can be audited, adopted universally, and improved by the entire research community. The same logic applies to neural data transport.

This is what we are building with the Neural Security Protocol (NSP) under the QIF framework. NSP is not a product. It is a protocol specification, currently at v0.3, written in RFC format with defined frame structures, a handshake state machine, and test vectors. Here is what it specifies:

**Five independent defense layers.** Hardware root of trust (SPHINCS+-signed secure boot). Hybrid post-quantum key exchange (ECDH + ML-KEM per FIPS 203, so the session is secure if either algorithm holds). Physics-based signal integrity scoring (a per-frame QI metric that catches physically impossible signals inside properly encrypted frames). Adaptive per-user anomaly detection (catches replay attacks that pass physics checks). And electromagnetic environment monitoring for implanted devices. Each layer addresses a distinct threat class. No single layer claims comprehensive protection. The composition of all five provides defense-in-depth.

**Every cryptographic primitive is NIST-standardized.** ML-KEM (FIPS 203) for key encapsulation. ML-DSA (FIPS 204) for real-time signatures. SLH-DSA/SPHINCS+ (FIPS 205) for firmware authentication. AES-256-GCM for payload encryption. No novel cryptography. No academic experiments. Algorithms that have survived years of public cryptanalysis.

**Three device class tiers that map directly to regulatory needs.** T1 (consumer headbands like Muse or NeuroSky) requires post-quantum encryption and signal integrity. T2 (clinical devices like the Synchron Stentrode) adds hardware root of trust and adaptive detection. T3 (surgical implants like the Neuralink N1) requires all five layers including EM monitoring. This tiering gives regulators a concrete compliance framework: tell manufacturers which tier their device falls into, and the security requirements follow.

**Designed for implant-lifetime operation.** The key lifecycle spans 20 years. Session keys rotate every 90 days. Algorithm agility means new cryptographic primitives can be swapped in via authenticated firmware updates without redesigning the protocol. A device implanted in 2026 can migrate to whatever NIST standardizes in 2035.

**3.25% power overhead at 40 milliwatts.** Practical for implanted hardware. The protocol compresses neural data first (delta encoding + LZ4, recovering 3-5x bandwidth), then encrypts, then signs. The compression step is not new overhead. BCI manufacturers already compress to fit wireless bandwidth. NSP mandates the correct order so encryption and signing ride on top of work the device already does.

Companies like Apple, Synchron, and Neuralink would still compete on hardware, neural decoding algorithms, AI models, and user experience. Apple's proprietary security layer could wrap NSP and extend it. Neuralink could add layers specific to their N1 architecture. The protocol handles transport security so they do not have to reinvent it. But the foundation is shared, audited, and designed for the lifetime of a brain implant.

· · ·

## Why the MIND Act Needs a Protocol, and Why States Should Not Wait

Legislation without a technical standard is a mandate without a method.

The MIND Act proposes federal protection for neural data. That is the right instinct. But the bill defines what must be protected without specifying how. Four states have moved ahead on their own. Colorado's neural data law passed in 2024. California, Montana, and Connecticut followed. Each defines neural data as a protected category. None specifies a minimum security standard for the devices that generate it.

This matters because "protect neural data" is not actionable without a protocol. Imagine if HIPAA said "protect patient data" but never referenced encryption standards, access control frameworks, or audit requirements. It would be symbolic. The MIND Act, and every state neurorights law, faces the same gap.

NSP fills that gap. Its three device class tiers (T1/T2/T3) give legislators a concrete reference: a state law can say "all BCI devices sold in this state must comply with NSP Tier 1 at minimum, Tier 2 for clinical devices, Tier 3 for implants." Compliance is testable. The spec includes test vectors. A manufacturer either passes the handshake validation or does not. A device either rotates keys every 90 days or does not. A firmware update is either signed with SPHINCS+ or it is not.

The states that have already passed neurorights laws are positioned to be first movers. Colorado could adopt NSP compliance tiers as the implementation standard for its existing neural data law. That turns a privacy principle into an enforceable technical requirement. Other states watching Colorado's implementation then have a template to follow. The standard is open, NIST-aligned, and free to implement.

For the 46 states without neurorights laws: the argument just got simpler. An open, audited, NIST-compliant protocol already exists. The cost of passing a neural data protection law just dropped, because the technical standard you would need to reference is already written. The question is no longer "how would we even enforce this?" The question is "why haven't we adopted it yet?"

The federal path matters too. If the MIND Act passes with NSP as the referenced technical standard, it creates a single national baseline. Manufacturers build to one spec instead of 50 state variants. Patients get the same protection regardless of where they live. And the U.S. sets the global standard, the way NIST's cryptography standards have shaped international practice for decades.

The window is narrow. Synchron is in pivotal trials. Neuralink targets commercial availability in 2027. Merge Labs is building non-invasive interfaces. Every month of neural data transmitted without post-quantum protection is a permanent liability. A standard adopted after the first neural data breach is a standard adopted too late.

· · ·

## The Timeline

```
2016: Synchron founded (Tom Oxley, Nick Opie); DARPA seed funding
2019: First Stentrode implant (Australia, SWITCH study)
2022: Synchron becomes first BCI company in US clinical trials (FDA IDE)
2023: SWITCH study published in JAMA Neurology (12-month safety confirmed)
2024: Synchron demonstrates BCI + Apple Vision Pro (Mark plays Solitaire by thought)
2025: Apple announces BCI-HID protocol; Mark controls iPad entirely by thought (Aug 4)
2025: Neuralink, Paradromics receive FDA Breakthrough Device Designation
2025: Synchron raises $200M Series D (In-Q-Tel, Qatar Investment Authority, Khosla)
2025: Senators propose MIND Act for federal neural data protection
2026: Merge Labs raises $250M from OpenAI for non-invasive neural interfaces (Jan)
2026: Apple ecosystem integration scales (BCI + Vision Pro + AirPods research)
2026: Synchron pivotal trials planned (pathway to first FDA premarket BCI approval)
2027: First limited commercial BCI availability (Neuralink HDE target)
2028+: Consumer BCI adoption accelerates
2030-2035: Cryptographically relevant quantum computers arrive
```

Every year of neural data transmitted under classical encryption is a permanent liability once quantum computers arrive. The data being generated in clinical trials right now, including Mark's thought-controlled iPad sessions, is already subject to this threat.

The protocol exists. The NIST algorithms are finalized. The device class tiers are defined. The power budget works. What does not exist yet is the regulatory will to require it.

The question is not whether BCIs need post-quantum security. The question is which state, which legislator, which regulator will be first to mandate it.

· · ·

*Qinnovate is developing the Neural Security Protocol (NSP) as an open standard for post-quantum BCI security. The full protocol specification is available for review. For updates on NSP development, MIND Act progress, and BCI security intelligence, subscribe to our [newsletter](/news/) or follow our [RSS feed](/rss.xml).*

---

**Sources:**

- [Synchron Debuts First Thought-Controlled iPad Experience (Business Wire, Aug 2025)](https://www.businesswire.com/news/home/20250804537175/en/)
- [ALS patient controls iPad by thought (MobiHealthNews)](https://www.mobihealthnews.com/news/als-patient-controls-ipad-thought-using-synchron-and-apple-bci-tech)
- [Apple BCI HID Protocol details (iDownloadBlog)](https://www.idownloadblog.com/2025/05/13/apple-iphone-brain-computer-interfaces-details/)
- [Synchron SWITCH Study, JAMA Neurology (Jan 2023)](https://jamanetwork.com/journals/jamaneurology/fullarticle/2799839)
- [Synchron Unveils Chiral at GTC 2025 (Business Wire)](https://www.businesswire.com/news/home/20250319964709/en/)
- [OpenAI invests in Merge Labs (TechCrunch, Jan 2026)](https://techcrunch.com/2026/01/15/openai-invests-in-sam-altmans-brain-computer-interface-startup-merge-labs/)
- [Jeff Bezos and Bill Gates back Synchron (Startup Daily)](https://www.startupdaily.net/topic/funding/jeff-bezos-bill-gates-back-australian-brain-computer-interface-startup-synchron-in-110-million-series-c/)
- [Senators propose MIND Act (US Senate Commerce Committee)](https://www.commerce.senate.gov/2025/9/sens-cantwell-schumer-markey-introduce-legislation-to-shield-americans-brain-data-from-exploitation)
- [Apple AirPods EEG patent (9to5Mac)](https://9to5mac.com/2025/11/28/airpods-brain-signal-study-patent/)
- [Sterling Crispin's neurotechnology patents (Flound)](https://www.flound.io/en/magazin/robotik/apple-s-revolutionaeres-patent-airpods-zum-auslesen-von-gehirnwellen)
- [Synchron Raises $200M Series D (Business Wire, Nov 2025)](https://www.businesswire.com/news/home/20251106150841/en/)
- [Synchron COMMAND Study Positive Results (Business Wire, Sep 2024)](https://www.businesswire.com/news/home/20240930433219/en/)
- [Cognixion Non-Invasive BCI + Apple Vision Pro Study (AppleInsider)](https://appleinsider.com/articles/25/10/03/new-research-may-lead-to-brain-controlled-apple-vision-pro-without-surgery)
- [Senators Call on FTC to Protect Neural Data (US Senate, Apr 2025)](https://www.commerce.senate.gov/2025/4/cantwell-schumer-markey-call-on-ftc-to-protect-consumers-neural-data)
- [State Neural Data Privacy Laws (KFF Health News)](https://kffhealthnews.org/news/article/colorado-california-montana-states-neural-data-privacy-laws-neurorights/)
- [BCI Market $13.86B by 2035 (Precedence Research)](https://www.precedenceresearch.com/brain-computer-interface-market)
- [Neural Data Privacy Regulation (Arnold & Porter)](https://www.arnoldporter.com/en/perspectives/advisories/2025/07/neural-data-privacy-regulation)
