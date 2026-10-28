"""Write the built assets into the served folder, and remove what the manifest no longer lists."""
from __future__ import annotations

import json
import pathlib
from typing import Any

from . import manifest, notices
from .build import BuiltAsset
from .codehash import pipeline_code_hash, sha256_of_bytes
from .errors import CheckError
from .sources import Registry, output_folder

FOLDERS = ("open", "by-sa")
NOTICE_NAME, LICENCE_NAME = "NOTICE.txt", "LICENSE.txt"


def _write_support_files(out_dir: pathlib.Path, registry: Registry, built_assets: list[BuiltAsset], records: list[dict[str, Any]]) -> dict[str, str]:
    """Label tables, notices and the share-alike license text. Returns each file's path under the asset folder and its sha256."""
    tables: dict[tuple[str, str], list[Any]] = {}
    for built in built_assets:
        tables.setdefault((output_folder(registry, built.plan["source"]), built.plan["source"]), []).extend(built.labels)
    texts = {f"{folder}/labels-{atlas}.json": json.dumps(manifest.label_table(atlas, labels), indent=2, ensure_ascii=False) + "\n"
             for (folder, atlas), labels in tables.items()}
    for folder in FOLDERS:
        if any(record["path"].startswith(folder + "/") for record in records):
            texts[f"{folder}/{NOTICE_NAME}"] = notices.folder_notice(folder, registry, records)
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


