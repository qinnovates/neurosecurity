# Atlas pipeline

Turns openly licensed human brain atlases into the meshes the TARA Brain Atlas draws. It runs on a developer machine with one command and is never run in CI. What CI does check is what this pipeline commits: the vitest guards under `src/lib/anatomy/__tests__/` re-verify every committed file against the manifest.

All anatomy mappings and licence readings behind these assets were drafted by AI. No neuroanatomist and no lawyer has checked them.

## Run it

```
npm run atlas:fetch      # download and verify every pinned input into the cache
npm run atlas:build      # build every buildable asset, the manifest, label tables and notices
npm run atlas:test       # the pipeline's own tests (pytest)
```

`src/scripts/atlas-pipeline/atlas.sh <command>` is what those scripts call. Other commands: `devices` (landmarks and the electrode layout, see Devices below), `evidence` (recompute `evidence/registration-evidence.json`), `buildability` (rewrite `registry/buildability.json`), `register <setting>` (compute the registration under one setting into the cache).

| Variable | Meaning | Default |
|---|---|---|
| `ATLAS_CACHE_DIR` | Downloads, the archived transform and work files. Outside git | `~/.cache/qinnovate-atlas` |
| `ATLAS_VENV_DIR` | The virtual environment, installed from `requirements.txt` with hashes | `$ATLAS_CACHE_DIR/venv` |

The build refuses to run when the pipeline or the registry has uncommitted changes, so the code hash in the manifest names a real state. `atlas.sh build --allow-dirty` is for development only.

The pull-request workflow runs the tests that need only the standard library and pytest: the buildability rule against the registry (`test_sources.py`), the fetch rules (`test_fetch.py`), the notices (`test_notices.py`), and the committed manifest against the registry, the build plan and the pipeline's code hash (`test_manifest_records.py`). The meshing, registration and GLB tests need the imaging stack and skip themselves there; run them locally.

## What it reads

- `datalake/qif-anatomy-sources.json` and `datalake/qif-anatomy-verdicts.json`: sources, pins of downloads, routes, licences, clearances. A source builds only when the rule in `atlas_pipeline/sources.py` says so; that rule is a second implementation of `assessBuildability` in `src/lib/anatomy/licence-rules.ts`, and `registry/buildability.json` holds its answers so a vitest test can compare the two.
- `registry/pipeline-inputs.json`: download hosts, which members to read from an archive, the archived registration with its pins, and the build plan.

## What it writes

- `src/site/atlas-assets/open/` and `by-sa/`: content-hashed `.glb` files, one label table per atlas, `NOTICE.txt` per folder, `LICENSE.txt` in `by-sa/`.
- `src/site/atlas-assets/manifest.json`, which also lists the sha256 of every notice, license text and label table, so none can be edited by hand unnoticed.
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
- **Spread** is the range of each measure across the three parameter settings. It measures how sensitive the result is to those settings; it is not sampling noise. The transform counts as better only when its gain over the header-only placement exceeds that spread.
- The grey-matter map used by V1 is the declared template's own, the same template the registration targets. V1 is pooled over all gyral labels per hemisphere; the evidence file also records it per label and side, and lists the label-sides that score lower after the registration.
- A mirror applied before the transform is not run: the moving image is symmetric and its labels are a mirrored pair with shared ids, so it changes nothing.

Result on the committed evidence: V1 is better beyond the spread on both hemispheres, pooled; V2 is not distinguishable from the header-only placement. So the cortex asset carries `position_check: "checked in aggregate"` (shown for the cortex as a whole, not for each fold) and deep Allen shapes carry `"not independently checked"`, with the V2 check recorded as `not_distinguishable`. The deep shapes are warped all the same, so that one transform keeps them coherent with the adjacent gyri; against CIT168 they differ by the range the evidence file records (the 95th-percentile surface distance of each shared structure and side; 0.7 to 2.5 mm on the committed evidence). That range is computed from the evidence file into the modification note, never typed. A check that reads `fail` stops the build; none is exempt.

Labels are resampled nearest-neighbour through the transform, not by argmax over one-hot maps.

## Devices

`atlas.sh devices` runs after a build. It does three things on the head surface asset (`scalp`, on the `devices` layer, made from the template's T1-weighted image):

1. **Finds four landmarks by written rules** (`atlas_pipeline/fiducials.py`): the nasion as the deepest hollow between brow and nose on the front midline; the inion as the highest back midline point where the soft tissue over the skull reaches 1.5 times the scalp's thickness; each preauricular point as the centre of the hollow in front of the ear's ridge. These are placements on an average head, made by code. The average blurs skin landmarks and the skin does not show the inion. Nobody has checked them.
2. **Places the 21 positions of the 10-20 layout** (`electrodes.py`, `scalp_arcs.py`) at shares of the measured length of arcs over the scalp, in the order the system defines: midline, ear to ear through Cz, the two half-circumferences, then the frontal and parietal arcs. The earlobe positions A1 and A2 are not placed: the average head has no usable earlobe.
3. **Checks the layout on the shipped mesh with separate code** (`arc_checks.py`, `layout_checks.py`, standard library only): every position within 1 percent of its share of its arc, Cz at the middle of the ear-to-ear arc, left names on the left, mirror pairs as close as the head's own measured asymmetry allows, every point within 2 mm of the surface. A layout made at equal angles about each arc's centre fails these checks; the record lists how far each position would move.

It writes `evidence/device-placement.json` (what each rule measured, the arcs, the checks on the shipped mesh, how far the positions move when the inion is put 5 mm higher or lower, and under `landmark_sensitivity` how far Oz moves when the inion is put 15 mm higher or lower and how far the near temporal position and Cz move when one ear point is moved 5 mm forward, back, up or down and set back on the skin) and the landmark and electrode rows of `datalake/qif-anatomy-device-geometry.json`. The layout is written with `shown_by_default: false`: it is drawable, with its unreviewed state, but off until a reader turns it on. Lead rows and sourced facts in that file are written by hand and are kept. Review sheets go to `review/devices/` in the cache: one per landmark on the template image, and one of the layout on the mesh from five sides.

The landmark record in the data file also carries the head surface's sha256 and a **placement digest** over that hash, the method's parameters and every coordinate. A standard-library test recomputes it from the committed files, so a coordinate edited by hand fails in CI. A match shows the coordinates are the ones a pipeline run wrote for this head surface. The site's index does not recompute this digest: its `drawable` flag for a layout checks the head surface's sha256 only, and the layout's evidence row says so. It does not show that the rules find the right anatomy; each landmark row says in its `confidence_note` how far its rule can be trusted, and three of the four read "Weak".

Nothing here says what brain tissue lies under an electrode. No nearest region is computed, and a lead has sizes and sources but no position.

## Size classes

Computed per structure on the thresholded mask, in voxels of the coarser of the atlas grid and the underlying acquisition. The thresholds are an engineering rule, not literature values.

| Class | Rule | Ships as |
|---|---|---|
| resolved | shortest principal extent at least 4 voxels and at least 100 voxels | mesh |
| coarse | between the other two | mesh; the scene draws it in the approximate style |
| unresolved | under 2 voxels across, or under 20 voxels | a marker (centroid and nominal radius in the build report); never a mesh |

## Rebuild pending

`registry/rebuild-pending.json` records that the pipeline changed after the shipped assets were built. The manifest keeps the hash they were really built under. The test accepts only the exact pair in that file, so any further change fails until reviewed. Delete the file after a rebuild.

## Ingest checks

Third-party files are checked before the pipeline uses them.

- Every download is verified against a SHA-256 value recorded in advance, and its size is capped.
- Files are screened for known malware in an isolated container that has no network access. `npm run ingest:scan` runs the screen over the ingested files and the built assets.
- `datalake/source-hashes.json` publishes the SHA-256 of every file we have ingested, so anyone can compare their own copy. A match shows the same bytes we ingested. It does not show that the publisher's copy is safe or authentic.
- `npm run datalake:hashes:verify` compares local copies with those values and makes no network request. `npm run datalake:hashes:check` fails if the published file is stale.

A malware screen matches known signatures only, so a clean result is not proof that a file is safe.

## What no check here can detect

An error the publisher made before distribution; two same-side labels swapped in a publisher's table unless a second source has both; boundary differences that are a matter of definition; anything below one source voxel; whether a crosswalk row names the right structure. Left-right correctness for the Allen atlas rests on its header and on it having no side ids: one hemisphere was drawn and the right side is its mirror.

## Cannot be automated

The first pin of each download; reviewing AI-drafted rows; reading a publisher's page when a space or licence is unstated; accepting any agreement (owner only). Review-sheet generation (visual QA for registration/placement accuracy) was removed 2026-10-27 to drop the Pillow dependency; the layout checks (`layout_checks.py`, standard library only) are the automated substitute for layout/placement correctness, and the already-archived sheets at `<staging>/2026-10-atlas-geometry/pr-sheets/` are historical record only, not regenerable.

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
  codehash.py  registration_settings.py   standard library only
  build.py  manifest.py  notices.py  outputs.py  cli.py
tests/                   pytest, synthetic fixtures only
```
