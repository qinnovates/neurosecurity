---
title: "The Neural Impact Chain: When Security Scores Predict Psychiatric Diagnoses"
subtitle: "How we mapped 99 BCI attack techniques to DSM-5-TR diagnoses — and discovered that NISS scores already predicted the answer"
date_posted: "2026-02-13"
source: "https://qinnovate.com"
tags: ["#TARA", "#DSM5TR", "#NeuralImpactChain", "#NISS", "#BCI", "#Psychiatry", "#Neuroethics", "#QIF", "#RDoC"]
---

## The Question Nobody Asked

When a BCI attack disrupts your amygdala, what happens to your mental health?

Not in the hand-wavy "it could cause problems" sense. In the clinical sense. Which specific DSM-5-TR diagnosis maps to that disruption? What ICD-10-CM code would a clinician use? What does the insurance form look like?

Nobody had answered this. The BCI security literature catalogs attacks. The clinical literature catalogs diagnoses. The gap between them is a chasm — and it is exactly the chasm where real patients will fall.

Today we closed it.

## 99 Techniques, 15 Diagnoses, One Chain

The [TARA registry](https://qinnovate.com/TARA) now maps all 99 BCI techniques to DSM-5-TR psychiatric diagnoses through what we call the **Neural Impact Chain (NIC)**:

**Technique → Hourglass Band → Brain Structure → Cognitive Function → NISS (how much) + DSM (what kind)**

Take QIF-T0010, ELF neural entrainment. It targets bands N4 through N7 — thalamus, basal ganglia, limbic system, and neocortex. Through the NIC, those bands map to structures (PFC, amygdala, hippocampus, striatum), which map to functions (executive function, emotion regulation, memory consolidation, motor selection), which map to diagnoses:

- **Primary:** Schizophrenia Spectrum (F20), Sleep-Wake Disorders (G47), Dissociative Disorders (F44), ADHD (F90), Substance Use (F10), OCD (F42), Tic Disorders (F95), Major Depressive Disorder (F32), GAD (F41.1), PTSD (F43.10)
- **Diagnostic cluster:** Cognitive/Psychotic
- **Risk class:** Direct

Every technique now carries this mapping. Silicon-only techniques (S1-S3 bands, no neural pathway) get `risk_class: "none"`. Everything else gets ICD-10-CM codes, confidence levels, and the neural pathway chain that explains *why*.

## The NISS-DSM Bridge: The Part That Surprised Us

Here is what we did not expect: **NISS scores already predicted the diagnostic mapping.**

NISS (Neural Impact Scoring System) has five metrics: BI (Biological Impact), CG (Cognitive Integrity), CV (Consent Violation), RV (Reversibility), and NP (Neuroplasticity). We designed these to quantify security impact. But when we laid them against DSM-5-TR chapters, the correspondence was immediate:

| NISS Metric | Security Meaning | Diagnostic Prediction |
|-------------|------------------|----------------------|
| BI (High/Critical) | Tissue damage | Motor/Neurocognitive disorders |
| CG (High/Critical) | Cognitive disruption | Cognitive/Psychotic disorders |
| CV (Elevated/Involuntary) | Consent violation | Mood/Trauma disorders |
| NP (Structural) | Lasting neural change | Persistent/Personality disorders |
| RV (Partial/Irreversible) | Poor recovery | Chronicity modifier |

A technique with CV:E (Elevated) and CG:H (High) doesn't just have a "high security impact." It specifically predicts mood/trauma and cognitive/psychotic risk — meaning PTSD, depression, and psychotic features are the primary clinical concerns.

NISS was designed as a security scoring system. It turns out it is also a psychiatric risk predictor. The same five metrics that tell a security researcher "this attack is dangerous" tell a clinician "this patient needs screening for these specific conditions."

## Five Clusters, Not Sixteen Chapters

The DSM-5-TR has roughly 16 chapters relevant to BCI impact. Coloring a grid by 16 values violates Miller's Law (7±2 items in working memory). Nobody will remember what 16 colors mean.

Instead, we group into five **diagnostic clusters** that align with the NISS-DSM Bridge:

1. **Cognitive/Psychotic** (16 techniques) — perception, cognition, psychosis. Driven by CG.
2. **Mood/Trauma** (21 techniques) — emotion, consent, autonomy. Driven by CV.
3. **Motor/Neurocognitive** (16 techniques) — movement, tissue, structural. Driven by BI.
4. **Persistent/Personality** (7 techniques) — lasting neural change. Driven by NP/RV.
5. **Non-Diagnostic** (39 techniques) — silicon-only, no neural pathway.

These clusters are neurobiologically driven, not symptom-driven. They align with NIMH's Research Domain Criteria (RDoC) approach: start from neural mechanisms, derive diagnostic categories. Traditional psychiatry asks "which brain regions are involved in depression?" We ask "if you disrupt the amygdala, which diagnoses emerge?"

## The Hourglass Proves Itself Again

The 11-band hourglass model was designed as a security architecture. Each band represents a layer of the BCI stack, from neocortex (N7) through the electrode-tissue interface (I0) to silicon (S1-S3).

What we discovered: each band naturally corresponds to specific brain structures, which naturally correspond to specific diagnoses. N6 (Limbic System) maps to hippocampus, amygdala, and insula — which map to depression, anxiety, PTSD, and dissociative disorders. N5 (Basal Ganglia) maps to striatum and substantia nigra — which map to ADHD, addiction, OCD, and tic disorders. The architecture predicted the clinical mapping.

This is the value of a well-designed taxonomy. It reveals relationships you did not design into it.

## What This Means

**For clinicians:** Every TARA technique now carries DSM-5-TR diagnostic codes. When a patient presents after a BCI security incident, the clinician can look up the technique, see the mapped diagnoses, and screen accordingly. The neural pathway chain explains *why* those diagnoses are relevant.

**For regulators:** ICD-10-CM codes make this framework directly usable for regulatory submissions, adverse event reporting, and insurance documentation. "This device has 12 techniques with direct risk for F32 (Major Depressive Disorder)" is a sentence a regulator can act on.

**For security researchers:** NISS scores are now clinically interpretable. The abstract severity numbers map to specific psychiatric risks. This gives security findings clinical weight.

**For the field:** This is, to our knowledge, the first formal mapping between BCI attack techniques and psychiatric diagnoses via neural mechanism chains. We welcome challenges.

## Try It

The [TARA Registrar](https://qinnovate.com/TARA) now has four projection tabs:

- **Modality** — Impact severity and physical mechanism (toggle between the two)
- **Clinical** — Therapeutic applications and FDA status
- **Diagnostic** — DSM-5-TR clusters and ICD-10-CM codes
- **Governance** — Consent tiers and regulations

Click *Diagnostic*. The grid recolors by diagnostic cluster. Click any cell. The drawer shows primary and secondary diagnoses, confidence levels, the neural pathway chain, and the NISS-to-DSM correlation.

Every technique that can harm a patient can also heal one. Now we know *which* patients, and *which* conditions.

---

*The Neural Impact Chain is documented in [QIF Derivation Log, Entry 53](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-DERIVATION-LOG.md). The NISS-DSM Bridge and diagnostic cluster methodology are detailed in the [TARA specification](https://github.com/qinnovates/qinnovate/blob/main/shared/qtara-registrar.json). All AI contributions are disclosed in the [AI Transparency Log](https://github.com/qinnovates/qinnovate/blob/main/governance/TRANSPARENCY.md).*

> **AI Transparency Statement:** This work was authored by Kevin L. Qi with AI assistance from Claude (Anthropic) and Gemini (Google). The Neural Impact Chain concept, clinical mappings, and NISS-DSM bridge were developed by the author. AI tools assisted with literature review, code generation, and cross-referencing large datasets. All clinical outputs were verified against the DSM-5-TR and peer-reviewed neuroscience literature. A full audit log is available [here](https://github.com/qinnovates/qinnovate/blob/main/governance/TRANSPARENCY.md).
