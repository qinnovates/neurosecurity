#!/usr/bin/env python3
"""
LearnViz Web UI - Refined Educational Visualization Interface

A polished, local-first web interface for generating educational visualizations.
Part of ONI Academy - the adaptive learning platform.

Run with: streamlit run ui.py
Or: python learnviz.py --ui
"""

import streamlit as st
import os
import sys
import json
import tempfile
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from analyzer import analyze, Engine, ConceptType
from generators.manim_gen import generate_manim_code, TEMPLATES
from generators.narration import ScriptGenerator, TTSGenerator
from generators.ollama_gen import (
    check_ollama_available, get_available_models, generate_with_ollama,
    OllamaConfig, fix_common_errors
)


# Page config
st.set_page_config(
    page_title="LearnViz | ONI Academy",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for refined look
st.markdown("""
<style>
    /* Main theme */
    :root {
        --primary: #6366f1;
        --primary-dark: #4f46e5;
        --secondary: #10b981;
        --bg-dark: #1e1e2e;
        --bg-card: #2a2a3e;
        --text-primary: #f8fafc;
        --text-secondary: #94a3b8;
    }

    /* Header styling */
    .main-header {
        font-size: 2.8rem;
        font-weight: 700;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0;
        letter-spacing: -0.02em;
    }

    .sub-header {
        color: #94a3b8;
        font-size: 1.1rem;
        margin-top: 0.25rem;
        margin-bottom: 1.5rem;
    }

    /* Card styling */
    .info-card {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 12px;
        padding: 1.25rem;
        margin: 0.75rem 0;
    }

    .template-card {
        background: rgba(30, 30, 46, 0.5);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin: 0.5rem 0;
        transition: all 0.2s ease;
    }

    .template-card:hover {
        border-color: rgba(99, 102, 241, 0.4);
        background: rgba(99, 102, 241, 0.1);
    }

    /* Status badges */
    .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .badge-success {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-warning {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .badge-info {
        background: rgba(99, 102, 241, 0.2);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.3);
    }

    /* Feature list */
    .feature-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        color: #e2e8f0;
    }

    .feature-icon {
        font-size: 1.25rem;
    }

    /* Sidebar refinements */
    .sidebar-section {
        background: rgba(30, 30, 46, 0.3);
        border-radius: 8px;
        padding: 1rem;
        margin: 0.5rem 0;
    }

    /* Button styling */
    .stButton > button {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .stButton > button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    /* Video container */
    .video-container {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    /* Footer */
    .footer {
        text-align: center;
        padding: 2rem 0;
        color: #64748b;
        font-size: 0.875rem;
        border-top: 1px solid rgba(148, 163, 184, 0.1);
        margin-top: 2rem;
    }

    .footer a {
        color: #818cf8;
        text-decoration: none;
    }

    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}

    /* Metric cards */
    .metric-card {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
    }

    .metric-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #f8fafc;
    }

    .metric-label {
        font-size: 0.75rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
</style>
""", unsafe_allow_html=True)


def check_dependencies():
    """Check which dependencies are available."""
    deps = {}

    # Check Manim
    try:
        import manim
        deps['manim'] = True
    except ImportError:
        deps['manim'] = False

    # Check ffmpeg
    import subprocess
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        deps['ffmpeg'] = True
    except:
        deps['ffmpeg'] = False

    # Check TTS engines
    try:
        import edge_tts
        deps['edge_tts'] = True
    except ImportError:
        deps['edge_tts'] = False

    try:
        import gtts
        deps['gtts'] = True
    except ImportError:
        deps['gtts'] = False

    try:
        import pyttsx3
        deps['pyttsx3'] = True
    except ImportError:
        deps['pyttsx3'] = False

    # Check Ollama
    deps['ollama'] = check_ollama_available()

    return deps


def render_video(code_path: str, quality: str = "l"):
    """Render Manim code to video."""
    import subprocess
    import re

    with open(code_path, "r") as f:
        content = f.read()

    match = re.search(r"class (\w+)\(Scene\)", content)
    if not match:
        return None, "No Scene class found"

    scene_name = match.group(1)
    cmd = f"manim -pql {code_path} {scene_name}"

    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=str(Path(code_path).parent))

    if result.returncode != 0:
        return None, result.stderr

    # Find output file
    code_stem = Path(code_path).stem
    media_dir = Path(code_path).parent / "media" / "videos" / code_stem / "480p15"

    if media_dir.exists():
        files = list(media_dir.glob("*.mp4"))
        if files:
            return str(files[0]), None

    return None, "Output file not found"


def combine_audio_video(video_path: str, audio_path: str):
    """Combine video and audio."""
    import subprocess

    output_path = video_path.replace(".mp4", "_narrated.mp4")

    # Get durations
    def get_duration(path):
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True
        )
        try:
            return float(result.stdout.strip())
        except:
            return 0

    video_dur = get_duration(video_path)
    audio_dur = get_duration(audio_path)
    extra = max(0, audio_dur - video_dur + 1)

    if extra > 0:
        cmd = [
            "ffmpeg", "-y", "-i", video_path, "-i", audio_path,
            "-filter_complex", f"[0:v]tpad=stop_mode=clone:stop_duration={extra}[v]",
            "-map", "[v]", "-map", "1:a",
            "-c:v", "libx264", "-c:a", "aac", "-shortest", output_path
        ]
    else:
        cmd = [
            "ffmpeg", "-y", "-i", video_path, "-i", audio_path,
            "-c:v", "copy", "-c:a", "aac",
            "-map", "0:v:0", "-map", "1:a:0", "-shortest", output_path
        ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    return output_path if result.returncode == 0 else None


# Template descriptions for UI
TEMPLATE_INFO = {
    "binary_search": {
        "name": "Binary Search",
        "icon": "🔍",
        "category": "Algorithms",
        "description": "Step-by-step search with pointer animations"
    },
    "sorting": {
        "name": "Sorting Algorithms",
        "icon": "📊",
        "category": "Algorithms",
        "description": "Bubble, selection, insertion sort visualized"
    },
    "tree_traversal": {
        "name": "Tree Traversal",
        "icon": "🌳",
        "category": "Data Structures",
        "description": "Inorder, preorder, postorder traversal"
    },
    "pythagorean": {
        "name": "Pythagorean Theorem",
        "icon": "📐",
        "category": "Mathematics",
        "description": "Visual proof with animated squares"
    },
    "action_potential": {
        "name": "Action Potential",
        "icon": "⚡",
        "category": "Neuroscience",
        "description": "Neuron depolarization and ion channels"
    },
    "synapse": {
        "name": "Synaptic Transmission",
        "icon": "🧬",
        "category": "Neuroscience",
        "description": "Vesicle release and receptor binding"
    },
    "motor_cortex_bci": {
        "name": "Motor Cortex & BCI",
        "icon": "🧠",
        "category": "Neuroscience",
        "description": "Electrode arrays and neural decoding"
    },
    "neurotransmitter": {
        "name": "Neurotransmitter Systems",
        "icon": "💊",
        "category": "Neuroscience",
        "description": "Dopamine, serotonin pathways"
    },
}


def main():
    # Check dependencies once
    deps = check_dependencies()

    # Header
    col_logo, col_title = st.columns([1, 5])
    with col_logo:
        st.markdown("# 🧠")
    with col_title:
        st.markdown('<p class="main-header">LearnViz</p>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">AI-Powered Educational Visualizations • Part of ONI Academy</p>', unsafe_allow_html=True)

    # Sidebar
    with st.sidebar:
        st.markdown("### ⚙️ Settings")

        # System Status
        with st.expander("System Status", expanded=False):
            status_cols = st.columns(2)
            for i, (dep, available) in enumerate(deps.items()):
                col = status_cols[i % 2]
                icon = "✅" if available else "❌"
                col.markdown(f"{icon} **{dep}**")

            if not deps['manim']:
                st.error("Manim required: `pip install manim`")
            if not deps['ffmpeg']:
                st.warning("ffmpeg needed for audio: `brew install ffmpeg`")

        st.markdown("---")

        # Generation Options
        st.markdown("### 🎬 Video Options")

        quality = st.select_slider(
            "Quality",
            options=["l", "m", "h"],
            value="l",
            format_func=lambda x: {"l": "Fast (480p)", "m": "Medium (720p)", "h": "High (1080p)"}[x]
        )

        add_narration = st.toggle("🔊 Voice Narration", value=True)

        if add_narration:
            tts_options = []
            tts_labels = {}
            if deps['edge_tts']:
                tts_options.append("edge-tts")
                tts_labels["edge-tts"] = "Edge TTS (Best)"
            if deps['gtts']:
                tts_options.append("gtts")
                tts_labels["gtts"] = "Google TTS"
            if deps['pyttsx3']:
                tts_options.append("pyttsx3")
                tts_labels["pyttsx3"] = "System Voice"

            if tts_options:
                tts_engine = st.selectbox(
                    "Voice Engine",
                    options=tts_options,
                    format_func=lambda x: tts_labels.get(x, x)
                )
            else:
                st.warning("Install TTS: `pip install edge-tts`")
                tts_engine = None
        else:
            tts_engine = None

        st.markdown("---")

        # AI Generation
        st.markdown("### 🤖 AI Generation")

        if deps['ollama']:
            use_ollama = st.toggle("Use Ollama for custom concepts", value=False)
            if use_ollama:
                ollama_models = get_available_models()
                if ollama_models:
                    ollama_model = st.selectbox(
                        "Model",
                        options=ollama_models,
                        help="Choose LLM for code generation"
                    )
                else:
                    ollama_model = "llama3.2"
                    st.caption("Run: `ollama pull llama3.2`")
        else:
            use_ollama = False
            ollama_model = None
            st.info("**Ollama** enables custom AI generation")
            st.caption("[Install Ollama →](https://ollama.ai)")

        st.markdown("---")

        # Quick Stats
        st.markdown("### 📊 Quick Stats")
        stat_cols = st.columns(2)
        stat_cols[0].metric("Templates", len(TEMPLATE_INFO))
        stat_cols[1].metric("Engines", "4")

    # Main content area
    tab1, tab2, tab3 = st.tabs(["✨ Create", "📚 Templates", "ℹ️ About"])

    with tab1:
        # Concept input
        st.markdown("### What would you like to visualize?")

        concept = st.text_area(
            "Concept",
            placeholder="Describe a concept to visualize...\n\nExamples:\n• How does binary search find an element?\n• Explain synaptic transmission between neurons\n• Show me how action potentials propagate\n• Visualize the Pythagorean theorem proof",
            height=140,
            label_visibility="collapsed"
        )

        # Quick examples as chips
        st.markdown("**Quick examples:**")
        example_cols = st.columns(4)
        examples = [
            ("🔍", "Binary search algorithm"),
            ("⚡", "Action potential propagation"),
            ("🧬", "Synaptic transmission"),
            ("📐", "Pythagorean theorem"),
        ]

        for i, (icon, ex) in enumerate(examples):
            if example_cols[i].button(f"{icon} {ex.split()[0]}", use_container_width=True, key=f"ex_{i}"):
                st.session_state['concept'] = ex
                st.rerun()

        # Use session state for concept
        if 'concept' in st.session_state and not concept:
            concept = st.session_state['concept']

        # Analysis panel
        if concept:
            st.markdown("---")

            plan = analyze(concept)

            # Analysis results in cards
            col1, col2, col3, col4 = st.columns(4)

            with col1:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-value">{plan.concept_type.value.title()}</div>
                    <div class="metric-label">Type</div>
                </div>
                """, unsafe_allow_html=True)

            with col2:
                template_display = plan.template.replace("_", " ").title() if plan.template else "Generic"
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-value">{template_display}</div>
                    <div class="metric-label">Template</div>
                </div>
                """, unsafe_allow_html=True)

            with col3:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-value">{plan.complexity.title()}</div>
                    <div class="metric-label">Complexity</div>
                </div>
                """, unsafe_allow_html=True)

            with col4:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-value">~{int(plan.total_duration)}s</div>
                    <div class="metric-label">Duration</div>
                </div>
                """, unsafe_allow_html=True)

            # Template match indicator
            if plan.template and plan.template in TEMPLATES:
                st.success(f"✨ **Template matched:** {plan.template} — High-quality visualization available!")
            elif use_ollama:
                st.info(f"🤖 **AI Generation:** Ollama will create a custom visualization")
            else:
                st.warning(f"📝 **Generic visualization** — Enable Ollama for custom AI generation")

        st.markdown("---")

        # Generate button
        generate_disabled = not concept or not deps['manim']

        if st.button(
            "🎬 Generate Visualization",
            type="primary",
            use_container_width=True,
            disabled=generate_disabled
        ):
            if not deps['manim']:
                st.error("**Manim required.** Install with: `pip install manim`")
            else:
                # Create temp directory
                with tempfile.TemporaryDirectory() as tmpdir:
                    tmpdir = Path(tmpdir)

                    # Progress container
                    progress_container = st.container()
                    with progress_container:
                        progress = st.progress(0, text="🔍 Analyzing concept...")

                    # Analyze
                    plan = analyze(concept)
                    progress.progress(10, text="💻 Generating visualization code...")

                    # Generate code
                    if use_ollama and (plan.template is None or plan.template not in TEMPLATES):
                        progress.progress(15, text=f"🤖 AI generating with {ollama_model}...")
                        config = OllamaConfig(model=ollama_model)
                        code = generate_with_ollama(concept, plan.to_dict(), config)
                        if code:
                            code = fix_common_errors(code)
                        else:
                            st.warning("AI generation failed, using fallback")
                            code = generate_manim_code(plan.to_dict(), template_name=plan.template, params={})
                    else:
                        code = generate_manim_code(plan.to_dict(), template_name=plan.template, params={})

                    code_path = tmpdir / "scene.py"
                    with open(code_path, "w") as f:
                        f.write(code)

                    progress.progress(25, text="🎥 Rendering video...")

                    # Render
                    video_path, error = render_video(str(code_path), quality)

                    if error:
                        st.error(f"**Render failed:** {error}")
                        with st.expander("View Generated Code"):
                            st.code(code, language="python")
                    else:
                        progress.progress(60, text="✅ Video rendered!")

                        # Generate narration
                        audio_path = None
                        if add_narration and tts_engine and plan.template:
                            progress.progress(70, text="🔊 Generating narration...")
                            try:
                                script = ScriptGenerator.generate_script(plan.template)
                                tts = TTSGenerator(engine=tts_engine, output_dir=str(tmpdir))
                                audio_path = tts.generate(script, filename="narration.mp3")

                                if audio_path and deps['ffmpeg']:
                                    progress.progress(85, text="🔗 Combining video & audio...")
                                    combined = combine_audio_video(video_path, str(audio_path))
                                    if combined:
                                        video_path = combined
                            except Exception as e:
                                st.warning(f"Narration skipped: {e}")

                        progress.progress(100, text="🎉 Complete!")

                        # Clear progress after short delay
                        import time
                        time.sleep(0.5)
                        progress_container.empty()

                        # Display results
                        st.markdown("### 🎬 Your Visualization")

                        # Video player
                        with open(video_path, "rb") as f:
                            video_bytes = f.read()

                        st.video(video_bytes)

                        # Download buttons
                        st.markdown("### 📥 Downloads")
                        dl_cols = st.columns(3)

                        with dl_cols[0]:
                            st.download_button(
                                "📹 Video (MP4)",
                                video_bytes,
                                file_name=f"learnviz_{plan.template or 'custom'}.mp4",
                                mime="video/mp4",
                                use_container_width=True
                            )

                        with dl_cols[1]:
                            st.download_button(
                                "🐍 Code (Python)",
                                code,
                                file_name=f"learnviz_{plan.template or 'custom'}.py",
                                mime="text/x-python",
                                use_container_width=True
                            )

                        if audio_path and Path(audio_path).exists():
                            with dl_cols[2]:
                                with open(audio_path, "rb") as f:
                                    audio_bytes = f.read()
                                st.download_button(
                                    "🔊 Audio (MP3)",
                                    audio_bytes,
                                    file_name=f"learnviz_{plan.template or 'custom'}_narration.mp3",
                                    mime="audio/mpeg",
                                    use_container_width=True
                                )

                        # Code expander
                        with st.expander("📝 View Generated Code"):
                            st.code(code, language="python")

    with tab2:
        st.markdown("### 📚 Available Templates")
        st.markdown("These concepts have high-quality, tested visualizations:")

        # Group templates by category
        categories = {}
        for key, info in TEMPLATE_INFO.items():
            cat = info["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append((key, info))

        for category, templates in categories.items():
            st.markdown(f"#### {category}")

            cols = st.columns(2)
            for i, (key, info) in enumerate(templates):
                with cols[i % 2]:
                    with st.container():
                        st.markdown(f"""
                        <div class="template-card">
                            <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">{info['icon']}</div>
                            <div style="font-weight: 600; color: #f8fafc;">{info['name']}</div>
                            <div style="font-size: 0.875rem; color: #94a3b8;">{info['description']}</div>
                        </div>
                        """, unsafe_allow_html=True)

            st.markdown("")

    with tab3:
        st.markdown("### About LearnViz")

        st.markdown("""
        **LearnViz** transforms concepts into educational visualizations using AI and animation.

        #### How It Works

        1. **Analyze** — Pattern matching classifies your concept (no AI needed)
        2. **Generate** — Templates or Ollama LLM creates Manim animation code
        3. **Render** — Manim renders beautiful mathematical animations
        4. **Narrate** — TTS adds voice explanation
        5. **Combine** — FFmpeg merges video + audio

        #### 100% Local

        Everything runs on your machine:
        - ✅ No cloud AI required (Ollama is local)
        - ✅ No data sent to servers
        - ✅ Works offline (except edge-tts)
        - ✅ Your visualizations stay private

        #### Part of ONI Academy

        LearnViz is the visualization engine for [ONI Academy](https://github.com/qinnovates/mindloft) —
        an adaptive learning platform for neurosecurity education.
        """)

        st.markdown("---")

        st.markdown("""
        #### Requirements

        ```bash
        pip install manim streamlit edge-tts
        brew install ffmpeg  # macOS

        # Optional: AI generation
        # Install from https://ollama.ai
        ollama pull llama3.2
        ```
        """)

    # Footer
    st.markdown("""
    <div class="footer">
        <p><strong>LearnViz</strong> • Part of <a href="https://github.com/qinnovates/mindloft">ONI Academy</a></p>
        <p>🔒 100% Local — Your data never leaves your machine</p>
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
