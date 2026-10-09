# Atlas pipeline

Turns openly licensed human brain atlases into the meshes the TARA Brain Atlas draws. It runs on a developer machine with one command and is never run in CI. What CI does check is what this pipeline commits: the vitest guards under `src/lib/anatomy/__tests__/` re-verify every committed file against the manifest.

All anatomy mappings and licence readings behind these assets were drafted by AI. No neuroanatomist and no lawyer has checked them.

## Run it

```
npm run atlas:fetch      # download and verify every pinned input into the cache
npm run atlas:build      # build every buildable asset, the manifest, label tables and notices
npm run atlas:test       # the pipeline's own tests (pytest, synthetic fixtures only)
```

`src/scripts/atlas-pipeline/atlas.sh <command>` is what those scripts call. Other commands: `evidence` (recompute `evidence/registration-evidence.json`), `buildability` (rewrite `registry/buildability.json`), `register <setting>` (compute the registration under one setting into the cache).

| Variable | Meaning | Default |
|---|---|---|
| `ATLAS_CACHE_DIR` | Downloads, the archived transform, work files and review sheets. Outside git | `~/.cache/qinnovate-atlas` |
| `ATLAS_VENV_DIR` | The virtual environment, installed from `requirements.txt` with hashes | `$ATLAS_CACHE_DIR/venv` |

The build refuses to run when the pipeline or the registry has uncommitted changes, so the code hash in the manifest names a real state. `atlas.sh build --allow-dirty` is for development only.

## What it reads

- `datalake/qif-anatomy-sources.json` and `datalake/qif-anatomy-verdicts.json`: sources, pins of downloads, routes, licences, clearances. A source builds only when the rule in `atlas_pipeline/sources.py` says so; that rule is a second implementation of `assessBuildability` in `src/lib/anatomy/licence-rules.ts`, and `registry/buildability.json` holds its answers so a vitest test can compare the two.
- `registry/pipeline-inputs.json`: download hosts, which members to read from an archive, the archived registration with its pins, and the build plan.

## What it writes

- `src/site/atlas-assets/open/` and `by-sa/`: content-hashed `.glb` files, one label table per atlas, `NOTICE.txt` per folder, `LICENSE.txt` in `by-sa/`.
- `src/site/atlas-assets/manifest.json`.
- `evidence/build-report.json`: per-structure measurements the manifest has no field for (triangle counts, decimation, volume drift, surface distance, markers, overlaps between atlases).
- `$ATLAS_CACHE_DIR/review/`: one sheet per shape, its outline on the template T1 in three planes. Not committed. A person should look at each before an asset merges.

## Stages

1. **Fetch.** HTTPS only, hosts from the inputs file, sha256 pinned in the registry, size capped. Archives are never unpacked wholesale: only named members are read, each written under a plain file name and checked against its own pin.
2. **Headers.** Every volume is read through its affine and reoriented to RAS. A file with neither sform nor qform is refused.
3. **Route to MNI152NLin2009cAsym.** CIT168 arrives there. The hypothalamus atlas is on the same anatomy at 0.5 mm and is placed through its affine. The Allen atlas is drawn on the symmetric template and goes through one computed registration.
4. **Mesh.** Marching cubes on the probability field, or on a lightly smoothed mask; Taubin smoothing; quadric decimation. Shapes are meshed on their native grid and then decimated, because a coarser meshing grid shrinks thin shapes and decimation does not.
5. **Write.** Geometry-only GLB with normalised int16 positions (`KHR_mesh_quantization`), no normals, materials or textures; ids in node `extras`. Coordinates are RAS millimetres in the declared space.

## The registration

Moving image: the MNI 2009b symmetric T1, the Allen atlas's own template. Fixed image: the MNI 2009c asymmetric T1. ANTs SyN through `antspyx`, cross-correlation metric, full-resolution iterations, fixed seed. The transform is **archived, not recomputed**: its files live in `$ATLAS_CACHE_DIR/transforms/allen_2009bsym_to_2009casym/` and their hashes are pinned in `registry/pipeline-inputs.json`. A build stops if the files are missing or differ. A recomputation is not promised to be byte-identical; if one is needed, run `register`, copy the files into the archive directory, and change the pins in a reviewed diff. Where the archive is kept durably is an open question for the owner.

Evidence is independent of what the registration optimises (`evidence/registration-evidence.json`):

- **V1.** Share of Allen gyral-label voxels in the declared template's grey matter, per hemisphere: the intended transform under three parameter settings, the header-only placement, and seeded faults applied in output space (2 mm shift on each axis, mirror after the transform, the inverse applied the wrong way).
- **V2.** 95th-percentile surface distance between warped Allen deep structures and the same structures from CIT168, per side, for the same variants.
- **Noise** is the spread across the three settings. The transform counts as better only when its gain over the header-only placement exceeds that spread.
- A mirror applied before the transform is not run: the moving image is symmetric and its labels are a mirrored pair with shared ids, so it changes nothing.

Result on the committed evidence: V1 is better beyond noise on both hemispheres; V2 is not distinguishable from the header-only placement. So cortical shapes carry `position_check: "independently checked"` and deep Allen shapes carry `"not independently checked"`; about 1 mm of placement uncertainty should be stated for them.

## Size classes

Computed per structure on the thresholded mask, in voxels of the coarser of the atlas grid and the underlying acquisition. The thresholds are an engineering rule, not literature values.

| Class | Rule | Ships as |
|---|---|---|
| resolved | shortest principal extent at least 4 voxels and at least 100 voxels | mesh |
| coarse | between the other two | mesh; the scene draws it in the approximate style |
| unresolved | under 2 voxels across, or under 20 voxels | a marker (centroid and nominal radius in the build report); never a mesh |

## What no check here can detect

An error the publisher made before distribution; two same-side labels swapped in a publisher's table unless a second source has both; boundary differences that are a matter of definition; anything below one source voxel; whether a crosswalk row names the right structure. Left-right correctness for the Allen atlas rests on its header and on it having no side ids: one hemisphere was drawn and the right side is its mirror.

## Cannot be automated

The first pin of each download; looking at the review sheets; reviewing AI-drafted rows; reading a publisher's page when a space or licence is unstated; accepting any agreement (owner only).

## Layout

```
atlas.sh                 runner: virtual environment, then one command
atlas_build.py           entry point (run with python -I)
requirements.in/.txt     pinned and hash-locked; requirements-dev for pytest
registry/                pipeline-inputs.json, buildability.json
evidence/                registration-evidence.json, build-report.json
atlas_pipeline/
  sources.py             registry, verdicts, the buildability rule
  fetch.py  headers.py  volumes.py
  structures.py          one structure per label and side, per source kind
  registration.py        compute, archive check, apply (volumes only)
  meshing.py  glb.py
  checks.py  evidence.py  overlap.py
  build.py  manifest.py  notices.py  outputs.py  overlays.py  cli.py
tests/                   pytest, synthetic fixtures only
```
