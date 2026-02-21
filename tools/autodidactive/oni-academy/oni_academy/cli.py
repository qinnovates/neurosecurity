"""
ONI Academy CLI - Command-line interface for the learning platform.

Commands:
    oni-academy list              List available learning modules
    oni-academy info <module>     Show information about a module
    oni-academy visualize <text>  Generate educational visualization
    oni-academy templates         List available visualization templates
    oni-academy ui                Launch LearnViz web interface
"""

import argparse
import sys
from pathlib import Path


def main():
    """Main entry point for oni-academy CLI."""
    parser = argparse.ArgumentParser(
        prog="oni-academy",
        description="ONI Academy - Educational platform for neurosecurity",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  oni-academy list
  oni-academy visualize "How does binary search work?" --render
  oni-academy visualize "Action potential propagation" --render --narration
  oni-academy ui

Web Tools (no installation required):
  https://qinnovates.github.io/ONI/visualizations/
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # List modules command
    list_parser = subparsers.add_parser("list", help="List available learning modules")

    # Info command
    info_parser = subparsers.add_parser("info", help="Show information about a module")
    info_parser.add_argument("module", help="Module name")

    # Templates command
    templates_parser = subparsers.add_parser("templates", help="List visualization templates")

    # Visualize command
    viz_parser = subparsers.add_parser("visualize", help="Generate educational visualization")
    viz_parser.add_argument("concept", help="Concept to visualize")
    viz_parser.add_argument("--render", action="store_true", help="Render to video")
    viz_parser.add_argument("--narration", action="store_true", help="Add voice narration")
    viz_parser.add_argument("--tts", default="edge-tts", help="TTS engine (edge-tts, gtts, pyttsx3)")
    viz_parser.add_argument("--ollama", action="store_true", help="Use Ollama for custom generation")
    viz_parser.add_argument("--output", "-o", help="Output directory")

    # UI command
    ui_parser = subparsers.add_parser("ui", help="Launch LearnViz web interface")
    ui_parser.add_argument("--port", type=int, default=8501, help="Port for UI server")

    args = parser.parse_args()

    if args.command == "list":
        from oni_academy import list_modules
        modules = list_modules()
        print("\n🧠 ONI Academy - Learning Modules")
        print("=" * 40)
        for module in modules:
            print(f"  • {module}")
        print("\nCommands:")
        print("  oni-academy info <module>    # Module details")
        print("  oni-academy templates        # Visualization templates")
        print("  oni-academy ui               # Launch web UI")

    elif args.command == "info":
        from oni_academy import get_course, get_module_concepts
        course = get_course(args.module)
        if course:
            print(f"\n📚 {course.get('title', args.module)}")
            print("=" * 40)
            print(f"Description: {course.get('description', 'No description')}")
            if course.get('modules'):
                print(f"Sections: {', '.join(course['modules'])}")

            # Show visualizable concepts
            concepts = get_module_concepts(args.module)
            if concepts:
                print(f"\nVisualization Topics:")
                for c in concepts:
                    print(f"  • {c}")
                print(f"\nTry: oni-academy visualize \"{concepts[0]}\" --render")
        else:
            print(f"Module '{args.module}' not found.")
            print("Use 'oni-academy list' to see available modules.")

    elif args.command == "templates":
        from oni_academy import list_templates, LEARNVIZ_AVAILABLE

        if not LEARNVIZ_AVAILABLE:
            print("\n⚠️  LearnViz not available.")
            print("Install dependencies: pip install manim streamlit edge-tts")
            sys.exit(1)

        templates = list_templates()
        print("\n🎬 Visualization Templates")
        print("=" * 40)

        # Group by category
        categories = {}
        for key, info in templates.items():
            cat = info["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append((key, info))

        for category, items in categories.items():
            print(f"\n{category}:")
            for key, info in items:
                print(f"  • {info['name']:25} - {info['description']}")

        print("\nUsage:")
        print("  oni-academy visualize \"binary search\" --render")

    elif args.command == "visualize":
        from oni_academy import visualize, LEARNVIZ_AVAILABLE

        if not LEARNVIZ_AVAILABLE:
            print("\n⚠️  LearnViz not available.")
            print("Install dependencies: pip install manim streamlit edge-tts")
            sys.exit(1)

        output_dir = Path(args.output) if args.output else Path.cwd() / "oni_academy_output"

        print(f"\n🎬 Generating visualization...")
        print(f"   Concept: {args.concept}")
        print(f"   Output: {output_dir}")

        result = visualize(
            concept=args.concept,
            render=args.render,
            narration=args.narration,
            tts_engine=args.tts,
            output_dir=output_dir,
            use_ollama=args.ollama
        )

        if result.success:
            print(f"\n✅ Success!")
            print(f"   Type: {result.concept_type}")
            print(f"   Template: {result.template or 'Custom'}")
            print(f"   Complexity: {result.complexity}")

            if result.code_path:
                print(f"\n📄 Code: {result.code_path}")
            if result.video_path:
                print(f"🎥 Video: {result.video_path}")
            if result.audio_path:
                print(f"🔊 Audio: {result.audio_path}")
        else:
            print(f"\n❌ Failed: {result.error}")
            sys.exit(1)

    elif args.command == "ui":
        # Find LearnViz UI
        learnviz_ui = Path(__file__).parent.parent.parent / "learnviz" / "ui.py"

        if not learnviz_ui.exists():
            print("⚠️  LearnViz UI not found.")
            print("\nTo install LearnViz:")
            print("  cd autodidactive/learnviz")
            print("  pip install -r requirements.txt")
            sys.exit(1)

        try:
            import subprocess
            print("\n🧠 Launching ONI Academy / LearnViz...")
            print(f"   UI will open at http://localhost:{args.port}")
            print("   Press Ctrl+C to stop\n")

            subprocess.run(
                [sys.executable, "-m", "streamlit", "run", str(learnviz_ui),
                 "--server.port", str(args.port),
                 "--server.headless", "false",
                 "--browser.gatherUsageStats", "false"],
                cwd=str(learnviz_ui.parent)
            )
        except KeyboardInterrupt:
            print("\n\nUI stopped.")
        except ImportError:
            print("Streamlit not installed. Install with: pip install streamlit")
            sys.exit(1)

    else:
        parser.print_help()
        print("\n" + "=" * 50)
        print("🧠 ONI Academy - Neurosecurity Education Platform")
        print("=" * 50)
        print("\nQuick Start:")
        print("  oni-academy list              # See modules")
        print("  oni-academy templates         # See visualizations")
        print("  oni-academy ui                # Launch web UI")
        print("\nVisualize a concept:")
        print("  oni-academy visualize \"How does binary search work?\" --render")


if __name__ == "__main__":
    main()
