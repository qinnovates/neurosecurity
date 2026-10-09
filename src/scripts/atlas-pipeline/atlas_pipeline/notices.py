"""Per-folder notice files, generated from the registry and the manifest so they cannot drift."""
from __future__ import annotations

from typing import Any

from .sources import Registry, effective_licence_id

LICENCE_NAMES = {
    "mni-icbm-notice": ("MNI ICBM152 permission notice", "https://nist.mni.mcgill.ca/icbm-152-nonlinear-atlases-2009/"),
    "cc-by-4.0": ("Creative Commons Attribution 4.0 International", "https://creativecommons.org/licenses/by/4.0/"),
    "cc-by-sa-4.0": ("Creative Commons Attribution-ShareAlike 4.0 International", "https://creativecommons.org/licenses/by-sa/4.0/"),
    "cc0-1.0": ("CC0 1.0 Universal", "https://creativecommons.org/publicdomain/zero/1.0/"),
}
AI_READING = ("The licence readings behind this notice were made by AI and not by a lawyer. No person has confirmed them. "
              "They are not legal advice.")
ANATOMY_NOTE = "No neuroanatomist has checked these shapes or what they are said to show."
CHANGES = {
    "template_mask": "The template's brain mask was meshed (marching cubes), smoothed (Taubin) and decimated. It is an outline of the average template, not a cortical surface.",
    "probability_maps": "Each probability map was split into left and right at x = 0, thresholded at 0.5, meshed (marching cubes on the probability field), smoothed (Taubin) and decimated. Structures too small to outline are recorded as markers with no shape.",
    "discrete_lateralised": "Each label was meshed on the publisher's grid (marching cubes on a lightly smoothed mask), smoothed (Taubin) and decimated, and placed through the file's affine with no other transform. Structures too small to outline are recorded as markers with no shape.",
    "discrete_mirrored": "The label volume was moved from the 2009b symmetric template to MNI152NLin2009cAsym by a nonlinear registration computed for this project (nearest-neighbour resampling of labels), then each label was meshed, smoothed (Taubin) and decimated. One hemisphere was drawn by the publisher; the right side is a mirror of the left drawing.",
}


def changes_for(kind: str) -> str:
    return CHANGES[kind]


def folder_notice(folder: str, registry: Registry, assets: list[dict[str, Any]], plans: dict[str, dict[str, Any]]) -> str:
    lines = [f"NOTICE for atlas-assets/{folder}/", "", "This folder holds third-party material, changed as described below. Each file keeps its source's licence.",
             AI_READING, ANATOMY_NOTE, ""]
    for asset in sorted((a for a in assets if a["path"].startswith(folder + "/")), key=lambda a: a["path"]):
        source_id = asset["source_ids"][0]
        source, verdict = registry.sources[source_id], registry.verdicts[source_id]
        licence_id = effective_licence_id(source, verdict)
        name, url = LICENCE_NAMES[licence_id]
        lines += [f"File: {asset['path'].split('/', 1)[1]}", f"  Source: {source['name']}", f"  Attribution: {source['attribution_text'] or source['name']}",
                  f"  Source pages: {', '.join(source['urls'])}", f"  Licence: {name} ({url})"]
        if licence_id != source["licence_id"]:
            stated_name, stated_url = LICENCE_NAMES[source["licence_id"]]
            lines.append(f"  Licence stated by the publisher: {stated_name} ({stated_url}); handled here under the stricter licence above.")
        lines += [f"  Required wording: {text}" for text in source["required_text"]]
        lines.append(f"  Changes made: {changes_for(plans[asset['id']]['kind'])}")
        for input_id in asset["computed_with_source_ids"]:
            if input_id != source_id:
                lines.append(f"  Used to compute, not redistributed: {registry.sources[input_id]['name']}")
        lines.append("")
    return "\n".join(lines)


def share_alike_licence_text() -> str:
    name, url = LICENCE_NAMES["cc-by-sa-4.0"]
    return (f"The files in this folder are adapted material licensed under the {name} licence.\n"
            f"Licence text: {url}legalcode\n\nYou may share and adapt them, including commercially, provided you give credit as set out in "
            "NOTICE.txt, indicate changes, and distribute your contributions under the same licence, with no further restrictions.\n")
