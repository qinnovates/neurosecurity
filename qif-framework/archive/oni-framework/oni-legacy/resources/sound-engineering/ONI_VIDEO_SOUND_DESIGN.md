# ONI Demo Video Sound Design Documentation

**Created:** 2026-01-29
**Project:** ONI Framework Demo Video
**Tool:** ElevenLabs Sound Generation API
**Purpose:** Document the audio design philosophy, frequencies, and psychological principles used in the ONI demo video.

---

## Overview

The ONI demo video employs a carefully layered audio design that builds anticipation, elicits curiosity, and creates emotional resonance with the viewer. The sound design follows principles from music theory, game audio engineering, and cognitive psychology.

---

## Audio Timeline

| Time | Frames | Sound Layer | Purpose |
|------|--------|-------------|---------|
| 0:00-7:00 | 0-210 | Ambient + Original Pulse | Establish atmosphere, trigger curiosity |
| 5:00-14:07 | 150-422 | Smooth Pulse (crossfade) | Build anticipation, maintain engagement |
| 9:00 | 270 | **Volume Dip** (Ambient & Pulse -25%) | Create headroom for melodic tones |
| 9.11s | 273 | **Ding Tone 1** (Perfect 4th) | "Question" - sets up harmonic progression |
| 11:00 | 330 | **Ding Tone 2** (Perfect 5th) | "Answer" - builds toward resolution |
| 14.07s | 422 | **Boot Chime** (Major resolution) | "Resolution" - releases built tension |
| 15.67s+ | 470+ | Narration begins | Content delivery |
| 3:09 | 5670 | Credits voiceover + Wind/Door | Closing manifesto |
| 3:22 | 6065 | **Finale Ascend** | Door opening - ascending chord |
| 3:23 | 6090 | **Finale Shimmer** | Layered bells and texture |
| 3:24 | 6130 | **Finale Voice (Lily)** | "Welcome to the OSI of Mind..." |
| 3:31 | 6340 | **Ding 1 (Closing)** | Perfect 4th - closing sequence begins |
| 3:32 | 6370 | **Ding 2 (Closing)** | Perfect 5th - builds to resolution |
| 3:33 | 6395 | **Boot Chime (Closing)** | Major resolution - final closure |
| 3:34 | 6430 | **Ambient + Pulse Reprise** | Bookend - same sounds as intro |
| 3:44 | 6720 | **Finale CTA (Lily)** | "So... what are you waiting for?" |
| 3:54 | 7020 | Ambient fades out | 10s ambient after CTA, then cut |

---

## Sound Assets

### 1. Ambient Tech Atmosphere
**File:** `ambient-tech.mp3`
**Duration:** 22 seconds
**Volume:** 35%, fades out over 3 seconds

**Prompt Used:**
```
soft ambient electronic pad with gentle pulse, futuristic technology atmosphere,
calm and soothing with subtle excitement, like the hum of advanced neural
technology awakening, mysterious yet hopeful
```

**Frequency Characteristics:**
- Low-mid frequency pad (100-400Hz base)
- Subtle high-frequency shimmer (2-6kHz)
- Slow LFO modulation creating gentle movement

**Psychological Effect:**
- Creates sense of space and immersion
- Low frequencies trigger feeling of presence and safety
- Subtle movement maintains subconscious attention without demanding focus

---

### 2. Original Pulse (Deep Curiosity Trigger)
**File:** `original-pulse.mp3`
**Duration:** 8 seconds
**Volume:** 70%, crossfades out at 5-7 seconds

**Prompt Used:**
```
deep low frequency sine wave pulse around 80Hz, slow rhythmic throb like a
heartbeat at 60 BPM, mysterious suspended chord drone, zelda-like wonder tone
with perfect fifth harmony, soft bass hum that builds curiosity and anticipation,
clean and pure like portal game sounds, meditative and hypnotic, subtle rising pitch
```

**Frequency Characteristics:**
- **Base frequency:** ~80Hz (sub-bass, felt more than heard)
- **Rhythm:** 60 BPM (matches resting heart rate)
- **Harmony:** Perfect 5th intervals (3:2 ratio)
- **Texture:** Clean sine wave, minimal harmonics

**Music Theory Principles:**
| Element | Interval/Value | Effect |
|---------|----------------|--------|
| Perfect 5th | 3:2 ratio | Most consonant interval, creates "openness" and wonder |
| 60 BPM | 1Hz pulse | Synchronizes with parasympathetic nervous system |
| 80Hz base | Sub-bass | Triggers primal attention, felt in chest |
| Suspended chord | No resolution | Creates anticipation, brain seeks closure |

**Psychological Effect:**
- **Curiosity activation:** Suspended harmony creates unresolved tension that the brain wants to resolve
- **Calm focus:** 60 BPM matches resting heart rate, inducing calm without sedation
- **Wonder response:** Perfect 5ths are used extensively in Nintendo/Zelda for discovery moments
- **Presence:** 80Hz felt physically, creates sense of "something is here"

---

### 3. Smooth Pulse (Sustained Anticipation)
**File:** `curiosity-pulse.mp3`
**Duration:** 12 seconds
**Volume:** 80%, crossfades in at 5 seconds, fades out at 14 seconds

**Prompt Used:**
```
soft low frequency pulsing drone, gentle rhythmic throb like a calm heartbeat,
smooth warm bass hum at 60 BPM, ambient pad with subtle pulse, soothing and
hypnotic, rounded sine wave texture, peaceful yet anticipatory, velvet smooth
electronic pulse, meditation music with gentle rhythm
```

**Frequency Characteristics:**
- Warmer, rounder tone than original pulse
- Less harmonic content (purer sine wave)
- Maintains 60 BPM rhythm
- Smoother attack/release envelope

**Psychological Effect:**
- Continues the curiosity state without fatigue
- Smoother texture prevents listener exhaustion
- Maintains engagement through sustained tension
- Prepares listener for the "payoff" (boot chime)

---

### 4. Ding Tone 1 - Perfect 4th (Harmonic Setup)
**File:** `ding-tone.mp3`
**Duration:** 2 seconds
**Volume:** 50%
**Timing:** 9.11s (frame 273)

**Prompt Used:**
```
gentle bell tone, soft digital ding, pure sine wave with slight shimmer,
musical interval feel, calm and curious, like a notification from the future,
warm mid-frequency tone, not harsh or alarming
```

**Frequency Characteristics:**
- Base frequency: ~440Hz (A4) or nearby
- Perfect 4th interval relationship to subsequent tones
- Clean attack, gentle decay
- Minimal harmonics for purity

**Music Theory Principles:**
| Element | Value | Mathematical Basis |
|---------|-------|-------------------|
| Interval | Perfect 4th | 4:3 frequency ratio |
| Function | Subdominant | Creates "questioning" sensation |
| Role | Setup | First element of I-IV-V-I progression |

**Mathematical Foundation:**
```
If root = f₀, then Perfect 4th = f₀ × (4/3)
Example: 330Hz root → 440Hz (Perfect 4th above)
```

**Psychological Effect:**
- **Questioning:** The 4th interval creates expectation without resolution
- **Attention capture:** First melodic element after ambient/pulse bed
- **Priming:** Prepares auditory cortex for subsequent tones

---

### 5. Ding Tone 2 - Perfect 5th (Harmonic Bridge)
**File:** `ding-tone-2.mp3`
**Duration:** 2 seconds
**Volume:** 45%
**Timing:** 11s (frame 330)

**Prompt Used:**
```
soft resonant bell tone, gentle digital chime, pure and clear,
slightly higher pitch than previous, musical harmony feel,
open and anticipatory, like discovery is imminent, warm shimmer
```

**Frequency Characteristics:**
- Perfect 5th interval above root
- Slightly brighter than Ding 1
- Clean sine-like tone with subtle overtones
- Medium attack, longer decay than Ding 1

**Music Theory Principles:**
| Element | Value | Mathematical Basis |
|---------|-------|-------------------|
| Interval | Perfect 5th | 3:2 frequency ratio |
| Function | Dominant | Creates "forward motion" |
| Role | Bridge | Links question (4th) to answer (major) |

**Mathematical Foundation:**
```
If root = f₀, then Perfect 5th = f₀ × (3/2)
Example: 330Hz root → 495Hz (Perfect 5th above)

Interval progression:
  Ding 1 (4th): f₀ × 4/3 = 1.333f₀
  Ding 2 (5th): f₀ × 3/2 = 1.500f₀
  Ratio between: (3/2) ÷ (4/3) = 9/8 = Major 2nd
```

**Psychological Effect:**
- **Anticipation peak:** The 5th is the most "expectant" interval
- **Forward motion:** Brain perceives movement toward resolution
- **Openness:** Perfect 5ths evoke vastness and possibility (used in space/discovery themes)

---

### 6. Boot Chime (Major Resolution)
**File:** `boot-chime.mp3`
**Duration:** 3 seconds
**Volume:** 60%, fades in over 1.5 seconds
**Timing:** 14.07s (frame 422)

**Prompt Used:**
```
soft pleasant digital chime, gentle OS boot up sound, cheerful ascending tones
like a friendly computer awakening, bright and optimistic, clean modern beep
sequence, inspiring and warm, not retro but refined digital
```

**Frequency Characteristics:**
- Mid-high frequencies (400Hz-2kHz)
- Ascending pitch pattern (major tonality)
- Clean digital timbre
- Quick attack, medium decay

**Music Theory Principles:**
| Element | Value | Mathematical Basis |
|---------|-------|-------------------|
| Tonality | Major | Contains major 3rd (5:4 ratio) |
| Function | Tonic resolution | Returns to "home" |
| Role | Payoff | Releases all built tension |

**Mathematical Foundation:**
```
Major chord ratios: 4:5:6 (root:3rd:5th)
The ascending pattern moves: root → 3rd → 5th → octave
Each step increases frequency by simple integer ratios
```

**Psychological Effect:**
- **Resolution:** Releases tension built by pulses and ding tones
- **Dopamine release:** Ascending major patterns trigger reward response
- **Trust:** Clean digital sounds signal competence and modernity
- **Transition marker:** Clear signal that "something is beginning"

---

### 7. Wind Door Morning (Closing)
**File:** `wind-door-morning.mp3`
**Duration:** 8 seconds
**Volume:** 50%

**Prompt Used:**
```
gentle wind blowing through an open door into a bright sunlit room, peaceful
morning breeze with soft chimes, hopeful and serene, new beginnings, fresh
air and warmth
```

**Frequency Characteristics:**
- Broadband noise (wind): 200Hz-8kHz
- Sparse high-frequency chimes: 1-4kHz
- Natural, organic texture

**Psychological Effect:**
- **Openness:** Wind through door = threshold, opportunity
- **Hope:** Morning associations = new day, fresh start
- **Calm resolution:** Peaceful ending, no tension
- **Call to action reinforcement:** "The door is open, come in"

---

### 8. Finale Sound Effects (Door Opening Moment)

The finale features a dramatic "door opening" visual effect at frame 400 of the credits scene. Three layered sound effects create an ascending, resolving sonic experience that mirrors the visual metaphor of light flooding through an opening door.

#### 8a. Finale Ascend
**File:** `finale-ascend.mp3`
**Duration:** 3 seconds
**Volume:** 50% (fades in over 15 frames, fades out)
**Timing:** Frame 395 relative to credits start

**Prompt Used:**
```
Soft ascending synthesizer chord progression, starting low and rising to a
bright, hopeful major chord. Crystal clear, futuristic, elegant, minimal.
Like dawn breaking through a window. 3 seconds.
```

**Frequency Characteristics:**
- Ascending pitch contour (200Hz → 800Hz)
- Clean synthesizer timbre
- Major chord resolution at apex
- Gentle attack, sustained decay

**Psychological Effect:**
- **Rising hope:** Ascending pitch = forward momentum, optimism
- **Dawn metaphor:** Low-to-high frequency mirrors darkness-to-light
- **Continuation of harmonic arc:** Extends the 4th → 5th → Major progression

#### 8b. Finale Shimmer
**File:** `finale-shimmer.mp3`
**Duration:** 4 seconds
**Volume:** 40% (fades in over 20 frames)
**Timing:** Frame 420 relative to credits start

**Prompt Used:**
```
Gentle shimmering bells and soft synth pad, major key, warm and inviting.
Futuristic yet organic. Creates sense of opening, new beginnings. Simple
and elegant. 4 seconds.
```

**Frequency Characteristics:**
- High-frequency shimmer (2-6kHz)
- Bell-like transients
- Pad sustain in mid frequencies
- Stereo width for spaciousness

**Psychological Effect:**
- **Expansion:** Shimmer creates sense of space opening up
- **Wonder:** Bell tones continue the discovery/arrival feeling
- **Layering:** Adds texture without competing with ascend tone

#### 8c. Finale Resolve
**File:** `finale-resolve.mp3`
**Duration:** 2 seconds
**Volume:** 45% (fades in over 10 frames)
**Timing:** Frame 480 relative to credits start (when text appears)

**Prompt Used:**
```
Resolving synthesizer tone, perfect fifth interval ascending to octave.
Clean, pure, hopeful. Like the first light of a new day. Minimal, elegant,
futuristic. 2 seconds.
```

**Frequency Characteristics:**
- Perfect 5th interval (3:2 ratio)
- Resolution to octave (2:1 ratio)
- Pure sine-wave quality
- Quick attack, medium decay

**Musical Function:**
- Continues the established harmonic language (perfect intervals)
- 5th → octave mirrors the earlier 4th → 5th → major arc
- Final consonance creates sense of arrival and completion

**Psychological Effect:**
- **Completion:** Octave resolution = "home," arrival
- **Consistency:** Same interval vocabulary as intro creates bookend
- **Hopeful finality:** Major quality with forward momentum

### Finale Sound Stack Timing

```
Credits Frame:  395       420         480       540
                ↓         ↓           ↓         ↓
                Ascend    Shimmer     Resolve   (silence)
                │         │           │
                ▼         ▼           ▼
Volume:         ╱╲        ╱───╲       ╱╲
               ╱  ╲      ╱     ╲     ╱  ╲
              ╱    ╲____╱       ╲___╱    ╲____
```

The three sounds layer with staggered entrances:
1. **Ascend** (frame 395): Introduces the sonic event
2. **Shimmer** (frame 420): Adds sparkle as door opens wider
3. **Resolve** (frame 480): Punctuates text appearance with finality

This creates a 5-second sonic arc that precisely mirrors the visual door-opening effect.

---

## The Harmonic Progression: Question → Answer → Resolution

> **Core Principle:** The ding tones and boot chime form a deliberate harmonic progression based on classical music theory, designed to create and then satisfy psychological anticipation.

### The 4th → 5th → Major Progression

```
Time:     9.11s          11s            14.07s
          ↓              ↓              ↓
Tone:     Ding 1         Ding 2         Boot Chime
          (Perfect 4th)  (Perfect 5th)  (Major resolution)
          ↓              ↓              ↓
Feeling:  "Question"     "Answer        "Arrival"
                         coming..."
          ↓              ↓              ↓
Ratio:    4:3            3:2            4:5:6
```

### Mathematical Relationships

**Frequency Ratios (Just Intonation):**
| Interval | Ratio | Decimal | Cents |
|----------|-------|---------|-------|
| Perfect 4th | 4:3 | 1.333 | 498 |
| Perfect 5th | 3:2 | 1.500 | 702 |
| Major 3rd | 5:4 | 1.250 | 386 |
| Octave | 2:1 | 2.000 | 1200 |

**Why These Ratios Sound "Good":**
Simple integer ratios create wave interference patterns that the human auditory system evolved to perceive as consonant. The simpler the ratio, the more consonant:
- 2:1 (octave) = most consonant
- 3:2 (5th) = very consonant ("open" feeling)
- 4:3 (4th) = consonant but with slight tension
- 5:4 (major 3rd) = bright, happy

**The Circle of Fifths Connection:**
```
     C
   F   G     ← Our progression moves: subdominant (F) → dominant (G) → tonic (C)
  Bb     D      This is the most fundamental harmonic motion in Western music
   Eb   A
     Ab/G#
```

### Timing Analysis

| Transition | Duration | Frames | Effect |
|------------|----------|--------|--------|
| Ding 1 → Ding 2 | 1.9s | 57 | Short gap = building momentum |
| Ding 2 → Chime | 3.07s | 92 | Longer gap = sustained anticipation |
| Total arc | 4.97s | 149 | Complete tension-resolution cycle |

**Why the timing accelerates then decelerates:**
- Short gap (1.9s) between Ding 1 and 2: Creates sense of "things happening"
- Longer gap (3.07s) before chime: Maximizes anticipation before payoff
- This mirrors the "breath before the drop" in electronic music

---

## Volume Ducking: The 9-Second Dip

> **Technique:** At 9 seconds, both ambient and pulse volumes decrease by 25%, creating "headroom" for the melodic ding tones.

### Implementation

```
Frame 270 (9 seconds):
  Ambient: 35% → 26% (25% reduction)
  Pulse:   80% → 60% (25% reduction)
```

### Why Ducking Works

**1. Frequency Masking Prevention:**
Without ducking, the low-frequency pulse (80Hz) and mid-frequency ambient (100-400Hz) would partially mask the ding tones (400-800Hz). Reducing their volume clears spectral space.

**2. Psychoacoustic Contrast:**
The sudden (but smooth) volume reduction signals to the listener's brain that "something is changing." This primes attention for the incoming melodic content.

**3. Dynamic Range:**
Professional audio maintains a balance between loud and quiet. The dip creates contrast that makes the ding tones feel more significant without actually being louder.

### Volume Hierarchy (After 9s Dip)

```
Layer           Volume    Frequency Range    Role
─────────────────────────────────────────────────────
Ambient         26%       100-400Hz          Foundation
Pulse           60%       80Hz               Rhythm
Ding 1          50%       400-800Hz          Melody (setup)
Ding 2          45%       400-800Hz          Melody (bridge)
Boot Chime      →60%      400Hz-2kHz         Resolution
```

The slight decrease from Ding 1 (50%) to Ding 2 (45%) creates spatial depth—the second tone feels like it's "answering" from slightly further away.

---

## Sound Psychology Principles Applied

### 1. Frequency-Emotion Mapping

| Frequency Range | Feeling | Application in Video |
|-----------------|---------|---------------------|
| 20-80Hz (Sub-bass) | Power, presence, visceral | Original pulse base |
| 80-250Hz (Bass) | Warmth, foundation | Both pulses |
| 250-500Hz (Low-mid) | Body, fullness | Ambient pad |
| 500Hz-2kHz (Mid) | Clarity, voice range | Boot chime |
| 2-6kHz (Presence) | Excitement, attention | Chime harmonics |
| 6-20kHz (Air) | Sparkle, space | Wind, ambient shimmer |

### 2. Rhythm & Heart Rate Synchronization

**60 BPM = 1 beat per second = resting heart rate**

Research shows that rhythms near resting heart rate:
- Activate parasympathetic nervous system
- Reduce cortisol (stress hormone)
- Increase openness to new information
- Create sense of safety and trust

This is why meditation music, ASMR, and "focus" playlists often use 60 BPM.

### 3. Harmonic Intervals & Emotion

| Interval | Ratio | Feeling | Used For |
|----------|-------|---------|----------|
| Unison | 1:1 | Unity, power | Not used (too static) |
| Perfect 5th | 3:2 | Wonder, openness | Pulse harmony |
| Perfect 4th | 4:3 | Stability, question | Implicit in suspended chords |
| Major 3rd | 5:4 | Happiness, brightness | Boot chime |
| Minor 2nd | 16:15 | Tension, mystery | Avoided (too dissonant) |

### 4. Game Audio Principles (Nintendo/Zelda/Portal)

**Discoveries & Wonder:**
- Use perfect 5ths and octaves
- Ascending melodies for positive discovery
- Clean, pure tones (sine waves, bells)

**Anticipation:**
- Suspended chords (no resolution)
- Subtle rhythmic pulse
- Gradual pitch rise

**Trust & Safety:**
- Warm low frequencies
- Smooth envelopes (no harsh attacks)
- Consonant harmony

---

## Implementation in Remotion

```tsx
// Ambient - dips 25% at 9s, fades out before narration
<Audio
  src={staticFile("audio/ambient-tech.mp3")}
  volume={(f) => interpolate(
    f,
    [0, 260, 290, problem.start - 70, problem.start + 20],
    [0.35, 0.35, 0.26, 0.26, 0],  // 35% → 26% at 9s
    { extrapolateRight: "clamp" }
  )}
/>

// Original pulse - deeper, fades out as smooth takes over
<Audio
  src={staticFile("audio/original-pulse.mp3")}
  volume={(f) => interpolate(f, [0, 30, 150, 210], [0, 0.7, 0.7, 0])}
/>

// Smooth pulse - crossfades in, dips at 9s, continues to boot chime
<Audio
  src={staticFile("audio/curiosity-pulse.mp3")}
  volume={(f) => {
    const duration = 422 - 150;  // Sequence duration
    // Dip from 80% to 60% at 9s (frame 120 relative to sequence start)
    return interpolate(
      f,
      [0, 60, 110, 140, duration - 20, duration],
      [0, 0.8, 0.8, 0.6, 0.6, 0],
      { extrapolateRight: "clamp" }
    );
  }}
/>

// Ding tone 1 - Perfect 4th interval at 9.11s
<Sequence from={273}>
  <Audio src={staticFile("audio/ding-tone.mp3")} volume={0.5} />
</Sequence>

// Ding tone 2 - Perfect 5th interval at 11s
<Sequence from={330}>
  <Audio src={staticFile("audio/ding-tone-2.mp3")} volume={0.45} />
</Sequence>

// Boot chime - Major resolution, fades in gradually at 14.07s
<Sequence from={422}>
  <Audio
    src={staticFile("audio/boot-chime.mp3")}
    volume={(f) => interpolate(f, [0, 45], [0, 0.6])}
  />
</Sequence>

// Closing wind - plays during credits
<Audio src={staticFile("audio/wind-door-morning.mp3")} volume={0.5} />
```

---

## Crossfade Technique

The transition from Original Pulse to Smooth Pulse uses a crossfade:

```
Frames 150-210 (5-7 seconds):
  - Original Pulse: 70% → 0%
  - Smooth Pulse: 0% → 80%
```

This creates seamless continuity while the character of the sound subtly shifts from "deep and mysterious" to "smooth and anticipatory."

---

## ElevenLabs API Reference

**Endpoint:** `https://api.elevenlabs.io/v1/sound-generation`

**Parameters:**
```json
{
  "text": "Description of desired sound",
  "duration_seconds": 3-22,
  "prompt_influence": 0.3-0.7
}
```

**Prompt Influence:**
- `0.3` = More creative interpretation
- `0.5` = Balanced
- `0.7` = Closer to literal prompt

---

## File Locations

### Sound Effects

| File | Location | Role |
|------|----------|------|
| `ambient-tech.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Atmospheric foundation |
| `original-pulse.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Deep curiosity trigger |
| `curiosity-pulse.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Sustained anticipation |
| `ding-tone.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Perfect 4th (harmonic setup) |
| `ding-tone-2.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Perfect 5th (harmonic bridge) |
| `boot-chime.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Major resolution |
| `wind-door-morning.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Hopeful closing ambience |
| `finale-ascend.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Ascending chord (door opening) |
| `finale-shimmer.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Shimmering bells (layered texture) |
| `finale-resolve.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Perfect 5th resolution (completion) |
| `reactor-hum.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | ~~Spaceship reactor ambient~~ (DEPRECATED - not used) |
| `energy-pulse.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | ~~Energy pulse~~ (DEPRECATED - not used) |
| `vo-finale-cta.mp3` | `MAIN/legacy-core/oni-product-demo/public/audio/` | Final call to action (Lily voice) |
| This documentation | `MAIN/legacy-core/resources/sound-engineering/` | Reference |

### Voiceovers

| File | Voice | Role |
|------|-------|------|
| `vo-problem.mp3` | Jay Wayne (Male, American) | Problem scene narration |
| `vo-layers.mp3` | Jay Wayne (Male, American) | 14-layer model explanation |
| `vo-coherence.mp3` | Jay Wayne (Male, American) | Coherence metric explanation |
| `vo-tara.mp3` | Jay Wayne (Male, American) | TARA platform overview |
| `vo-academic.mp3` | Jay Wayne (Male, American) | Academic foundation |
| `vo-cta.mp3` | Jay Wayne (Male, American) | Call to action |
| `vo-credits.mp3` | Jay Wayne (Male, American) | Opening credits manifesto |
| `vo-finale-lily.mp3` | Lily (Female, British) | Finale welcome announcement |
| `vo-finale-cta.mp3` | Lily (Female, British) | Final call to action |

---

## Voice Configuration

### Primary Narrator: Jay Wayne
**Voice ID:** `8Ln42OXYupYsag45MAUy`
**Description:** Wise University Professor
**Provider:** ElevenLabs (Shared Voice Library)

**Voice Settings:**
```json
{
  "stability": 0.5,
  "similarity_boost": 0.75,
  "style": 0.5,
  "use_speaker_boost": true
}
```

**Character:** Authoritative, knowledgeable, trustworthy. Creates sense of expertise and credibility throughout the technical explanations.

---

### Finale Narrator: Lily
**Voice ID:** `pFZP5JQG7iQjIQuC4Bku`
**Description:** Velvety Actress (British)
**Provider:** ElevenLabs (Standard Voice Library)

**Voice Settings (Bold Configuration):**
```json
{
  "stability": 0.35,
  "similarity_boost": 0.85,
  "style": 0.6,
  "use_speaker_boost": true
}
```

**Character:** Strong, protective, intelligent. British accent conveys authority and sophistication. Lower stability and higher style create dramatic, commanding delivery befitting "protection, power, intelligence."

**Text Delivered:**
> "Welcome to the OSI of Mind. ... This is ONI. The future of neural security... starts now."

---

### Finale CTA Narrator: Lily (Encouraging Configuration)
**Voice ID:** `pFZP5JQG7iQjIQuC4Bku`
**Description:** Velvety Actress (British)
**Provider:** ElevenLabs (Standard Voice Library)

**Voice Settings (Encouraging Configuration):**
```json
{
  "stability": 0.45,
  "similarity_boost": 0.75,
  "style": 0.5,
  "use_speaker_boost": true
}
```

**Character:** Less bold, more encouraging and excited. Higher stability creates warmer, more inviting delivery for the final call to action.

**Text Delivered:**
> "So... what are you waiting for?"

**File:** `vo-finale-cta.mp3`
**Duration:** ~1.81 seconds
**Timing:** Frame 1050 relative to credits start (3:44 into video)

---

## Orchestrated Closing Sequence (Finale Bookend)

> **The closing mirrors the intro's harmonic progression (4th → 5th → Major), creating satisfying bookends to the video.**

### Closing Sequence Timeline

| Frame (from credits) | Absolute Time | Sound | Volume | Purpose |
|---------------------|---------------|-------|--------|---------|
| 670 | 3:31 | Ding Tone 1 (Perfect 4th) | 55% | "Question" - signals closing |
| 700 | 3:32 | Ding Tone 2 (Perfect 5th) | 50% | "Answer" - builds to resolution |
| 725 | 3:33 | Boot Chime (Major) | 60%→0% | "Resolution" - final closure |
| 760 | 3:34 | Ambient Tech (reprise) | 0%→30%→0% | Bookend atmosphere |
| 780 | 3:35 | Curiosity Pulse (reprise) | 0%→50%→0% | 60 BPM heartbeat returns |
| 1050 | 3:44 | Finale CTA Voice | 90% | "So... what are you waiting for?" |

### Implementation

```tsx
{/* ═══ Orchestrated Closing Sequence ═══ */}
{/* Mirrors the intro's 4th → 5th → Major progression */}

{/* Ding tone 1 - Perfect 4th, signals closing */}
<Sequence from={credits.start + 670}>
  <Audio src={staticFile("audio/ding-tone.mp3")} volume={0.55} />
</Sequence>

{/* Ding tone 2 - Perfect 5th, builds to resolution */}
<Sequence from={credits.start + 700}>
  <Audio src={staticFile("audio/ding-tone-2.mp3")} volume={0.5} />
</Sequence>

{/* Boot chime - Major resolution, final closure */}
<Sequence from={credits.start + 725}>
  <Audio
    src={staticFile("audio/boot-chime.mp3")}
    volume={(f) => interpolate(f, [0, 30, 60, 90], [0, 0.6, 0.5, 0], {
      extrapolateRight: "clamp",
    })}
  />
</Sequence>

{/* ═══ Ambient + Pulse Reprise - Bookends the video ═══ */}
{/* Same ambient + pulse from intro returns, creating satisfying closure */}

{/* Ambient tech atmosphere - fades in after chime */}
<Sequence from={credits.start + 760} durationInFrames={credits.end - credits.start - 760}>
  <Audio
    src={staticFile("audio/ambient-tech.mp3")}
    volume={(f) => {
      const duration = credits.end - credits.start - 760;
      return interpolate(
        f,
        [0, 60, duration - 90, duration],
        [0, 0.30, 0.30, 0],
        { extrapolateRight: "clamp" }
      );
    }}
  />
</Sequence>

{/* Curiosity pulse - the 60 BPM heartbeat returns */}
<Sequence from={credits.start + 780} durationInFrames={credits.end - credits.start - 780}>
  <Audio
    src={staticFile("audio/curiosity-pulse.mp3")}
    volume={(f) => {
      const duration = credits.end - credits.start - 780;
      return interpolate(
        f,
        [0, 45, duration - 90, duration],
        [0, 0.5, 0.5, 0],
        { extrapolateRight: "clamp" }
      );
    }}
  />
</Sequence>

{/* ═══ Final CTA at 3:44 ═══ */}
{/* "So... what are you waiting for?" - then 10s ambient, then cut */}
<Sequence from={credits.start + 1050}>
  <Audio src={staticFile("audio/vo-finale-cta.mp3")} volume={0.9} />
</Sequence>
```

### Psychological Arc of the Closing

```
Voiceover ends → Ding 1 (4th) → Ding 2 (5th) → Boot Chime (Major)
     ↓               ↓              ↓               ↓
   Silence       Question        Answer          Resolution
                   ↓               ↓               ↓
               Attention        Anticipation      Reward

       → Ambient + Pulse Reprise → Final CTA → Ambient → End
               ↓                      ↓            ↓
           Familiarity            Challenge      Calm
               ↓                      ↓
        "Remember the intro?"   "Take action!"
```

**Why reprise the intro sounds?**
- **Familiarity:** Viewer's subconscious recognizes the sounds from 3+ minutes ago
- **Closure:** Musical concept of "recapitulation" - returning to opening material
- **Emotional anchor:** The calming 60 BPM pulse re-activates the positive state from the intro
- **Professional polish:** Bookending is a hallmark of polished media production

---

## Reactor Hum (DEPRECATED - Not Used)

> **Note:** `reactor-hum.mp3` was generated but rejected during production. The user preferred reusing the original `ambient-tech.mp3` and `curiosity-pulse.mp3` from the intro to create a bookend effect. The reactor hum file remains in the audio folder but is not used in the final video.

---

## Neuroscience of the Sound Design

> **Why does this progression work?** The answer lies in how the human brain processes sound.

### Auditory Cortex Processing

**1. Predictive Coding:**
The brain constantly predicts what sound comes next. When we hear the Perfect 4th (Ding 1), the auditory cortex generates predictions about resolution. The Perfect 5th (Ding 2) partially satisfies this while creating new expectations. The major chime fully resolves the prediction, triggering a reward response.

```
Prediction Error Cycle:
  Ding 1 → High prediction error (unexpected)
       → Brain: "What's coming next?"
  Ding 2 → Medium prediction error (expected interval)
       → Brain: "Resolution is near"
  Chime → Low prediction error (satisfied expectation)
       → Brain: Dopamine release
```

**2. Entrainment:**
The 60 BPM pulse rate synchronizes with the body's parasympathetic nervous system (rest-and-digest). This creates physiological calm, making the viewer more receptive to the melodic content.

**3. Frequency-to-Emotion Mapping:**
| Brain Region | Frequency Sensitivity | Emotional Association |
|--------------|----------------------|----------------------|
| Amygdala | 20-80Hz (sub-bass) | Alertness, presence |
| Inferior colliculus | 100-400Hz | Safety, warmth |
| Auditory cortex | 400Hz-4kHz | Speech, meaning |
| Limbic system | Simple ratios (3:2, 4:3) | Consonance, pleasure |

### The Tension-Release Mechanism

**Psychological Arc:**
```
Phase 1 (0-9s): IMMERSION
├── Low frequencies establish presence
├── 60 BPM syncs with heart rate
└── Suspended harmony creates mild tension

Phase 2 (9-14s): ANTICIPATION
├── Volume dip signals change
├── Ding 1 (4th) poses "question"
├── Ding 2 (5th) implies "answer coming"
└── Brain's prediction engine fully engaged

Phase 3 (14s+): RESOLUTION
├── Boot chime resolves all tension
├── Major tonality = positive emotion
├── Ascending pattern = reward, arrival
└── Viewer primed for content reception
```

### Why This Matters for the ONI Video

The viewer enters the narration (15.67s) in an optimal psychological state:
- **Calm** (60 BPM entrainment)
- **Attentive** (prediction satisfaction = engaged)
- **Positive** (major resolution = good mood)
- **Open** (tension released = receptive to new information)

This is the same principle used in:
- Apple product reveals (building anticipation)
- Nintendo discovery sounds (wonder and reward)
- Film scoring (tension-resolution arcs)

---

## References

### Music Theory & Emotion
1. Huron, D. (2006). *Sweet Anticipation: Music and the Psychology of Expectation*. MIT Press.
2. Juslin, P. N., & Sloboda, J. A. (2010). *Handbook of Music and Emotion: Theory, Research, Applications*. Oxford University Press.
3. Lerdahl, F., & Jackendoff, R. (1983). *A Generative Theory of Tonal Music*. MIT Press.

### Neuroscience of Music
4. Zatorre, R. J., & Salimpoor, V. N. (2013). From perception to pleasure: Music and its neural substrates. *PNAS*, 110(Supplement 2), 10430-10437.
5. Koelsch, S. (2014). Brain correlates of music-evoked emotions. *Nature Reviews Neuroscience*, 15(3), 170-180.
6. Blood, A. J., & Zatorre, R. J. (2001). Intensely pleasurable responses to music correlate with activity in brain regions implicated in reward and emotion. *PNAS*, 98(20), 11818-11823.

### Psychoacoustics & Entrainment
7. Moore, B. C. J. (2012). *An Introduction to the Psychology of Hearing* (6th ed.). Brill.
8. Thaut, M. H. (2005). *Rhythm, Music, and the Brain: Scientific Foundations and Clinical Applications*. Routledge.
9. Trost, W., Frühholz, S., Schön, D., Labbé, C., Pichon, S., Grandjean, D., & Vuilleumier, P. (2014). Getting the beat: Entrainment of brain activity by musical rhythm and pleasantness. *NeuroImage*, 103, 55-64.

### Game Audio Design
10. Collins, K. (2008). *Game Sound: An Introduction to the History, Theory, and Practice of Video Game Music and Sound Design*. MIT Press.
11. Nintendo Sound Team design philosophy (Koji Kondo, Zelda/Mario series)
12. Huiberts, S., & van Tol, R. (2008). IEZA: A framework for game audio. *Gamasutra*.

### Frequency-Emotion Mapping
13. Hevner, K. (1936). Experimental studies of the elements of expression in music. *American Journal of Psychology*, 48(2), 246-268.
14. Gabrielsson, A., & Lindström, E. (2010). The role of structure in the musical expression of emotions. In *Handbook of Music and Emotion* (pp. 367-400). Oxford University Press.

### Just Intonation & Consonance
15. Helmholtz, H. von (1877/1954). *On the Sensations of Tone*. Dover Publications.
16. Bowling, D. L., & Purves, D. (2015). A biological rationale for musical consonance. *PNAS*, 112(36), 11155-11160.

---

---

## Complete Audio Inventory

### Sound Effects (Used)

| File | Duration | Purpose | Timing (Absolute) |
|------|----------|---------|-------------------|
| `ambient-tech.mp3` | 22s | Atmospheric foundation | 0:00-0:17, 3:34-3:56 |
| `original-pulse.mp3` | 8s | Deep curiosity trigger | 0:00-0:07 |
| `curiosity-pulse.mp3` | 12s | Sustained anticipation | 0:05-0:14, 3:35-3:56 |
| `ding-tone.mp3` | 2s | Perfect 4th (question) | 0:09, 3:31 |
| `ding-tone-2.mp3` | 2s | Perfect 5th (bridge) | 0:11, 3:32 |
| `boot-chime.mp3` | 3s | Major resolution | 0:14, 3:33 |
| `wind-door-morning.mp3` | 8s | Hopeful closing ambience | 3:09+ |
| `finale-ascend.mp3` | 3s | Door opening chord | 3:22 |
| `finale-shimmer.mp3` | 4s | Shimmering bells | 3:23 |

### Voiceovers (Used)

| File | Voice | Scene | Duration |
|------|-------|-------|----------|
| `vo-problem.mp3` | Jay Wayne | Problem Statement | ~25s |
| `vo-layers.mp3` | Jay Wayne | 14-Layer Model | ~40s |
| `vo-coherence.mp3` | Jay Wayne | Coherence Metric | ~30s |
| `vo-tara.mp3` | Jay Wayne | TARA Platform | ~35s |
| `vo-academic.mp3` | Jay Wayne | Academic Foundation | ~19s |
| `vo-cta.mp3` | Jay Wayne | Call to Action | ~25s |
| `vo-credits.mp3` | Jay Wayne | Credits Manifesto | ~11s |
| `vo-finale-lily.mp3` | Lily (British) | Finale Welcome | ~7.94s |
| `vo-finale-cta.mp3` | Lily (British) | Final CTA | ~1.81s |

### Deprecated/Unused Files

| File | Reason Not Used |
|------|-----------------|
| `reactor-hum.mp3` | Rejected - too dark sounding; replaced with ambient/pulse reprise |
| `energy-pulse.mp3` | Rejected - user preferred original intro sounds |
| `finale-resolve.mp3` | Superseded by orchestrated closing sequence |
| `vo-coldOpen.mp3` | Cold open has no voiceover in final version |
| `vo-title.mp3` | Title scene has no voiceover in final version |
| `vo-finale-welcome.mp3` | Earlier version, replaced by `vo-finale-lily.mp3` |
| `p1-bci.mp3` through `p6-security.mp3` | Legacy segmented voiceovers, replaced by unified tracks |
| `pulse-tone.mp3` | Earlier version, replaced by refined curiosity-pulse |
| `voiceover.mp3` | Full narration (not segmented), unused |

---

## Voice Generation Reference

### ElevenLabs Voice IDs

| Voice | ID | Description |
|-------|-----|-------------|
| Jay Wayne | `8Ln42OXYupYsag45MAUy` | Wise University Professor (Male, American) |
| Lily | `pFZP5JQG7iQjIQuC4Bku` | Velvety Actress (Female, British) |

### Voice Settings Quick Reference

**Jay Wayne (Primary Narrator):**
```json
{ "stability": 0.5, "similarity_boost": 0.75, "style": 0.5, "use_speaker_boost": true }
```

**Lily - Bold (Finale Welcome):**
```json
{ "stability": 0.35, "similarity_boost": 0.85, "style": 0.6, "use_speaker_boost": true }
```

**Lily - Encouraging (Finale CTA):**
```json
{ "stability": 0.45, "similarity_boost": 0.75, "style": 0.5, "use_speaker_boost": true }
```

---

*Last Updated: 2026-01-29*

*Tags: #sound-design #audio #psychology #music-theory #neuroscience #harmonic-progression #elevenlabs #remotion #oni-video*
