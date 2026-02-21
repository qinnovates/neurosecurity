"""
BCI Zoom Animation - Blender Scene Setup Script
================================================
This script sets up the multi-scale zoom animation from brain to molecule.

REQUIREMENTS:
1. Blender 3.0+ with Molecular Nodes addon installed
   - Install: https://github.com/BradyAJohnston/MolecularNodes
2. NeuroMorphoVis addon (optional, for SWC import)
   - Or convert SWC to OBJ first

HOW TO USE:
1. Open Blender
2. Go to Scripting workspace
3. Open this file
4. Run script (Alt+P)

The script will:
- Create collection structure for each scale
- Set up camera with zoom animation
- Import available assets
- Create placeholder objects for missing pieces
"""

import bpy
import math
import os
from mathlib import Vector

# =============================================================================
# CONFIGURATION
# =============================================================================

# Asset paths (relative to this script)
SCRIPT_DIR = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/Users/mac/Documents/PROJECTS/qinnovates/mindloft/main/video/bci-zoom"
ASSETS_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "assets")

ASSETS = {
    "brain": os.path.join(ASSETS_DIR, "brain/Brain/Blend file (main)/Brain.blend"),
    "neuron_swc": os.path.join(ASSETS_DIR, "neurons/pyramidal_cnic_001.swc"),
    "receptor_pdb": os.path.join(ASSETS_DIR, "receptors/dopamine_D2_receptor_6CM4.pdb"),
    "dopamine_sdf": os.path.join(ASSETS_DIR, "molecules/dopamine_CID681.sdf"),
}

# ONI Layer colors (from brand.json)
ONI_COLORS = {
    'L14': (0.290, 0.871, 0.502, 1.0),  # #4ade80 - Identity
    'L13': (0.133, 0.773, 0.369, 1.0),  # #22c55e - Semantic
    'L12': (0.086, 0.639, 0.290, 1.0),  # #16a34a - Session
    'L11': (0.082, 0.502, 0.239, 1.0),  # #15803d - Transport
    'L10': (0.086, 0.396, 0.204, 1.0),  # #166534 - Protocol
    'L9':  (0.078, 0.325, 0.176, 1.0),  # #14532d - Processing
    'L8':  (0.851, 0.467, 0.024, 1.0),  # #d97706 - Gateway (ORANGE)
}

# Animation settings
FPS = 30
TOTAL_SECONDS = 45
TOTAL_FRAMES = FPS * TOTAL_SECONDS

# Scale levels (in meters for Blender)
SCALES = {
    'brain': 0.15,        # 15 cm
    'region': 0.01,       # 1 cm
    'column': 0.001,      # 1 mm
    'neuron': 0.00005,    # 50 μm
    'synapse': 0.000001,  # 1 μm
    'receptor': 0.00000001,  # 10 nm
    'molecule': 0.000000001,  # 1 nm
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def clear_scene():
    """Remove all objects from scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def create_collection(name, parent=None):
    """Create a new collection"""
    collection = bpy.data.collections.new(name)
    if parent:
        parent.children.link(collection)
    else:
        bpy.context.scene.collection.children.link(collection)
    return collection

def create_material(name, color, emission_strength=0):
    """Create a material with given color"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        if emission_strength > 0:
            bsdf.inputs['Emission Color'].default_value = color
            bsdf.inputs['Emission Strength'].default_value = emission_strength
    return mat

def create_placeholder_sphere(name, location, scale, color, collection):
    """Create a placeholder sphere for missing assets"""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=1,
        location=location,
        scale=(scale, scale, scale)
    )
    obj = bpy.context.active_object
    obj.name = name

    # Apply material
    mat = create_material(f"{name}_mat", color)
    obj.data.materials.append(mat)

    # Move to collection
    bpy.context.scene.collection.objects.unlink(obj)
    collection.objects.link(obj)

    return obj

# =============================================================================
# SCENE SETUP
# =============================================================================

def setup_collections():
    """Create the collection hierarchy for multi-scale animation"""

    # Main collections for each scale
    collections = {
        '01_Macro_Brain': create_collection('01_Macro_Brain'),
        '02_Meso_Cortex': create_collection('02_Meso_Cortex'),
        '03_Micro_Neurons': create_collection('03_Micro_Neurons'),
        '04_Nano_Synapse': create_collection('04_Nano_Synapse'),
        '05_Molecular_Receptors': create_collection('05_Molecular_Receptors'),
        '06_Molecular_Transmitters': create_collection('06_Molecular_Transmitters'),
        '07_Transitions': create_collection('07_Transitions'),
        '08_Overlays': create_collection('08_Overlays'),
    }

    return collections

def setup_camera():
    """Create camera with logarithmic zoom animation"""

    # Create camera
    bpy.ops.object.camera_add(location=(0, -0.5, 0))
    camera = bpy.context.active_object
    camera.name = 'ZoomCamera'
    camera.rotation_euler = (math.radians(90), 0, 0)  # Point at origin

    # Set as active camera
    bpy.context.scene.camera = camera

    # Animation: logarithmic zoom from brain scale to molecule scale
    # We animate the camera's distance from origin

    start_distance = 0.5   # Start 50cm away (sees whole brain)
    end_distance = 0.000001  # End 1 μm away (molecular scale)

    # Insert keyframes
    keyframe_data = [
        # (frame, distance, description)
        (1, 0.5, "Full brain view"),
        (int(FPS * 5), 0.15, "Zoom to region"),
        (int(FPS * 10), 0.02, "Enter cortex"),
        (int(FPS * 15), 0.005, "Cortical column"),
        (int(FPS * 20), 0.0005, "Neural network"),
        (int(FPS * 25), 0.00005, "Single neuron"),
        (int(FPS * 30), 0.000005, "Synapse - L8 GATEWAY"),
        (int(FPS * 35), 0.0000005, "Synaptic cleft"),
        (int(FPS * 40), 0.00000005, "Receptor"),
        (int(FPS * 45), 0.000000005, "Dopamine binding"),
    ]

    for frame, distance, desc in keyframe_data:
        camera.location.y = -distance
        camera.keyframe_insert(data_path="location", frame=frame)
        print(f"  Keyframe {frame}: {desc} (distance: {distance}m)")

    # Smooth interpolation
    if camera.animation_data and camera.animation_data.action:
        for fcurve in camera.animation_data.action.fcurves:
            for keyframe in fcurve.keyframe_points:
                keyframe.interpolation = 'BEZIER'
                keyframe.handle_left_type = 'AUTO_CLAMPED'
                keyframe.handle_right_type = 'AUTO_CLAMPED'

    return camera

def setup_lighting():
    """Create lighting setup"""

    # Key light
    bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
    key_light = bpy.context.active_object
    key_light.name = 'KeyLight'
    key_light.data.energy = 3

    # Fill light
    bpy.ops.object.light_add(type='AREA', location=(-3, -3, 5))
    fill_light = bpy.context.active_object
    fill_light.name = 'FillLight'
    fill_light.data.energy = 100
    fill_light.data.size = 5

    # Rim light (for L8 gateway moment)
    bpy.ops.object.light_add(type='POINT', location=(0, 0.1, 0))
    rim_light = bpy.context.active_object
    rim_light.name = 'GatewayLight_L8'
    rim_light.data.energy = 0  # Off by default, animate at L8 moment
    rim_light.data.color = ONI_COLORS['L8'][:3]

def setup_world():
    """Set up world/background"""
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("ONI_World")
        bpy.context.scene.world = world

    world.use_nodes = True
    nodes = world.node_tree.nodes
    bg = nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.02, 0.02, 0.05, 1.0)  # Dark blue-black
        bg.inputs['Strength'].default_value = 1.0

# =============================================================================
# PLACEHOLDER ASSETS (replace with real imports)
# =============================================================================

def create_placeholder_assets(collections):
    """Create placeholder objects for each scale level"""

    print("\nCreating placeholder assets...")
    print("(Replace these with real imports using Molecular Nodes, etc.)\n")

    # MACRO: Brain placeholder
    brain = create_placeholder_sphere(
        "Brain_Placeholder",
        location=(0, 0, 0),
        scale=SCALES['brain'],
        color=ONI_COLORS['L14'],
        collection=collections['01_Macro_Brain']
    )
    print(f"  Created: Brain placeholder at {SCALES['brain']}m")

    # MICRO: Neuron placeholder
    neuron = create_placeholder_sphere(
        "Neuron_Placeholder",
        location=(0, 0, 0),
        scale=SCALES['neuron'],
        color=ONI_COLORS['L10'],
        collection=collections['03_Micro_Neurons']
    )
    print(f"  Created: Neuron placeholder at {SCALES['neuron']}m")

    # NANO: Synapse placeholder
    synapse = create_placeholder_sphere(
        "Synapse_Placeholder",
        location=(0, 0, 0),
        scale=SCALES['synapse'],
        color=ONI_COLORS['L9'],
        collection=collections['04_Nano_Synapse']
    )
    print(f"  Created: Synapse placeholder at {SCALES['synapse']}m")

    # L8 GATEWAY: Visual marker
    gateway = create_placeholder_sphere(
        "L8_Gateway_Marker",
        location=(0, 0, 0),
        scale=SCALES['synapse'] * 2,
        color=ONI_COLORS['L8'],
        collection=collections['07_Transitions']
    )
    # Add emission for glow
    mat = gateway.data.materials[0]
    mat.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 5
    print(f"  Created: L8 Gateway marker (orange glow)")

    # MOLECULAR: Receptor placeholder
    receptor = create_placeholder_sphere(
        "Receptor_Placeholder",
        location=(0, 0, 0),
        scale=SCALES['receptor'],
        color=(0.8, 0.3, 0.3, 1.0),  # Reddish
        collection=collections['05_Molecular_Receptors']
    )
    print(f"  Created: Receptor placeholder at {SCALES['receptor']}m")

    # MOLECULAR: Neurotransmitter placeholder
    transmitter = create_placeholder_sphere(
        "Dopamine_Placeholder",
        location=(0, 0, 0),
        scale=SCALES['molecule'],
        color=(0.9, 0.7, 0.2, 1.0),  # Yellow
        collection=collections['06_Molecular_Transmitters']
    )
    print(f"  Created: Dopamine placeholder at {SCALES['molecule']}m")

# =============================================================================
# IMPORT FUNCTIONS (for real assets)
# =============================================================================

def import_brain_blend():
    """Import brain from Brain.blend file"""
    brain_path = ASSETS['brain']
    if os.path.exists(brain_path):
        print(f"\nTo import brain model:")
        print(f"  File > Append > {brain_path}")
        print(f"  Select objects from 'Object' folder")
        return True
    return False

def import_neuron_instructions():
    """Instructions for importing neuron SWC file"""
    print("\n" + "="*60)
    print("NEURON IMPORT INSTRUCTIONS")
    print("="*60)
    print(f"""
Option 1: NeuroMorphoVis Addon (recommended)
  1. Install addon: https://github.com/BlueBrain/NeuroMorphoVis
  2. Enable in Preferences > Add-ons
  3. File > Import > SWC Morphology
  4. Select: {ASSETS['neuron_swc']}

Option 2: Convert SWC to OBJ online
  1. Go to: https://neuroinformatics.nl/swc2obj/
  2. Upload: pyramidal_cnic_001.swc
  3. Download OBJ
  4. File > Import > Wavefront (.obj)

Option 3: Molecular Nodes (if installed)
  - May support SWC import directly
""")

def import_molecular_instructions():
    """Instructions for importing PDB/SDF molecular files"""
    print("\n" + "="*60)
    print("MOLECULAR IMPORT INSTRUCTIONS")
    print("="*60)
    print(f"""
REQUIRED: Molecular Nodes Addon
  Install: https://github.com/BradyAJohnston/MolecularNodes

To import Dopamine D2 Receptor:
  1. Molecular Nodes panel > Fetch from PDB
  2. Enter: 6CM4
  3. Or: File > Import > Molecular Nodes > PDB
  4. Select: {ASSETS['receptor_pdb']}

To import Dopamine molecule:
  1. File > Import > Molecular Nodes > SDF
  2. Select: {ASSETS['dopamine_sdf']}

Styling tips:
  - Use 'Surface' representation for receptors
  - Use 'Ball and Stick' for small molecules
  - Color by element or chain
""")

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    print("\n" + "="*60)
    print("BCI ZOOM ANIMATION - SCENE SETUP")
    print("="*60)

    # Clear existing scene
    print("\n1. Clearing scene...")
    clear_scene()

    # Create collections
    print("\n2. Creating collection structure...")
    collections = setup_collections()
    for name in collections:
        print(f"   Created: {name}")

    # Setup camera
    print("\n3. Setting up camera with zoom animation...")
    camera = setup_camera()

    # Setup lighting
    print("\n4. Setting up lighting...")
    setup_lighting()

    # Setup world
    print("\n5. Setting up world background...")
    setup_world()

    # Create placeholders
    print("\n6. Creating placeholder assets...")
    create_placeholder_assets(collections)

    # Print import instructions
    import_brain_blend()
    import_neuron_instructions()
    import_molecular_instructions()

    # Set render settings
    print("\n7. Configuring render settings...")
    bpy.context.scene.render.fps = FPS
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = TOTAL_FRAMES
    bpy.context.scene.render.resolution_x = 1920
    bpy.context.scene.render.resolution_y = 1080

    print("\n" + "="*60)
    print("SETUP COMPLETE!")
    print("="*60)
    print(f"""
Next steps:
1. Import Brain.blend (File > Append)
2. Install Molecular Nodes addon
3. Import receptor PDB: 6CM4
4. Import dopamine SDF
5. Convert and import neuron SWC
6. Replace placeholder objects with real assets
7. Adjust camera keyframes as needed
8. Add transition effects at scale boundaries
9. Render animation!

Timeline:
  Frame 1-{int(FPS*15)}: Macro brain (L14-L12)
  Frame {int(FPS*15)}-{int(FPS*25)}: Micro neurons (L11-L10)
  Frame {int(FPS*25)}-{int(FPS*30)}: Synapse (L9)
  Frame {int(FPS*30)}: ★ L8 GATEWAY MOMENT ★
  Frame {int(FPS*30)}-{int(FPS*45)}: Molecular (receptors, transmitters)

Total: {TOTAL_FRAMES} frames ({TOTAL_SECONDS} seconds at {FPS} fps)
""")

# Run if executed directly
if __name__ == "__main__":
    main()
