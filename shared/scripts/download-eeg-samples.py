#!/usr/bin/env python3
"""
Download publicly available EEG sample datasets for BCI security research.

Reads shared/eeg-samples.json and downloads datasets marked as redistributable.
Each dataset is saved to qif-framework/qif-lab/data/<dataset-id>/ with source
attribution metadata.

Usage:
    python3 shared/scripts/download-eeg-samples.py                # Download all redistributable
    python3 shared/scripts/download-eeg-samples.py --dataset adhd-mendeley-resting
    python3 shared/scripts/download-eeg-samples.py --list         # List available datasets
    python3 shared/scripts/download-eeg-samples.py --dry-run      # Show what would be downloaded

Requires: scipy (for .mat files), requests
    pip install scipy requests
"""

import argparse
import json
import os
import sys
import zipfile
from pathlib import Path

# Resolve paths relative to repo root
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
REGISTRY_PATH = REPO_ROOT / "shared" / "eeg-samples.json"
DATA_DIR = REPO_ROOT / "qif-framework" / "qif-lab" / "data"

# Download configs for each dataset that has a direct download path
# Mendeley Data API: https://data.mendeley.com/public-files/datasets/<id>/files/<file-id>/file_downloaded
DOWNLOAD_CONFIGS = {
    "adhd-mendeley-resting": {
        "method": "mendeley",
        "dataset_doi": "10.17632/6k4g25fhzg.1",
        "api_url": "https://data.mendeley.com/public-files/datasets/6k4g25fhzg/files",
        "description": "ADHD Adult Resting State EEG (CC BY 4.0)",
        "expected_format": "mat",
        "manual_url": "https://data.mendeley.com/datasets/6k4g25fhzg/1",
    },
    "epilepsy-chbmit": {
        "method": "physionet",
        "base_url": "https://physionet.org/files/chbmit/1.0.0",
        "description": "CHB-MIT Scalp EEG — Epilepsy (ODC-BY)",
        "expected_format": "edf",
        "subjects": ["chb01", "chb02", "chb03"],  # Download first 3 by default
    },
    "sleep-edf-expanded": {
        "method": "physionet",
        "base_url": "https://physionet.org/files/sleep-edfx/1.0.0/sleep-cassette",
        "description": "Sleep-EDF Expanded (ODC-BY)",
        "expected_format": "edf",
        "files": ["SC4001E0-PSG.edf", "SC4001EC-Hypnogram.edf",
                   "SC4002E0-PSG.edf", "SC4002EC-Hypnogram.edf"],
    },
    "motor-imagery-physionet": {
        "method": "existing",
        "description": "Already integrated in qif-lab/src/real_data.py via download_eegbci()",
    },
    "alcoholism-uci": {
        "method": "uci",
        "url": "https://archive.ics.uci.edu/static/public/121/eeg+database.zip",
        "description": "UCI EEG Alcoholism (CC BY 4.0)",
        "expected_format": "txt",
    },
}


def load_registry() -> list[dict]:
    """Load the EEG samples registry."""
    with open(REGISTRY_PATH) as f:
        data = json.load(f)
    return data.get("samples", [])


def write_attribution(dest_dir: Path, sample: dict):
    """Write source attribution metadata alongside downloaded data."""
    meta = {
        "id": sample["id"],
        "name": sample["name"],
        "source": sample["source"],
        "source_url": sample.get("sourceUrl", ""),
        "license": sample["license"],
        "redistributable": sample["redistributable"],
        "conditions": sample.get("condition", []),
        "dsm5_code": sample.get("dsm5Code"),
        "channels": sample.get("channels"),
        "sampling_rate_hz": sample.get("samplingRateHz"),
        "format": sample.get("format"),
        "subjects": sample.get("subjects"),
        "paradigm": sample.get("paradigm", ""),
        "notes": sample.get("notes", ""),
        "downloaded_by": "shared/scripts/download-eeg-samples.py",
    }
    with open(dest_dir / "ATTRIBUTION.json", "w") as f:
        json.dump(meta, f, indent=2)

    # Also write a human-readable attribution file
    with open(dest_dir / "ATTRIBUTION.md", "w") as f:
        f.write(f"# {sample['name']}\n\n")
        f.write(f"**Source:** {sample['source']}\n")
        if sample.get("sourceUrl"):
            f.write(f"**URL:** {sample['sourceUrl']}\n")
        f.write(f"**License:** {sample['license']}\n")
        f.write(f"**Redistributable:** {'Yes' if sample['redistributable'] else 'No'}\n\n")
        if sample.get("condition"):
            f.write(f"**Conditions:** {', '.join(sample['condition'])}\n")
        if sample.get("dsm5Code"):
            f.write(f"**DSM-5-TR Code:** {sample['dsm5Code']}\n")
        f.write(f"**Channels:** {sample.get('channels', 'N/A')}\n")
        f.write(f"**Sampling Rate:** {sample.get('samplingRateHz', 'N/A')} Hz\n")
        f.write(f"**Format:** {sample.get('format', 'N/A')}\n")
        f.write(f"**Subjects:** {sample.get('subjects', 'N/A')}\n\n")
        if sample.get("paradigm"):
            f.write(f"**Paradigm:** {sample['paradigm']}\n\n")
        if sample.get("notes"):
            f.write(f"**Notes:** {sample['notes']}\n")


def download_mendeley(sample: dict, config: dict, dest_dir: Path, dry_run: bool = False):
    """Download from Mendeley Data (CC BY 4.0)."""
    try:
        import requests
    except ImportError:
        print("  ERROR: requests required. pip install requests")
        return False

    dest_dir.mkdir(parents=True, exist_ok=True)

    if dry_run:
        print(f"  Would download from: {config['manual_url']}")
        print(f"  Destination: {dest_dir}")
        return True

    # Mendeley Data API — list files in dataset
    print(f"  Fetching file list from Mendeley Data...")
    api_url = config["api_url"]

    # Try the Mendeley Data download page directly
    # The dataset page provides download links for individual files
    dataset_url = config["manual_url"]
    print(f"  Dataset page: {dataset_url}")

    # Mendeley provides a ZIP download for the full dataset
    # Try the direct download endpoint
    zip_url = f"https://data.mendeley.com/datasets/6k4g25fhzg/1/files?dl=1"
    zip_path = dest_dir / "dataset.zip"

    try:
        print(f"  Attempting bulk download...")
        resp = requests.get(zip_url, stream=True, timeout=60, allow_redirects=True)

        if resp.status_code == 200 and len(resp.content) > 1000:
            # Check if we got HTML instead of actual data (Mendeley redirect)
            content_type = resp.headers.get("content-type", "")
            first_bytes = resp.content[:50]
            if b"<!DOCTYPE" in first_bytes or b"<html" in first_bytes or "text/html" in content_type:
                print(f"  Got HTML redirect instead of data file — requires browser download")
            else:
                with open(zip_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=8192):
                        f.write(chunk)
                print(f"  Downloaded: {zip_path} ({zip_path.stat().st_size / 1024:.0f} KB)")

                if zipfile.is_zipfile(zip_path):
                    with zipfile.ZipFile(zip_path, "r") as zf:
                        zf.extractall(dest_dir)
                    print(f"  Extracted to: {dest_dir}")
                    zip_path.unlink()
                return True
        else:
            print(f"  Bulk download returned status {resp.status_code}")
    except Exception as e:
        print(f"  Bulk download failed: {e}")

    # Fallback: provide manual instructions
    print(f"\n  === MANUAL DOWNLOAD REQUIRED ===")
    print(f"  Mendeley Data requires browser-based download for this dataset.")
    print(f"  1. Open: {dataset_url}")
    print(f"  2. Click 'Download All' or download individual .mat files")
    print(f"  3. Save files to: {dest_dir}")
    print(f"  4. Re-run this script to verify and generate attribution files")

    # Still write attribution so the directory is marked
    write_attribution(dest_dir, sample)
    return False


def download_physionet(sample: dict, config: dict, dest_dir: Path, dry_run: bool = False):
    """Download from PhysioNet (ODC-BY)."""
    try:
        import requests
    except ImportError:
        print("  ERROR: requests required. pip install requests")
        return False

    dest_dir.mkdir(parents=True, exist_ok=True)
    base_url = config["base_url"]

    if "subjects" in config:
        files_to_get = []
        for subj in config["subjects"]:
            # For CHB-MIT, download the summary file and first few EDF files
            files_to_get.append(f"{subj}/{subj}-summary.txt")
            # Just get first 2 EDF files per subject to keep download small
            for i in range(1, 3):
                files_to_get.append(f"{subj}/{subj}_{i:02d}.edf")
    elif "files" in config:
        files_to_get = config["files"]
    else:
        print(f"  No files configured for this dataset")
        return False

    if dry_run:
        print(f"  Would download {len(files_to_get)} files from: {base_url}")
        for f in files_to_get[:5]:
            print(f"    - {f}")
        if len(files_to_get) > 5:
            print(f"    ... and {len(files_to_get) - 5} more")
        return True

    downloaded = 0
    for filename in files_to_get:
        url = f"{base_url}/{filename}"
        filepath = dest_dir / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)

        if filepath.exists():
            print(f"  Already exists: {filename}")
            downloaded += 1
            continue

        try:
            resp = requests.get(url, timeout=60)
            if resp.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(resp.content)
                print(f"  Downloaded: {filename} ({len(resp.content) / 1024:.0f} KB)")
                downloaded += 1
            else:
                print(f"  Failed ({resp.status_code}): {filename}")
        except Exception as e:
            print(f"  Error downloading {filename}: {e}")

    write_attribution(dest_dir, sample)
    print(f"  Downloaded {downloaded}/{len(files_to_get)} files")
    return downloaded > 0


def download_uci(sample: dict, config: dict, dest_dir: Path, dry_run: bool = False):
    """Download from UCI ML Archive (CC BY 4.0)."""
    try:
        import requests
    except ImportError:
        print("  ERROR: requests required. pip install requests")
        return False

    dest_dir.mkdir(parents=True, exist_ok=True)

    if dry_run:
        print(f"  Would download: {config['url']}")
        print(f"  Destination: {dest_dir}")
        return True

    zip_path = dest_dir / "eeg-database.zip"
    if zip_path.exists() or any(dest_dir.glob("*.rd")):
        print(f"  Already downloaded")
        return True

    try:
        print(f"  Downloading UCI EEG database ZIP...")
        resp = requests.get(config["url"], stream=True, timeout=120)
        if resp.status_code == 200:
            with open(zip_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"  Downloaded: {zip_path.stat().st_size / 1024 / 1024:.1f} MB")

            if zipfile.is_zipfile(zip_path):
                with zipfile.ZipFile(zip_path, "r") as zf:
                    zf.extractall(dest_dir)
                print(f"  Extracted to: {dest_dir}")
            return True
        else:
            print(f"  Failed: HTTP {resp.status_code}")
            return False
    except Exception as e:
        print(f"  Error: {e}")
        return False


def download_dataset(sample: dict, dry_run: bool = False) -> bool:
    """Download a single dataset by its registry entry."""
    dataset_id = sample["id"]
    config = DOWNLOAD_CONFIGS.get(dataset_id)

    if not config:
        print(f"  No download config for {dataset_id} — may require manual download")
        print(f"  Source: {sample.get('sourceUrl', 'N/A')}")
        return False

    if config["method"] == "existing":
        print(f"  {config['description']}")
        return True

    dest_dir = DATA_DIR / dataset_id
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Downloading: {sample['name']}")
    print(f"  License: {sample['license']} | Redistributable: {sample['redistributable']}")
    print(f"  Destination: {dest_dir}")

    if config["method"] == "mendeley":
        success = download_mendeley(sample, config, dest_dir, dry_run)
    elif config["method"] == "physionet":
        success = download_physionet(sample, config, dest_dir, dry_run)
    elif config["method"] == "uci":
        success = download_uci(sample, config, dest_dir, dry_run)
    else:
        print(f"  Unknown download method: {config['method']}")
        return False

    if success and not dry_run:
        write_attribution(dest_dir, sample)

    return success


def main():
    parser = argparse.ArgumentParser(description="Download EEG sample datasets")
    parser.add_argument("--dataset", type=str, help="Download specific dataset by ID")
    parser.add_argument("--list", action="store_true", help="List available datasets")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be downloaded")
    parser.add_argument("--all", action="store_true", help="Download all redistributable datasets")
    args = parser.parse_args()

    samples = load_registry()

    if args.list:
        print(f"\nEEG Sample Registry — {len(samples)} datasets\n")
        print(f"{'ID':<30} {'Type':<18} {'Source':<12} {'License':<15} {'Redist':<6} {'Subj':<6} {'Conditions'}")
        print("-" * 120)
        for s in samples:
            conditions = ", ".join(s.get("condition", [])[:3])
            print(f"{s['id']:<30} {s['type']:<18} {s['source']:<12} {s['license']:<15} "
                  f"{'yes' if s['redistributable'] else 'no':<6} "
                  f"{str(s.get('subjects', '-')):<6} {conditions}")
        print(f"\nDownloadable: {', '.join(DOWNLOAD_CONFIGS.keys())}")
        return

    if args.dataset:
        sample = next((s for s in samples if s["id"] == args.dataset), None)
        if not sample:
            print(f"Dataset '{args.dataset}' not found in registry")
            sys.exit(1)
        success = download_dataset(sample, dry_run=args.dry_run)
        sys.exit(0 if success else 1)

    if args.all or not (args.dataset or args.list):
        # Download all redistributable datasets with download configs
        redistributable = [s for s in samples
                           if s.get("redistributable") and s["id"] in DOWNLOAD_CONFIGS]
        print(f"\nDownloading {len(redistributable)} redistributable datasets...\n")

        results = {}
        for sample in redistributable:
            success = download_dataset(sample, dry_run=args.dry_run)
            results[sample["id"]] = success

        print(f"\n{'=' * 60}")
        print(f"Results: {sum(results.values())}/{len(results)} successful")
        for dataset_id, success in results.items():
            print(f"  {'OK' if success else 'FAIL'} {dataset_id}")


if __name__ == "__main__":
    main()
