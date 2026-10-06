# TARA refresh decisions, October 2026

Generated 2026-10-06. Machine-readable version: `decisions.json`. Nothing outside `_staging/2026-10-refresh/` was written.
Deliberation: the `quorum` skill was invoked and its protocol run with six independent panelists (threat-taxonomy
maintainer, BCI engineer/neuroscientist, research-integrity specialist, product owner, plus two adversaries holding
authentic opposed positions: "this still overclaims" and "this gates on the wrong axis"), followed by supervisor
triage and cross-review. Every panelist worked from one shared evidence pack and from the same option set.

**Confidence rule used here:** the score states the probability that the option is the right one, and it is driven by
evidence, not by how many personas agreed. Where the panel converged but nothing was verified, the score is capped and
says so. Three of the four decisions are judgement calls about a labelling policy; only D4 rests on facts verified in
this run.

## Summary

| Decision | Recommended | Confidence | Runner-up | Confidence |
|---|---|---|---|---|
| D1 What counts as DEMONSTRATED | D1-D two-part label: four statuses + mandatory `evidence_basis`, with basis matched to the technique's own attack surface | 0.72 | D1-A strict (hardware/participant only) | 0.55 |
| D2 Can a preprint exceed EMERGING | D2-C corroboration only: a preprint may be a second source, never the sole basis above EMERGING | 0.62 | D2-D conditional (full text read + public artefacts, flagged provisional) | 0.52 |
| D3 Which candidates to add | D3-B add the four distinct ones, fold five as evidence on existing entries, hold two; 165 -> 169 | 0.78 | D3-A add ten (165 -> 175) | 0.30 |
| D4 Legislation entries | Field-level correction: replace Montana SB 214 with SB 163; mark ISO/IEC 8663:2025 **verified**; keep Connecticut with only its identifiers flagged | 0.93 | Blanket entry-level flagging (the original leaning) | 0.35 |

D2 is the one decision where the top two options sit within 0.15 (0.62 vs 0.52). It is also the decision that changes
nothing in this refresh: no panelist and no agent read the full text of any candidate preprint, so under either option
every preprint-only item lands at EMERGING or below today. The choice matters for T0108 and for future refreshes.

---

## Decision 1 — What should count as DEMONSTRATED

### Context not in the original framing

The premise "the status values have no written definition" is **wrong, and that matters**. Definitions do exist, in
three places, and they disagree with each other:

- `datalake/README.md`: CONFIRMED "Demonstrated in real BCI systems or documented incidents"; DEMONSTRATED "Proven in
  research/lab settings"; THEORETICAL "Physically plausible, not yet demonstrated"; EMERGING "Recently identified,
  under active research" — a recency label, not an evidence level, which is why "simulation stays EMERGING" is not yet
  a meaningful rule.
- `src/lib/evidence-tiers.ts`: maps CONFIRMED down to the "demonstrated" group ("confirmed != peer-reviewed; best we
  can claim is demonstrated") and EMERGING to "speculative"; it places simulation under THEORETICAL.
- `src/pages/atlas/tara/[id].astro`: maps CONFIRMED up to `validated_replication` and EMERGING to `demonstrated_case`.

And the status is not only a label: `datalake/scripts/transform-registry.py` turns it into an exported CVSS v4 exploit
maturity — CONFIRMED becomes **E:A**, DEMONSTRATED becomes **E:P**. CVSS v4.0 defines E:A as "Attacks targeting this
vulnerability (attempted or successful) have been reported" and E:P as "Proof-of-concept exploit code is publicly
available". No CONFIRMED entry in the registrar cites an in-the-wild attack on a neural device, so the catalog is
currently exporting 27 machine-readable "Attacked" claims that a reviewer can falsify from the CVSS spec itself. Five
of six panelists raised this independently; it is the highest-severity finding of the deliberation and it means the
rubric cannot ship without the mapping change beside it.

An in-repo audit (`governance/outreach/DRBRYCE-QIF-CROSSREFERENCE.md`) had already reached the same diagnosis:
"The CONFIRMED status label conflates two different things ... 'the underlying phenomenon is documented in the
literature' and 'this has been demonstrated as an attack against a neural interface'", and recommended two axes.

### Options

**D1-A — strict.** DEMONSTRATED requires the attack run end to end against a physical device or live system;
dataset-only results drop to EMERGING.
- For: it is the only option under which the exported E:P is defensible for every DEMONSTRATED entry, and it matches
  what a device maker hears in the word "demonstrated".
- Against: when the decoder *is* the attacked system (membership inference, poisoning, model stealing), an offline
  attack on real recordings is the attack; D1-A systematically under-labels the whole ML half of the catalog, and
  demotes T0016–T0019, which are among the best-sourced entries.

**D1-B — current leaning.** Real hardware or real recordings both qualify; simulation-only stays EMERGING.
- For: cheapest to apply, and it keeps the existing dataset-backed entries where they are.
- Against: it lets a dataset result claim the same label as Armengol-Urpi's over-the-air injection into three device
  classes, and then exports both as E:P. MITRE ATLAS draws exactly this line the other way: "Feasible – the technique
  has been shown to work in a research or academic setting"; "Demonstrated – ... effective in a red team exercise or
  demonstration on a realistic AI-enabled system". Under ATLAS's vocabulary, D1-B's DEMONSTRATED is Feasible. It also
  leaves "simulation stays EMERGING" toothless while EMERGING still means "recently identified".

**D1-C — permissive.** Any published empirical or simulation result is DEMONSTRATED.
- For: nothing to adjudicate; no curator judgement required.
- Against: it would make the word meaningless, puts the project in direct conflict with its own rule that a technique
  "must distinguish between what is technically possible today and what is projected", and would raise the exported
  E:P count sharply. No panelist supported it.

**D1-D — two-part label (recommended).** Keep four statuses, collapse PLAUSIBLE and SPECULATIVE into THEORETICAL, and
require every entry to carry `evidence_basis` ∈ {incident, hardware, participant, dataset, simulation, adjacent,
review, none}, with a written rule for which basis can reach which level — **the basis must match the attack surface
the technique itself names.**
- For: it is the only option that separates the two questions the single ladder is being asked to answer (how strong is
  the evidence, and how close is it to a real device), which is the defect the in-repo audit already identified and
  which the current 43-entry DEMONSTRATED bucket demonstrates: it holds hardware attacks, dataset ML attacks,
  simulation-only (T0025), preprint-only (T0108) and one entry with zero sources (T0113) under one word.
- Against: it is a schema change, not a relabel. The registrar has no field for the attack's evidence level (its only
  `evidence_level` is clinical), the refresh brief says new fields go in a `proposed_fields` note rather than into
  entries, and the TypeScript `Status` type admits four values while the data holds six. Until the site projection and
  `transform-registry.py` read the new field, a reader still sees one word — so adopting D1-D without the downstream
  change buys nothing.

### Recommendation

**D1-D, with the surface-matching rule, shipped in the same release as a new exploit-maturity mapping.** All six
panelists chose D1-D. That unanimity is *not* the basis of the score: it is a design judgement, and the panel split on
the threshold inside it (whether dataset-only evidence may reach DEMONSTRATED when the model is the target — four say
yes, the strict adversary says never, one says yes but it must not count in the headline). The score reflects that the
diagnosis is verified (the inconsistent bucket, the three contradictory in-repo mappings, the false E:A export) while
the chosen threshold is a judgement.

**Confidence: 0.72** — based on established practice quoted from primary sources (MITRE ATLAS maturity definitions,
CVSS v4.0 Exploit Maturity, SSVC, ATT&CK's in-the-wild rule) plus facts verified in the repo in this run; the
specific placement of the dataset threshold is judgement, and the schema cost is real and unfunded.

**What would change the recommendation:** (a) evidence that API consumers, the site projection and
`transform-registry.py` cannot read an added field without a breaking version — then D1-A becomes the safer answer,
since a single strict ladder is better than a qualifier nobody sees; (b) two curators independently assigning
`evidence_basis` to the 43 DEMONSTRATED entries and disagreeing on more than 10% — that would mean the rubric is not
mechanically applicable and needs narrower wording; (c) full text of a dataset-only evasion paper showing its
perturbation survives a real analog front end (electrode impedance, filtering, artifact rejection) — that would
justify letting dataset evidence reach DEMONSTRATED for physical-surface techniques too.

### Exact wording to adopt

Paste into the catalog documentation (and mirror into `datalake/README.md`, replacing the current one-line table).

> **How TARA grades evidence**
>
> A technique's `status` grades the evidence that **an adversary's action produces the effect this technique names**.
> Evidence that the underlying physical or biological phenomenon exists is not evidence of the attack. Every entry also
> carries an `evidence_basis`: one of `incident`, `hardware`, `participant`, `dataset`, `simulation`, `adjacent`
> (shown only on non-neural targets), `review`, or `none`. The basis records what was actually done; the status records
> how far that gets. The governing rule is that **the basis must match the attack surface the technique names**: for a
> technique whose surface is physical (signal acquisition, stimulation, tissue, radio, a worn or implanted device), only
> `hardware` or `participant` evidence can reach DEMONSTRATED; for a technique whose surface is a model or a data
> pipeline (inference, poisoning, evasion, model theft), `dataset` evidence on real neural recordings can reach
> DEMONSTRATED. An entry that describes more than one mechanism takes the status of its weakest mechanism, or is split.
>
> **THEORETICAL.** No source runs this attack against neural recordings, a neural model, neural tissue, or a device
> used to acquire or infer neural or cognitive state. The mechanism is argued from physics, from a review, from an
> analysis, or from a demonstration on a non-neural target (`adjacent`). Clinical and physiological evidence that the
> phenomenon exists, with no adversary in the loop, sits here. Entries whose citations do not resolve sit here with
> `citation_unverified: true`. A preprint can satisfy this level.
>
> **EMERGING.** At least one source with a resolved identifier runs this attack and reports an effect, but a
> DEMONSTRATED condition fails: the result is from simulation only (`simulation`); or the basis does not match the
> named surface (an offline result for a physical-surface technique); or the attacker's access or delivery path is
> assumed rather than achieved; or no reviewer has yet read a quantified success measure. A defence paper in which the
> attack is only assumed does not raise an entry above this level. A preprint can satisfy this level on its own,
> flagged `preprint_only: true`. EMERGING no longer means "recently identified" — recency is not evidence.
>
> **DEMONSTRATED.** A citation-verified source runs this attack **as named, against the surface this technique names**,
> and reports a quantified success measure against a stated baseline, and a reviewer has read that measure and recorded
> whether it came from the abstract or the full text. Physical-surface techniques require `hardware` or `participant`;
> model- and data-pipeline techniques require `dataset` evidence on real neural recordings with the attacker's
> knowledge stated. Simulation never reaches this level. A preprint cannot be the sole basis (see D2); it can
> corroborate.
>
> **CONFIRMED.** Either (a) there is credible public reporting of this attack being used against a neural device
> outside research (`evidence_basis: incident`, recorded in a separate `in_the_wild` flag), or (b) the DEMONSTRATED
> criteria are met with `hardware` or `participant` basis by two groups sharing no authors, at least one of them
> peer-reviewed. Reproducing the *phenomenon* — a clinical TMS, tDCS or pharmacological protocol — does not qualify;
> reproducing the *attack* does. A preprint can never be the sole basis, and two preprints are not two groups for this
> purpose. No entry currently meets route (a).
>
> **Exported exploit maturity.** `evidence_basis: incident` exports CVSS `E:A`. DEMONSTRATED or CONFIRMED with
> `hardware` or `participant` basis and public artefacts exports `E:P`. Everything else exports `E:U`. Status alone
> never sets the exported metric.

### How the five proposed status changes resolve under this rubric

| Technique | Now | Resolves to | Deciding clause |
|---|---|---|---|
| **T0009** RF false brainwave injection | EMERGING | **Split first, then DEMONSTRATED (hardware)** for the analog-front-end RF mechanism; the TMS-grade mechanism graded separately (THEORETICAL on its current sources) | "An entry that describes more than one mechanism takes the status of its weakest mechanism, or is split." The entry's own notes say it "currently conflates two physically distinct mechanisms". Once split, the RF half meets DEMONSTRATED: Armengol-Urpi, Kovacs & Sarma 2023 (DOI resolved at Crossref in this run) injected amplitude-modulated RF into research-grade, open-source and consumer EEG hardware and took control of three BCIs. Not CONFIRMED: E-MagDiP is a benign privacy measure, not a second adversarial group. Also drop the two source strings nobody could tie to a publication. |
| **T0020** Membership inference | EMERGING | **EMERGING (dataset)** now; DEMONSTRATED (dataset) the moment someone reads a rate in the full text | The surface is the model, so dataset evidence is surface-matched, but "no reviewer has yet read a quantified success measure" — the Cobilean et al. 2025 abstract (IEEE JBHI, DOI resolved) states training participants can be compromised and gives no rates. The 2026 preprint finding the attack weak (AUC 0.50–0.70) on foundation-model embeddings is recorded as a qualifying note. One panelist (BCI engineer) would promote now; five would not. |
| **T0032** Neural biometric spoofing | EMERGING | **EMERGING (dataset)** — no change | Unanimous. Two clauses bite: the basis does not match the named surface (the entry names bypassing a live authenticator; no physical presentation attack on one was found), and the mechanism differs from the one named (Qian et al. 2025 is query-efficient black-box *evasion*, not replication of a signature). Tapal & Bagley's results are mixed and partly null (no effect on motor imagery; resting-state impostors already accepted without any attack). |
| **T0026** Neuronal flooding | THEORETICAL | **EMERGING (simulation)** — and **T0025 neuronal jamming is demoted from DEMONSTRATED to EMERGING (simulation)** | "The result is from simulation only." Both come from the same in-silico studies (Bernal et al. 2020; López Madejska et al. 2025, ~230,000-neuron mouse visual-cortex model), so they must carry the same status. The panel aligns them by demoting T0025, not by promoting T0026 — the opposite of the direction the delta proposed. The strict adversary would put both at THEORETICAL instead, on the ground that the attacker's ability to drive the neurons is assumed; that is the live minority position here. |
| **T0023** Closed-loop perturbation cascade | THEORETICAL | **THEORETICAL** — no change | "A defence paper in which the attack is only assumed does not raise an entry above this level." Yu et al. 2025 designs a detector for false-data injection on a DBS sensor link in simulation; the cascade the technique names is never produced. The second source (Dhaya & Kanthavel) was not verified in this run. Four panelists say THEORETICAL, two say EMERGING. |

### Back-test: entries that would have to change (the real cost)

Both adversaries ran the rubric backwards over existing entries. This is the part to look at before adopting anything:

- **T0045** harvest-now-decrypt-later: CONFIRMED -> THEORETICAL (its source is a quantum-computing roadmap, i.e. a
  projection; the project's own rule forbids presenting projected attacks as current).
- **CONFIRMED entries resting on clinical protocols** (TMS-SICI, tDCS, tryptophan depletion and the rest of the
  DOI-backed neuromodulation cluster): CONFIRMED -> THEORETICAL *as attacks*; the evidence moves to the clinical block
  where it is genuinely strong.
- **T0010** (ELF entrainment, cited to a frequency chart and a declassified Navy programme) and **T0015** (directed
  energy, cited to the Active Denial System): already flagged for deletion or repair by the earlier in-repo audit.
- **T0024** training-data poisoning: DEMONSTRATED -> THEORETICAL or EMERGING (`adjacent`; Biggio 2012 and Goldblum 2022
  are general ML, not neural data). The same test applies to the T0020/T0021 precedent of re-applying general-ML papers.
- **T0108** neuromorphic mimicry: DEMONSTRATED -> EMERGING (both sources are preprints).
- **T0113** cochlear-vestibular crosstalk: DEMONSTRATED -> THEORETICAL (zero sources).
- **T0016–T0019** backdoors and universal perturbations: stay DEMONSTRATED under the recommended surface-matching rule
  (the model is the surface) but would drop to EMERGING under D1-A. This is precisely the hinge between the two options.
- **All 27 CONFIRMED entries** lose the exported E:A regardless, because none cites an in-the-wild attack.

The headline CONFIRMED+DEMONSTRATED figure will fall. It was not computed here — doing so requires a per-entry basis
assignment, which is the first implementation task, not a decision. Three public artefacts already disagree on the
technique count (165 registry / 109 published preprint / 99 case-study draft), so a fourth unexplained number is a
credibility cost: the drop needs a dated changelog entry explaining that the definition changed, not the threat.

---

## Decision 2 — Can a preprint support a status above EMERGING

### Options

**D2-A — no, cap at EMERGING** (the current leaning).
- For: it is already what the project's own rule enforces in practice. `.claude/rules/registrar.md` requires DOI/PMID
  verification via the Crossref API before a technique is accepted as CONFIRMED or DEMONSTRATED, and **arXiv DOIs
  return HTTP 404 at Crossref** (verified in this run; they resolve at DataCite instead). So D2-A needs no rule change,
  and after a fabricated-citation incident "no rule change" has real value.
- Against: it ranks venue over evidence. CVSS v3.1's Report Confidence — the metric that exists for exactly this
  question — grades reproducibility and independent confirmation and never mentions peer review ("Detailed reports
  exist, or functional reproduction is possible ... Source code is available to independently verify the assertions of
  the research"). The Cochrane Handbook (s4.4.5) says preprints "should also be considered a potentially relevant
  source of study evidence, particularly for emerging topics where little evidence exists" and that studies "indicated
  that there was no compelling evidence that preprints provide results that are inconsistent with published articles".
  Under D2-A a peer-reviewed *defence* paper that merely assumes an attack outranks a preprint reporting a measured
  hardware result.

**D2-B — evidence type decides; peer review is a flag only.**
- For: maximally consistent with CVSS and Cochrane; peer review is recorded, not gating.
- Against: arXiv's own terms state "Material is not peer-reviewed by arXiv — the contents of arXiv submissions are
  wholly the responsibility of the submitter". Several key 2026 sources here are single-author preprints. For a catalog
  that device makers and regulators read, with a fabricated-citation incident in its history, removing the venue floor
  entirely is the one option whose failure mode is the project's known failure mode. No panelist supported it.

**D2-C — corroboration only (recommended).** A preprint may be a second, supporting source for any status, and may be
the sole source at EMERGING or THEORETICAL, but never the sole basis above EMERGING.
- For: it keeps the project's existing verification gate intact while still letting preprints into the catalog and onto
  the evidence record, which is what Cochrane recommends for emerging topics. It is the only option that is
  simultaneously compatible with the registrar rule as written and with preprint inclusion.
- Against: it still lets venue decide at the margin. A reproducible hardware preprint with public code is treated as
  weaker than a paywalled workshop paper whose full text nobody has read — which is in fact the position T0009's own
  key source is in.

**D2-D — conditional.** A preprint alone may support DEMONSTRATED if its full text was read and its artefacts (code or
data) are public, flagged provisional and re-checked at each refresh.
- For: it gates on the two things that actually predict whether a result holds (did someone read it; can anyone rerun
  it) rather than on the venue, and it has an explicit expiry.
- Against: the "re-check each refresh" duty has no owner, so provisional flags go stale — and the catalog has already
  demonstrated it does not keep up its own checks (T0108 sits at DEMONSTRATED on two preprints; T0113 at DEMONSTRATED
  with no sources at all). It also requires amending the Crossref gate to accept DataCite, immediately after a
  fabricated-citation incident.

### Recommendation

**D2-C.** Three panelists picked D2-D, two D2-C, one D2-A; all six agreed a preprint can never be the sole basis for
CONFIRMED. D2-C is adopted over the plurality because it is the only option requiring no change to a verification rule
that exists because of a past failure, while still achieving what the D2-D camp actually wants: the preprint gets into
the catalog, onto the entry, and into the evidence list. The two options are close, and the deciding factor is
institutional, not epistemic.

**Confidence: 0.62** (runner-up D2-D at 0.52 — **within 0.15**) — based on established practice quoted from primary
sources that points in *both* directions (Cochrane and CVSS Report Confidence favour D2-D; the project's own Crossref
gate and arXiv's own disclaimer favour D2-C/A), so this is a judgement about institutional risk tolerance. Note that
the panel's preference order (D2-D) differs from the recommendation; that disagreement is the reason the score is this
low rather than higher.

**What would change the recommendation:** (a) a working, owned refresh check that demonstrably demotes stale
provisional entries — that alone would move this to D2-D; (b) the project amending its Crossref gate to accept DataCite
for arXiv DOIs, plus a written "public artefacts" test, which is the mechanical precondition for D2-D; (c) evidence
that BCI-security preprints change their results materially at publication more often than the Cochrane base rate,
which would push toward D2-A; (d) a statement from MITRE ATLAS or ATT&CK on whether preprint-only evidence can reach
their "Demonstrated" level — not checked in this run, and the most relevant missing precedent.

### Exact wording to adopt

> **Preprints.** A preprint (arXiv, bioRxiv, medRxiv or similar) is admissible evidence and is recorded like any other
> source, with its identifier and the date it was read. It may be the sole source for an entry at THEORETICAL or
> EMERGING. It may not be the sole basis for DEMONSTRATED or CONFIRMED: at those levels at least one source must be
> peer-reviewed with an identifier that resolves at a registration agency (Crossref for journal and conference DOIs,
> DataCite for arXiv DOIs — note that an arXiv DOI returns 404 at Crossref and this does not mean the work does not
> exist). A preprint may corroborate, qualify or contradict a peer-reviewed source at any level, and a contradicting
> preprint must be recorded on the entry even when it does not change the status. Every entry whose evidence rests only
> on preprints carries `preprint_only: true`. When a preprint is later published, replace the identifier, re-read the
> relied-on result, and re-assess the status; results can change between versions.

### How the five proposed status changes resolve under this rule

None of the five turns on D2 — a point worth recording, because the original framing implies they do.

| Technique | Effect of the preprint rule |
|---|---|
| **T0009** | None. DEMONSTRATED rests on the peer-reviewed Armengol-Urpi DOI. The E-MagDiP preprint is admitted as corroboration of the coupling path and is flagged as a preprint. |
| **T0020** | None. The supporting source is peer-reviewed (IEEE JBHI); the contradicting source is a preprint, which is recorded as a qualifying note. Both permitted. |
| **T0032** | None. The peer-reviewed letter plus the preprint both fail the surface-matching clause under D1, not the preprint clause. |
| **T0026 / T0025** | None. Both rest on peer-reviewed simulation work; the simulation cap decides them. |
| **T0023** | None. Yu et al. is peer-reviewed; it fails because it is a defence paper that assumes the attack. |
| (for reference) **T0108** | Changes. Both its sources are preprints, so it cannot stay at DEMONSTRATED: it becomes EMERGING with `preprint_only: true`. This is the one existing entry D2 actually decides. |

---

## Decision 3 — Which of the 11 candidate techniques to add

### Options

**D3-A — add ten, hold R-084 (165 -> 175)**, the current leaning.
- For: every named threat gets a queryable ID, a status and a score; nothing a device maker should know about is buried
  in prose. Five of the eleven name mechanisms the earlier in-repo audit listed as "not covered" — model stealing, MLOps
  registry compromise, federated integrity, air-gap channels, inferential HNDL.
- Against: five of the ten would become top-level peers of entries that already cover them (R-081 and R-083 against
  T0019; R-082 against T0041; R-086 against T0024, whose notes already name federated learning as an entry point;
  R-087 against T0043/T0046; R-088 is an umbrella over T0042, T0072, T0086 and T0094). Both MITRE ATT&CK
  ("sub-techniques are a more specific description of the adversarial behavior ... at a lower level than a technique")
  and CWE ("Variant Weakness ... more specific than a Base weakness") keep narrower behaviours under a parent. Adding
  them as peers inflates a headline count on which three public artefacts already disagree, and creates two entries
  that score separately for one behaviour.

**D3-B — add only the distinct ones; fold overlapping ones in as evidence or variant notes; hold the unverified
(recommended).**
- For: it is the taxonomy practice quoted above, it gives the five folded results a home on the entry whose status they
  actually inform (R-083 in particular supplies T0109 — currently THEORETICAL with no primary source — with its first
  one), and it keeps the count honest at 169.
- Against: the registrar schema has **no parent, variant or sub-technique field**, so a fold becomes free text in
  `notes` that the status logic, the counts, the KQL tables and API consumers cannot query. Folding is therefore the
  under-labelling risk the research-integrity panelist weighted explicitly: real evidence that becomes invisible.

**D3-C — add only candidates with a primary empirical source; hold everything resting on the single review.**
- For: the most conservative reading of the citation rules; nothing enters on one review preprint.
- Against: a review *is* a legitimate basis for THEORETICAL under the D1 rubric, and this option would drop R-085
  (model stealing), which a prior audit named as a real gap. Leaving a named threat out of a defensive catalog because
  only a survey describes it is the one failure mode that harms the catalog's users rather than its critics. Rejected
  by the panel, including by the strict adversary.

**D3-D — add none until the rubric is adopted.**
- For: avoids assigning statuses twice.
- Against: the rubric and the additions can ship in one release, which is what the product owner asked for anyway so
  that each count is reconciled once. Pure delay. No support.

### Recommendation

**D3-B — 165 -> 169.** Unanimous across all six panelists, including both adversaries, and — unusually — with
identical per-card verdicts. The card-level agreement is what carries the score here, not the headcount: the overlaps
are checkable against the existing entries' own text (T0024's notes naming federated learning; T0109 having no primary
source; R-088 spanning four existing entries), and the refresh agent that produced the cards had itself already
proposed merging R-081, R-082 and R-087.

**Confidence: 0.78** (runner-up D3-A at 0.30) — based on established practice quoted from primary sources (ATT&CK
sub-technique and CWE Variant definitions) plus repo facts verified in this run; the residual uncertainty is the schema
gap, which is inference rather than verification.

**What would change the recommendation:** (a) acceptance of a `parent` or sub-technique field from `proposed_fields` —
then R-081, R-082, R-083, R-086 and R-087 should be added as *children* with their own IDs and statuses rather than
folded into prose, which is strictly better than either option on the table; (b) a finding that the site search and the
KQL tables do not index `notes` — then folding genuinely hides the evidence and the five should be added as
cross-linked entries; (c) for any folded card, a mitigation or control its parent entry lacks (the test R-078 already
passes against T0045, which is why it is NEW rather than folded).

### Exact disposition

| Card | Mechanism | Disposition | Status on entry | Reason |
|---|---|---|---|---|
| R-078 | Inferential harvest-now-decode-later | **NEW** | THEORETICAL (`review`) | T0045 is purely cryptographic; post-quantum crypto does not mitigate this variant, so it needs its own control (retention limits). Read the Menuet 2022 abstract before integration — the DOI resolves but no one has read it. |
| R-079 | Brain-prompt injection in BCI-to-LLM-agent pipelines | **NEW** | EMERGING (`dataset`, `preprint_only`) | No existing entry covers the agent-routing surface; T0008 is generic command hijacking. Single-author preprint, public dataset, harmless tool stubs. |
| R-080 | Motion-sensor inference of EEG-correlated perceptual content in VR | **NEW** | DEMONSTRATED (`hardware`) | Peer-reviewed (IEEE S&P 2026, DOI resolved; abstract read in this run: perceived images 52.0–67.2% across VR devices, de-anonymisation and keystroke inference above 96%). Surface is the consumer device, and the device was in the loop. Drop "EEG" from the name: no EEG sensor is on the victim, the signal is EEG-*correlated*. Read the full text for participant counts before integration. |
| R-081 | Zero-query adversarial transfer via a public EEG foundation encoder | **FOLD into T0019** | — (T0019 unchanged) | Same evasion goal as universal adversarial perturbation, new access model (zero-query via the public encoder). Record as a variant note plus source. |
| R-082 | Cross-encoder attribute leakage from EEG foundation embeddings | **FOLD into T0041** | — (T0041 unchanged) | Same attribute-inference goal; an embedding-stage route to it. The refresh agent itself proposed the merge. |
| R-083 | Temporal desynchronisation evasion of EEG decoders | **FOLD into T0109** | T0109 THEORETICAL -> EMERGING (`dataset`, `preprint_only`) | T0109 (data alignment exploitation) currently has no primary source at all; this preprint gives it one and reports a measured effect (EEGNet 0.99 -> 0.10 at large time shift). The most valuable of the five folds. |
| R-084 | RF adversarial interference against surface EMG | **HOLD** | — | The abstract says "Experiments on the Myo Dataset (7 gestures, 350 samples)" while also reporting distances and transmit powers, so whether anything was transmitted over the air is unresolved. Unanimous hold. Resolve by reading the full text; if over-the-air, it becomes a NEW entry at DEMONSTRATED (`hardware`) as the EMG analogue of T0009. |
| R-085 | Neural decoder model stealing | **NEW** | THEORETICAL (`review`) | The prior in-repo audit named model stealing as not covered. Only the review describes it for BCI; the demonstrations are on general prediction APIs. Entering at THEORETICAL with basis `review` is the honest label. |
| R-086 | Federated-learning poisoning of shared decoders | **FOLD into T0024** | — | T0024's own notes already name federated learning as a vulnerable entry point; add the integrity-versus-leakage distinction there and cross-reference T0021. |
| R-087 | Model registry / retraining-pipeline substitution | **FOLD into T0043** | — | A supply-chain substitution variant; cross-reference T0046. Review-only source. |
| R-088 | Air-gap covert and side channels on BCI hardware | **HOLD** | — | An umbrella over five distinct physical channels that already overlaps T0042, T0072, T0086 and T0094. Map each channel against the existing entries first; whatever is genuinely unmapped can then enter individually. |

Net: four NEW, five FOLD, two HOLD. **165 -> 169.** Per `.claude/rules/registrar.md`, these remain cards: the
migration script assigns IDs and `TARA-{DOMAIN}-{MODE}-{NNN}` aliases, and the count must be derived from
`statistics.total_techniques`, never hardcoded.

---

## Decision 4 — Legislation and standards entries

### What was verified in this run, at primary sources

The Montana facts were checked directly, as instructed. The enrolled bill text and the Legislature's own effective-date
table were downloaded and read:

- **Montana SB 163 (2025) is the neurotechnology law.** 69th Legislature 2025, Chapter 345, introduced by D. Zolnikov:
  "AN ACT REVISING THE GENETIC INFORMATION PRIVACY ACT; INCLUDING NEUROTECHNOLOGY DATA IN THE SCOPE OF THE GENETIC
  INFORMATION PRIVACY ACT; ... AND AMENDING SECTIONS 30-23-101, 30-23-102, 30-23-103, 30-23-104, 30-23-105, AND
  44-6-104, MCA." It defines "Neurotechnology data" as information "captured by neurotechnologies, is generated by
  measuring the activity of an individual's central or peripheral nervous systems, or is data associated with neural
  activity". **Effective 10/01/2025** per the Legislature's "Effective Dates by Date 2025" table (Ch. 345, SB 163).
- **Montana SB 214 of 2025 is a zoning act.** Chapter 369: "AN ACT REVISING ZONING LAWS; ... AND PROVIDING AN IMMEDIATE
  EFFECTIVE DATE", effective 05/05/2025. It contains no instance of "neural", "neurotechnology", "biometric" or
  "genetic".
- **Montana SB 214 of 2023 is an audiology compact** (Chapter 349, "ENACTING THE AUDIOLOGY AND SPEECH-LANGUAGE ..."
  interstate compact), per the Montana Legislative Review 2023.
- **There was no Montana regular session in 2024.** Montana Constitution Art. V, s. 6: "The legislature shall meet each
  odd-numbered year in regular session of not more than 90 legislative days." So a "Montana SB 214 (2024)" cannot
  exist. The genuinely related 2023 acts by the same sponsor are SB 384 (Consumer Data Privacy Act, Ch. 681) and
  SB 351 (Genetic Information Privacy Act, Ch. 768).
- **ISO/IEC 8663:2025 is verified, and the leaning to mark it unverified is wrong.** ISO's own catalogue entry (reached
  via `committee.iso.org/standard/83268.html` after `www.iso.org` returned 403) states: "ISO/IEC 8663:2025 Information
  technology — Brain-computer interfaces — Vocabulary", Status: Published, Publication date 2025-09, Stage 60.60,
  Edition 1, 20 pages, **Technical Committee ISO/IEC JTC 1/SC 43**. The IEC publication preview front matter
  independently shows "ISO/IEC 8663 Edition 1.0 2025-09" with ISBN 978-2-8327-0723-4. The refresh agent's proposed
  `body: "ISO/IEC JTC 1"` is wrong at the subcommittee level.
- **Connecticut is half verified.** The Connecticut Attorney General's official CTDPA page lists, among sensitive data,
  "Neural Data – which means any information generated by measuring the activity of an individual's central nervous
  system". The bill number SB 1295, the Public Act number 25-113, the 2025-06-24 signing and the 2026-07-01 effective
  date come only from secondary sources (law-firm notes and the FPF neural-data tracker); `cga.ct.gov` failed TLS on
  five attempts across two tools, so none of those identifiers is primary-verified.

Repo state for comparison: `datalake/research-registry.json` holds `montana-sb214`, "Montana SB 214", year **2024**,
status active, tags privacy/biometric/neural-data. `datalake/bci-landscape.json` holds "2024-10 Montana SB 214: neural
data as biometric data", "2025-05 Montana neural data privacy law effective", and a correct "2025-10 Montana SB 163"
row whose note asserts it is "Distinct from 2024-10 SB 214".

### Options

**D4-A — the current leaning:** correct Montana; mark ISO/IEC 8663 and Connecticut unverified at entry level.
- For: simple, and conservative-looking.
- Against: it is wrong in both directions. It would flag ISO/IEC 8663:2025 as unverified when ISO's own catalogue
  verifies it, and it would flag the whole Connecticut entry when the substantive fact — neural data is sensitive data
  under the CTDPA — is verified at the state Attorney General. "Correct Montana" is also too soft: SB 214 is not a
  mislabelled neural law, it is a different act, and no neural-data SB 214 exists in any Montana session.

**D4-B — field-level verification (recommended):** correct or delete per fact, and flag individual fields rather than
whole entries.
- For: it records exactly what is known. Every element rests on a primary source read in this run.
- Against: the schema cannot flag single fields today, so until that exists Connecticut may have to carry an
  entry-level flag with the detail in a note; and deleting an ID breaks API consumers.

**D4-C — leave all three and flag everything pending a second pass.**
- For: no risk of deleting something real.
- Against: it leaves a verifiably false statute entry on a public site and API. Not supportable.

### Recommendation

**D4-B, field by field.** Unanimous, and the only decision here where the score is driven by verification rather than
judgement.

**Confidence: 0.93** (runner-up D4-A at 0.35) — Montana and ISO are verified facts from primary sources read in this
run; the single residual is Connecticut's identifiers, which no tool could reach at the primary source, and the schema
question of how to express a per-field flag.

**Actions:**

1. **Montana.** Delete the `montana-sb214` legislation entry and the `2024-10 Montana SB 214` landscape row. Add or
   keep `montana-sb163`: name "Montana SB 163 (2025) — Genetic Information Privacy Act extended to neurotechnology
   data", jurisdiction Montana US, year 2025, chapter 345, type statute, status active, effective 2025-10-01, neurorights
   MP, tags privacy / neural-data / genetic-privacy (**not** biometric — the vehicle is the Genetic Information Privacy
   Act, not a biometric statute), source the Legislature's enrolled-bill archive, verification VERIFIED, accessed
   2026-10-06. Strike the "Distinct from 2024-10 SB 214" note. Delete or re-source the `2025-05 Montana neural data
   privacy law effective` row: no neural-data effective date in May 2025 was found, and 05/05/2025 is the *zoning* act's
   effective date, which is the likely origin of the error (inference, not verified). Grep for `montana-sb214` across
   `src/`, the SDK and the KQL tables before removing the ID, and consider leaving a tombstone for API consumers.
2. **ISO/IEC 8663:2025.** Mark **VERIFIED**, not unverified. Set `body` to "ISO/IEC JTC 1/SC 43", year 2025,
   publication date 2025-09, edition 1, status active/published. Record that it is a **vocabulary** standard: it is a
   terminology baseline for QIF and TARA definitions and must not be cited as a security control or as conferring any
   compliance status.
3. **Connecticut.** Keep the entry. Mark the substantive fact verified against the Attorney General's CTDPA page:
   neural data — "any information generated by measuring the activity of an individual's central nervous system" — is
   sensitive data under the CTDPA. Flag **only** `bill number SB 1295`, `Public Act 25-113`, the 2025-06-24 signing and
   the 2026-07-01 effective date as `citation_unverified: true`, with the note that `cga.ct.gov` could not be reached
   (TLS failure) on 2026-10-06 and that the identifiers rest on secondary sources. Worth recording for threat
   modelling: Connecticut's definition is **central** nervous system only, while Montana's covers **central or
   peripheral** — so surface-EMG and other peripheral-nerve data plausibly fall inside Montana's statute and outside
   Connecticut's (inference from the two texts, which were both read).
4. **Queue for the same check:** `minnesota-hf1370` ("Minnesota HF 1370", year 2024) sits directly beside the bad
   Montana entry and shares its provenance; it was not checked in this run. Also re-verify the "2024-10" cluster in
   `bci-landscape.json` generally, since at least one member of it is fabricated-by-mislabel.

**What would change the recommendation:** a Montana primary text showing a neural-data SB 214 in any session (would
restore the original entry); a reachable `cga.ct.gov` record contradicting PA 25-113 or either date (would change the
Connecticut identifiers rather than merely unflag them); an ISO erratum or withdrawal notice for 8663:2025.

---

## Deliberation record

- **Skill:** `quorum` was invoked (Skill tool, `quorum`) and its protocol applied: independent Phase-1 work by six
  panelists who could not see each other's output, a claim pool assembled by the supervisor, an adversarial pass by two
  agents holding opposed authentic positions with mandatory counter-proposals, then synthesis. The panel ran as six
  parallel agents rather than as the skill's internal multi-round `converse` loop.
- **Independence:** all six received the same evidence pack and option set and no panelist's output. Reports were
  returned in isolation. The four non-adversarial panelists converged on D1-D/D3-B independently, which is a real
  signal; the two adversaries were given opposed briefs by construction, so their *disagreement* on D1 thresholds and
  D2 is informative while their agreement on D3 and D4 is the strongest convergence in the run.
- **Where the panel split:** the dataset threshold inside D1-D (4 allow dataset -> DEMONSTRATED for model-surface
  techniques; the strict adversary never does); D2 (3 for D2-D, 2 for D2-C, 1 for D2-A); T0020 (5 EMERGING, 1
  DEMONSTRATED); T0026/T0025 (5 align at EMERGING, 1 aligns both at THEORETICAL); T0023 (4 THEORETICAL, 2 EMERGING).
- **Where the recommendation departs from the panel:** on D2 the plurality preferred D2-D and the recommendation is
  D2-C, because D2-D requires amending the project's verification gate and has no owner for its re-check duty. This is
  flagged rather than smoothed over, and it is why D2 carries the lowest confidence of the four.
- **Unanimous findings not in the original four questions**, all independently raised and all verified in the repo:
  (1) status is exported as CVSS exploit maturity, so all 27 CONFIRMED entries currently publish a false `E:A`
  ("Attacks ... have been reported") and the mapping must change in the same release as the rubric; (2) written status
  definitions already exist in three places and contradict each other; (3) the six status values in the data exceed the
  four the TypeScript type permits — PLAUSIBLE and SPECULATIVE should fold into THEORETICAL; (4) T0009 must be split
  before it can be re-statused, by its own notes; (5) adopting the rubric lowers the public headline figure, which
  needs a dated changelog entry saying the definition changed rather than the threat.
- **Evidence scorecard.** Verified at a primary source in this run: the Montana bill texts and effective-date table,
  the Montana constitutional session clause, the ISO/IEC 8663:2025 catalogue record and IEC preview, the Connecticut
  AG's neural-data definition, the MITRE ATLAS maturity definitions, the ATT&CK in-the-wild contribution rule and
  sub-technique definition, CVSS v4.0 Exploit Maturity, CVSS v3.1 Report Confidence, SSVC Exploitation, EPSS's scope
  statement, the CWE Base/Variant definitions, Cochrane Handbook s4.4.5 on preprints, arXiv's no-peer-review
  disclaimer, and the DOIs/abstracts behind all five status proposals plus the R-080 and R-084 candidates. Read in the
  repo: the registrar and its status distribution, the three conflicting status mappings, `transform-registry.py`, the
  project rules, and the prior in-repo audit. **Not verified:** any candidate preprint's full text (nobody read one);
  the Menuet 2022 abstract behind R-078; Connecticut's bill and Public Act identifiers; the Dhaya & Kanthavel source
  behind T0023; `minnesota-hf1370`; a GRADE statement on preprints; any ATLAS/ATT&CK statement on preprint-only
  evidence. The CISA KEV criteria were read through a summarising fetch rather than the raw page and are reported as
  approximate; they are not load-bearing for any recommendation.
- **Not decided here, and blocking implementation:** whether `evidence_basis`, `in_the_wild`, `preprint_only`,
  `citation_unverified` and a `parent` field are accepted into the schema. Every recommendation above is a proposal for
  human review; no tracked file was modified.
