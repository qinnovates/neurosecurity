import sys
import argparse
import json
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from .core import TaraLoader
from .stix import StixExporter

console = Console()

def main():
    parser = argparse.ArgumentParser(description="qtara: TARA Framework CLI")
    subparsers = parser.add_subparsers(dest="command")

    # List Command
    list_parser = subparsers.add_parser("list", help="List all TARA techniques")
    list_parser.add_argument("--band", help="Filter by neural band (e.g., N1)")

    # Info Command
    info_parser = subparsers.add_parser("info", help="Get detailed info for a technique")
    info_parser.add_argument("id", help="Technique ID (e.g., QIF-T0001)")

    # STIX Command
    stix_parser = subparsers.add_parser("stix", help="Export techniques to STIX 2.1 JSON")
    stix_parser.add_argument("--output", help="Output file path", default="stix_bundle.json")

    args = parser.parse_args()

    loader = TaraLoader()
    try:
        loader.load()
    except Exception as e:
        console.print(f"[red]Error loading registry:[/red] {e}")
        sys.exit(1)

    if args.command == "list":
        techniques = loader.list_techniques(band=args.band)
        table = Table(title=f"TARA Techniques {f'(Band: {args.band})' if args.band else ''}")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="green")
        table.add_column("Severity", style="bold")
        table.add_column("Bands")

        for t in techniques:
            table.add_row(t.id, t.attack, t.severity, t.bands)
        
        console.print(table)

    elif args.command == "info":
        t = loader.get_technique(args.id)
        if not t:
            console.print(f"[red]Technique {args.id} not found.[/red]")
            sys.exit(1)
        
        panel_content = f"[bold]Description:[/bold] {t.notes or 'No notes available.'}\n\n"
        panel_content += f"[bold]Severity:[/bold] {t.severity}\n"
        panel_content += f"[bold]Bands:[/bold] {t.bands}\n"
        panel_content += f"[bold]Tactic:[/bold] {t.tactic}\n"
        
        if t.tara:
            panel_content += f"\n[bold yellow]TARA Enrichment:[/bold yellow]\n"
            panel_content += f"Dual Use: {t.tara.dual_use}\n"
            if t.tara.mechanism:
                panel_content += f"Mechanism: {t.tara.mechanism}\n"
        
        if t.niss:
            panel_content += f"\n[bold blue]NISS Scoring:[/bold blue]\n"
            panel_content += f"Score: {t.niss.score}\n"
            panel_content += f"Vector: {t.niss.vector}\n"

        console.print(Panel(panel_content, title=f"{t.id}: {t.attack}", expand=False))

    elif args.command == "stix":
        techniques = loader.list_techniques()
        bundle = StixExporter.to_bundle(techniques)
        with open(args.output, 'w') as f:
            json.dump(bundle, f, indent=2)
        console.print(f"[green]Successfully exported {len(techniques)} techniques to {args.output}[/green]")

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
