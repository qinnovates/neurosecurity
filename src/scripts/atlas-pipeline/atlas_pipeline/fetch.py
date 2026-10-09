"""Fetch step: the only part of the pipeline that touches the network.

HTTPS only, hosts from the source row, sha256 pinned, size capped. Archives are never
unpacked wholesale: only the members a row names are read, each written under a plain
file name and checked against its own pin.
"""
from __future__ import annotations

import hashlib
import pathlib
import urllib.parse
import urllib.request
import zipfile
from collections.abc import Callable
from typing import Any

from .errors import FetchError
from .sources import SAFE_NAME_PATTERN, Registry, pinned_sha256

CHUNK_BYTES = 1 << 20
SIZE_SLACK_BYTES = 1024
TIMEOUT_SECONDS = 120
Downloader = Callable[[str, pathlib.Path, int, frozenset[str]], None]


def sha256_of(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(CHUNK_BYTES), b""):
            digest.update(chunk)
    return digest.hexdigest()


class _AllowlistRedirects(urllib.request.HTTPRedirectHandler):
    def __init__(self, allowed_hosts: frozenset[str]) -> None:
        self.allowed_hosts = allowed_hosts

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001, D102 - urllib signature
        check_url(newurl, self.allowed_hosts)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def check_url(url: str, allowed_hosts: frozenset[str]) -> None:
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != "https":
        raise FetchError(f"refusing non-https URL {url!r}; only https downloads are allowed")
    if parts.hostname not in allowed_hosts:
        raise FetchError(f"refusing host {parts.hostname!r}; add it to the source row's allowed_hosts only if the publisher serves from it")


def download_https(url: str, destination: pathlib.Path, max_bytes: int, allowed_hosts: frozenset[str]) -> None:
    check_url(url, allowed_hosts)
    opener = urllib.request.build_opener(_AllowlistRedirects(allowed_hosts))
    received = 0
    try:
        with opener.open(url, timeout=TIMEOUT_SECONDS) as response, destination.open("wb") as out:
            for chunk in iter(lambda: response.read(CHUNK_BYTES), b""):
                received += len(chunk)
                if received > max_bytes:
                    raise FetchError(f"download of {url!r} exceeded its size cap of {max_bytes} bytes; check the registry row")
                out.write(chunk)
    except OSError as error:
        destination.unlink(missing_ok=True)
        raise FetchError(f"download of {url!r} failed: {error}; retry, or check the publisher's page") from error


def _verify(path: pathlib.Path, expected: str, what: str) -> None:
    actual = sha256_of(path)
    if actual != expected:
        raise FetchError(f"{what} has sha256 {actual}, but the pin is {expected}; do not use the file, and compare with the publisher")


def _member_present(directory: pathlib.Path, member: dict[str, Any]) -> bool:
    path = directory / member["save_as"]
    return path.is_file() and sha256_of(path) == pinned_sha256(member)


def extract_member(archive_path: pathlib.Path, member: dict[str, Any], directory: pathlib.Path) -> None:
    """Read one named member out of a zip and write it under a plain file name."""
    member_path = str(member["path"])
    parts = pathlib.PurePosixPath(member_path).parts
    if member_path.startswith("/") or ".." in parts or "\\" in member_path:
        raise FetchError(f"archive member path {member_path!r} is absolute or climbs out of the archive; fix the registry row")
    if not SAFE_NAME_PATTERN.match(str(member["save_as"])):
        raise FetchError(f"member save_as {member['save_as']!r} is not a plain file name; fix the registry row")
    with zipfile.ZipFile(archive_path) as archive:
        try:
            info = archive.getinfo(member_path)
        except KeyError as error:
            raise FetchError(f"archive {archive_path.name} has no member {member_path!r}; the publisher's archive changed") from error
        if info.is_dir() or (info.external_attr >> 16) & 0o170000 == 0o120000:
            raise FetchError(f"archive member {member_path!r} is a directory or a link; refusing it")
        target = directory / member["save_as"]
        with archive.open(info) as source, target.open("wb") as out:
            for chunk in iter(lambda: source.read(CHUNK_BYTES), b""):
                out.write(chunk)
    _verify(target, pinned_sha256(member), f"member {member_path} of {archive_path.name}")


def fetch_file(file_row: dict[str, Any], members: list[dict[str, Any]], directory: pathlib.Path, allowed_hosts: frozenset[str],
               downloader: Downloader = download_https) -> str:
    """Make one registry file present and verified. Returns 'cached' or 'downloaded'.

    With `members`, the download is an archive: only those members are kept, and the archive is removed.
    """
    pin = pinned_sha256(file_row)
    directory.mkdir(parents=True, exist_ok=True)
    target = directory / file_row["name"]
    if members and all(_member_present(directory, member) for member in members):
        return "cached"
    if not members and target.is_file() and sha256_of(target) == pin:
        return "cached"
    partial = directory / (file_row["name"] + ".part")
    downloader(file_row["url"], partial, int(file_row["bytes"]) + SIZE_SLACK_BYTES, allowed_hosts)
    try:
        _verify(partial, pin, f"download {file_row['name']}")
        if not members:
            partial.replace(target)
            return "downloaded"
        for member in members:
            extract_member(partial, member, directory)
    finally:
        partial.unlink(missing_ok=True)
    return "downloaded"


def fetch_source(registry: Registry, source_id: str, cache_dir: pathlib.Path, downloader: Downloader = download_https) -> dict[str, str]:
    """Fetch every pinned file of one source. Files the registry lists without a pin are not used and are skipped."""
    technical = registry.inputs["fetch"].get(source_id)
    if technical is None:
        raise FetchError(f"source {source_id} has no fetch entry in pipeline-inputs.json; add its allowed hosts")
    directory = cache_dir / "raw" / source_id
    hosts = frozenset(technical["allowed_hosts"])
    results = {}
    for row in registry.sources[source_id]["files"]:
        if row.get("sha256") is None:
            continue
        results[row["name"]] = fetch_file(row, technical["members"].get(row["name"], []), directory, hosts, downloader)
    return results


def source_file(cache_dir: pathlib.Path, source_id: str, file_name: str) -> pathlib.Path:
    path = cache_dir / "raw" / source_id / file_name
    if not path.is_file():
        raise FetchError(f"{source_id}/{file_name} is not in the cache; run the fetch step first")
    return path
