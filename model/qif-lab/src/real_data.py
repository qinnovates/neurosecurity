"""
Real BCI Data Pipeline — PhysioNet EEGBCI Motor Imagery Dataset.

Downloads, processes, and computes QIF coherence metrics on real EEG data.
This demonstrates the classical coherence metric Cₛ on actual brain recordings.

CAVEAT: This validates the classical signal processing pipeline only.
It does NOT validate quantum terms (Qᵢ, Q_entangle, Q_tunnel).

Dataset: PhysioNet EEGBCI Motor/Movement Imagery Dataset
  - 109 subjects, 64-channel EEG, 160 Hz sampling rate
  - Tasks: eyes open/closed, motor imagery (left/right fist, both fists/feet)
  - Reference: Schalk et al. (2004), Goldberger et al. (2000)

Usage:
    from src.real_data import download_eegbci, process_subject, compute_coherence_from_eeg
"""

import os
import warnings
from pathlib import Path
from typing import Optional

import numpy as np

# Data directory (gitignored)
DATA_DIR = Path(__file__).parent.parent / "data" / "eegbci"

# PhysioNet EEGBCI parameters
EEGBCI_URL_BASE = "https://physionet.org/files/eegmmidb/1.0.0"
SAMPLING_RATE = 160  # Hz
N_CHANNELS = 64

# Frequency bands for bandpass filtering
FREQ_BANDS = {
    "delta": (0.5, 4.0),
    "theta": (4.0, 8.0),
    "alpha": (8.0, 13.0),
    "beta":  (13.0, 30.0),
    "gamma": (30.0, 60.0),
}


def download_eegbci(subjects: list[int] = None, runs: list[int] = None,
                    data_dir: Path = DATA_DIR) -> list[Path]:
    """Download EDF files from PhysioNet EEGBCI dataset.

    Args:
        subjects: List of subject IDs (1-109). Defaults to [1, 2, 3].
        runs: List of run numbers (1-14). Defaults to [1, 2, 4, 6] (baseline + motor imagery).
        data_dir: Directory to save files.

    Returns:
        List of paths to downloaded EDF files.
    """
    if subjects is None:
        subjects = [1, 2, 3]
    if runs is None:
        runs = [1, 2, 4, 6]  # 1=baseline eyes open, 2=eyes closed, 4=left/right fist, 6=both fists/feet

    data_dir.mkdir(parents=True, exist_ok=True)

    downloaded = []
    try:
        import urllib.request
    except ImportError:
        raise ImportError("urllib required for downloads")

    for subj in subjects:
        subj_dir = data_dir / f"S{subj:03d}"
        subj_dir.mkdir(parents=True, exist_ok=True)

        for run in runs:
            filename = f"S{subj:03d}R{run:02d}.edf"
            filepath = subj_dir / filename
            if filepath.exists():
                downloaded.append(filepath)
                continue

            url = f"{EEGBCI_URL_BASE}/S{subj:03d}/{filename}"
            try:
                urllib.request.urlretrieve(url, filepath)
                downloaded.append(filepath)
                print(f"Downloaded: {filename}")
            except Exception as e:
                warnings.warn(f"Failed to download {filename}: {e}")

    return downloaded


def load_edf(filepath: Path) -> tuple[np.ndarray, float, list[str]]:
    """Load an EDF file and return raw signal data.

    Args:
        filepath: Path to .edf file.

    Returns:
        Tuple of (signals, sample_rate, channel_names).
        signals shape: (n_channels, n_samples)
    """
    try:
        import pyedflib
    except ImportError:
        raise ImportError(
            "pyedflib required for EDF loading. Install with: pip install pyedflib"
        )

    f = pyedflib.EdfReader(str(filepath))
    try:
        n_channels = f.signals_in_file
        channel_names = f.getSignalLabels()
        sample_rate = f.getSampleFrequency(0)

        signals = np.zeros((n_channels, f.getNSamples()[0]))
        for i in range(n_channels):
            signals[i, :] = f.readSignal(i)
    finally:
        f.close()

    return signals, sample_rate, channel_names


def bandpass_filter(signal: np.ndarray, low_freq: float, high_freq: float,
                    sample_rate: float, order: int = 4) -> np.ndarray:
    """Apply Butterworth bandpass filter to signal.

    Args:
        signal: 1D signal array.
        low_freq: Lower cutoff frequency (Hz).
        high_freq: Upper cutoff frequency (Hz).
        sample_rate: Sampling rate (Hz).
        order: Filter order.

    Returns:
        Filtered signal array.
    """
    from scipy.signal import butter, filtfilt

    nyq = sample_rate / 2.0
    low = low_freq / nyq
    high = high_freq / nyq

    # Clamp to valid range
    low = max(low, 0.001)
    high = min(high, 0.999)

    b, a = butter(order, [low, high], btype='band')
    return filtfilt(b, a, signal)


def extract_phase(signal: np.ndarray) -> np.ndarray:
    """Extract instantaneous phase via Hilbert transform.

    Args:
        signal: 1D real-valued signal.

    Returns:
        Instantaneous phase array (radians).
    """
    from scipy.signal import hilbert
    analytic = hilbert(signal)
    return np.angle(analytic)


def extract_amplitude(signal: np.ndarray) -> np.ndarray:
    """Extract instantaneous amplitude envelope via Hilbert transform.

    Args:
        signal: 1D real-valued signal.

    Returns:
        Amplitude envelope array.
    """
    from scipy.signal import hilbert
    analytic = hilbert(signal)
    return np.abs(analytic)


def compute_coherence_from_eeg(
    signals: np.ndarray,
    sample_rate: float,
    band: str = "alpha",
    window_samples: int = None,
    channels: list[int] = None,
) -> dict:
    """Compute QIF coherence metric Cₛ from real EEG signals.

    Processes multi-channel EEG through the full Cₛ pipeline:
    1. Bandpass filter to frequency band
    2. Extract phase, amplitude
    3. Compute σ²ᵩ (phase variance), Hτ (transport entropy), σ²ᵧ (gain variance)
    4. Compute Cₛ = e^(−(σ²ᵩ + Hτ + σ²ᵧ))

    Args:
        signals: EEG data, shape (n_channels, n_samples).
        sample_rate: Sampling rate in Hz.
        band: Frequency band name (delta, theta, alpha, beta, gamma).
        window_samples: Window size for analysis. Defaults to 2 seconds.
        channels: Which channels to use. Defaults to first 16.

    Returns:
        Dict with keys: coherence_values (per window), mean_coherence,
        sigma_phi, sigma_tau, sigma_gamma, band, n_windows.
    """
    from src.qif_equations import phase_variance, gain_variance, coherence_metric

    if band not in FREQ_BANDS:
        raise ValueError(f"Unknown band: {band}. Choose from: {list(FREQ_BANDS.keys())}")

    low_freq, high_freq = FREQ_BANDS[band]

    if channels is None:
        channels = list(range(min(16, signals.shape[0])))

    if window_samples is None:
        window_samples = int(2 * sample_rate)  # 2-second windows

    # Filter all selected channels
    filtered = np.zeros((len(channels), signals.shape[1]))
    for i, ch in enumerate(channels):
        filtered[i] = bandpass_filter(signals[ch], low_freq, high_freq, sample_rate)

    n_samples = filtered.shape[1]
    n_windows = n_samples // window_samples

    coherence_values = []
    sigma_phi_values = []
    sigma_tau_values = []
    sigma_gamma_values = []

    for w in range(n_windows):
        start = w * window_samples
        end = start + window_samples
        window_data = filtered[:, start:end]

        # Phase variance: extract phase from each channel, compute cross-channel variance
        phases_at_midpoint = []
        amplitudes = []
        for ch_data in window_data:
            phase = extract_phase(ch_data)
            amp = extract_amplitude(ch_data)
            # Use phase at window midpoint for cross-channel comparison
            phases_at_midpoint.append(phase[window_samples // 2])
            amplitudes.append(np.mean(amp))

        phases_arr = np.array(phases_at_midpoint)
        amps_arr = np.array(amplitudes)

        # σ²ᵩ — Cross-channel phase coherence
        s_phi = phase_variance(phases_arr)

        # Hτ — Use amplitude correlation as proxy for transport integrity
        # Higher correlation = better transport = lower entropy
        if len(amps_arr) > 1:
            # Normalize amplitudes to probabilities
            amp_probs = amps_arr / (np.sum(amps_arr) + 1e-10)
            amp_probs = np.clip(amp_probs, 1e-10, 1.0)
            # Transport entropy approximation
            s_tau = -np.sum(np.log(amp_probs + 1e-10)) / len(amp_probs)
        else:
            s_tau = 0.0

        # σ²ᵧ — Gain variance across channels
        s_gamma = gain_variance(amps_arr)

        try:
            cs = coherence_metric(s_phi, s_tau, s_gamma)
        except ValueError:
            cs = 0.0

        coherence_values.append(cs)
        sigma_phi_values.append(s_phi)
        sigma_tau_values.append(s_tau)
        sigma_gamma_values.append(s_gamma)

    return {
        'coherence_values': np.array(coherence_values),
        'mean_coherence': np.mean(coherence_values) if coherence_values else 0.0,
        'sigma_phi': np.array(sigma_phi_values),
        'sigma_tau': np.array(sigma_tau_values),
        'sigma_gamma': np.array(sigma_gamma_values),
        'band': band,
        'n_windows': n_windows,
        'sample_rate': sample_rate,
    }


def process_subject(
    subject_id: int,
    runs: list[int] = None,
    bands: list[str] = None,
    data_dir: Path = DATA_DIR,
) -> dict:
    """Process a complete subject: download, load, compute coherence across bands.

    Args:
        subject_id: Subject number (1-109).
        runs: Run numbers to process. Defaults to [1, 2] (baselines).
        bands: Frequency bands to analyze. Defaults to all.
        data_dir: Data directory.

    Returns:
        Dict mapping (run, band) tuples to coherence results.
    """
    if runs is None:
        runs = [1, 2]
    if bands is None:
        bands = list(FREQ_BANDS.keys())

    # Download if needed
    files = download_eegbci(subjects=[subject_id], runs=runs, data_dir=data_dir)

    results = {}
    for filepath in files:
        signals, sr, channels = load_edf(filepath)
        run_name = filepath.stem  # e.g., "S001R01"

        for band in bands:
            result = compute_coherence_from_eeg(signals, sr, band=band)
            results[(run_name, band)] = result

    return results
