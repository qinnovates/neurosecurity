#!/usr/bin/env python3
"""
Convert QIF JSON datalake to Parquet format.

Generates:
  docs/data/parquet/*.parquet         — one file per logical table
  docs/data/parquet/catalog.json      — metadata manifest for the Data Studio

Architecture:
  datalake/*.json → PyArrow → docs/data/parquet/*.parquet
  Served as static files at /data/parquet/ on the live site.

Usage:
  python3 scripts/generate-parquet.py
  python3 scripts/generate-parquet.py --dry-run
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timezone

import pyarrow as pa
import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parent.parent
SHARED = ROOT / "datalake"
SRC_DATA = ROOT / "src" / "data"
OUT = ROOT / "docs" / "data" / "parquet"

# Zstd level 3: 30-50% better compression than Snappy, sub-ms decompression at these sizes
COMPRESSION = "zstd"
COMPRESSION_LEVEL = 3

DRY_RUN = "--dry-run" in sys.argv


def load_json(path: Path):
    """Load and parse a JSON file."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def flatten_technique(t: dict) -> dict:
    """Flatten a nested TARA technique into a flat row for Parquet."""
    niss = t.get("niss") or {}
    tara = t.get("tara") or {}
    physics = t.get("physics_feasibility") or {}
    regulatory = t.get("regulatory") or {}
    cvss = t.get("cvss") or {}
    neurorights = t.get("neurorights") or {}
    origin = t.get("origin") or {}

    return {
        "id": t.get("id", ""),
        "name": t.get("attack") or t.get("technique") or t.get("name", ""),
        "tactic": t.get("tactic", ""),
        "severity": t.get("severity", ""),
        "status": t.get("status", ""),
        "bands": ", ".join(t.get("band_ids", [])) if isinstance(t.get("band_ids"), list) else str(t.get("bands", "")),
        "ui_category": t.get("ui_category", ""),
        "dual_use": tara.get("dual_use", ""),
        # NISS scores
        "niss_score": float(niss.get("score", 0)) if niss.get("score") else None,
        "niss_vector": niss.get("vector", ""),
        "niss_severity": niss.get("severity", ""),
        "niss_bi": niss.get("BI", ""),
        "niss_cr": niss.get("CR", ""),
        "niss_cd": niss.get("CD", ""),
        "niss_cv": niss.get("CV", ""),
        "niss_rv": niss.get("RV", ""),
        "niss_np": niss.get("NP", ""),
        # Physics (tier can be int or string like "X")
        "physics_tier": str(physics.get("tier", "")) if physics.get("tier") is not None else "",
        "physics_tier_label": physics.get("tier_label", ""),
        # Regulatory
        "regulatory_cyber_device": bool(regulatory.get("fdora_524b", {}).get("cyber_device", False)),
        "regulatory_coverage": float(regulatory.get("fdora_524b", {}).get("coverage_score", 0)) if regulatory.get("fdora_524b", {}).get("coverage_score") else None,
        # CVSS
        "cvss_base_vector": cvss.get("base_vector", ""),
        # Origin
        "origin_domain": origin.get("domain", ""),
        "origin_classical": bool(t.get("classical", False)),
        "origin_quantum": bool(t.get("quantum", False)),
        # Consent
        "consent_tier": tara.get("consent_tier", ""),
        # Notes
        "notes": t.get("notes", ""),
    }


def flatten_dsm_bridge(techniques: list) -> list:
    """Create technique_id × DSM code bridge table."""
    rows = []
    for t in techniques:
        tid = t.get("id", "")
        tara = t.get("tara") or {}
        dsm5 = tara.get("dsm5") or {}
        for dtype in ("primary", "secondary"):
            for entry in dsm5.get(dtype, []):
                rows.append({
                    "technique_id": tid,
                    "dsm_code": entry.get("code", ""),
                    "dsm_name": entry.get("name", ""),
                    "confidence": entry.get("confidence", ""),
                    "dsm_type": dtype,
                })
    return rows


def flatten_neurorights_bridge(techniques: list) -> list:
    """Create technique_id × neurorights bridge table."""
    rows = []
    for t in techniques:
        tid = t.get("id", "")
        nr = t.get("neurorights") or {}
        for right in nr.get("affected", []):
            rows.append({
                "technique_id": tid,
                "right_code": right,
            })
    return rows


def write_parquet(name: str, rows: list, catalog: dict):
    """Convert a list of dicts to a Parquet file."""
    if not rows:
        print(f"  [skip] {name}: empty")
        return

    table = pa.Table.from_pylist(rows)
    out_path = OUT / f"{name}.parquet"
    size_json = len(json.dumps(rows))

    if DRY_RUN:
        print(f"  [dry-run] {name}: {len(rows)} rows, {table.num_columns} cols, ~{size_json // 1024}KB JSON")
        catalog[name] = {
            "rows": len(rows),
            "columns": table.num_columns,
            "column_names": table.column_names,
            "source": "dry-run",
        }
        return

    pq.write_table(
        table,
        str(out_path),
        compression=COMPRESSION,
        compression_level=COMPRESSION_LEVEL,
        write_statistics=True,
        row_group_size=max(len(rows), 1),  # single row group — optimal for <10K rows
    )

    size_parquet = out_path.stat().st_size
    ratio = size_parquet / size_json if size_json > 0 else 0
    print(f"  {name}: {len(rows)} rows, {table.num_columns} cols, "
          f"{size_json // 1024}KB JSON → {size_parquet // 1024}KB Parquet ({ratio:.0%})")

    catalog[name] = {
        "rows": len(rows),
        "columns": table.num_columns,
        "column_names": table.column_names,
        "size_bytes": size_parquet,
        "compression": COMPRESSION,
        "source": str(out_path.relative_to(ROOT)),
    }


def build_flat_table(data, key=None, flatten_fn=None):
    """Extract rows from a JSON file, optionally from a nested key, optionally flattening."""
    if key:
        data = data.get(key, data) if isinstance(data, dict) else data
    if isinstance(data, dict) and not key:
        # Try common patterns
        for k in ("techniques", "companies", "pathways", "regions", "neurotransmitters",
                   "conditions", "controls", "entries", "items", "data", "axes",
                   "cell_types", "nerves", "components"):
            if k in data and isinstance(data[k], list):
                data = data[k]
                break
        else:
            # Single object — wrap in list
            if not isinstance(data, list):
                data = [data]
    if flatten_fn:
        data = [flatten_fn(row) for row in data]
    return data if isinstance(data, list) else [data]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = {}

    print(f"[parquet] Converting QIF datalake to Parquet (compression={COMPRESSION}, level={COMPRESSION_LEVEL})")
    print(f"[parquet] Output: {OUT}")
    if DRY_RUN:
        print("[parquet] DRY RUN — no files will be written\n")

    # === Core: TARA Registrar (flatten nested → multiple tables) ===
    registrar = load_json(SHARED / "qtara-registrar.json")
    techniques_raw = registrar.get("techniques", registrar if isinstance(registrar, list) else [])

    # Main techniques table (flat scalars)
    write_parquet("techniques", [flatten_technique(t) for t in techniques_raw], catalog)

    # Bridge tables
    write_parquet("technique_dsm", flatten_dsm_bridge(techniques_raw), catalog)
    write_parquet("technique_neurorights", flatten_neurorights_bridge(techniques_raw), catalog)

    # === Impact chains (precomputed, already flat) ===
    impact_chains = load_json(SHARED / "impact-chains.json")
    if isinstance(impact_chains, dict):
        impact_chains = impact_chains.get("chains", impact_chains.get("data", []))
    write_parquet("impact_chains", impact_chains if isinstance(impact_chains, list) else [], catalog)

    # === Brain atlas ===
    atlas = load_json(SHARED / "qif-brain-bci-atlas.json")
    write_parquet("brain_regions", build_flat_table(atlas, "brain_regions"), catalog)
    write_parquet("hourglass_bands", build_flat_table(atlas, "qif_bands"), catalog)
    if "bci_devices" in atlas and isinstance(atlas["bci_devices"], list):
        write_parquet("atlas_devices", build_flat_table(atlas, "bci_devices"), catalog)

    # === BCI Landscape ===
    landscape = load_json(SHARED / "bci-landscape.json")
    companies = landscape.get("companies", [])
    # Flatten companies (remove deep nesting)
    flat_companies = []
    for c in companies:
        row = {k: v for k, v in c.items() if not isinstance(v, (dict, list))}
        row["device_count"] = len(c.get("devices", []))
        row["tara_attack_surface"] = ", ".join(c.get("tara_attack_surface", []))
        flat_companies.append(row)
    write_parquet("companies", flat_companies, catalog)

    # Flatten devices from landscape
    devices = []
    for c in companies:
        for d in c.get("devices", []):
            row = {k: v for k, v in d.items() if not isinstance(v, (dict, list))}
            row["company"] = c.get("name", "")
            devices.append(row)
    write_parquet("devices", devices, catalog)

    # === Simple JSON files (flat or shallow nesting) ===
    simple_files = {
        "neural_pathways": (SHARED / "qif-neural-pathways.json", "pathways"),
        "neurotransmitters": (SHARED / "qif-neurotransmitters.json", "neurotransmitters"),
        "dsm_clusters": (SHARED / "qif-dsm-mappings.json", "diagnostic_clusters"),
        "neurological_conditions": (SHARED / "qif-neurological-mappings.json", "conditions"),
        "cranial_nerves": (SHARED / "qif-cranial-nerves.json", "cranial_nerves"),
        "neuroendocrine": (SHARED / "qif-neuroendocrine.json", "axes"),
        "glial_cells": (SHARED / "qif-glial-cells.json", "glial_types"),
        "neurovascular": (SHARED / "qif-neurovascular.json", "components"),
        "receptors": (SHARED / "qif-receptors.json", "receptor_families"),
        "cve_mappings": (SHARED / "cve-technique-mapping.json", "mappings"),
        "security_controls": (SHARED / "qif-security-controls.json", "controls"),
        "ethics_controls": (SHARED / "qif-ethics-controls.json", "neurorights"),
        "guardrails": (SHARED / "qif-guardrails.json", "guardrails"),
        "neurosecurity_scores": (SHARED / "neurosecurity-scores.json", "devices"),
        "research_explorer": (SHARED / "research-registry.json", "explorer"),
        "research_institutions": (SHARED / "research-registry.json", "institutions"),
        "research_standards": (SHARED / "research-registry.json", "standards"),
        "research_legislation": (SHARED / "research-registry.json", "legislation"),
        "validation_registry": (SHARED / "validation-registry.json", "entries"),
        "eeg_samples": (SHARED / "eeg-samples.json", "samples"),
    }

    for name, (path, key) in simple_files.items():
        if not path.exists():
            print(f"  [skip] {name}: {path.name} not found")
            continue
        try:
            data = load_json(path)
            rows = build_flat_table(data, key)
            # Flatten any remaining nested objects to strings
            flat_rows = []
            for row in rows:
                flat = {}
                for k, v in (row.items() if isinstance(row, dict) else []):
                    if isinstance(v, (dict, list)):
                        flat[k] = json.dumps(v)
                    else:
                        flat[k] = v
                flat_rows.append(flat)
            write_parquet(name, flat_rows, catalog)
        except Exception as e:
            print(f"  [error] {name}: {e}")

    # === Site data ===
    site_files = {
        "intel_feed": (SRC_DATA / "bci-intel-feed.json", None),
        "intel_sources": (SRC_DATA / "intel-sources.json", None),
        "timeline": (SRC_DATA / "qif-timeline.json", None),
    }

    for name, (path, key) in site_files.items():
        if not path.exists():
            print(f"  [skip] {name}: {path.name} not found")
            continue
        try:
            data = load_json(path)
            rows = build_flat_table(data, key)
            flat_rows = []
            for row in rows:
                flat = {}
                for k, v in (row.items() if isinstance(row, dict) else []):
                    if isinstance(v, (dict, list)):
                        flat[k] = json.dumps(v)
                    else:
                        flat[k] = v
                flat_rows.append(flat)
            write_parquet(name, flat_rows, catalog)
        except Exception as e:
            print(f"  [error] {name}: {e}")

    # === Write catalog manifest ===
    manifest = {
        "_meta": {
            "generated": datetime.now(timezone.utc).isoformat(),
            "compression": COMPRESSION,
            "compression_level": COMPRESSION_LEVEL,
            "pyarrow_version": pa.__version__,
            "total_datasets": len(catalog),
            "total_rows": sum(v["rows"] for v in catalog.values()),
        },
        "datasets": catalog,
    }

    catalog_path = OUT / "catalog.json"
    if not DRY_RUN:
        with open(catalog_path, "w") as f:
            json.dump(manifest, f, indent=2)

    # Summary
    total_parquet = sum(v.get("size_bytes", 0) for v in catalog.values())
    print(f"\n[parquet] Done: {len(catalog)} datasets, "
          f"{sum(v['rows'] for v in catalog.values())} total rows, "
          f"{total_parquet // 1024}KB total Parquet")


if __name__ == "__main__":
    main()
