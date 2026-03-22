#!/usr/bin/env python3
"""
Sync brand.json values into README.md and other documentation.

Usage:
    python MAIN/legacy-core/resources/brand/sync_brand.py

This script updates documentation files to match brand.json,
ensuring consistency across the repository.
"""

import json
import re
from pathlib import Path


def load_brand() -> dict:
    """Load brand.json from MAIN/legacy-core/resources/brand/."""
    brand_path = Path(__file__).parent / "brand.json"
    with open(brand_path) as f:
        return json.load(f)


def update_readme(brand: dict) -> bool:
    """Update README.md with brand values."""
    readme_path = Path(__file__).parent.parent.parent.parent / "README.md"
    content = readme_path.read_text()
    original = content

    oni = brand["oni"]

    # Update ONI full name in parentheses
    # Pattern: **ONI** (Something) —
    content = re.sub(
        r'\*\*ONI\*\* \([^)]+\) —',
        f'**ONI** ({oni["full_name"]}) —',
        content
    )

    # Update tagline if present
    # Pattern: *The OSI of Mind* or similar italicized tagline
    if oni.get("tagline"):
        content = re.sub(
            r'^\*The [^*]+\*$',
            f'*{oni["tagline"]}*',
            content,
            flags=re.MULTILINE
        )

    # Update slogan if present
    # Pattern: Bold text on its own line, starting with capital, ending with punctuation
    # This matches the slogan line after the tagline (line 5 in README)
    if oni.get("slogan"):
        content = re.sub(
            r'^(\*\*)[A-Z][^*]+[.!?](\*\*)$',
            f'**{oni["slogan"]}**',
            content,
            flags=re.MULTILINE
        )

    # Update TARA full name in parentheses
    # Pattern: **TARA** (Something) is
    tara = brand.get("tara", {})
    if tara.get("full_name"):
        content = re.sub(
            r'\*\*TARA\*\* \([^)]+\) is',
            f'**TARA** ({tara["full_name"]}) is',
            content
        )

    if content != original:
        readme_path.write_text(content)
        return True
    return False


def update_github_pages(brand: dict) -> bool:
    """Update docs/index.html with brand values."""
    html_path = Path(__file__).parent.parent.parent.parent / "docs" / "index.html"
    if not html_path.exists():
        return False

    content = html_path.read_text()
    original = content

    oni = brand["oni"]

    # Update mission text in the fallback/default value
    # Pattern: <p id="mission-text" ...>old mission text</p>
    if oni.get("mission"):
        content = re.sub(
            r'(<p id="mission-text"[^>]*>)[^<]*(</p>)',
            rf'\1{oni["mission"]}\2',
            content
        )

    if content != original:
        html_path.write_text(content)
        return True
    return False


def main():
    print("Loading brand.json...")
    brand = load_brand()

    oni = brand["oni"]
    tara = brand["tara"]

    print(f"ONI: {oni['full_name']}")
    print(f"  Tagline: {oni.get('tagline', 'N/A')}")
    print(f"  Slogan: {oni.get('slogan', 'N/A')}")
    print(f"  Mission: {oni['mission'][:50]}...")
    print(f"TARA: {tara['full_name']}")
    print()

    print("Updating README.md...")
    if update_readme(brand):
        print("  README.md updated")
    else:
        print("  README.md already in sync")

    print("Updating docs/index.html...")
    if update_github_pages(brand):
        print("  docs/index.html updated")
    else:
        print("  docs/index.html already in sync")

    print("\nDone!")


if __name__ == "__main__":
    main()
