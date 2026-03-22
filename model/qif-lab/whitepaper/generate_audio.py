"""
QIF Whitepaper Audio Generator
Extracts text per-section from the rendered whitepaper and generates
narration audio using Kokoro TTS (Apache 2.0, 82M params).

Usage:
    python generate_audio.py [--voice af_heart] [--output audio/]

Requires: pip install kokoro soundfile beautifulsoup4
"""

import argparse
import os
import re
import sys
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("pip install beautifulsoup4")

try:
    from kokoro import KPipeline
except ImportError:
    sys.exit("pip install kokoro")

try:
    import soundfile as sf
except ImportError:
    sys.exit("pip install soundfile")

import numpy as np


def extract_sections(html_path):
    """Extract readable text per-section from rendered whitepaper HTML."""
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    sections = []

    # Find all sections with IDs (Quarto generates these)
    for section in soup.select("section[id]"):
        # Get the heading
        heading = section.find(re.compile(r"^h[1-6]$"))
        if not heading:
            continue

        title = heading.get_text(strip=True)
        # Remove section numbers (e.g., "1.2 Title" -> "Title")
        title = re.sub(r"^\d+(\.\d+)*\s*", "", title)

        # Clone and strip non-readable elements
        clone = BeautifulSoup(str(section), "html.parser")
        for tag in clone.select(
            "pre, code, .sourceCode, table, figcaption, .math, "
            ".MathJax, .katex, svg, script, style, .cell-code, "
            ".callout-header, .quarto-figure, figure"
        ):
            tag.decompose()

        text = clone.get_text(" ", strip=True)
        # Collapse whitespace
        text = re.sub(r"\s+", " ", text).strip()

        # Skip very short sections
        if len(text) < 50:
            continue

        section_id = section.get("id", "unknown")
        sections.append({
            "id": section_id,
            "title": title,
            "text": text,
        })

    return sections


def generate_audio(sections, voice, output_dir, lang_code="a"):
    """Generate audio for each section using Kokoro TTS."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    pipe = KPipeline(lang_code=lang_code)

    manifest = []

    for i, section in enumerate(sections):
        section_id = section["id"]
        title = section["title"]
        text = section["text"]

        # Prepend title for context
        full_text = f"{title}. {text}"

        # Truncate very long sections (Kokoro handles chunking internally,
        # but we cap at ~3000 chars to keep files manageable)
        if len(full_text) > 3000:
            full_text = full_text[:3000] + "."

        filename = f"{i:02d}_{section_id}.wav"
        filepath = output_dir / filename

        print(f"  [{i+1}/{len(sections)}] {title[:50]}...")

        # Generate audio — Kokoro yields chunks, we concatenate
        audio_chunks = []
        for gs, ps, audio in pipe(full_text, voice=voice):
            audio_chunks.append(audio)

        if audio_chunks:
            full_audio = np.concatenate(audio_chunks)
            sf.write(str(filepath), full_audio, 24000)

            duration = len(full_audio) / 24000
            manifest.append({
                "id": section_id,
                "title": title,
                "file": filename,
                "duration": round(duration, 1),
            })
            print(f"    -> {filename} ({duration:.1f}s)")

    return manifest


def write_manifest(manifest, output_dir):
    """Write JSON manifest for the audio player."""
    import json
    manifest_path = Path(output_dir) / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump({
            "voice": "Kokoro TTS (Apache 2.0)",
            "model": "Kokoro-82M",
            "sample_rate": 24000,
            "sections": manifest,
        }, f, indent=2)
    print(f"\n  Manifest: {manifest_path}")
    print(f"  Total sections: {len(manifest)}")
    total_dur = sum(s["duration"] for s in manifest)
    print(f"  Total duration: {total_dur:.0f}s ({total_dur/60:.1f}min)")


def main():
    parser = argparse.ArgumentParser(description="Generate whitepaper audio")
    parser.add_argument("--html", default="_output/qif-whitepaper.html",
                        help="Path to rendered HTML")
    parser.add_argument("--voice", default="af_heart",
                        help="Kokoro voice (af_heart, af_bella, am_adam, etc.)")
    parser.add_argument("--output", default="audio/",
                        help="Output directory for audio files")
    args = parser.parse_args()

    print(f"QIF Audio Generator")
    print(f"  Voice: {args.voice}")
    print(f"  Input: {args.html}")
    print(f"  Output: {args.output}/\n")

    if not os.path.exists(args.html):
        sys.exit(f"HTML not found: {args.html}")

    print("Extracting sections...")
    sections = extract_sections(args.html)
    print(f"  Found {len(sections)} sections\n")

    print("Generating audio...")
    manifest = generate_audio(sections, args.voice, args.output)

    write_manifest(manifest, args.output)
    print("\nDone.")


if __name__ == "__main__":
    main()
