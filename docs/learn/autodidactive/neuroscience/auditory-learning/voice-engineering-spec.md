# Voice Engineering Specification: Deep Encode

The exact dynamic quantifiers for producing hypnotic learning audio via ElevenLabs + post-processing.

---

## The Five API Knobs

ElevenLabs exposes five voice parameters. None of them are acoustic primitives (F0, formants, jitter). They control the **model's sampling behavior** -- how much variation, identity fidelity, expressiveness, and rate the model targets during generation.

| Parameter | Range | What It Actually Does |
|-----------|-------|----------------------|
| `stability` | 0.0-1.0 | **Sampling temperature.** Low = wider distribution = more prosodic variation, breathiness, emotional range. High = narrower = monotone, steady, predictable. |
| `similarity_boost` | 0.0-1.0 | **Voice conditioning strength.** How closely output adheres to the reference voice's timbre and character. High = faithful to source; reproduces noise if present. |
| `style` | 0.0-1.0 | **Style exaggeration.** Amplifies speaking mannerisms, rhythm, expressiveness. High = more character but less stable. ElevenLabs recommends 0 for most use. |
| `speed` | 0.7-1.2 | **Generation rate.** Model-level (not time-stretch). Pitch-preserving but quality degrades below 0.7 or above 1.2. |
| `use_speaker_boost` | bool | **Additional processing pass.** Subtle identity enhancement. Adds latency. |

**What's missing from the API:**
- No pitch (F0) control -- at all
- No volume/gain control
- No `<prosody>` SSML
- No emphasis tag
- No timbre/EQ control

These gaps are filled by: (a) text engineering, (b) post-processing with FFmpeg/Sox/librosa, (c) model selection.

---

## The Dynamic Arc: 27 Minutes in Numbers

The session follows the U-curve (Soma et al., 2021). Every parameter changes across five phases. Here are the exact values:

### Phase 1: Ambient Onset (0:00-0:30)

No voice. Drone fades in. Listener orients.

### Phase 2: Induction (0:30-2:30)

**Goal:** Establish rapport, guide attention, begin parasympathetic activation.

```json
{
  "stability": 0.40,
  "similarity_boost": 0.70,
  "style": 0.45,
  "use_speaker_boost": true,
  "speed": 0.85
}
```

| Quantifier | Value | Research Basis |
|-----------|-------|---------------|
| Speed | 0.85 (~128 WPM) | Above meditation range, still below conversational (~150). Establishes measured pace without feeling artificially slow. |
| Stability | 0.40 | Moderate variation. Warm, slightly breathy, natural. Not yet at trance depth. |
| Style | 0.45 | Understated but present. The voice has personality, not robotic. |
| Similarity | 0.70 | Strong identity. Listener bonds with a consistent voice character. |
| Pauses | 1.5-2.0s between sentences | `<break time="1.5s" />` -- phonological loop refresh, not yet encoding windows. |
| Text pattern | Full sentences, contractions, soft conjunctions | "Allow your focus to soften... you don't need to stop what you're doing..." |
| Post-process pitch shift | 0 semitones (baseline) | Starting register. |
| Post-process volume | 0 dB (reference level, -20 LUFS target) | Comfortable background level. |
| Post-process EQ | Flat (no darkening yet) | Natural voice timbre. |

### Phase 3: Deepening (2:30-4:00)

**Goal:** Progressive descent. Lower pitch, slower rate, reduced energy. The critical phase where Montgomery et al. found 45% of trainees fail.

```json
{
  "stability": 0.50,
  "similarity_boost": 0.70,
  "style": 0.30,
  "use_speaker_boost": true,
  "speed": 0.78
}
```

| Quantifier | Value | Research Basis |
|-----------|-------|---------------|
| Speed | 0.78 (~117 WPM) | Descending toward content rate. Each sentence slightly slower than the last. |
| Stability | 0.50 | More consistent/predictable. Less variation = more rhythmic regularity = better neural coupling (Hasson). |
| Style | 0.30 | Energy dropping. Less performative. Inner-voice quality emerging. |
| Pauses | 3.0-5.0s between sentences | `<break time="4.0s" />` -- breathing space. 5s pause = one exhale at 6 breaths/min. |
| Text pattern | Shorter sentences. Trailing ellipses. Fewer words per line. | "Each breath takes you deeper... <break time="4.0s" /> And with each exhale... the noise matters less. <break time="5.0s" />" |
| Post-process pitch shift | **-1.0 semitone** | This is the missing control. Apply globally to this phase. Montgomery: pitch MUST descend during deepening. |
| Post-process volume | **-2 dB** from baseline | Beginning the volume descent. Quieter = more intimate (ASMR research). |
| Post-process EQ | Low-pass at 10 kHz, -2 dB shelf above 6 kHz | Beginning timbral darkening. Zoghaib: "dull" (not bright) = persuasion. |

### Phase 4: Content Delivery (4:00-18:00)

**Goal:** Core learning material at maximum receptivity. Lowest pitch, slowest rate, most predictable rhythm, longest pauses. This is the trough of the U-curve.

```json
{
  "stability": 0.55,
  "similarity_boost": 0.70,
  "style": 0.25,
  "use_speaker_boost": true,
  "speed": 0.75
}
```

| Quantifier | Value | Research Basis |
|-----------|-------|---------------|
| Speed | 0.75 (~113 WPM) | Below phonological loop saturation. Slow enough for hippocampal binding (Craik & Lockhart). |
| Stability | 0.55 | Highest stability in the session. Maximum predictability = maximum neural coupling. Rhythmically regular = pendulum-like. |
| Style | 0.25 | Minimal energy. Quiet authority. The words carry the weight, not the delivery. |
| Pauses after key concepts | 4.0-6.0s | `<break time="5.0s" />` -- hippocampal binding window + one full exhale at resonant breathing rate. |
| Pauses between clauses | 2.0s | `<break time="2.0s" />` -- working memory consolidation. |
| Text pattern | Embedded commands. Presuppositions. Sensory anchoring. Short concept clusters. | See text engineering section below. |
| Post-process pitch shift | **-1.5 to -2.0 semitones** from baseline | Deepest register. Klofstad: 40 Hz drop = 13.9% more influence. -2 semitones on a ~200 Hz female voice is roughly -24 Hz -- proportionally significant. |
| Post-process volume | **-3 to -4 dB** from baseline | Near-whisper territory. ASMR range. Intimate proximity signal. |
| Post-process EQ | Low-pass at 8 kHz, -4 dB shelf above 5 kHz | Full dark timbre. Reduced sibilance. Warm, resonant. |

**Within Phase 4, two sub-modes alternate:**

**Content delivery** `[suggestion]`:
```json
{ "stability": 0.55, "style": 0.25, "speed": 0.75 }
```

**Key term emphasis** `[emphasis]`:
```json
{ "stability": 0.50, "style": 0.35, "speed": 0.72 }
```

The emphasis tag has *slightly* lower stability (more variation = slightly more energy) and *slightly* higher style (more expressiveness) with *slightly* slower speed (the stressed word stretches). This is the prosodic "highlight marker" (Frazier et al., 2006). The difference is subtle -- 0.05-0.10 on each axis -- because we're marking importance within a calm baseline, not shouting.

### Phase 5: Reinforcement (18:00-22:00)

**Goal:** Spaced repetition of key concepts. TMR chime pairing. Still in the trough but beginning to lift.

```json
{
  "stability": 0.50,
  "similarity_boost": 0.70,
  "style": 0.30,
  "use_speaker_boost": true,
  "speed": 0.78
}
```

| Quantifier | Value | Research Basis |
|-----------|-------|---------------|
| Speed | 0.78 | Slightly faster than content phase. Beginning ascent. |
| Stability | 0.50 | Slightly less rigid than content. More variation returns. |
| Style | 0.30 | Warming back up. |
| Pauses | Expanding: 8s, 12s, 15s, 20s between repetitions | Spacing effect (Cepeda et al., 2006). Expanding gaps = stronger long-term retention. |
| TMR chime | 1000 Hz sine, 100ms, 10ms attack/release, -30 dB relative to voice | Precedes each key concept. Distinctive, non-startling. This chime becomes the sleep replay cue. |
| Post-process pitch shift | **-1.0 semitone** | Rising back from -2.0. |
| Post-process volume | **-2 dB** from baseline | Rising from -4 dB. |
| Post-process EQ | Low-pass at 9 kHz, -3 dB shelf above 5 kHz | Still dark, but opening up slightly. |

### Phase 6: Emergence (22:00-25:00)

**Goal:** Return to waking alertness. Energy rising, pitch rising, rate increasing. Montgomery et al.: the alerting phase must sound energetic (48% failure rate when it doesn't).

```json
{
  "stability": 0.35,
  "similarity_boost": 0.70,
  "style": 0.50,
  "use_speaker_boost": true,
  "speed": 0.88
}
```

| Quantifier | Value | Research Basis |
|-----------|-------|---------------|
| Speed | 0.88 (~132 WPM) | Approaching conversational. Noticeably faster than content phase. |
| Stability | 0.35 | More variation = more dynamic energy. Voice "waking up." |
| Style | 0.50 | Most expressive phase since induction. Conviction returning. |
| Pauses | 1.5-2.0s | Shorter. Momentum. |
| Text pattern | More direct. Slightly longer sentences. Forward-looking language. | "Bring your full attention back... feeling clear and focused... carrying what you've absorbed." |
| Post-process pitch shift | **0 semitones** (return to baseline) | Full ascent. Voice returns to natural register. |
| Post-process volume | **0 dB** (return to baseline) | Back to full presence. |
| Post-process EQ | Flat (natural timbre) | Brightness returns. Signal that the session is ending. |

### Phase 7: Ambient Fade (25:00-26:00)

No voice. Drone fades out over 60 seconds.

---

## The Complete Arc Visualized

```
Parameter    Induction  Deepening  Content    Reinforce  Emergence
             (0:30)     (2:30)     (4:00)     (18:00)    (22:00)

Speed        0.85 ───── 0.78 ───── 0.75 ───── 0.78 ───── 0.88
Stability    0.40 ───── 0.50 ───── 0.55 ───── 0.50 ───── 0.35
Style        0.45 ───── 0.30 ───── 0.25 ───── 0.30 ───── 0.50
Pitch shift  0 st ───── -1.0 st── -2.0 st── -1.0 st── 0 st
Volume       0 dB ───── -2 dB ──── -4 dB ──── -2 dB ──── 0 dB
LPF cutoff   flat ───── 10k ────── 8k ──────── 9k ──────── flat
Pause (sec)  1.5-2.0 ── 3.0-5.0 ── 4.0-6.0 ── 8-20 ───── 1.5-2.0

                    ▼ DESCENT ▼              ▲ ASCENT ▲
              ─────────────────────────────────────────────
              ██████                                 ██████
              ██████████                       ██████████
                    ██████████         ██████████
                          ████████████████
                          (CONTENT TROUGH)
```

---

## Post-Processing Pipeline

ElevenLabs outputs raw audio. All pitch, volume, EQ, and dynamics are applied after generation.

### Per-Segment Processing

Each segment is generated with its phase-appropriate API settings, then post-processed:

```bash
# Phase 4 (Content) example -- full post-processing chain
# Pitch: -2 semitones
# Volume: -4 dB with narrow dynamics
# EQ: dark timbre (LPF 8kHz, shelf -4dB above 5kHz)
# Compression: tight for consistent background level

sox input.wav output.wav \
  pitch -200 \                          # -2 semitones (in cents)
  gain -4 \                             # -4 dB
  lowpass 8000 \                        # LPF at 8 kHz
  treble -4 5000 \                      # -4 dB shelf above 5 kHz
  compand 0.5,2 -60,-60,-25,-25,0,-10 \# compression
  rate 48000                            # output sample rate

# OR with FFmpeg (single pass):
ffmpeg -i input.mp3 -af \
  "asetrate=44100*0.8909,aresample=44100,\
   volume=-4dB,\
   lowpass=f=8000,\
   treble=g=-4:f=5000:t=s,\
   acompressor=threshold=-25dB:ratio=4:attack=500:release=2000,\
   loudnorm=I=-20:LRA=7:TP=-2.0" \
  -ar 48000 output.mp3
```

Note: `asetrate` pitch shift changes pitch AND speed simultaneously. For pitch-only shift, use `rubberband` filter (requires librosa) or Sox `pitch` command. For production, use **librosa** in Python for clean pitch-shifting without time distortion:

```python
import librosa
import soundfile as sf

# Load segment
y, sr = librosa.load('segment.wav', sr=44100)

# Pitch shift: -2 semitones, time-preserved
y_shifted = librosa.effects.pitch_shift(y, sr=sr, n_steps=-2)

# Write
sf.write('segment_shifted.wav', y_shifted, sr)
```

### Phase-Specific Post-Processing Table

| Phase | Pitch (semitones) | Volume (dB) | LPF (Hz) | Treble Shelf (dB @ 5kHz) | Compression Ratio |
|-------|-------------------|-------------|-----------|--------------------------|-------------------|
| Induction | 0 | 0 | flat | 0 | 3:1 |
| Deepening | -1.0 | -2 | 10,000 | -2 | 3:1 |
| Content | -1.5 to -2.0 | -3 to -4 | 8,000 | -4 | 4:1 |
| Reinforcement | -1.0 | -2 | 9,000 | -3 | 3:1 |
| Emergence | 0 | 0 | flat | 0 | 3:1 |

### Global Post-Processing (applied to final mix)

```bash
# After all segments are stitched with ambient layers:
ffmpeg -i full_session.wav -af \
  "loudnorm=I=-20:LRA=7:TP=-2.0,\
   aecho=0.8:0.88:60:0.20" \
  -ar 48000 full_session_final.mp3
```

| Step | Setting | Why |
|------|---------|-----|
| Loudness | -20 LUFS (vs. -16 for podcast) | Background listening level |
| LRA | 7 (vs. 11 for podcast) | Narrower dynamics for consistent background |
| True peak | -2.0 dBTP | Prevents clipping on lossy codecs |
| Reverb | 60ms delay, 0.20 wet/dry | Warmer, more spacious than conversational Vox (40ms/0.30) |

---

## Text Engineering: Controlling What the API Can't

Since ElevenLabs has no `<prosody>` tag, pitch contour within a single segment must be controlled through text patterns that the model interprets prosodically.

### Punctuation as Pitch Control

| Text Pattern | What It Does to F0 | Use |
|-------------|-------------------|-----|
| Period (.) | Falling terminal contour | Suggestion finality: "This is how memory works." |
| Ellipsis (...) | Falling with continuation expectation | Deepening: "And with each breath..." |
| Comma (,) | Slight rise (list continuation) | Building: "the hippocampus, the cortex, the thalamus" |
| ALL CAPS on key word | Local F0 spike + duration increase | Emphasis: "this is where THETA drives encoding" |
| Short sentence after long one | Pitch contrast (reset lower) | Punch: "The entire auditory pipeline processes sound through twelve relay stages before you become conscious of hearing anything at all. Then you understand." |
| Question mark (?) | Rising terminal contour | AVOID during deepening (rises = uncertainty = breaks trance) |

### Sentence Length as Energy Control

| Phase | Avg. Words Per Sentence | Pattern |
|-------|------------------------|---------|
| Induction | 8-12 | Medium, flowing. Conversational. |
| Deepening | 4-8 | Short. Trailing. Spacious. |
| Content | 6-15 (mixed) | Concept sentence (10-15) followed by anchor (4-6) |
| Reinforcement | 3-6 | Key terms only. Sparse. |
| Emergence | 8-12 | Returning to conversational length. |

### The Embedded Command Pattern

Erickson tradition: embed the learning point inside a permissive frame. The key term gets prosodic emphasis (CAPS or slight separation):

```
[suggestion] You might notice that THETA OSCILLATIONS
drive memory encoding... <break time="4.0s" />
and that becomes something you simply know.
```

The frame ("you might notice that... becomes something you simply know") bypasses the critical faculty. The capitalized phrase is the payload. ElevenLabs will naturally stress the caps.

### Presupposition Pattern

Presuppose that encoding has occurred:

```
[suggestion] When you recall this later...
and you will... <break time="2.0s" />
the connection between hippocampal theta
and memory consolidation will feel familiar.
<break time="5.0s" />
As if you've always known it.
```

"When you recall" presupposes recall. "You will" reinforces. "Will feel familiar" presupposes the memory exists. The dACC (if quieted by the trance state) doesn't flag these presuppositions for evaluation.

### Breathing-Synchronized Clause Structure

Target: 6 breaths/min = 10-second cycles (4s inhale, 6s exhale).

At 113 WPM (content phase), 4 seconds of speech is ~7-8 words. One concept clause. Then a 6-second pause (exhale window).

```
[suggestion] The auditory nerve carries timing information...
<break time="6.0s" />
with ten-microsecond precision.
<break time="6.0s" />
Faster than any conscious thought.
<break time="6.0s" />
```

Each clause fits one inhale. Each pause spans one exhale. The listener's breathing naturally locks to this rhythm without being told to (if the breathing pacer has already established the 6/min pattern).

---

## Voice Selection: Lily vs. Alternatives

### Current Voice: Lily (ElevenLabs)

- Voice ID: `pFZP5JQG7iQjIQuC4Bku`
- Model: `eleven_multilingual_v2`
- Character: Warm, mid-low British female. "Velvety Actress."
- Kevin's approval: "BEAUTIFUL" at stability=0.30, style=0.65, speed=0.92 (conversational)

**For meditation, Lily needs different settings than conversational.** The approved Vox baseline (0.30/0.65/0.65) is for dialogue energy. Meditation needs:
- Higher stability (more predictable for entrainment)
- Lower style (less performative energy)
- Lower speed (encoding-appropriate rate)
- Post-processed darker timbre (LPF + treble shelf)

### Why Lily Works for This

| Research Requirement | Lily's Properties |
|---------------------|-------------------|
| Lower-third pitch for trust (Klofstad) | Mid-low female register (~170-200 Hz estimated F0) |
| Dark, warm timbre (Zoghaib) | "Velvety" character. Natural warmth. |
| Slight breathiness (ASMR research) | At stability 0.40-0.50, Lily produces natural breathiness |
| Human-sounding (Menhart & Cummings) | Kevin rejected all voices that sounded "commercial" or "scripted" |
| Philosophical weight (Kevin's philosophy) | "Nurturing female voice = philosophical weight" |

### When to Consider v3

Eleven v3 offers audio tags (`[whispers]`, `[calm]`, `[sighs]`, `[pauses]`) that would give us in-model control over delivery mode per-sentence. BUT:
- v3 does not support SSML `<break>` tags (uses `[pause]` instead)
- v3 does not support request stitching (previous_request_ids)
- Professional Voice Clones are not fully optimized for v3
- v3 character limit is 5,000 (vs. 10,000 for multilingual_v2)

**Recommendation:** Stay on `eleven_multilingual_v2` with post-processing for pitch/volume/EQ control. The post-processing pipeline gives us more precise, reproducible control than v3's semantic audio tags. Re-evaluate when v3 matures.

### When to Consider Cartesia Sonic-3

Cartesia offers native SSML `<prosody pitch>` and `<prosody rate>` and `<prosody volume>` tags. If the post-processing pipeline proves too cumbersome for iteration, Cartesia is the strongest alternative for prosodic control. Trade-off: potentially less natural voice quality than ElevenLabs.

---

## Model Selection Decision

| API | Pitch Control | Volume Control | Rate Control | Emphasis | Voice Quality | Meditation Fit |
|-----|-------------|---------------|-------------|----------|--------------|---------------|
| ElevenLabs v2 | Post-process only | Post-process only | `speed` param | CAPS + punctuation | Best-in-class | High (with post-processing) |
| ElevenLabs v3 | Post-process only | Post-process only | `speed` param | Audio tags: `[calm]`, `[whispers]` | Very good | High (less mature) |
| Cartesia Sonic-3 | SSML `<prosody pitch>` | SSML `<prosody volume>` | SSML `<prosody rate>` | SSML-capable | Good | Highest control |
| PlayHT | SSML prosody tags | SSML prosody tags | SSML prosody tags | Partial | Good | High control |

**Decision: ElevenLabs v2 + librosa post-processing for v1. If iteration velocity becomes a bottleneck, evaluate Cartesia for v2.**

---

## TMR Chime Specification

The chime that pairs with key concepts during the session and replays during sleep.

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Frequency | 1000 Hz (pure sine) | Speech band but distinct from voice. Non-musical. |
| Duration | 100ms | Short enough not to interrupt; long enough to register. |
| Attack | 10ms (raised cosine) | No click/pop on onset. |
| Release | 30ms (exponential decay) | Gentle fade, not abrupt cutoff. |
| Volume | -30 dB relative to voice (in content phase) | Sub-prominent. Registers but doesn't startle. |
| Timing | 500ms before each key concept cluster | Precedes the content it anchors. |
| Sleep replay volume | Sub-arousal threshold (individual-dependent, start at -50 dB) | Must not wake the sleeper. Carbone & Diekelmann (2024): intense cues cause forgetting. |

Generate with:
```python
import numpy as np
import soundfile as sf

sr = 44100
duration = 0.100  # 100ms
t = np.linspace(0, duration, int(sr * duration), endpoint=False)

# 1000 Hz sine with raised cosine attack and exponential release
freq = 1000
attack_samples = int(0.010 * sr)  # 10ms
release_samples = int(0.030 * sr)  # 30ms

signal = np.sin(2 * np.pi * freq * t)

# Attack envelope (raised cosine)
attack = 0.5 * (1 - np.cos(np.pi * np.arange(attack_samples) / attack_samples))
signal[:attack_samples] *= attack

# Release envelope (exponential decay)
release = np.exp(-5 * np.arange(release_samples) / release_samples)
signal[-release_samples:] *= release

# Normalize to -30 dB relative to 0 dBFS
target_db = -30
signal *= 10 ** (target_db / 20)

sf.write('tmr_chime.wav', signal.astype(np.float32), sr)
```

---

## Ambient Drone Specification

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Carrier | 196 Hz (G3) | Warm, non-intrusive. Below speech fundamentals. Musical note avoids beating with voice. |
| Waveform | Sine + subtle harmonics (triangle-ish) | Pure sine is sterile; slight harmonics add warmth. |
| AM modulation rate | 6 Hz | Theta-range ASSR. Produces measurable cortical following response. |
| AM depth | 30% | Perceptible as gentle pulsing without being distracting. |
| Binaural offset | 6 Hz (196 Hz left / 202 Hz right) | Optional (headphones only). Theta-range binaural beat. |
| Pink noise floor | -45 dB relative to drone | Masks environmental sounds without competing with voice. |
| Fade in | 30 seconds (logarithmic) | Gradual onset. No startle. |
| Fade out | 60 seconds (logarithmic) | Slow exit. Session dissolves rather than stops. |

---

## Breathing Pacer Specification

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Rate | 6 breaths/min (0.1 Hz) | Cardiovascular resonance frequency. Best-validated frequency effect. |
| Pattern | 4s inhale, 2s hold, 6s exhale | Longer exhale maximizes parasympathetic activation. |
| Sound (inhale) | Rising filtered noise sweep, 200-800 Hz, 4s | Suggests upward/inward. Natural breath sound. |
| Sound (exhale) | Falling filtered noise sweep, 800-200 Hz, 6s | Suggests downward/outward. |
| Volume | -20 dB relative to voice | Background texture, not foreground instruction. |
| Active period | 0:30-4:00 (induction + deepening) | Establish the rhythm, then fade. |
| Fade out | 30s starting at 3:30 | Listener internalizes the rhythm. Pacer disappears. |

---

## Quality Assurance Metrics

After generating each session, verify:

| Check | Target | Tool |
|-------|--------|------|
| Average F0 per phase | Descending induction→content, ascending reinforcement→emergence | `praat` or `librosa.pyin()` |
| Speaking rate per phase | Within 5% of target WPM | Word count / segment duration |
| Pause durations | Within 0.5s of target | Waveform inspection |
| Loudness per phase | Within 1 dB of target LUFS | `ffmpeg -af loudnorm` measurement pass |
| Spectral centroid trend | Descending (darker) toward content, ascending toward emergence | `librosa.feature.spectral_centroid()` |
| TMR chime SNR | -30 dB +/- 2 dB relative to voice | Peak measurement |
| Total session duration | 25-27 minutes | Clock |
| No artifacts | No clicks, pops, or stitching discontinuities | Listen-through |

---

## Summary: The Twelve Quantifiers

| # | Quantifier | Control Method | Research Driver |
|---|-----------|---------------|----------------|
| 1 | **Speaking rate (WPM)** | `speed` parameter per phase | Phonological loop (Baddeley), encoding time |
| 2 | **Pitch register (semitones)** | Post-process pitch shift (librosa) | Klofstad: lower = trust; Montgomery: must descend |
| 3 | **Pitch contour (within phrase)** | Text punctuation (period = fall, ellipsis = trail) | Terminal contour signals suggestion finality |
| 4 | **Breathiness / variation** | `stability` parameter | ASMR: breathy = parasympathetic safety signal |
| 5 | **Energy / expressiveness** | `style` parameter | U-curve (Soma): descend to trough, ascend to close |
| 6 | **Volume (dB)** | Post-process gain | ASMR: quieter = intimate proximity; louder = alerting |
| 7 | **Timbre darkness** | Post-process LPF + treble shelf | Zoghaib: dull + smooth = maximum persuasion |
| 8 | **Pause duration (seconds)** | SSML `<break>` tags | Hippocampal binding window (3-5s); breathing sync (6s) |
| 9 | **Pause architecture (pattern)** | Text structure: clause-pause-clause | Breathing entrainment at 0.1 Hz resonance |
| 10 | **Prosodic emphasis** | CAPS on key terms + slight API setting shift | Frazier: stressed words get encoding priority |
| 11 | **Rhythmic predictability** | Consistent clause length, regular cadence | Hasson: predictable language maximizes neural coupling |
| 12 | **Embedded command framing** | Text engineering: permissive frame around payload | Erickson tradition: bypass critical faculty via presupposition |

Every quantifier has a number. Every number has a research citation. The system is reproducible.

---

*This specification is part of the Deep Encode audio learning system within [Autodidactive](https://qinnovate.com/learn/autodidactive/). Parameters are derived from peer-reviewed research documented in companion files. Voice generation uses ElevenLabs API; post-processing uses librosa + FFmpeg. Written with AI assistance (Claude).*
