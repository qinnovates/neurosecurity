"""Digests that tie the manifest to the code and inputs that produced it. Standard library only."""
from __future__ import annotations

import hashlib
import json
import pathlib
from typing import Any

PIPELINE_DIR = pathlib.Path(__file__).resolve().parent.parent
CODE_HASH_FILES = ("atlas_build.py", "requirements.txt", "registry/pipeline-inputs.json")


def digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def sha256_of_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def pipeline_code_hash(pipeline_dir: pathlib.Path = PIPELINE_DIR) -> str:
    """sha256 over the pipeline's source files, its runtime lock and its build plan, in a fixed order."""
    paths = sorted((pipeline_dir / "atlas_pipeline").glob("*.py")) + [pipeline_dir / name for name in CODE_HASH_FILES]
    hasher = hashlib.sha256()
    for path in paths:
        hasher.update(path.relative_to(pipeline_dir).as_posix().encode("utf-8"))
        hasher.update(path.read_bytes())
    return hasher.hexdigest()
