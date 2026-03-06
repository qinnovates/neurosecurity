# Consent Under Cognitive Drift: When Brain-Computer Interfaces Challenge the Autonomy They Restore

**Kevin Qi**

---

## I. Introduction

Brain-computer interfaces exist to give people back what they lost. A locked-in patient gets to communicate again. A Parkinson's patient gets motor control back. A patient with treatment-resistant depression gets something harder to name. The device intervenes at the level of neural signaling to restore a capacity the patient cannot produce on their own. The ethical case writes itself: the intervention serves autonomy by restoring the conditions that make autonomy possible.

But there is a problem hiding inside that justification. What happens when the device that restores autonomy also changes the person exercising it?

This is not hypothetical. Adaptive BCIs adjust stimulation parameters in real time based on neural feedback. Over months, those adjustments shift the patient's cognitive baseline. The patient who signed the consent form may not be the same patient — cognitively, emotionally, in how they make decisions — six months later. The change is not sudden. It is gradual, cumulative, and in most cases invisible to the person it is happening to. I call this cognitive drift. Current consent frameworks have nothing to say about it.

Informed consent assumes a stable autonomous agent. A person who can receive information, understand it, weigh it, and authorize a course of action. BCIs break every part of that assumption. The technology does not act on the body while leaving the mind alone. It sits inside the neural architecture that produces understanding, valuation, and decision-making. When the intervention can alter the very capacities that consent requires, the consent model is not just insufficient. It does not make sense.

This essay argues that existing neurorights frameworks catch deliberate violations but miss the more common problem: cognitive drift. I use S. Matthew Liao's Fundamental Conditions Approach to propose a threshold test for ongoing consent, and I draw on data from my own cataloguing of 109 BCI attack and intervention techniques to show that the mechanisms of drift are not speculative. They are already present in existing therapeutic devices. The point is not to argue against BCIs. It is to argue that the consent architecture has to be as sophisticated as the technology.

## II. The Standard Account of Informed Consent

Beauchamp and Childress wrote the playbook. Their principlist framework in *Principles of Biomedical Ethics* — autonomy, beneficence, nonmaleficence, justice — is the scaffolding behind virtually every IRB, clinical trial protocol, and consent process in contemporary medicine.[^1]

Informed consent is how the autonomy principle works in practice. Five conditions: disclosure, understanding, voluntariness, competence, authorization.[^2] When a surgeon explains the risks of a knee replacement and the patient signs, the framework works. The surgery acts on the knee. The mind that made the decision stays the same.

That stability assumption is doing more work than anyone admits. The whole framework depends on the premise that the person who consents at time T1 is functionally the same person who experiences the intervention at time T2. Their values, reasoning, sense of self — all presumed to persist through treatment. The consent before the procedure is taken to authorize the experience after.

For most of medicine, this holds. A cardiac stent does not change how you think. Chemo has cognitive side effects, but the treatment is not designed to interface with cognition, and those effects are understood as unintended. The consent framework was built for interventions that act on the body. BCIs are not that kind of intervention.

## III. How BCIs Alter the Consenting Agent

A BCI does not just monitor neural activity or deliver a fixed signal. Modern closed-loop BCIs read neural signals, interpret them, and adjust output in real time. The device and the brain modify each other continuously. That is by design. That is what makes BCIs work. That is also what makes them ethically different from every other class of medical device.

Here is what that looks like at the signal level. In cataloguing 109 BCI techniques for the Quantitative Intercept Framework (QIF), I found that 77 have confirmed, probable, or possible therapeutic analogs.[^3] Signal injection is deep brain stimulation. Entrainment manipulation is therapeutic tACS. Pushing a neural system across a bifurcation point is controlled neuromodulation. Same electrode, same current, same physics. Different intent. The difference between therapy and harm is not the mechanism. It is the consent, the dosage, and the oversight. The line between treatment and harm runs through governance, not through physics.

If 77 of 109 techniques can serve either purpose depending on context, then all the ethical weight falls on the governance layer. And that layer has to account for three ways BCIs can change the person who said yes:

**Gradual retuning.** Adaptive algorithms modify stimulation parameters continuously based on neural feedback. Each adjustment is small. But over weeks or months, the cumulative effect is a cognitive baseline that has shifted from where the patient started. There is no moment of change. No event that triggers reassessment. The shift is like the hour hand of a clock: always moving, never visibly in motion. In my QIF threat taxonomy, I call this adiabatic baseline poisoning — borrowing from thermodynamics to describe a slow, sub-threshold alteration that evades detection because each increment falls below the patient's perceptual threshold.[^3] The detection problem is not new to me. I spent fifteen years building security detections using statistical baselines and standard deviations — the longer the baseline, the more accurately you can distinguish a real anomaly from noise. The same principle applies here. Detecting cognitive drift requires a sustained cognitive baseline against which deviation becomes measurable. The absence of that baseline is exactly what makes drift invisible under current consent models.

**Homeostatic drift.** The brain adapts to sustained stimulation through neuroplasticity. Neural circuits reorganize around the device's input. The therapeutic effect fades. The clinician recalibrates. Each recalibration changes the neural environment the patient is operating from. The patient who consented to a specific protocol is now receiving a different one, authorized not by new consent but by a clinical judgment about maintaining efficacy. The goalposts moved. Nobody asked the patient if the new goalposts still match what they agreed to.

**Therapeutic side effects on cognition.** DBS for Parkinson's has been documented to alter impulse control, personality, and emotional processing in some patients.[^4] These are not the target of the intervention. They are side effects of stimulating circuits that do more than one thing. But unlike chemo nausea, these side effects change the faculties the patient needs to evaluate whether treatment is still acceptable. A patient whose impulse control has been diminished by the device is not in a position to make a considered judgment about continuing. The consent framework assumes a stable decision-maker. The device destabilized the decision-maker.

These failure modes compound. The PTSD and neuroplasticity literature documents each link in this chain independently: chronic stress degrades prefrontal cortex function, that degradation impairs suppression of maladaptive memory replay, and sustained replay further weakens the substrate. In mapping endogenous neural degradation through QIF, I proposed that these links form a reinforcement cycle — what I call the endogenous attack chain.[^3] Slow drift weakens the substrate. That amplifies vulnerability to replay loops and what I term self-model corruption — the progressive distortion of the patient's internal representation of their own cognitive state. The corrupted self-model reduces the capacity to detect the drift. So the drift accelerates undetected. I identified this pattern by mapping my own experience of compounded trauma and B12 deficiency through the same framework I built to catalog BCI attacks. The chain that a malicious actor would execute deliberately is the same chain that illness, device interaction, and neuroplasticity can produce with no one intending harm.

These are not edge cases. They are how closed-loop BCIs work. Any device that interfaces with circuits involved in cognition, emotion, or decision-making can alter the agent who authorized its use. The question is not whether this will happen. It is whether our consent frameworks are ready when it does.

## IV. Why Current Neurorights Frameworks Miss This

Ienca and Andorno proposed four neurorights in 2017: cognitive liberty, mental privacy, mental integrity, and psychological continuity.[^5] These are the most developed normative framework for protecting people from neurotechnology misuse. They have informed policy at the OECD, UNESCO, and in Chile's 2021 constitutional amendment on neuroprotection.

But the framework was built for a specific kind of harm: deliberate violation. Cognitive liberty protects against forced neural intervention. Mental privacy protects against unauthorized access to neural data. Mental integrity protects against unauthorized modification of neural states. Psychological continuity protects against identity disruption. Every one of these assumes an external agent doing something to your brain without permission. The framework is, at its core, an intrusion detection system.

Cognitive drift is not intrusion. Nobody is attacking the patient. Nobody is accessing their data without authorization. The device is operating within approved parameters, administered by a clinician following protocol, with the patient's consent on file. And yet the patient's cognition — reasoning, emotional responses, sense of self — is changing incrementally. The four neurorights have nothing to say about this because they were built to catch boundary violations, not gradual shifts inside the boundaries of authorized treatment.

The gap shows up when you approach the problem from engineering instead of philosophy. Ienca and Andorno asked a philosophical question: what rights does a person have when neurotechnology is involved? That question produces rights at the level of subjective experience — thoughts, identity, privacy. A security question — what can go wrong at the signal level, and what protections does the system need? — produces different requirements because it operates at a different level of the stack. When I mapped all 109 techniques against the four neurorights, mental integrity alone was implicated in 71 of them.[^3] But the nature of the violation varied drastically: acute versus cumulative, reversible versus permanent, detectable versus sub-threshold. The neurorights framework treats mental integrity as one right. The engineering shows it is a spectrum of failure modes, each needing different protections.

This is a gap, not a flaw. Ienca and Andorno did necessary work, and the rights they identified are real. But a framework built to catch the intruder who kicks down the door cannot also catch the slow leak that changes the air inside the house. Cognitive drift is the slow leak. The patient is still in there when it happens. But the wiring is not carrying the signal cleanly. And the frameworks we have cannot tell us when the change has crossed a line that matters.

## V. Liao's Fundamental Conditions as a Grounding

Liao's Fundamental Conditions Approach offers a way to fill this gap. He argues that human rights protect the fundamental conditions for pursuing a good life — certain goods, capacities, and options that human beings need regardless of what else they need as individuals.[^6] The fundamental capacities he identifies include the ability to think, to be motivated by facts, to know, to choose and act freely, and to develop interpersonal relationships. These are not abstractions. They are the operating requirements of autonomous agency.

Apply this to BCIs and you get something the neurorights model does not have: a threshold test. The question is not just whether consent was given. It is whether the fundamental capacities for giving consent are still intact. If a BCI has gradually altered the patient's ability to think clearly, to be motivated by facts instead of device-induced impulses, or to choose freely without cognitive distortion, then the conditions for valid consent have been undermined. It does not matter that the patient has not noticed. It does not matter that the clinician did not intend it.

Liao's 2019 paper "Designing Humans" sets a permissibility floor for genetic modifications: anything that undermines fundamental capacities is impermissible, regardless of the intended benefit.[^7] Does the same floor apply to neuromodulation that is reversible and therapeutic in intent? I argue yes. Reversibility is a red herring. If a BCI altered a patient's reasoning capacity for six months, the fact that removing the device reverses the alteration does not undo six months of decisions made under diminished capacity. The damage to autonomy already happened. And if the patient's altered cognition prevents them from recognizing the change — or from wanting to reverse it — then reversibility is not even practically available. A door that can be opened is not an exit if you no longer remember it is there.

There is a subtlety here that consent-based frameworks miss entirely. Consent is binary: given or not given. But the erosion of fundamental capacities is continuous. A patient can retain enough reasoning to pass a competency test while having lost enough to make systematically different decisions than they would have made before treatment. Liao's framework asks not whether the patient can consent in some minimal sense but whether the conditions for genuinely autonomous consent — thinking clearly, being motivated by facts, choosing and acting freely — are substantively preserved. That is a higher standard. It is the right standard for a technology that operates inside the machinery of thought.

## VI. Toward a Dynamic Consent Standard

If this argument holds, then consent for BCIs cannot be a one-time event that authorizes ongoing treatment. It has to be continuous, with built-in mechanisms for detecting when the conditions for valid consent have degraded. Three requirements:

**First, cognitive baseline monitoring.** The capacities Liao identifies — thinking, reasoning, free choice — need to be assessed not just at initial consent but at regular intervals. This does not mean a philosophical exam at every clinic visit. It means validated instruments that detect meaningful changes in cognitive function, decision-making quality, and emotional regulation relative to the patient's pre-treatment baseline. The technology partially exists in neuropsychological testing. What does not exist is the requirement to use it.

In building QIF, I developed a Consent Complexity Index (CCI) that scores each technique based on the complexity of consent it requires — factoring in reversibility, patient detectability, and the degree to which the technique can alter cognition.[^3] Across 109 techniques, the mean CCI is 1.01, but 11 techniques score above 2.0, meaning standard informed consent is structurally inadequate for those interventions. Separately, four techniques flagged for persistent effects on personality — the same category of effect documented in DBS patients — also require enhanced consent protocols under the framework. The CCI does not replace clinical judgment. But it gives you a quantitative signal that certain interventions demand more than a signature on a form, and it tells you which ones.

**Second, drift detection at the device level.** Adaptive BCI algorithms already track neural signals to adjust stimulation. The same data can be monitored for cumulative deviation from the consented protocol. When the aggregate of small adjustments has moved the stimulation profile past a predefined boundary — set during the consent process — the system flags it and requires clinical review. This is not speculative. It is a governance layer on existing device capabilities. The same architecture that identifies attack surfaces can identify drift boundaries.[^8]

**Third, third-party oversight of cognitive integrity.** The patient cannot be the sole judge of whether their own cognition is intact, for the same reason that a person with anosognosia cannot reliably report their own deficits: the impairment may affect the faculty needed to detect it. This is the problem I keep coming back to: who watches the watcher when the thing being watched is the patient's own cognition? The clinician alone is not the answer, because the clinician's primary obligation is therapeutic efficacy, and there will be cases where maintaining efficacy means accepting some drift. An independent oversight function — ethics board, patient advocate, automated monitoring with escalation protocols — is necessary to hold the tension between benefit and integrity.

This proposal has its own problems. Continuous cognitive monitoring is surveillance. The infrastructure built to protect patients from drift could become a mechanism of control. The same monitoring that catches reasoning changes could be used to override patient decisions that clinicians or regulators find inconvenient. Any dynamic consent framework needs safeguards against that inversion — protecting the patient not just from the device but from the monitoring apparatus itself. If we cannot yet say who governs, we can at least say how: continuously, transparently, with ethical review at every checkpoint.

## VII. Conclusion

BCIs are a category of medical technology that the existing consent infrastructure was not built for. The principlist model assumes a stable agent. Neurorights frameworks assume violations come from outside. Neither accounts for the possibility that the technology itself, working exactly as designed, might gradually alter the cognitive conditions that make consent possible.

Liao's Fundamental Conditions Approach gives us the grounding: are the patient's capacities to think, to reason, and to choose freely substantively intact? If not, the consent on file is no longer valid, no matter how competent the patient appears by conventional measures. The technical infrastructure for detecting drift — baseline monitoring, cumulative deviation tracking, consent complexity scoring — does not need to be invented. It needs to be required.

BCIs exist to help people get back what they lost. The consent framework has to be worthy of that. The gap between intrusion-based neurorights and drift-based reality is where patients are most vulnerable. Getting the ethics into the engineering before someone gets hurt is not a slogan. It is a design requirement.

---

## References

[^1]: Beauchamp, T. L., & Childress, J. F. (2019). *Principles of Biomedical Ethics* (8th ed.). Oxford University Press.

[^2]: Beauchamp, T. L., & Childress, J. F. (2019). *Principles of Biomedical Ethics*, Chapter 4: Respect for Autonomy. Oxford University Press.

[^3]: Qi, K. (2026). Securing Neural Interfaces: Architecture, Threat Taxonomy, and Neural Impact Scoring for Brain-Computer Interfaces. *Zenodo*. https://doi.org/10.5281/zenodo.18640105

[^4]: Lhommée, E., et al. (2012). Subthalamic stimulation in Parkinson's disease: restoring the balance of motivated behaviours. *Brain*, 135(5), 1463–1477. https://doi.org/10.1093/brain/aws078

[^5]: Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5. https://doi.org/10.1186/s40504-017-0050-1

[^6]: Liao, S. M. (2015). Human Rights as Fundamental Conditions for a Good Life. In R. Cruft, S. M. Liao, & M. Renzo (Eds.), *Philosophical Foundations of Human Rights* (pp. 79–100). Oxford University Press.

[^7]: Liao, S. M. (2019). Designing Humans: A Human Rights Approach. *Bioethics*, 33(1), 98–104. https://doi.org/10.1111/bioe.12519

[^8]: Qi, K. (2026). Securing Neural Interfaces. *Zenodo*. https://doi.org/10.5281/zenodo.18640105
