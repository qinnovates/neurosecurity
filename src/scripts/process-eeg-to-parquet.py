#!/usr/bin/env python3
"""
EEG Preprocessing Pipeline — Raw EEG (EDF, MAT) to Parquet for QIF Data Studio.

Reads downloaded EEG data from osi-of-mind/qif-lab/data/<dataset-id>/, applies
MNE-Python preprocessing (filtering, downsampling, artifact rejection, PSD), and
outputs Parquet files to src/site/data/parquet/eeg/ for the static Astro site.

Two Parquet files per dataset:
  - {dataset_id}_timeseries.parquet  — Downsampled signal with artifact flags
  - {dataset_id}_spectral.parquet   — Welch PSD power per band per epoch

Plus a unified eeg_catalog.json with metadata for all processed datasets.

Privacy:
  - Epoch-relative timestamps only (no wall-clock times)
  - Anonymized subject IDs (EP_C01, ADHD_P01, NT_M01, etc.)
  - EDF header metadata stripped (meas_date, subject_info)
  - No demographics (age, sex) in output
  - Public browser gets cohort-level aggregates only

Usage:
    python3 scripts/process-eeg-to-parquet.py                     # Process all available
    python3 scripts/process-eeg-to-parquet.py --dataset motor-imagery-physionet
    python3 scripts/process-eeg-to-parquet.py --dry-run            # Show what would be processed
    python3 scripts/process-eeg-to-parquet.py --list               # List processable datasets
    python3 scripts/process-eeg-to-parquet.py --notch 50           # Use 50 Hz notch (EU)

Requires: mne, pyarrow, scipy, numpy
    pip install mne pyarrow scipy numpy
"""

import argparse
import json
import os
import sys
import time
import traceback
from pathlib import Path

# ---------------------------------------------------------------------------
# Dependency check — fail fast with install instructions
# ---------------------------------------------------------------------------
MISSING = []
for pkg, name in [("mne", "mne"), ("pyarrow", "pyarrow"), ("numpy", "numpy"), ("scipy", "scipy")]:
    try:
        __import__(pkg)
    except ImportError:
        MISSING.append(name)

if MISSING:
    print("ERROR: Missing required packages:")
    print(f"  pip install {' '.join(MISSING)}")
    print()
    print("Recommended: create a virtualenv first:")
    print("  python3 -m venv .venv && source .venv/bin/activate")
    print(f"  pip install {' '.join(MISSING)}")
    sys.exit(1)

import mne  # noqa: E402
import numpy as np  # noqa: E402
import pyarrow as pa  # noqa: E402
import pyarrow.parquet as pq  # noqa: E402

# Suppress MNE info logging (keep warnings/errors)
mne.set_log_level("WARNING")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
REGISTRY_PATH = REPO_ROOT / "shared" / "eeg-samples.json"
DATA_DIR = REPO_ROOT / "_archive" / "qif-lab" / "data"
OUTPUT_DIR = REPO_ROOT / "docs" / "data" / "parquet" / "eeg"

# ---------------------------------------------------------------------------
# Processing parameters
# ---------------------------------------------------------------------------
TARGET_SFREQ = 128.0        # Downsample target Hz
BANDPASS_LOW = 0.5           # Hz
BANDPASS_HIGH = 45.0         # Hz
EPOCH_DURATION = 2.0         # seconds
ARTIFACT_THRESHOLD = 200e-6  # 200 µV in volts (MNE uses SI)
# For high-density montages (64ch), artifact = majority of channels exceed threshold
ARTIFACT_CHANNEL_RATIO = 0.25  # Flag epoch if >25% of channels exceed threshold

# PSD frequency bands (Hz)
BANDS = {
    "delta": (0.5, 4.0),
    "theta": (4.0, 8.0),
    "alpha": (8.0, 13.0),
    "beta":  (13.0, 30.0),
    "gamma": (30.0, 45.0),
}

# ---------------------------------------------------------------------------
# Subject ID anonymization prefixes by dataset condition
# ---------------------------------------------------------------------------
ANON_PREFIXES = {
    "motor-imagery-physionet": {"default": "MI_S"},
    "epilepsy-chbmit": {"default": "EP_C"},
    "adhd-mendeley-resting": {"adhd": "ADHD_P", "control": "NT_C", "default": "ADHD_S"},
}


def load_registry() -> list[dict]:
    """Load the EEG samples registry."""
    with open(REGISTRY_PATH) as f:
        data = json.load(f)
    return data.get("samples", [])


def anonymize_subject_id(dataset_id: str, raw_id, group: str = "default") -> str:
    """Generate anonymized subject ID from raw identifier."""
    prefixes = ANON_PREFIXES.get(dataset_id, {"default": "S"})
    prefix = prefixes.get(group, prefixes["default"])
    # Convert raw_id to a zero-padded number
    if isinstance(raw_id, (int, float)):
        num = int(raw_id)
    else:
        # Extract digits from string
        digits = "".join(c for c in str(raw_id) if c.isdigit())
        num = int(digits) if digits else hash(str(raw_id)) % 10000
    return f"{prefix}{num:02d}"


def strip_pii(raw: mne.io.BaseRaw):
    """Strip ALL PII from MNE Raw object in-place.

    Covers: measurement date, subject info, experimenter, description,
    project name/id, device info, file ID. Security review 2026-03-15.
    """
    # Use set_meas_date() for MNE >= 1.0 compatibility
    try:
        raw.set_meas_date(None)
    except (AttributeError, TypeError):
        try:
            raw.info["meas_date"] = None
        except Exception:
            pass
    raw.info["subject_info"] = None
    # Experimenter name
    if "experimenter" in raw.info:
        raw.info["experimenter"] = None
    # Description may contain narrative notes, researcher comments, study identifiers
    if "description" in raw.info:
        raw.info["description"] = None
    # Project name/id could identify the study
    for field in ("proj_name", "proj_id"):
        if field in raw.info:
            raw.info[field] = None
    # Device info may include serial numbers, manufacturer details
    if "device_info" in raw.info:
        raw.info["device_info"] = None
    # File ID preserves original filename which may contain subject identifiers
    if "file_id" in raw.info:
        raw.info["file_id"] = None


def preprocess_raw(raw: mne.io.BaseRaw, notch_freq: float = 60.0) -> mne.io.BaseRaw:
    """Apply standard preprocessing pipeline to raw EEG.

    Steps:
    1. Pick EEG channels only
    2. Bandpass filter 0.5-45 Hz
    3. Notch filter at powerline frequency
    4. Downsample to 128 Hz
    5. Common average reference
    """
    # Pick EEG channels only (drop EMG, EOG, etc.)
    eeg_picks = mne.pick_types(raw.info, eeg=True, exclude="bads")
    if len(eeg_picks) == 0:
        # Fall back to all channels if none are typed as EEG
        print("    Warning: No channels typed as EEG, using all channels")
    else:
        raw.pick(eeg_picks)

    # Load data into memory for filtering
    raw.load_data()

    # Bandpass filter
    raw.filter(BANDPASS_LOW, BANDPASS_HIGH, fir_design="firwin", verbose=False)

    # Notch filter (powerline)
    raw.notch_filter(notch_freq, verbose=False)

    # Downsample
    if raw.info["sfreq"] > TARGET_SFREQ:
        raw.resample(TARGET_SFREQ, verbose=False)

    # Common average reference
    raw.set_eeg_reference("average", projection=False, verbose=False)

    return raw


def create_epochs(raw: mne.io.BaseRaw) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Create fixed-length epochs and flag artifacts.

    Returns:
        data: (n_epochs, n_channels, n_samples) array in microvolts
        artifact_flags: (n_epochs,) boolean array — True = artifact
        ch_names: list of channel names
    """
    sfreq = raw.info["sfreq"]
    n_samples_per_epoch = int(EPOCH_DURATION * sfreq)
    data = raw.get_data()  # (n_channels, n_total_samples) in volts
    n_channels, n_total = data.shape
    n_epochs = n_total // n_samples_per_epoch

    if n_epochs == 0:
        raise ValueError(f"Data too short for {EPOCH_DURATION}s epochs "
                         f"({n_total / sfreq:.1f}s total)")

    # Trim to exact epoch boundaries
    data = data[:, :n_epochs * n_samples_per_epoch]
    # Reshape to (n_epochs, n_channels, n_samples)
    epochs_data = data.reshape(n_channels, n_epochs, n_samples_per_epoch)
    epochs_data = epochs_data.transpose(1, 0, 2)  # (n_epochs, n_channels, n_samples)

    # Convert to microvolts
    epochs_uv = epochs_data * 1e6

    # Artifact rejection: flag epochs where enough channels exceed threshold
    threshold_uv = ARTIFACT_THRESHOLD * 1e6  # 200 µV
    peak_to_peak = epochs_uv.max(axis=2) - epochs_uv.min(axis=2)  # (n_epochs, n_channels)
    channels_exceeding = (peak_to_peak > threshold_uv).sum(axis=1)  # (n_epochs,)
    min_bad_channels = max(1, int(n_channels * ARTIFACT_CHANNEL_RATIO))
    artifact_flags = channels_exceeding >= min_bad_channels  # (n_epochs,)

    return epochs_uv, artifact_flags, raw.ch_names


def compute_psd_features(epochs_data: np.ndarray, sfreq: float) -> list[dict]:
    """Compute Welch PSD per epoch per channel and extract band powers.

    Args:
        epochs_data: (n_epochs, n_channels, n_samples) in µV
        sfreq: sampling frequency

    Returns:
        List of dicts with band power values
    """
    from scipy.signal import welch

    n_epochs, n_channels, n_samples = epochs_data.shape
    rows = []

    for ep in range(n_epochs):
        for ch in range(n_channels):
            signal = epochs_data[ep, ch, :]
            # Welch PSD — use nperseg that fits within the epoch
            nperseg = min(n_samples, int(sfreq * 1.0))  # 1-second windows
            freqs, psd = welch(signal, fs=sfreq, nperseg=nperseg, noverlap=nperseg // 2)

            # Extract band powers (mean PSD in each band)
            band_powers = {}
            for band_name, (fmin, fmax) in BANDS.items():
                idx = np.logical_and(freqs >= fmin, freqs <= fmax)
                if np.any(idx):
                    band_powers[f"{band_name}_power"] = float(np.mean(psd[idx]))
                else:
                    band_powers[f"{band_name}_power"] = 0.0

            total = sum(band_powers.values())
            theta_beta = (band_powers["theta_power"] / band_powers["beta_power"]
                          if band_powers["beta_power"] > 0 else 0.0)

            rows.append({
                "epoch_id": ep,
                "channel_idx": ch,
                "total_power": total,
                "theta_beta_ratio": theta_beta,
                **band_powers,
            })

    return rows


# ---------------------------------------------------------------------------
# Dataset-specific loaders
# ---------------------------------------------------------------------------

def find_edf_files(data_dir: Path) -> list[Path]:
    """Recursively find EDF files in a directory."""
    edfs = sorted(data_dir.rglob("*.edf"))
    # Filter out hypnogram/annotation files
    edfs = [f for f in edfs if "hypnogram" not in f.name.lower()
            and "hyp" not in f.stem.lower().split("-")[-1:][0][:3]]
    return edfs


def find_mat_files(data_dir: Path) -> list[Path]:
    """Find MAT files in a directory."""
    return sorted(data_dir.rglob("*.mat"))


def process_motor_imagery_physionet(data_dir: Path, notch_freq: float,
                                    dry_run: bool = False) -> dict | None:
    """Process PhysioNet EEGMMIDB (Motor Movement/Imagery).

    Uses mne.datasets.eegbci to fetch data if not already downloaded.
    Processes subjects 1-5 (small sample for site use).
    """
    dataset_id = "motor-imagery-physionet"
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Processing: PhysioNet Motor Imagery (EEGMMIDB)")

    # Check for manually downloaded EDF files first
    edfs = find_edf_files(data_dir / dataset_id) if (data_dir / dataset_id).exists() else []

    if edfs:
        print(f"  Found {len(edfs)} EDF files in {data_dir / dataset_id}")
        if dry_run:
            for f in edfs[:5]:
                print(f"    - {f.name}")
            if len(edfs) > 5:
                print(f"    ... and {len(edfs) - 5} more")
            return {"dataset_id": dataset_id, "status": "dry_run", "files": len(edfs)}
        return _process_edf_dataset(
            dataset_id=dataset_id,
            edf_files=edfs[:10],  # Cap at 10 files for site use
            notch_freq=notch_freq,
            condition_fn=_mi_condition_from_filename,
            subject_fn=_mi_subject_from_filename,
        )

    # Fall back to MNE's built-in EEGBCI downloader
    print("  No local EDF files found. Using mne.datasets.eegbci...")
    try:
        from mne.datasets import eegbci
    except ImportError:
        print("  ERROR: mne.datasets.eegbci not available")
        return None

    # Runs 1=baseline eyes open, 2=baseline eyes closed,
    # 3=task1 (open/close left/right fist), 4=task1 imagine
    subjects = list(range(1, 6))  # 5 subjects
    runs = [1, 2, 3, 4]

    if dry_run:
        print(f"  Would process {len(subjects)} subjects x {len(runs)} runs")
        print(f"  Subjects: {subjects}")
        print(f"  Runs: {runs} (baseline open, baseline closed, motor real, motor imagery)")
        return {"dataset_id": dataset_id, "status": "dry_run",
                "subjects": len(subjects), "runs": len(runs)}

    all_ts_rows = []
    all_spectral_rows = []
    total_epochs = 0
    total_artifacts = 0
    channels_used = set()

    for subj in subjects:
        anon_id = anonymize_subject_id(dataset_id, subj)
        print(f"  Subject {subj} -> {anon_id}")

        for run in runs:
            condition = {1: "baseline_open", 2: "baseline_closed",
                         3: "motor_real", 4: "motor_imagery"}.get(run, f"run_{run}")
            try:
                # eegbci.load_data downloads if needed, returns file paths
                raw_files = eegbci.load_data(subj, [run], update_path=False)
                raw = mne.io.read_raw_edf(raw_files[0], preload=False, verbose=False)

                # Standardize channel names (MNE EEGBCI uses non-standard names)
                try:
                    eegbci.standardize(raw)
                except Exception:
                    pass  # Some versions don't have this

                # Strip PII
                strip_pii(raw)

                # Preprocess
                raw = preprocess_raw(raw, notch_freq=notch_freq)

                # Create epochs
                epochs_data, artifact_flags, ch_names = create_epochs(raw)
                channels_used.update(ch_names)
                n_ep = epochs_data.shape[0]
                n_art = int(artifact_flags.sum())
                total_epochs += n_ep
                total_artifacts += n_art

                sfreq = raw.info["sfreq"]
                n_samples = epochs_data.shape[2]

                # For high-density montages, select key channels for timeseries
                # to keep file size manageable for the static site
                key_channels = {"C3", "C4", "Cz", "Fz", "Pz", "O1", "O2",
                                "F3", "F4", "P3", "P4", "T7", "T8", "Fp1", "Fp2"}
                if len(ch_names) > 16:
                    ts_ch_indices = [i for i, ch in enumerate(ch_names)
                                     if ch in key_channels]
                    if not ts_ch_indices:
                        # Fallback: take every 4th channel
                        ts_ch_indices = list(range(0, len(ch_names), 4))
                else:
                    ts_ch_indices = list(range(len(ch_names)))

                # Subsample timeseries: every 2nd sample (still 64 Hz, plenty for visualization)
                ts_subsample = 2

                # Timeseries rows (subset of channels + subsampled)
                for ep_idx in range(n_ep):
                    for ch_idx in ts_ch_indices:
                        ch_name = ch_names[ch_idx]
                        for samp_idx in range(0, n_samples, ts_subsample):
                            all_ts_rows.append({
                                "timestamp_ms": round(samp_idx / sfreq * 1000, 2),
                                "epoch_id": total_epochs - n_ep + ep_idx,
                                "subject_id": anon_id,
                                "channel": ch_name,
                                "amplitude_uv": round(float(epochs_data[ep_idx, ch_idx, samp_idx]), 3),
                                "condition": condition,
                                "dataset_id": dataset_id,
                                "is_artifact": bool(artifact_flags[ep_idx]),
                            })

                # Spectral rows
                psd_rows = compute_psd_features(epochs_data, sfreq)
                for row in psd_rows:
                    row["epoch_id"] = total_epochs - n_ep + row["epoch_id"]
                    row["subject_id"] = anon_id
                    row["channel"] = ch_names[row.pop("channel_idx")]
                    row["condition"] = condition
                    row["dataset_id"] = dataset_id
                all_spectral_rows.extend(psd_rows)

                print(f"    Run {run} ({condition}): {n_ep} epochs, {n_art} artifacts")

            except Exception as e:
                print(f"    Run {run} failed: {e}")
                continue

    if not all_ts_rows:
        print("  No data processed")
        return None

    return _write_parquet(dataset_id, all_ts_rows, all_spectral_rows,
                          total_epochs, total_artifacts, sorted(channels_used))


def _mi_condition_from_filename(path: Path) -> str:
    """Infer condition from EEGMMIDB filename."""
    name = path.stem.lower()
    if "r01" in name:
        return "baseline_open"
    elif "r02" in name:
        return "baseline_closed"
    elif "r03" in name or "r07" in name or "r11" in name:
        return "motor_real"
    elif "r04" in name or "r08" in name or "r12" in name:
        return "motor_imagery"
    return "unknown"


def _mi_subject_from_filename(path: Path) -> str:
    """Extract subject number from EEGMMIDB filename (e.g. S001R01.edf -> 1)."""
    name = path.stem.upper()
    if name.startswith("S") and "R" in name:
        subj_str = name.split("R")[0][1:]
        return subj_str.lstrip("0") or "0"
    return path.stem


def process_epilepsy_chbmit(data_dir: Path, notch_freq: float,
                            dry_run: bool = False) -> dict | None:
    """Process CHB-MIT Scalp EEG (Epilepsy) dataset."""
    dataset_id = "epilepsy-chbmit"
    dataset_dir = data_dir / dataset_id
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Processing: CHB-MIT Epilepsy")

    if not dataset_dir.exists():
        print(f"  Dataset directory not found: {dataset_dir}")
        print(f"  Run: npm run eeg:download or python3 datalake/scripts/download-eeg-samples.py --dataset epilepsy-chbmit")
        return None

    edfs = find_edf_files(dataset_dir)
    if not edfs:
        print(f"  No EDF files found in {dataset_dir}")
        return None

    print(f"  Found {len(edfs)} EDF files")

    if dry_run:
        for f in edfs[:5]:
            print(f"    - {f.relative_to(dataset_dir)}")
        if len(edfs) > 5:
            print(f"    ... and {len(edfs) - 5} more")
        return {"dataset_id": dataset_id, "status": "dry_run", "files": len(edfs)}

    return _process_edf_dataset(
        dataset_id=dataset_id,
        edf_files=edfs[:10],  # Cap for site use
        notch_freq=notch_freq,
        condition_fn=_chbmit_condition_from_filename,
        subject_fn=_chbmit_subject_from_filename,
    )


def _chbmit_condition_from_filename(path: Path) -> str:
    """Infer condition from CHB-MIT filename.

    Seizure annotations are in .seizures sidecar files.
    Without reading the annotation file, mark as 'continuous_monitoring'.
    """
    seizure_file = path.with_suffix(".edf.seizures")
    if seizure_file.exists():
        return "seizure_recording"
    return "interictal"


def _chbmit_subject_from_filename(path: Path) -> str:
    """Extract subject from CHB-MIT path (e.g. chb01/chb01_03.edf -> 1)."""
    name = path.stem.lower()
    if name.startswith("chb"):
        subj_str = name[3:5]
        return subj_str.lstrip("0") or "0"
    return path.stem


def process_adhd_mendeley(data_dir: Path, notch_freq: float,
                          dry_run: bool = False) -> dict | None:
    """Process ADHD Adult Resting State (Mendeley) MAT files."""
    from scipy.io import loadmat

    dataset_id = "adhd-mendeley-resting"
    dataset_dir = data_dir / dataset_id
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Processing: ADHD Mendeley Resting State")

    if not dataset_dir.exists():
        print(f"  Dataset directory not found: {dataset_dir}")
        return None

    mat_files = find_mat_files(dataset_dir)
    if not mat_files:
        print(f"  No MAT files found in {dataset_dir}")
        print(f"  Download from: https://data.mendeley.com/datasets/6k4g25fhzg/1")
        return None

    print(f"  Found {len(mat_files)} MAT files")

    if dry_run:
        for f in mat_files[:5]:
            print(f"    - {f.name}")
        if len(mat_files) > 5:
            print(f"    ... and {len(mat_files) - 5} more")
        return {"dataset_id": dataset_id, "status": "dry_run", "files": len(mat_files)}

    # Channel names from registry
    ch_names = ["O1", "F3", "F4", "Cz", "Fz"]
    sfreq_original = 256.0

    all_ts_rows = []
    all_spectral_rows = []
    total_epochs = 0
    total_artifacts = 0

    for mat_idx, mat_file in enumerate(mat_files[:20]):  # Cap at 20 files
        try:
            mat_data = loadmat(str(mat_file), squeeze_me=True)

            # Determine group from filename convention
            fname = mat_file.stem.lower()
            if "adhd" in fname or fname.startswith("a"):
                group = "adhd"
            elif "control" in fname or fname.startswith("c") or fname.startswith("h"):
                group = "control"
            else:
                group = "default"

            anon_id = anonymize_subject_id(dataset_id, mat_idx + 1, group)

            # Find the EEG data array in the MAT file
            # Mendeley ADHD dataset typically stores data as a 2D array
            eeg_data = None
            for key in mat_data:
                if key.startswith("_"):
                    continue
                val = mat_data[key]
                if hasattr(val, "shape") and len(val.shape) == 2:
                    # Expect (channels, samples) or (samples, channels)
                    if val.shape[0] in [5, len(ch_names)] or val.shape[1] in [5, len(ch_names)]:
                        eeg_data = val
                        break

            if eeg_data is None:
                print(f"    {mat_file.name}: Could not find EEG data array, skipping")
                continue

            # Ensure shape is (channels, samples)
            if eeg_data.shape[1] in [5, len(ch_names)] and eeg_data.shape[0] > eeg_data.shape[1]:
                eeg_data = eeg_data.T

            n_ch = min(eeg_data.shape[0], len(ch_names))
            actual_ch_names = ch_names[:n_ch]

            # Create MNE Raw from array
            info = mne.create_info(ch_names=actual_ch_names, sfreq=sfreq_original, ch_types="eeg")
            raw = mne.io.RawArray(eeg_data[:n_ch] * 1e-6, info, verbose=False)  # Assume µV input

            strip_pii(raw)
            raw = preprocess_raw(raw, notch_freq=notch_freq)

            # Determine condition from filename
            condition = "resting_state"
            if "cognitive" in fname or "cog" in fname:
                condition = "cognitive_challenge"
            elif "sound" in fname:
                condition = "sound_listening"

            epochs_data, artifact_flags, used_ch_names = create_epochs(raw)
            n_ep = epochs_data.shape[0]
            n_art = int(artifact_flags.sum())
            total_epochs += n_ep
            total_artifacts += n_art

            sfreq = raw.info["sfreq"]
            n_samples = epochs_data.shape[2]

            # Timeseries — subsample for site (every 4th sample to keep files small)
            subsample = 4
            for ep_idx in range(n_ep):
                for ch_idx, ch_name in enumerate(used_ch_names):
                    for samp_idx in range(0, n_samples, subsample):
                        all_ts_rows.append({
                            "timestamp_ms": round(samp_idx / sfreq * 1000, 2),
                            "epoch_id": total_epochs - n_ep + ep_idx,
                            "subject_id": anon_id,
                            "channel": ch_name,
                            "amplitude_uv": round(float(epochs_data[ep_idx, ch_idx, samp_idx]), 3),
                            "condition": condition,
                            "dataset_id": dataset_id,
                            "is_artifact": bool(artifact_flags[ep_idx]),
                        })

            # Spectral
            psd_rows = compute_psd_features(epochs_data, sfreq)
            for row in psd_rows:
                row["epoch_id"] = total_epochs - n_ep + row["epoch_id"]
                row["subject_id"] = anon_id
                row["channel"] = used_ch_names[row.pop("channel_idx")]
                row["condition"] = condition
                row["dataset_id"] = dataset_id
            all_spectral_rows.extend(psd_rows)

            print(f"    {mat_file.name} ({group}): {n_ep} epochs, {n_art} artifacts -> {anon_id}")

        except Exception as e:
            print(f"    {mat_file.name} failed: {e}")
            continue

    if not all_ts_rows:
        print("  No data processed")
        return None

    return _write_parquet(dataset_id, all_ts_rows, all_spectral_rows,
                          total_epochs, total_artifacts, ch_names)


# ---------------------------------------------------------------------------
# Generic EDF processor
# ---------------------------------------------------------------------------

def _process_edf_dataset(
    dataset_id: str,
    edf_files: list[Path],
    notch_freq: float,
    condition_fn,
    subject_fn,
) -> dict | None:
    """Generic EDF processing pipeline."""
    all_ts_rows = []
    all_spectral_rows = []
    total_epochs = 0
    total_artifacts = 0
    channels_used = set()

    for edf_path in edf_files:
        try:
            raw = mne.io.read_raw_edf(str(edf_path), preload=False, verbose=False)
            strip_pii(raw)
            raw = preprocess_raw(raw, notch_freq=notch_freq)

            subj_raw = subject_fn(edf_path)
            anon_id = anonymize_subject_id(dataset_id, subj_raw)
            condition = condition_fn(edf_path)

            epochs_data, artifact_flags, ch_names = create_epochs(raw)
            channels_used.update(ch_names)
            n_ep = epochs_data.shape[0]
            n_art = int(artifact_flags.sum())
            total_epochs += n_ep
            total_artifacts += n_art

            sfreq = raw.info["sfreq"]
            n_samples = epochs_data.shape[2]

            # For large datasets, subsample timeseries (every 4th sample)
            subsample = 4 if n_ep > 50 else 1

            for ep_idx in range(n_ep):
                for ch_idx, ch_name in enumerate(ch_names):
                    for samp_idx in range(0, n_samples, subsample):
                        all_ts_rows.append({
                            "timestamp_ms": round(samp_idx / sfreq * 1000, 2),
                            "epoch_id": total_epochs - n_ep + ep_idx,
                            "subject_id": anon_id,
                            "channel": ch_name,
                            "amplitude_uv": round(float(epochs_data[ep_idx, ch_idx, samp_idx]), 3),
                            "condition": condition,
                            "dataset_id": dataset_id,
                            "is_artifact": bool(artifact_flags[ep_idx]),
                        })

            # Spectral
            psd_rows = compute_psd_features(epochs_data, sfreq)
            for row in psd_rows:
                row["epoch_id"] = total_epochs - n_ep + row["epoch_id"]
                row["subject_id"] = anon_id
                row["channel"] = ch_names[row.pop("channel_idx")]
                row["condition"] = condition
                row["dataset_id"] = dataset_id
            all_spectral_rows.extend(psd_rows)

            print(f"    {edf_path.name}: {n_ep} epochs, {n_art} artifacts -> {anon_id}")

        except Exception as e:
            print(f"    {edf_path.name} failed: {e}")
            continue

    if not all_ts_rows:
        print("  No data processed")
        return None

    return _write_parquet(dataset_id, all_ts_rows, all_spectral_rows,
                          total_epochs, total_artifacts, sorted(channels_used))


# ---------------------------------------------------------------------------
# Parquet output
# ---------------------------------------------------------------------------

def _write_parquet(
    dataset_id: str,
    ts_rows: list[dict],
    spectral_rows: list[dict],
    total_epochs: int,
    total_artifacts: int,
    channels: list[str],
) -> dict:
    """Write timeseries and spectral Parquet files."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # --- Timeseries Parquet ---
    ts_path = OUTPUT_DIR / f"{dataset_id}_timeseries.parquet"
    ts_schema = pa.schema([
        ("timestamp_ms", pa.float64()),
        ("epoch_id", pa.int32()),
        ("subject_id", pa.string()),
        ("channel", pa.string()),
        ("amplitude_uv", pa.float32()),
        ("condition", pa.string()),
        ("dataset_id", pa.string()),
        ("is_artifact", pa.bool_()),
    ])

    ts_table = pa.table({
        col: [row[col] for row in ts_rows]
        for col in ts_schema.names
    }, schema=ts_schema)

    pq.write_table(ts_table, ts_path, compression="snappy")
    ts_size = ts_path.stat().st_size

    # --- Spectral Parquet ---
    sp_path = OUTPUT_DIR / f"{dataset_id}_spectral.parquet"
    sp_schema = pa.schema([
        ("epoch_id", pa.int32()),
        ("subject_id", pa.string()),
        ("channel", pa.string()),
        ("condition", pa.string()),
        ("dataset_id", pa.string()),
        ("delta_power", pa.float64()),
        ("theta_power", pa.float64()),
        ("alpha_power", pa.float64()),
        ("beta_power", pa.float64()),
        ("gamma_power", pa.float64()),
        ("theta_beta_ratio", pa.float64()),
        ("total_power", pa.float64()),
    ])

    sp_table = pa.table({
        col: [row[col] for row in spectral_rows]
        for col in sp_schema.names
    }, schema=sp_schema)

    pq.write_table(sp_table, sp_path, compression="snappy")
    sp_size = sp_path.stat().st_size

    print(f"  Output:")
    print(f"    {ts_path.name}: {len(ts_rows):,} rows, {ts_size / 1024:.0f} KB")
    print(f"    {sp_path.name}: {len(spectral_rows):,} rows, {sp_size / 1024:.0f} KB")

    artifact_pct = (total_artifacts / total_epochs * 100) if total_epochs > 0 else 0

    return {
        "dataset_id": dataset_id,
        "status": "processed",
        "total_epochs": total_epochs,
        "total_artifacts": total_artifacts,
        "artifact_rejection_pct": round(artifact_pct, 1),
        "channels": channels,
        "n_channels": len(channels),
        "sfreq_hz": TARGET_SFREQ,
        "epoch_duration_s": EPOCH_DURATION,
        "bandpass_hz": [BANDPASS_LOW, BANDPASS_HIGH],
        "timeseries_rows": len(ts_rows),
        "spectral_rows": len(spectral_rows),
        "timeseries_file": f"eeg/{dataset_id}_timeseries.parquet",
        "spectral_file": f"eeg/{dataset_id}_spectral.parquet",
        "timeseries_size_kb": round(ts_size / 1024, 1),
        "spectral_size_kb": round(sp_size / 1024, 1),
    }


def write_catalog(results: list[dict]):
    """Write eeg_catalog.json with metadata for all processed datasets."""
    catalog_path = OUTPUT_DIR / "eeg_catalog.json"
    catalog = {
        "_meta": {
            "description": "EEG Parquet file catalog — processed by scripts/process-eeg-to-parquet.py",
            "version": "1.0.0",
            "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "pipeline": {
                "bandpass_hz": [BANDPASS_LOW, BANDPASS_HIGH],
                "notch_filter_hz": "60 (US) or 50 (EU), configurable via --notch",
                "downsample_hz": TARGET_SFREQ,
                "reference": "common_average",
                "epoch_duration_s": EPOCH_DURATION,
                "artifact_threshold_uv": ARTIFACT_THRESHOLD * 1e6,
                "psd_method": "welch",
                "psd_bands": {k: list(v) for k, v in BANDS.items()},
            },
            "privacy": {
                "timestamps": "epoch-relative (ms from epoch start)",
                "subject_ids": "anonymized (prefix_NN format)",
                "demographics": "excluded",
                "header_metadata": "stripped (meas_date, subject_info)",
            },
        },
        "datasets": results,
    }

    with open(catalog_path, "w") as f:
        json.dump(catalog, f, indent=2)
    print(f"\nCatalog written: {catalog_path}")


# ---------------------------------------------------------------------------
# Dataset dispatch
# ---------------------------------------------------------------------------

PROCESSORS = {
    "motor-imagery-physionet": process_motor_imagery_physionet,
    "epilepsy-chbmit": process_epilepsy_chbmit,
    "adhd-mendeley-resting": process_adhd_mendeley,
}


def main():
    parser = argparse.ArgumentParser(
        description="Process raw EEG data to Parquet for QIF Data Studio"
    )
    parser.add_argument("--dataset", type=str, help="Process specific dataset by ID")
    parser.add_argument("--list", action="store_true", help="List processable datasets")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be processed")
    parser.add_argument("--notch", type=float, default=60.0,
                        help="Notch filter frequency in Hz (default: 60 for US, use 50 for EU)")
    args = parser.parse_args()

    registry = load_registry()

    if args.list:
        print(f"\nProcessable EEG Datasets ({len(PROCESSORS)} configured)\n")
        print(f"{'ID':<30} {'Format':<8} {'Channels':<10} {'Hz':<6} {'License':<12} {'Status'}")
        print("-" * 90)
        for sample in registry:
            if sample["id"] in PROCESSORS:
                data_dir = DATA_DIR / sample["id"]
                # Check for actual data files, not just attribution metadata
                data_exts = {".edf", ".mat", ".csv", ".txt"}
                has_data = data_dir.exists() and any(
                    f for f in data_dir.rglob("*.*") if f.suffix.lower() in data_exts
                )
                # Special case: motor-imagery uses MNE downloader
                if sample["id"] == "motor-imagery-physionet":
                    has_data = True  # Always available via MNE
                status = "ready" if has_data else "not downloaded"
                print(f"{sample['id']:<30} {sample.get('format', '?'):<8} "
                      f"{sample.get('channels', '?'):<10} {sample.get('samplingRateHz', '?'):<6} "
                      f"{sample['license']:<12} {status}")
        return

    # Determine which datasets to process
    if args.dataset:
        if args.dataset not in PROCESSORS:
            print(f"Dataset '{args.dataset}' not configured for processing")
            print(f"Available: {', '.join(PROCESSORS.keys())}")
            sys.exit(1)
        datasets_to_process = [args.dataset]
    else:
        datasets_to_process = list(PROCESSORS.keys())

    print(f"EEG Preprocessing Pipeline")
    print(f"  Output: {OUTPUT_DIR}")
    print(f"  Notch filter: {args.notch} Hz")
    print(f"  Bandpass: {BANDPASS_LOW}-{BANDPASS_HIGH} Hz")
    print(f"  Downsample: {TARGET_SFREQ} Hz")
    print(f"  Epoch duration: {EPOCH_DURATION}s")
    print(f"  Artifact threshold: {ARTIFACT_THRESHOLD * 1e6} µV")

    results = []
    for dataset_id in datasets_to_process:
        processor = PROCESSORS[dataset_id]
        try:
            result = processor(DATA_DIR, notch_freq=args.notch, dry_run=args.dry_run)
            if result:
                results.append(result)
        except Exception as e:
            print(f"\n  ERROR processing {dataset_id}: {e}")
            traceback.print_exc()

    # Write catalog (even in dry-run, write a preview)
    if results and not args.dry_run:
        write_catalog(results)

    # Summary
    print(f"\n{'=' * 60}")
    processed = [r for r in results if r.get("status") == "processed"]
    skipped = [r for r in results if r.get("status") == "dry_run"]
    print(f"Processed: {len(processed)}/{len(datasets_to_process)}")
    if skipped:
        print(f"Dry-run previewed: {len(skipped)}")
    for r in results:
        status = r.get("status", "unknown")
        if status == "processed":
            print(f"  OK  {r['dataset_id']}: {r['total_epochs']} epochs, "
                  f"{r['artifact_rejection_pct']}% rejected, "
                  f"{r['timeseries_size_kb']:.0f}+{r['spectral_size_kb']:.0f} KB")
        else:
            print(f"  --  {r['dataset_id']}: {status}")

    failed = len(datasets_to_process) - len(results)
    if failed > 0:
        print(f"  Skipped/failed: {failed}")


if __name__ == "__main__":
    main()
