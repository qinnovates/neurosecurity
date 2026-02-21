"""
ONI Framework Manim Theme
Color palette and styling for BCI visualization
"""

from manim import *

# ONI Brand Colors
class ONIColors:
    # Primary palette
    PRIMARY = "#4A90D9"      # ONI Blue
    SECONDARY = "#1A1A2E"    # Deep navy
    ACCENT = "#FF9500"       # Gateway orange (L8)

    # Layer zone colors
    SILICON = "#4A90D9"      # L1-L7 (OSI layers)
    GATEWAY = "#FF9500"      # L8 (Neural Gateway - critical)
    BIOLOGY = "#06D6A0"      # L9-L14 (Neural layers)

    # Scale gradient (macro to micro)
    SCALE_MACRO = "#4A90D9"   # cm scale - brain/BCI
    SCALE_CIRCUIT = "#5BA3EC" # mm scale - cortical
    SCALE_NEURON = "#FF9500"  # um scale - cells
    SCALE_SYNAPSE = "#FF6B35" # um scale - synapses
    SCALE_MOLECULAR = "#9D4EDD" # nm scale - molecules
    SCALE_QUANTUM = "#240046"  # Angstrom - atomic

    # Activity colors (for "live" visualization)
    ACTIVE_HIGH = "#FF3366"   # High activity (red-pink)
    ACTIVE_MED = "#FFBE0B"    # Medium activity (yellow)
    ACTIVE_LOW = "#06D6A0"    # Low activity (green)
    INACTIVE = "#2D3748"      # Resting state

    # Neurotransmitter colors
    DOPAMINE = "#FF6B35"      # Orange
    GLUTAMATE = "#06D6A0"     # Green
    GABA = "#118AB2"          # Blue
    SEROTONIN = "#9D4EDD"     # Purple
    ACETYLCHOLINE = "#FFD166" # Yellow

    # Background
    BG_DARK = "#0D1117"
    BG_GRADIENT_TOP = "#1A1A2E"
    BG_GRADIENT_BOTTOM = "#0D1117"

    # Text
    TEXT_PRIMARY = "#FFFFFF"
    TEXT_SECONDARY = "#A0AEC0"
    TEXT_MUTED = "#718096"


# Timescale formatting
def format_timescale(seconds: float) -> str:
    """Convert seconds to human-readable timescale."""
    if seconds >= 1:
        return f"{seconds:.0f} s"
    elif seconds >= 1e-3:
        return f"{seconds*1e3:.0f} ms"
    elif seconds >= 1e-6:
        return f"{seconds*1e6:.0f} us"
    elif seconds >= 1e-9:
        return f"{seconds*1e9:.0f} ns"
    elif seconds >= 1e-12:
        return f"{seconds*1e12:.0f} ps"
    else:
        return f"{seconds*1e15:.0f} fs"


def format_spatial_scale(meters: float) -> str:
    """Convert meters to human-readable spatial scale."""
    if meters >= 1e-2:
        return f"{meters*1e2:.0f} cm"
    elif meters >= 1e-3:
        return f"{meters*1e3:.0f} mm"
    elif meters >= 1e-6:
        return f"{meters*1e6:.0f} um"
    elif meters >= 1e-9:
        return f"{meters*1e9:.0f} nm"
    else:
        return f"{meters*1e10:.1f} A"


# Standard Manim config for ONI videos
def get_oni_config():
    """Return standard config for ONI visualizations."""
    return {
        "background_color": ONIColors.BG_DARK,
        "frame_rate": 60,
        "pixel_width": 1920,
        "pixel_height": 1080,
    }


# Gradient helper
def get_scale_color(spatial_meters: float) -> str:
    """Return appropriate color for spatial scale."""
    if spatial_meters >= 1e-2:
        return ONIColors.SCALE_MACRO
    elif spatial_meters >= 1e-4:
        return ONIColors.SCALE_CIRCUIT
    elif spatial_meters >= 1e-5:
        return ONIColors.SCALE_NEURON
    elif spatial_meters >= 1e-6:
        return ONIColors.SCALE_SYNAPSE
    elif spatial_meters >= 1e-9:
        return ONIColors.SCALE_MOLECULAR
    else:
        return ONIColors.SCALE_QUANTUM
