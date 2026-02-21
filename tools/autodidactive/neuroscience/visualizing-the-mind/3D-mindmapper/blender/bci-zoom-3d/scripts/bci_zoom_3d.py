"""
BCI Zoom 3D Animation - Blender Python Script (Blender 5.0+ Compatible)
========================================================================

Creates a 3D visualization zooming from BCI implant to molecular scale.
With realistic brain surface, detailed neurons, and molecular structures.

Usage:
    /Applications/Blender.app/Contents/MacOS/Blender --background --python bci_zoom_3d.py

Based on: ONI Framework - ONI_LAYERS.md v3.0
Author: Kevin L. Qi / Qinnovate
"""

import bpy
import bmesh
import math
import random
from mathutils import Vector, noise

# =============================================================================
# CONFIGURATION
# =============================================================================

CONFIG = {
    "duration_seconds": 30,
    "fps": 30,
    "resolution_x": 1920,
    "resolution_y": 1080,
}

# ONI Colors (RGBA)
COLORS = {
    "brain_pink": (0.85, 0.65, 0.65, 1),
    "brain_dark": (0.6, 0.45, 0.45, 1),
    "blood_vessel": (0.7, 0.2, 0.2, 1),
    "bci_metal": (0.85, 0.85, 0.9, 1),
    "electrode_gold": (1.0, 0.84, 0.0, 1),
    "electrode_tip": (1.0, 0.3, 0.1, 1),
    "neuron_body": (1.0, 0.7, 0.3, 1),
    "dendrite": (0.3, 0.8, 0.5, 1),
    "axon": (0.9, 0.6, 0.2, 1),
    "synapse_pre": (1.0, 0.5, 0.3, 1),
    "synapse_post": (0.3, 0.7, 0.9, 1),
    "vesicle": (1.0, 0.9, 0.2, 1),
    "neurotransmitter": (0.2, 1.0, 0.5, 1),
    "receptor": (0.7, 0.3, 0.9, 1),
    "ion_channel": (0.5, 0.3, 0.8, 1),
    "ion_na": (0.2, 0.6, 1.0, 1),
    "ion_k": (1.0, 0.4, 0.8, 1),
    "molecular_fe": (1.0, 0.5, 0.0, 1),
    "molecular_o": (1.0, 0.2, 0.2, 1),
    "molecular_n": (0.2, 0.4, 1.0, 1),
    "molecular_c": (0.3, 0.3, 0.3, 1),
    "background": (0.02, 0.02, 0.04, 1),
}


# =============================================================================
# UTILITIES
# =============================================================================

def clear_scene():
    """Remove all objects."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Clear orphan data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)


def create_material(name, color, emission_strength=0, roughness=0.5, subsurface=0):
    """Create a Principled BSDF material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (300, 0)

    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.location = (0, 0)
    principled.inputs['Base Color'].default_value = color
    principled.inputs['Roughness'].default_value = roughness

    # Subsurface for organic materials
    if subsurface > 0:
        principled.inputs['Subsurface Weight'].default_value = subsurface
        principled.inputs['Subsurface Radius'].default_value = (1.0, 0.2, 0.1)

    # Emission for glowing elements
    if emission_strength > 0:
        principled.inputs['Emission Color'].default_value = color
        principled.inputs['Emission Strength'].default_value = emission_strength

    links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    return mat


def link_to_collection(obj, collection_name):
    """Link object to a named collection."""
    if collection_name not in bpy.data.collections:
        col = bpy.data.collections.new(collection_name)
        bpy.context.scene.collection.children.link(col)
    else:
        col = bpy.data.collections[collection_name]

    for c in obj.users_collection:
        c.objects.unlink(obj)
    col.objects.link(obj)


# =============================================================================
# BRAIN SURFACE - REALISTIC WITH SULCI AND GYRI
# =============================================================================

def create_brain_surface():
    """Create anatomically-shaped brain with two hemispheres using mesh boolean."""
    print("    Creating brain mesh...")

    brain_parts = []

    # Helper to create ellipsoid
    def make_ellipsoid(loc, scale, name):
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=32, ring_count=16,
            radius=1.0, location=loc
        )
        obj = bpy.context.active_object
        obj.name = name
        obj.scale = scale
        bpy.ops.object.transform_apply(scale=True)
        return obj

    # === LEFT HEMISPHERE ===
    left_main = make_ellipsoid((-0.7, 0, 0.2), (1.3, 1.8, 1.1), "L_Main")
    brain_parts.append(left_main)

    left_frontal = make_ellipsoid((-0.6, 1.0, 0.4), (1.0, 0.9, 0.8), "L_Frontal")
    brain_parts.append(left_frontal)

    left_temporal = make_ellipsoid((-1.2, 0.3, -0.3), (0.6, 1.0, 0.6), "L_Temporal")
    brain_parts.append(left_temporal)

    left_occipital = make_ellipsoid((-0.5, -1.2, 0.1), (0.9, 0.7, 0.7), "L_Occipital")
    brain_parts.append(left_occipital)

    # === RIGHT HEMISPHERE ===
    right_main = make_ellipsoid((0.7, 0, 0.2), (1.3, 1.8, 1.1), "R_Main")
    brain_parts.append(right_main)

    right_frontal = make_ellipsoid((0.6, 1.0, 0.4), (1.0, 0.9, 0.8), "R_Frontal")
    brain_parts.append(right_frontal)

    right_temporal = make_ellipsoid((1.2, 0.3, -0.3), (0.6, 1.0, 0.6), "R_Temporal")
    brain_parts.append(right_temporal)

    right_occipital = make_ellipsoid((0.5, -1.2, 0.1), (0.9, 0.7, 0.7), "R_Occipital")
    brain_parts.append(right_occipital)

    # Select all parts and join
    bpy.ops.object.select_all(action='DESELECT')
    for part in brain_parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = brain_parts[0]
    bpy.ops.object.join()

    brain = bpy.context.active_object
    brain.name = "Brain"

    # Apply remesh to merge the parts smoothly
    remesh = brain.modifiers.new(name="Remesh", type='REMESH')
    remesh.mode = 'VOXEL'
    remesh.voxel_size = 0.08
    remesh.adaptivity = 0.1
    bpy.ops.object.modifier_apply(modifier="Remesh")

    # Smooth shading
    bpy.ops.object.shade_smooth()

    # Add subdivision for smoother surface
    subdiv = brain.modifiers.new(name="Subdiv", type='SUBSURF')
    subdiv.levels = 1
    subdiv.render_levels = 2

    # Add cortical folds - sulci (grooves)
    disp1 = brain.modifiers.new(name="Sulci", type='DISPLACE')
    tex1 = bpy.data.textures.new("Sulci", type='CLOUDS')
    tex1.noise_scale = 0.22
    tex1.noise_depth = 5
    tex1.noise_basis = 'IMPROVED_PERLIN'
    disp1.texture = tex1
    disp1.strength = 0.15
    disp1.mid_level = 0.5

    # Fine gyri wrinkles
    disp2 = brain.modifiers.new(name="Gyri", type='DISPLACE')
    tex2 = bpy.data.textures.new("Gyri", type='CLOUDS')
    tex2.noise_scale = 0.1
    tex2.noise_depth = 6
    tex2.noise_basis = 'IMPROVED_PERLIN'
    disp2.texture = tex2
    disp2.strength = 0.06
    disp2.mid_level = 0.5

    # Smooth to soften harsh edges
    smooth = brain.modifiers.new(name="Smooth", type='SMOOTH')
    smooth.factor = 0.4
    smooth.iterations = 3

    # Apply all modifiers before boolean
    bpy.ops.object.select_all(action='DESELECT')
    brain.select_set(True)
    bpy.context.view_layer.objects.active = brain
    for mod in brain.modifiers[:]:
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except:
            pass

    # Create cutaway - remove a wedge so camera can see inside
    bpy.ops.mesh.primitive_cube_add(size=4, location=(0, -2.5, 0))
    cutter = bpy.context.active_object
    cutter.name = "Cutter"
    cutter.scale = (1.5, 1.5, 2)
    bpy.ops.object.transform_apply(scale=True)

    # Boolean difference to cut away front section
    bpy.ops.object.select_all(action='DESELECT')
    brain.select_set(True)
    bpy.context.view_layer.objects.active = brain

    bool_mod = brain.modifiers.new(name="Cutaway", type='BOOLEAN')
    bool_mod.operation = 'DIFFERENCE'
    bool_mod.object = cutter
    bpy.ops.object.modifier_apply(modifier="Cutaway")

    # Delete the cutter
    bpy.ops.object.select_all(action='DESELECT')
    cutter.select_set(True)
    bpy.ops.object.delete()

    # Reselect brain
    brain.select_set(True)
    bpy.context.view_layer.objects.active = brain

    # Smooth shading again
    bpy.ops.object.shade_smooth()

    # Create realistic brain material
    brain_mat = create_brain_material()
    brain.data.materials.append(brain_mat)

    # Also create interior material (slightly different color for cut surface)
    interior_mat = create_material(
        "BrainInteriorMat",
        (0.75, 0.55, 0.55, 1),
        emission_strength=0.05,
        roughness=0.7,
        subsurface=0.3
    )
    brain.data.materials.append(interior_mat)

    link_to_collection(brain, "Brain")

    # Add blood vessels
    create_blood_vessels(brain)

    return brain


def create_brain_material():
    """Create realistic brain material - pink/gray with wet organic look."""
    mat = bpy.data.materials.new(name="BrainMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (600, 0)

    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.location = (300, 0)

    # Brain color - pinkish gray (like real brain tissue)
    principled.inputs['Base Color'].default_value = (0.82, 0.62, 0.62, 1)
    principled.inputs['Roughness'].default_value = 0.55

    # Subsurface scattering - essential for organic fleshy look
    principled.inputs['Subsurface Weight'].default_value = 0.5
    principled.inputs['Subsurface Radius'].default_value = (1.0, 0.4, 0.3)
    principled.inputs['Subsurface Scale'].default_value = 0.15

    # Slight wet sheen
    principled.inputs['Sheen Weight'].default_value = 0.15
    principled.inputs['Specular IOR Level'].default_value = 0.4

    links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    return mat


def create_blood_vessels(brain):
    """Add blood vessel network on brain surface."""
    print("    Adding blood vessels...")

    vessel_mat = create_material(
        "VesselMat",
        COLORS["blood_vessel"],
        emission_strength=0.2,
        roughness=0.4
    )

    # Create a few major vessels
    for i in range(8):
        # Create bezier curve
        curve = bpy.data.curves.new(f"Vessel_{i}", 'CURVE')
        curve.dimensions = '3D'
        curve.bevel_depth = 0.015 + random.uniform(0, 0.01)
        curve.bevel_resolution = 4

        spline = curve.splines.new('BEZIER')
        spline.bezier_points.add(4)  # 5 points total

        # Random starting position on brain surface
        theta = random.uniform(0, 2 * math.pi)
        phi = random.uniform(0.3, 0.7) * math.pi

        for j, bp in enumerate(spline.bezier_points):
            # Move along surface
            t = theta + j * 0.3 + random.uniform(-0.1, 0.1)
            p = phi + j * 0.15 + random.uniform(-0.1, 0.1)
            r = 2.5 + random.uniform(-0.1, 0.1)

            x = r * math.sin(p) * math.cos(t) * 1.1
            y = r * math.sin(p) * math.sin(t) * 0.95
            z = r * math.cos(p) * 0.85

            bp.co = (x, y, z)
            bp.handle_left_type = 'AUTO'
            bp.handle_right_type = 'AUTO'

        vessel_obj = bpy.data.objects.new(f"Vessel_{i}", curve)
        vessel_obj.data.materials.append(vessel_mat)
        bpy.context.collection.objects.link(vessel_obj)
        link_to_collection(vessel_obj, "Brain")


# =============================================================================
# BCI IMPLANT
# =============================================================================

def create_bci_implant():
    """Create Neuralink-style BCI with detailed electrodes."""
    print("    Creating BCI disc...")

    # Main circular disc (like Neuralink N1)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.6,
        depth=0.08,
        location=(0, 0, 2.7)
    )
    disc = bpy.context.active_object
    disc.name = "BCI_Disc"

    # Add bevel for rounded edges
    bevel = disc.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = 0.02
    bevel.segments = 3

    disc_mat = create_material(
        "BCIDiscMat",
        COLORS["bci_metal"],
        emission_strength=0.3,
        roughness=0.2
    )
    disc.data.materials.append(disc_mat)
    link_to_collection(disc, "BCI")

    # Central processing unit bump
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.15,
        depth=0.04,
        location=(0, 0, 2.76)
    )
    cpu = bpy.context.active_object
    cpu.name = "BCI_CPU"
    cpu_mat = create_material("CPUMat", (0.1, 0.1, 0.15, 1), emission_strength=0.5, roughness=0.1)
    cpu.data.materials.append(cpu_mat)
    link_to_collection(cpu, "BCI")

    # LED indicator
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.03, location=(0.1, 0, 2.78))
    led = bpy.context.active_object
    led.name = "BCI_LED"
    led_mat = create_material("LEDMat", (0, 1, 0.5, 1), emission_strength=10, roughness=0.1)
    led.data.materials.append(led_mat)
    link_to_collection(led, "BCI")

    # Create electrode threads
    print("    Creating electrode threads...")
    create_electrode_threads()


def create_electrode_threads():
    """Create flexible electrode threads with recording sites."""
    thread_mat = create_material(
        "ThreadMat",
        COLORS["electrode_gold"],
        emission_strength=1.5,
        roughness=0.3
    )

    tip_mat = create_material(
        "TipMat",
        COLORS["electrode_tip"],
        emission_strength=8,
        roughness=0.2
    )

    # 16 threads in a pattern
    num_threads = 16
    for i in range(num_threads):
        angle = (i / num_threads) * 2 * math.pi
        radius = 0.35 + (i % 2) * 0.1  # Alternating radius

        start_x = radius * math.cos(angle)
        start_y = radius * math.sin(angle)

        # Thread depth varies
        depth = 1.8 + random.uniform(0, 0.5)

        # Create bezier curve for thread
        curve = bpy.data.curves.new(f"Thread_{i}", 'CURVE')
        curve.dimensions = '3D'
        curve.bevel_depth = 0.008
        curve.bevel_resolution = 4

        spline = curve.splines.new('BEZIER')
        spline.bezier_points.add(3)  # 4 points

        # Start at disc
        p0 = spline.bezier_points[0]
        p0.co = (start_x, start_y, 2.66)
        p0.handle_left_type = 'AUTO'

        # Curve outward slightly
        p1 = spline.bezier_points[1]
        p1.co = (start_x * 1.3, start_y * 1.3, 2.0)
        p1.handle_left_type = 'AUTO'

        # Continue into brain
        p2 = spline.bezier_points[2]
        p2.co = (start_x * 1.5, start_y * 1.5, 1.0)
        p2.handle_left_type = 'AUTO'

        # End point (electrode tip) - converge toward center
        p3 = spline.bezier_points[3]
        end_x = start_x * 0.8 + random.uniform(-0.1, 0.1)
        end_y = start_y * 0.8 + random.uniform(-0.1, 0.1)
        p3.co = (end_x, end_y, 2.7 - depth)
        p3.handle_left_type = 'AUTO'

        thread_obj = bpy.data.objects.new(f"Thread_{i}", curve)
        thread_obj.data.materials.append(thread_mat)
        bpy.context.collection.objects.link(thread_obj)
        link_to_collection(thread_obj, "BCI")

        # Electrode tip (recording site)
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=0.025,
            location=p3.co
        )
        tip = bpy.context.active_object
        tip.name = f"ElectrodeTip_{i}"
        tip.data.materials.append(tip_mat)
        link_to_collection(tip, "BCI")

        # Add small recording bumps along thread
        for j in range(3):
            t = 0.4 + j * 0.2
            bump_x = start_x * (1.5 - t * 0.7)
            bump_y = start_y * (1.5 - t * 0.7)
            bump_z = 2.66 - t * depth

            bpy.ops.mesh.primitive_uv_sphere_add(
                radius=0.012,
                location=(bump_x, bump_y, bump_z)
            )
            bump = bpy.context.active_object
            bump.name = f"RecordingSite_{i}_{j}"
            bump.data.materials.append(tip_mat)
            link_to_collection(bump, "BCI")


# =============================================================================
# NEURAL NETWORK
# =============================================================================

def create_neuron_detailed(location, scale=1.0, index=0):
    """Create detailed neuron with soma, dendrites, axon, and spines."""

    # === SOMA (Cell Body) ===
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=3,
        radius=0.12 * scale,
        location=location
    )
    soma = bpy.context.active_object
    soma.name = f"Neuron_{index}_Soma"

    # Slight irregular shape
    soma.scale = (1.0, 0.9, 0.85)

    soma_mat = create_material(
        f"SomaMat_{index}",
        COLORS["neuron_body"],
        emission_strength=2,
        roughness=0.6,
        subsurface=0.2
    )
    soma.data.materials.append(soma_mat)
    link_to_collection(soma, "Neurons")

    # === NUCLEUS ===
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.05 * scale,
        location=(location[0], location[1], location[2] - 0.02 * scale)
    )
    nucleus = bpy.context.active_object
    nucleus.name = f"Neuron_{index}_Nucleus"
    nuc_mat = create_material(f"NucleusMat_{index}", (0.4, 0.2, 0.5, 1), emission_strength=1)
    nucleus.data.materials.append(nuc_mat)
    link_to_collection(nucleus, "Neurons")

    # === DENDRITES ===
    dendrite_mat = create_material(
        f"DendriteMat_{index}",
        COLORS["dendrite"],
        emission_strength=1.5,
        roughness=0.5
    )

    num_dendrites = 6
    for d in range(num_dendrites):
        # Main dendrite branch
        angle = (d / num_dendrites) * 2 * math.pi + random.uniform(-0.2, 0.2)

        curve = bpy.data.curves.new(f"Dendrite_{index}_{d}", 'CURVE')
        curve.dimensions = '3D'
        curve.bevel_depth = 0.015 * scale
        curve.bevel_resolution = 3

        spline = curve.splines.new('BEZIER')
        spline.bezier_points.add(2)  # 3 points

        # Start at soma
        p0 = spline.bezier_points[0]
        dx = 0.12 * scale * math.cos(angle)
        dy = 0.12 * scale * math.sin(angle)
        p0.co = (location[0] + dx * 0.8, location[1] + dy * 0.8, location[2] + 0.05 * scale)
        p0.handle_left_type = 'AUTO'

        # Branch outward and upward
        p1 = spline.bezier_points[1]
        length = random.uniform(0.25, 0.4) * scale
        p1.co = (
            location[0] + dx * 2 + random.uniform(-0.05, 0.05) * scale,
            location[1] + dy * 2 + random.uniform(-0.05, 0.05) * scale,
            location[2] + 0.15 * scale
        )
        p1.handle_left_type = 'AUTO'

        # End point
        p2 = spline.bezier_points[2]
        p2.co = (
            location[0] + dx * 3.5 + random.uniform(-0.1, 0.1) * scale,
            location[1] + dy * 3.5 + random.uniform(-0.1, 0.1) * scale,
            location[2] + random.uniform(0.1, 0.25) * scale
        )
        p2.handle_left_type = 'AUTO'

        dend_obj = bpy.data.objects.new(f"Dendrite_{index}_{d}", curve)
        dend_obj.data.materials.append(dendrite_mat)
        bpy.context.collection.objects.link(dend_obj)
        link_to_collection(dend_obj, "Neurons")

        # Add dendritic spines (small protrusions for synapses)
        spine_mat = create_material(f"SpineMat_{index}_{d}", (0.5, 0.9, 0.6, 1), emission_strength=2)
        for s in range(4):
            t = 0.3 + s * 0.18
            spine_x = location[0] + dx * (0.8 + t * 2.7)
            spine_y = location[1] + dy * (0.8 + t * 2.7)
            spine_z = location[2] + 0.05 * scale + t * 0.15 * scale

            bpy.ops.mesh.primitive_uv_sphere_add(
                radius=0.008 * scale,
                location=(
                    spine_x + random.uniform(-0.02, 0.02) * scale,
                    spine_y + random.uniform(-0.02, 0.02) * scale,
                    spine_z + random.uniform(0, 0.03) * scale
                )
            )
            spine = bpy.context.active_object
            spine.name = f"Spine_{index}_{d}_{s}"
            spine.data.materials.append(spine_mat)
            link_to_collection(spine, "Neurons")

    # === AXON ===
    axon_mat = create_material(
        f"AxonMat_{index}",
        COLORS["axon"],
        emission_strength=1.5,
        roughness=0.4
    )

    curve = bpy.data.curves.new(f"Axon_{index}", 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = 0.02 * scale
    curve.bevel_resolution = 4

    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(3)  # 4 points

    # Axon hillock (start)
    p0 = spline.bezier_points[0]
    p0.co = (location[0], location[1], location[2] - 0.1 * scale)
    p0.handle_left_type = 'AUTO'

    # Down and curve
    for i, bp in enumerate(spline.bezier_points[1:], 1):
        bp.co = (
            location[0] + random.uniform(-0.1, 0.1) * scale,
            location[1] + random.uniform(-0.1, 0.1) * scale,
            location[2] - 0.1 * scale - i * 0.25 * scale
        )
        bp.handle_left_type = 'AUTO'

    axon_obj = bpy.data.objects.new(f"Axon_{index}", curve)
    axon_obj.data.materials.append(axon_mat)
    bpy.context.collection.objects.link(axon_obj)
    link_to_collection(axon_obj, "Neurons")

    # Axon terminal (connects to synapse area)
    terminal_loc = spline.bezier_points[-1].co
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.03 * scale,
        location=terminal_loc
    )
    terminal = bpy.context.active_object
    terminal.name = f"AxonTerminal_{index}"
    term_mat = create_material(f"TerminalMat_{index}", COLORS["synapse_pre"], emission_strength=3)
    terminal.data.materials.append(term_mat)
    link_to_collection(terminal, "Neurons")

    return soma


def create_neural_network():
    """Create multiple interconnected neurons."""
    print("    Creating neural network...")

    # Position neurons along camera path
    neuron_positions = [
        (0.3, 0.2, 0.3),      # Near electrode tips
        (-0.2, 0.3, 0.2),
        (0.1, -0.2, 0.1),
        (-0.3, -0.1, 0.0),
        (0.2, 0.1, -0.1),
        (0, 0, -0.3),         # This one leads to synapse
        (-0.15, 0.15, -0.4),
        (0.15, -0.15, -0.35),
    ]

    for i, pos in enumerate(neuron_positions):
        scale = 0.8 + random.uniform(0, 0.4)
        create_neuron_detailed(pos, scale=scale, index=i)


# =============================================================================
# SYNAPSE - DETAILED
# =============================================================================

def create_synapse_detailed():
    """Create detailed synaptic junction."""
    print("    Creating detailed synapse...")

    # Synapse location (along camera path) - made larger and positioned for camera
    syn_loc = (0, -0.15, -0.5)
    scale = 0.5  # Much larger for visibility

    # === PRESYNAPTIC TERMINAL (Axon Bouton) ===
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.15 * scale,
        location=(syn_loc[0], syn_loc[1], syn_loc[2] + 0.12 * scale)
    )
    pre = bpy.context.active_object
    pre.name = "Synapse_Presynaptic"
    pre.scale = (1.2, 1.2, 0.8)

    pre_mat = create_material(
        "PresynapticMat",
        COLORS["synapse_pre"],
        emission_strength=2,
        roughness=0.5,
        subsurface=0.3
    )
    pre.data.materials.append(pre_mat)
    link_to_collection(pre, "Synapse")

    # === SYNAPTIC VESICLES (contain neurotransmitters) ===
    vesicle_mat = create_material(
        "VesicleMat",
        COLORS["vesicle"],
        emission_strength=5,
        roughness=0.3
    )

    # Cluster of vesicles near release zone
    for i in range(20):
        vx = syn_loc[0] + random.uniform(-0.08, 0.08) * scale
        vy = syn_loc[1] + random.uniform(-0.08, 0.08) * scale
        vz = syn_loc[2] + 0.08 * scale + random.uniform(0, 0.06) * scale

        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=random.uniform(0.012, 0.018) * scale,
            location=(vx, vy, vz)
        )
        v = bpy.context.active_object
        v.name = f"Vesicle_{i}"
        v.data.materials.append(vesicle_mat)
        link_to_collection(v, "Synapse")

    # === NEUROTRANSMITTERS (being released) ===
    nt_mat = create_material(
        "NeurotransmitterMat",
        COLORS["neurotransmitter"],
        emission_strength=8,
        roughness=0.2
    )

    # Molecules in synaptic cleft
    for i in range(15):
        nx = syn_loc[0] + random.uniform(-0.06, 0.06) * scale
        ny = syn_loc[1] + random.uniform(-0.06, 0.06) * scale
        nz = syn_loc[2] + random.uniform(-0.02, 0.04) * scale

        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=0.006 * scale,
            location=(nx, ny, nz)
        )
        nt = bpy.context.active_object
        nt.name = f"Neurotransmitter_{i}"
        nt.data.materials.append(nt_mat)
        link_to_collection(nt, "Synapse")

    # === SYNAPTIC CLEFT (gap) - implied by spacing ===

    # === POSTSYNAPTIC MEMBRANE ===
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.18 * scale,
        location=(syn_loc[0], syn_loc[1], syn_loc[2] - 0.1 * scale)
    )
    post = bpy.context.active_object
    post.name = "Synapse_Postsynaptic"
    post.scale = (1.3, 1.3, 0.5)

    post_mat = create_material(
        "PostsynapticMat",
        COLORS["synapse_post"],
        emission_strength=1.5,
        roughness=0.5,
        subsurface=0.3
    )
    post.data.materials.append(post_mat)
    link_to_collection(post, "Synapse")

    # === RECEPTORS (proteins on postsynaptic membrane) ===
    receptor_mat = create_material(
        "ReceptorMat",
        COLORS["receptor"],
        emission_strength=4,
        roughness=0.3
    )

    for i in range(12):
        angle = (i / 12) * 2 * math.pi
        r = 0.08 * scale
        rx = syn_loc[0] + r * math.cos(angle)
        ry = syn_loc[1] + r * math.sin(angle)
        rz = syn_loc[2] - 0.05 * scale

        # Receptor as small cylinder
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.008 * scale,
            depth=0.025 * scale,
            location=(rx, ry, rz)
        )
        rec = bpy.context.active_object
        rec.name = f"Receptor_{i}"
        rec.data.materials.append(receptor_mat)
        link_to_collection(rec, "Synapse")


# =============================================================================
# ION CHANNEL - DETAILED
# =============================================================================

def create_ion_channel_detailed():
    """Create detailed ion channel with passing ions."""
    print("    Creating ion channel...")

    chan_loc = (0, -0.08, -0.75)
    scale = 0.35  # Larger for visibility

    # === CHANNEL PROTEIN (Torus shape) ===
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.12 * scale,
        minor_radius=0.035 * scale,
        location=chan_loc
    )
    channel = bpy.context.active_object
    channel.name = "IonChannel_Protein"

    chan_mat = create_material(
        "ChannelProteinMat",
        COLORS["ion_channel"],
        emission_strength=3,
        roughness=0.4,
        subsurface=0.2
    )
    channel.data.materials.append(chan_mat)
    link_to_collection(channel, "IonChannel")

    # === SELECTIVITY FILTER (inner ring) ===
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.05 * scale,
        minor_radius=0.015 * scale,
        location=chan_loc
    )
    filter_ring = bpy.context.active_object
    filter_ring.name = "SelectivityFilter"
    filter_mat = create_material("FilterMat", (0.8, 0.6, 1.0, 1), emission_strength=5)
    filter_ring.data.materials.append(filter_mat)
    link_to_collection(filter_ring, "IonChannel")

    # === PASSING IONS ===
    # Sodium ions (Na+)
    na_mat = create_material("NaMat", COLORS["ion_na"], emission_strength=10)
    for i in range(4):
        iz = chan_loc[2] + (i - 1.5) * 0.04 * scale
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=0.015 * scale,
            location=(chan_loc[0], chan_loc[1], iz)
        )
        ion = bpy.context.active_object
        ion.name = f"Na_Ion_{i}"
        ion.data.materials.append(na_mat)
        link_to_collection(ion, "IonChannel")

    # Potassium ions (K+) nearby
    k_mat = create_material("KMat", COLORS["ion_k"], emission_strength=8)
    for i in range(3):
        kx = chan_loc[0] + 0.15 * scale * math.cos(i * 2.1)
        ky = chan_loc[1] + 0.15 * scale * math.sin(i * 2.1)
        kz = chan_loc[2] + random.uniform(-0.02, 0.02) * scale

        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=0.02 * scale,
            location=(kx, ky, kz)
        )
        k_ion = bpy.context.active_object
        k_ion.name = f"K_Ion_{i}"
        k_ion.data.materials.append(k_mat)
        link_to_collection(k_ion, "IonChannel")


# =============================================================================
# MOLECULAR STRUCTURE
# =============================================================================

def create_molecular_structure():
    """Create molecular detail - protein with metal cofactor."""
    print("    Creating molecular structure...")

    mol_loc = (0, -0.04, -0.9)
    scale = 0.15  # Larger for visibility

    # === CENTRAL METAL ION (Fe2+ or similar cofactor) ===
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=2,
        radius=0.08 * scale,
        location=mol_loc
    )
    fe = bpy.context.active_object
    fe.name = "Fe2+_Cofactor"

    fe_mat = create_material(
        "Fe2Mat",
        COLORS["molecular_fe"],
        emission_strength=15,
        roughness=0.2
    )
    fe.data.materials.append(fe_mat)
    link_to_collection(fe, "Molecular")

    # === COORDINATING ATOMS ===
    # Nitrogen atoms (from histidine residues)
    n_mat = create_material("NitrogenMat", COLORS["molecular_n"], emission_strength=6)
    for i in range(4):
        angle = (i / 4) * 2 * math.pi
        nx = mol_loc[0] + 0.12 * scale * math.cos(angle)
        ny = mol_loc[1] + 0.12 * scale * math.sin(angle)

        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=0.04 * scale,
            location=(nx, ny, mol_loc[2])
        )
        n_atom = bpy.context.active_object
        n_atom.name = f"Nitrogen_{i}"
        n_atom.data.materials.append(n_mat)
        link_to_collection(n_atom, "Molecular")

    # Oxygen atoms (from water or carboxyl)
    o_mat = create_material("OxygenMat", COLORS["molecular_o"], emission_strength=6)
    for i in range(2):
        oz = mol_loc[2] + (i * 2 - 1) * 0.1 * scale
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=0.035 * scale,
            location=(mol_loc[0], mol_loc[1], oz)
        )
        o_atom = bpy.context.active_object
        o_atom.name = f"Oxygen_{i}"
        o_atom.data.materials.append(o_mat)
        link_to_collection(o_atom, "Molecular")

    # Carbon backbone atoms
    c_mat = create_material("CarbonMat", COLORS["molecular_c"], emission_strength=3)
    for i in range(12):
        theta = random.uniform(0, 2 * math.pi)
        phi = random.uniform(0, math.pi)
        r = random.uniform(0.15, 0.25) * scale

        cx = mol_loc[0] + r * math.sin(phi) * math.cos(theta)
        cy = mol_loc[1] + r * math.sin(phi) * math.sin(theta)
        cz = mol_loc[2] + r * math.cos(phi)

        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=random.uniform(0.025, 0.035) * scale,
            location=(cx, cy, cz)
        )
        c_atom = bpy.context.active_object
        c_atom.name = f"Carbon_{i}"
        c_atom.data.materials.append(c_mat)
        link_to_collection(c_atom, "Molecular")

    # === ELECTRON CLOUD (orbital visualization) ===
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.2 * scale,
        location=mol_loc
    )
    cloud = bpy.context.active_object
    cloud.name = "ElectronCloud"

    cloud_mat = bpy.data.materials.new(name="ElectronCloudMat")
    cloud_mat.use_nodes = True
    cloud_mat.blend_method = 'BLEND'
    nodes = cloud_mat.node_tree.nodes
    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.inputs['Base Color'].default_value = (0.5, 0.7, 1.0, 0.15)
    principled.inputs['Alpha'].default_value = 0.15
    principled.inputs['Emission Color'].default_value = (0.5, 0.7, 1.0, 1)
    principled.inputs['Emission Strength'].default_value = 2
    cloud_mat.node_tree.links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    cloud.data.materials.append(cloud_mat)
    link_to_collection(cloud, "Molecular")


# =============================================================================
# CAMERA AND LIGHTING
# =============================================================================

def setup_camera():
    """Create animated camera with smooth zoom."""
    print("    Setting up camera...")

    bpy.ops.object.camera_add(location=(0, -8, 3))
    cam = bpy.context.active_object
    cam.name = "Camera"
    cam.rotation_euler = (math.radians(70), 0, 0)
    bpy.context.scene.camera = cam

    # Camera settings
    cam.data.lens = 35
    cam.data.clip_start = 0.001
    cam.data.clip_end = 100

    frames = CONFIG["duration_seconds"] * CONFIG["fps"]

    # Keyframes: (frame, location, rotation_x_degrees)
    # Adjusted to match larger structure positions
    keyframes = [
        (1,              (0, -8, 3),       70),    # Brain overview
        (frames * 0.10,  (0, -5, 2),       72),    # Closer to BCI
        (frames * 0.20,  (0, -2.5, 1),     75),    # Electrode threads
        (frames * 0.30,  (0, -1.2, 0.5),   78),    # Enter cortex - neurons
        (frames * 0.40,  (0, -0.6, 0.1),   80),    # Neural network
        (frames * 0.50,  (0, -0.4, -0.2),  82),    # Single neuron detail
        (frames * 0.60,  (0, -0.35, -0.4), 84),    # Approach synapse
        (frames * 0.70,  (0, -0.3, -0.5),  85),    # Synapse detail
        (frames * 0.80,  (0, -0.2, -0.65), 86),    # Ion channel
        (frames * 0.90,  (0, -0.12, -0.8), 87),    # Molecular approach
        (frames,         (0, -0.08, -0.9), 88),    # Final - molecular detail
    ]

    for frame, loc, rot_x in keyframes:
        cam.location = loc
        cam.rotation_euler = (math.radians(rot_x), 0, 0)
        cam.keyframe_insert(data_path="location", frame=int(frame))
        cam.keyframe_insert(data_path="rotation_euler", frame=int(frame))

    # Smooth keyframes
    try:
        if cam.animation_data and cam.animation_data.action:
            action = cam.animation_data.action
            if hasattr(action, 'fcurves'):
                for fc in action.fcurves:
                    for kf in fc.keyframe_points:
                        kf.interpolation = 'BEZIER'
                        kf.handle_left_type = 'AUTO_CLAMPED'
                        kf.handle_right_type = 'AUTO_CLAMPED'
    except Exception as e:
        print(f"    Note: Keyframe smoothing skipped ({e})")

    return cam


def setup_lighting():
    """Create dramatic lighting setup."""
    print("    Setting up lighting...")

    # Key light (main illumination)
    bpy.ops.object.light_add(type='AREA', location=(4, -4, 6))
    key = bpy.context.active_object
    key.name = "KeyLight"
    key.data.energy = 500
    key.data.size = 4
    key.data.color = (1.0, 0.95, 0.9)
    key.rotation_euler = (math.radians(45), 0, math.radians(30))

    # Fill light (softer, from side)
    bpy.ops.object.light_add(type='AREA', location=(-3, -2, 3))
    fill = bpy.context.active_object
    fill.name = "FillLight"
    fill.data.energy = 200
    fill.data.size = 3
    fill.data.color = (0.9, 0.95, 1.0)

    # Rim light (back edge highlight)
    bpy.ops.object.light_add(type='SPOT', location=(0, 3, 2))
    rim = bpy.context.active_object
    rim.name = "RimLight"
    rim.data.energy = 300
    rim.data.spot_size = math.radians(60)
    rim.rotation_euler = (math.radians(120), 0, 0)

    # Micro light (for small structures)
    bpy.ops.object.light_add(type='POINT', location=(0, -0.2, -0.5))
    micro = bpy.context.active_object
    micro.name = "MicroLight"
    micro.data.energy = 10
    micro.data.color = (0.8, 0.9, 1.0)


def setup_world():
    """Setup world background."""
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world

    world.use_nodes = True
    nodes = world.node_tree.nodes

    bg = nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = COLORS["background"]
        bg.inputs['Strength'].default_value = 0.5


# =============================================================================
# MAIN
# =============================================================================

def setup_scene():
    """Build the complete scene."""
    print("\n" + "="*60)
    print("BCI Zoom 3D - Scene Generation")
    print("="*60)

    clear_scene()

    # Scene settings
    scene = bpy.context.scene
    scene.render.resolution_x = CONFIG["resolution_x"]
    scene.render.resolution_y = CONFIG["resolution_y"]
    scene.render.fps = CONFIG["fps"]
    scene.frame_start = 1
    scene.frame_end = CONFIG["duration_seconds"] * CONFIG["fps"]
    scene.render.engine = 'BLENDER_EEVEE'

    # EEVEE settings for better quality (Blender 5.0 compatible)
    try:
        scene.eevee.taa_render_samples = 64
        # Bloom is now in compositor in Blender 5.0
        if hasattr(scene.eevee, 'use_bloom'):
            scene.eevee.use_bloom = True
            scene.eevee.bloom_intensity = 0.1
        if hasattr(scene.eevee, 'use_ssr'):
            scene.eevee.use_ssr = True
    except AttributeError as e:
        print(f"    Note: Some EEVEE settings unavailable ({e})")

    print("\n[1/8] Creating brain surface...")
    create_brain_surface()

    print("\n[2/8] Creating BCI implant...")
    create_bci_implant()

    print("\n[3/8] Creating neural network...")
    create_neural_network()

    print("\n[4/8] Creating synapse...")
    create_synapse_detailed()

    print("\n[5/8] Creating ion channel...")
    create_ion_channel_detailed()

    print("\n[6/8] Creating molecular structure...")
    create_molecular_structure()

    print("\n[7/8] Setting up camera...")
    setup_camera()

    print("\n[8/8] Setting up lighting...")
    setup_lighting()
    setup_world()

    # Save blend file
    blend_path = "//bci_zoom_scene.blend"
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(blend_path))

    print("\n" + "="*60)
    print("Scene setup complete!")
    print("="*60)
    print(f"  Duration: {CONFIG['duration_seconds']}s @ {CONFIG['fps']}fps")
    print(f"  Frames: {scene.frame_end}")
    print(f"  Resolution: {CONFIG['resolution_x']}x{CONFIG['resolution_y']}")
    print(f"\nTo render preview:")
    print(f"  blender -b bci_zoom_scene.blend -o //renders/frame_ -F PNG -x 1 -a")
    print(f"\nOr open in Blender GUI and press Ctrl+F12")
    print("="*60 + "\n")


if __name__ == "__main__":
    setup_scene()
