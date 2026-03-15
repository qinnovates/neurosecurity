#!/usr/bin/env python3
"""Generate PROGRESS.md from git history and prd.json.

Run from repo root:
    python3 MAIN/shared/generate_progress.py
"""

import json
import re
import subprocess
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def get_repo_root():
    """Get the git repository root directory."""
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, check=True
    )
    return Path(result.stdout.strip())


def get_git_log():
    """Get git log with hash, date, and subject."""
    result = subprocess.run(
        ["git", "log", "--pretty=format:%h|%ad|%s", "--date=short"],
        capture_output=True, text=True, check=True
    )
    commits = []
    for line in result.stdout.strip().split("\n"):
        if not line:
            continue
        parts = line.split("|", 2)
        if len(parts) == 3:
            commits.append({
                "hash": parts[0],
                "date": parts[1],
                "subject": parts[2],
            })
    return commits


def get_prd_metrics(repo_root):
    """Read prd.json and return metrics."""
    prd_path = repo_root / "MAIN" / "legacy-core" / "project" / "prd.json"
    if not prd_path.exists():
        return None
    with open(prd_path) as f:
        prd = json.load(f)
    tasks = prd.get("tasks", [])
    metrics = prd.get("metrics", {})
    total = metrics.get("total_tasks", len(tasks))
    completed = metrics.get("completed", sum(1 for t in tasks if t.get("status") == "complete"))
    pending = metrics.get("pending", sum(1 for t in tasks if t.get("status") == "pending"))
    in_progress = metrics.get("in_progress", sum(1 for t in tasks if t.get("status") == "in-progress"))
    rate = f"{completed / total * 100:.0f}%" if total > 0 else "0%"
    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "in_progress": in_progress,
        "rate": rate,
    }


def parse_future_work(repo_root):
    """Parse Future Work table from README.md, return list of initiatives."""
    readme_path = repo_root / "README.md"
    if not readme_path.exists():
        return []
    text = readme_path.read_text()
    # Find the Future Work section
    match = re.search(r"### Future Work\s*\n(.*?)(?=\n---|\n## |\Z)", text, re.DOTALL)
    if not match:
        return []
    section = match.group(1)
    items = []
    for line in section.split("\n"):
        line = line.strip()
        if not line.startswith("|") or line.startswith("|---") or line.startswith("| Initiative"):
            continue
        cols = [c.strip() for c in line.split("|")[1:-1]]
        if len(cols) >= 2:
            name = cols[0]
            desc = cols[1]
            done = "~~" in name and "Done" in desc
            # Clean name of strikethrough
            clean_name = name.replace("~~", "").strip()
            # Remove bold
            clean_name = clean_name.replace("**", "").strip()
            items.append({"name": clean_name, "done": done})
    return items


def generate():
    """Generate PROGRESS.md from all sources."""
    repo_root = get_repo_root()
    now = datetime.now().strftime("%Y-%m-%d")

    commits = get_git_log()
    prd = get_prd_metrics(repo_root)
    future_work = parse_future_work(repo_root)

    # Group commits by date
    by_date = defaultdict(list)
    for c in commits:
        by_date[c["date"]].append(c)

    # Date range
    dates = sorted(by_date.keys())
    date_range = f"{dates[0]} — {dates[-1]}" if dates else "N/A"

    # Future work counts
    fw_done = sum(1 for i in future_work if i["done"])
    fw_total = len(future_work)

    lines = []
    lines.append("# Progress Log")
    lines.append("")
    lines.append("**Author:** Kevin Qi — all research, architecture, and implementation decisions originate from Kevin.")
    lines.append("AI assists with execution; every concept, direction, and framework choice is Kevin's.")
    lines.append("")
    lines.append(f"> Auto-generated from git history. Run `python3 MAIN/shared/generate_progress.py` to update.")
    lines.append(f"> Last generated: {now}")
    lines.append("")

    # Summary
    lines.append("## Summary")
    lines.append(f"- **Commits**: {len(commits)} | **Date range**: {date_range}")
    if prd:
        lines.append(f"- **prd.json**: {prd['completed']}/{prd['total']} tasks complete ({prd['rate']})")
    if future_work:
        lines.append(f"- **Future Work**: {fw_done}/{fw_total} initiatives complete")
    lines.append("")

    # Timeline
    lines.append("## Timeline")
    lines.append("")
    for date in sorted(by_date.keys(), reverse=True):
        lines.append(f"### {date}")
        for c in by_date[date]:
            lines.append(f"- `{c['hash']}` {c['subject']}")
        lines.append("")

    # Future Work Status
    if future_work:
        lines.append("## Future Work Status")
        lines.append("")
        lines.append("| Initiative | Status |")
        lines.append("|-----------|--------|")
        for item in future_work:
            name = f"~~{item['name']}~~" if item["done"] else item["name"]
            status = "Done" if item["done"] else "Pending"
            lines.append(f"| {name} | {status} |")
        lines.append("")

    # prd.json Metrics
    if prd:
        lines.append("## prd.json Metrics")
        lines.append("")
        lines.append("| Metric | Value |")
        lines.append("|--------|-------|")
        lines.append(f"| Total tasks | {prd['total']} |")
        lines.append(f"| Completed | {prd['completed']} |")
        lines.append(f"| In progress | {prd['in_progress']} |")
        lines.append(f"| Pending | {prd['pending']} |")
        lines.append(f"| Completion rate | {prd['rate']} |")
        lines.append("")

    output = "\n".join(lines)
    output_path = repo_root / "PROGRESS.md"
    output_path.write_text(output)
    print(f"Generated {output_path} ({len(commits)} commits, {len(by_date)} days)")


if __name__ == "__main__":
    generate()
