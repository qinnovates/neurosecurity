import json
import re

import pytest

from atlas_pipeline import notices, sources

EVIDENCE = json.loads((sources.PIPELINE_DIR / "evidence" / "registration-evidence.json").read_text(encoding="utf-8"))
FACTS = notices.measured_facts(EVIDENCE)


def test_every_planned_asset_has_a_modification_note_that_fits_the_manifest() -> None:
    registry = sources.load_registry()
    assert len(registry.inputs["assets"]) >= 5
    for plan in registry.inputs["assets"]:
        note = notices.changes_for(plan, FACTS)
        assert 80 < len(note) <= notices.MAX_NOTE_LENGTH, plan["id"]
        assert "decimated" in note and "smoothed" in note


def test_mirroring_and_the_warp_are_said_in_words_for_the_allen_assets() -> None:
    registry = sources.load_registry()
    notes = {plan["id"]: notices.changes_for(plan, FACTS) for plan in registry.inputs["assets"]}
    for asset_id in ("cortex-allen", "deep-allen"):
        assert "mirror" in notes[asset_id] and "registration" in notes[asset_id]
    assert "was not shown to improve" in notes["deep-allen"] and f"differ from it by {FACTS['deep_disagreement_mm']} mm" in notes["deep-allen"]
    assert "as a whole" in notes["cortex-allen"] and "not for each fold" in notes["cortex-allen"]


def test_a_note_longer_than_the_manifest_allows_is_refused() -> None:
    with pytest.raises(ValueError, match="characters"):
        notices.changes_for({"id": "x", "kind": "template_mask", "position_note": "y" * notices.MAX_NOTE_LENGTH})


def test_notice_carries_required_wording_and_the_stricter_license() -> None:
    registry = sources.load_registry()
    plan = next(p for p in registry.inputs["assets"] if p["source"] == "cit168_rl")
    asset = {"id": plan["id"], "path": "by-sa/deep-cit168.abc.glb", "source_ids": ["cit168_rl"], "computed_with_source_ids": [],
             "modification_note": notices.changes_for(plan, FACTS)}
    text = notices.folder_notice("by-sa", registry, [asset])
    assert asset["modification_note"] in text
    for wording in registry.sources["cit168_rl"]["required_text"]:
        assert wording in text
    assert "ShareAlike" in text and "handled here under the stricter" in text
    assert "made by AI and not by a lawyer" in text
    assert notices.folder_notice("open", registry, [asset]).count("File:") == 0


def test_the_disagreement_figure_is_computed_from_the_evidence_and_never_typed() -> None:
    pairs = EVIDENCE["registration"]["settings"][EVIDENCE["registration"]["shipping_setting"]]["variants"]["intended"]["v2"]
    distances = [row["hd95_mm"] for row in pairs.values()]
    assert FACTS == {"deep_disagreement_mm": f"{min(distances):.1f} to {max(distances):.1f}"}
    assert len(distances) == 16 and min(distances) < max(distances)
    changed = json.loads(json.dumps(EVIDENCE))
    next(iter(changed["registration"]["settings"][changed["registration"]["shipping_setting"]]["variants"]["intended"]["v2"].values()))["hd95_mm"] = 9.44
    assert notices.measured_facts(changed)["deep_disagreement_mm"].endswith("to 9.4")
    assert notices.measured_facts(None) == {}


def test_a_note_that_needs_a_figure_nobody_measured_is_refused() -> None:
    plan = {"id": "x", "kind": "template_mask", "position_note": "They differ by {deep_disagreement_mm} mm."}
    with pytest.raises(ValueError, match="needs the measured figure"):
        notices.changes_for(plan, {})
    assert notices.changes_for(plan, {"deep_disagreement_mm": "0.7 to 2.5"}).endswith("They differ by 0.7 to 2.5 mm.")


def test_no_plan_types_a_millimetre_figure_into_a_position_note() -> None:
    typed_figure = re.compile(r"\d[\d. to-]*\s*mm")
    assert typed_figure.search("atlases disagree by 1 to 2 mm here")
    for plan in sources.load_registry().inputs["assets"]:
        assert not typed_figure.search(plan.get("position_note", "").replace("{deep_disagreement_mm}", "")), plan["id"]
