# How BCIs Enable Mouse/Keyboard Movement

> **Research Document** | **Status:** Active Research
> **Author:** Kevin Qi
> **Last Updated:** 2026-01-26
> **Related:** [bci-macro-to-micro-visualization](../../project/KANBAN.md) backlog item

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Motor Cortex: Where It All Happens](#the-motor-cortex-where-it-all-happens)
3. [Electrode Specifications Across BCIs](#electrode-specifications-across-bcis)
4. [How Neural Decoding Works](#how-neural-decoding-works)
5. [Current Limitations](#current-limitations)
6. [Open Questions](#open-questions)
7. [Sources](#sources)

---

## Executive Summary

Brain-computer interfaces (BCIs) enable cursor/keyboard control by:
1. **Recording** neural activity from the motor cortex via implanted electrodes
2. **Decoding** movement intentions using machine learning algorithms
3. **Translating** decoded signals into cursor movements or keystrokes

The motor cortex contains neurons that fire in specific patterns when a person **intends** to move—even if they're paralyzed and cannot physically execute the movement. BCIs exploit this by recording these intention signals and translating them into computer commands.

---

## The Motor Cortex: Where It All Happens

### Location

The **primary motor cortex (M1)** is located in the **precentral gyrus** of the frontal lobe, just anterior to the central sulcus. This is where BCIs place their electrodes.

```
┌─────────────────────────────────────────────────────────────┐
│                      BRAIN (Lateral View)                    │
│                                                              │
│     Frontal Lobe          │  Parietal Lobe                  │
│                           │                                  │
│   ┌─────────────────┐     │                                  │
│   │  MOTOR CORTEX   │◄────┼── Electrodes placed here        │
│   │  (Precentral    │     │                                  │
│   │   Gyrus)        │     │                                  │
│   └─────────────────┘     │                                  │
│           ↑               │                                  │
│     Central Sulcus        │                                  │
│                                                              │
│     Temporal Lobe         │  Occipital Lobe                 │
└─────────────────────────────────────────────────────────────┘
```

### Depth of Implantation

| BCI System | Electrode Depth | Target Layer |
|------------|-----------------|--------------|
| **Neuralink N1** | Up to 6mm | Cortical layers (L5 primarily) |
| **Utah Array (Blackrock)** | 1.0-1.5mm | Superficial cortical layers |
| **Synchron Stentrode** | 0mm (endovascular) | Records through blood vessel wall |

**Why these depths?**
- The cerebral cortex is approximately **2-4mm thick**
- Layer 5 pyramidal neurons (at ~1-2mm depth) are the primary source of motor output signals
- Neuralink's threads can reach up to 6mm to access deeper structures if needed, though typical cortical recordings stay within 1-3mm

### Motor Homunculus

The motor cortex is organized **somatotopically**—different body parts are controlled by different regions:

```
┌────────────────────────────────────────────────────────┐
│            MOTOR CORTEX (Medial to Lateral)            │
│                                                        │
│   Medial ←─────────────────────────────────→ Lateral   │
│                                                        │
│   [Leg] [Trunk] [Arm] [Hand/Fingers] [Face] [Tongue]  │
│     ↑                    ↑                             │
│     │                    └── BCI target for cursor     │
│     └── BCI target for walking                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

For **cursor control**, electrodes target the **hand/arm region** of the motor cortex, located on the lateral surface of the precentral gyrus.

---

## Electrode Specifications Across BCIs

### Comparison Table

| Company | Device | Electrodes | Threads/Arrays | Insertion Method | FDA Status |
|---------|--------|------------|----------------|------------------|------------|
| **Neuralink** | N1 Implant | 1,024 | 64 threads | Robotic surgical insertion | Clinical trials (2024) |
| **Blackrock Neurotech** | Utah Array | 96-100 per array | Bed-of-nails array | Pneumatic insertion | FDA approved for research |
| **Synchron** | Stentrode | 16 | Stent-mounted | Catheter via jugular vein | Clinical trials |
| **Paradromics** | Connexus | 421 | Single implant | Surgical | Breakthrough device designation |
| **Precision Neuroscience** | Layer 7 | 1,024 | Flexible film | Minimally invasive | Clinical trials |

### Neuralink N1 Specifications

- **Electrode count:** 1,024 electrodes across 64 threads
- **Thread diameter:** 4-6 micrometers (thinner than human hair)
- **Thread length:** Up to 10mm into cortex
- **Electrode proximity:** <60 microns from target neurons
- **Device size:** 23mm diameter × 8mm thick (coin-sized)
- **Insertion:** Custom robotic surgeon (R1) avoids blood vessels
- **Wireless:** Bluetooth-based data transmission
- **Battery:** Wireless charging (inductive)

### Blackrock Utah Array Specifications

- **Electrode count:** 96-100 per array (multiple arrays can be implanted)
- **Array size:** 4mm × 4mm grid
- **Electrode spacing:** 400 micrometers apart
- **Electrode length:** 1.0-1.5mm
- **Material:** Silicon with platinum tips
- **Known limitation:** Can cause scarring over time due to rigid design

### Synchron Stentrode Specifications

- **Electrode count:** 16 electrodes
- **Placement:** Inside blood vessel adjacent to motor cortex
- **Insertion:** Non-surgical (catheter through jugular vein)
- **Advantage:** No open brain surgery required
- **Limitation:** Lower resolution (records through vessel wall)

---

## How Neural Decoding Works

### The Signal Chain

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   INTENT    │───▶│   NEURONS    │───▶│  ELECTRODES │───▶│   DECODER    │
│  "Move up"  │    │  Fire spikes │    │  Record LFP │    │  ML algorithm│
└─────────────┘    └──────────────┘    │  + spikes   │    └──────┬───────┘
                                       └─────────────┘           │
                                                                 ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   CURSOR    │◀───│   COMPUTER   │◀───│   OUTPUT    │◀───│   VELOCITY   │
│   MOVES     │    │   Interface  │    │   X, Y      │    │   VECTOR     │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### Signal Types Recorded

| Signal Type | Frequency | What It Captures | Use in BCIs |
|-------------|-----------|------------------|-------------|
| **Spikes (Action Potentials)** | ~1ms events | Individual neuron firing | High-resolution decoding |
| **Local Field Potential (LFP)** | <250 Hz | Population neural activity | More stable over time |
| **Multi-Unit Activity (MUA)** | ~300-3000 Hz | Combined nearby neuron firing | Balance of resolution/stability |

### Decoding Algorithms

**Population Vector Algorithm (Classic)**
- Each neuron has a "preferred direction" of movement
- Combine all neurons' activity weighted by their preferred directions
- Result: A velocity vector indicating intended movement direction

**Kalman Filter (Common)**
- Predicts continuous cursor velocity in real-time
- Handles noise and uncertainty in neural recordings
- Updates predictions as new neural data arrives

**Recurrent Neural Networks (Modern)**
- Learn complex patterns in neural activity
- Can decode handwriting, speech, and complex gestures
- Willett et al. (2021) achieved 90 characters/minute handwriting decoding

### What the User Experiences

1. User **imagines** or **attempts** to move their arm/hand
2. Motor cortex neurons fire in characteristic patterns
3. BCI records these patterns in real-time (~20ms latency)
4. Decoder translates patterns into cursor X,Y velocity
5. Cursor moves on screen
6. User sees cursor move, adjusts mental "effort" (visual feedback loop)

**Key insight:** The user doesn't need to "think" in a special way. They simply imagine or attempt natural movements, and the system learns to decode their unique neural patterns during a calibration phase.

---

## Current Limitations

### CRITICAL: BCIs Cannot Stimulate Neurotransmitters

**VERIFIED:** Current BCI technology uses **electrical stimulation**, not **chemical/neurotransmitter manipulation**.

| What BCIs CAN Do | What BCIs CANNOT Do |
|------------------|---------------------|
| Record action potentials (electrical) | Release specific neurotransmitters |
| Electrically stimulate neurons | Inject dopamine, serotonin, etc. |
| Decode movement intentions | Read specific thoughts/memories |
| Provide sensory feedback via electrical stim | Provide natural-feeling sensations |

**Why?**
- Electrodes interact at the **macro electrical level** (microvolts/millivolts)
- Neurotransmitters operate at the **molecular level** (nanometer scale)
- Current electrodes are ~4-6 micrometers wide; synaptic clefts are ~20 nanometers
- To manipulate neurotransmitters would require molecular-scale tools (optogenetics, chemogenetics, or nanotech)

### Other Technical Limitations

| Limitation | Description | Impact |
|------------|-------------|--------|
| **Signal degradation** | Scar tissue forms around electrodes over months/years | Reduced signal quality, need recalibration |
| **Limited bandwidth** | ~1,000-3,000 neurons recorded vs. billions in brain | Coarse movement control only |
| **Calibration drift** | Neural patterns change over time | Requires periodic recalibration |
| **Battery/Power** | Implants need wireless charging | User compliance required |
| **Surgical risk** | Open brain surgery (except Synchron) | Infection, bleeding, tissue damage |

---

## Open Questions

> Questions to ask researchers and professionals

### Technical Questions

1. **Signal longevity:** What determines the 5-10 year lifespan of Utah arrays? Can thread-based electrodes (Neuralink) last longer?

2. **Biocompatibility:** What immune response patterns emerge around different electrode materials? How does this affect chronic recordings?

3. **Decoding limits:** Is there a theoretical maximum bits/second that can be decoded from motor cortex? Are we approaching it?

4. **Multi-area recording:** Would recording from both motor AND parietal cortex improve decoding? What's the tradeoff?

### Neuroscience Questions

5. **Plasticity:** How does the brain adapt to BCI use over years? Do new neural representations emerge?

6. **Distributed representation:** Recent studies show the whole body is represented distributedly along precentral gyrus. How does this affect electrode placement strategies?

7. **Speech motor cortex:** Can speech motor areas (ventral motor cortex) also control cursor? (Early evidence suggests yes—see Willett et al. 2024)

### Future Technology Questions

8. **Resolution gap:** How do we bridge the gap from ~1,000 electrodes to millions of neurons?

9. **Bidirectional interfaces:** Current BCIs are mostly recording-focused. What's needed for true sensory feedback?

10. **Non-invasive alternatives:** Can EEG-based BCIs ever approach intracortical resolution?

---

## Sources

### Primary Sources (Peer-Reviewed)

1. Willett, F.R., et al. (2021). High-performance brain-to-text communication via handwriting. *Nature*, 593, 249-254. https://doi.org/10.1038/s41586-021-03506-2

2. Willett, F.R., et al. (2024). Speech motor cortex enables BCI cursor control and click. *bioRxiv*. https://www.biorxiv.org/content/10.1101/2024.11.12.623096v1

3. Chen, X., et al. (2025). Brain-computer interfaces in 2023-2024. *Brain-X*. https://onlinelibrary.wiley.com/doi/full/10.1002/brx2.70024

4. PMC (2023). Neural Decoding for Intracortical Brain-Computer Interfaces. *Cyborg and Bionic Systems*. https://pmc.ncbi.nlm.nih.gov/articles/PMC10380541/

5. PMC (2024). Brain-computer interfaces: the innovative key to unlocking neurological conditions. https://pmc.ncbi.nlm.nih.gov/articles/PMC11392146/

### Company/Technical Sources

6. Neuralink (2024). PRIME Study Brochure. https://neuralink.com/pdfs/PRIME-Study-Brochure.pdf

7. Musk, E., & Neuralink (2019). An integrated brain-machine interface platform with thousands of channels. *Journal of Medical Internet Research*, 21(10). https://pmc.ncbi.nlm.nih.gov/articles/PMC6914248/

8. IEEE Spectrum (2024). The Brain-Implant Company Going for Neuralink's Jugular [Synchron]. https://spectrum.ieee.org/synchron-bci

### News/Overview Sources

9. MIT Technology Review (2025). Brain-computer interfaces face a critical test. https://www.technologyreview.com/2025/04/01/1114009/brain-computer-interfaces-10-breakthrough-technologies-2025/

10. NPR (2025). Brain computer interfaces are poised to help people with disabilities. https://www.npr.org/sections/shots-health-news/2025/06/30/nx-s1-5339708/brain-computer-interface-implants-disabilities-neuralink

11. Andersen Lab (2025). BCIs in 2025: Trials, Progress, and Challenges. https://andersenlab.com/blueprint/bci-challenges-and-opportunities

---

## Related Resources

### Visualization Project

- **[BCI-to-Neuron Zoom Rendering](../../../docs/visualizations/pending/bci-to-neuron-zoom-rendering/README.md)** — Blender animation project for macro-to-micro visualization

### For Visualization Project

- **brain2print:** AI tool to convert MRI → 3D brain models
  - Paper: https://www.nature.com/articles/s41598-025-00014-5
  - Demo: https://brain2print.org
  - GitHub: https://github.com/niivue/brain2print

- **Free Brain STL:** https://www.cgtrader.com/free-3d-models/character/human-anatomy/brain-59cffe18-e669-4dae-a588-1f82cee6fd45

- **Molecular Nodes (Blender):** For rendering neurotransmitters and receptors
  - Dopamine D2 receptor PDB: 6CM4
  - Can fetch structures from RCSB Protein Data Bank

### Brain Region Research Folders

See: `./cerebral-cortex/motor-cortex/` for motor cortex specific research

---

*Document Version: 1.0*
*Next Review: After additional researcher interviews*
