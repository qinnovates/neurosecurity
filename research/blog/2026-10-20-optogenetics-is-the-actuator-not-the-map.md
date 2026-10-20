---
title: "Optogenetics Is the Actuator, Not the Map"
subtitle: "What it actually takes to map a neural chain, why one technique cannot do it, and where our own dataset leans too hard on that one technique."
date_posted: "2026-10-20"
source: "https://github.com/qinnovates/neurosecurity/blob/main/osi-of-mind/whitepapers/QIF-WHITEPAPER-V9.md"
tags: ["#Neurosecurity", "#Optogenetics", "#Connectomics", "#ThreatModeling", "#TARA"]
author: "Qinnovate LLC"
fact_checked: false
---

On 5 October 2026 the Nobel Prize in Physiology or Medicine went to Karl Deisseroth, Peter Hegemann and Georg Nagel for light-gated ion channels and optogenetics ([NobelPrize.org](https://www.nobelprize.org/prizes/medicine/2026/popular-information/)). Coverage since then has drifted toward a claim the method does not make: that optogenetics maps the brain. It does not. It switches cells on or off. A map needs other tools, and a threat model that forgets this inherits a blind spot.

## What optogenetics does

A gene for a light-gated ion channel is delivered to a chosen population of neurons. Light then drives or silences the cells that make the channel, on a millisecond timescale. That is a perturbation. It answers one kind of question well: does this population matter for that behaviour? It does not say what the population is wired to. To learn that, you pair the perturbation with a separate readout.

The best-known example shows why the pairing matters. In a rodent model of Parkinson's disease, the therapeutic effect of stimulating the subthalamic nucleus was accounted for by fibres arriving there from elsewhere, not by the cells at the electrode (Gradinaru et al., 2009, *Science*, DOI:10.1126/science.1167093). The structure an electrode sits in does not name the chain it acts on.

## The other five families

Mapping a neural chain takes several kinds of evidence, and each family supplies one:

| Family | What it establishes | What it cannot establish |
|---|---|---|
| Structural connectomics (volume electron microscopy) | What is physically wired to what | Function or activity |
| Projection tracing (monosynaptic rabies, AAV, barcoded sequencing) | Connectivity between populations | Causality |
| Functional readout (calcium and voltage imaging, high-density electrophysiology) | Activity over time | Cell identity, or direction of influence |
| Molecular identity (single-cell RNA sequencing, spatial transcriptomics) | What kind of cell each one is | How the cells are wired |
| Actuators (optogenetics, chemogenetics) | Causal necessity or sufficiency, when paired with a readout | Anything on their own |
| Integrative methods | Connectivity at cell-type resolution | A human map, so far |

A recent integrative result makes the point without any light at all. Single transcriptome assisted rabies tracing (START) pairs monosynaptic rabies tracing with single-nucleus RNA sequencing. In mouse primary visual cortex it showed that inhibitory inputs onto five layer-specific excitatory populations are specific at the level of transcriptomic subtype (Patiño et al., 2024, *Neuron*, DOI:10.1016/j.neuron.2024.09.003). That is cell-type-resolved wiring, in mice, with no optogenetics.

## Not every new imaging result is a mapping result

Molecular tools are improving fast, and it is easy to file them under brain mapping. Take a 2026 method called dye-cycling ORBIT. It tracks the rotation of DNA with DNA origami rotors for more than ten minutes at 20 Hz, with single-base-pair precision, and was demonstrated on transcription by a bacterial RNA polymerase (Wacker et al., 2026, *Cell Reports Methods*, DOI:10.1016/j.crmeth.2026.101550). It is good molecular biophysics. It is not circuit mapping.

## Why a security project cares

TARA, our catalogue of ways a neural device could be misused, links techniques to neural chains through a dataset of impact chains. We counted the mapping methods that dataset names. Optogenetics appears 132 times. Connectomics, tracing, functional imaging and transcriptomics appear zero times between them.

The whitepaper's prose was already careful: it calls optogenetics causal evidence, and the human results it cites are all in the eye, from one patient's partial restoration of vision to two small retinal trials with mixed results. The dataset is not as careful as the prose. A chain that cites optogenetics as evidence of a structural connection is making a claim the method cannot support. Re-checking those 132 references is now an open task, and the whitepaper's new opening section names all six families so the paper describes the breadth its data should have.

## What this post does not say

- It does not say any of these methods has been used against a person.
- It does not say the brain can be read or mapped in humans today. Every circuit result above is from animals.
- It does not say TARA is validated. It is proposed, unvalidated and authored by one person.

---

*Corrections are welcome as [issues](https://github.com/qinnovates/neurosecurity/issues). If you work with any of these methods and think the table is wrong, we want to hear it.*

*Written with AI assistance (Claude). Every DOI was resolved through Crossref and both 2024 and 2026 papers were checked against their abstracts; the impact-chain counts were recomputed from `datalake/impact-chains.json`. Pending the author's review.*
