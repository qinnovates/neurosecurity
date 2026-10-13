"""Write the built assets into the served folder, and remove what the manifest no longer lists."""
from __future__ import annotations

import json
import pathlib
from typing import Any

from . import manifest, notices, overlays
from .build import BuiltAsset
from .codehash import pipeline_code_hash, sha256_of_bytes
from .errors import CheckError
from .headers import load_canonical
from .fetch import source_file
from .sources import Registry, output_folder

FOLDERS = ("open", "by-sa")
NOTICE_NAME, LICENCE_NAME = "NOTICE.txt", "LICENSE.txt"
T1_WINDOW_PERCENTILES = (1.0, 99.5)


def _write_support_files(out_dir: pathlib.Path, registry: Registry, built_assets: list[BuiltAsset], records: list[dict[str, Any]]) -> dict[str, str]:
    """Label tables, notices and the share-alike license text. Returns each file's path under the asset folder and its sha256."""
    plans = {built.plan["id"]: built.plan for built in built_assets}
    tables: dict[tuple[str, str], list[Any]] = {}
    for built in built_assets:
        tables.setdefault((output_folder(registry, built.plan["source"]), built.plan["source"]), []).extend(built.labels)
    texts = {f"{folder}/labels-{atlas}.json": json.dumps(manifest.label_table(atlas, labels), indent=2, ensure_ascii=False) + "\n"
             for (folder, atlas), labels in tables.items()}
    for folder in FOLDERS:
        if any(record["path"].startswith(folder + "/") for record in records):
            texts[f"{folder}/{NOTICE_NAME}"] = notices.folder_notice(folder, registry, records, plans)
    if f"by-sa/{NOTICE_NAME}" in texts:
        texts[f"by-sa/{LICENCE_NAME}"] = notices.share_alike_licence_text()
    for relative, text in texts.items():
        path = out_dir / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    return {relative: sha256_of_bytes(text.encode("utf-8")) for relative, text in texts.items()}


def write_assets(out_dir: pathlib.Path, registry: Registry, built_assets: list[BuiltAsset], evidence: dict[str, Any] | None) -> dict[str, Any]:
    code_hash = pipeline_code_hash()
    records = [manifest.asset_record(built, registry, evidence, code_hash) for built in built_assets]
    failed = manifest.failed_checks(records)
    if failed:
        raise CheckError(f"checks failed: {', '.join(failed)}; nothing was written. Inspect the evidence file and the source volumes")
    for built, record in zip(built_assets, records):
        path = out_dir / record["path"]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(built.glb)
    support_files = _write_support_files(out_dir, registry, built_assets, records)
    expected = {record["path"] for record in records} | set(support_files)
    for folder in FOLDERS:
        directory = out_dir / folder
        for stale in (sorted(directory.iterdir()) if directory.is_dir() else []):
            if stale.is_file() and f"{folder}/{stale.name}" not in expected:
                stale.unlink()
    document = manifest.manifest_document(registry, records, code_hash, support_files)
    manifest.write_json(out_dir / "manifest.json", document)
    return document


def write_review_sheets(review_dir: pathlib.Path, cache_dir: pathlib.Path, registry: Registry, built_assets: list[BuiltAsset]) -> int:
    """One sheet per meshed structure, under the cache. Returns how many were written."""
    import numpy as np

    template = registry.inputs["template"]
    t1, affine = load_canonical(source_file(cache_dir, template["source"], template["t1"]))
    low, high = (float(v) for v in np.percentile(t1[t1 > 0], T1_WINDOW_PERCENTILES))
    count = 0
    for built in built_assets:
        for key, mesh in built.meshes.items():
            label_id, hemisphere = key.rsplit(":", 1)
            overlays.write_sheet(review_dir / built.plan["id"] / f"{label_id}-{hemisphere}.png", mesh, t1, affine, (low, high))
            count += 1
    return count
