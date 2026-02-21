#!/usr/bin/env python3
"""
Add scale labels to BCI zoom images - Extended version with brain levels
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Base path
BASE = "/Users/mac/Documents/PROJECTS/qinnovates/mindloft/main/video/bci-zoom/assets"
OUTPUT = "/Users/mac/Documents/PROJECTS/qinnovates/mindloft/main/video/bci-zoom/assets/labeled"
BRAIN_DIR = f"{BASE}/brain/Brain/img"

# Create output directory
os.makedirs(OUTPUT, exist_ok=True)

# Extended image configurations with brain zoom levels
# Format: (input_path, output_name, title, scale, color, bci_access)
CONFIGS = [
    # Brain macro levels (using different brain images for zoom effect)
    (f"{BRAIN_DIR}/1.png", "01_brain_whole.png",
     "WHOLE BRAIN", "Scale: ~15 cm", (0, 120, 255), "BCI: External EEG"),

    (f"{BRAIN_DIR}/2.png", "02_brain_hemisphere.png",
     "BRAIN HEMISPHERE", "Scale: ~8 cm", (0, 140, 255), "BCI: ECoG Grid"),

    (f"{BRAIN_DIR}/4.png", "03_brain_region.png",
     "MOTOR CORTEX REGION", "Scale: ~3 cm", (0, 160, 255), "BCI: Electrode Array"),

    (f"{BRAIN_DIR}/6.png", "04_brain_gyrus.png",
     "PRECENTRAL GYRUS", "Scale: ~1 cm", (0, 180, 255), "BCI: Utah Array"),

    (f"{BRAIN_DIR}/10.png", "05_brain_surface.png",
     "CORTICAL SURFACE", "Scale: ~5 mm", (50, 200, 255), "BCI: Neuralink Threads"),

    # Transition to cellular
    (f"{BASE}/06-synapse/synapse_chemical.png", "06_synapse.png",
     "SYNAPSE", "Scale: ~1 μm", (255, 150, 0), "BCI: Cannot Access Directly"),

    # Molecular levels
    (f"{BASE}/08-receptor/dopamine_receptor.png", "07_receptor.png",
     "DOPAMINE D2 RECEPTOR", "Scale: ~10 nm", (200, 50, 200), "BCI: Pharmacology Only"),

    (f"{BASE}/09-ion-channel/sodium_channel.png", "08_ion_channel.png",
     "SODIUM ION CHANNEL", "Scale: ~1 nm", (150, 50, 200), "BCI: Quantum Scale"),
]

def add_label(input_path, output_path, title, scale, color, bci_note):
    """Add title, scale label, and BCI access note to image"""

    # Open image
    img = Image.open(input_path).convert('RGBA')

    # Resize to 1920x1080 if needed
    target_size = (1920, 1080)

    # Calculate aspect-preserving resize
    img_ratio = img.width / img.height
    target_ratio = target_size[0] / target_size[1]

    if img_ratio > target_ratio:
        new_width = target_size[0]
        new_height = int(target_size[0] / img_ratio)
    else:
        new_height = target_size[1]
        new_width = int(target_size[1] * img_ratio)

    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Create new image with padding
    final = Image.new('RGBA', target_size, (0, 0, 0, 255))
    paste_x = (target_size[0] - new_width) // 2
    paste_y = (target_size[1] - new_height) // 2
    final.paste(img, (paste_x, paste_y))

    # Draw text
    draw = ImageDraw.Draw(final)

    # Try to use a nice font, fall back to default
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        scale_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
        note_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
    except:
        title_font = ImageFont.load_default()
        scale_font = ImageFont.load_default()
        note_font = ImageFont.load_default()

    padding = 10

    # Title background
    title_bbox = draw.textbbox((50, 40), title, font=title_font)
    draw.rectangle([
        title_bbox[0] - padding,
        title_bbox[1] - padding,
        title_bbox[2] + padding,
        title_bbox[3] + padding
    ], fill=(0, 0, 0, 200))

    # Scale background
    scale_bbox = draw.textbbox((50, 100), scale, font=scale_font)
    draw.rectangle([
        scale_bbox[0] - padding,
        scale_bbox[1] - padding,
        scale_bbox[2] + padding,
        scale_bbox[3] + padding
    ], fill=(0, 0, 0, 200))

    # BCI note background (bottom left)
    note_y = target_size[1] - 60
    note_bbox = draw.textbbox((50, note_y), bci_note, font=note_font)
    draw.rectangle([
        note_bbox[0] - padding,
        note_bbox[1] - padding,
        note_bbox[2] + padding,
        note_bbox[3] + padding
    ], fill=(0, 0, 0, 200))

    # Draw title
    draw.text((50, 40), title, font=title_font, fill=color + (255,))

    # Draw scale
    draw.text((50, 100), scale, font=scale_font, fill=(200, 200, 200, 255))

    # Draw BCI note
    # Color based on access level
    if "Cannot" in bci_note or "Only" in bci_note or "Quantum" in bci_note:
        note_color = (255, 100, 100, 255)  # Red for no access
    else:
        note_color = (100, 255, 100, 255)  # Green for access
    draw.text((50, note_y), bci_note, font=note_font, fill=note_color)

    # Draw scale bar (bottom right)
    bar_y = target_size[1] - 60
    bar_x_start = target_size[0] - 250
    bar_x_end = target_size[0] - 50
    draw.rectangle([bar_x_start, bar_y, bar_x_end, bar_y + 8], fill=color + (255,))

    # Convert to RGB for saving as PNG
    final_rgb = Image.new('RGB', target_size, (0, 0, 0))
    final_rgb.paste(final, mask=final.split()[3])

    # Save
    final_rgb.save(os.path.join(OUTPUT, output_path))
    print(f"Created: {output_path}")

# Process all images
for config in CONFIGS:
    input_path, output_name, title, scale, color, bci_note = config
    if os.path.exists(input_path):
        add_label(input_path, output_name, title, scale, color, bci_note)
    else:
        print(f"Warning: {input_path} not found")

print(f"\nLabeled images saved to: {OUTPUT}")
print(f"Total: {len([c for c in CONFIGS if os.path.exists(c[0])])} images")
