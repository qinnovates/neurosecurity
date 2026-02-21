"""
BCI Neuron Animation: Shows how electrodes detect and stimulate neural activity
================================================================================
Renders actual animation showing:
1. Electrode approaching neuron
2. Action potential propagation (wave of depolarization)
3. Electrode detecting the signal
4. Synaptic transmission with neurotransmitter release

Run with: manim -pql neuron_bci_animation.py BCINeuronScene
"""

from manim import *
import numpy as np

# Color scheme
ELECTRODE_COLOR = "#4A90D9"
NEURON_COLOR = "#FFD700"
AXON_COLOR = "#FFA500"
DEPOLARIZED_COLOR = "#FF4444"
RESTING_COLOR = "#44AA44"
SYNAPSE_COLOR = "#9D4EDD"
NT_COLOR = "#FF6B35"

class BCINeuronScene(Scene):
    def construct(self):
        self.camera.background_color = "#1a1a2e"

        # Title
        title = Text("How BCIs Detect Neural Signals", font_size=36, color=WHITE)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))

        # Create neuron
        self.create_neuron_with_electrode()

        # Show action potential
        self.animate_action_potential()

        # Show electrode detection
        self.show_electrode_detection()

        # Transition to synapse
        self.show_synaptic_transmission()

        # Final message
        self.show_bci_limitation()

        self.wait(2)

    def create_neuron_with_electrode(self):
        """Create a neuron cell body, axon, and electrode"""

        # Cell body (soma)
        self.soma = Circle(radius=0.8, color=NEURON_COLOR, fill_opacity=0.8)
        self.soma.shift(LEFT * 4)

        # Nucleus
        nucleus = Circle(radius=0.3, color=ORANGE, fill_opacity=0.6)
        nucleus.move_to(self.soma.get_center())

        # Axon (long line from soma)
        self.axon = Line(
            start=self.soma.get_right(),
            end=RIGHT * 3,
            color=AXON_COLOR,
            stroke_width=8
        )

        # Axon segments for animation
        self.axon_segments = VGroup()
        num_segments = 20
        for i in range(num_segments):
            t = i / num_segments
            start = self.axon.point_from_proportion(t)
            end = self.axon.point_from_proportion((i + 1) / num_segments)
            segment = Line(start, end, color=RESTING_COLOR, stroke_width=8)
            self.axon_segments.add(segment)

        # Electrode (above the axon)
        self.electrode = VGroup()
        electrode_tip = Polygon(
            [0, 0, 0], [-0.15, 0.4, 0], [0.15, 0.4, 0],
            color=ELECTRODE_COLOR, fill_opacity=0.9
        )
        electrode_body = Rectangle(
            width=0.2, height=1.5, color=ELECTRODE_COLOR, fill_opacity=0.7
        )
        electrode_body.next_to(electrode_tip, UP, buff=0)
        self.electrode.add(electrode_tip, electrode_body)
        self.electrode.move_to(UP * 2 + LEFT * 1)

        # Electrode label
        electrode_label = Text("BCI Electrode", font_size=18, color=ELECTRODE_COLOR)
        electrode_label.next_to(self.electrode, UP, buff=0.2)

        # Soma label
        soma_label = Text("Neuron\n(Soma)", font_size=16, color=NEURON_COLOR)
        soma_label.next_to(self.soma, DOWN, buff=0.3)

        # Axon label
        axon_label = Text("Axon", font_size=16, color=AXON_COLOR)
        axon_label.next_to(self.axon, DOWN, buff=0.3)

        # Animate creation
        self.play(
            Create(self.soma),
            Create(nucleus),
            run_time=1
        )
        self.play(
            Create(self.axon_segments),
            Write(soma_label),
            Write(axon_label),
            run_time=1.5
        )
        self.play(
            FadeIn(self.electrode, shift=DOWN),
            Write(electrode_label),
            run_time=1
        )

        # Move electrode closer to axon
        self.play(
            self.electrode.animate.shift(DOWN * 1.2),
            electrode_label.animate.shift(DOWN * 1.2),
            run_time=1.5
        )

        # Store references
        self.electrode_label = electrode_label
        self.nucleus = nucleus

    def animate_action_potential(self):
        """Show action potential wave traveling down axon"""

        # Explanation text
        ap_text = Text(
            "Action Potential: Wave of electrical depolarization",
            font_size=20, color=WHITE
        )
        ap_text.to_edge(DOWN, buff=0.5)
        self.play(Write(ap_text))

        # Flash the soma (neuron fires)
        self.play(
            self.soma.animate.set_fill(DEPOLARIZED_COLOR, opacity=1),
            Flash(self.soma, color=YELLOW, line_length=0.3),
            run_time=0.5
        )
        self.play(
            self.soma.animate.set_fill(NEURON_COLOR, opacity=0.8),
            run_time=0.3
        )

        # Propagate action potential down axon
        for i, segment in enumerate(self.axon_segments):
            # Depolarize segment (turn red)
            self.play(
                segment.animate.set_color(DEPOLARIZED_COLOR),
                run_time=0.08
            )
            # Repolarize after delay (turn back to green)
            if i > 2:
                self.play(
                    self.axon_segments[i-3].animate.set_color(RESTING_COLOR),
                    run_time=0.01
                )

        # Clean up remaining segments
        self.play(
            *[seg.animate.set_color(RESTING_COLOR) for seg in self.axon_segments[-3:]],
            run_time=0.3
        )

        self.play(FadeOut(ap_text))

    def show_electrode_detection(self):
        """Show electrode detecting the signal"""

        # Detection text
        detect_text = Text(
            "Electrode detects voltage change (~100 μV)",
            font_size=20, color=ELECTRODE_COLOR
        )
        detect_text.to_edge(DOWN, buff=0.5)
        self.play(Write(detect_text))

        # Fire another action potential
        self.play(
            self.soma.animate.set_fill(DEPOLARIZED_COLOR, opacity=1),
            Flash(self.soma, color=YELLOW, line_length=0.3),
            run_time=0.3
        )
        self.play(
            self.soma.animate.set_fill(NEURON_COLOR, opacity=0.8),
            run_time=0.2
        )

        # Propagate with electrode detection
        for i, segment in enumerate(self.axon_segments):
            anims = [segment.animate.set_color(DEPOLARIZED_COLOR)]

            # When AP passes under electrode, show detection
            if 7 <= i <= 10:
                # Create detection pulse
                pulse = Circle(radius=0.1, color=YELLOW, fill_opacity=0.8)
                pulse.move_to(self.electrode.get_bottom())
                anims.extend([
                    GrowFromCenter(pulse),
                    self.electrode.animate.set_color(YELLOW)
                ])
                self.play(*anims, run_time=0.1)
                self.play(
                    FadeOut(pulse),
                    self.electrode.animate.set_color(ELECTRODE_COLOR),
                    run_time=0.05
                )
            else:
                self.play(*anims, run_time=0.05)

            if i > 2:
                self.axon_segments[i-3].set_color(RESTING_COLOR)

        # Clean up
        self.play(
            *[seg.animate.set_color(RESTING_COLOR) for seg in self.axon_segments[-3:]],
            FadeOut(detect_text),
            run_time=0.3
        )

    def show_synaptic_transmission(self):
        """Show synaptic transmission at axon terminal"""

        # Transition text
        trans_text = Text(
            "Signal reaches synapse → Neurotransmitter release",
            font_size=20, color=SYNAPSE_COLOR
        )
        trans_text.to_edge(DOWN, buff=0.5)
        self.play(Write(trans_text))

        # Create synaptic terminal
        terminal = RoundedRectangle(
            width=0.8, height=0.6, corner_radius=0.2,
            color=SYNAPSE_COLOR, fill_opacity=0.7
        )
        terminal.next_to(self.axon_segments[-1], RIGHT, buff=0)

        # Vesicles inside terminal
        vesicles = VGroup()
        for _ in range(6):
            v = Circle(radius=0.08, color=NT_COLOR, fill_opacity=0.8)
            v.move_to(terminal.get_center() + np.random.uniform(-0.2, 0.2, 3))
            v.shift(OUT * 0)  # Keep in 2D
            vesicles.add(v)

        # Synaptic cleft
        cleft = Rectangle(width=0.8, height=0.15, color=WHITE, fill_opacity=0.3)
        cleft.next_to(terminal, RIGHT, buff=0.05)

        # Post-synaptic neuron
        post_neuron = Circle(radius=0.5, color=GREEN, fill_opacity=0.6)
        post_neuron.next_to(cleft, RIGHT, buff=0.05)

        post_label = Text("Post-synaptic\nNeuron", font_size=14, color=GREEN)
        post_label.next_to(post_neuron, DOWN, buff=0.2)

        self.play(
            Create(terminal),
            Create(vesicles),
            Create(cleft),
            Create(post_neuron),
            Write(post_label),
            run_time=1.5
        )

        # Fire action potential and release neurotransmitters
        self.play(
            self.soma.animate.set_fill(DEPOLARIZED_COLOR, opacity=1),
            run_time=0.2
        )
        self.play(
            self.soma.animate.set_fill(NEURON_COLOR, opacity=0.8),
            run_time=0.1
        )

        # Quick propagation
        for seg in self.axon_segments:
            seg.set_color(DEPOLARIZED_COLOR)
            self.wait(0.02)

        # Terminal activation
        self.play(
            terminal.animate.set_fill(YELLOW, opacity=0.9),
            run_time=0.3
        )

        # Release neurotransmitters (vesicles move to cleft)
        nt_dots = VGroup()
        for v in vesicles[:3]:
            dot = Circle(radius=0.05, color=NT_COLOR, fill_opacity=1)
            dot.move_to(v.get_center())
            nt_dots.add(dot)

        self.play(
            *[dot.animate.move_to(post_neuron.get_left() + LEFT * 0.1) for dot in nt_dots],
            run_time=0.8
        )

        # Post-synaptic activation
        self.play(
            post_neuron.animate.set_fill(YELLOW, opacity=0.8),
            FadeOut(nt_dots),
            run_time=0.5
        )
        self.play(
            post_neuron.animate.set_fill(GREEN, opacity=0.6),
            terminal.animate.set_fill(SYNAPSE_COLOR, opacity=0.7),
            *[seg.animate.set_color(RESTING_COLOR) for seg in self.axon_segments],
            run_time=0.5
        )

        self.play(FadeOut(trans_text))
        self.store_synapse = VGroup(terminal, vesicles, cleft, post_neuron, post_label)

    def show_bci_limitation(self):
        """Show what BCIs can and cannot do"""

        # Final explanation
        box = Rectangle(width=10, height=2.5, color=WHITE, fill_opacity=0.1)
        box.to_edge(DOWN, buff=0.3)

        can_text = Text(
            "✓ BCIs CAN detect electrical signals (action potentials)",
            font_size=18, color=GREEN
        )
        can_text.move_to(box.get_center() + UP * 0.6)

        cannot_text = Text(
            "✗ BCIs CANNOT directly control neurotransmitter release",
            font_size=18, color=RED
        )
        cannot_text.move_to(box.get_center())

        scale_text = Text(
            "Electrodes: ~5 μm  |  Synapses: ~20 nm  (250x smaller)",
            font_size=16, color=YELLOW
        )
        scale_text.move_to(box.get_center() + DOWN * 0.6)

        self.play(
            Create(box),
            Write(can_text),
            run_time=1
        )
        self.play(Write(cannot_text), run_time=1)
        self.play(Write(scale_text), run_time=1)


class ActionPotentialDetail(Scene):
    """Detailed view of action potential with voltage graph"""

    def construct(self):
        self.camera.background_color = "#1a1a2e"

        title = Text("Action Potential: The Neural Signal", font_size=32)
        title.to_edge(UP)
        self.play(Write(title))

        # Create voltage graph
        axes = Axes(
            x_range=[0, 5, 1],
            y_range=[-80, 40, 20],
            x_length=8,
            y_length=4,
            axis_config={"color": WHITE},
            x_axis_config={"numbers_to_include": [1, 2, 3, 4]},
            y_axis_config={"numbers_to_include": [-60, -40, -20, 0, 20]},
        )
        axes.shift(DOWN * 0.5)

        x_label = Text("Time (ms)", font_size=16)
        x_label.next_to(axes.x_axis, DOWN)
        y_label = Text("Membrane\nPotential (mV)", font_size=14)
        y_label.next_to(axes.y_axis, LEFT)

        self.play(Create(axes), Write(x_label), Write(y_label))

        # Action potential curve
        def ap_curve(x):
            if x < 1:
                return -70  # Resting
            elif x < 1.5:
                return -70 + 100 * (x - 1) * 2  # Rising phase
            elif x < 2:
                return 30 - 110 * (x - 1.5) * 2  # Falling phase
            elif x < 2.5:
                return -80 + 10 * (x - 2) * 2  # Hyperpolarization
            else:
                return -70  # Return to resting

        ap_graph = axes.plot(ap_curve, x_range=[0, 4.5], color=YELLOW)

        # Threshold line
        threshold = axes.plot(lambda x: -55, x_range=[0, 4.5], color=RED)
        threshold_label = Text("Threshold", font_size=14, color=RED)
        threshold_label.next_to(threshold, RIGHT)

        # Resting potential line
        resting = axes.plot(lambda x: -70, x_range=[0, 4.5], color=GREEN)
        resting_label = Text("Resting", font_size=14, color=GREEN)
        resting_label.next_to(resting, RIGHT, buff=0.1).shift(DOWN * 0.3)

        self.play(Create(threshold), Write(threshold_label))
        self.play(Create(resting), Write(resting_label))

        # Animate the action potential
        self.play(Create(ap_graph), run_time=3)

        # Phase labels
        phases = VGroup(
            Text("1. Depolarization", font_size=14, color=YELLOW),
            Text("2. Repolarization", font_size=14, color=ORANGE),
            Text("3. Hyperpolarization", font_size=14, color=BLUE),
        )
        phases.arrange(DOWN, aligned_edge=LEFT)
        phases.to_edge(RIGHT).shift(UP)

        self.play(Write(phases), run_time=2)

        # BCI detection note
        bci_note = Text(
            "BCIs detect this ~100μV change from outside the neuron",
            font_size=18, color=ELECTRODE_COLOR
        )
        bci_note.to_edge(DOWN, buff=0.3)
        self.play(Write(bci_note))

        self.wait(3)


# Run with: manim -pql neuron_bci_animation.py BCINeuronScene
# For high quality: manim -pqh neuron_bci_animation.py BCINeuronScene
