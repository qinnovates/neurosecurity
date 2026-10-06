# EEG and non-invasive device inventory: delta for the October 2026 refresh

Accessed date for every source: 2026-10-06. Baseline: `../neurosecurity/datalake/bci-landscape.json` (uncommitted, 70 companies, 74 devices, last_verified 2026-08-13). Machine-readable proposals are in `eeg-delta.json`; sources in `sources-eeg.json`. Nothing outside `_staging/2026-10-refresh/` was written.

## Result

23 proposals: 19 adds and 4 updates. Three adds are marked UNVERIFIED (NextSense Smartbuds, FRENZ Brainband, Muse S Athena) because the manufacturer pages returned HTTP 429 and the facts come from press or an automated page summary. 19 of the 23 carry at least one null or flagged field; each is listed under `unverified_fields`.

| Target | Adds | Updates |
|---|---|---|
| `datalake/bci-landscape.json` new companies | 11 (16 devices) | |
| `datalake/bci-landscape.json` new devices under existing companies | 4 | |
| `datalake/bci-landscape.json` existing entries | | 4 |
| `src/site/bci-hardware-inventory.json` | 4 | |

If all landscape proposals were accepted the file would go from 70 to 81 companies and from 74 to 94 devices.

## Where the "list of EEGs" lives

There is no EEG-specific list. Three files are involved, and two of them are device inventories that do not agree with each other.

| File | What it is | Rendered by |
|---|---|---|
| `datalake/bci-landscape.json` → `companies[].devices[]` | Source of truth for the device directory (74 devices, 40 non-invasive). EEG devices are the entries with `type: "non_invasive"`; nothing marks modality at device level. | `/bci/directory` (`bci-directory-data.ts` → `BciDirectory.tsx`), `/research/landscape` (`BciLandscape`, `BciKql`), `/research/dashboard` (KQL tables `devices`, `companies`), `qif-stats.ts` device count |
| `src/site/bci-hardware-inventory.json` → `devices[]` | Separate 24-device spec sheet (created 2026-02-18). The only place sampling rate, wireless protocol, ADC resolution and electrode material are stored. | `/research/bci-explorer` (`bci-data.ts` → `BciExplorer.tsx`), KQL tables `hardware_specs` and `comms`, `timeline-check.mjs` `bci_devices` count |
| `datalake/eeg-samples.json` | Registry of 26 recorded EEG datasets (subjects, sampling rate, licence). Not a device list. | `/data-studio/eeg`, KQL |

A device has to be added to both inventories to show a wireless link or sampling rate. Seven EEG devices are in the hardware inventory today; one of them (g.tec Unicorn Hybrid Black) is missing from the landscape file.

## Fields the dashboard reads

**Directory and KQL `devices` table (from `bci-landscape.json`)**

- Device: `name`, `type`, `channels`, `electrode_type`, `fda_status`, `units_deployed`, `first_human`, `price_usd`, `target_use`, `cves_known`.
- Parent company: `name`, `type`, `status`, `company_category`, `funding_total_usd`, `security_posture`, `tara_attack_surface` (count only), plus `founded`, `headquarters`, `security_notes`, `valuation_usd`, `employees_approx` on company cards and the `companies` table.
- `/research/landscape` reads only `name`, `type`, `channels`, `units_deployed`, `first_human` per device.
- Not read by any adapter: device `note`, company `modality`, `funding_note`, `acquired_by`, `date_added`, `last_verified`.

**BCI Explorer and KQL `hardware_specs` / `comms` (from `bci-hardware-inventory.json`)**

- `id`, `manufacturer`, `device_name`, `device_type`, `fda_status`, `target_indication`.
- `core_specs`: `channel_count`, `battery_life`, `power_consumption_total`, `implant_dimensions`, `directionality`.
- `physics_constraints`: `sampling_rate`, `wireless_protocol`, `adc_resolution`, `electrode_material`, `electrode_impedance`, `signal_to_noise_ratio`, `thermal_dissipation`, `operating_frequency_neural`, `data_rate`.
- Joined by `id` to `device_region_mappings` in `datalake/qif-brain-bci-atlas.json` (bands, regions, threat list) and by a hard-coded map to `datalake/neurosecurity-scores.json`.

## Schema gaps that would stop an automotive EEG system displaying properly

1. **No home for the facts that define it.** `bci-landscape.json` has no field for sampling rate, wireless protocol, companion app, cloud sync, SDK access, security documentation, lifecycle (prototype, presale, discontinued), deployment context (simulator or road), partner or supplier, or non-FDA regulatory status. The device `note` field exists but no adapter passes it to a page, so everything written there is invisible. `security_notes` is truncated to 200 characters in the KQL `companies` table.
2. **Company-shaped parent.** Every device hangs off a company with funding, valuation, headcount and a security posture. For Nissan or Hyundai Mobis those are meaningless or misleading: a real funding figure would enter `total_funding_usd` and the `risk_profile` index, and `security_posture: none_published` would describe the automaker rather than the headset. Proposals leave these null. `company_category` has no automotive value.
3. **Unknown channel count.** B2V's channel count is unpublished. `BciDirectory.tsx` renders `String(device.channels)`, which prints "null ch"; the KQL builder turns null into 0, so the device would sort and filter as a zero-channel system.
4. **`fda_status` must be a non-null string.** `getFdaColor()` calls `status.toLowerCase()`. Every proposal therefore carries a string, using `not_applicable` or `unknown` where there is no FDA record. The colour lookup matches `'not applicable'` with a space, so the baseline's `not_applicable` already falls through to the default colour.
5. **`target_use` vocabulary.** No `automotive` or `workplace` value. Proposals use `research` (B2V) and `enterprise` (M.Brain). The filter is built from the data, so a new value would display, but it would be a vocabulary change.
6. **Explorer type label and threat join.** In the hardware inventory `non_invasive_eeg` is labelled "EEG (Consumer)". A new device with no `device_region_mappings` entry shows no bands and zero threats. The `comms` risk heuristic labels any string containing "bluetooth" as "HIGH (BLE sniffable)"; Bitbrain devices use Bluetooth 2.1 + EDR, which is Bluetooth Classic, so the label would be wrong.
7. **Directory adapter and component disagree (read from source; the site was not built or run).** `bci-directory-data.ts` emits `name`, `type`, `company_funding_usd` and stats keyed `total_companies`, `by_type`. `BciDirectory.tsx` expects `device_name`, `device_type`, `funding_total_usd`, `security_notes`, `tara_attack_surface`, `attack_surface_count`, `company_headquarters`, `company_founded`, `companies[].devices`, and stats keyed `totalCompanies`, `byType`. As written, `stats.byType['invasive']` reads a property of undefined. If the live page works, something other than these two files is supplying the props; this needs a build to confirm before any data is added.
8. **Stale and unsupported copy.** `src/pages/bci/directory.astro` hard-codes "57 companies. 68 devices" and "The most comprehensive open BCI device directory", which is a superlative the neuromodesty rule would not allow. KQL sample queries reference `comms` columns (`encryption`, `firmware_platform`, `device_type`) and a `devices.name` column that the builders do not emit.

Proposed fields are listed in `eeg-delta.json` under `proposed_fields`; none was added to an entry. Attack-surface facts are carried per item in an `attack_surface_facts` sidecar.

## Nissan Brain-to-Vehicle: what the sources state

| Question | Stated | Source |
|---|---|---|
| Hardware | Driver-worn headset developed by Bitbrain with Nissan. Dry sensors, wireless, active shielding, fitted in under two minutes, up to eight hours of operation. Nissan calls it a "skullcap". | Bitbrain 2025-06-09; Nissan technology library |
| Channel count | Not stated anywhere. "Minimising the number of sensors" is the only description. | Bitbrain |
| Sampling rate | Not stated for the B2V headset. Bitbrain's catalogue dry headsets run at 256 SPS, 24 bits. | Bitbrain product pages |
| Wireless link | "wirelessly via Bluetooth to the vehicle's onboard systems". Version, pairing and encryption not stated. Catalogue devices use Bluetooth 2.1 + EDR. | Bitbrain |
| What is decoded | Movement-related cortical potentials before intentional movement, error-related potentials for driver discomfort, and motor ERD/ERS. | Nissan technology library; Bitbrain |
| How far ahead | Nissan: systems act "0.2 to 0.5 seconds faster than the driver". Bitbrain and Nissan Spain: intentions "between 0.2 and 0.8 seconds" before execution; Bitbrain also says about 0.5 s and "up to one second" after per-driver calibration. | Nissan 2018-01-03; Nissan Spain 2020-07-08; Bitbrain |
| Accuracy | None given in any company source. | |
| Conditions | Public demonstration on a driving simulator at CES 2018, with per-driver calibration in the simulator. Bitbrain mentions "simulated environments and real-world trials" without detail. | Nissan; Bitbrain |
| Intended use | Research into driver assistance (earlier steering or braking support) and adapting autonomous driving style to discomfort. | Nissan |
| Status | Research. No production or on-road deployment announcement was found. The latest B2V-specific Nissan release located is from Nissan Spain, 2020-07-08. | UNVERIFIED beyond 2020 |

Peer-reviewed numbers come from two EPFL studies co-authored by Nissan's Lucian Gheorghe, the researcher Nissan names as leading B2V. The abstracts do not use the B2V name or identify the EEG hardware, so the link to the programme is an inference from authorship and topic.

- Zhang et al. 2015, J Neural Eng 12(6):066028, doi:10.1088/1741-2560/12/6/066028. Error-related potentials classified from EEG while driving: accuracy 0.698 ± 0.065 offline in a car simulator (N = 22) and 0.682 ± 0.059 in a real car (N = 8), both above chance.
- Khaliliardali et al. 2015, J Neural Eng 12(6):066006, doi:10.1088/1741-2560/12/6/066006. Anticipatory potentials in a driving simulator (N = 18): single-trial AUC 0.83 ± 0.13 for braking and 0.79 ± 0.12 for accelerating, detectable 320 ± 200 ms before the action.

Both DOIs resolve at Crossref with matching authors, titles and year. The company sources give lead times and no accuracy; these two abstracts are the only accuracy figures located, and the entry text keeps the two kinds of claim apart.

**Bitbrain devices.** The article links the Hero and Diadem product pages from generic anchor text and names neither as the B2V headset. Hero (9 dry channels over FC, C and CP sites; brochure says the layout is optimised for MRCPs and ERD/ERS) is **discontinued** per its product page. Diadem (12 dry channels, prefrontal to occipital, more than 8 h) and Air (8 dry channels) are current. All list CE (Directive 2014/53), which is the Radio Equipment Directive, not a medical-device certification, and no 510(k) was found under applicant "Bitbrain".

**"mEEG".** The string does not appear in the Bitbrain B2V article, in ten linked Bitbrain pages (checked in raw HTML) or in the text of the 2023 family brochure. The pages say "minimalist EEG" and "Minimal EEG", which is Bitbrain's name for its dry headset family (Diadem, Hero, Air), and use "mobile EEG" as a generic term for wearable systems. In the wider literature "mEEG" usually abbreviates "mobile EEG"; that reading came from a search summary and was not confirmed on a fetched page. If the term came from another document, it needs that document to settle which is meant.

**Two errors in the Bitbrain article.** It names the "Canadian National Research Council" as a partner, while the Nissan Spain release it links names the Instituto Nacional de Investigaciones Científicas de Canadá (INRS), a different institution. Its "ProPILOT Assist 2.0" link goes to Nissan's 2023 Formula E Brain to Performance release, which concerns brain-stimulation training and does not describe the test the paragraph reports.

## Biggest deltas against the baseline

- **Naox Link (NX01):** openFDA shows 510(k) K251550 decided 2025-11-25. Baseline says cleared 2026-01 with the K-number undisclosed. The company states the device is not CE-marked and not sold in the EU.
- **Neurable MW75 Neuro:** manufacturer states a 12-channel, 500 Hz system; baseline lists 6 channels.
- **New 2026 clearances not in the baseline:** Zeto New Wave K260455 (2026-03-13), Neuroelectrics Enobio Dx K261604 (2026-06-13), five Ceribell clearances between February and September 2026.
- **Dreem 3S is now sold as Waveband** by Beacon Biosignals under the same clearance.
- **IDUN Guardian 4** was still in presale on the access date (CHF 999), and its page states a cloud connection is needed.
- **Published security posture exists for two clinical vendors:** Epitel (SOC 2 Type 2, HIPAA and GDPR attestation, Health-ISAC membership, Cobalt penetration testing) and Ceribell (FedRAMP High statement, vulnerability-reporting notice). 62 of 70 baseline companies are `none_published`.
- **Bitbrain's own 2018 blog post** describes a Bluetooth Low Energy man-in-the-middle demonstration with GATTacker against an unnamed consumer EEG headset. It is a vendor-published account, not a paper, and may be worth a research-registry look.

## Attack-surface facts

Recorded per item in `attack_surface_facts`, only where a source states them. Wireless protocol is stated for Bitbrain (Bluetooth 2.1 + EDR), B2V and Waveband and DSI-24 (Bluetooth, version not given). Raw-data routes are stated for Bitbrain (LSL, C SDK), IDUN (SDK, API, raw EEG), Neurable Research Kit, g.tec Unicorn, Enobio, Naox Wave and Muse S Athena. No CVE was located for any proposed device, and no CVE database search by product name was run, so `cves_known: []` means "none found in the pages read".

`tara_attack_surface` is left empty on every new company. Mapping devices to technique identifiers is a registrar decision and was not attempted.

## Could not verify

- Channel counts for B2V, M.Brain, Zeto headsets, Ceribell, Waveband, Naox Wave, FRENZ, Muse S Athena and IDUN Guardian 4.
- Which 510(k) covers Zeto ONE (the 2024 record is named "Flexset System").
- B2V programme status after 2020.
- Neurable and HyperX partnership, seen only in a search snippet.
- Candidates not proposed: Mercedes-Benz VISION AVTR (HTTP 403), SmartCap LifeBand (no response), Elemind (HTTP 429), X-trodes System M and Neurosteer EEG Recorder (openFDA records seen, product pages not read).
- Founding year, headquarters and `company_category` for most new companies; left null.

No page contained instructions addressed to an automated reader.

## Decisions needed

1. Whether an automaker programme belongs in `companies[]` at all, or B2V should sit under Bitbrain with Nissan as a partner. The first is what the schema allows today.
2. Whether null `company_category`, `electrode_type` and `channels` are acceptable in the landscape file (the baseline has none for the first two), or the entries should wait for more sourcing.
3. Whether to add entries to `bci-hardware-inventory.json` and the atlas mapping at the same time, since that is the only route to showing wireless and sampling data.
4. Whether to fix the directory adapter and component mismatch before integrating any of this.
5. Which downstream counts to refresh on integration, per `.claude/rules/propagation.md`: prebuild KQL and parquet outputs, the hard-coded directory copy, and `bci_devices` in `src/data/qif-timeline.json`.
