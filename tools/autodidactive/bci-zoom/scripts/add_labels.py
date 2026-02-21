#!/usr/bin/env python3
"""
Add scale labels to BCI zoom images
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Base path
BASE = "/Users/mac/Documents/PROJECTS/qinnovates/mindloft/main/video/bci-zoom/assets"
OUTPUT = "/Users/mac/Documents/PROJECTS/qinnovates/mindloft/main/video/bci-zoom/assets/labeled"

# Create output directory
os.makedirs(OUTPUT, exist_ok=True)

# Image configurations: (input_path, output_name, label, scale, color)
CONFIGS = [
    (f"{BASE}/01-brain-bci/brain_base.png", "01_brain_labeled.png",
     "BRAIN", "Scale: ~10 cm", (0, 150, 255)),  # Blue

    (f"{BASE}/06-synapse/synapse_chemical.png", "02_synapse_labeled.png",
     "SYNAPSE", "Scale: ~1 μm", (255, 150, 0)),  # Orange

    (f"{BASE}/08-receptor/dopamine_receptor.png", "03_receptor_labeled.png",
     "DOPAMINE D2 RECEPTOR", "Scale: ~10 nm", (200, 50, 200)),  # Purple

    (f"{BASE}/09-ion-channel/sodium_channel.png", "04_ion_channel_labeled.png",
     "SODIUM ION CHANNEL", "Scale: ~1 nm", (150, 50, 200)),  # Deep purple
]

def add_label(input_path, output_path, title, scale, color):
    """Add title and scale label to image"""

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
    except:
        title_font = ImageFont.load_default()
        scale_font = ImageFont.load_default()

    # Add semi-transparent background for text
    # Title background
    title_bbox = draw.textbbox((50, 40), title, font=title_font)
    padding = 10
    draw.rectangle([
        title_bbox[0] - padding,
        title_bbox[1] - padding,
        title_bbox[2] + padding,
        title_bbox[3] + padding
    ], fill=(0, 0, 0, 180))

    # Scale background
    scale_bbox = draw.textbbox((50, 95), scale, font=scale_font)
    draw.rectangle([
        scale_bbox[0] - padding,
        scale_bbox[1] - padding,
        scale_bbox[2] + padding,
        scale_bbox[3] + padding
    ], fill=(0, 0, 0, 180))

    # Draw title
    draw.text((50, 40), title, font=title_font, fill=color + (255,))

    # Draw scale
    draw.text((50, 95), scale, font=scale_font, fill=(200, 200, 200, 255))

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
    input_path, output_name, title, scale, color = config
    if os.path.exists(input_path):
        add_label(input_path, output_name, title, scale, color)
    else:
        print(f"Warning: {input_path} not found")

print(f"\nLabeled images saved to: {OUTPUT}")
