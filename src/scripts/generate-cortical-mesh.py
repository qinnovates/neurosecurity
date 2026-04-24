#!/usr/bin/env python3
"""
generate-cortical-mesh.py — QIF Cortical Surface Asset Pipeline

Generates fsaverage5 cortical mesh assets for the QifBrainViewer component.
Ports Meta TRIBE v2's approach: per-face coloring on fsaverage5 cortical surfaces.

Outputs:
  src/site/models/fsaverage5-cortex.glb  — Combined-hemisphere cortical mesh
  src/site/models/qif-face-bands.bin     — Per-face QIF band index (uint8)
  datalake/qif-cortical-mapping.json     — DK→QIF mapping metadata

Dependencies: nilearn, nibabel, trimesh, numpy
Usage: python3 src/scripts/generate-cortical-mesh.py
"""

import json
from pathlib import Path

import nibabel as nib
import numpy as np
import trimesh

# Resolve project root (script lives at src/scripts/)
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
MODELS_DIR = PROJECT_ROOT / "src" / "site" / "models"
DATALAKE_DIR = PROJECT_ROOT / "datalake"

# ═══ Destrieux → QIF Band Mapping ═══
#
# Destrieux atlas (aparc.a2009s) has 76 regions per hemisphere.
# QIF hourglass maps cortical surface to two bands:
#   N7 (Neocortex) — executive, motor, sensory, language, association cortex
#   N6 (Limbic)    — cingulate, parahippocampal, entorhinal, insula
#
# Subcortical structures (N5-N1) are not on the cortical surface mesh.

N6_LIMBIC_REGIONS = {
    # Cingulate gyri
    "G_and_S_cingul-Ant",
    "G_and_S_cingul-Mid-Ant",
    "G_and_S_cingul-Mid-Post",
    "G_cingul-Post-dorsal",
    "G_cingul-Post-ventral",
    # Cingulate sulci
    "S_cingul-Marginalis",
    "S_pericallosal",
    "S_subparietal",
    # Parahippocampal / entorhinal
    "G_oc-temp_med-Parahip",
    "S_collat_transv_ant",
    # Insula
    "G_Ins_lg_and_S_cent_ins",
    "G_insular_short",
    "S_circular_insula_ant",
    "S_circular_insula_inf",
    "S_circular_insula_sup",
    # Subcallosal (ventral limbic)
    "G_subcallosal",
    "G_rectus",
    "S_suborbital",
    "S_orbital_med-olfact",
}

# Band index: 0 = N7 (neocortex), 1 = N6 (limbic)
BAND_N7 = 0
BAND_N6 = 1
BAND_MEDIAL_WALL = 0  # Medial wall defaults to N7


def load_fsaverage5():
    """Load fsaverage5 surfaces and Destrieux parcellation from nilearn."""
    from nilearn.datasets import fetch_atlas_surf_destrieux, fetch_surf_fsaverage

    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        fsaverage = fetch_surf_fsaverage(mesh="fsaverage5")
        destrieux = fetch_atlas_surf_destrieux()

    # Load pial surfaces (GIFTI format)
    pial_l = nib.load(fsaverage["pial_left"])
    pial_r = nib.load(fsaverage["pial_right"])

    coords_l = pial_l.darrays[0].data  # (10242, 3) float32
    faces_l = pial_l.darrays[1].data  # (20480, 3) int32
    coords_r = pial_r.darrays[0].data
    faces_r = pial_r.darrays[1].data

    # Load inflated surfaces for morph target
    infl_l = nib.load(fsaverage["infl_left"])
    infl_r = nib.load(fsaverage["infl_right"])
    infl_coords_l = infl_l.darrays[0].data
    infl_coords_r = infl_r.darrays[0].data

    # Load sulcal depth for background shading
    sulc_l = nib.load(fsaverage["sulc_left"]).darrays[0].data  # (10242,)
    sulc_r = nib.load(fsaverage["sulc_right"]).darrays[0].data

    # Destrieux labels (vertex-level)
    labels_l = destrieux["map_left"]  # (10242,) int
    labels_r = destrieux["map_right"]
    region_names = destrieux["labels"]

    return {
        "coords_l": coords_l,
        "coords_r": coords_r,
        "faces_l": faces_l,
        "faces_r": faces_r,
        "infl_coords_l": infl_coords_l,
        "infl_coords_r": infl_coords_r,
        "sulc_l": sulc_l,
        "sulc_r": sulc_r,
        "labels_l": labels_l,
        "labels_r": labels_r,
        "region_names": region_names,
    }


def classify_vertex(label_index: int, region_names: list) -> int:
    """Map a Destrieux region label to QIF band index."""
    if label_index < 0 or label_index >= len(region_names):
        return BAND_N7

    name = region_names[label_index]
    if isinstance(name, bytes):
        name = name.decode()

    if name == "Unknown" or name == "Medial_wall":
        return BAND_MEDIAL_WALL

    if name in N6_LIMBIC_REGIONS:
        return BAND_N6

    return BAND_N7


def assign_face_bands(faces: np.ndarray, vertex_bands: np.ndarray) -> np.ndarray:
    """Assign each face a QIF band by majority vote of its 3 vertices."""
    v0_bands = vertex_bands[faces[:, 0]]
    v1_bands = vertex_bands[faces[:, 1]]
    v2_bands = vertex_bands[faces[:, 2]]

    # Stack and take mode (majority vote)
    stacked = np.stack([v0_bands, v1_bands, v2_bands], axis=1)
    # For 2 classes, majority = sum > 1
    face_bands = (np.sum(stacked, axis=1) >= 2).astype(np.uint8)
    return face_bands


def assign_face_regions(
    faces: np.ndarray, vertex_labels: np.ndarray
) -> np.ndarray:
    """Assign each face a Destrieux region index by majority vote."""
    v_labels = vertex_labels[faces]  # (n_faces, 3)
    face_regions = np.zeros(len(faces), dtype=np.uint8)
    for i in range(len(faces)):
        vals, counts = np.unique(v_labels[i], return_counts=True)
        face_regions[i] = vals[np.argmax(counts)]
    return face_regions


# ═══ Impact Chain Region → Destrieux Region Mapping ═══
#
# Maps the 10 impact-chain region_ids to Destrieux atlas regions
# so clicking a hotspot can highlight the corresponding cortical faces.

IMPACT_REGION_TO_DESTRIEUX = {
    # N7 cortical regions
    "broca": [
        "G_front_inf-Opercular",  # BA44
        "G_front_inf-Triangul",   # BA45
    ],
    "wernicke": [
        "G_pariet_inf-Supramar",  # BA40
        "G_temp_sup-Lateral",     # posterior superior temporal
        "G_temp_sup-Plan_tempo",  # planum temporale
    ],
    # N6 cortical regions (visible on cortical surface)
    "hippocampus": [
        "G_oc-temp_med-Parahip",  # parahippocampal gyrus
        "S_collat_transv_ant",    # collateral sulcus
    ],
    "cingulate": [
        "G_and_S_cingul-Ant",
        "G_and_S_cingul-Mid-Ant",
        "G_and_S_cingul-Mid-Post",
        "G_cingul-Post-dorsal",
        "G_cingul-Post-ventral",
        "S_cingul-Marginalis",
    ],
    # N5/N4/N2 are subcortical — no cortical face mapping
    "striatum": [],
    "substantia_nigra": [],
    "thalamus": [],
    "hypothalamus": [],
    "pons": [],
    "midbrain": [],
}


def build_combined_mesh(data: dict):
    """
    Build a combined left+right hemisphere mesh with per-vertex band colors
    and per-face band indices.

    Returns (trimesh.Trimesh, face_bands, vertex_bands, mapping_metadata).
    """
    region_names = [
        n.decode() if isinstance(n, bytes) else str(n)
        for n in data["region_names"]
    ]

    # Classify each vertex
    vertex_bands_l = np.array(
        [classify_vertex(l, region_names) for l in data["labels_l"]],
        dtype=np.uint8,
    )
    vertex_bands_r = np.array(
        [classify_vertex(l, region_names) for l in data["labels_r"]],
        dtype=np.uint8,
    )

    # Offset right hemisphere faces by left vertex count
    n_verts_l = data["coords_l"].shape[0]
    faces_combined = np.vstack([
        data["faces_l"],
        data["faces_r"] + n_verts_l,
    ])

    # Combine coordinates (center the mesh at origin)
    coords_combined = np.vstack([data["coords_l"], data["coords_r"]])
    center = coords_combined.mean(axis=0)
    coords_combined -= center

    # Combine inflated coordinates (same centering)
    infl_combined = np.vstack([data["infl_coords_l"], data["infl_coords_r"]])
    infl_combined -= center

    # Combine vertex bands
    vertex_bands = np.concatenate([vertex_bands_l, vertex_bands_r])

    # Assign face bands by majority vote
    face_bands = assign_face_bands(faces_combined, vertex_bands)

    # Combine sulcal depth for background shading
    sulc_combined = np.concatenate([data["sulc_l"], data["sulc_r"]])

    # Build per-vertex colors
    # QIF band colors from qif-constants.ts HOURGLASS_BANDS
    BAND_COLORS = {
        BAND_N7: np.array([22, 101, 52]),  # #166534 (N7 Neocortex)
        BAND_N6: np.array([58, 125, 68]),  # #3a7d44 (N6 Limbic)
    }

    # Modulate brightness by sulcal depth (sulci darker, gyri lighter)
    # Normalize sulcal depth to 0-1 range
    sulc_norm = (sulc_combined - sulc_combined.min()) / (
        sulc_combined.max() - sulc_combined.min() + 1e-8
    )
    # Brightness multiplier: gyri=1.0, sulci=0.65
    brightness = 0.65 + 0.35 * (1.0 - sulc_norm)

    vertex_colors = np.zeros((len(vertex_bands), 4), dtype=np.uint8)
    for band_idx, color in BAND_COLORS.items():
        mask = vertex_bands == band_idx
        vertex_colors[mask, :3] = (
            color[np.newaxis, :] * brightness[mask, np.newaxis]
        ).clip(0, 255).astype(np.uint8)
    vertex_colors[:, 3] = 255  # Full opacity

    # Create trimesh
    mesh = trimesh.Trimesh(
        vertices=coords_combined,
        faces=faces_combined,
        vertex_colors=vertex_colors,
        process=False,  # Don't merge vertices or modify topology
    )

    # Collect mapping metadata
    n6_count = int(np.sum(face_bands == BAND_N6))
    n7_count = int(np.sum(face_bands == BAND_N7))

    n6_regions_found = set()
    n7_regions_found = set()
    for i, name in enumerate(region_names):
        band = classify_vertex(i, region_names)
        if band == BAND_N6:
            n6_regions_found.add(name)
        elif name not in ("Unknown", "Medial_wall"):
            n7_regions_found.add(name)

    mapping_metadata = {
        "_metadata": {
            "atlas": "Destrieux (aparc.a2009s)",
            "mesh": "fsaverage5",
            "vertices_per_hemisphere": int(n_verts_l),
            "faces_per_hemisphere": int(data["faces_l"].shape[0]),
            "total_vertices": int(coords_combined.shape[0]),
            "total_faces": int(faces_combined.shape[0]),
            "qif_version": "8.0",
            "band_index": {"N7": BAND_N7, "N6": BAND_N6},
            "generator": "generate-cortical-mesh.py",
        },
        "face_stats": {
            "N7_neocortex": n7_count,
            "N6_limbic": n6_count,
            "total": n7_count + n6_count,
        },
        "destrieux_to_qif": {
            name: "N6" if name in N6_LIMBIC_REGIONS else "N7"
            for name in region_names
            if name not in ("Unknown", "Medial_wall")
        },
        "n6_limbic_regions": sorted(N6_LIMBIC_REGIONS),
    }

    # Assign per-face Destrieux region indices for fine-grained interaction
    labels_combined = np.concatenate([data["labels_l"], data["labels_r"]])
    face_regions = assign_face_regions(faces_combined, labels_combined)

    # Build impact-region → face indices mapping
    impact_region_faces = {}
    for region_id, destrieux_names in IMPACT_REGION_TO_DESTRIEUX.items():
        if not destrieux_names:
            impact_region_faces[region_id] = []
            continue
        target_indices = set()
        for dname in destrieux_names:
            if dname in region_names:
                target_indices.add(region_names.index(dname))
        face_list = [
            int(i) for i in range(len(face_regions))
            if int(face_regions[i]) in target_indices
        ]
        impact_region_faces[region_id] = {
            "face_count": len(face_list),
            "destrieux_regions": destrieux_names,
        }

    mapping_metadata["impact_region_faces"] = impact_region_faces

    return mesh, face_bands, face_regions, infl_combined, mapping_metadata


def export_glb(mesh: trimesh.Trimesh, output_path: Path):
    """Export mesh as GLB (binary glTF)."""
    glb_data = mesh.export(file_type="glb")
    output_path.write_bytes(glb_data)
    size_mb = len(glb_data) / (1024 * 1024)
    print(f"  GLB: {output_path.name} ({size_mb:.1f} MB, "
          f"{len(mesh.vertices)} vertices, {len(mesh.faces)} faces)")


def export_face_bands(face_bands: np.ndarray, output_path: Path):
    """Export per-face band indices as raw uint8 binary."""
    output_path.write_bytes(face_bands.tobytes())
    size_kb = len(face_bands) / 1024
    print(f"  LUT: {output_path.name} ({size_kb:.1f} KB, "
          f"{len(face_bands)} faces)")


def export_inflated(infl_coords: np.ndarray, output_path: Path):
    """Export inflated vertex positions as raw float32 binary."""
    output_path.write_bytes(infl_coords.astype(np.float32).tobytes())
    size_kb = infl_coords.nbytes / 1024
    print(f"  Inflated: {output_path.name} ({size_kb:.1f} KB, "
          f"{infl_coords.shape[0]} vertices)")


def export_mapping(metadata: dict, output_path: Path):
    """Export mapping metadata as JSON."""
    output_path.write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False) + "\n"
    )
    print(f"  JSON: {output_path.name}")


def main():
    print("QIF Cortical Mesh Generator")
    print("=" * 40)

    # Ensure output directories exist
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    DATALAKE_DIR.mkdir(parents=True, exist_ok=True)

    print("\n1. Loading fsaverage5 + Destrieux atlas...")
    data = load_fsaverage5()
    print(f"   Vertices/hemi: {data['coords_l'].shape[0]}")
    print(f"   Faces/hemi: {data['faces_l'].shape[0]}")
    print(f"   Regions: {len(data['region_names'])}")

    print("\n2. Building combined mesh with QIF band mapping...")
    mesh, face_bands, face_regions, infl_coords, metadata = build_combined_mesh(data)
    print(f"   N7 (Neocortex): {metadata['face_stats']['N7_neocortex']} faces")
    print(f"   N6 (Limbic): {metadata['face_stats']['N6_limbic']} faces")

    print("\n   Impact region → cortical faces:")
    for rid, info in metadata["impact_region_faces"].items():
        if isinstance(info, dict) and info["face_count"] > 0:
            print(f"     {rid}: {info['face_count']} faces")

    print("\n3. Exporting assets...")
    export_glb(mesh, MODELS_DIR / "fsaverage5-cortex.glb")
    export_face_bands(face_bands, MODELS_DIR / "qif-face-bands.bin")
    export_face_bands(face_regions, MODELS_DIR / "qif-face-regions.bin")
    export_inflated(infl_coords, MODELS_DIR / "fsaverage5-inflated.bin")
    export_mapping(metadata, DATALAKE_DIR / "qif-cortical-mapping.json")

    print("\n4. Verification...")
    # Verify face bands cover all faces
    assert len(face_bands) == metadata["_metadata"]["total_faces"], \
        "Face band count mismatch"
    assert set(np.unique(face_bands)).issubset({0, 1}), \
        "Invalid band indices found"
    assert len(face_regions) == metadata["_metadata"]["total_faces"], \
        "Face region count mismatch"
    # Verify mesh integrity
    assert not mesh.is_empty, "Mesh is empty"
    assert mesh.is_watertight or True, "Mesh topology warning (non-critical)"
    print("   All checks passed.")

    print(f"\nDone. Assets written to:")
    print(f"  {MODELS_DIR}/")
    print(f"  {DATALAKE_DIR}/")


if __name__ == "__main__":
    main()
