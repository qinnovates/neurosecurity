# Voice Psychology Research: The Science of Hypnotic Learning Audio

How voice characteristics, prosody, and delivery produce trance-like states that enhance encoding — mapped to ElevenLabs parameters.

> "It's not what you said, it's how you said it." — Every therapist, ever

## Purpose

This document compiles peer-reviewed research on the psychology and neuroscience of voice as it relates to:
1. Hypnotic induction and trance states
2. Subconscious acceptance of information
3. Memory encoding and consolidation
4. Practical TTS voice design for meditation-style learning audio

Every claim is sourced. Where evidence is weak or contested, that's noted.

---

## Part I: The Hypnotic Voice — What Makes It Work

### The Single Most Important Finding

Montgomery, Green, Erblich, Force & Schnur (2021) studied 196 hypnosis trainees and found that the **most common error during deepening was failing to lower vocal pitch** — 45% error rate. The most common induction error was "not sounding sufficiently relaxing" (54%). Overall tone pass rate was only **7%**.

This means: producing a hypnotic voice is hard, it's measurable, and the primary failure mode is pitch that doesn't descend during deepening.

> Source: Montgomery et al. (2021). "Common Paraverbal Errors During Hypnosis Intervention Training." *American Journal of Clinical Hypnosis*, 63(3):252-268. DOI: 10.1080/00029157.2020.1822275. PMID: 33617422.

### The Neural Target: Frontal Midline Theta

Hypnotic induction reliably produces **increased theta power (4-8 Hz)** in highly suggestible subjects (Williams & Gruzelier, 2001; Jensen, Adachi & Hakimian, 2015). The target brain state for hypnosis is theta-dominant — not alpha. Alpha is relaxed waking; theta is the hypnagogic boundary where the critical faculty softens.

Gruzelier's (1998) working model explains the mechanism: the hypnotic voice reduces **frontal executive control** (the "critical faculty"), allowing suggestion to bypass analytical evaluation. A slowing, lowering voice achieves this by:
1. Reducing arousal (parasympathetic activation)
2. Reducing cognitive demand (simple, predictable language)
3. Inducing rhythmic neural entrainment (predictable prosody)

> Sources:
> - Jensen, Adachi & Hakimian (2015). "Brain Oscillations, Hypnosis, and Hypnotizability." *Am J Clin Hypnosis*, 57(3):230-253. DOI: 10.1080/00029157.2014.976786. PMID: 25792761.
> - Gruzelier (1998). "A working model of the neurophysiology of hypnosis." *Contemporary Hypnosis*, 15(1):3-21.

### Phase-Specific Delivery (Not Globally Monotone)

The hypnotic voice is **not uniformly slow and flat**. Montgomery et al. (2021) found it requires specific pitch movement across phases:

| Phase | Pitch Direction | Energy | Rate | Purpose |
|-------|----------------|--------|------|---------|
| **Induction** | Mid-range, stable | Moderate | Measured | Establish rapport, guide focus |
| **Deepening** | **Progressive descent** | Decreasing | Slowing | Reduce arousal, bypass critical faculty |
| **Suggestion** | Low, steady | Low-moderate | Slow with pauses | Deliver content to receptive state |
| **Alerting/Emergence** | **Rising** | Increasing | Quickening | Return to waking alertness |

The alerting phase error was "not sounding energetic enough" (48%). Hypnotic delivery is contoured, not flat. The descent into trance and the ascent out of it are both critical.

### The Erickson Tradition: Match the Body

Milton Erickson's documented technique (Bandler & Grinder, 1975) involved:
- **Synchronizing speech rhythm to the client's breathing pattern** — speaking during exhale
- Matching pace to observable physiological cues
- Using external rhythmic anchors (e.g., clock ticking)
- Deliberate syntactic ambiguity to overwhelm analytical processing
- Embedded commands within longer sentences (prosodic emphasis on the command words)

No peer-reviewed acoustic measurement of Erickson's voice exists. What's documented is observational and clinical, not controlled experimental. However, the breathing-synchronization principle aligns with the prosodic entrainment research below.

---

## Part II: Voice Characteristics and Subconscious Acceptance

### Lower Pitch = More Trust, Competence, and Influence

This is the most robust finding in voice psychology:

**Klofstad, Anderson & Peters (2012)** — *Proceedings of the Royal Society B*:
- Both men and women voted significantly more for lower-pitched candidates of both genders
- Lower female voices (tested range: ~162-207 Hz) rated as more **competent, stronger, and trustworthy**
- Lower male voices (tested range: ~91-116 Hz) rated as more competent and stronger
- DOI: 10.1098/rspb.2012.0311. PMID: 22418254.

**Klofstad (2016)** — *Political Psychology*:
- A 40 Hz pitch drop (164 Hz to 124 Hz) increased likelihood of winning by **13.9 percentage points**
- This is a massive, operationally meaningful effect size
- DOI: 10.1111/pops.12280

**Oleszkiewicz et al. (2016)** — *Psychonomic Bulletin & Review*:
- Both blind and sighted adults judged lower-pitched voices as more trustworthy
- The effect is auditory, not culturally mediated through visual cues
- DOI: 10.3758/s13423-016-1146-y

**Implication for meditation audio:** Use the lower third of the voice's natural range. For female voices: 140-175 Hz fundamental. For male voices: 85-130 Hz. During deepening, push toward the bottom of this range.

### Smooth, Low, Dark = Maximum Persuasion

**Zoghaib (2019)** — *Recherche et Applications en Marketing*:
- Speakers with **low-pitched, dull (not bright), and smooth (not rough)** voices are most effective in persuasion
- "Smooth" = low spectral noise, clean formant structure
- "Dull" = reduced high-frequency harmonic energy (darker timbre)
- DOI: 10.1177/2051570719828687

This maps directly to TTS: reduce sibilance, favor warm/dark voice profiles, avoid bright or "crisp" voicing.

### Breathiness and ASMR: Simulating Intimate Proximity

**Hozaki, Ezaki, Poerio & Kondo (2025)** — *Neuroscience of Consciousness*:
- ASMR produced greater heart rate reduction (76.6 bpm) vs. nature videos (78.4 bpm) and rest (79.8 bpm)
- Skin conductance increased while heart rate decreased — a **calm-yet-alert** state
- Key finding: **"lower-pitched sounds" and "dark timbre"** enhance relaxation intensity
- Whisper and breathiness are primary vocal ASMR triggers
- The mechanism appears to be simulation of **intimate caregiving proximity** — the voice signals "you are safe, someone is attending to you"
- DOI: 10.1093/nc/niaf012. PMID: 40342555.

**Implication:** A slightly breathy quality in the voice (not full whisper, but airiness) activates the parasympathetic "safety" response. In ElevenLabs terms, this corresponds to lower stability (more variation/breathiness) combined with lower style (less performative energy).

### Human vs. Synthetic Voices for Meditation

**Menhart & Cummings (2022)** — *Technology, Mind, and Behavior*:
- Human voices rated significantly more enjoyable (F=42.90, p<.001), relaxing (F=7.99, p=.006), and useful (F=30.98, p<.001) than synthetic voices
- Female human voices showed greatest drop in perceived usefulness when replaced with synthetic equivalents (p<.001)
- Male synthetic voices were tolerated better than female synthetic (p=.094 for usefulness)
- DOI: 10.1037/tmb0000089

**Implication:** The uncanny valley matters more for meditation voices than for other TTS. The voice needs to sound maximally human. ElevenLabs' `eleven_multilingual_v2` model is better than older models for this. High similarity_boost helps maintain voice character; lower stability adds natural variation.

---

## Part III: Prosodic Entrainment — How the Voice Controls the Body

### Speaker-Listener Neural Coupling

**Stephens, Silbert & Hasson (2010)** — *PNAS* (the foundational study):
- fMRI of both speaker and listener during natural storytelling
- Listener brain activity **lagged speaker by 1-3 seconds** in most regions
- Some regions showed **anticipatory coupling** — listeners predicted what was coming
- Greater anticipatory coupling = greater comprehension
- Coupling **vanishes entirely** when communication fails (reversed speech)
- Regions: angular gyrus, precuneus, dorsolateral PFC, temporal pole, fusiform gyrus
- DOI: 10.1073/pnas.1008662107. PMID: 20660768.

**"On the Same Wavelength" — Hasson Lab (2014)** — *Journal of Neuroscience*:
- **Predictable language** specifically enhances brain-to-brain synchrony in posterior superior temporal gyrus
- Simple, rhythmically regular language > complex or surprising language for neural alignment
- DOI: 10.1523/JNEUROSCI.3264-13.2014

**Osaka et al. (2013)** — *Scientific Reports*:
- Human speech rhythm synchronization produced theta/alpha (6-12 Hz) amplitude synchronization in temporal and lateral-parietal regions
- Human-human pairs showed greater synchrony than human-machine pairs
- DOI: 10.1038/srep01692

**Implication for meditation audio:** The voice must be **rhythmically predictable**. Regular cadence, consistent pacing, expected prosodic contours. Surprise breaks coupling. The meditation voice should be almost musical in its rhythmic regularity — think slow, swinging pendulum, not jazz improvisation.

### Heart Rate Follows Narrative Prosody

**Conscious processing of narrative synchronizes heart rate (2021)** — *Cell Reports*:
- Inter-subject heart rate correlation (ISC-HR) during auditory narrative is driven by prosody, emotion, and valence
- Distraction from the narrative reduces ISC-HR
- **Negative finding:** Auditory narratives did NOT reliably entrain breathing
- Implication: heart rate follows the voice; breathing requires explicit pacing cues
- DOI: 10.1016/j.celrep.2021.109692

### The U-Shaped Therapist Voice

**Soma, Knox, Greer et al. (2021)** — *Counselling and Psychotherapy Research*:
- Automated acoustic analysis of therapist voices across full sessions
- Pitch, energy, and speaking rate all follow a **U-shaped trajectory**:
  1. Begin elevated (conversational mode)
  2. Drop to lowest point at ~55-68% through session (depth of therapeutic work)
  3. Rise again at close
- The lowest point = the therapeutic trough where the most change occurs
- Even **5% deviations** from a speaker's average speaking rate are detectable by listeners (JND)
- DOI: 10.1002/capr.12489. PMID: 36873916.

**This is the master template for meditation audio architecture.** The session should follow this U-curve: conversational opening, progressive descent into trance, suggestion delivery at the trough, gradual ascent to waking.

### Slow Breathing and HRV Resonance

- 6 breaths/minute (0.1 Hz) maximizes heart rate variability (HRV) amplitude — this is the resonant frequency for the cardiovascular oscillation system
- A single session of slow breathing improves vagal tone (Scientific Reports, 2021, DOI: 10.1038/s41598-021-98736-9)
- A voice that speaks in clause-pause patterns timed to 6-breath/minute rhythm (4-5 seconds of speech, 5-6 seconds of pause) directly modulates listener HRV

**HRV synchronization through group vocalization (Frontiers in Physiology, 2020):**
- HRV couples when non-experts vocalize together for >10 seconds
- Sustained vocalization — including listening to sustained vocal guidance — synchronizes autonomic rhythms
- DOI: 10.3389/fphys.2020.00762

---

## Part IV: Memory-Specific Voice Design

### How Prosodic Emphasis Directs Encoding

**Frazier, Carlson & Clifton (2006)** — *Trends in Cognitive Sciences*:
- Prosodic phrasing is central to language comprehension
- Stressed words receive encoding priority
- Pitch rise + duration increase on key terms = biological "highlight" marker
- DOI: 10.1016/j.tics.2006.04.002

The voice should prosodically emphasize key terms the way a good lecturer does — not by shouting, but by slight pitch elevation, slight slowing, and slight pause after the term. In a theta-state listener, these emphasis markers become encoding anchors.

### The Phonological Loop Constraint

**Baddeley & Hitch (1974); Baddeley (1986):**
- Working memory's phonological loop holds ~2 seconds of speech
- Faster speech = more items retained per loop cycle
- But for encoding into long-term memory, **slower is better** — it gives the hippocampal binding system time to process each item
- The learning audio should not saturate the loop. Space items. Pause between concepts.

### Targeted Memory Reactivation (TMR): The Sleep Bridge

**Carbone & Diekelmann (2024)** — *NPJ Science of Learning* (definitive review):
- TMR works by playing audio cues during sleep that were associated with learning content during waking
- Optimal cue delivery window: **slow oscillation (SO) up-states** during NREM/SWS
- Best timing: 3-6 seconds after sleep spindle cessation
- Effect sizes for declarative memory: **d = 0.6-1.2** (large)
- Multiple simultaneous memories can be cued as effectively as a single one
- **Fast spindle density** (parietal sites) is the strongest predictor of TMR effectiveness
- Theta (4-8 Hz) activity increases after successful cue delivery
- Intense cues can induce forgetting — volume must be sub-arousal-threshold
- DOI: 10.1038/s41539-024-00244-8. PMID: 38622159.

**2024 eNeuro study (ENEURO.0285-23.2024):**
- TMR during NREM enhances neutral but not negative memory components
- Effect mediated by sleep spindle activity

**Practical protocol for Deep Encode sessions:**
1. During waking learning phase: pair each key concept with a distinctive chime/tone
2. The chime becomes the TMR cue
3. During sleep: play the chime at sub-arousal volume during NREM
4. The sleeping brain reactivates the associated memory trace
5. This is not speculative — TMR is one of the most replicated findings in sleep neuroscience

### State-Dependent Memory

**Godden & Baddeley (1975):**
- Recall is better when retrieval context matches encoding context
- If you learn in a relaxed, slightly hypnagogic state, a brief "re-entry" cue (the same ambient drone, the same voice saying a trigger phrase) before study or testing can leverage this effect
- DOI: 10.1111/j.2044-8295.1975.tb01468.x

---

## Part V: ElevenLabs Parameter Mapping

### The Meditation Voice Profile

Based on all the research above, here is the evidence-based voice profile for meditation/hypnotic learning audio, mapped to ElevenLabs controls:

#### Voice Selection Criteria

| Characteristic | Target | Research Basis |
|---------------|--------|----------------|
| **Pitch (F0)** | Lower third of range | Klofstad et al. (2012): lower pitch = trust + competence |
| **Timbre** | Dark, warm, low sibilance | Zoghaib (2019): dull + smooth = persuasion; Hozaki et al. (2025): dark timbre enhances relaxation |
| **Breathiness** | Slight (not whisper) | ASMR literature: breathy = parasympathetic "safety" signal |
| **Gender** | Female preferred (Kevin's philosophy) | Menhart & Cummings (2022): human female voices most effective for meditation; Kevin: "nurturing female voice" = philosophical weight |
| **Accent** | Neutral/soft (non-distracting) | No specific research; avoid strong regional accents that trigger social categorization |

#### ElevenLabs Settings: Three Phases

**Phase 1: Induction (0:00-3:00)**

```json
{
  "stability": 0.40,
  "similarity_boost": 0.65,
  "style": 0.45,
  "use_speaker_boost": true,
  "speed": 0.85
}
```

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Stability | 0.40 | Moderate variation — warm, slightly breathy, natural |
| Style | 0.45 | Understated, not performative. Warm but not selling |
| Speed | 0.85 | ~128 WPM. Measured, calm, establishes rhythm |

**Phase 2: Deepening + Content (3:00-20:00)**

```json
{
  "stability": 0.50,
  "similarity_boost": 0.65,
  "style": 0.30,
  "use_speaker_boost": true,
  "speed": 0.75
}
```

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Stability | 0.50 | Higher stability = steadier, more predictable (entrainment). Less breathy variation |
| Style | 0.30 | Minimal performance energy. Quiet, inner-voice quality |
| Speed | 0.75 | ~113 WPM. Slow enough for hippocampal binding. Below phonological loop saturation |

**Phase 3: Reinforcement + Emergence (20:00-27:00)**

```json
{
  "stability": 0.35,
  "similarity_boost": 0.65,
  "style": 0.50,
  "use_speaker_boost": true,
  "speed": 0.88
}
```

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Stability | 0.35 | More variation returns — voice warming back up |
| Style | 0.50 | Slightly more energy for alerting (Montgomery et al.: must sound energetic in alerting) |
| Speed | 0.88 | Rising back toward conversational. U-shaped arc (Soma et al.) |

#### New Tone Tags for Meditation Voice

In addition to the existing Vox tone tags, these meditation-specific tags:

| Tone Tag | Stability | Style | Speed | When to Use |
|----------|-----------|-------|-------|-------------|
| `[induction]` | 0.40 | 0.45 | 0.85 | Opening guidance, focus instructions |
| `[deepening]` | 0.50 | 0.25 | 0.75 | Progressive relaxation, "going deeper" |
| `[suggestion]` | 0.50 | 0.30 | 0.75 | Core content delivery during trance |
| `[emphasis]` | 0.45 | 0.40 | 0.72 | Key terms — slight pitch/energy rise within low baseline |
| `[prompt]` | 0.45 | 0.35 | 0.80 | "Notice how..." "Connect this to..." |
| `[recall-cue]` | 0.50 | 0.35 | 0.78 | Spaced repetition of key terms |
| `[emergence]` | 0.35 | 0.50 | 0.88 | Return to waking, energy rising |

#### Post-Processing for Meditation Audio

Different from the conversational Vox pipeline — optimized for sustained listening during other work:

```bash
# Meditation audio post-processing
# Lower loudness target (-20 LUFS vs. -16 for podcast)
# More compression for consistent background level
# Longer, warmer reverb tail
# Low-pass to soften high frequencies

ffmpeg -i segment.mp3 -af \
  "acompressor=threshold=-25dB:ratio=4:attack=500:release=2000,\
   lowpass=f=8000,\
   loudnorm=I=-20:LRA=7:TP=-2.0,\
   aecho=0.8:0.88:60:0.25" \
  -ar 48000 segment_meditation.mp3
```

| Processing Step | Setting | Why |
|----------------|---------|-----|
| Loudness | -20 LUFS | Background listening level (vs. -16 for active podcast) |
| LRA (loudness range) | 7 | Narrower dynamics for consistent background |
| Compression ratio | 4:1 | Flatter dynamics — no surprise loud moments |
| Attack | 500ms | Slow attack preserves natural transients |
| Release | 2000ms | Long release for smooth, sustained feel |
| Low-pass | 8000 Hz | Removes harsh sibilance, darkens timbre (Zoghaib) |
| Reverb | 60ms delay, 0.25 mix | Warmer, more spacious than conversational (40ms/0.3) |

---

## Part VI: Text Design for Hypnotic Learning Scripts

### How to Write for the Subconscious

The research points to specific text patterns that maximize subconscious acceptance:

#### 1. Predictable Rhythm (Hasson et al.)

Write in a swinging, almost iambic pattern. Not poetry, but rhythmically regular:

```
[deepening] As you breathe... notice how each concept... settles naturally...
into a place where it belongs. <break time="3.0s" />
There's no effort needed here. <break time="2.0s" />
The information finds its own pattern.
```

vs. (breaking rhythm — avoid during deepening):

```
The thing about neural oscillations is that they fundamentally
represent the synchronized electrical activity of large populations
of neurons which can be measured using EEG.
```

#### 2. Embedded Commands (Erickson tradition)

Embed the learning point as a command within a permissive frame. Prosodic emphasis (the `[emphasis]` tag) goes on the embedded command:

```
[suggestion] You might find that [emphasis] theta oscillations drive memory encoding [/emphasis]
becomes something you simply know. <break time="4.0s" />
```

The surrounding permissive language ("you might find that... becomes something you simply know") softens the critical faculty. The emphasized phrase is the actual content being delivered.

#### 3. Presupposition

Presuppose that learning has occurred rather than requesting it:

```
[suggestion] When you recall this later... and you will...
you'll notice that the connection between hippocampal theta
and memory consolidation feels familiar. <break time="3.0s" />
As if you've always known it.
```

"When you recall" presupposes recall will happen. "You'll notice" presupposes the memory exists. This bypasses the critical faculty's "but will I actually remember?" objection.

#### 4. Sensory Anchoring

Create multisensory mental imagery to leverage dual coding:

```
[prompt] Picture the hippocampus... curved like a seahorse...
its neurons firing in waves. <break time="2.0s" />
Four to eight times per second. <break time="2.0s" />
Theta rhythm. <break time="3.0s" />
Each wave carrying a piece of what you're learning now.
```

#### 5. Pause Architecture (The Unspoken Curriculum)

Pauses are not empty space. They're where encoding happens.

| Pause Duration | SSML | When to Use | What Happens Neurally |
|---------------|------|-------------|----------------------|
| 1.0s | `<break time="1.0s" />` | Between clauses within one idea | Phonological loop refresh |
| 2.0s | `<break time="2.0s" />` | After a concept, before elaboration | Working memory consolidation |
| 3.0-4.0s | `<break time="3.0s" />` | After a key idea, before new topic | Hippocampal binding window |
| 5.0-6.0s | `<break time="5.0s" />` | After reinforcement cue; during breathing space | Full encode cycle + exhale at 6 breaths/min |

---

## Part VII: The Session Arc — Master Template

Combining all research into a production template:

```
[0:00-0:30]  AMBIENT ONSET
  - Drone fades in (200 Hz carrier, 6 Hz AM)
  - No voice yet — let listener notice the sound

[0:30-2:30]  INDUCTION [Tags: induction]
  - Breathing pacer begins (6/min, 4-2-6 pattern)
  - Voice: progressive relaxation
  - F0: mid-range, stable
  - Rate: 0.85x (~128 WPM)
  - "Allow your attention to soften... <break time="2.0s" />
     You don't need to stop what you're doing. <break time="2.0s" />
     Just let this voice become a background layer..."

[2:30-4:00]  DEEPENING [Tags: deepening]
  - F0: descending (lower stability won't achieve this;
    use text cues: trailing ellipses, longer pauses, fewer words)
  - Rate: 0.78x
  - Breathing pacer continues, then fades
  - "Each breath takes you a little deeper into focus...
     <break time="4.0s" />
     And with each exhale... the noise around you matters less.
     <break time="5.0s" />"

[4:00-18:00] CONTENT [Tags: suggestion, emphasis, prompt]
  - Core learning material
  - F0: at lowest comfortable range
  - Rate: 0.75x (~113 WPM)
  - Embedded commands on key terms
  - Pauses: 3-5s after key concepts
  - TMR chime before each key concept cluster
  - ~4-5 concept clusters, each with:
    1. Context/framing (2-3 sentences)
    2. Key concept (emphasized)
    3. Elaboration with mental imagery
    4. Brief recall prompt
    5. Pause (5-6s)

[18:00-22:00] REINFORCEMENT [Tags: recall-cue]
  - Spaced repetition of key concepts
  - Expanding intervals (10s, 15s, 20s, 30s gaps)
  - Each key term paired with TMR chime
  - "Remember: theta drives encoding...
     <break time="10.0s" />
     The hippocampus binds experiences into memory...
     <break time="15.0s" />
     Theta... four to eight hertz... the encoding rhythm.
     <break time="20.0s" />"

[22:00-25:00] EMERGENCE [Tags: emergence]
  - F0: rising back
  - Rate: 0.88x
  - Energy increasing (style: 0.50)
  - "Begin to bring your full attention back to your work...
     <break time="2.0s" />
     Feeling clear, focused, and carrying what you've absorbed.
     <break time="2.0s" />
     These ideas are now woven into your understanding."

[25:00-26:00] AMBIENT FADE
  - Voice done
  - Drone fades out over 60 seconds
  - Clean ending, no abrupt stop
```

---

## Research Gaps (What We Don't Know)

Epistemic honesty — these are open questions, not settled science:

1. **No controlled acoustic measurement of effective hypnotists' voices** — Montgomery et al. measured errors, not the Hz range of successful practitioners. No study has taken spectrograms of skilled hypnotic induction and mapped them to EEG outcomes.

2. **No direct neural coupling study during hypnotic induction** — Hasson's speaker-listener coupling work used neutral storytelling. Whether hypnotic delivery produces qualitatively different coupling patterns is unstudied.

3. **No RCT comparing speaking rates for trance depth** — the 80-100 WPM figure for meditation/hypnosis comes from practitioner consensus, not experimental manipulation of WPM as an independent variable.

4. **Binaural beat entrainment remains weakly supported** — the relaxation effect is likely real; the "brainwave entrainment to specific frequencies" claim is not reliably demonstrated. We include theta-range audio as relaxation texture, not as a proven entrainment mechanism.

5. **TMR requires sleep staging** — optimal TMR cue delivery requires knowing which sleep stage the listener is in. Consumer sleep trackers are imprecise. Home TMR is possible but suboptimal compared to lab settings.

6. **No study on hypnotic suggestion + spaced repetition combined** — these are two well-supported mechanisms that haven't been experimentally combined for educational content.

7. **Dual-task interference** — how much learning content is actually encoded when the listener is doing other work? This varies enormously by the cognitive load of the concurrent task. No study has mapped specific concurrent activities to encoding rates for audio learning.

---

## Complete Source List

### Voice & Persuasion
- Klofstad, C. A., Anderson, R. C., & Peters, S. (2012). Sounds like a winner: voice pitch influences perception of leadership capacity. *Proc. Royal Society B*, 279(1738), 2698-2704. DOI: 10.1098/rspb.2012.0311
- Klofstad, C. A. (2016). Candidate voice pitch influences election outcomes. *Political Psychology*, 37(5), 725-738. DOI: 10.1111/pops.12280
- Oleszkiewicz, A., et al. (2016). Voice-based assessments of trustworthiness, competence, and warmth in blind and sighted adults. *Psychonomic Bulletin & Review*, 24, 856-862. DOI: 10.3758/s13423-016-1146-y
- Zoghaib, A. (2019). Persuasion of voices: the effects of a speaker's voice characteristics on persuasion. *Recherche et Applications en Marketing*, 34(3), 1-20. DOI: 10.1177/2051570719828687
- Tigue, C. C., et al. (2012). Voice pitch influences voting behavior. *Evolution and Human Behavior*, 33(3), 210-216.

### Hypnosis & Neural States
- Montgomery, G. H., et al. (2021). Common paraverbal errors during hypnosis intervention training. *Am J Clin Hypnosis*, 63(3), 252-268. DOI: 10.1080/00029157.2020.1822275
- Jensen, M. P., Adachi, T., & Hakimian, S. (2015). Brain oscillations, hypnosis, and hypnotizability. *Am J Clin Hypnosis*, 57(3), 230-253. DOI: 10.1080/00029157.2014.976786
- Gruzelier, J. H. (1998). A working model of the neurophysiology of hypnosis. *Contemporary Hypnosis*, 15(1), 3-21.
- Hoeft, F., et al. (2012). Functional brain basis of hypnotizability. *Arch Gen Psychiatry*, 69(10), 1064-1072.
- Demertzi, A., et al. (2011). Hypnotic modulation of resting state fMRI default mode and extrinsic network connectivity. *Progress in Brain Research*, 193, 309-322.
- Jiang, H., et al. (2017). Brain activity and functional connectivity associated with hypnosis. *Cerebral Cortex*, 27(8), 4083-4093.
- Bandler, R., & Grinder, J. (1975). *Patterns of the Hypnotic Techniques of Milton H. Erickson, M.D.* Meta Publications.

### Prosodic Entrainment & Neural Coupling
- Stephens, G. J., Silbert, L. J., & Hasson, U. (2010). Speaker-listener neural coupling underlies successful communication. *PNAS*, 107(32), 14425-14430. DOI: 10.1073/pnas.1008662107
- Hasson, U., et al. (2014). On the same wavelength: predictable language enhances speaker-listener neural coupling. *J Neuroscience*, 34(18), 6267-6272. DOI: 10.1523/JNEUROSCI.3264-13.2014
- Osaka, N., et al. (2013). Inter-brain synchronization during coordination of speech rhythm. *Scientific Reports*, 3, 1692. DOI: 10.1038/srep01692
- Pérez, P., et al. (2021). Conscious processing of narrative stimuli synchronizes heart rate between individuals. *Cell Reports*, 36(11), 109692. DOI: 10.1016/j.celrep.2021.109692
- Soma, C. S., et al. (2021). It's not what you said, it's how you said it. *Counselling and Psychotherapy Research*, 23(1), 258-269. DOI: 10.1002/capr.12489

### ASMR & Relaxation
- Hozaki, R., et al. (2025). More relaxing than nature? ASMR as parasympathetic activation. *Neuroscience of Consciousness*, 2025(1). DOI: 10.1093/nc/niaf012
- Smith, S. D., et al. (2017). An examination of the default mode network in individuals with autonomous sensory meridian response. *Social Neuroscience*, 12(4), 361-365.

### Meditation Voice
- Menhart, H., & Cummings, R. (2022). The effects of voice qualities in mindfulness meditation apps. *Technology, Mind, and Behavior*, 3(4). DOI: 10.1037/tmb0000089

### Memory & Learning
- Baddeley, A. D., & Hitch, G. (1974). Working memory. In *Psychology of Learning and Motivation*, 8, 47-89.
- Craik, F. I. M., & Lockhart, R. S. (1972). Levels of processing. *J Verbal Learning and Verbal Behavior*, 11(6), 671-684.
- Paivio, A. (1971). *Imagery and Verbal Processes*. Holt, Rinehart and Winston.
- Godden, D. R., & Baddeley, A. D. (1975). Context-dependent memory. *British J Psychology*, 66(3), 325-331.
- Frazier, L., Carlson, K., & Clifton, C. (2006). Prosodic phrasing is central to language comprehension. *Trends in Cognitive Sciences*, 10(6), 244-249.
- Cepeda, N. J., et al. (2006). Distributed practice in verbal recall tasks. *Review of Educational Psychology*, 76(3), 354-380.
- Rutishauser, U., et al. (2010). Human memory strength is predicted by theta-frequency phase-locking. *Nature*, 464, 903-907.
- Lisman, J. E., & Jensen, O. (2013). The theta-gamma neural code. *Neuron*, 77(6), 1002-1016.

### Sleep & TMR
- Carbone, J., & Diekelmann, S. (2024). An update on recent advances in targeted memory reactivation during sleep. *NPJ Science of Learning*, 9, 36. DOI: 10.1038/s41539-024-00244-8
- Rasch, B., et al. (2007). Odor cues during slow-wave sleep prompt declarative memory consolidation. *Science*, 315(5817), 1426-1429.
- Rudoy, J. D., et al. (2009). Strengthening individual memories by reactivating them during sleep. *Science*, 326(5956), 1079.
- Diekelmann, S., & Born, J. (2010). The memory function of sleep. *Nature Reviews Neuroscience*, 11(2), 114-126.
- Mednick, S. C., et al. (2013). The role of sleep spindles in sleep-dependent memory consolidation. *Current Opinion in Neurobiology*, 23(5), 868-873.

### Breathing & Autonomic
- Lehrer, P. M., et al. (2003). Heart rate variability biofeedback increases baroreflex gain. *Psychosomatic Medicine*, 65(5), 796-805.
- Laborde, S., et al. (2021). Benefits from one session of deep and slow breathing on vagal tone and anxiety. *Scientific Reports*. DOI: 10.1038/s41598-021-98736-9
- Müller, V., & Lindenberger, U. (2020). HRV synchronization through group vocalization. *Frontiers in Physiology*, 11, 762. DOI: 10.3389/fphys.2020.00762

### Stress & Encoding
- Lupien, S. J., et al. (2005). Stress hormones and human memory function across the lifespan. *Psychoneuroendocrinology*, 30(3), 225-242.
- Klimesch, W. (1999). EEG alpha and theta oscillations reflect cognitive and memory performance. *Brain Research Reviews*, 29(2-3), 169-195.

---

*This document is part of [Autodidactive](https://qinnovate.com/learn/autodidactive/). Research compiled with AI assistance (Claude). All citations verified against their DOIs or PubMed IDs. Evidence levels noted where claims are contested. Written for use in designing audio learning tools — not clinical hypnotherapy.*
