---
title: "The Future of AirPod Pros: Apple Is Developing EEG AirPods. What's Next?"
subtitle: "From BCI-HID to silent speech AirPods — subvocalized Siri is closer than you think, and so are the attackers"
date_posted: "2026-02-07"
updated: "2026-02-18"
source: "https://qinnovate.com"
tags: ["#BCI", "#Apple", "#Synchron", "#Neurosecurity", "#QIF", "#PostQuantum", "#NeuralPrivacy", "#MINDAct", "#NSP", "#Subvocalization", "#AirPods"]
image: "/images/apple-eeg-earbud-render.png"
---

![Concept render of Apple EEG-sensing earbuds with electrode array](/images/apple-eeg-earbud-render.png)

On August 4, 2025, a man named Mark opened an iPad, browsed the home screen, launched apps, and typed a message. He did not use his hands. He did not use his voice. He did not use his eyes.

Mark has ALS. He is a participant in Synchron's COMMAND clinical trial. A device called the Stentrode — a self-expanding stent with 16 platinum electrodes, implanted through the jugular vein — reads his neural signals and sends them to the iPad over Bluetooth. The iPad treated those commands the same way it treats a finger tap.

This was the first public demo of Apple's BCI Human Interface Device (BCI-HID) protocol. Brain control is now a native input method in iOS, iPadOS, and visionOS. Not a hack. Not an accessibility workaround. A first-class input pathway built into the OS.

But here is what I keep thinking about: this is just the beginning. And the next step is not another implant. It is your AirPods.

· · ·

## Apple's Quiet Moves Toward Reading Your Mind

Apple has been filing patents and acquiring companies that all point in the same direction: neural sensing through earbuds.

**The AirPods EEG Patent.** In January 2023, Apple filed [US20230225659A1](https://patentscope.wipo.int/search/en/detail.jsf?docId=US402825807) — "Biosignal Sensing Device Using Dynamic Selection of Electrodes." It describes AirPods-style earbuds packed with electrodes on the ear tips and earpiece housing, capable of measuring EEG, EMG, EOG, ECG, galvanic skin response, and blood volume pulse. The patent details a switching circuit that dynamically selects the best electrode subset based on impedance, noise, and signal quality, with machine learning optimizing the selection in real time. Seven Apple engineers are listed as inventors. This is not a concept sketch. It is a detailed implementation spec with 20 claims and 15 figures.

**The Q.ai Acquisition.** On January 29, 2026, Apple acquired [Q.ai](https://techcrunch.com/2026/01/29/apple-buys-israeli-startup-q-ai-as-the-ai-race-heats-up/), an Israeli startup that uses infrared light to detect facial micro-movements during silent speech — movements invisible to the human eye. The price tag? Roughly $1.5–2 billion, making it Apple's second-largest acquisition ever after Beats. Q.ai was founded by Aviad Maizels, who previously founded PrimeSense (the company behind the original Kinect depth sensor, which Apple also acquired in 2013). Their patents describe an "optical sensing head" in headphones or glasses that decodes subvocalized words without any audible sound.

**The PARS Model.** In November 2025, Apple published a research paper introducing PARS (Pairwise Relative Shift), an AI model that teaches itself to interpret brain signals from raw, unlabeled EEG data. No labeled training data needed. Self-supervised learning on brainwaves.

**Sterling Crispin's Patents.** A former Apple neurotechnology researcher on the Vision Pro team filed patents for detecting cognitive states — curiosity, fear, focused attention, mind-wandering — from eye movements, brain electrical activity, and pupil dilation. Your pupil dilates before you tap because you expect something to happen. The system learns to anticipate your intent from that dilation.

Connect the dots: EEG-sensing earbuds + silent speech decoding + self-supervised brain signal AI + cognitive state detection. Apple is building an ecosystem where your thoughts become a first-class input. Touch was the first generation. Voice was the second. Neural is the third.

· · ·

## Subvocalized Siri Is Closer Than You Think

Here is something most people do not realize: the technology for silent speech already works. It just needs more data.

When you think words without saying them out loud, your brain still sends faint signals to your speech muscles. Your tongue micro-moves. Your jaw tenses. Your vocal cords subtly activate. This is called subvocalization, and researchers have been decoding it for over two decades.

**MIT's AlterEgo** is probably the most impressive demo. Arnav Kapur, a PhD student at the MIT Media Lab, built a wearable that uses electrodes along the jawline to pick up those subvocal signals and decode them into text. [It hit 92% accuracy](https://news.mit.edu/2018/computer-system-transcribes-words-users-speak-silently-0404) back in 2018. In 2025, AlterEgo spun out of MIT into a standalone company, redesigning the device into something that looks like a sleek hearing aid. The concept: you think a command, and the system hears it. No mouth movement. No sound. Just intention.

**NASA was doing this even earlier.** Dr. Charles Jorgensen at NASA Ames achieved 92% accuracy on subvocal speech recognition in 2004 using throat-surface EMG electrodes. By later iterations they hit 99% on a small vocabulary. The original use case? Astronaut communication in noisy environments.

Now imagine Apple's Q.ai infrared tech — which detects facial micro-movements during silent speech — running on AirPods Pro with the EEG electrode array from that 2023 patent. You subvocalize "Hey Siri, text Mom I'm on my way" and it just... happens. No voice. No tap. No screen. The tech is literally there. What is missing is scale: enough training data across enough users to make it reliable for everyone, not just lab participants.

Apple's PARS model — the self-supervised EEG learner — could be the key. If you can train on unlabeled brainwaves, you do not need millions of users to sit through calibration sessions. The model learns the patterns on its own. That is the missing piece.

· · ·

## Detecting Seizures From Your Ears

This same technology has a medical upside that honestly gets me excited.

In-ear EEG is real. A [2024 clinical study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10848360/) with 1,255 hours of recordings from 20 epilepsy patients showed that epileptologists could detect **87.5% of seizures** using an in-ear EEG device — comparable to scalp EEG in many cases. The EarSD system, proposed in 2024, collects EEG, EMG, and EOG signals from behind the ear using ML for rapid seizure onset detection.

Companies like [IDUN Technologies](https://www.analog.com/en/signals/articles/idun-in-ear-eeg.html) already make commercial in-ear EEG earbuds (the Guardian, built with Analog Devices) targeting sleep monitoring, cognitive performance, and early detection of epilepsy and Alzheimer's.

Stroke detection from earbuds is still early — strokes are acute vascular events, harder to catch with rhythmic electrical patterns the way seizures are. But the aspiration is real. NextSense, a Google X spinout, has explicitly stated ambitions to anticipate strokes and neurodegenerative conditions using in-ear neural sensing.

Now think about what Apple could do with this. AirPods are already in a quarter billion ears. If those ears had EEG electrodes — which the 2023 patent describes in detail — you could have passive seizure detection running 24/7. Imagine getting a notification: "Unusual neural activity detected. Contact your doctor?" For someone with epilepsy who lives alone, that could be life-saving.

The dual-use pattern is the same one I mapped across [102 TARA techniques](https://qinnovate.com/TARA/): the same technology that can monitor you for medical benefit can also monitor you without consent. The mechanism is identical. The difference is consent, oversight, and security.

· · ·

## Now Here Is Where I Get Worried

Everything I just described — subvocal speech decoding, cognitive state detection, continuous EEG monitoring — has a dark mirror. And it is not hypothetical. It is already in our threat registry.

**[QIF-T0036: Thought decoding (covert speech)](https://qinnovate.com/TARA/QIF-T0036)** — Decoding inner speech from neural signals without user consent. High-density arrays are approaching word-level accuracy. Consumer EEG is at the phoneme level. The TARA registry rates this as **critical severity**. The gap summary says it plainly: "Inner speech decoding violates cognitive sovereignty — no CVSS equivalent." There is no existing cybersecurity scoring system that can even express the severity of someone reading your thoughts.

**[QIF-T0003: Eavesdropping / signal interception](https://qinnovate.com/TARA/QIF-T0003)** — The classic. Neural signals transmitted over Bluetooth can be intercepted. The same protocol your wireless headphones use. The same protocol where researchers have demonstrated interception and replay of unencrypted neural data streams across multiple consumer BCI devices.

Here is the thing that keeps me up: subvocalization attacks are particularly insidious because the victim does not know they are happening. You are not typing on a keyboard that can be keylogged. You are not speaking words that can be overheard. You are thinking — and the attacker is decoding the faint muscular echoes of those thoughts. There is no behavioral indicator. No popup. No log entry. Just silent exfiltration of your inner voice.

And this is not science fiction. The accuracy numbers are already there. MIT hit 92%. NASA hit 99%. Apple just spent $2 billion acquiring the company that can do it with infrared light from an earbud.

Who wants eavesdropping to happen to their mind? Nobody. But the attack surface is growing with every new neural sensing device that ships without post-quantum encryption, without signal integrity validation, without the kind of security architecture that this data demands.

· · ·

## We Need More Security People Looking at This

This is my call to action. I cannot overstate this.

The neurotechnology industry is moving fast. Apple, Synchron, Neuralink, Merge Labs (Sam Altman's $250M bet backed by OpenAI), Paradromics, Precision Neuroscience — billions of dollars flowing into devices that read brain activity. The BCI market is projected to hit [$13.86 billion by 2035](https://www.precedenceresearch.com/brain-computer-interface-market). Morgan Stanley estimates a total addressable market of $80–320 billion.

How many security researchers are focused on neurosecurity? I can count them on one hand and still have fingers left.

We have an entire TARA registry of [102 attack techniques](https://qinnovate.com/TARA/) — mapped with CVSS v4.0 scoring and [NISS neural impact metrics](https://qinnovate.com/scoring/) — and most of the security community has never even heard of neural threat modeling. There is no OWASP Top 10 for BCIs. There is no ATT&CK matrix for neural interfaces. We built the [closest thing that exists](https://qinnovate.com/TARA/), and it needs more eyes on it.

The [Neural Security Protocol (NSP)](https://qinnovate.com/nsp/) exists specifically for this. Post-quantum encryption at the electrode-tissue interface. Physics-based signal integrity scoring. Adaptive anomaly detection. Three device class tiers mapped to regulatory needs. All built on NIST-standardized algorithms. Open for anyone to audit.

But a protocol without a community is just a document. What neurosecurity needs is what web security had in the 2000s: a critical mass of researchers who find the attack surface interesting enough to study, the defenses important enough to build, and the stakes high enough to care.

The stakes are literally your thoughts.

If you are a security researcher reading this and you have ever thought "what is the most important thing I could work on?" — the answer might be the thing between your ears. Not the earbuds. The brain they are about to start reading.

I can not even decode my own brain sometimes. I would really prefer if attackers could not either.

· · ·

## The Timeline

```
2004: NASA Ames achieves 92% subvocal speech recognition (Dr. Charles Jorgensen)
2016: Synchron founded (Tom Oxley, Nick Opie); DARPA seed funding
2018: MIT AlterEgo achieves 92% silent speech accuracy (Arnav Kapur, MIT Media Lab)
2019: First Stentrode implant (Australia, SWITCH study)
2022: Synchron becomes first BCI company in US clinical trials (FDA IDE)
2023: Apple files AirPods EEG patent (US20230225659A1, 20 claims)
2023: SWITCH study published in JAMA Neurology (12-month safety confirmed)
2024: In-ear EEG achieves 87.5% seizure detection rate (clinical study, 20 patients)
2024: Synchron demonstrates BCI + Apple Vision Pro (Mark plays Solitaire by thought)
2025: Apple announces BCI-HID protocol; Mark controls iPad by thought (Aug 4)
2025: Apple publishes PARS — self-supervised EEG learning model (Nov)
2025: MIT AlterEgo spins out as standalone company
2025: Synchron raises $200M Series D (In-Q-Tel, Qatar Investment Authority, Khosla)
2025: Senators propose MIND Act for federal neural data protection
2026: Apple acquires Q.ai for ~$1.5-2B — silent speech via infrared (Jan 29)
2026: Merge Labs raises $250M from OpenAI for non-invasive neural interfaces (Jan)
2027: First limited commercial BCI availability (HDE targets)
2030-2035: Cryptographically relevant quantum computers arrive
```

Every year of neural data transmitted under classical encryption is a permanent liability once quantum computers arrive. The protocol exists. The NIST algorithms are finalized. The device class tiers are defined. What does not exist yet is enough people working on this.

Come build with us. The specs are open. The [TARA registry](https://qinnovate.com/TARA/) is public. The [threat model](https://qinnovate.com/whitepaper/) is documented. And your brain will thank you.

· · ·

*Written by Kevin L. Qi. Written with AI assistance (Claude). All claims verified by the author.*

*Qinnovate develops open standards for brain-computer interface security. For updates on NSP development, MIND Act progress, and BCI security intelligence, subscribe to our [newsletter](/news/) or follow our [RSS feed](/rss.xml).*

---

**Sources:**

- [Synchron Debuts First Thought-Controlled iPad Experience (Business Wire, Aug 2025)](https://www.businesswire.com/news/home/20250804537175/en/)
- [Apple BCI HID Protocol details (iDownloadBlog)](https://www.idownloadblog.com/2025/05/13/apple-iphone-brain-computer-interfaces-details/)
- [Apple AirPods EEG Patent US20230225659A1 (WIPO PatentScope)](https://patentscope.wipo.int/search/en/detail.jsf?docId=US402825807)
- [Apple Acquires Q.ai for Silent Speech (TechCrunch, Jan 2026)](https://techcrunch.com/2026/01/29/apple-buys-israeli-startup-q-ai-as-the-ai-race-heats-up/)
- [MIT AlterEgo: Silent Speech Interface (MIT News, 2018)](https://news.mit.edu/2018/computer-system-transcribes-words-users-speak-silently-0404)
- [AlterEgo Spins Out of MIT (MIT Media Lab, 2025)](https://www.media.mit.edu/articles/exclusive-startup-lets-you-query-ai-with-silent-speech/)
- [NASA Subvocal Speech Recognition (ScienceDaily, 2004)](https://www.sciencedaily.com/releases/2004/03/040318072412.htm)
- [In-Ear EEG Seizure Detection Study (PMC, 2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10848360/)
- [IDUN Guardian In-Ear EEG (Analog Devices)](https://www.analog.com/en/signals/articles/idun-in-ear-eeg.html)
- [Apple PARS EEG Model (9to5Mac, Nov 2025)](https://9to5mac.com/2025/11/28/airpods-brain-signal-study-patent/)
- [Sterling Crispin's Neurotechnology Patents (Flound)](https://www.flound.io/en/magazin/robotik/apple-s-revolutionaeres-patent-airpods-zum-auslesen-von-gehirnwellen)
- [Synchron SWITCH Study, JAMA Neurology (Jan 2023)](https://jamanetwork.com/journals/jamaneurology/fullarticle/2799839)
- [Synchron Raises $200M Series D (Business Wire, Nov 2025)](https://www.businesswire.com/news/home/20251106150841/en/)
- [OpenAI Invests in Merge Labs (TechCrunch, Jan 2026)](https://techcrunch.com/2026/01/15/openai-invests-in-sam-altmans-brain-computer-interface-startup-merge-labs/)
- [Senators Propose MIND Act (US Senate Commerce Committee)](https://www.commerce.senate.gov/2025/9/sens-cantwell-schumer-markey-introduce-legislation-to-shield-americans-brain-data-from-exploitation)
- [BCI Market $13.86B by 2035 (Precedence Research)](https://www.precedenceresearch.com/brain-computer-interface-market)
- [State Neural Data Privacy Laws (KFF Health News)](https://kffhealthnews.org/news/article/colorado-california-montana-states-neural-data-privacy-laws-neurorights/)
