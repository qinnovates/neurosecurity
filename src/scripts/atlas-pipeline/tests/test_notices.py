import pytest

from atlas_pipeline import notices, sources


def test_every_planned_asset_has_a_modification_note_that_fits_the_manifest() -> None:
    registry = sources.load_registry()
    assert len(registry.inputs["assets"]) >= 5
    for plan in registry.inputs["assets"]:
        note = notices.changes_for(plan)
        assert 80 < len(note) <= notices.MAX_NOTE_LENGTH, plan["id"]
        assert "decimated" in note and "smoothed" in note


def test_mirroring_and_the_warp_are_said_in_words_for_the_allen_assets() -> None:
    registry = sources.load_registry()
    notes = {plan["id"]: notices.changes_for(plan) for plan in registry.inputs["assets"]}
    for asset_id in ("cortex-allen", "deep-allen"):
        assert "mirror" in notes[asset_id] and "registration" in notes[asset_id]
    assert "not independently checked" in notes["deep-allen"]
    assert "not independently checked" not in notes["cortex-allen"]


def test_a_note_longer_than_the_manifest_allows_is_refused() -> None:
    with pytest.raises(ValueError, match="characters"):
        notices.changes_for({"id": "x", "kind": "template_mask", "position_note": "y" * notices.MAX_NOTE_LENGTH})


def test_notice_carries_required_wording_and_the_stricter_license() -> None:
    registry = sources.load_registry()
    plan = next(p for p in registry.inputs["assets"] if p["source"] == "cit168_rl")
    asset = {"id": plan["id"], "path": "by-sa/deep-cit168.abc.glb", "source_ids": ["cit168_rl"], "computed_with_source_ids": []}
    text = notices.folder_notice("by-sa", registry, [asset], {plan["id"]: plan})
    for wording in registry.sources["cit168_rl"]["required_text"]:
        assert wording in text
    assert "ShareAlike" in text and "handled here under the stricter" in text
    assert "made by AI and not by a lawyer" in text
    assert notices.folder_notice("open", registry, [asset], {plan["id"]: plan}).count("File:") == 0
