# The Visual System: From Photon to Perception

How the brain sees -- and what it means for brain-computer interfaces.

> "You can think of that as like the API of the brain." -- Max Hodak, Science Corp (March 2026)

## Why This Matters for BCI

The visual system is the best-understood sensory pipeline in neuroscience and the most advanced target for BCI prosthetics. Understanding how it works -- layer by layer -- teaches you how biological signal processing actually happens, and where BCIs can (and do) interface with it.

Every layer maps to a computing equivalent. Every layer is also a potential attack surface.

---

## The Pipeline: End to End

Light enters the eye and passes through a layered signal processing chain before becoming "seeing":

```
Cornea/Lens (optics)
  --> Retina (transduction + preprocessing)
    --> Optic Nerve (~1.2M axons, ~10 Mbps)
      --> Optic Chiasm (partial crossing: nasal fibers cross, temporal stay)
        --> LGN in Thalamus (relay + attention gating)
          --> V1 Primary Visual Cortex (feature detection)
            --> Higher Areas: V2, V4, MT/V5, IT cortex (abstraction)
```

A parallel pathway diverges at the optic chiasm to the **superior colliculus** (midbrain), driving reflexive eye movements and enabling **blindsight** -- motion perception without conscious awareness, even when V1 is destroyed.

---

## The Retina: A Computer Inside Your Eye

The retina is not a camera sensor. It is a 0.5mm thick preprocessing computer with 10 distinct layers that performs edge detection, contrast enhancement, motion filtering, and 100:1 data compression before any signal reaches the brain.

### Photoreceptors: The Sensors

| Type | Count | Function | Peak Sensitivity |
|------|-------|----------|-----------------|
| **Rods** | ~92-120 million | Low-light, peripheral, achromatic | 498 nm (blue-green) |
| **Cones (L)** | ~6-7M total | Color, fine detail (red) | 564 nm |
| **Cones (M)** | | Color, fine detail (green) | 534 nm |
| **Cones (S)** | | Color, fine detail (blue) | 420 nm |

The fovea (center of gaze, ~2 degrees of visual angle) has **zero rods** and the highest cone density in the human body (~199,000/mm^2). This is the only part of your retina that can read text or recognize faces. Everything else is peripheral -- motion-sensitive but low-resolution.

**The blind spot:** ~15 degrees nasal to the fovea, where the optic nerve exits. No photoreceptors. Your brain fills it in using surrounding context. You never notice.

### The Processing Layers

**Horizontal cells** implement **lateral inhibition** -- they suppress neighboring signals to sharpen contrast. This is the biological equivalent of an unsharp mask filter.

**Bipolar cells** (~10 million) split into ON-center and OFF-center types:
- ON-center: fire when light hits the center of their receptive field
- OFF-center: fire when light hits the surround

This ON/OFF split is the first example of edge detection in the biological pipeline. It is preserved all the way through the LGN to V1. In computing terms: splitting the signal into excitatory and suppressive channels, like a rectified linear unit (ReLU) with positive and negative branches.

**Amacrine cells** (~30 types) handle temporal filtering -- motion detection, direction selectivity, and adaptation. Starburst amacrine cells drive direction-selective responses. These are the biological equivalent of temporal difference operators.

### Retinal Ganglion Cells: The Output Bottleneck

This is where the 100:1 compression happens:

**~130M photoreceptors --> ~10M bipolar cells --> ~1.2M retinal ganglion cells**

Every piece of visual information leaving your eye must pass through this bottleneck. The RGCs are the optic nerve.

| RGC Type | Pathway | % of RGCs | What It Detects | Computing Analogy |
|----------|---------|-----------|-----------------|-------------------|
| **Midget (P cells)** | Parvocellular | ~70-80% | Color, fine detail, sustained | High-res detail channel |
| **Parasol (M cells)** | Magnocellular | ~10% | Motion, luminance, transient | Motion/change detector |
| **Bistratified (K cells)** | Koniocellular | ~8-10% | Blue-yellow contrast | Color contrast channel |
| **ipRGC** | Retino-hypothalamic | ~1-2% | Ambient light (melanopsin) | Always-on light sensor (circadian) |
| **Direction-selective** | Superior colliculus | ~3-5% | Motion direction | Optical flow detector |

These channels stay segregated through the LGN all the way to V1. The visual system runs parallel processing pipelines from the retina onward.

### Why This Matters for Prosthetics

**Second Sight's Argus II** stimulated ganglion cells (downstream of compression) and got garbled output. **Science Corp's PRIMA** stimulates bipolar cells (upstream of compression) and restored form vision. The layer you write to determines the quality of the output.

This is Hodak's "API of the brain" insight: if you can characterize the signal representations at each layer, you can write to them. But you have to write in the format that layer expects.

---

## The Optic Nerve: The Data Bus

~1.2 million RGC axons bundle into the optic nerve. Bandwidth: approximately **10 Mbps** functional (up to ~120 Mbps theoretical).

For context: an uncompressed 1080p video stream runs at ~1.5 Gbps. The retina's 10 Mbps output is remarkably compressed -- the preprocessing (center-surround, ON/OFF channels, motion filtering, adaptation) makes this possible.

Axon diameter varies by type: magnocellular (parasol) axons are thicker for faster conduction; parvocellular (midget) axons are thinner. Same speed/bandwidth tradeoff as in network architecture.

> The optic nerve is a cranial nerve (CN II), not a spinal nerve. In QIF terms, it does not map to N1 (spinal cord) -- it interfaces between N4 (thalamus/LGN) and N2 (brainstem/superior colliculus). This is an honest gap in the current QIF band taxonomy for cranial nerves.

---

## The LGN: The Router with Attention Gating

The Lateral Geniculate Nucleus is a paired thalamic relay with 6 layers:

| Layers | Cell Type | Input From | Processes |
|--------|-----------|------------|-----------|
| 1-2 (ventral) | Magnocellular | Parasol RGCs | Motion, luminance |
| 3-6 (dorsal) | Parvocellular | Midget RGCs | Color, fine detail |
| Interlaminar | Koniocellular | Bistratified RGCs | Color contrast |

**The counterintuitive fact:** Only ~5% of LGN input comes from the retina. The other ~95% is feedback from V1 (cortex), the thalamic reticular nucleus (TRN), and subcortical structures.

This reframes the LGN: it is not a passive relay. It is a **programmable switch with policy rules from higher layers**. Attention research (O'Connor et al., 2002) confirmed that attention modulates LGN responses in humans -- attended stimuli get enhanced, ignored stimuli get suppressed, and baseline activity increases even without visual input.

The TRN provides recurrent inhibition: a biological firewall that can gate or suppress visual signals before they reach cortex. In QIF terms, the LGN sits at **N4 (Diencephalon)** -- the brain's natural access-control checkpoint.

> "The thalamus processes roughly 11 million bits of sensory information per second but only passes about 50 bits to conscious awareness." -- QIF Neuroanatomy, Band N4

---

## V1: First-Stage Feature Detection

Primary visual cortex (V1, striate cortex, Brodmann area 17) sits in the calcarine sulcus of the occipital lobe. It is the most studied piece of cortex in neuroscience.

**Cortical magnification:** The fovea occupies ~1% of the visual field but drives ~50% of V1 neurons. This is why reading requires foveal fixation.

### Hubel & Wiesel's Discovery (Nobel Prize 1981)

- **Simple cells** (Layer 4): respond to oriented bars/edges at specific locations. These are the first neurons in the brain that detect oriented structure -- not just "light vs. dark" but "edge at 45 degrees."
- **Complex cells** (Layers 2, 3, 5): also orientation-selective but position-invariant. Built by pooling simple cell responses.

In computing terms: V1 simple cells are **the first convolutional layer** -- a bank of orientation-tuned Gabor filters. Complex cells are a **pooling layer** that achieves spatial invariance.

V1 is organized into **hypercolumns** (~1mm^2 patches) containing a complete set of orientation detectors and ON/OFF preferences for each point in visual space.

---

## Higher Visual Areas: Two Streams

After V1, information splits into two processing streams (Ungerleider & Mishkin, 1982):

### Ventral Stream: "What" Pathway
**V1 --> V2 --> V4 --> IT cortex (temporal lobe)**

Processes object identity, color, form, faces.

- **V4:** Color and complex shape. Damage causes **cerebral achromatopsia** (loss of color perception while retaining form vision).
- **Inferotemporal (IT) cortex:** The top of the object recognition hierarchy. Neurons here respond to complex objects and faces, invariant to position, size, and viewpoint. Face-selective patches use axis-based population coding -- each face is a vector in a high-dimensional space. This is the biological equivalent of a **face-embedding layer in a deep CNN**.

### Dorsal Stream: "Where/How" Pathway
**V1 --> V2 --> V3 --> MT/V5 --> Posterior Parietal Cortex**

Processes motion, spatial location, action guidance.

- **MT/V5:** 90% of neurons are direction-selective. Damage causes **akinetopsia** (inability to perceive motion -- the world appears as a series of freeze-frames). MT receives direct input from the superior colliculus, bypassing V1 -- this is why motion perception survives V1 lesions (blindsight).
- **PPC:** Integrates vision with motor planning for reaching, grasping, eye movements. The coordinate transform from "I see it" to "I reach for it."

---

## The Full Computer Analogy

| Biology | Computing Equivalent | Why It Maps |
|---------|---------------------|-------------|
| Cornea + Lens | Camera optics | Physical focusing |
| Photoreceptors | Image sensor pixels (with spectral filters) | Photon-to-electrical transduction |
| Horizontal cells | Sharpening kernel (high-pass filter) | Lateral inhibition = contrast enhancement |
| Bipolar ON/OFF | ReLU with positive/negative branches | Edge detection via signal splitting |
| Amacrine cells | Temporal difference operators | Motion detection, adaptation |
| Retinal ganglion cells | Edge detector filters (Laplacian of Gaussian) | Center-surround = spatial derivative |
| Optic nerve | Serial data bus (~10 Mbps) | Fixed-bandwidth multiplexed channel |
| LGN | Router with attention-gating policy engine | 95% feedback = programmable switch |
| V1 simple cells | First conv layer (Gabor filter bank) | Oriented edge detection |
| V1 complex cells | Pooling layer | Spatial invariance |
| V2/V3 | Deeper conv layers | Texture, depth, border ownership |
| V4 | Color/shape integration layer | Complex conjunctions |
| MT/V5 | Optical flow estimator | Direction-selective motion vectors |
| IT cortex | Final classification + embedding | Object/face ID with viewpoint invariance |
| PPC | Robotics coordinate transform | Vision-to-action mapping |

**Where the analogy breaks:** Biological vision is recurrent (massive feedback at every stage), sparse (most neurons inactive for any given image), and plastic (weights change with experience). A feedforward CNN is the simplified version. The LGN -- where 95% of input is feedback from cortex -- is the clearest point where no CNN equivalent exists.

---

## Neuroplasticity: The Visual System Rewires

### Amblyopia (Lazy Eye)
During the critical period (ages 0-7), mismatched binocular input causes cortical columns for the deprived eye to shrink while the dominant eye's columns expand. The visual cortex literally rewires based on input statistics. Recent research shows adult recovery is possible through perceptual learning and binocular reconciliation.

### Cross-Modal Plasticity in Blindness
When visual input is lost early, the visual cortex is colonized by other senses. In early-blind individuals, the visual cortex activates during tactile tasks, auditory spatial processing, and Braille reading. The functional architecture (face areas, place areas) persists and responds to analogous categories from other senses.

### BrainPort: Sensory Substitution
The BrainPort device converts camera images into electrical patterns on the tongue. With training, blind users identify objects, read text, and navigate. fMRI confirms that the ventral visual cortex activates during BrainPort use -- even though input arrives via touch.

This is the closest real-world demonstration of Hodak's claim: write a signal in approximately the right format to a layer that can receive it, and the brain learns to interpret it.

---

## QIF Band Mapping

The visual system crosses multiple QIF bands:

| QIF Band | Structure | Visual Role | Threat Surface |
|----------|-----------|-------------|---------------|
| **N7** (Neocortex) | V1, V2, V4, MT/V5, IT | All cortical visual processing | Cortical prosthetic stimulation; SSVEP attacks; signal injection |
| **N4** (Diencephalon) | LGN (thalamus) | Relay + attention gating | Thalamic stimulation affects what the brain "sees" |
| **N2** (Brainstem) | Superior colliculus | Reflexive eye movements, blindsight | Subcortical visual route, pupil reflex control |
| **I0** (Interface) | Electrode-tissue boundary | Where prosthetic signal meets biology | Last point for amplitude validation before biology |

Note: The optic nerve (CN II) is a cranial nerve, not spinal. It does not map cleanly to N1 in the current QIF taxonomy. This gap is worth noting for future framework revisions.

---

## BCI Visual Prosthetics: State of the Field

| Device | Approach | Target Layer | Status |
|--------|----------|-------------|--------|
| **Argus II** (Second Sight) | Epiretinal stimulation | Ganglion cells (downstream) | Discontinued. Garbled output from writing to compressed channel |
| **PRIMA** (Science Corp) | Subretinal photovoltaic chip | Bipolar cells (upstream) | NEJM-published. 80% of patients showed meaningful vision improvement |
| **Orion** (Second Sight) | Cortical surface electrodes | V1 surface | 5-year feasibility trial. 60 electrodes = phosphene patterns |
| **BrainPort** | Tongue electrotactile display | Sensory substitution (not direct) | FDA cleared. Cross-modal plasticity drives adaptation |

The fundamental challenge: electrode count. PRIMA has thousands of microelectrodes stimulating bipolar cells. Orion has 60 electrodes on V1 surface, versus the millions of neurons needed for functional vision. Resolution is the bottleneck, and it is an engineering problem, not a physics problem.

---

## Key Numbers

| Fact | Figure |
|------|--------|
| Rods | ~92-120 million |
| Cones | ~6-7 million |
| Foveal cone density | ~199,000/mm^2 (highest in human body) |
| Retinal ganglion cells | ~1.2 million |
| Compression ratio | ~100:1 (photoreceptors to RGCs) |
| Optic nerve bandwidth | ~10 Mbps functional |
| Saccades | 3-4 per second |
| Full-field resolution equivalent | ~576 megapixels (requires saccades to build) |
| Single fixation resolution | ~5-15 megapixels |
| LGN retinal input fraction | ~5% (rest is feedback) |
| V1 foveal magnification | 1% of visual field = ~50% of V1 neurons |
| Cortex devoted to vision | ~30% of total cortical surface |
| MT direction-selective neurons | ~90% |

---

## Sources

- Curcio et al. (1990). "Human photoreceptor topography." *Journal of Comparative Neurology*. [PubMed](https://pubmed.ncbi.nlm.nih.gov/1427131/)
- O'Connor et al. (2002). "Attention modulates responses in the human LGN." *Nature Neuroscience*. [DOI](https://www.nature.com/articles/nn957)
- Born & Bradley (2005). "Structure and function of visual area MT." *Annual Review of Neuroscience*. [PDF](https://www.hms.harvard.edu/bss/neuro/bornlab/lab/papers/born-bradley-mt-arn2005.pdf)
- Penn Researchers (2006). "How much the eye tells the brain." [EurekAlert](https://www.eurekalert.org/news-releases/468943)
- PRIMA clinical results. *New England Journal of Medicine*. [Science Corp](https://science.xyz/news/new-england-journal-of-medicine-prima/)
- Hubel & Wiesel (1968/1981). Nobel Prize work on V1 orientation selectivity.
- Ungerleider & Mishkin (1982). Two visual processing streams.
- StatPearls: [Retina](https://www.ncbi.nlm.nih.gov/books/NBK545310/), [LGN](https://www.ncbi.nlm.nih.gov/books/NBK541137/), [Fovea](https://www.ncbi.nlm.nih.gov/books/NBK482301/)

---

*This document is part of [Autodidactive](https://qinnovate.com/learn/autodidactive/), an open learning tool for students entering neurosecurity, neuroethics, and BCI work. QIF band mappings reference the proposed QIF framework (not an adopted standard). Written with AI assistance (Claude). All claims verified by the author.*
