"""
ONI Framework Brand Constants

Loads brand identity from brand.json (single source of truth at repo root).
All packages in the monorepo share this same source.

Usage:
    from oni.brand import ONI, TARA
    print(ONI.name)  # "ONI Framework"
    print(TARA.tagline)  # "Protection for the neural frontier"
"""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class ProjectBrand:
    """Immutable brand identity for a project."""
    acronym: str
    full_name: str
    name: str
    slogan: str
    mission: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None


def _load_brand_json() -> dict:
    """Load brand.json from MAIN/legacy-core/resources/brand/."""
    # Try multiple paths for different installation contexts
    possible_paths = [
        Path(__file__).parent.parent.parent / "resources" / "brand" / "brand.json",  # oni/brand.py -> oni-framework -> MAIN/legacy-core/resources/brand
        Path(__file__).parent.parent.parent.parent.parent / "MAIN" / "resources" / "brand" / "brand.json",  # From repo root
        Path(__file__).parent.parent / "resources" / "brand" / "brand.json",  # If installed as package
    ]

    for path in possible_paths:
        if path.exists():
            with open(path, "r") as f:
                return json.load(f)

    # Fallback to hardcoded values if brand.json not found (e.g., pip installed)
    return None


def _create_brand(data: dict) -> ProjectBrand:
    """Create ProjectBrand from JSON data."""
    return ProjectBrand(
        acronym=data.get("acronym", ""),
        full_name=data.get("full_name", ""),
        name=data.get("name", ""),
        tagline=data.get("tagline"),
        slogan=data.get("slogan", ""),
        mission=data.get("mission", ""),
        description=data.get("description"),
        version=data.get("version"),
    )


# =============================================================================
# Load from brand.json or use fallbacks
# =============================================================================

_brand_data = _load_brand_json()

if _brand_data:
    ONI = _create_brand(_brand_data["oni"])
    TARA = _create_brand(_brand_data["tara"])
    ONI_VERSION = _brand_data["oni"].get("version", "0.2.0")
    TARA_VERSION = _brand_data["tara"].get("version", "0.8.0")
else:
    # Fallback for pip-installed package without brand.json
    ONI = ProjectBrand(
        acronym="ONI",
        full_name="Open Neurosecurity Interoperability",
        name="ONI Framework",
        tagline="The OSI of Mind",
        slogan="Our minds. Our rules. Our future.",
        mission="The mind is the last frontier. We're making sure it's protected from day one.",
        description="A unified 14-layer model extending OSI into the biological domain.",
        version="0.2.0",
    )
    TARA = ProjectBrand(
        acronym="TARA",
        full_name="Telemetry Analysis & Response Automation",
        name="TARA Stack",
        tagline="Protection for the neural frontier",
        slogan="Named after the Buddhist goddess of protection.",
        mission="Real-time neural security monitoring aligned with ONI.",
        description="A neural security platform for BCI monitoring and attack testing.",
        version="0.8.0",
    )
    ONI_VERSION = "0.2.0"
    TARA_VERSION = "0.8.0"


# =============================================================================
# Combined Export
# =============================================================================

BRANDS = {
    "oni": ONI,
    "tara": TARA,
}


def get_brand(name: str) -> ProjectBrand:
    """Get brand by name (case-insensitive)."""
    return BRANDS[name.lower()]


# =============================================================================
# Quick Access Strings
# =============================================================================

ONI_HEADER = f"{ONI.name} — {ONI.tagline}"
TARA_HEADER = f"{TARA.name} — {TARA.tagline}"
ONI_FOOTER = f"{ONI.name} | {ONI.slogan}"
TARA_FOOTER = f"{TARA.name} | {TARA.slogan}"
