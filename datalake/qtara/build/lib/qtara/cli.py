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
    list_parser.add_argument("--tier", help="Filter by physics feasibility tier (0-3, or X)")
    list_parser.add_argument("--severity", help="Filter by severity (critical, high, medium, low)")
    list_parser.add_argument("--domain", help="Filter by TARA domain (e.g., VIS, AUD, SOM)")
    list_parser.add_argument("--mode", help="Filter by TARA mode (R=Recon, M=Manipulation, D=Disruption)")
    list_parser.add_argument("--enriched-only", action="store_true", help="Exclude skeleton/unenriched techniques")

    # Info Command
    info_parser = subparsers.add_parser("info", help="Get detailed info for a technique")
    info_parser.add_argument("id", help="Technique ID (e.g., QIF-T0001)")

    # STIX Command
    stix_parser = subparsers.add_parser("stix", help="Export techniques to STIX 2.1 JSON")
    stix_parser.add_argument("--output", help="Output file path", default="stix_bundle.json")
    stix_parser.add_argument("--include-pending", action="store_true", help="Include unenriched/skeleton techniques")

    # Stats Command
    subparsers.add_parser("stats", help="Show technique statistics by tier, severity, and status")

    # Cite Command
    subparsers.add_parser("cite", help="Get BibTeX citation for TARA")

    args = parser.parse_args()

    loader = TaraLoader()
    try:
        loader.load()
    except Exception as e:
        console.print(f"[red]Error loading registry:[/red] {e}")
        sys.exit(1)

    if args.command == "list":
        if args.tier is not None:
            try:
                tier_val = int(args.tier)
            except ValueError:
                tier_val = args.tier
            techniques = loader.list_by_physics_tier(tier_val)
            title_extra = f" (Tier {args.tier})"
        elif args.severity:
            techniques = loader.list_by_severity(args.severity)
            title_extra = f" (Severity: {args.severity})"
        elif args.band:
            techniques = loader.list_techniques(band=args.band)
            title_extra = f" (Band: {args.band})"
        elif args.domain:
            techniques = loader.list_by_domain(args.domain)
            title_extra = f" (Domain: {args.domain})"
        elif args.mode:
            techniques = loader.list_by_mode(args.mode)
            title_extra = f" (Mode: {args.mode})"
        else:
            techniques = loader.list_techniques()
            title_extra = ""

        # Apply enriched-only filter on top of other filters
        if args.enriched_only:
            techniques = [t for t in techniques if not t.tara_enrichment_pending]
            title_extra += " [enriched only]"

        table = Table(title=f"TARA Techniques{title_extra}")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="green")
        table.add_column("Severity", style="bold")
        table.add_column("Bands")
        table.add_column("Domain")
        table.add_column("Mode")
        table.add_column("Tier")

        for t in techniques:
            tier_str = str(t.physics_feasibility.tier) if t.physics_feasibility else "-"
            domain_str = t.tara_domain_primary or "-"
            mode_str = t.tara_mode or "-"
            table.add_row(t.id, t.attack, t.severity, t.bands, domain_str, mode_str, tier_str)

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

        if t.physics_feasibility:
            pf = t.physics_feasibility
            panel_content += f"\n[bold magenta]Physics Feasibility:[/bold magenta]\n"
            panel_content += f"Tier: T{pf.tier} ({pf.tier_label})\n"
            panel_content += f"Timeline: {pf.timeline}\n"
            if pf.gate_reason:
                panel_content += f"Gate: {pf.gate_reason}\n"

        # v2 taxonomy fields
        if t.tara_domain_primary or t.tara_mode:
            panel_content += f"\n[bold cyan]v2 Taxonomy:[/bold cyan]\n"
            if t.tara_domain_primary:
                domains = [t.tara_domain_primary] + (t.tara_domain_secondary or [])
                panel_content += f"Domain: {', '.join(domains)}\n"
            if t.tara_mode:
                mode_labels = {"R": "Reconnaissance", "M": "Manipulation", "D": "Disruption"}
                panel_content += f"Mode: {t.tara_mode} ({mode_labels.get(t.tara_mode, t.tara_mode)})\n"
            if t.tara_drift:
                drift_labels = {"A": "Acute", "C": "Cumulative", "L": "Latent", "P": "Persistent"}
                panel_content += f"Drift: {t.tara_drift} ({drift_labels.get(t.tara_drift, t.tara_drift)})\n"
            if t.biological_target is not None:
                panel_content += f"Biological Target: {'Yes' if t.biological_target else 'No'}\n"
            if t.tara_enrichment_pending:
                panel_content += f"[yellow]Enrichment Pending[/yellow]\n"

        if t.tara:
            panel_content += f"\n[bold yellow]TARA Enrichment:[/bold yellow]\n"
            panel_content += f"Dual Use: {t.tara.dual_use}\n"
            if t.tara.mechanism:
                panel_content += f"Mechanism: {t.tara.mechanism}\n"

        if t.niss:
            panel_content += f"\n[bold blue]NISS Scoring:[/bold blue]\n"
            panel_content += f"Score: {t.niss.score}\n"
            panel_content += f"Vector: {t.niss.vector}\n"

        if t.cvss:
            panel_content += f"\n[bold red]CVSS {t.cvss.version}:[/bold red]\n"
            panel_content += f"Vector: {t.cvss.base_vector}\n"
            if t.cvss.gap_summary:
                panel_content += f"Neural Gap: {t.cvss.gap_summary}\n"

        if t.neurorights:
            panel_content += f"\n[bold green]Neurorights:[/bold green]\n"
            panel_content += f"Affected: {', '.join(t.neurorights.affected)}\n"
            if t.neurorights.cci is not None:
                panel_content += f"CCI Score: {t.neurorights.cci}\n"

        console.print(Panel(panel_content, title=f"{t.id}: {t.attack}", expand=False))

    elif args.command == "stix":
        techniques = loader.list_techniques()
        include_pending = getattr(args, 'include_pending', False)
        bundle = StixExporter.to_bundle(techniques, include_pending=include_pending)
        exported_count = len(bundle["objects"]) - 1  # subtract identity object
        console.print(f"[green]Successfully exported {exported_count} techniques to {args.output}[/green]")
        with open(args.output, 'w') as f:
            json.dump(bundle, f, indent=2)

    elif args.command == "stats":
        stats = loader.get_statistics()
        console.print(f"\n[bold]TARA Registry: {stats['total']} techniques[/bold]\n")

        tier_table = Table(title="By Physics Feasibility Tier")
        tier_table.add_column("Tier", style="cyan")
        tier_table.add_column("Count", justify="right")
        for label, count in sorted(stats["by_tier"].items()):
            tier_table.add_row(label, str(count))
        console.print(tier_table)

        sev_table = Table(title="By Severity")
        sev_table.add_column("Severity", style="bold")
        sev_table.add_column("Count", justify="right")
        for sev, count in sorted(stats["by_severity"].items()):
            sev_table.add_row(sev, str(count))
        console.print(sev_table)

        status_table = Table(title="By Status")
        status_table.add_column("Status")
        status_table.add_column("Count", justify="right")
        for status, count in sorted(stats["by_status"].items()):
            status_table.add_row(status, str(count))
        console.print(status_table)

    elif args.command == "cite":
        bibtex = """@techreport{qinnovate2026tara,
  author = {Qi, Kevin},
  title = {TARA: Therapeutic Atlas of Risks and Applications for Neural Security},
  institution = {Qinnovate Open Standards},
  year = {2026},
  url = {https://qinnovate.com/TARA},
  version = {1.0}
}"""
        console.print(Panel(bibtex, title="BibTeX Citation", subtitle="Please cite TARA when using this data in academic work", expand=False))

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
