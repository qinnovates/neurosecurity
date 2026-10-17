#!/usr/bin/env python3
"""Fix ICD-10-CM code defects across the data lake, and retire niss_dsm_bridge.

What it changes
---------------
1. Wildcard codes (`F20.x`, `F43.1x`, `G47.0x` ...) are not ICD-10-CM codes.
   Each becomes the category it stands for (`F20`, `F43.1`, `G47.0`). No code
   gains specificity it did not have; the category's header (non-billable)
   status is recorded in datalake/validation/icd10cm-fy2027-titles.json.
2. Codes outside ICD-10-CM chapter F move out of `dsm_conditions` (and the
   pathway file's `dsm_names`) into `icd10_conditions` (`icd10_names`), the
   split the registrar already uses (`tara.dsm5` = chapter F, `tara.icd10` =
   everything else).
3. Every code's label becomes its official ICD-10-CM FY2027 title.
4. Five codes whose label names a different condition that has its own code
   are corrected (CODE_CORRECTIONS). Every other label/code disagreement keeps
   the code and takes its official title; the PR lists those for review.
5. Registrar: `dsm5_spec.niss_dsm_bridge` is removed and the "NISS metrics
   predict diagnostic clusters" wording is replaced (registrar changelog 1.10).

Hand-formatted files are patched in place (json_span_patch) and each result is
verified against the same transform applied to the parsed document.

Usage:
  python3 src/scripts/migrate-icd10cm-codes-and-titles.py \
      --order-file <dir>/icd10cm-order-2027.txt [--dry-run] [--report out.json]
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from icd10cm_order import load_order_file  # noqa: E402
from icd_code_rules import ChangeLog, new_code_and_title, is_chapter_f  # noqa: E402
from json_span_patch import Node, apply_edits, line_indent, parse, rebuild_array  # noqa: E402
import registrar_dsm_retirement as registrar_step  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
DATALAKE = REPO / "datalake"
SDK_COPY = DATALAKE / "qtara" / "src" / "qtara" / "data" / "qtara-registrar.json"

# file -> (record array key, label key) for files whose dsm_conditions hold objects
OBJECT_FILES = {
    "qif-cranial-nerves.json": ("cranial_nerves", "condition"),
    "qif-neuroendocrine.json": ("axes", "condition"),
    "qif-neurotransmitters.json": ("neurotransmitters", "name"),
    "qif-receptors.json": ("receptor_families", "name"),
}

FIELD_NOTE = (
    "dsm_conditions holds ICD-10-CM chapter F codes only; codes outside chapter F are in "
    "icd10_conditions. Each coded entry's {label} is the code's official ICD-10-CM FY2027 title. "
    "Header (non-billable) codes are category references and are marked kind 'category' in "
    "datalake/validation/icd10cm-fy2027-titles.json. Entries without a code are unchanged."
)
PATHWAY_NOTE = (
    "dsm_conditions holds ICD-10-CM chapter F codes only, and dsm_names gives each code's official "
    "ICD-10-CM FY2027 title (not DSM-5-TR text). icd10_conditions and icd10_names hold the codes "
    "outside chapter F on the same terms. Header (non-billable) codes are category references and "
    "are marked kind 'category' in datalake/validation/icd10cm-fy2027-titles.json."
)


def dump_inline(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


def entry_edits(text: str, entry: Node, label_key: str, new_code: str, new_title: str) -> str:
    """Return the entry's source text with its code and label values replaced."""
    local: list[tuple[int, int, str]] = []
    code_node, label_node = entry.get("code"), entry.get(label_key)
    if code_node is None or label_node is None:
        raise ValueError(f"coded entry at offset {entry.start} lacks code or {label_key}")
    local.append((code_node.start - entry.start, code_node.end - entry.start, dump_inline(new_code)))
    local.append((label_node.start - entry.start, label_node.end - entry.start, dump_inline(new_title)))
    return apply_edits(text[entry.start:entry.end], local)


def append_note_edit(text: str, root: Node, note: str, version: str | None) -> list[tuple[int, int, str]]:
    meta = root.get("_metadata")
    edits: list[tuple[int, int, str]] = []
    if meta is None:
        return edits
    notes = meta.get("notes")
    if notes is not None and notes.kind == "array":
        items = [text[item.start:item.end] for item in notes.items] + [dump_inline(note)]
        edits.append((notes.start, notes.end, rebuild_array(text, notes, items)))
    version_node = meta.get("version")
    if version and version_node is not None:
        edits.append((version_node.start, version_node.end, dump_inline(version)))
    return edits


def expected_metadata(doc: dict, note: str, version: str | None) -> None:
    meta = doc.get("_metadata")
    if not isinstance(meta, dict):
        return
    if isinstance(meta.get("notes"), list):
        meta["notes"].append(note)
    if version and "version" in meta:
        meta["version"] = version


def insert_after(obj: dict, anchor: str, additions: dict) -> dict:
    out: dict = {}
    for key, value in obj.items():
        out[key] = value
        if key == anchor:
            out.update(additions)
    return out


def migrate_object_file(name: str, text: str, titles, log: ChangeLog) -> tuple[str, dict]:
    records_key, label_key = OBJECT_FILES[name]
    root, doc = parse(text), json.loads(text)
    edits: list[tuple[int, int, str]] = []
    records_node = root.get(records_key)
    for index, record_node in enumerate(records_node.items):
        record = doc[records_key][index]
        dsm_node = record_node.get("dsm_conditions")
        if dsm_node is None:
            continue
        keep_texts, move_texts, keep_vals, move_vals = [], [], [], []
        for entry_node, entry in zip(dsm_node.items, record["dsm_conditions"]):
            if "code" not in entry:
                keep_texts.append(text[entry_node.start:entry_node.end])
                keep_vals.append(entry)
                continue
            code, title = new_code_and_title(entry["code"], entry[label_key], titles)
            moved = not is_chapter_f(code)
            log.record(name, record.get("id"), "icd10_conditions" if moved else "dsm_conditions",
                       entry["code"], code, entry[label_key], title)
            new_entry = {**entry, "code": code, label_key: title}
            entry_text = entry_edits(text, entry_node, label_key, code, title)
            (move_texts if moved else keep_texts).append(entry_text)
            (move_vals if moved else keep_vals).append(new_entry)
        # Every record with dsm_conditions gets icd10_conditions, empty or not, so the
        # field exists on all rows (generate-parquet.py infers its schema from row 1).
        key_start = next(k for key, k, _ in record_node.members if key == "dsm_conditions")
        replacement = (rebuild_array(text, dsm_node, keep_texts) + ",\n" + line_indent(text, key_start)
                       + '"icd10_conditions": ' + rebuild_array(text, dsm_node, move_texts))
        edits.append((dsm_node.start, dsm_node.end, replacement))
        updated = {**record, "dsm_conditions": keep_vals}
        doc[records_key][index] = insert_after(updated, "dsm_conditions", {"icd10_conditions": move_vals})
    note = FIELD_NOTE.format(label=label_key)
    edits += append_note_edit(text, root, note, None)
    expected_metadata(doc, note, None)
    return apply_edits(text, edits), doc


def migrate_pathways(text: str, titles, log: ChangeLog) -> tuple[str, dict]:
    name = "qif-neural-pathways.json"
    root, doc = parse(text), json.loads(text)
    edits: list[tuple[int, int, str]] = []
    for index, node in enumerate(root.get("pathways").items):
        record = doc["pathways"][index]
        if "dsm_conditions" not in record:
            continue
        pairs = zip(record["dsm_conditions"], record["dsm_names"], strict=True)
        f_codes, f_names, o_codes, o_names = [], [], [], []
        for code, label in pairs:
            new_code, title = new_code_and_title(code, label, titles)
            moved = not is_chapter_f(new_code)
            log.record(name, record["id"], "icd10_conditions" if moved else "dsm_conditions",
                       code, new_code, label, title)
            (o_codes if moved else f_codes).append(new_code)
            (o_names if moved else f_names).append(title)
        codes_node, names_node = node.get("dsm_conditions"), node.get("dsm_names")
        edits.append((codes_node.start, codes_node.end, dump_inline(f_codes)))
        # Present on every pathway, empty or not (generate-parquet.py infers its schema from row 1).
        key_start = next(k for key, k, _ in node.members if key == "dsm_names")
        indent = line_indent(text, key_start)
        names_text = (f'{dump_inline(f_names)}'
                      f',\n{indent}"icd10_conditions": {dump_inline(o_codes)}'
                      f',\n{indent}"icd10_names": {dump_inline(o_names)}')
        edits.append((names_node.start, names_node.end, names_text))
        updated = {**record, "dsm_conditions": f_codes, "dsm_names": f_names}
        doc["pathways"][index] = insert_after(updated, "dsm_names",
                                              {"icd10_conditions": o_codes, "icd10_names": o_names})
    edits += append_note_edit(text, root, PATHWAY_NOTE, "1.1.0")
    expected_metadata(doc, PATHWAY_NOTE, "1.1.0")
    return apply_edits(text, edits), doc


def migrate_titled_entries(name: str, text: str, titles, log: ChangeLog) -> tuple[str, dict]:
    """Files whose coded entries stay where they are: fix code and title in place."""
    root, doc = parse(text), json.loads(text)
    edits: list[tuple[int, int, str]] = []

    def visit(node: Node, value: object, path: str) -> None:
        if node.kind == "object":
            assert isinstance(value, dict)
            if isinstance(value.get("code"), str) and "name" in value:
                code, title = new_code_and_title(value["code"], value["name"], titles)
                log.record(name, value.get("id") or path, "code", value["code"], code, value["name"], title)
                for key, new in (("code", code), ("name", title)):
                    target = node.get(key)
                    edits.append((target.start, target.end, dump_inline(new)))
                value["code"], value["name"] = code, title
            for (key, _, child), child_value in zip(node.members, value.values()):
                visit(child, child_value, f"{path}/{key}")
        elif node.kind == "array":
            assert isinstance(value, list)
            for position, (child, child_value) in enumerate(zip(node.items, value)):
                if child.kind == "scalar" and isinstance(child_value, str) and path.startswith("/band_conditions"):
                    code, _ = new_code_and_title(child_value, None, titles)
                    if code != child_value:
                        log.record(name, path, "band_conditions", child_value, code, None, titles[code].title)
                        edits.append((child.start, child.end, dump_inline(code)))
                        value[position] = code
                else:
                    visit(child, child_value, f"{path}[]")

    visit(root, doc, "")
    for band, codes in doc.get("band_conditions", {}).items():
        if len(codes) != len(set(codes)):
            raise ValueError(f"{name}: band_conditions.{band} would hold a duplicate code")
    return apply_edits(text, edits), doc


def verify(name: str, new_text: str, expected: dict) -> None:
    actual = json.loads(new_text)
    if json.dumps(actual, ensure_ascii=False) != json.dumps(expected, ensure_ascii=False):
        raise SystemExit(f"{name}: patched text does not match the expected document; nothing written")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--order-file", type=Path, required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    titles = load_order_file(args.order_file)
    log = ChangeLog()

    outputs: dict[str, str] = {}
    for name in OBJECT_FILES:
        text = (DATALAKE / name).read_text(encoding="utf-8")
        new_text, expected = migrate_object_file(name, text, titles, log)
        verify(name, new_text, expected)
        outputs[name] = new_text
    text = (DATALAKE / "qif-neural-pathways.json").read_text(encoding="utf-8")
    new_text, expected = migrate_pathways(text, titles, log)
    verify("qif-neural-pathways.json", new_text, expected)
    outputs["qif-neural-pathways.json"] = new_text
    for name in ("qif-dsm-mappings.json", "qif-neurological-mappings.json"):
        text = (DATALAKE / name).read_text(encoding="utf-8")
        new_text, expected = migrate_titled_entries(name, text, titles, log)
        verify(name, new_text, expected)
        outputs[name] = new_text

    registrar = json.loads((DATALAKE / "qtara-registrar.json").read_text(encoding="utf-8"))
    registrar_step.apply(registrar, titles, log)
    outputs["qtara-registrar.json"] = json.dumps(registrar, indent=2, ensure_ascii=False) + "\n"

    print(log.summary())
    if args.report:
        args.report.write_text(json.dumps(log.rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if args.dry_run:
        print("Dry run: no files written.")
        return 0
    for name, content in outputs.items():
        (DATALAKE / name).write_text(content, encoding="utf-8")
    shutil.copyfile(DATALAKE / "qtara-registrar.json", SDK_COPY)
    print(f"Wrote {len(outputs)} files and synced the SDK registrar copy.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
