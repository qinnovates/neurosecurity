# Neuroethics Principles for Equitable Neurotechnology

**Proposed by:** Kevin Qi
**Date:** March 2026
**Status:** DRAFT v0.3 — Working document for advisor feedback and institutional review.
**Intended audience:** UNESCO International Bioethics Committee, U.S. Congress (Science & Technology committees), Columbia University NeuroRights Initiative, Republic of Chile Ministry of Science, and the global neuroethics research community.

---

> **This document is a draft and contains theoretical proposals.** The five principles presented here are the author's proposed framework. They have not been peer-reviewed, institutionally endorsed, or adopted by any government, standards body, or academic institution. Technical implementation concepts (phosphene rendering pipelines, vector-based compression, semantic web adaptation) describe projected capabilities, not current systems. No working BCI-to-web-browser pipeline exists as of 2026. All claims about future technical feasibility are flagged as theoretical and require independent validation. This document is intended to provoke discussion, not to assert established fact.

> **AI Disclosure:** This document was drafted with AI writing assistance (Claude, Anthropic). All principles, ethical positions, and policy arguments are the author's. Technical framework references (QIF, TARA, NISS) describe proposed, unvalidated research tools, not adopted standards. The author holds no institutional affiliation with UNESCO, Columbia University, or any government body referenced herein. Any claims derived from this document that appear in outward-facing publications must pass neuroethics guardrails (Morse 2006, neuromodesty framework) before publication.

---

## Preamble

I am not a lawyer. I am not a legislator. I am a security engineer who spent fifteen years building the systems that detect threats to data, and who recognized that the same architecture applies at the boundary between silicon and neuron. I am also someone who nearly lost his identity to trauma, who rebuilt himself through technology and education, and who understands in his bones what it means when someone else controls your reality.

These principles come from that intersection. They come from the realization that we are building machines that can read, write, and modulate the signals inside a human brain, and that adequate governance to protect the people wearing those machines has not yet been established. Chile's Law 21.383 and UNESCO's 2025 Recommendation are foundations, but no jurisdiction has enacted enforceable technical security standards for neural interfaces that a patient could point to and say: this protects me.

In 2017, two groups of scholars independently arrived at the same conclusion. Ienca and Andorno, writing from ETH Zurich, proposed four neurorights grounded in international human rights law: cognitive liberty, mental privacy, mental integrity, and psychological continuity (Ienca & Andorno, 2017). Yuste and twenty-four co-authors, writing in Nature, proposed four ethical priorities for neurotechnologies and AI: privacy and consent, agency and identity, augmentation, and bias (Yuste et al., 2017). By 2021, Yuste's priorities had been formalized into five neurorights: mental privacy, personal identity, free will, fair access to augmentation, and protection from algorithmic bias (Yuste, Genser & Herrmann, 2021).

Chile made them constitutional law. UNESCO made them a recommendation adopted by 194 member states. But eight years later, to our knowledge, no published framework provides the technical infrastructure to enforce them. And no one has addressed what happens when the technology meant to restore human capability becomes the mechanism for a new kind of inequality.

These principles attempt to fill that gap. They are proposed, not enacted. They are the work of one researcher informed by the existing literature and his own experience building security infrastructure from the ground up. They require peer engagement, institutional review, and the voices of the patients, clinicians, ethicists, disability advocates, engineers, and policymakers who must ultimately decide whether they are worth adopting.

I am writing them anyway. Because the probability that BCI vision restoration will create new forms of exclusion is greater than zero. And that is sufficient to warrant action, not just investigation.

---

## Why These Principles Are Needed

People are getting their sight back.

Not perfectly. Not fully. But enough to perceive light where there was none, to navigate a room, to recognize a shape. Neuralink's Blindsight received FDA Breakthrough Device designation. Second Sight's Argus II was implanted in over 350 patients. Cortical visual prostheses from research groups at Baylor, Michigan, Monash, and EPFL are advancing through clinical trials. The technology is real. It is here. And it is accelerating.

But the world those patients are re-entering is not just a physical one. It is digital. It is screens and interfaces and information flowing at speeds that even full-sighted people struggle with. Current web accessibility standards were designed for two paradigms: people who can see, and people who cannot. BCI-restored vision is neither. A patient with a cortical implant perceives discrete white phosphenes — points of light, not continuous imagery (Fernandez et al., 2021; Towle et al., 2021). No current device can produce controlled color (PMC11221215, 2024). The resolution is orders of magnitude below biological sight. No existing accessibility standard we have identified accounts for this.

If we restore someone's ability to see the physical world but leave them unable to read a webpage, fill out a form, or video-call their family, we have given them half a world.

We can do better than half.

At the same time, the technology that restores carries the same mechanism that endangers. The same stimulation that treats Parkinson's can cause involuntary activation. The same interface that lets a locked-in patient communicate can, in principle, log neural activity patterns correlated with intent — and as decoding improves, the resolution of what can be inferred will only increase. The difference is consent, dosage, and oversight. The difference is governance.

And the governance to address this does not yet exist in any jurisdiction we are aware of.

---

## The Five Principles

### I. Equity Before Enhancement

*Those who need neurotechnology most should not be last in line.*

We are building tools that can restore lost function to the blind, the paralyzed, the locked-in, and the treatment-resistant. We are also building tools that can augment memory, accelerate cognition, and expand perception beyond biological limits. Both are valid pursuits. But they are not equal in urgency.

Clinical restoration carries a moral priority over elective enhancement — a position grounded in Beauchamp and Childress's principle of justice (2019), which requires that the benefits of medical technology be distributed equitably, with particular attention to vulnerable populations. The patients for whom a BCI is not a luxury but a bridge to participation in the world should not be an afterthought in a market racing toward cognitive upgrades for the already-abled. This is not a hierarchy of human worth. It is a sequencing principle: serve the vulnerable first.

Yuste's framework includes "fair access to cognitive augmentation" as a proposed neurorights principle (Yuste, Genser & Herrmann, 2021). The UN Convention on the Rights of Persons with Disabilities obligates state parties to ensure accessibility (CRPD Art. 9). Beauchamp and Childress established justice as a foundational principle of biomedical ethics (2019). These instruments already contain the obligation. What they lack is the enforcement mechanism and the will to sequence.

Those of us who are willing and able — who want to make a change from our hearts, minds, and souls to help those who are vulnerable — should start here. Not because it is easy, but because it is right. And because every framework we have signed already tells us to.

### II. Digital Accessibility Is a Neurorights Obligation

*If blind people are starting to see, how do we let them see the world AND the internet clearly?*

That question is the seed of everything that follows. And it has no good answer today.

BCI-restored vision produces phosphenes — discrete points of white or yellowish light arranged in patterns the brain learns to interpret (Brindley & Lewin, 1968; Fernandez et al., 2021). The resolution is limited to tens or hundreds of electrodes. Color is an unsolved problem — no implantable device produces it reliably (PMC11221215, 2024). Dynamic content — video, animation, real-time feeds — behaves differently under phosphene vision than under biological sight.

Current accessibility standards (WCAG 2.2, EN 301 549, ADA Section 508) assume you either see or you don't. Screen readers assume no vision. Magnification assumes biological vision. Neither maps to prosthetic phosphene-based sight. We have created a third perceptual paradigm and built zero infrastructure for it.

Under the CRPD (Art. 9), state parties are obligated to ensure accessibility of information and communications technologies. If a BCI is the mechanism by which a person accesses visual information, then the accessibility of digital content through that mechanism is a CRPD concern. Under UNESCO's 2025 Recommendation, member states committed to protecting vulnerable populations in the context of neurotechnology. BCI patients undergoing vision restoration are, by definition, a vulnerable population (UNESCO UDBHR Art. 8).

The obligation already exists in the instruments we have signed. What is missing is the recognition that it extends to the digital world, and the engineering to make it real.

#### Technical Note: Where to Start — Text Rendering for Phosphene Arrays

*The following describes theoretical engineering directions, not current capabilities. No working BCI-to-web-browser pipeline exists as of 2026. These proposals require independent validation.*

Consider the simplest digital task: reading text on a screen. At current electrode counts (96-1024), rendering legible text through a phosphene array is among the hardest problems in cortical visual prosthetics. Letter recognition requires distinguishing fine spatial features — curves, serifs, spacing — at resolutions orders of magnitude below biological sight. If we can solve text legibility at 100-1000 phosphene resolution, we have solved the constraint that makes everything else harder.

This suggests a sequencing strategy: start with text, then build outward. The reasoning:

1. **Text as the minimal viable rendering target.** If a patient can read — even slowly, even imperfectly — they can access the internet, fill out forms, read messages, and participate in digital life. Text is the atomic unit of digital accessibility.

2. **Vector-based rendering maps naturally to sparse electrode grids.** Modern fonts (TrueType, OpenType) are already defined as mathematical curves, not pixel grids. A letterform described as bezier curves can be rasterized to any resolution — including a 10x10 or 32x32 phosphene array — without information loss until the final rendering step. This is the same principle as SVG scaling: resolution-independent representation, rendered to the target at the last moment. Applying vector-graphic scaling to phosphene rendering is a theoretical but scientifically plausible approach.

3. **The rest of the world builds around text.** Once text rendering works, the remaining visual tasks — object recognition, navigation, face perception — can leverage existing mature technologies (LiDAR, AI scene understanding, OCR) as pre-processing pipelines. These systems reduce complex visual scenes to simplified, high-contrast representations optimized for the electrode array. Lozano et al. (2020) developed Neurolight, a deep learning neural interface that optimizes how visual scenes are encoded into electrical stimulation patterns for cortical prostheses, demonstrating that intelligent pre-processing significantly improves the quality of prosthetic percepts compared to naive approaches.

4. **What would the internet look like?** This is the question that must be answered. A BCI-adapted web would need to be a highly simplified, high-contrast, semantically structured representation — closer to a text-mode browser with spatial layout preserved and interactive elements clearly distinguished than to a visual rendering of a modern webpage. Current accessibility standards (WCAG contrast ratios, screen reader APIs) are irrelevant to this paradigm. A new standard for phosphene-legible digital content would need to be developed.

5. **Compression as a rendering strategy.** The concept of a compressed side-process for image rendering parallels how screen readers already work — they extract semantic structure, not pixels. A BCI rendering pipeline would similarly need a semantic compression layer: extract what matters (text content, layout hierarchy, interactive elements), discard what does not (gradients, shadows, animations), and render the result to the phosphene grid. This is closer to scene understanding plus selective rendering than to traditional image compression (JPEG, H.264), but the vector scaling concept applies at the final rendering step.

This approach — text first, vector rendering, semantic compression, existing tech for the physical world — is a theoretical engineering direction that aligns with where cortical prosthetics research is headed. It is not a claim that this pipeline exists or will exist on any specific timeline. It is a claim that the building blocks are mature in adjacent fields and that the integration gap is an engineering problem, not a physics problem.

### III. Perceptual Sovereignty

*Whoever controls the rendering pipeline controls reality.*

If a BCI mediates everything a patient sees, then the entity controlling that device controls the patient's visual world. This includes what the patient sees and what the patient does not see. It includes what is added to the visual field that is not present in the environment. It includes what is logged — what the patient looked at, for how long, in what context, and what can be inferred from those patterns.

At what point does a vision-assisting BCI become a supervision tool? That is not a hypothetical question. It is an engineering question with a specific answer: it becomes supervision the moment someone other than the patient can alter the rendering without the patient's knowledge and consent.

No entity — manufacturer, healthcare provider, government, or third party — should have unilateral control over the content rendered to a BCI patient's visual cortex without the patient's informed, ongoing, and revocable consent.

This is not a new right. It is an application of existing neurorights — cognitive liberty (Ienca & Andorno, 2017), mental privacy (both frameworks), and mental integrity (both frameworks) — to the specific technical context of BCI-mediated perception. Where it differs from mental integrity as currently defined: mental integrity protects against unauthorized modification of brain activity. Perceptual sovereignty extends this to the input channel — the content delivered to the brain, not just the signals altered within it. The distinction is between protecting the brain's state and protecting the brain's information environment. Chile's Law 21.383 (2021) classifies neural data as organ tissue. If the data coming into your brain is as protected as the data coming out, then perceptual sovereignty follows directly. This distinction requires further philosophical and legal analysis to determine whether it constitutes a genuinely new concept or is derivable from existing mental integrity frameworks (Kellmeyer, 2022).

The history of technology governance teaches one lesson above all others: if a capability exists, it will be exercised unless governance is in place before deployment at scale. The internet was built without security. Social media was built without content governance. BCI vision must not be built without perceptual sovereignty protections.

We have a window. It is closing.

### IV. The Right to Remain Unaugmented

*Equal access means the option is available. It does not mean the option is mandatory.*

This is the principle that keeps me up at night. Because the same technology I want to bring to the blind could become the technology that punishes everyone who refuses it.

If neurotechnology confers cognitive or sensory advantages beyond baseline human capability, economic and social pressure could push adoption from voluntary to effectively compulsory. Not by law. By market. A partial precedent exists with smartphones — though the analogy has limits, the pattern of market-driven mandatory adoption is well-documented (Jotterand, 2008). Nobody passed a law requiring you to carry one. But try getting a job, navigating a city, managing a bank account, or going through airport security without one. The mandate was never legislative. It was environmental.

The enhancement trap works in two stages. First, early adopters gain advantage. Then, non-adopters face disadvantage — not because they lost capability, but because the world shifted to assume everyone has it. Apply this to cognitive augmentation and the implications are staggering. A student whose competitor has neurally augmented memory. A soldier whose unit has augmented perception. A job applicant competing against someone with a neural interface to AI.

At what point does augmented vision become superhuman vision? A cortical prosthetic that restores sight to a blind patient is therapeutic. The same hardware tuned to perceive infrared, process faces at distance, or record everything continuously is a surveillance capability. The boundary is not the technology. It is the capability envelope. Same mechanism, different parameters.

Ienca and Andorno's Cognitive Liberty already contains the seed of this protection — the right to accept or refuse neurotechnology (2017). But Cognitive Liberty as currently framed protects the decision. It does not protect the person from the consequences of that decision in a world that has moved on without them.

This principle makes the protection explicit: no individual should face discrimination, competitive disadvantage, or social penalty for choosing not to adopt neurotechnology. In employment. In education. In military service. In insurance. In access to public services. The right to an unaugmented mind is as fundamental as the right to an augmented one.

Bublitz (2022) warns against rights inflation — multiplying neurorights without philosophical warrant. This protection may already be derivable from Cognitive Liberty if properly interpreted. The point is not to inflate. It is to operationalize. To say clearly what the existing principle implies but does not yet enforce.

### V. From Protection to Obligation

*Security without ethics is surveillance. Ethics without security is aspiration. You need both, or you have neither.*

Every existing neurorights proposal is defensive. Protect mental privacy: do not read. Protect mental integrity: do not write. Protect cognitive liberty: do not coerce. Protect psychological continuity: do not alter. These protections are necessary. They are correct. And they are not enough.

If neurotechnology can restore lost function, and if the instruments we have signed commit us to equity, accessibility, and respect for vulnerability, then there is a constructive obligation: ensure the benefits reach those who need them. Not as charity. Not as an afterthought. As a design requirement built into the technology from day one.

This principle reframes neurorights from prohibition to obligation:

| What We Protect Against | What We Build Toward |
|---|---|
| Do not read neural data without consent | Ensure neural data protections extend to digital contexts |
| Do not alter cognition without consent | Ensure cognitive restoration includes digital accessibility |
| Do not discriminate based on neural data | Do not discriminate against the unaugmented |
| Provide equal access to augmentation | Sequence restoration before enhancement |

The people willing and able to help — the researchers, engineers, ethicists, policymakers, clinicians, and patient advocates — should work to ensure that vision restoration means restoration to the full world. Not just the physical part. Not just the part that existed before the internet. The whole world.

That duty is not aspirational. It is written into the CRPD, the UDBHR, the 2025 UNESCO Recommendation, and the Chilean constitution. The question is whether we act on it before the technology outpaces the governance.

History suggests we will not. These principles argue that we should try anyway.

---

## A Note on What This Is

I want to be precise about what I am proposing and what I am not.

These principles are the work of one independent researcher. They have not been peer-reviewed, institutionally endorsed, or adopted by any government or standards body. They draw on established frameworks — Ienca and Andorno, Yuste, Beauchamp and Childress, the CRPD, UNESCO — but the synthesis, the sequencing, and the constructive obligation framing are my own.

I am not a neuroethicist by training. I am a security engineer who is pursuing neuroethics because I recognized that the field I want to build — neurosecurity — cannot exist without the ethical foundations to deploy it responsibly. The security tools are evidence of belonging in the neuroethics room, not a separate identity.

The technical framework I reference — QIF, TARA, NISS — is proposed and unvalidated. It has not been independently replicated or adopted by any standards body. I reference it because it is the technical layer I am building to operationalize these principles. But the principles stand independent of the framework. Even if QIF never ships, the questions these principles raise still need answers.

I wrote these because someone has to start. Not because I have all the answers, but because the probability that BCI vision restoration will create new forms of exclusion is greater than zero. That warrants investigation. That warrants action. That warrants principles.

And if I am wrong about the specifics, I would rather be wrong in public — with my reasoning visible, my sources cited, and my guardrails documented — than be silent while the window closes.

---

## Call to Action

To the neuroethics community: these principles need your critique, your expertise, and your dissent. They are intentionally incomplete. The philosophical grounding needs testing against the anti-inflationism critique (Bublitz, 2022), the underspecification problem (Kellmeyer, 2022), and the brain reading limits that constrain what is actually possible today (Wexler, 2019; Ienca, 2018).

To the disability rights community: nothing about you without you. The scope of "those who need it most" cannot be defined by any single researcher or research group. It requires the voices of the patients, advocates, and communities who will live with these technologies.

To the engineering community: the sensor-to-cortex pipeline is not hypothetical. LiDAR, depth-sensing cameras, AI scene understanding, and lossy-to-lossless compression are mature technologies in adjacent industries. The gap is integration, not invention. Build with accessibility from the start, not after.

To legislators and policymakers: the instruments already exist. The CRPD, the UDBHR, the UNESCO Recommendation, Chile's Law 21.383. What is missing is the recognition that these instruments extend to the digital accessibility of BCI-mediated perception, and the will to enforce them.

To anyone reading this who shares this world: these technologies will arrive whether we govern them or not. The question is whether the governance arrives first. I believe it can. I believe it must. And I believe the people willing and able to make it happen are already here.

We just need to start building.

---

## References

1. Beauchamp TL, Childress JF. (2019). *Principles of Biomedical Ethics*, 8th ed. Oxford University Press.
2. Bostrom N, Sandberg A. (2009). "Cognitive Enhancement: Methods, Ethics, Regulatory Challenges." *Science and Engineering Ethics* 15(3):311-341. DOI:10.1007/s11948-009-9142-5.
3. Brindley GS, Lewin WS. (1968). "The Sensations Produced by Electrical Stimulation of the Visual Cortex." *Journal of Physiology* 196(2):479-493. PMID:4871047.
4. Bublitz JC. (2022). "Novel Neurorights: From Nonsense to Substance." *Neuroethics* 15(1):Article 7. DOI:10.1007/s12152-022-09481-3.
5. Farahany NA. (2023). *The Battle for Your Brain.* St. Martin's Press. ISBN:978-1250272959.
6. Fernandez E, et al. (2021). "Visual Percepts Evoked with an Intracortical 96-Channel Microelectrode Array Inserted in Human Occipital Cortex." *Journal of Clinical Investigation* 131(23). PMC8631600.
7. Ienca M, Andorno R. (2017). "Towards New Human Rights in the Age of Neuroscience and Neurotechnology." *Life Sciences, Society and Policy* 13(1):5. DOI:10.1186/s40504-017-0050-1.
8. Ienca M. (2021). "On Neurorights." *Frontiers in Human Neuroscience* 15:701258. DOI:10.3389/fnhum.2021.701258.
9. Jotterand F. (2008). "Beyond Therapy and Enhancement: The Alteration of Human Nature." *NanoEthics* 2(1):15-23.
10. Kellmeyer P. (2022). "'Neurorights': A Human Rights-Based Approach for Governing Neurotechnologies." In *Cambridge Handbook of Lawyering in the Digital Age*, 412-426.
11. Lozano A, Suarez JS, Soto-Sanchez C, et al. (2020). "Neurolight: A Deep Learning Neural Interface for Cortical Visual Prostheses." *International Journal of Neural Systems* 30(9):2050045. PMID:32689842. DOI:10.1142/S0129065720500458.
12. Morse SJ. (2006). "Brain Overclaim Syndrome and Criminal Responsibility." *Ohio State Journal of Criminal Law* 3:397-412.
13. Qi K. (2026). "Quantum Intelligence Framework: A Security Framework for Brain-Computer Interfaces." Preprint. DOI:10.5281/zenodo.18640105. *Proposed framework, not peer-reviewed.*
14. Republic of Chile. (2021). Constitutional Amendment Art. 19 + Law 21.383 on Neuroprotection.
15. Towle VL, et al. (2021). "Toward the Development of a Color Visual Prosthesis." *Journal of Neural Engineering* 18(2). PMID:33339020.
16. UNESCO. (2005). Universal Declaration on Bioethics and Human Rights.
17. UNESCO. (2025). Recommendation on the Ethics of Neurotechnology. 43rd General Conference.
18. United Nations. (2006). Convention on the Rights of Persons with Disabilities (CRPD).
19. Wexler A. (2019). "Separating Neuroethics from Neurohype." *Science* 363(6424):234. DOI:10.1126/science.aav0223.
20. Yuste R, Goering S, Arcas BA, et al. (2017). "Four Ethical Priorities for Neurotechnologies and AI." *Nature* 551:159-163. DOI:10.1038/551159a.
21. Yuste R, Genser J, Herrmann S. (2021). "It's Time for Neuro-Rights." *Horizons* 18:154-164.

---

## Appendix: Author's Raw Notes (Unedited, Preserved for Transparency)

The following are the author's original, unedited notes from which these principles were derived. They are preserved per the author's commitment to epistemic transparency. For corrected versions with context, see [QIF Field Journal Entry 023](../model/QIF-FIELD-JOURNAL.md#entry-023).

### Note 1 (2026-03-06):
> If BCIs can help cure blindness, then it is our rights as our rights, duties, responbitilies and sole proprietorships of those who are protected under the neuroethics act(s) to help those who are vulnerable. Under (section X of Y article, page #, and site it as an academic would), in neurorights and neuroethics publications <list related> it is our duty as fellow people who are willing and able to help others. Where willing and able is defined as those who want to and aspire to make a change from their heart, mind, and soul to help those vulnerable and physically deemed clinical use FDA for BCIs such as loss of vision, (and other uses in research thats approved today), we should protect their neurorights that I hope one day becomes influence for some policy work and actual lawyers writing from... There's so many angles this xan be addressed as policies hopefully after much needed strict collaboration and review to UNESCO,-- needs a lot of work. This is my thesis too.

> What I forgot to add is the purpose I started mentioning the above is a basic simple question: if blind people are starting to see, how do we let them see the world AND the internet clearly. I ponder this philosopically as well because what we learned from LLM model advacemenets lately is that AI was first able to identify letters then image better than context initially back in year X reference MIT OCW 9.13) - Then images for image generation models seemed to be different because of the LLMKs being trained on given different set of datasets + algorithmic. I wonder why image rendering isnt a separate module for some AI models and then build compression so it runs like a compressed side process, when I say compression I mean like vector image scaling (vector in the image conversion sense) so it scales downor while remaining lossless.Can use existing compression already exists,

> Wow- this also answers my idea of Runemate

> all of this ultimately leads to one day finding a way to allow blind people to see the internet as I believe that's the next step as neuroethicists to come together and collavorate to help those with who need it the most (needs defining this scope, because where is the boundary lie).Also ethically, which groups are to say, if any at all?

> I must write this as careful as possible using my neuroethics guardrails

> What is an overstatement per Morse's <include citation> if technological trends, research space, industry intel, financial funding all allude to the medical advancements? For instance, BCIs are curing vision, theres different ways, what is vision, and how do we make it inclusive for them? At what point also does it become supervision?

### Note 2 (2026-03-06):
> Vision is already being repaired and if we can map 3D environment using phones today and with wifi, lidar, anything waves and frequency, even sound liek sonar, and that's how Lidar on cars, then that's probably what's already the direction most companies are. What would that look like in the visual cortex if its a signal stimulated by your own neurons but with the assistance of a BCI? I presume having a car company that uses lidar and makes BCIs is totally doing this already, thus the other way to help them do it quicker is to look at angles where we know how microsoft kinect ( make one of the visualizations on the BCI site show thethree.js of microsoft kinect of a dog (and text showing, for bling and seeing eye dog) and examples using AI OCR to render more realistic looking face in realtime_) | Idea I just had was to make it easier to use Kinect to test probably because its already blogs, but I do know our eyes can generate what we can actually see because that's how the visual cortex. It's more of a hatter of how, and at what point does it become dangerous? That's what I tried to answer with TARA and I needed a fraemwwork to weigh try to see what the implications are from both side. At what point does the risks outweigh the cons- i intentionally did not weigh this or do any math because it is not my say. NISS was phase 1 as it was the lowest hanging fruit from a security perspective I could tackle with a higher confidence of having the proper framework for equation, however, I'm just basing it off of what secutiy implications and only referencing DSM POTENTIALS as probable but not definition derivatives. The probability is greater than 0, hence warrants investigation per my hypothesis. there are many other factors

### Note 3 (2026-03-07):
> I had a vision last night. Now I know how to paint the story and get to the finish line. Starts with neuroethics and ends with my BCI vision. I started writing what I call neuroethics bylaw. I'm not sure if that's the proper naming for it but given the neuroethics's neurorights which aims to provide equal access, it is implicit that those who are willing and able in neurotechnology research should start with equity by giving those who live in a world so connected the same freedom to explore our magnificent real world through the technological tools that allow us to connect first.

> My main concern is at which point does this become too much of an advantage, like a superhuman vision that can be used for inhumane reasons. Per Social Pressure: There is concern that "equal access" might inadvertently create a "right to be enhanced," pressuring individuals to use these technologies just to remain competitive in work or education.
