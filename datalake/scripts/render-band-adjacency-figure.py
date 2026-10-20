#!/usr/bin/env python3
"""Render Figure 20.1: does the N-code numbering predict which codes a pathway joins?

Counts the cross-band links (origin band to target band, both N1-N7, different
codes) in datalake/qif-neural-pathways.json, then scores the published numbering
and every one of the 5,040 numberings of the seven codes by how many of those
links join numerically adjacent numbers. The figure is a histogram of that
count across all numberings, with the published numbering marked.

Usage:
  python3 datalake/scripts/render-band-adjacency-figure.py          # write the SVG
  python3 datalake/scripts/render-band-adjacency-figure.py --check  # exit 1 if stale
"""

from __future__ import annotations

import argparse
import itertools
import json
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PATHWAYS_PATH = REPO_ROOT / "datalake" / "qif-neural-pathways.json"
FIGURE_PATH = REPO_ROOT / "osi-of-mind" / "images" / "qif-band-adjacency-test-v9.svg"
NEURAL_CODES = ("N1", "N2", "N3", "N4", "N5", "N6", "N7")

WIDTH, HEIGHT = 800, 487
PLOT_LEFT, PLOT_RIGHT, PLOT_TOP, PLOT_BOTTOM = 70.0, 770.0, 110.0, 337.0
GRID_LINES = 4
GRID_STEP_UNIT = 50
AXIS_LABEL_EVERY = 3

STYLE = """<style>
.surface{fill:#fcfcfb}
text{font-family:system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;fill:#0b0b0b}
.title{font-size:17px;font-weight:600}.sub{font-size:12.5px;fill:#52514e}.muted{font-size:12px;fill:#52514e}
.strong{font-size:13px;font-weight:600}.hair{stroke:#e4e3df;stroke-width:1;fill:none}.rule{stroke:#8a8983;stroke-width:1;fill:none}
.blue{fill:#2a78d6}.grey{fill:#a8a7a1}.s-ink{stroke:#52514e;fill:none;stroke-dasharray:4 3}
@media (prefers-color-scheme:dark){.surface{fill:#1a1a19}text{fill:#fff}.sub,.muted{fill:#c3c2b7}
.hair{stroke:#383835}.blue{fill:#3987e5}.grey{fill:#75746f}.s-ink{stroke:#c3c2b7}}
</style>"""


class FigureError(Exception):
    """The pathway file cannot be read into links; the caller should fix the data file."""


@dataclass(frozen=True)
class AdjacencyResult:
    pathway_count: int
    cross_links: tuple[tuple[str, str], ...]
    published_adjacent: int
    counts_by_numbering: tuple[int, ...]

    @property
    def mean_share(self) -> float:
        return sum(self.counts_by_numbering) / len(self.counts_by_numbering) / len(self.cross_links)

    @property
    def rank_share(self) -> float:
        """Share of numberings with at least as many adjacent links as the published one."""
        at_least = sum(1 for count in self.counts_by_numbering if count >= self.published_adjacent)
        return at_least / len(self.counts_by_numbering)


def load_cross_links(path: Path) -> tuple[int, tuple[tuple[str, str], ...]]:
    try:
        pathways = json.loads(path.read_text(encoding="utf-8"))["pathways"]
    except (OSError, json.JSONDecodeError, KeyError) as error:
        raise FigureError(f"cannot read pathways from {path.name}: {error}. Fix the data file and re-run.") from error
    links: list[tuple[str, str]] = []
    for pathway in pathways:
        origin = pathway.get("origin_band")
        origins = origin if isinstance(origin, list) else [origin]
        for origin_code in origins:
            for target_code in pathway.get("target_bands", []):
                if origin_code in NEURAL_CODES and target_code in NEURAL_CODES and origin_code != target_code:
                    links.append((origin_code, target_code))
    if not links:
        raise FigureError(f"no cross-band N-code links in {path.name}; the figure would be empty.")
    return len(pathways), tuple(links)


def count_adjacent(numbering: dict[str, int], links: tuple[tuple[str, str], ...]) -> int:
    return sum(1 for origin, target in links if abs(numbering[origin] - numbering[target]) == 1)


def compute_adjacency(path: Path) -> AdjacencyResult:
    pathway_count, links = load_cross_links(path)
    published = {code: index + 1 for index, code in enumerate(NEURAL_CODES)}
    counts = tuple(
        count_adjacent(dict(zip(NEURAL_CODES, permutation)), links)
        for permutation in itertools.permutations(range(1, len(NEURAL_CODES) + 1))
    )
    return AdjacencyResult(pathway_count, links, count_adjacent(published, links), counts)


def render_svg(result: AdjacencyResult) -> str:
    link_count = len(result.cross_links)
    histogram = [result.counts_by_numbering.count(value) for value in range(link_count + 1)]
    first = next(index for index, height in enumerate(histogram) if height)
    last = max(index for index, height in enumerate(histogram) if height)
    bins = list(range(first, last + 1))
    tallest = max(histogram)
    step = -(-tallest // (GRID_LINES * GRID_STEP_UNIT)) * GRID_STEP_UNIT
    y_max = step * GRID_LINES
    slot = (PLOT_RIGHT - PLOT_LEFT) / len(bins)
    y_of = lambda value: PLOT_BOTTOM - (PLOT_BOTTOM - PLOT_TOP) * value / y_max
    x_of_share = lambda share: PLOT_LEFT + (share * link_count - first + 0.5) * slot
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" role="img" '
        'aria-label="Histogram of adjacent-link share across every numbering of the seven N codes, '
        'with the published numbering marked">',
        STYLE,
        f'<rect class="surface" width="{WIDTH}" height="{HEIGHT}"/>',
        '<text class="title" x="24.0" y="34.0">Does the N-code numbering predict which codes a pathway joins?</text>',
        f'<text class="sub" x="24.0" y="55.0">{link_count} links between different N codes, from {result.pathway_count} pathway records. '
        'Each bar counts how many of the 5,040 possible numberings of</text>',
        '<text class="sub" x="24.0" y="72.0">the seven codes give that share of links between adjacent numbers. '
        'The published numbering is the blue bar.</text>',
    ]
    for line in range(1, GRID_LINES + 1):
        y = y_of(step * line)
        parts.append(f'<line class="hair" x1="{PLOT_LEFT}" y1="{y:.1f}" x2="{PLOT_RIGHT}" y2="{y:.1f}"/>')
        parts.append(f'<text class="muted" x="{PLOT_LEFT - 8:.1f}" y="{y + 4:.1f}" text-anchor="end">{step * line}</text>')
    for position, value in enumerate(bins):
        height = PLOT_BOTTOM - y_of(histogram[value])
        css = "blue" if value == result.published_adjacent else "grey"
        x = PLOT_LEFT + position * slot + 1
        parts.append(f'<rect class="{css}" x="{x:.1f}" y="{PLOT_BOTTOM - height:.1f}" width="{slot - 2:.1f}" height="{height:.1f}" rx="2"/>')
        centre = x + (slot - 2) / 2
        if value == result.published_adjacent:
            parts.append(f'<text class="strong" x="{centre:.1f}" y="{PLOT_BOTTOM - height - 8:.1f}" text-anchor="middle">{value / link_count:.1%}</text>')
        elif position % AXIS_LABEL_EVERY == 0:
            parts.append(f'<text class="muted" x="{centre:.1f}" y="{PLOT_BOTTOM + 18:.1f}" text-anchor="middle">{value / link_count:.0%}</text>')
    mean_x = x_of_share(result.mean_share)
    parts.append(f'<line class="rule" x1="{PLOT_LEFT}" y1="{PLOT_BOTTOM}" x2="{PLOT_RIGHT}" y2="{PLOT_BOTTOM}"/>')
    parts.append(f'<line class="s-ink" x1="{mean_x:.1f}" y1="{PLOT_TOP - 6:.1f}" x2="{mean_x:.1f}" y2="{PLOT_BOTTOM:.1f}"/>')
    parts.append(f'<text class="muted" x="{mean_x + 6:.1f}" y="{PLOT_TOP + 4:.1f}">average of all numberings, {result.mean_share:.1%}</text>')
    parts.append(f'<text class="muted" x="{(PLOT_LEFT + PLOT_RIGHT) / 2:.1f}" y="{PLOT_BOTTOM + 40:.1f}" text-anchor="middle">Share of cross-code links joining adjacent numbers</text>')
    parts.append(
        f'<text class="strong" x="24.0" y="{HEIGHT - 52:.1f}">Published numbering: {result.published_adjacent} of {link_count} links '
        f'({result.published_adjacent / link_count:.1%}).</text>'
    )
    parts.append(
        f'<text class="sub" x="24.0" y="{HEIGHT - 32:.1f}">{result.rank_share:.1%} of all numberings place at least as many links on adjacent numbers,</text>'
        f'<text class="sub" x="24.0" y="{HEIGHT - 14:.1f}">so the published order carries no traversal information.</text>'
    )
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Render Figure 20.1, the N-code adjacency permutation test.")
    parser.add_argument("--check", action="store_true", help="exit 1 when the committed figure is stale")
    args = parser.parse_args()
    try:
        result = compute_adjacency(PATHWAYS_PATH)
    except FigureError as error:
        print(f"[band-adjacency] {error}", file=sys.stderr)
        return 2
    svg = render_svg(result)
    summary = (
        f"{result.published_adjacent}/{len(result.cross_links)} adjacent, average {result.mean_share:.1%}, "
        f"rank {result.rank_share:.1%} of 5,040 numberings"
    )
    if args.check:
        current = FIGURE_PATH.read_text(encoding="utf-8") if FIGURE_PATH.exists() else ""
        if current != svg:
            print(f"[band-adjacency] {FIGURE_PATH.name} is stale ({summary}). Run without --check.", file=sys.stderr)
            return 1
        print(f"[band-adjacency] figure is current ({summary}).")
        return 0
    FIGURE_PATH.write_text(svg, encoding="utf-8")
    print(f"[band-adjacency] wrote {FIGURE_PATH.name} ({summary}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
