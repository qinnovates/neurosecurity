"""
BCI Zoom Animation: From Implant to Molecular Scale
====================================================

A scientifically accurate visualization showing:
- BCI implant (Neuralink-style) on brain surface
- Progressive zoom through 9 orders of magnitude
- Dual axes: Timescale (Y) and Spatial Scale (X)
- Live neural activity visualization at each scale

Based on: ONI Framework - ONI_LAYERS.md v3.0
Author: Kevin L. Qi / Qinnovate
"""

from manim import *
import json
import numpy as np
import os

# Get absolute path to project root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Add utils to path
import sys
sys.path.insert(0, PROJECT_ROOT)
from utils.theme import ONIColors, format_timescale, format_spatial_scale, get_scale_color

# Load scale data
SCALES_PATH = os.path.join(PROJECT_ROOT, 'data', 'scales.json')
with open(SCALES_PATH) as f:
    SCALE_DATA = json.load(f)


class BCIZoomAnimation(ZoomedScene):
    """
    Main animation: Zoom from BCI implant to molecular scale
    with live activity and dual scale axes.
    """

    def __init__(self, **kwargs):
        ZoomedScene.__init__(
            self,
            zoom_factor=0.3,
            zoomed_display_height=4,
            zoomed_display_width=6,
            zoomed_camera_frame_starting_position=ORIGIN,
            **kwargs
        )

    def construct(self):
        # Set dark background
        self.camera.background_color = ONIColors.BG_DARK

        # Create persistent scale axes
        self.axes = self.create_scale_axes()
        self.add(self.axes)

        # Title
        title = Text(
            "Future BCI: From Implant to Molecule",
            font_size=36,
            color=ONIColors.TEXT_PRIMARY
        ).to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Zoom through each scale level
        zoom_levels = SCALE_DATA["zoom_levels"]

        for i, level in enumerate(zoom_levels):
            self.animate_zoom_level(level, i, len(zoom_levels))

        # Final summary
        self.show_summary()

    def create_scale_axes(self):
        """Create the dual-axis scale indicator."""
        axes_group = VGroup()

        # Y-axis: Timescale (left side)
        y_axis = Arrow(
            start=DOWN * 3 + LEFT * 6,
            end=UP * 3 + LEFT * 6,
            color=ONIColors.TEXT_SECONDARY,
            stroke_width=2
        )
        y_label = Text("Timescale", font_size=16, color=ONIColors.TEXT_SECONDARY)
        y_label.next_to(y_axis, UP, buff=0.1)

        # Y-axis markers (log scale: s → fs)
        y_markers = VGroup()
        timescales = [
            (1, "1 s", 0.9),
            (1e-3, "1 ms", 0.6),
            (1e-6, "1 us", 0.3),
            (1e-9, "1 ns", 0),
            (1e-12, "1 ps", -0.3),
            (1e-15, "1 fs", -0.6),
        ]
        for val, label, y_pos in timescales:
            dot = Dot(point=LEFT * 6 + UP * (y_pos * 3), radius=0.05, color=ONIColors.TEXT_MUTED)
            text = Text(label, font_size=10, color=ONIColors.TEXT_MUTED)
            text.next_to(dot, LEFT, buff=0.1)
            y_markers.add(VGroup(dot, text))

        # X-axis: Spatial scale (bottom)
        x_axis = Arrow(
            start=LEFT * 5 + DOWN * 3.5,
            end=RIGHT * 5 + DOWN * 3.5,
            color=ONIColors.TEXT_SECONDARY,
            stroke_width=2
        )
        x_label = Text("Spatial Scale", font_size=16, color=ONIColors.TEXT_SECONDARY)
        x_label.next_to(x_axis, DOWN, buff=0.1)

        # X-axis markers (log scale: cm → Angstrom)
        x_markers = VGroup()
        spatial_scales = [
            (1e-2, "1 cm", -0.8),
            (1e-3, "1 mm", -0.5),
            (1e-6, "1 um", 0),
            (1e-9, "1 nm", 0.5),
            (1e-10, "1 A", 0.8),
        ]
        for val, label, x_pos in spatial_scales:
            dot = Dot(point=RIGHT * (x_pos * 5) + DOWN * 3.5, radius=0.05, color=ONIColors.TEXT_MUTED)
            text = Text(label, font_size=10, color=ONIColors.TEXT_MUTED)
            text.next_to(dot, DOWN, buff=0.1)
            x_markers.add(VGroup(dot, text))

        axes_group.add(y_axis, y_label, y_markers, x_axis, x_label, x_markers)
        return axes_group

    def animate_zoom_level(self, level: dict, index: int, total: int):
        """Animate a single zoom level with activity visualization."""

        # Clear previous level content (except axes)
        if index > 0:
            self.play(*[FadeOut(mob) for mob in self.mobjects if mob != self.axes])
            self.add(self.axes)

        # Get level data
        name = level["name"]
        spatial = level["spatial_value"]
        timescale = level["timescale_value"]
        oni_layer = level["oni_layer"]
        structures = level["structures"]
        activity = level["activity"]
        color = level["color"]
        bci_access = level["bci_access"]

        # Create scale indicator position
        # Map spatial scale to x position (-5 to 5)
        x_pos = np.log10(spatial) / 2 + 2  # Rough mapping
        x_pos = max(-4, min(4, x_pos * -1))  # Clamp and invert

        # Map timescale to y position (-3 to 3)
        y_pos = np.log10(timescale) / 5 + 0.5
        y_pos = max(-2.5, min(2.5, y_pos))

        # Current position indicator
        position_dot = Dot(
            point=RIGHT * x_pos + UP * y_pos,
            radius=0.15,
            color=color
        )
        position_ring = Circle(radius=0.25, color=color, stroke_width=3)
        position_ring.move_to(position_dot)

        # Level title card
        level_title = Text(
            f"{index + 1}/{total}: {name}",
            font_size=28,
            color=color
        ).to_edge(UP, buff=1.2)

        # Info panel (right side)
        info_panel = self.create_info_panel(level)
        info_panel.to_edge(RIGHT, buff=0.3).shift(UP * 0.5)

        # Main visualization area
        visualization = self.create_level_visualization(level, index)
        visualization.move_to(ORIGIN).scale(0.8)

        # Animate entry
        self.play(
            FadeIn(level_title),
            Create(position_dot),
            Create(position_ring),
            run_time=0.5
        )

        self.play(
            FadeIn(info_panel),
            FadeIn(visualization),
            run_time=1
        )

        # Animate "live" activity
        self.animate_activity(visualization, level, duration=3)

        # Pulse the position indicator
        self.play(
            position_ring.animate.scale(1.5).set_opacity(0),
            run_time=0.5
        )

    def create_info_panel(self, level: dict) -> VGroup:
        """Create the info panel for a zoom level."""
        panel = VGroup()

        # Background rectangle
        bg = RoundedRectangle(
            width=3.5,
            height=4,
            corner_radius=0.2,
            fill_color=ONIColors.BG_GRADIENT_TOP,
            fill_opacity=0.9,
            stroke_color=level["color"],
            stroke_width=2
        )

        # ONI Layer badge
        layer_badge = VGroup(
            RoundedRectangle(
                width=1.5, height=0.4,
                corner_radius=0.1,
                fill_color=level["color"],
                fill_opacity=0.3,
                stroke_color=level["color"]
            ),
            Text(level["oni_layer"], font_size=14, color=level["color"])
        )
        layer_badge[1].move_to(layer_badge[0])
        layer_badge.move_to(bg.get_top() + DOWN * 0.4)

        # Spatial scale
        spatial_text = VGroup(
            Text("Spatial:", font_size=12, color=ONIColors.TEXT_MUTED),
            Text(level["spatial_scale"], font_size=16, color=ONIColors.TEXT_PRIMARY)
        ).arrange(RIGHT, buff=0.2)
        spatial_text.next_to(layer_badge, DOWN, buff=0.3)

        # Timescale
        time_text = VGroup(
            Text("Timescale:", font_size=12, color=ONIColors.TEXT_MUTED),
            Text(level["timescale"], font_size=16, color=ONIColors.TEXT_PRIMARY)
        ).arrange(RIGHT, buff=0.2)
        time_text.next_to(spatial_text, DOWN, buff=0.2)

        # Structures
        struct_title = Text("Structures:", font_size=12, color=ONIColors.TEXT_MUTED)
        struct_title.next_to(time_text, DOWN, buff=0.3).align_to(bg, LEFT).shift(RIGHT * 0.2)

        structures = VGroup()
        for struct in level["structures"][:3]:  # Max 3
            bullet = Text(f"- {struct}", font_size=11, color=ONIColors.TEXT_SECONDARY)
            structures.add(bullet)
        structures.arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        structures.next_to(struct_title, DOWN, buff=0.1).align_to(struct_title, LEFT)

        # BCI Access indicator
        access_color = ONIColors.ACTIVE_HIGH if "Direct" in level["bci_access"] else ONIColors.TEXT_MUTED
        if "None" in level["bci_access"]:
            access_color = ONIColors.INACTIVE

        access_badge = VGroup(
            Text("BCI Access:", font_size=10, color=ONIColors.TEXT_MUTED),
            Text(level["bci_access"].split(" ")[0], font_size=12, color=access_color)
        ).arrange(RIGHT, buff=0.1)
        access_badge.next_to(bg.get_bottom() + UP * 0.3, ORIGIN)

        panel.add(bg, layer_badge, spatial_text, time_text, struct_title, structures, access_badge)
        return panel

    def create_level_visualization(self, level: dict, index: int) -> VGroup:
        """Create the main visualization for each zoom level."""
        viz = VGroup()

        if index == 0:  # BCI Implant
            viz = self.create_bci_implant_viz(level)
        elif index == 1:  # Cortical Surface
            viz = self.create_cortical_viz(level)
        elif index == 2:  # Neural Circuits
            viz = self.create_circuit_viz(level)
        elif index == 3:  # Single Neurons
            viz = self.create_neuron_viz(level)
        elif index == 4:  # Synapses
            viz = self.create_synapse_viz(level)
        elif index == 5:  # NT Release
            viz = self.create_vesicle_viz(level)
        elif index == 6:  # Receptor Binding
            viz = self.create_receptor_viz(level)
        elif index == 7:  # Ion Channels
            viz = self.create_ion_channel_viz(level)
        elif index == 8:  # Molecular
            viz = self.create_molecular_viz(level)
        else:
            viz = self.create_placeholder_viz(level)

        return viz

    def create_bci_implant_viz(self, level: dict) -> VGroup:
        """Visualize BCI implant on brain surface."""
        viz = VGroup()

        # Brain surface (curved)
        brain_curve = Arc(
            radius=3,
            start_angle=PI/4,
            angle=PI/2,
            color=ONIColors.BIOLOGY,
            stroke_width=4
        )
        brain_curve.shift(DOWN * 1)

        # Brain surface texture (sulci)
        sulci = VGroup()
        for i in range(5):
            sulcus = Arc(
                radius=0.3 + i * 0.1,
                start_angle=PI/3 + i * 0.2,
                angle=PI/4,
                color=ONIColors.BIOLOGY,
                stroke_width=2,
                stroke_opacity=0.5
            ).shift(LEFT * (i - 2) * 0.5 + DOWN * 0.5)
            sulci.add(sulcus)

        # BCI device (Neuralink-style)
        bci_base = Circle(radius=0.4, color=ONIColors.SILICON, fill_opacity=0.8, stroke_width=3)
        bci_base.shift(UP * 0.5)

        # Electrode threads
        threads = VGroup()
        for angle in np.linspace(-PI/4, PI/4, 5):
            thread = Line(
                start=bci_base.get_center(),
                end=bci_base.get_center() + DOWN * 1.5 * np.array([np.sin(angle), -np.cos(angle), 0]),
                color=ONIColors.GATEWAY,
                stroke_width=2
            )
            # Electrode tips
            tip = Dot(thread.get_end(), radius=0.05, color=ONIColors.GATEWAY)
            threads.add(VGroup(thread, tip))

        # Label
        bci_label = Text("BCI Implant", font_size=14, color=ONIColors.TEXT_SECONDARY)
        bci_label.next_to(bci_base, UP, buff=0.2)

        viz.add(brain_curve, sulci, threads, bci_base, bci_label)
        return viz

    def create_cortical_viz(self, level: dict) -> VGroup:
        """Visualize cortical layers."""
        viz = VGroup()

        # Cortical layers (6 layers)
        layer_colors = [
            ONIColors.SCALE_MACRO,
            ONIColors.SCALE_CIRCUIT,
            ONIColors.SCALE_NEURON,
            ONIColors.SCALE_SYNAPSE,
            ONIColors.SCALE_MOLECULAR,
            ONIColors.SCALE_QUANTUM,
        ]
        layer_names = ["I", "II/III", "IV", "V", "VI", "WM"]

        layers = VGroup()
        for i, (color, name) in enumerate(zip(layer_colors, layer_names)):
            layer_rect = Rectangle(
                width=4,
                height=0.4,
                fill_color=color,
                fill_opacity=0.6,
                stroke_color=color,
                stroke_width=1
            ).shift(DOWN * i * 0.45)

            layer_label = Text(f"L{name}", font_size=10, color=ONIColors.TEXT_PRIMARY)
            layer_label.move_to(layer_rect).align_to(layer_rect, LEFT).shift(RIGHT * 0.2)

            layers.add(VGroup(layer_rect, layer_label))

        layers.move_to(ORIGIN)

        # Electrode penetrating
        electrode = Line(
            start=UP * 1.5 + LEFT * 0.5,
            end=DOWN * 1 + LEFT * 0.5,
            color=ONIColors.GATEWAY,
            stroke_width=3
        )
        electrode_tip = Dot(electrode.get_end(), radius=0.08, color=ONIColors.ACTIVE_HIGH)

        viz.add(layers, electrode, electrode_tip)
        return viz

    def create_circuit_viz(self, level: dict) -> VGroup:
        """Visualize neural microcircuit."""
        viz = VGroup()

        # Create network of connected neurons
        neurons = VGroup()
        positions = [
            LEFT * 1.5 + UP * 1,
            LEFT * 0.5 + UP * 0.5,
            RIGHT * 0.5 + UP * 0.5,
            RIGHT * 1.5 + UP * 1,
            LEFT * 1 + DOWN * 0.5,
            ORIGIN + DOWN * 0.3,
            RIGHT * 1 + DOWN * 0.5,
        ]

        for pos in positions:
            neuron = Circle(radius=0.2, color=ONIColors.SCALE_CIRCUIT, fill_opacity=0.7)
            neuron.move_to(pos)
            neurons.add(neuron)

        # Connections (axons)
        connections = VGroup()
        connection_pairs = [(0, 1), (1, 2), (2, 3), (1, 5), (2, 5), (4, 5), (5, 6)]
        for i, j in connection_pairs:
            line = Line(
                neurons[i].get_center(),
                neurons[j].get_center(),
                color=ONIColors.TEXT_MUTED,
                stroke_width=1.5
            )
            connections.add(line)

        viz.add(connections, neurons)
        return viz

    def create_neuron_viz(self, level: dict) -> VGroup:
        """Visualize single neuron with dendrites and axon."""
        viz = VGroup()

        # Soma (cell body)
        soma = Circle(radius=0.5, color=ONIColors.SCALE_NEURON, fill_opacity=0.8)

        # Dendrites (input)
        dendrites = VGroup()
        for angle in np.linspace(2*PI/3, 4*PI/3, 5):
            start = soma.get_center() + 0.5 * np.array([np.cos(angle), np.sin(angle), 0])
            end = start + 0.8 * np.array([np.cos(angle), np.sin(angle), 0])

            dendrite = Line(start, end, color=ONIColors.BIOLOGY, stroke_width=3)
            dendrites.add(dendrite)

            # Dendritic spines
            for t in [0.3, 0.6, 0.9]:
                spine_pos = start + t * (end - start)
                spine = Line(
                    spine_pos,
                    spine_pos + 0.15 * np.array([np.cos(angle + PI/4), np.sin(angle + PI/4), 0]),
                    color=ONIColors.BIOLOGY,
                    stroke_width=1.5
                )
                dendrites.add(spine)

        # Axon (output)
        axon_start = soma.get_center() + RIGHT * 0.5
        axon = Line(
            axon_start,
            axon_start + RIGHT * 2,
            color=ONIColors.GATEWAY,
            stroke_width=4
        )

        # Axon terminal
        terminal = VGroup()
        for dy in [-0.2, 0, 0.2]:
            branch = Line(
                axon.get_end(),
                axon.get_end() + RIGHT * 0.3 + UP * dy,
                color=ONIColors.GATEWAY,
                stroke_width=2
            )
            bouton = Dot(branch.get_end(), radius=0.08, color=ONIColors.ACTIVE_HIGH)
            terminal.add(branch, bouton)

        # Labels
        soma_label = Text("Soma", font_size=12, color=ONIColors.TEXT_SECONDARY)
        soma_label.next_to(soma, DOWN, buff=0.1)

        viz.add(dendrites, soma, axon, terminal, soma_label)
        return viz

    def create_synapse_viz(self, level: dict) -> VGroup:
        """Visualize synaptic junction."""
        viz = VGroup()

        # Presynaptic terminal
        pre = RoundedRectangle(
            width=1.5, height=1.2,
            corner_radius=0.3,
            fill_color=ONIColors.SCALE_SYNAPSE,
            fill_opacity=0.7,
            stroke_width=2
        ).shift(UP * 0.8)

        # Vesicles
        vesicles = VGroup()
        vesicle_positions = [
            UP * 1.2 + LEFT * 0.3,
            UP * 1.1 + RIGHT * 0.2,
            UP * 0.9 + LEFT * 0.1,
            UP * 0.7 + RIGHT * 0.3,
            UP * 0.5,  # Docked vesicle
        ]
        for pos in vesicle_positions:
            vesicle = Circle(radius=0.12, color=ONIColors.DOPAMINE, fill_opacity=0.9)
            vesicle.move_to(pos)
            vesicles.add(vesicle)

        # Synaptic cleft
        cleft = Rectangle(
            width=2, height=0.15,
            fill_color=ONIColors.BG_DARK,
            fill_opacity=0.8,
            stroke_width=0
        )

        # Postsynaptic membrane
        post = RoundedRectangle(
            width=1.8, height=0.8,
            corner_radius=0.2,
            fill_color=ONIColors.BIOLOGY,
            fill_opacity=0.7,
            stroke_width=2
        ).shift(DOWN * 0.6)

        # Receptors on postsynaptic membrane
        receptors = VGroup()
        for x in np.linspace(-0.6, 0.6, 5):
            receptor = VGroup(
                Line(DOWN * 0.2 + RIGHT * x, DOWN * 0.35 + RIGHT * x, color=ONIColors.GLUTAMATE, stroke_width=3),
                Circle(radius=0.06, color=ONIColors.GLUTAMATE, fill_opacity=1).move_to(DOWN * 0.2 + RIGHT * x)
            )
            receptors.add(receptor)

        # Labels
        pre_label = Text("Presynaptic", font_size=10, color=ONIColors.TEXT_MUTED)
        pre_label.next_to(pre, UP, buff=0.1)
        post_label = Text("Postsynaptic", font_size=10, color=ONIColors.TEXT_MUTED)
        post_label.next_to(post, DOWN, buff=0.1)
        cleft_label = Text("Synaptic Cleft (~20nm)", font_size=8, color=ONIColors.TEXT_MUTED)
        cleft_label.next_to(cleft, RIGHT, buff=0.1)

        viz.add(pre, vesicles, cleft, post, receptors, pre_label, post_label, cleft_label)
        return viz

    def create_vesicle_viz(self, level: dict) -> VGroup:
        """Visualize vesicle fusion and NT release."""
        viz = VGroup()

        # Large vesicle
        vesicle = Circle(radius=0.8, color=ONIColors.DOPAMINE, fill_opacity=0.3, stroke_width=3)

        # Neurotransmitter molecules inside
        molecules = VGroup()
        for _ in range(15):
            angle = np.random.uniform(0, 2*PI)
            r = np.random.uniform(0.1, 0.6)
            mol = Dot(
                point=r * np.array([np.cos(angle), np.sin(angle), 0]),
                radius=0.06,
                color=ONIColors.DOPAMINE
            )
            molecules.add(mol)

        # SNARE proteins
        snare = VGroup()
        for x in [-0.3, 0.3]:
            protein = Line(
                vesicle.get_bottom() + RIGHT * x,
                vesicle.get_bottom() + DOWN * 0.5 + RIGHT * x,
                color=ONIColors.SEROTONIN,
                stroke_width=4
            )
            snare.add(protein)

        # Membrane
        membrane = Line(LEFT * 2, RIGHT * 2, color=ONIColors.BIOLOGY, stroke_width=4)
        membrane.shift(DOWN * 1.3)

        # Ca2+ channels
        ca_channel = VGroup(
            Rectangle(width=0.3, height=0.2, fill_color=ONIColors.ACETYLCHOLINE, fill_opacity=0.8),
            Text("Ca2+", font_size=8, color=ONIColors.TEXT_PRIMARY)
        )
        ca_channel[1].move_to(ca_channel[0])
        ca_channel.next_to(membrane, UP, buff=0).shift(LEFT * 1)

        # Labels
        vesicle_label = Text("Synaptic Vesicle", font_size=12, color=ONIColors.TEXT_SECONDARY)
        vesicle_label.next_to(vesicle, UP, buff=0.2)

        viz.add(membrane, ca_channel, snare, vesicle, molecules, vesicle_label)
        return viz

    def create_receptor_viz(self, level: dict) -> VGroup:
        """Visualize receptor binding."""
        viz = VGroup()

        # Receptor protein (large, detailed)
        receptor_body = VGroup()

        # Extracellular domain
        extra = Ellipse(width=1.2, height=0.8, color=ONIColors.GLUTAMATE, fill_opacity=0.6)
        extra.shift(UP * 0.6)

        # Transmembrane domain
        tm = Rectangle(width=0.6, height=1.2, color=ONIColors.GLUTAMATE, fill_opacity=0.8)

        # Intracellular domain
        intra = Ellipse(width=0.8, height=0.5, color=ONIColors.GLUTAMATE, fill_opacity=0.6)
        intra.shift(DOWN * 0.8)

        receptor_body.add(extra, tm, intra)

        # Binding pocket
        pocket = Arc(
            radius=0.3,
            start_angle=PI/6,
            angle=2*PI/3,
            color=ONIColors.ACTIVE_HIGH,
            stroke_width=4
        ).shift(UP * 0.8)

        # Neurotransmitter molecule
        nt_molecule = VGroup(
            Circle(radius=0.15, color=ONIColors.DOPAMINE, fill_opacity=1),
            Circle(radius=0.08, color=ONIColors.ACETYLCHOLINE, fill_opacity=1).shift(RIGHT * 0.15 + UP * 0.1),
            Circle(radius=0.08, color=ONIColors.ACETYLCHOLINE, fill_opacity=1).shift(LEFT * 0.15 + UP * 0.1),
        )
        nt_molecule.shift(UP * 1.5)

        # Membrane
        membrane = Line(LEFT * 2.5, RIGHT * 2.5, color=ONIColors.BIOLOGY, stroke_width=6)

        # Labels
        receptor_label = Text("NMDA Receptor", font_size=12, color=ONIColors.TEXT_SECONDARY)
        receptor_label.next_to(receptor_body, RIGHT, buff=0.3)

        nt_label = Text("Glutamate", font_size=10, color=ONIColors.DOPAMINE)
        nt_label.next_to(nt_molecule, UP, buff=0.1)

        viz.add(membrane, receptor_body, pocket, nt_molecule, receptor_label, nt_label)
        return viz

    def create_ion_channel_viz(self, level: dict) -> VGroup:
        """Visualize ion channel structure."""
        viz = VGroup()

        # Channel protein (cross-section)
        channel_left = VGroup(
            Rectangle(width=0.4, height=2, fill_color=ONIColors.SCALE_MOLECULAR, fill_opacity=0.8),
        ).shift(LEFT * 0.4)

        channel_right = VGroup(
            Rectangle(width=0.4, height=2, fill_color=ONIColors.SCALE_MOLECULAR, fill_opacity=0.8),
        ).shift(RIGHT * 0.4)

        # Gate
        gate = Line(
            LEFT * 0.2 + DOWN * 0.3,
            RIGHT * 0.2 + DOWN * 0.3,
            color=ONIColors.ACTIVE_HIGH,
            stroke_width=6
        )

        # Selectivity filter
        sf = VGroup(
            Line(LEFT * 0.15, RIGHT * 0.15, color=ONIColors.ACETYLCHOLINE, stroke_width=4),
            Text("SF", font_size=8, color=ONIColors.TEXT_PRIMARY)
        )
        sf[1].next_to(sf[0], RIGHT, buff=0.1)
        sf.shift(UP * 0.3)

        # Ions
        ions = VGroup()
        ion_positions = [UP * 1.2, UP * 0.6, DOWN * 0.8, DOWN * 1.3]
        for i, pos in enumerate(ion_positions):
            ion = Circle(radius=0.1, color=ONIColors.ACTIVE_MED, fill_opacity=1)
            ion.move_to(pos)
            ion_label = Text("Na+", font_size=6, color=ONIColors.TEXT_PRIMARY)
            ion_label.move_to(ion)
            ions.add(VGroup(ion, ion_label))

        # Membrane lipid bilayer
        membrane_top = Rectangle(width=3, height=0.2, fill_color=ONIColors.BIOLOGY, fill_opacity=0.5)
        membrane_top.shift(UP * 1)
        membrane_bot = Rectangle(width=3, height=0.2, fill_color=ONIColors.BIOLOGY, fill_opacity=0.5)
        membrane_bot.shift(DOWN * 1)

        # Labels
        channel_label = Text("Na+ Channel", font_size=12, color=ONIColors.TEXT_SECONDARY)
        channel_label.to_edge(UP, buff=0.5)

        viz.add(membrane_top, membrane_bot, channel_left, channel_right, gate, sf, ions, channel_label)
        return viz

    def create_molecular_viz(self, level: dict) -> VGroup:
        """Visualize molecular dynamics (quantum scale)."""
        viz = VGroup()

        # Enzyme active site (stylized)
        enzyme = VGroup()

        # Protein backbone
        backbone = VGroup()
        for i in range(8):
            angle = i * PI / 4
            r = 1.5
            segment = Arc(
                radius=0.3,
                start_angle=angle,
                angle=PI/4,
                color=ONIColors.SCALE_QUANTUM,
                stroke_width=4
            ).shift(r * np.array([np.cos(angle), np.sin(angle), 0]) * 0.5)
            backbone.add(segment)

        # Active site (central)
        active_site = Circle(radius=0.4, color=ONIColors.ACTIVE_HIGH, fill_opacity=0.3, stroke_width=3)

        # Cofactor (Fe2+)
        cofactor = VGroup(
            Circle(radius=0.15, color=ONIColors.GATEWAY, fill_opacity=1),
            Text("Fe2+", font_size=8, color=ONIColors.TEXT_PRIMARY)
        )
        cofactor[1].next_to(cofactor[0], UP, buff=0.05)

        # Electron cloud (stylized)
        electron_cloud = VGroup()
        for _ in range(20):
            angle = np.random.uniform(0, 2*PI)
            r = np.random.uniform(0.5, 1.2)
            electron = Dot(
                point=r * np.array([np.cos(angle), np.sin(angle), 0]),
                radius=0.02,
                color=ONIColors.SILICON,
                fill_opacity=0.5
            )
            electron_cloud.add(electron)

        enzyme.add(backbone, electron_cloud, active_site, cofactor)

        # Labels
        title = Text("Tyrosine Hydroxylase Active Site", font_size=12, color=ONIColors.TEXT_SECONDARY)
        title.to_edge(UP, buff=0.5)

        timescale_note = Text("Events here: femtoseconds (10^-15 s)", font_size=10, color=ONIColors.TEXT_MUTED)
        timescale_note.to_edge(DOWN, buff=0.5)

        viz.add(enzyme, title, timescale_note)
        return viz

    def create_placeholder_viz(self, level: dict) -> VGroup:
        """Placeholder visualization."""
        return VGroup(
            Text(level["name"], font_size=24, color=level["color"]),
            Text("Visualization placeholder", font_size=14, color=ONIColors.TEXT_MUTED)
        ).arrange(DOWN)

    def animate_activity(self, viz: VGroup, level: dict, duration: float = 2):
        """Animate 'live' neural activity."""
        # Simple pulsing animation to simulate activity
        self.play(
            viz.animate.scale(1.02),
            rate_func=there_and_back,
            run_time=duration/3
        )
        self.play(
            viz.animate.scale(0.98),
            rate_func=there_and_back,
            run_time=duration/3
        )
        self.play(
            viz.animate.scale(1.01),
            rate_func=there_and_back,
            run_time=duration/3
        )

    def show_summary(self):
        """Show final summary slide."""
        self.clear()

        title = Text(
            "Neural processing spans 15+ orders of magnitude",
            font_size=28,
            color=ONIColors.TEXT_PRIMARY
        ).to_edge(UP, buff=0.5)

        # Scale comparison
        scale_comparison = VGroup(
            Text("Spatial: cm → Angstrom (10^8 range)", font_size=18, color=ONIColors.SCALE_MACRO),
            Text("Temporal: seconds → femtoseconds (10^15 range)", font_size=18, color=ONIColors.GATEWAY),
        ).arrange(DOWN, buff=0.3)
        scale_comparison.move_to(ORIGIN)

        # BCI limitation note
        limitation = Text(
            "Current BCIs access only the millisecond/micrometer range",
            font_size=16,
            color=ONIColors.TEXT_MUTED
        ).to_edge(DOWN, buff=1)

        # ONI Framework badge
        oni_badge = VGroup(
            Text("ONI Framework", font_size=20, color=ONIColors.PRIMARY),
            Text("L8: The boundary between silicon and biology", font_size=14, color=ONIColors.GATEWAY)
        ).arrange(DOWN, buff=0.1)
        oni_badge.to_edge(DOWN, buff=0.3)

        self.play(Write(title))
        self.play(FadeIn(scale_comparison))
        self.play(Write(limitation))
        self.play(FadeIn(oni_badge))
        self.wait(3)


# Quick test scene
class TestZoomLevel(Scene):
    """Test individual zoom levels."""

    def construct(self):
        self.camera.background_color = ONIColors.BG_DARK

        # Test neuron visualization
        with open(SCALES_PATH) as f:
            data = json.load(f)

        level = data["zoom_levels"][3]  # Single neuron

        title = Text(f"Test: {level['name']}", font_size=24, color=ONIColors.TEXT_PRIMARY)
        title.to_edge(UP)

        self.add(title)

        # Create viz manually (copy from main class)
        viz = self.create_neuron_test()
        self.add(viz)
        self.wait(2)

    def create_neuron_test(self):
        """Test neuron visualization."""
        viz = VGroup()

        soma = Circle(radius=0.5, color=ONIColors.SCALE_NEURON, fill_opacity=0.8)

        dendrites = VGroup()
        for angle in np.linspace(2*PI/3, 4*PI/3, 5):
            start = soma.get_center() + 0.5 * np.array([np.cos(angle), np.sin(angle), 0])
            end = start + 0.8 * np.array([np.cos(angle), np.sin(angle), 0])
            dendrite = Line(start, end, color=ONIColors.BIOLOGY, stroke_width=3)
            dendrites.add(dendrite)

        axon = Line(
            soma.get_center() + RIGHT * 0.5,
            soma.get_center() + RIGHT * 2.5,
            color=ONIColors.GATEWAY,
            stroke_width=4
        )

        viz.add(dendrites, soma, axon)
        return viz


if __name__ == "__main__":
    # Render instructions
    print("To render the full animation:")
    print("  manim -pqh bci_zoom_animation.py BCIZoomAnimation")
    print("")
    print("For quick preview:")
    print("  manim -pql bci_zoom_animation.py BCIZoomAnimation")
    print("")
    print("To test a single level:")
    print("  manim -pql bci_zoom_animation.py TestZoomLevel")
