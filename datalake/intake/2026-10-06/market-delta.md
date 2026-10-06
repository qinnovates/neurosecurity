# BCI market and company landscape: deltas since the baseline

Prepared 2026-10-06. Baseline: the uncommitted sibling copy of `datalake/bci-landscape.json` (70 companies, last_verified 2026-08-13). Machine-readable proposals are in `market-delta.json` (item IDs M-001 to M-063); sources are in `sources-market.json`.

**63 proposals: 18 adds, 45 updates. 50 are VERIFIED and 13 are UNVERIFIED.** Nothing outside `_staging/2026-10-refresh/` was written.

This was a triaged sweep, not an exhaustive one. About 20 of the 70 companies were individually re-checked. The rest keep their prior `last_verified` date and should not be read as "checked and unchanged".

## Biggest findings

1. **Four "none_published" postures are contradicted by live pages.** Neuralink publishes a Vulnerability Disclosure Program page. Medtronic, Boston Scientific and LivaNova each publish a coordinated disclosure process. The site's headline statistic moves from 62/70 to 58/70.
2. **Precision Neuroscience raised a $250M Series D (2026-09-24).** Total raised is now $430M, up from $183M in the baseline. A valuation of just over $1B was reported by the New York Times and is not company-confirmed.
3. **Paradromics' implant can now connect to personal internet-connected devices.** The FDA approval letter was announced on 2026-08-26. The company gave no security statement. On 2026-09-14 it reported real-time speech decoding in its one participant, with no accuracy, vocabulary or rate figures and no peer review.
4. **Boston Scientific disclosed a material cybersecurity incident.** It was identified on 2026-08-25 and reported under Form 8-K Item 1.05. Manufacturing and shipping were disrupted; the filing does not identify any device impact.
5. **Two CVE lists were incomplete.** InteraXon Muse 2 has CVE-2023-49914, which the baseline lacked. Natus Xltek NeuroWorks has at least eight CVEs in NVD against four in the baseline.

## Count of `security_posture: "none_published"`

| State | none_published | Total | Share |
|---|---|---|---|
| Baseline (2026-08-13 copy) | 62 | 70 | 88.6% |
| After verified updates only | 58 | 70 | 82.9% |
| If all three new companies are also accepted | 61 | 73 | 83.6% |

The four companies that change are Neuralink, Boston Scientific Neuromodulation, Medtronic DBS and LivaNova. Abbott would be a fifth, but its disclosure page could not be read, so it stays at none_published.

The three proposed new entries carry `none_published` only as a schema default. Their security pages were not assessed, so the third row overstates what is known.

## Deltas since the baseline

| Company | Field | Old value | New value | Source | Status |
|---|---|---|---|---|---|
| Precision Neuroscience | funding_total_usd | 183,000,000 | 430,000,000 | MedTech Dive 2026-09-25 | VERIFIED |
| Precision Neuroscience | valuation_usd | 500,000,000 | 1,000,000,000 ("just over", per NYT via TNW) | The Next Web 2026-09-24 | UNVERIFIED |
| Precision Neuroscience | Layer 7 units_deployed | 37 patients | 100+ patient procedures across 18 institutions (company-stated) | The Next Web 2026-09-24 | VERIFIED |
| Paradromics | security_notes | no mention | FDA letter allows personal internet-connected devices; speech decoding reported in 1 participant, no accuracy figures | paradromics.com 2026-08-26 and 2026-09-14 | VERIFIED |
| Neuralink | security_posture | none_published | minimal_claims (VDP page published) | neuralink.com/vulnerability-disclosure | VERIFIED fact, enum mapping needs a decision |
| Neuralink | security_notes | "No public security documentation" | VDP page exists; six sponsor-registered trials listed, including VOICE (speech, est. 6); no Blindsight trial registered | neuralink.com, ClinicalTrials.gov | VERIFIED |
| Neuralink | N1 units_deployed | ~20 | 26 to 27 (third-party reports only) | Ground News aggregation | UNVERIFIED, keep baseline |
| Synchron | funding_note | none | $345M total; company-stated valuation "nearly $1 billion" (Nov 2025) | Sacra | VERIFIED |
| Synchron | security_notes | "FDA pivotal trial IDE approved Jul 2023" | three new feasibility studies registered in 2026 (FOCUS-Canada, INTENT, FOCUS-Australia, est. 10 each); no pivotal study registered | ClinicalTrials.gov | VERIFIED |
| Motif Neurotech | DOT units_deployed | 0 (enrolling as of Apr 2026) | 0 confirmed; RESONATE Recruiting, start 2026-09, est. 20 | NCT07594483 | VERIFIED |
| Axoft | units_deployed | unknown | 5 in completed first-in-human trial; company states 11+ across studies | NCT06673264, Pulse 2.0 | VERIFIED |
| Axoft | first_human | null | 2025-03 | NCT06673264 | VERIFIED |
| INBRAIN Neuroelectronics | units_deployed | 1+ | 10 (completed Manchester study, acute intraoperative use) | NCT06368310 | VERIFIED |
| ONWARD Medical | ARC-BCI units_deployed | unknown | 7 study participants (2026-01-22) | ONWARD release via BioSpace | VERIFIED |
| Neurosoft Bioelectronics | fda_status | preclinical | clinical_trial | NCT06205160 | VERIFIED |
| Neurosoft Bioelectronics | funding_total_usd | 7,500,000 | 20,000,000 ("more than") | MassDevice, search listing only | UNVERIFIED |
| Science Corporation | security_notes | no mention | new PRIMA study Recruiting since 2026-04-22, est. 5 | NCT07266584 | VERIFIED |
| Boston Scientific Neuromodulation | security_posture | none_published | regulatory_compliance (published disclosure process, no bug bounty) | bostonscientific.com | VERIFIED |
| Boston Scientific Neuromodulation | security_notes | no incident | 2026-08-25 incident; 8-K Item 1.05; likely material to Q3 and FY2026 | SEC EDGAR | VERIFIED |
| Medtronic DBS | security_posture | none_published | regulatory_compliance (coordinated disclosure, security bulletins) | medtronic.com | VERIFIED |
| Medtronic DBS | security_notes | no CVE history | CISA ICSMA-18-137-01: CVE-2018-8849, CVE-2018-10631 (legacy neurostimulator programmer) | CISA, NVD | VERIFIED |
| LivaNova | security_posture | none_published | regulatory_compliance (Product Security page with CVD program) | livanova.com/en-us/security | VERIFIED |
| Abbott Neuromodulation | security_posture | none_published | regulatory_compliance | abbott.com, HTTP 404 on fetch | UNVERIFIED, keep baseline |
| Abbott Neuromodulation | security_notes | no incident | July 2026 cyberattack on cancer diagnostics business; no other units affected | MedTech Dive 2026-07-17 | VERIFIED |
| InteraXon (Muse) | Muse 2 cves_known | [] | [CVE-2023-49914] | NVD | VERIFIED |
| Natus Medical | Xltek cves_known | 4 CVEs | 8 CVEs (adds CVE-2017-2852, -2858, -2860, -2861) | NVD | VERIFIED |
| Merge Labs | security_notes | no mention | multi-year Butterfly Network ultrasound-on-chip licence, terms undisclosed | Digital Health News 2026-09-04 | VERIFIED |
| Galvani Bioelectronics | status | active | defunct (operations reported frozen) | Neurotech Reports 2026-04-30 | UNVERIFIED, keep baseline |
| Galvani Bioelectronics | units_deployed | unknown | 16 implanted before recruitment halted | Neurotech Reports 2026-04-30 | UNVERIFIED |
| Neuracle Technology | security_notes | IPO accepted 2026-06-11 | on-site inspection selected 2026-07-01; 2025 revenue about RMB 108M, none from NEO | 36Kr 2026-07-28 | VERIFIED |
| Neuracle Technology | valuation_usd | null | no value proposed (RMB 4B post-money reported) | 36Kr 2026-07-28 | UNVERIFIED |
| Neuracle Technology | founded | 2017 | 2011 | 36Kr 2026-07-28 | UNVERIFIED, conflict |
| MindMaze | security_notes | no mention | Aug 2026 simplification and CHF 8.0M financing | search listing only | UNVERIFIED |
| market_data | vc_aggregate_by_year 2025 | "partial year" | full year: $4.8B across 140 deals | Neurotech Futures 2026-01-12 | VERIFIED |
| market_data | security_gap.note | "No BCI company has published a security audit, bug bounty program, or dedicated CISO hire" | reworded to acknowledge the four published disclosure processes | company pages above | VERIFIED |

Timeline and funding-round additions (M-004, M-005, M-008, M-028, M-041, M-059, M-060) follow from the rows above.

## Market size and venture funding

| Source | Year | Value (USD bn) | CAGR | Date of source | Status |
|---|---|---|---|---|---|
| Meticulous Research | 2025 | 2.2 | | May 2026 | VERIFIED |
| Meticulous Research | 2026 | 2.8 | | May 2026 | VERIFIED |
| Meticulous Research | 2036 | 8.6 | 11.8% (2026 to 2036) | May 2026 | VERIFIED |
| Towards Healthcare | 2025 | 3.21 | | 2026-07-06 | VERIFIED |
| Towards Healthcare | 2026 | 3.75 | | 2026-07-06 | VERIFIED |
| Towards Healthcare | 2035 | 15.04 | 16.7% (2026 to 2035) | 2026-07-06 | VERIFIED |
| Research and Markets | 2025 | 2.41 | 15.8% to 2035 | 2025-10-03 | UNVERIFIED |

The two verified 2025 estimates differ by 46% (2.2 against 3.21), which is the same spread the dataset already shows for 2024.

Venture funding by year: the 2025 figure is unchanged at $4.8B across 140 deals, but it is a full-year figure, not a partial one. That total covers neurotech broadly, not BCI alone. No 2026 year-to-date total could be confirmed, so none is proposed.

## Proposed new companies

| Company | Why | Status |
|---|---|---|
| Phantom Neuro | Approval announced 2026-04-17 for CYBORG, a first-in-human study of an implanted muscle-machine interface (up to 10 participants, Melbourne) | VERIFIED; peripheral device, so inclusion is a scope decision |
| Nudge | Focused-ultrasound headset company; $100M Series A reported July 2025 | UNVERIFIED (tertiary source only) |
| Echo Neurotechnologies | Implantable speech BCI; $50M Series A and an FDA IDE reported | UNVERIFIED (no source could be read; no trials under that sponsor name) |

No verified new market approval (FDA De Novo or PMA, or NMPA) for a BCI was found after 2026-08-13. No source was found saying Neuracle's listing has completed or that a second invasive BCI has NMPA approval.

## What I could not verify

- **Neuralink implant count.** Only aggregators and a third-party video give 26 or 27. The company's updates page renders client-side and returned no content.
- **Neuralink VDP publication date.** The Internet Archive was offline, so I cannot say whether the page predates the baseline.
- **Abbott's disclosure page.** A search lists it; three URL variants returned 404.
- **Galvani's status.** One trade-press article with unnamed sources; no company statement. Companies House was not re-checked today.
- **Precision's valuation.** Attributed to the New York Times by a secondary outlet.
- **Neuracle's valuation and founding year.** One secondary source, whose English text mislabels the company as "BrainCo" in the body.
- **Employees.** No sourced headcount change was found for any company.
- **Trade press.** MassDevice, BioWorld, Fierce Biotech, MobiHealthNews, SCMP and Grand View Research blocked the fetcher (HTTP 403), which is why several items rest on other outlets.

No instructions aimed at an AI reader were found in any fetched page.

## Open questions for a human

1. **Enum mapping for published disclosure processes.** The schema has no value for "publishes a VDP". I mapped Neuralink to `minimal_claims` and the three device makers to `regulatory_compliance`. A new value such as `vdp_published` would be cleaner; it is listed under `proposed_fields`.
2. **The "no BCI company has published..." claim.** It appears in `security_gap.note` and likely in site copy. It still holds for audits and bug bounties, but not as a statement that nothing security-related is published.
3. **security.txt checks.** I did not request `/.well-known/security.txt` across company domains, because a sweep of 70 domains reads as probing under the brief's rule 6. It would be the quickest way to settle the other 58 postures if you sanction it.
4. **Scope.** Whether peripheral interfaces such as Phantom Neuro belong in the dataset.
5. **Synchron baseline note.** "FDA pivotal trial IDE approved Jul 2023" conflicts with the registry and should be corrected at integration.
6. **Remaining Natus CVE.** NVD returns nine NeuroWorks records; I retrieved eight.
