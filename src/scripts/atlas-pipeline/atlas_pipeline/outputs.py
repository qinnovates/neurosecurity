"""Write the built assets into the served folder, and remove what the manifest no longer lists."""
from __future__ import annotations

import pathlib
from typing import Any

from . import manifest, notices, overlays
from .build import BuiltAsset
from .errors import CheckError
from .headers import load_canonical
from .fetch import source_file
from .sources import Registry, output_folder

FOLDERS = ("open", "by-sa")
NOTICE_NAME, LICENCE_NAME = "NOTICE.txt", "LICENSE.txt"
T1_WINDOW_PERCENTILES = (1.0, 99.5)


def write_assets(out_dir: pathlib.Path, registry: Registry, built_assets: list[BuiltAsset], evidence: dict[str, Any] | None) -> dict[str, Any]:
    code_hash = manifest.pipeline_code_hash()
    records = [manifest.asset_record(built, registry, evidence, code_hash) for built in built_assets]
    failed = [f"{record['id']} {check['id']}" for record in records for check in record["checks"]
              if check["status"] == "fail" and check["id"] not in ("V1", "V2")]
    if failed:
        raise CheckError(f"checks failed: {', '.join(failed)}; nothing was written. Inspect the evidence file and the source volumes")
    plans = {built.plan["id"]: built.plan for built in built_assets}
    tables: dict[tuple[str, str], list[Any]] = {}
    for built in built_assets:
        tables.setdefault((output_folder(registry, built.plan["source"]), built.plan["source"]), []).extend(built.labels)
    expected: dict[str, set[str]] = {folder: set() for folder in FOLDERS}
    for built, record in zip(built_assets, records):
        path = out_dir / record["path"]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(built.glb)
        expected[record["path"].split("/")[0]].add(path.name)
    for (folder, atlas), labels in tables.items():
        name = f"labels-{atlas}.json"
        manifest.write_json(out_dir / folder / name, manifest.label_table(atlas, labels))
        expected[folder].add(name)
    for folder in FOLDERS:
        if not expected[folder]:
            continue
        (out_dir / folder / NOTICE_NAME).write_text(notices.folder_notice(folder, registry, records, plans), encoding="utf-8")
        expected[folder].add(NOTICE_NAME)
    if expected["by-sa"]:
        (out_dir / "by-sa" / LICENCE_NAME).write_text(notices.share_alike_licence_text(), encoding="utf-8")
        expected["by-sa"].add(LICENCE_NAME)
    for folder in FOLDERS:
        directory = out_dir / folder
        for stale in (sorted(directory.iterdir()) if directory.is_dir() else []):
            if stale.is_file() and stale.name not in expected[folder]:
                stale.unlink()
    document = manifest.manifest_document(registry, records, code_hash)
    manifest.write_json(out_dir / "manifest.json", document)
    return document


def write_review_sheets(review_dir: pathlib.Path, cache_dir: pathlib.Path, registry: Registry, built_assets: list[BuiltAsset]) -> int:
    """One sheet per meshed structure, under the cache. Returns how many were written."""
    import numpy as np

    template = registry.inputs["template"]
    t1, affine = load_canonical(source_file(cache_dir, template["source"], template["t1"]))
    window = tuple(float(v) for v in np.percentile(t1[t1 > 0], T1_WINDOW_PERCENTILES))
    count = 0
    for built in built_assets:
        for key, mesh in built.meshes.items():
            label_id, hemisphere = key.rsplit(":", 1)
            overlays.write_sheet(review_dir / built.plan["id"] / f"{label_id}-{hemisphere}.png", mesh, t1, affine, window)  # type: ignore[arg-type]
            count += 1
    return count
