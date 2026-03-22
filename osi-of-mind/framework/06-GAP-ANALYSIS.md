# 🔍 06 — Gap Analysis: What BCIs Can't Do

> Two categories that look similar but are fundamentally different:
> 🧱 **Known limits** (proven walls) vs. ❓ **Unknown limits** (open questions).

---

## 📊 Visual Summary

```
PROVEN CAPABILITIES          PROVEN LIMITS             OPEN QUESTIONS
(we can do this)             (we know we can't)        (we don't know yet)

✅ Read motor intent         ✗ Read specific thoughts   ? Decode imagined speech
✅ Read speech intent        ✗ Write neurotransmitters  ? Read emotions accurately
✅ Detect seizures           ✗ Block specific receptors ? Induce specific memories
✅ Suppress tremor           ✗ Reach deep brain w/o     ? Modify plasticity
✅ Restore hearing              surgery                    intentionally
✅ Artificial touch          ✗ Intercept spinal reflex  ? Restore memory in
✅ Suppress pain             ✗ Prevent autonomic           Alzheimer's
✅ Closed-loop seizure          responses                ? Brain-to-brain
   suppression              ✗ Distinguish natural vs      communication
                               artificial spikes        ? Enhance normal cognition
                            ✗ Stimulate without         ? Erase specific memories
                               tissue damage over time  ? Match invasive with
                            ✗ Operate at molecular         non-invasive
                               timescale
```

---

## 🧱 Part 1: Known Limits (Proven Walls)

Things we KNOW BCIs cannot do, and we understand WHY.

```
┌────────────────────────────────┬──────────────────────────────────────────────┐
│ LIMITATION                     │ WHY (Physics / Biology)                      │
├────────────────────────────────┼──────────────────────────────────────────────┤
│                                │                                              │
│ Can't read individual          │ Electrode spacing ~400μm (Utah array).       │
│ neuron types selectively       │ Each electrode picks up ~100+ neurons.       │
│                                │ Can't tell which cell type fired.            │
│                                │                                              │
├────────────────────────────────┼──────────────────────────────────────────────┤
│                                │                                              │
│ Can't write specific           │ Electrical stimulation is non-selective.     │
│ neurotransmitters              │ Current triggers ALL nearby neurons.         │
│                                │ Can't choose dopamine vs serotonin vs GABA. │
│                                │ Would require pharmacology, not electricity. │
│                                │                                              │
├────────────────────────────────┼──────────────────────────────────────────────┤
│                                │                                              │
│ Can't block specific           │ Receptor selectivity is molecular (nm).      │
│ receptors                      │ Electrodes operate at μm scale.              │
│                                │ 1000x too coarse. Needs drugs, not current.  │
│                                │                                              │
├────────────────────────────────┼──────────────────────────────────────────────┤
│                                │                                              │
│ Can't reach deep brain         │ EEG reads ~1cm deep, smeared by skull.       │
│ without surgery                │ EM fields attenuate with distance.           │
│                                │ Skull is a low-pass filter.                  │
│                                │                                              │
├────────────────────────────────┼──────────────────────────────────────────────┤
│                                │                                              │
│ Can't sample faster            │ ADC limits + electrode impedance.            │
│ than ~30kHz                    │ Thermal noise floor at small electrode       │
│                                │ sizes makes faster sampling useless.         │
│                                │                                              │
├────────────────────────────────┼──────────────────────────────────────────────┤
│                                │                                              │
│ Can't stimulate without        │ Charge injection causes pH changes,          │
│ tissue damage over time        │ gas formation, electrode dissolution.        │
│                                │ Shannon limit: <30 μC/cm²/phase.            │
│                                │ Chronic use = chronic damage (minor).        │
│                                │                                              │
├────────────────────────────────┼──────────────────────────────────────────────┤
│                                │                                              │
│ Can't distinguish natural      │ A natural spike and a stimulation-evoked     │
│ vs artificial spikes           │ spike are electrically identical.             │
│                                │ The waveform is the same. No signature.      │
│                                │                                              │
├────────────────────────────────┼──────────────────────────────────────────────┤
│                                │                                              │
│ Can't intercept                │ Reflex completes in ~25-50ms.                │
│ spinal reflexes                │ Signal never reaches cortex.                 │
│                                │ BCI sits above the reflex arc.               │
│                                │ Firewall can't block what it can't see.      │
│                                │                                              │
├────────────────────────────────┼──────────────────────────────────────────────┤
│                                │                                              │
│ Can't prevent autonomic        │ Heart rate, breathing, temperature are       │
│ responses                      │ hardwired brainstem/hypothalamic loops.      │
│                                │ They operate independently of cortex.        │
│                                │ Even under general anesthesia, they run.     │
│                                │                                              │
├────────────────────────────────┼──────────────────────────────────────────────┤
│                                │                                              │
│ Can't operate at               │ Ion channel gating: μs-ns.                   │
│ molecular timescale            │ Vesicle fusion: μs.                          │
│                                │ Best BCI pulse: ~50μs minimum.               │
│                                │ We're 1000x too slow for molecular events.   │
│                                │                                              │
└────────────────────────────────┴──────────────────────────────────────────────┘
```

### 🔬 Visualized by Scale

```
WHAT BCI CAN REACH vs WHAT IT NEEDS TO REACH

Scale        Can BCI access?     What lives here
─────────────────────────────────────────────────────────────
nm (10⁻⁹)    ❌ NO              Receptors, ion channels, NT binding
μm (10⁻⁶)    ⚠️ INDIRECT       Single synapses, vesicle release
10μm         ✅ YES (invasive)  Individual neurons (single-unit recording)
100μm        ✅ YES             Local populations (~100 neurons)
mm           ✅ YES             Cortical columns, local field potentials
cm           ✅ YES (ECoG)      Brain regions (surface only)
10cm         🔶 CRUDE (EEG)     Distributed networks (smeared)

BCI lives in the mm-cm range. The molecular world (nm) is unreachable.
The gap between what we can stimulate and what actually does the work
is 6 orders of magnitude.
```

---

## ❓ Part 2: Unknown Limits (Open Questions)

Things we DON'T KNOW if BCIs can do. Active research, no consensus.

```
┌────────────────────────────────┬──────────────────────┬──────────────────────────────────┐
│ OPEN QUESTION                  │ CURRENT STATE        │ WHY UNKNOWN                      │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Decode imagined speech?        │ Very limited vocab   │ Don't understand how language    │
│                                │ (Stanford, Meta)     │ forms before motor output.       │
│                                │                      │ Pre-motor speech representation  │
│                                │                      │ is poorly mapped.                │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Read emotions accurately?      │ Crude arousal/valence│ Emotional circuits are           │
│                                │ only, not specific   │ distributed and overlapping.     │
│                                │ emotions             │ Fear and excitement look similar │
│                                │                      │ electrically.                    │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Induce specific memories?      │ Can trigger hippocam-│ Memory encoding is distributed.  │
│                                │ pal activity, not a  │ Pattern is unique per person.    │
│                                │ specific memory      │ We'd need to know YOUR encoding. │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Modify plasticity              │ STDP protocols exist │ Outcome depends on molecular     │
│ intentionally?                 │ but outcomes are     │ state (receptor density, NT      │
│                                │ unpredictable        │ levels) that BCI can't measure.  │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Read dreams?                   │ Very crude visual    │ Sleep signals are noisy.         │
│                                │ decoding (fMRI only, │ Interpretation models are        │
│                                │ not real-time BCI)   │ primitive. fMRI ≠ BCI.           │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Treat addiction?               │ DBS trials for       │ Reward circuitry is complex.     │
│                                │ OCD/addiction show   │ Individual variation is huge.    │
│                                │ promise, not proven  │ Risk of hedonic side effects.    │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Restore memory                 │ Hippocampal          │ Encoding scheme is person-       │
│ in Alzheimer's?                │ prosthesis prototype │ specific and degrades with       │
│                                │ (Berger/USC)         │ disease. Target is moving.       │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Brain-to-brain                 │ Extremely crude      │ Can't encode complex thoughts    │
│ communication?                 │ (binary yes/no       │ into stimulation patterns.       │
│                                │ between 2 people)    │ No shared "protocol" exists.     │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Read intent before             │ Readiness potential   │ Exists ~500ms before conscious   │
│ conscious awareness?           │ is real (Libet 1983) │ decision. Philosophical mine-    │
│                                │                      │ field: do we WANT this?          │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Enhance normal                 │ No proven enhance-   │ Baseline already optimized by    │
│ cognition?                     │ ment in healthy      │ evolution. Stimulation in a      │
│                                │ subjects             │ healthy brain adds noise.        │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Selectively erase              │ No                   │ Don't know how specific memories │
│ a memory?                      │                      │ are stored at circuit level.     │
│                                │                      │ Reconsolidation disruption is    │
│                                │                      │ crude and unreliable.            │
│                                │                      │                                  │
├────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│                                │                      │                                  │
│ Non-invasive match             │ Gap closing but      │ Skull fundamentally attenuates   │
│ invasive performance?          │ still 10-100x worse  │ and smears signal. Physics       │
│                                │                      │ problem, not engineering.         │
│                                │                      │                                  │
└────────────────────────────────┴──────────────────────┴──────────────────────────────────┘
```

---

## 🗺️ Part 3: The Gap Map

```
WHAT BCI CAN DO vs. WHAT THE BRAIN DOES

                    BCI Capability ───────────►
                    Low                                      High
             ┌──────────────────────────────────────────────────────┐
     High    │                                                      │
             │  ❌ CONSCIOUSNESS    ❌ MEMORY ERASURE                │
             │                                                      │
             │  ❌ ABSTRACT THOUGHT  ❓ DREAM READING                │
     Brain   │                                                      │
     Complex-│  ❓ EMOTION READING   ❓ ADDICTION TREATMENT           │
     ity     │                                                      │
             │  ❓ IMAGINED SPEECH   ❓ PLASTICITY CONTROL            │
       │     │                                                      │
       │     │  🔶 MOOD TRACKING    ✅ SEIZURE DETECTION             │
       │     │                                                      │
       ▼     │  ✅ SLEEP STAGING    ✅ MOTOR DECODE                  │
     Low     │                                                      │
             │  ✅ REFLEX MONITOR   ✅ COCHLEAR IMPLANT              │
             │                                                      │
             └──────────────────────────────────────────────────────┘

             Bottom-left: simple + capable = SOLVED
             Top-left: complex + incapable = IMPOSSIBLE (for now)
             Diagonal: the frontier of research
```

---

## 🔭 Part 4: The 6-Order-of-Magnitude Problem

```
THE FUNDAMENTAL GAP IN BCI

What BCI operates at:     mm — cm        (10⁻³ to 10⁻² m)
What the brain runs on:   nm — μm        (10⁻⁹ to 10⁻⁶ m)

                                Gap: 10⁶ (one million times)

Imagine trying to understand a city by listening from a helicopter.
You can hear the overall noise level change.
You can tell which neighborhood is louder.
You cannot hear a single conversation.

That's what a BCI does to the brain.

┌─────────────────────────────────────────────────────────────────┐
│  nm        μm        100μm      mm        cm        10cm       │
│  │         │          │         │         │          │          │
│  ●─────────●──────────●─────────●─────────●──────────●          │
│  │         │          │         │         │          │          │
│  receptor  synapse   neuron  ◄──BCI──►  region    network      │
│  binding   vesicle   soma     ZONE     surface   (smeared)     │
│  │         release    │                                        │
│  │         │          │                                        │
│  └─ INVISIBLE TO BCI ─┘                                        │
│     (molecular world)                                          │
│                                                                │
│  Everything left of the BCI ZONE is a known unknown.           │
│  We know it matters. We know we can't see it.                  │
│  The model must account for this blind spot.                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 What This Means for Framework v2

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  1. The model MUST distinguish:                                │
│     - What we can measure  (BCI zone: mm-cm)                   │
│     - What we can infer    (from population signals)           │
│     - What we know exists but can't see (molecular)            │
│     - What we don't know   (open questions)                    │
│                                                                │
│  2. Security claims MUST be scoped:                            │
│     - "We can secure signal X" only if X is in the BCI zone   │
│     - "We can detect anomaly Y" if Y has a population-level   │
│       signature                                                │
│     - "We cannot protect against Z" if Z is molecular or      │
│       below the reflex arc                                     │
│                                                                │
│  3. The funnel rings map to these categories:                  │
│     - Center (reflex): fully in BCI zone, fully securable      │
│     - Ring 2-3 (subcortical): partially in zone, detectable    │
│     - Ring 4+ (cortical): in zone but processing = unknown     │
│     - Molecular: OUTSIDE the zone entirely                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

