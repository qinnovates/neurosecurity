import hashlib
import pathlib
import zipfile

import pytest

from atlas_pipeline import fetch
from atlas_pipeline.errors import FetchError, RegistryError

HOSTS = frozenset({"example.org"})


def serve(payload: bytes):
    def downloader(url: str, destination: pathlib.Path, max_bytes: int, allowed_hosts: frozenset[str]) -> None:
        fetch.check_url(url, allowed_hosts)
        destination.write_bytes(payload)
    return downloader


def row(payload: bytes, **overrides) -> dict:
    return {"name": "volume.nii.gz", "url": "https://example.org/volume.nii.gz", "sha256": hashlib.sha256(payload).hexdigest(),
            "bytes": len(payload), "digest_origin": "first_download", **overrides}


def test_downloads_then_reuses_a_pinned_file(tmp_path: pathlib.Path) -> None:
    payload = b"voxels"
    assert fetch.fetch_file(row(payload), [], tmp_path, HOSTS, serve(payload)) == "downloaded"
    assert (tmp_path / "volume.nii.gz").read_bytes() == payload

    def must_not_download(*_: object) -> None:
        raise AssertionError("a verified file was downloaded again")
    assert fetch.fetch_file(row(payload), [], tmp_path, HOSTS, must_not_download) == "cached"


def test_refuses_an_unpinned_file(tmp_path: pathlib.Path) -> None:
    with pytest.raises(RegistryError, match="no sha256 pin"):
        fetch.fetch_file(row(b"x", sha256=None), [], tmp_path, HOSTS, serve(b"x"))


def test_refuses_a_hash_mismatch_and_leaves_nothing_behind(tmp_path: pathlib.Path) -> None:
    with pytest.raises(FetchError, match="pin is"):
        fetch.fetch_file(row(b"expected"), [], tmp_path, HOSTS, serve(b"tampered"))
    assert list(tmp_path.iterdir()) == []


@pytest.mark.parametrize("url", ["http://example.org/a", "https://evil.example/a", "file:///etc/hosts"])
def test_refuses_other_schemes_and_hosts(url: str) -> None:
    with pytest.raises(FetchError):
        fetch.check_url(url, HOSTS)


def make_zip(path: pathlib.Path, members: dict[str, bytes]) -> bytes:
    with zipfile.ZipFile(path, "w") as archive:
        for name, payload in members.items():
            archive.writestr(name, payload)
    return path.read_bytes()


@pytest.mark.parametrize("member_path", ["../escape.nii", "/absolute.nii", "inner/../../escape.nii", "inner\\escape.nii"])
def test_refuses_an_archive_member_that_climbs_out(tmp_path: pathlib.Path, member_path: str) -> None:
    archive_bytes = make_zip(tmp_path / "source.zip", {"inner/file.nii": b"data"})
    member = {"path": member_path, "save_as": "file.nii", "sha256": hashlib.sha256(b"data").hexdigest()}
    out = tmp_path / "out"
    with pytest.raises(FetchError, match="absolute or climbs out"):
        fetch.fetch_file(row(archive_bytes, name="source.zip"), [member], out, HOSTS, serve(archive_bytes))


def test_refuses_a_member_saved_under_a_path(tmp_path: pathlib.Path) -> None:
    archive_bytes = make_zip(tmp_path / "source.zip", {"inner/file.nii": b"data"})
    member = {"path": "inner/file.nii", "save_as": "../file.nii", "sha256": hashlib.sha256(b"data").hexdigest()}
    with pytest.raises(FetchError, match="not a plain file name"):
        fetch.fetch_file(row(archive_bytes, name="source.zip"), [member], tmp_path / "out", HOSTS, serve(archive_bytes))


def test_extracts_only_the_named_member_and_checks_its_own_pin(tmp_path: pathlib.Path) -> None:
    archive_bytes = make_zip(tmp_path / "source.zip", {"inner/file.nii": b"data", "inner/other.nii": b"unused"})
    out = tmp_path / "out"
    good = {"path": "inner/file.nii", "save_as": "file.nii", "sha256": hashlib.sha256(b"data").hexdigest()}
    assert fetch.fetch_file(row(archive_bytes, name="source.zip"), [good], out, HOSTS, serve(archive_bytes)) == "downloaded"
    assert sorted(p.name for p in out.iterdir()) == ["file.nii"]
    bad = {**good, "sha256": "0" * 64}
    with pytest.raises(FetchError, match="pin is"):
        fetch.fetch_file(row(archive_bytes, name="source.zip"), [bad], tmp_path / "out2", HOSTS, serve(archive_bytes))
