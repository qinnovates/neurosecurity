#!/usr/bin/env python3
"""
Deep Encode — Hypnotic Auditory Learning Session Generator

Takes a structured learning script and produces a layered audio session:
  Layer 1: Ambient drone (196 Hz carrier, 6 Hz theta AM, optional binaural)
  Layer 2: Breathing pacer (6 breaths/min, 4-2-6 pattern)
  Layer 3: Voice (ElevenLabs, phase-appropriate settings + post-processing)
  Layer 4: TMR chimes (paired with key concepts for sleep replay)

Usage:
  python3 generate.py script.json --output session.mp3
  python3 generate.py script.json --output session.mp3 --no-voice  # ambient only (testing)
  python3 generate.py script.json --output session.mp3 --dry-run   # show plan, don't generate

Requires:
  pip install elevenlabs librosa soundfile numpy scipy
  brew install ffmpeg
  API key in macOS Keychain: security add-generic-password -s elevenlabs -a api -w YOUR_KEY
"""

import argparse
import json
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import librosa
import numpy as np
import soundfile as sf

# ─── Constants ──────────────────────────────────────────────────────────────

SR = 44100  # Sample rate
VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"  # Lily
MODEL_ID = "eleven_multilingual_v2"
OUTPUT_FORMAT = "pcm_44100"  # Raw PCM for maximum post-processing flexibility

# ─── Phase Definitions ──────────────────────────────────────────────────────


@dataclass
class PhaseSettings:
    """Voice + post-processing settings for a session phase."""

    name: str
    # ElevenLabs API parameters
    stability: float
    similarity_boost: float
    style: float
    speed: float
    # Post-processing parameters
    pitch_shift_semitones: float  # Applied via librosa
    volume_db: float  # Gain adjustment
    lpf_hz: Optional[float]  # Low-pass filter cutoff (None = flat)
    treble_shelf_db: float  # dB adjustment above 5 kHz
    # Pause targets (informational -- actual pauses are in the script SSML)
    min_pause_sec: float
    max_pause_sec: float


PHASES = {
    "induction": PhaseSettings(
        name="induction",
        stability=0.40,
        similarity_boost=0.70,
        style=0.45,
        speed=0.85,
        pitch_shift_semitones=0.0,
        volume_db=0.0,
        lpf_hz=None,
        treble_shelf_db=0.0,
        min_pause_sec=1.5,
        max_pause_sec=2.0,
    ),
    "deepening": PhaseSettings(
        name="deepening",
        stability=0.50,
        similarity_boost=0.70,
        style=0.30,
        speed=0.78,
        pitch_shift_semitones=-1.0,
        volume_db=-2.0,
        lpf_hz=10000,
        treble_shelf_db=-2.0,
        min_pause_sec=3.0,
        max_pause_sec=5.0,
    ),
    "content": PhaseSettings(
        name="content",
        stability=0.55,
        similarity_boost=0.70,
        style=0.25,
        speed=0.75,
        pitch_shift_semitones=-2.0,
        volume_db=-4.0,
        lpf_hz=8000,
        treble_shelf_db=-4.0,
        min_pause_sec=4.0,
        max_pause_sec=6.0,
    ),
    "emphasis": PhaseSettings(
        name="emphasis",
        stability=0.50,
        similarity_boost=0.70,
        style=0.35,
        speed=0.72,
        pitch_shift_semitones=-1.5,
        volume_db=-3.0,
        lpf_hz=8000,
        treble_shelf_db=-3.0,
        min_pause_sec=3.0,
        max_pause_sec=5.0,
    ),
    "reinforcement": PhaseSettings(
        name="reinforcement",
        stability=0.50,
        similarity_boost=0.70,
        style=0.30,
        speed=0.78,
        pitch_shift_semitones=-1.0,
        volume_db=-2.0,
        lpf_hz=9000,
        treble_shelf_db=-3.0,
        min_pause_sec=8.0,
        max_pause_sec=20.0,
    ),
    "emergence": PhaseSettings(
        name="emergence",
        stability=0.35,
        similarity_boost=0.70,
        style=0.50,
        speed=0.88,
        pitch_shift_semitones=0.0,
        volume_db=0.0,
        lpf_hz=None,
        treble_shelf_db=0.0,
        min_pause_sec=1.5,
        max_pause_sec=2.0,
    ),
}


# ─── Script Schema ──────────────────────────────────────────────────────────


@dataclass
class Segment:
    """A single segment of the learning script."""

    phase: str  # Key into PHASES
    text: str  # The text to speak (with SSML breaks)
    tmr_chime: bool = False  # Whether to prepend a TMR chime
    previous_text: str = ""  # Context for ElevenLabs stitching
    next_text: str = ""  # Context for ElevenLabs stitching


@dataclass
class Script:
    """A complete Deep Encode session script."""

    title: str
    topic: str
    segments: list  # List of Segment dicts
    ambient_duration_sec: float = 1560.0  # 26 minutes default
    breathing_pacer_end_sec: float = 240.0  # Pacer fades at 4:00


# ─── Audio Generation: Ambient Layers ───────────────────────────────────────


def generate_drone(duration_sec: float, binaural: bool = True) -> np.ndarray:
    """
    Generate the ambient drone layer.

    Carrier: 196 Hz (G3)
    AM: 6 Hz at 30% depth (theta-range ASSR)
    Optional binaural: 196 Hz left / 202 Hz right (6 Hz offset)
    Pink noise floor at -45 dB
    Fade in: 30s logarithmic
    Fade out: 60s logarithmic
    """
    t = np.linspace(0, duration_sec, int(SR * duration_sec), endpoint=False)
    n_samples = len(t)

    # Carrier
    carrier_freq = 196.0  # G3
    carrier_l = np.sin(2 * np.pi * carrier_freq * t)

    if binaural:
        carrier_r = np.sin(2 * np.pi * (carrier_freq + 6.0) * t)  # 202 Hz right
    else:
        carrier_r = carrier_l.copy()

    # Add subtle harmonics (triangle-wave character: odd harmonics at 1/n^2)
    for n in [3, 5, 7]:
        harmonic_amp = 0.15 / (n * n)
        carrier_l += harmonic_amp * np.sin(2 * np.pi * carrier_freq * n * t)
        if binaural:
            carrier_r += harmonic_amp * np.sin(2 * np.pi * (carrier_freq + 6.0) * n * t)
        else:
            carrier_r += harmonic_amp * np.sin(2 * np.pi * carrier_freq * n * t)

    # Amplitude modulation at 6 Hz, 30% depth
    am_freq = 6.0
    am_depth = 0.30
    am_envelope = 1.0 - am_depth * 0.5 * (1 - np.cos(2 * np.pi * am_freq * t))

    carrier_l *= am_envelope
    carrier_r *= am_envelope

    # Pink noise floor at -45 dB relative
    pink = _generate_pink_noise(n_samples)
    pink_db = -45.0
    pink_gain = 10 ** (pink_db / 20.0)
    pink_l = pink * pink_gain
    pink_r = _generate_pink_noise(n_samples) * pink_gain  # Independent noise per channel

    # Combine
    left = carrier_l + pink_l
    right = carrier_r + pink_r

    # Normalize drone to -20 dBFS before mixing
    peak = max(np.max(np.abs(left)), np.max(np.abs(right)))
    if peak > 0:
        target_peak = 10 ** (-20.0 / 20.0)
        left *= target_peak / peak
        right *= target_peak / peak

    # Fade in (30s logarithmic) and fade out (60s logarithmic)
    fade_in_samples = int(30.0 * SR)
    fade_out_samples = int(60.0 * SR)

    fade_in = np.linspace(0, 1, fade_in_samples) ** 2  # Quadratic (perceived logarithmic)
    left[:fade_in_samples] *= fade_in
    right[:fade_in_samples] *= fade_in

    fade_out = np.linspace(1, 0, fade_out_samples) ** 2
    left[-fade_out_samples:] *= fade_out
    right[-fade_out_samples:] *= fade_out

    # Stereo
    return np.column_stack([left, right])


def _generate_pink_noise(n_samples: int) -> np.ndarray:
    """Generate pink noise (1/f) via Voss-McCartney algorithm."""
    white = np.random.randn(n_samples)
    # Simple spectral shaping: FFT, apply 1/sqrt(f), IFFT
    fft = np.fft.rfft(white)
    freqs = np.fft.rfftfreq(n_samples, 1.0 / SR)
    freqs[0] = 1.0  # Avoid division by zero
    fft *= 1.0 / np.sqrt(freqs)
    pink = np.fft.irfft(fft, n=n_samples)
    # Normalize to [-1, 1]
    peak = np.max(np.abs(pink))
    if peak > 0:
        pink /= peak
    return pink


def generate_breathing_pacer(duration_sec: float, fade_start_sec: float = 210.0) -> np.ndarray:
    """
    Generate breathing pacer layer.

    Pattern: 4s inhale, 2s hold, 6s exhale = 12s cycle = 5 breaths/min
    (Slightly slower than 6/min to give space; adjustable)

    Sound: Filtered noise sweeps
      Inhale: rising 200-800 Hz, 4s
      Hold: silence, 2s
      Exhale: falling 800-200 Hz, 6s

    Fades out over 30s starting at fade_start_sec.
    """
    n_samples = int(duration_sec * SR)
    mono = np.zeros(n_samples)

    cycle_sec = 12.0  # 4 + 2 + 6
    inhale_sec = 4.0
    hold_sec = 2.0
    exhale_sec = 6.0
    n_cycles = int(duration_sec / cycle_sec) + 1

    for i in range(n_cycles):
        cycle_start = int(i * cycle_sec * SR)

        # Inhale: rising filtered noise
        inhale_samples = int(inhale_sec * SR)
        if cycle_start + inhale_samples > n_samples:
            break
        inhale = _filtered_noise_sweep(inhale_samples, 200, 800, rising=True)
        inhale *= _smooth_envelope(inhale_samples)
        mono[cycle_start : cycle_start + inhale_samples] += inhale

        # Hold: silence (already zeros)

        # Exhale: falling filtered noise
        exhale_start = cycle_start + int((inhale_sec + hold_sec) * SR)
        exhale_samples = int(exhale_sec * SR)
        if exhale_start + exhale_samples > n_samples:
            break
        exhale = _filtered_noise_sweep(exhale_samples, 800, 200, rising=False)
        exhale *= _smooth_envelope(exhale_samples)
        mono[exhale_start : exhale_start + exhale_samples] += exhale

    # Normalize to -20 dB relative (background texture)
    peak = np.max(np.abs(mono))
    if peak > 0:
        target_rms = 10 ** (-30.0 / 20.0)  # Very quiet
        current_rms = np.sqrt(np.mean(mono[mono != 0] ** 2)) if np.any(mono != 0) else 1.0
        mono *= target_rms / max(current_rms, 1e-10)

    # Fade out
    fade_start_sample = int(fade_start_sec * SR)
    fade_duration = int(30.0 * SR)
    if fade_start_sample + fade_duration <= n_samples:
        fade = np.linspace(1, 0, fade_duration) ** 2
        mono[fade_start_sample : fade_start_sample + fade_duration] *= fade
        mono[fade_start_sample + fade_duration :] = 0.0

    # Return as stereo (same in both channels)
    return np.column_stack([mono, mono])


def _filtered_noise_sweep(n_samples: int, freq_start: float, freq_end: float, rising: bool) -> np.ndarray:
    """Generate noise filtered through a sweeping bandpass."""
    noise = np.random.randn(n_samples)

    # Simple approach: apply a time-varying bandpass via short-time filtering
    # For efficiency, use a single bandpass at the center frequency
    center_freq = (freq_start + freq_end) / 2
    bandwidth = abs(freq_end - freq_start)

    # Design bandpass
    from scipy.signal import butter, sosfilt

    low = max(freq_start, 50) / (SR / 2)
    high = min(freq_end, SR / 2 - 100) / (SR / 2)
    if low >= high:
        low, high = min(low, high), max(low, high)
    low = max(low, 0.001)
    high = min(high, 0.999)

    sos = butter(4, [low, high], btype="band", output="sos")
    filtered = sosfilt(sos, noise)

    # Amplitude envelope: crescendo for inhale, decrescendo for exhale
    if rising:
        envelope = np.linspace(0.3, 1.0, n_samples)
    else:
        envelope = np.linspace(1.0, 0.3, n_samples)

    return filtered * envelope


def _smooth_envelope(n_samples: int, attack_ms: float = 50.0, release_ms: float = 50.0) -> np.ndarray:
    """Raised cosine attack/release envelope to prevent clicks."""
    env = np.ones(n_samples)
    attack_samples = int(attack_ms / 1000.0 * SR)
    release_samples = int(release_ms / 1000.0 * SR)

    if attack_samples > 0 and attack_samples < n_samples:
        env[:attack_samples] = 0.5 * (1 - np.cos(np.pi * np.arange(attack_samples) / attack_samples))
    if release_samples > 0 and release_samples < n_samples:
        env[-release_samples:] = 0.5 * (1 + np.cos(np.pi * np.arange(release_samples) / release_samples))

    return env


def generate_tmr_chime() -> np.ndarray:
    """
    Generate the TMR chime: 1000 Hz sine, 100ms, raised cosine attack, exponential release.
    Normalized to -30 dBFS.
    """
    duration = 0.100
    t = np.linspace(0, duration, int(SR * duration), endpoint=False)

    signal = np.sin(2 * np.pi * 1000 * t)

    # Attack: 10ms raised cosine
    attack_samples = int(0.010 * SR)
    attack = 0.5 * (1 - np.cos(np.pi * np.arange(attack_samples) / attack_samples))
    signal[:attack_samples] *= attack

    # Release: 30ms exponential decay
    release_samples = int(0.030 * SR)
    release = np.exp(-5 * np.arange(release_samples) / release_samples)
    signal[-release_samples:] *= release

    # Normalize to -30 dBFS
    target_db = -30
    signal *= 10 ** (target_db / 20.0)

    # Return mono
    return signal


# ─── Audio Generation: Voice Layer ──────────────────────────────────────────


def get_api_key() -> str:
    """Retrieve ElevenLabs API key from macOS Keychain."""
    try:
        result = subprocess.run(
            ["security", "find-generic-password", "-s", "elevenlabs", "-w"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        print("ERROR: ElevenLabs API key not found in Keychain.", file=sys.stderr)
        print("Add it with: security add-generic-password -s elevenlabs -a api -w YOUR_KEY", file=sys.stderr)
        sys.exit(1)


def generate_voice_segment(
    text: str,
    settings: PhaseSettings,
    api_key: str,
    previous_text: str = "",
    next_text: str = "",
) -> np.ndarray:
    """
    Generate a single voice segment via ElevenLabs API,
    then apply phase-appropriate post-processing.
    """
    from elevenlabs import ElevenLabs, VoiceSettings

    client = ElevenLabs(api_key=api_key)

    voice_settings = VoiceSettings(
        stability=settings.stability,
        similarity_boost=settings.similarity_boost,
        style=settings.style,
        use_speaker_boost=True,
    )

    # Build kwargs, only include optional params if they have values
    kwargs = {
        "voice_id": VOICE_ID,
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": voice_settings,
        "output_format": OUTPUT_FORMAT,
    }
    if settings.speed != 1.0:
        # Speed is set at the request level, not in voice_settings
        # The SDK may handle this differently; using the API directly if needed
        pass  # Note: speed may need to be passed via request body extension

    if previous_text:
        kwargs["previous_text"] = previous_text
    if next_text:
        kwargs["next_text"] = next_text

    # Generate
    audio_bytes = b""
    for chunk in client.text_to_speech.convert(**kwargs):
        audio_bytes += chunk

    # PCM 44100 is signed 16-bit little-endian mono
    audio = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

    # Apply post-processing
    audio = _post_process_voice(audio, settings)

    return audio


def _post_process_voice(audio: np.ndarray, settings: PhaseSettings) -> np.ndarray:
    """Apply pitch shift, volume, EQ, and compression to a voice segment."""

    # 1. Pitch shift (librosa, time-preserving)
    if settings.pitch_shift_semitones != 0.0:
        audio = librosa.effects.pitch_shift(
            audio, sr=SR, n_steps=settings.pitch_shift_semitones
        )

    # 2. Volume adjustment
    if settings.volume_db != 0.0:
        gain = 10 ** (settings.volume_db / 20.0)
        audio *= gain

    # 3. Low-pass filter
    if settings.lpf_hz is not None:
        from scipy.signal import butter, sosfilt

        nyquist = SR / 2
        cutoff = min(settings.lpf_hz, nyquist - 100) / nyquist
        cutoff = max(cutoff, 0.01)
        sos = butter(4, cutoff, btype="low", output="sos")
        audio = sosfilt(sos, audio).astype(np.float32)

    # 4. Treble shelf (approximate with high-shelf EQ)
    if settings.treble_shelf_db != 0.0:
        from scipy.signal import butter, sosfilt

        nyquist = SR / 2
        shelf_freq = 5000.0 / nyquist
        shelf_freq = max(min(shelf_freq, 0.99), 0.01)

        # Extract high frequencies, adjust level, recombine
        sos_hp = butter(2, shelf_freq, btype="high", output="sos")
        highs = sosfilt(sos_hp, audio).astype(np.float32)
        sos_lp = butter(2, shelf_freq, btype="low", output="sos")
        lows = sosfilt(sos_lp, audio).astype(np.float32)

        shelf_gain = 10 ** (settings.treble_shelf_db / 20.0)
        audio = lows + highs * shelf_gain

    # 5. Gentle compression (soft knee)
    audio = _soft_compress(audio, threshold_db=-25, ratio=4.0, attack_ms=500, release_ms=2000)

    # Prevent clipping
    peak = np.max(np.abs(audio))
    if peak > 0.95:
        audio *= 0.95 / peak

    return audio


def _soft_compress(
    audio: np.ndarray,
    threshold_db: float = -25,
    ratio: float = 4.0,
    attack_ms: float = 500,
    release_ms: float = 2000,
) -> np.ndarray:
    """Simple envelope-following compressor."""
    threshold = 10 ** (threshold_db / 20.0)
    attack_coeff = np.exp(-1.0 / (attack_ms / 1000.0 * SR))
    release_coeff = np.exp(-1.0 / (release_ms / 1000.0 * SR))

    envelope = np.zeros_like(audio)
    env = 0.0

    for i in range(len(audio)):
        sample_abs = abs(audio[i])
        if sample_abs > env:
            env = attack_coeff * env + (1 - attack_coeff) * sample_abs
        else:
            env = release_coeff * env + (1 - release_coeff) * sample_abs
        envelope[i] = env

    # Apply gain reduction where envelope exceeds threshold
    output = audio.copy()
    for i in range(len(audio)):
        if envelope[i] > threshold:
            gain_db = threshold_db + (20 * np.log10(max(envelope[i], 1e-10)) - threshold_db) / ratio
            target_level = 10 ** (gain_db / 20.0)
            output[i] = audio[i] * (target_level / max(envelope[i], 1e-10))

    return output


# ─── Session Assembly ───────────────────────────────────────────────────────


def assemble_session(
    script: dict,
    output_path: str,
    no_voice: bool = False,
    dry_run: bool = False,
    binaural: bool = True,
) -> None:
    """
    Assemble a complete Deep Encode session from a script.

    1. Generate ambient drone (full session length)
    2. Generate breathing pacer (first ~4 minutes)
    3. Generate each voice segment with phase-appropriate settings
    4. Place TMR chimes before flagged segments
    5. Mix all layers
    6. Apply final loudness normalization
    """
    title = script.get("title", "Deep Encode Session")
    segments = script.get("segments", [])
    ambient_duration = script.get("ambient_duration_sec", 1560.0)
    pacer_end = script.get("breathing_pacer_end_sec", 240.0)

    print(f"Session: {title}")
    print(f"Segments: {len(segments)}")
    print(f"Ambient duration: {ambient_duration:.0f}s ({ambient_duration / 60:.1f} min)")
    print(f"Breathing pacer until: {pacer_end:.0f}s")
    print()

    if dry_run:
        _print_plan(segments)
        return

    # 1. Generate ambient drone
    print("Generating ambient drone...")
    drone = generate_drone(ambient_duration, binaural=binaural)
    total_samples = drone.shape[0]

    # 2. Generate breathing pacer
    print("Generating breathing pacer...")
    pacer = generate_breathing_pacer(pacer_end + 30, fade_start_sec=pacer_end)
    # Pad pacer to full length
    if pacer.shape[0] < total_samples:
        pad = np.zeros((total_samples - pacer.shape[0], 2))
        pacer = np.vstack([pacer, pad])
    else:
        pacer = pacer[:total_samples]

    # 3. Generate voice layer
    voice_layer = np.zeros((total_samples, 2))
    tmr_chime_mono = generate_tmr_chime()

    if not no_voice:
        api_key = get_api_key()
        cursor = int(30.0 * SR)  # Start voice at 0:30 (after ambient onset)

        for i, seg in enumerate(segments):
            phase_name = seg.get("phase", "content")
            text = seg.get("text", "")
            has_chime = seg.get("tmr_chime", False)
            prev_text = seg.get("previous_text", "")
            next_text = seg.get("next_text", "")

            if not text.strip():
                continue

            settings = PHASES.get(phase_name, PHASES["content"])
            print(f"  [{i + 1}/{len(segments)}] {settings.name}: {text[:60]}...")

            # TMR chime before segment
            if has_chime and cursor > 0:
                chime_start = max(0, cursor - int(0.5 * SR))  # 500ms before
                chime_end = chime_start + len(tmr_chime_mono)
                if chime_end <= total_samples:
                    voice_layer[chime_start:chime_end, 0] += tmr_chime_mono
                    voice_layer[chime_start:chime_end, 1] += tmr_chime_mono

            # Generate voice
            try:
                voice_mono = generate_voice_segment(
                    text=text,
                    settings=settings,
                    api_key=api_key,
                    previous_text=prev_text,
                    next_text=next_text,
                )

                # Place in stereo voice layer (center-panned)
                end = cursor + len(voice_mono)
                if end <= total_samples:
                    voice_layer[cursor:end, 0] += voice_mono
                    voice_layer[cursor:end, 1] += voice_mono
                else:
                    remaining = total_samples - cursor
                    voice_layer[cursor:, 0] += voice_mono[:remaining]
                    voice_layer[cursor:, 1] += voice_mono[:remaining]

                cursor = end
            except Exception as e:
                print(f"    ERROR generating segment: {e}", file=sys.stderr)
                # Add silence for estimated duration (rough: 2.5 chars/sec at speed 0.75)
                est_duration = len(text) / 2.5 / settings.speed
                cursor += int(est_duration * SR)
    else:
        print("  (voice generation skipped -- ambient only)")

    # 4. Mix all layers
    print("Mixing layers...")
    mixed = drone + pacer + voice_layer

    # Prevent clipping
    peak = np.max(np.abs(mixed))
    if peak > 0.95:
        mixed *= 0.95 / peak

    # 5. Write to temp WAV, then normalize with FFmpeg
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name
        sf.write(tmp_path, mixed, SR)

    print("Applying final loudness normalization...")
    ffmpeg_cmd = [
        "ffmpeg", "-y", "-i", tmp_path, "-af",
        "loudnorm=I=-20:LRA=7:TP=-2.0,"
        "aecho=0.8:0.88:60:0.20",
        "-ar", "48000",
        output_path,
    ]
    subprocess.run(ffmpeg_cmd, capture_output=True, check=True)

    # Cleanup
    Path(tmp_path).unlink(missing_ok=True)

    duration_sec = total_samples / SR
    print(f"\nDone: {output_path}")
    print(f"Duration: {duration_sec / 60:.1f} minutes")


def _print_plan(segments: list) -> None:
    """Print the generation plan without generating audio."""
    print("=" * 70)
    print("GENERATION PLAN (dry run)")
    print("=" * 70)

    total_chars = 0
    for i, seg in enumerate(segments):
        phase = seg.get("phase", "content")
        text = seg.get("text", "")
        chime = seg.get("tmr_chime", False)
        settings = PHASES.get(phase, PHASES["content"])

        total_chars += len(text)
        chime_marker = " [TMR]" if chime else ""

        print(f"\n--- Segment {i + 1}: {phase}{chime_marker} ---")
        print(f"  Text ({len(text)} chars): {text[:80]}{'...' if len(text) > 80 else ''}")
        print(f"  API:  stability={settings.stability}, style={settings.style}, speed={settings.speed}")
        print(f"  Post: pitch={settings.pitch_shift_semitones:+.1f}st, vol={settings.volume_db:+.1f}dB, "
              f"lpf={'flat' if settings.lpf_hz is None else f'{settings.lpf_hz}Hz'}, "
              f"treble={settings.treble_shelf_db:+.1f}dB")

    # Rough cost estimate (ElevenLabs charges per character)
    print(f"\n{'=' * 70}")
    print(f"Total characters: {total_chars:,}")
    print(f"Estimated ElevenLabs cost: ~${total_chars / 1000 * 0.30:.2f} (at $0.30/1k chars)")
    print(f"{'=' * 70}")


# ─── Script Loading ─────────────────────────────────────────────────────────


def load_script(path: str) -> dict:
    """Load a session script from JSON."""
    with open(path) as f:
        return json.load(f)


# ─── CLI ────────────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(
        description="Deep Encode: Generate hypnotic auditory learning sessions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example script.json:
{
  "title": "Theta and Memory Encoding",
  "topic": "How theta oscillations drive hippocampal memory formation",
  "ambient_duration_sec": 1560,
  "breathing_pacer_end_sec": 240,
  "segments": [
    {
      "phase": "induction",
      "text": "Allow your focus to soften... <break time=\\"2.0s\\" /> You don't need to stop what you're doing. <break time=\\"2.0s\\" /> Just let this voice become a background layer...",
      "tmr_chime": false
    },
    {
      "phase": "deepening",
      "text": "Each breath takes you a little deeper into focus... <break time=\\"4.0s\\" /> And with each exhale... the noise around you matters less. <break time=\\"5.0s\\" />",
      "tmr_chime": false
    },
    {
      "phase": "content",
      "text": "The hippocampus generates THETA OSCILLATIONS... <break time=\\"3.0s\\" /> four to eight cycles per second. <break time=\\"5.0s\\" /> Each wave carries a piece of what you're encoding now.",
      "tmr_chime": true
    }
  ]
}
        """,
    )
    parser.add_argument("script", help="Path to session script JSON file")
    parser.add_argument("-o", "--output", default="session.mp3", help="Output file path (default: session.mp3)")
    parser.add_argument("--no-voice", action="store_true", help="Generate ambient layers only (no API calls)")
    parser.add_argument("--dry-run", action="store_true", help="Show generation plan without producing audio")
    parser.add_argument("--mono", action="store_true", help="Mono output (no binaural offset)")

    args = parser.parse_args()

    script = load_script(args.script)
    assemble_session(
        script=script,
        output_path=args.output,
        no_voice=args.no_voice,
        dry_run=args.dry_run,
        binaural=not args.mono,
    )


if __name__ == "__main__":
    main()
