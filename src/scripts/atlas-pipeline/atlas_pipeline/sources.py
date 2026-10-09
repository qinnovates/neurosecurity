"""Source registry, verdicts and the pipeline's own technical inputs; and the one buildability rule.

The registry and verdicts are the datalake files the site's build also parses. The rule below is a
second implementation of `assessBuildability` in src/lib/anatomy/licence-rules.ts; a committed file
of its answers is compared with the TypeScript rule by a vitest test, so the two cannot drift.
"""
from __future__ import annotations

import json
import pathlib
import re
from dataclasses import dataclass
from typing import Any

from .errors import RegistryError

PIPELINE_DIR = pathlib.Path(__file__).resolve().parent.parent
REPO_ROOT = PIPELINE_DIR.parents[2]
SOURCES_PATH = REPO_ROOT / "datalake" / "qif-anatomy-sources.json"
VERDICTS_PATH = REPO_ROOT / "datalake" / "qif-anatomy-verdicts.json"
LEDGER_PATH = REPO_ROOT / "datalake" / "qif-anatomy-review-ledger.json"
INPUTS_PATH = PIPELINE_DIR / "registry" / "pipeline-inputs.json"
SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")
SAFE_NAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
SHIPPING_VERDICTS = frozenset({"SHIP", "SHIP-SEPARATE-FILE"})
# (commercial_use, output_folder) per licence id; mirrors LICENCE_FACTS in licence-rules.ts.
LICENCE_FACTS: dict[str, tuple[bool, str | None]] = {
    "cc-by-4.0": (True, "open"), "cc0-1.0": (True, "open"), "mit": (True, "open"), "mni-icbm-notice": (True, "open"),
    "cc-by-sa-4.0": (True, "by-sa"), "melbourne-subcortex": (False, None), "freesurfer-sla-1.0": (True, None),
    "hcp-data-use-terms": (False, None), "none-stated": (False, None),
}


@dataclass(frozen=True)
class Registry:
    declared_space: str
    sources: dict[str, dict[str, Any]]
    verdicts: dict[str, dict[str, Any]]
    accepted_agreements: frozenset[str]
    inputs: dict[str, Any]


def _read_json(path: pathlib.Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RegistryError(f"cannot read {path.name}: {error}; restore the file") from error


def _accepted_agreements(ledger: dict[str, Any], verdicts: dict[str, dict[str, Any]]) -> frozenset[str]:
    """Source ids whose access agreement the owner accepted for the exact pinned text."""
    owners = {reviewer["id"] for reviewer in ledger.get("reviewers", []) if reviewer.get("role") == "owner"}
    accepted = set()
    for entry in ledger.get("entries", []):
        verdict = verdicts.get(entry.get("key", ""))
        agreement = (verdict or {}).get("access_agreement") or {}
        if entry.get("kind") == "agreement" and agreement.get("text_sha256") and entry.get("digest") == agreement["text_sha256"] \
                and entry.get("reviewer_id") in owners:
            accepted.add(entry["key"])
    return frozenset(accepted)


def load_registry(sources_path: pathlib.Path = SOURCES_PATH, verdicts_path: pathlib.Path = VERDICTS_PATH,
                  ledger_path: pathlib.Path = LEDGER_PATH, inputs_path: pathlib.Path = INPUTS_PATH) -> Registry:
    raw_sources, raw_verdicts, inputs = _read_json(sources_path), _read_json(verdicts_path), _read_json(inputs_path)
    if raw_sources.get("schema_version") != 1 or raw_verdicts.get("schema_version") != 1 or inputs.get("schema_version") != 1:
        raise RegistryError("a registry file has an unsupported schema_version; this pipeline reads version 1 of each")
    sources = {row["id"]: row for row in raw_sources["sources"]}
    verdicts = {row["source_id"]: row for row in raw_verdicts["verdicts"]}
    if len(sources) != len(raw_sources["sources"]):
        raise RegistryError("a source id appears twice in the registry; remove the duplicate")
    for source_id, row in sources.items():
        if row["licence_id"] not in LICENCE_FACTS:
            raise RegistryError(f"source {source_id}: licence id {row['licence_id']!r} is not in the closed list")
        for file_row in row["files"]:
            if not SAFE_NAME_PATTERN.match(str(file_row.get("name", ""))):
                raise RegistryError(f"source {source_id}: file name {file_row.get('name')!r} is not a plain file name")
    ledger = _read_json(ledger_path) if ledger_path.is_file() else {}
    return Registry(raw_sources["declared_space"], sources, verdicts, _accepted_agreements(ledger, verdicts), inputs)


def effective_licence_id(source: dict[str, Any], verdict: dict[str, Any]) -> str:
    return verdict.get("treat_as") or source["licence_id"]


def buildability_blockers(source: dict[str, Any], verdict: dict[str, Any] | None, agreement_accepted: bool) -> list[str]:
    """Every reason a source may not build, in the order and with the names licence-rules.ts uses."""
    if verdict is None:
        return ["not_cleared"]
    route = source.get("route", {})
    checks = [
        ("not_cleared", verdict["clearance"]["cleared"] is True),
        ("verdict_not_ship", verdict["verdict"] in SHIPPING_VERDICTS),
        ("grant_not_explicit", verdict["grant"] == "explicit"),
        ("licence_not_commercial", LICENCE_FACTS[effective_licence_id(source, verdict)][0]),
        ("not_redistributable", source["redistribute"] is True),
        ("agreement_not_accepted", verdict["access_agreement"] is None or agreement_accepted),
        ("route_not_settled", route.get("kind") != "unknown" and route.get("status") == "settled"),
    ]
    return [reason for reason, holds in checks if not holds]


def is_buildable(registry: Registry, source_id: str) -> bool:
    return not buildability_blockers(registry.sources[source_id], registry.verdicts.get(source_id), source_id in registry.accepted_agreements)


def buildability_table(registry: Registry) -> dict[str, list[str]]:
    return {source_id: buildability_blockers(source, registry.verdicts.get(source_id), source_id in registry.accepted_agreements)
            for source_id, source in sorted(registry.sources.items())}


def output_folder(registry: Registry, source_id: str) -> str:
    """Folder under atlas-assets/ for a source's outputs; derived from its effective licence, never typed."""
    licence_id = effective_licence_id(registry.sources[source_id], registry.verdicts[source_id])
    folder = LICENCE_FACTS[licence_id][1]
    if folder is None:
        raise RegistryError(f"source {source_id}: licence {licence_id!r} has no output folder, so nothing may be written for it")
    return folder


def pinned_sha256(file_row: dict[str, Any]) -> str:
    pin = str(file_row.get("sha256") or "")
    if not SHA256_PATTERN.match(pin):
        raise RegistryError(f"file {file_row.get('name')} has no sha256 pin; download it once by hand, check it, and add the pin")
    return pin


def registry_file(registry: Registry, source_id: str, file_name: str) -> dict[str, Any]:
    for row in registry.sources[source_id]["files"]:
        if row["name"] == file_name:
            return row
    raise RegistryError(f"source {source_id} has no file {file_name!r} in the registry; add the row and its pin")
