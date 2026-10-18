# The evidence schema cannot express species, and what was done about it

**Batch:** 2026-10-18 · **Task:** T-074 (epic E-OPTOGEN, ask A-046) · **Ledger item:** `optogen2-find-001`
**Status:** gap recorded; a field was added; the ruling it implies is OPEN and owed to the repository owner.

## The gap

`datalake/qtara-registrar.json` carries `techniques[].evidence.tier`, which is canonical. Its vocabulary is
defined in `src/lib/evidence-tiers.ts` as seven codes in four visual groups:

```
validated_rct · validated_replication | demonstrated_lab · demonstrated_case
theoretical_modeled · theoretical_proposed | speculative
```

Every code grades **how strong** a result is. None names **what organism it was obtained in**, and
`EVIDENCE_TIER_GROUP` maps `demonstrated_lab` to the group label `Demonstrated`, which is what the site
renders.

The `evidence` object's only other populated fields are `basis` (a sentence naming which legacy status the
tier followed from), `population` (which counts CVE provenance, not biology), and the two CVE counts. A
string search of the whole registrar for `species` returns nothing.

So, before this batch, these three statements were indistinguishable in the data:

- an effect obtained in a vinegar fly by shining light on the whole animal;
- an effect obtained in a mouse requiring a transgenic line, a viral injection and an implanted fibre;
- an effect obtained in a person.

63 of 176 techniques are `demonstrated_lab`.

This matters most where the cognitive metrics are high. QIF-T0054 carries `CR:C` and `CD:C`, the registrar's
two highest cognitive values, and every causal result behind it is from a laboratory animal.

## Why no tier was changed

Two options existed.

**Move a tier so that it encodes species.** Rejected. There is no rung for "demonstrated, in a fly", and
adding one, or demoting animal results to a theoretical tier, would change what every other entry's tier
means — including the 113 entries that have nothing to do with biology. The strength scale would stop being a
strength scale. Tagging animal work in a way that reads as human-demonstrated is the more misleading of the
two failures, but corrupting the scale to avoid it is also a failure.

**Record the species in its own field and leave the tier as derived.** Taken.

`tara.clinical` already carries `evidence_level`, which grades the *therapeutic analog's* evidence on a
clinical scale whose weakest value is `preclinical` ("Animal or in-vitro studies"). Two descriptive fields
were added beside it, documented through the registrar's existing `schema_extensions` mechanism:

| Field | Holds |
|---|---|
| `tara.clinical.species_of_evidence` | The organism the causal evidence comes from, and an explicit statement of whether a human equivalent is established |
| `tara.clinical.preparation` | What the cited work required to obtain the effect: genetic modification, injected agent, implanted hardware, surgical access, or none |

Neither field is scored. Neither changes `evidence.tier`, `niss` or `severity`. Applied by
`src/scripts/migrate-species-of-evidence-optogenetics.py` to QIF-T0137, QIF-T0054 and QIF-T0060.

## What is still owed

1. **Should the tier vocabulary gain a species dimension?** A second axis (for example, a required
   `evidence.species` enum on any entry whose tier is in the `demonstrated` group) would make the
   distinction queryable and would surface on the site, which two free-text fields on `tara.clinical` do
   not. That is a change to a canonical vocabulary consumed by `src/lib/evidence-tiers.ts`, the KQL tables,
   the Python SDK and the STIX export, so it is a decision rather than an edit.
2. **Can animal-only causal evidence support `CR:C` or `CD:C`?** QIF-T0054 does today. The NISS vector was
   deliberately not changed here; `niss_spec` says nothing about species, so there is no published rule to
   apply and guessing one would be worse than leaving the question visible.
3. **Does the site need to display species where it displays the tier?** Two of the three enriched entries
   are `theoretical`, so the "Demonstrated" label is not currently misleading for them. QIF-T0137 is
   `demonstrated_lab` and renders as "Demonstrated" with no organism.

## What was deliberately not done

No tier was promoted or demoted. No NISS metric was invented or re-derived. No new technique, region,
pathway, hazard or identifier scheme was minted. The species fields were written without any word the atlas
knows for a brain structure, so the technique-region curation record in
`datalake/scripts/technique-region-curation.json` needed no change and
`node datalake/scripts/draft-technique-regions.mjs --check` stays clean.
