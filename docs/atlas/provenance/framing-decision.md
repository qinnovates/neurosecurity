> Archived copy of `<staging>/2026-10-framing/decision.md`, versioned with the data it justifies. Unchanged except that local paths read `<staging>` or `<scratchpad>`. Index: `docs/atlas/INDEX.md`.

# Stage 3 — Decision: Purpose and limits framing (2026-10-13)

> **Read this first.** The review panel was made up of AI role-players (CMO as chair, CEO, Head of Brand and Communications, Product Marketing Lead for security buyers, Security Practitioner, Medical-Device Regulatory and Quality Lead, Neuroethicist), run through the Quorum skill: one independent round, then a CMO decision. None of them are Qinnovate staff. **Kevin's acceptance is the real final decision.** Nothing in any repository has been changed; this is a proposal only.

Inputs: `inventory.md` (30 items: 11 High, 13 Medium, 6 Low, including 2 High items the panel found) and `proposals.md` (Stage 2 drafts, which contain one known error, corrected here).

Supervisor corrections to the panel output: (1) A3 originally said entries "range from confirmed to theoretical"; the registrar also holds 1 SPECULATIVE and 1 PLAUSIBLE entry, so the text below says "confirmed to speculative". (2) A3 and M10 point to a gap list `[link]` that does not exist yet; building it is implementation item 3.

## 1. Canonical statement (final, all three lengths)

US spelling throughout (modeling, catalog, prioritize), matching FDA, ATT&CK and the site UI.

**A1 — one sentence (139 characters).** For meta descriptions, the repo description, the org description and the package summary:

> A proposed, unvalidated research framework (QIF, TARA, NISS) for threat modeling, severity scoring and impact assessment of neural devices.

**A2 — about 45 words.** For heroes (below the fold on the homepage), README openings and the org profile:

> QIF, TARA and NISS help builders and defenders start a neural-device threat model, rank which protections to build first, and describe potential impact in shared terms. Status: a proposed research framework; unvalidated, not peer reviewed, not a standard, not clinical guidance or a compliance tool.

**A3 — about 150 words.** Its canonical home is `governance/README.md`. It is also used on the About page and in the SECURITY.md preamble, and the sitewide footer links to it:

> **Purpose and limits**
>
> **What it's for.** A shared vocabulary for threat modeling, severity scoring and impact assessment of neural devices. TARA borrows the structure of MITRE ATT&CK, a knowledge base of adversary techniques based on real-world observations; TARA entries range from confirmed to speculative, and each carries an evidence status. NISS follows the CVSS v4.0 extension method; like CVSS Base scores, NISS scores measure severity, not risk. FDA's premarket cybersecurity guidance (Feb 2026, nonbinding) recommends that submissions include threat modeling documentation.
>
> **Status.** Proposed and unvalidated. Not peer reviewed. Not adopted or endorsed by MITRE, FIRST, FDA or any standards body.
>
> **What it isn't.** Not clinical guidance, a medical device or a compliance tool, and not a substitute for a manufacturer's own threat model. It models attacks on neural signals, devices and decoder outputs (such as attempted speech), not general access to thought. DSM-5-TR names are category references for threat modeling, not diagnostic claims.
>
> **Constraints we hold ourselves to.** Written for defenders; offensive use is out of scope. Entries without defensive guidance are listed at [link]. Neurorights are treated as scholarly proposals, read alongside existing law. Report errors at [issues].

**Status slot (sitewide).** A badge plus this footer line: "Status: proposed research framework. Purpose and limits →" (links to A3).

**Primary sources behind the statement** (each read this session):
- ATT&CK: attack.mitre.org/resources ("knowledge base of adversarial techniques based on real-world observations").
- CVSS v4.0 User Guide: Base scores "should not be used alone to assess risk". §3.11 is the "CVSS Extensions Framework", and "The CVSS SIG does not officially approve extensions".
- FDA, *Cybersecurity in Medical Devices: Quality Management System Considerations and Content of Premarket Submissions*, issued 3 Feb 2026. It is marked "Contains Nonbinding Recommendations", and §V.A.1 says "FDA recommends that premarket submissions include threat modeling documentation…".

## 2. Main disagreements and how the CMO resolved them

| | Positions | Resolution |
|---|---|---|
| a | Put the status qualifier on every surface (Regulatory, Neuroethicist), or give it one fixed slot (Brand, Product Marketing). | **Fixed slot.** The full status appears once per surface (A1/A2), plus the badge and footer. Subpage metas say "proposed" only, which still meets the workspace status rule. Stacking qualifiers reads defensive and hides the content. |
| b | A2: value first or status first, and how many negatives. | **Value first, then one status sentence** with the negatives in a single list. "Compliance tool" was added because of the 524B finding. |
| c | "Risk scoring" or "severity scoring". | **Severity scoring everywhere.** CVSS Base scores are not risk, and NISS extends CVSS. |
| d | US or British spelling. | **US spelling.** FDA, ATT&CK and the UI all use it. |
| e | Scrub "kill chain" and "weaponization", or keep them. | **Keep "kill chain"**, which is standard defender vocabulary. Rename "weaponized" names only where the new name is more precise, and publish a changelog: "Renamed for descriptive clarity; no technique removed." A quiet scrub would become the story. |
| f | T0065: the Stage 2 rename ("harmful content amplification"), or the Neuroethicist's version. | **Neuroethicist's version**, keeping the device scope, with a visible rename note. The Stage 2 rename was euphemistic. |
| g | Neurorights on the homepage. | **Removed from the hero and from the gap-section closing line**, kept on the governance and rights pages. A count of rights used as a feature reads as moral authority. GUARDRAILS G4 says five rights where the site says four. |
| h | "Every technique is paired with detection or mitigation": backfill or reword. | **Reword now, backfill next.** The claim is false: 150 of 176 techniques have a detection field and 2 have a structured mitigation. Use `{detected} of {N}` and publish a gap list. Backfilling T0136–T0161 is the first engineering ticket. |
| i | TARA Lab badges: rename or remove. | **Rename** to the Regulatory lead's wording if Kevin confirms what the checker evaluates. Otherwise remove them. |
| j | ATT&CK analogy. | **Use ATT&CK's own self-description** and disclose TARA's evidence-status spread. Never claim TARA entries are observed in the field. |

Other panel positions recorded but not adopted in full:
- The CEO argued for putting effort into filling mitigation gaps rather than disclaimers. This was adopted as an engineering priority (implementation item 3).
- The Regulatory lead preferred removing the TARA Lab badges outright. This is the fallback in (i).
- The Neuroethicist flagged that `clinical.safe_parameters` (therapeutic dose envelopes) render next to attack entries. Escalated to Kevin as pre-publish check 10.

## 3. Final per-location text

Placeholders: `{N}` = technique count, `{scored}` = techniques with a NISS score, `{detected}` = techniques with detection text, `{m}` = techniques that share a mechanism with a therapy, `{dsm5Count}` = DSM-5-TR category references. All are computed from data at build time; none is hardcoded.

| # | Decision | Final text / instruction |
|---|---|---|
| H1 repo description | AMEND | A1. |
| H2 homepage meta | AMEND | Title: "TARA — Threat Modeling Catalog for Neural Devices · Qinnovate". Description: "A proposed, unvalidated framework for threat modeling, severity scoring and impact assessment of neural devices: {N} cataloged techniques, {scored} with draft NISS scores, {detected} with detection guidance." No market size in the meta. |
| H3 homepage hero | AMEND | h1: "Threat modeling for brain-computer interfaces". Sub: "A proposed research framework for modeling, scoring and prioritizing threats to neural devices." A2 goes below the fold. Stat line: "{N} techniques, {scored} with draft NISS scores, each with an evidence status." Remove "therapeutic counterpart" and the neurorights phrase from the hero. Move the market-size link to the landscape section. |
| H4 homepage gap section | AMEND | h2: "Where current device-security guidance stops". FDA card: "FDA recommends threat modeling for connected medical devices in its premarket cybersecurity guidance (Feb 2026). It does not describe neural-specific threats." MITRE card: "MITRE and MDIC published a medical-device threat modeling playbook (2021); it is device-generic by design. We found no neural-device entries in ATT&CK (checked {date})." CISA card: hold until verified. Closing: "What TARA proposes: {N} techniques, {scored} with draft NISS scores, {dsm5Count} DSM-5-TR category references for threat modeling (not diagnostic claims)." The misquoted "assess risk per ISO 14971" line is deleted. |
| H5 README | AMEND | Tagline: "**Threat modeling, severity scoring and impact assessment for neural devices — a proposed, unvalidated research framework.**" A2 is the first paragraph, linking to A3. "New threats, new rights" → "New threats, and how existing rights apply to them". "Engineering that works today" → "Engineering methods in use today, applied to a new device class". |
| H6 org profile | ACCEPT (with final A1/A2) | Tagline: A2. Org description: A1. Governance link → `github.com/qinnovates/neurosecurity/tree/main/governance`; confirm it resolves. |
| H7 TARA atlas page | AMEND | Title: "TARA Atlas — Threat Catalog". Badge "Stable" → "Proposed". Lead: "{N} techniques documented for threat modeling, each with an evidence status. {detected} include detection guidance; {scored} carry draft NISS scores; {m} of {N} share a physical mechanism with a therapeutic use." Add an evidence-status badge to every technique page. |
| H8 NISS page | AMEND | Badge: "Uses CVSS v4.0 extension method (User Guide §3.11)". Body: "Following the extension method in the CVSS v4.0 User Guide (§3.11), NISS adds a separate metric group alongside unmodified CVSS v4.0 Base, Threat and Environmental metrics. The CVSS SIG does not officially approve extensions; NISS is not approved or endorsed by FIRST. Like CVSS Base scores, NISS scores are not a risk assessment." Meta: "Neural Impact Scoring System v2.0 — a proposed, unvalidated CVSS v4.0 extension for scoring the impact of neural-device vulnerabilities, with outcome categories for threat modeling." |
| H9 mission page | AMEND | Meta: "Bringing established threat-modeling and severity-scoring practice to neural devices, for builders, reviewers and the public." Body: "Security engineering has mature methods for threat modeling and severity scoring; they have not been worked through for the boundary between silicon and neuron. QIF proposes a model of that boundary across 11 bands. TARA catalogs {N} techniques for threat modeling, and NISS proposes a way to score their severity. The aim is to give people who build and review these devices specific threats to discuss. All of it is proposed and unvalidated." |
| H10 whitepaper 524B claims | AMEND (top priority) | In `research/whitepaper/index.astro`, delete "Every BCI is a cyber device. TARA provides the threat catalog these submissions require." and "…that Section 524B mandates but existing standards do not supply". Replace with: "BCIs that meet the section 524B cyber device definition need cybersecurity documentation in marketing submissions. TARA is a proposed research catalog that may help when drafting threat models. It does not satisfy any FDA requirement." Archived v6/v7/v7-1 get a correction banner, following `.claude/rules/whitepaper-archival.md`; check what that rule permits. |
| H11 TARA Lab badges | AMEND | `'Required by statute'` → "Statutory if the device is a cyber device (connectivity prong only checked)". `'Not required here'` → "Not triggered by connectivity; FDA guidance may still apply". If the checker logic cannot be confirmed, remove the badges. |
| M1 PyPI / pyproject | AMEND | Summary: "TARA: proposed, unvalidated threat catalog for neural-device threat modeling and severity scoring". A2 goes at the top of the long description. |
| M2 26 imperative descriptions | AMEND | Use "An adversary may…" for CONFIRMED, DEMONSTRATED and EMERGING entries, and "If feasible, an adversary could…" for THEORETICAL, PLAUSIBLE and SPECULATIVE ones. Write descriptively, never as instructions. End with the registrar's actual detection text, or "Mitigation guidance not yet drafted." Invent no mitigation text inside descriptions; it goes through the registrar workflow. |
| M3 technique names | AMEND | T0011 → "Intermodulation via BCI stimulation signal". T0046 → "Malicious over-the-air firmware update". T0099 → "Consumer-sensor-to-BCI escalation path (projected)". T0065 → "BCI-linked recommendation-loop amplification of destabilizing content for users at psychosis risk (projected)", with the visible note "Renamed 2026-10; the earlier name implied a demonstrated clinical effect that no cited source shows." Keep the legacy aliases and publish the changelog line. |
| M4 chains meta | AMEND | "Multi-step attack paths across silicon, firmware and biological layers, laid out as kill chains so defenders can see where each can be broken. Proposed research." |
| M5 clinical page | AMEND | "{n} of {N} techniques carry DSM-5-TR diagnostic category references for threat modeling (not diagnostic claims); {m} share a physical mechanism with a therapeutic use." Stat label: "DSM-5-TR category references". Category names only; no criteria text. |
| M6 rights meta | AMEND | "How {N} cataloged techniques bear on four neurorights proposed by Ienca & Andorno (2017), which are scholarly proposals, not established law. A threat-modeling view; proposed research." First fix the five-vs-four mismatch in GUARDRAILS G4. |
| M7 atlas index meta | AMEND | "QIF Atlas: the hourglass model, threat catalog, device mappings and brain-region views of a proposed framework for neural-device threat modeling." |
| M8 explorer/ttps/device-filter/analysis metas | AMEND | Explorer: "Search and filter the TARA threat catalog by domain, severity and neurorights for threat modeling." TTPs: "Matrix of {N} techniques across 11 hourglass bands and 9 categories, for threat modeling and prioritizing defenses." Device filter: "Filter cataloged techniques by device type and modality to start a device threat model." Analysis: "Case studies mapping documented incidents and research to TARA techniques and any documented detection guidance." |
| M9 homepage catalog h2 | AMEND | "{N} techniques, each with an evidence status. {detected} include detection guidance; {scored} carry draft NISS scores." |
| M10 SECURITY.md | AMEND | Above "Reporting a Vulnerability": A1, then "The TARA catalog exists to inform defense. Do not test cataloged techniques on people, or on devices you are not authorized to test. Research involving human participants needs ethics approval and informed consent. Report gaps in the catalog's defensive guidance here too." Then link to A3. |
| M11 governance README | ACCEPT | "Neuroethics constraints, regulatory context and process documents for the QIF framework." followed by A3 in full (canonical home). |
| M12 epic-security-toolbox | AMEND | Keep Red/Blue/Purple in the general-security sections. Rename the BCI section "Threat-model coverage analysis (tabletop)". Add "Run only against systems you own or are authorized to test." Hold "does not send signals to a device" until verified. Replace "135" with "the TARA catalog". |
| M13 atlas branch `list_terms` | AMEND | "A catalog entry is one threat technique documented in TARA, a proposed catalog for threat modeling. \"Filed under\" means an AI placed a paper's finding beside a region; each statement says what the paper itself is about." Regenerate the snapshot. |
| L1–L6 | Not drafted | Fix on next touch. Two panel overrides: L3 aligns the enum with the CVSS v4 Exploit Maturity values (Attacked / POC / Unreported); L4 deletes "Geneva Convention (if weaponized)" rather than rewording it. |

## 4. Implementation list (priority order; file or page for each)

1. **H10** whitepaper 524B claims: `src/pages/research/whitepaper/index.astro` (lines 1483, 1510, 1558), plus correction banners on `v6.astro`, `v7.astro`, `v7-1.astro`.
2. **H11** TARA Lab badges: `src/components/threat-model/ComplianceChecklist.tsx`.
3. **Defensive coverage data:** decide whether to backfill detection/mitigation for QIF-T0136–T0161 or relabel them, and build the gap-list page that A3 and M10 link to. Files: `datalake/qtara-registrar.json` (registrar workflow) and a new atlas page. Must land before item 5 so that `{detected}` copy ships honestly.
4. **A3 canonical home:** `governance/README.md` (M11); sitewide footer status line and badge in `src/components/Footer.astro`.
5. **Homepage:** `src/pages/index.astro`. Covers H2 (meta, line 81), H3 (hero, 89–92), M9 (165–168) and H4 (269–290).
6. **H1, H6:** GitHub description of `qinnovates/neurosecurity` and the org description (settings); `qinnovates/.github/profile/README.md`.
7. **H5:** `README.md` (neurosecurity repo).
8. **H8:** `src/pages/atlas/scoring.astro` (lines 90, 137, 148, 185).
9. **H7:** `src/pages/atlas/tara.astro` (title, badge, lead); evidence-status badge in `src/pages/atlas/tara/[id].astro`.
10. **H9:** `src/pages/mission/index.astro`.
11. **M10:** `SECURITY.md` and `governance/SECURITY.md`.
12. **M1:** `datalake/qtara/pyproject.toml` description and long description; takes effect on PyPI at the next release.
13. **M2, M3:** `datalake/qtara-registrar.json` (`notes` of the 26 IDs; names of T0011, T0046, T0065, T0099, with aliases and changelog), via the registrar and propagation rules.
14. **M5:** `src/pages/atlas/clinical.astro` (316, 340, 364).
15. **M6:** `src/pages/governance/rights.astro:22`, plus the G4 count in `osi-of-mind/GUARDRAILS.md`.
16. **M4, M7, M8:** metas in `atlas/chains.astro`, `atlas/index.astro`, `atlas/explorer.astro`, `atlas/tara/ttps.astro`, `atlas/device-filter.astro`, `atlas/analysis/index.astro`.
17. **M13:** `src/lib/anatomy/limits-copy.ts` on `feat/atlas-region-view-mounts` (PR #179), with the snapshot regenerated.
18. **M12:** `qinnovates/epic-security-toolbox` README.
19. **L1–L6:** on next touch.

## 5. Pre-publish checks for Kevin (unverified in this session)

1. Section 524B statutory text and the cyber device definition; which prongs `ComplianceChecklist.tsx` actually evaluates.
2. What `.claude/rules/whitepaper-archival.md` allows for archived copies (banner or edit).
3. "Not peer reviewed" is still true at publish time.
4. Your CVSS SIG role: whether FIRST or the SIG reviewed NISS in any capacity. The H8 wording says only "not approved or endorsed"; adjust if a review happened, without implying endorsement.
5. The registrar's definitions of CONFIRMED, DEMONSTRATED and EMERGING, before any "observed" or "lab-demonstrated" wording is used.
6. The MITRE/MDIC 2021 playbook and the CISA BCI foresight-exercise facts; run the ATT&CK search and record the date.
7. The data source for `{m}` and `{detected}`.
8. What the epic-security-toolbox BCI flow actually does (M12).
9. The "11 bands" and "9 categories" figures are current.
10. Whether `clinical.safe_parameters` (therapeutic dose envelopes) should stay public next to attack entries.
11. No DSM-5-TR criteria text is reproduced anywhere (APA copyright).
12. The T0103 "~60 Hz" figure and the T0065 sources.
13. The T0136–T0161 decision (item 3) before the homepage copy ships.
14. The governance link path in the org profile resolves.
