# Demo Atlas — Wireframes (Text-Based)

## Screen 0: Hub (Entry Point)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEMO ATLAS                                  │
│         Explore BCI threats, therapeutics, and neural signals        │
│                    in one unified workflow                           │
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐ │
│  │   🛡  SECURITY    │  │   🧠  CLINICAL    │  │   ⌨  ANALYST   │ │
│  │                   │  │                   │  │                 │ │
│  │  Start with a     │  │  Start with a     │  │  Query the      │ │
│  │  BCI device or    │  │  condition or     │  │  datalake       │ │
│  │  threat category  │  │  therapeutic area │  │  directly       │ │
│  │                   │  │                   │  │                 │ │
│  │  ► Select Device  │  │  ► Select         │  │  ► Open         │ │
│  │  ► Browse Threats │  │    Condition      │  │    Console      │ │
│  │                   │  │  ► Browse         │  │                 │ │
│  │                   │  │    Therapeutics   │  │                 │ │
│  └───────────────────┘  └───────────────────┘  └─────────────────┘ │
│                                                                     │
│  ──────────────────────────────────────────────────────────────────  │
│  161 techniques │ 68 devices │ 28 EEG datasets │ 31 Parquet tables  │
│  Proposed framework. Not validated. Open to critique.               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Screen 1: Device Picker

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◄ Demo Atlas  ›  Select Device                                       │
├──────────┬───────────────────────────────────────────────────────────┤
│ CONTEXT  │  ┌─────────────────────────────────────────────────────┐  │
│          │  │ 🔍 Search devices...                                │  │
│ Device:  │  └─────────────────────────────────────────────────────┘  │
│  (none)  │                                                           │
│          │  Filter: [All] [Non-invasive] [Invasive] [Consumer]       │
│ Threat:  │          [FDA Cleared] [Research Only]                    │
│  (none)  │                                                           │
│          │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│ Signal:  │  │ OpenBCI      │ │ Neuralink    │ │ Emotiv       │      │
│  (none)  │  │ Cyton        │ │ N1           │ │ EPOC X       │      │
│          │  │              │ │              │ │              │      │
│ ──────── │  │ Non-invasive │ │ Invasive     │ │ Consumer     │      │
│ PANELS   │  │ 8 channels   │ │ 1024 ch      │ │ 14 channels  │      │
│          │  │ 22 threats   │ │ 45 threats   │ │ 12 threats   │      │
│ Device ● │  │              │ │              │ │              │      │
│ Threats  │  │ [Select →]   │ │ [Select →]   │ │ [Select →]   │      │
│ Signals  │  └──────────────┘ └──────────────┘ └──────────────┘      │
│ Console  │                                                           │
│ Export   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│          │  │ Muse 2       │ │ BrainGate    │ │ NextMind     │      │
│ [Start   │  │ Consumer     │ │ Invasive     │ │ Consumer     │      │
│  Over]   │  │ 4 channels   │ │ 96 ch        │ │ 8 channels   │      │
│          │  │ 8 threats    │ │ 38 threats   │ │ 6 threats    │      │
│          │  └──────────────┘ └──────────────┘ └──────────────┘      │
└──────────┴───────────────────────────────────────────────────────────┘
```

---

## Screen 2: Device Profile + Auto-Matched Threats

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◄ Demo Atlas  ›  OpenBCI Cyton  ›  Profile                          │
├──────────┬───────────────────────────────────────────────────────────┤
│ CONTEXT  │                                                           │
│          │  OPENBCI CYTON                          [Non-invasive]    │
│ Device:  │  OpenBCI Inc. │ Brooklyn, NY │ $6M funding               │
│ ● Cyton  │                                                           │
│          │  ┌─────────┬─────────┬──────────┬──────────┬──────────┐  │
│ Threat:  │  │ 8 ch    │ EEG     │ 250 Hz   │ Research │ Open     │  │
│  (none)  │  │ channels│ modality│ sampling │ grade    │ source   │  │
│          │  └─────────┴─────────┴──────────┴──────────┴──────────┘  │
│ Signal:  │                                                           │
│  (none)  │  ═══ AUTO-MATCHED THREATS ════════════════════════════    │
│          │  22 TARA techniques affect this device                    │
│ ──────── │                                                           │
│ PANELS   │  ██████░░░░  4 critical  ███████░░░  8 high              │
│          │  █████████░  7 medium    ███░░░░░░░  3 low               │
│ Device ● │                                                           │
│ Threats ◄│  ┌────────┬────────────────────────┬────────┬──────────┐ │
│ Signals  │  │ ID     │ Technique              │ NISS   │ Severity │ │
│ Console  │  ├────────┼────────────────────────┼────────┼──────────┤ │
│ Export   │  │ T0001  │ Signal injection       │ 6.1    │ ● HIGH   │ │
│          │  │ T0003  │ Eavesdropping          │ 2.7    │ ○ LOW    │ │
│          │  │ T0004  │ Man-in-the-middle      │ 5.2    │ ● HIGH   │ │
│          │  │ T0042  │ BLE side-channel       │ 4.1    │ ◐ MED    │ │
│          │  │ ...    │ (18 more)              │        │          │ │
│          │  └────────┴────────────────────────┴────────┴──────────┘ │
│          │                                                           │
│          │  Click any technique to see signal patterns ↓             │
└──────────┴───────────────────────────────────────────────────────────┘
```

---

## Screen 3: Technique Detail + Signal Pattern Match

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◄ Demo Atlas  ›  OpenBCI Cyton  ›  QIF-T0001 Signal Injection       │
├──────────┬───────────────────────────────────────────────────────────┤
│ CONTEXT  │                                                           │
│          │  QIF-T0001 — Signal Injection      TARA-SOM-M-001        │
│ Device:  │  ═══════════════════════════════════════════════════      │
│ ● Cyton  │                                                           │
│          │  NISS: 6.1 (medium)  │  Bands: I0–N1  │  Tier 0          │
│ Threat:  │  Status: CONFIRMED   │  Dual-use: ✓                      │
│ ● T0001  │                                                           │
│          │  ┌─ SECURITY VIEW ──────────┬─ CLINICAL VIEW ──────────┐ │
│ Signal:  │  │ Electrical current at    │ tDCS/tACS neuromodulation│ │
│  (none)  │  │ electrode-tissue I0      │ Major depressive disorder│ │
│          │  │ modulating local field   │ Chronic pain, stroke     │ │
│ ──────── │  │ potentials               │ FDA: CLEARED             │ │
│ PANELS   │  │ Severity: HIGH           │ Evidence: RCT            │ │
│          │  │ Consent: enhanced        │ Safe: 2mA, 30min/session │ │
│ Device   │  └──────────────────────────┴──────────────────────────┘ │
│ Threats  │                                                           │
│ Signals ◄│  ═══ MATCHING EEG PATTERNS ════════════════════════════  │
│ Console  │                                                           │
│ Export   │  ┌──────────────────────────────────────────────────────┐ │
│          │  │ 📊 ADHD Mendeley Resting State                      │ │
│          │  │    Pattern: Frontal theta elevation at Fz            │ │
│          │  │    Relevance: "Frontal theta elevation maps to       │ │
│          │  │    QIF-T0001 signal injection at I0 band"            │ │
│          │  │    Channels: 19 │ Subjects: 61 │ 128 Hz             │ │
│          │  │    [View Dataset →]  [Open in Console →]            │ │
│          │  └──────────────────────────────────────────────────────┘ │
│          │  ┌──────────────────────────────────────────────────────┐ │
│          │  │ 📊 Motor Imagery BCI                                │ │
│          │  │    Pattern: Mu rhythm ERD + posterior alpha          │ │
│          │  │    [View Dataset →]  [Open in Console →]            │ │
│          │  └──────────────────────────────────────────────────────┘ │
└──────────┴───────────────────────────────────────────────────────────┘
```

---

## Screen 4: Condition Picker (Clinical Entry)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◄ Demo Atlas  ›  Select Condition                                    │
├──────────┬───────────────────────────────────────────────────────────┤
│ CONTEXT  │  ┌─────────────────────────────────────────────────────┐  │
│          │  │ 🔍 Search conditions...                             │  │
│ (none)   │  └─────────────────────────────────────────────────────┘  │
│          │                                                           │
│ ──────── │  MOVEMENT DISORDERS                                       │
│ PANELS   │  ┌──────────────────┐ ┌──────────────────┐               │
│          │  │ Parkinson's      │ │ Essential Tremor  │               │
│ Condition│  │ F20-F29          │ │ G25.0             │               │
│ Therapy ●│  │ 8 techniques     │ │ 3 techniques      │               │
│ Signals  │  │ 2 EEG datasets   │ │ 1 EEG dataset     │               │
│ Console  │  │ Key: tPBM, VNS,  │ │ Key: FUS, DBS     │               │
│ Export   │  │ DBS, NPs         │ │                    │               │
│          │  └──────────────────┘ └──────────────────┘               │
│          │                                                           │
│          │  NEURODEVELOPMENTAL                                       │
│          │  ┌──────────────────┐ ┌──────────────────┐               │
│          │  │ ADHD             │ │ Autism (ASD)      │               │
│          │  │ F90              │ │ F84               │               │
│          │  │ 5 techniques     │ │ 3 techniques      │               │
│          │  │ 3 EEG datasets   │ │ 1 EEG dataset     │               │
│          │  └──────────────────┘ └──────────────────┘               │
│          │                                                           │
│          │  MOOD DISORDERS                                           │
│          │  ┌──────────────────┐ ┌──────────────────┐               │
│          │  │ Depression       │ │ Anxiety           │               │
│          │  │ F32-F33          │ │ F41               │               │
│          │  │ 12 techniques    │ │ 4 techniques      │               │
│          │  │ Key: VNS, tFUS,  │ │ Key: tVNS, GABA   │               │
│          │  │ TMS, tPBM, EA   │ │ tDCS, 40Hz        │               │
│          │  └──────────────────┘ └──────────────────┘               │
│          │                                                           │
│          │  SEIZURE DISORDERS │ SLEEP │ NEUROCOGNITIVE │ ...         │
└──────────┴───────────────────────────────────────────────────────────┘
```

---

## Screen 5: Therapeutic Profile + Cofactors

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◄ Demo Atlas  ›  Parkinson's Disease  ›  Therapeutics                │
├──────────┬───────────────────────────────────────────────────────────┤
│ CONTEXT  │                                                           │
│          │  PARKINSON'S DISEASE                                      │
│ Cond.:   │  DSM-5: G20 │ Dopaminergic pathway │ SNc/VTA             │
│ ● Parkin │                                                           │
│          │  ═══ AUTO-MATCHED THERAPEUTICS ═══════════════════════    │
│ ──────── │                                                           │
│ PANELS   │  ┌────────┬───────────────────┬──────────┬────────┬────┐ │
│          │  │ ID     │ Therapeutic Analog │ FDA      │ Evid.  │Tier│ │
│ Cond.    │  ├────────┼───────────────────┼──────────┼────────┼────┤ │
│ Therapy●│  │ T0136  │ Transcranial PBM  │ Investig.│ Pre-S  │ 0  │ │
│ Signals  │  │ T0137  │ UCNP optogenetics │ None     │ Pre    │ 1  │ │
│ Console  │  │ T0138  │ HUP photovoltaic  │ None     │ Pre    │ 1  │ │
│ Export   │  │ T0139  │ Photothermal Au   │ None     │ Pre    │ 1  │ │
│          │  │ T0141  │ Magnetothermal    │ None     │ Pre    │ 1  │ │
│          │  │ T0149  │ Implanted VNS     │ Approved │ Clin-V │ 1  │ │
│          │  │ T0154  │ VNS serotonin     │ Approved │ Pre-S  │ 1  │ │
│          │  │ T0155  │ tFUS DRN          │ Investig.│ Pre    │ 2  │ │
│          │  └────────┴───────────────────┴──────────┴────────┴────┘ │
│          │                                                           │
│          │  ═══ COFACTOR DEPENDENCIES ═══════════════════════════    │
│          │                                                           │
│          │  ┌─────────────┬──────────────────┬────────────────────┐ │
│          │  │ Cofactor    │ Role             │ Deficiency Effect  │ │
│          │  ├─────────────┼──────────────────┼────────────────────┤ │
│          │  │ Fe²⁺ (Iron) │ TH catalytic     │ TH abolished;      │ │
│          │  │             │ cofactor         │ D2 receptors -53%  │ │
│          │  │ BH4         │ TH consumed per  │ DA neurons have    │ │
│          │  │             │ cycle            │ 2.3-7.3× less      │ │
│          │  │ Vitamin B6  │ AADC cofactor    │ L-DOPA → DA fails  │ │
│          │  │ ATP         │ VMAT2 loading    │ Vesicle load ↓     │ │
│          │  └─────────────┴──────────────────┴────────────────────┘ │
│          │                                                           │
│          │  ═══ MATCHING EEG DATA ═══════════════════════════════   │
│          │  2 datasets: Motor Imagery BCI, Sleep-EDF                │
│          │  [View Datasets →]                                       │
└──────────┴───────────────────────────────────────────────────────────┘
```

---

## Screen 6: Query Console (Advanced)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◄ Demo Atlas  ›  Console                                             │
├──────────┬───────────────────────────────────────────────────────────┤
│ CONTEXT  │                                                           │
│          │  ┌─ KQL ──────────────────────────────────────────────┐  │
│ Device:  │  │ techniques                                         │  │
│ ● Cyton  │  │   | where severity == "critical"                   │  │
│          │  │   | where tara_domain == "EMO"                     │  │
│ ──────── │  │   | project id, name, tara_alias, niss_score       │  │
│          │  │   | sort niss_score desc                           │  │
│ Templates│  │                                                    │  │
│          │  │  [Run KQL ▶]                                       │  │
│ ► Device │  └────────────────────────────────────────────────────┘  │
│   threats│                                                           │
│ ► ADHD   │  ┌─ SQL (DuckDB-WASM) ────────────────────────────────┐ │
│   signals│  │ SELECT id, name, tara_alias, niss_score             │ │
│ ► Dopam. │  │ FROM techniques                                     │ │
│   cofact.│  │ WHERE severity = 'critical'                         │ │
│ ► Custom │  │ ORDER BY niss_score DESC                            │ │
│          │  │                                                    │  │
│ ──────── │  │  [Run SQL ▶]                     ⏱ timeout: 30s   │  │
│          │  └────────────────────────────────────────────────────┘  │
│ Console●│                                                           │
│ Export   │  ═══ RESULTS ═════════════════════════════════════════   │
│          │  5 rows returned (0.003s)           [Download CSV ↓]    │
│          │                                                           │
│          │  ┌────────┬─────────────────────┬────────────┬────────┐ │
│          │  │ id     │ name                │ tara_alias │ niss   │ │
│          │  ├────────┼─────────────────────┼────────────┼────────┤ │
│          │  │ T0002  │ Neural ransomware   │ MOT-D-001  │ 8.9    │ │
│          │  │ T0152  │ AChE BCI corruption │ COG-D-008  │ 8.2    │ │
│          │  │ T0047  │ Mass BCI compromise │ SIL-D-002  │ 7.8    │ │
│          │  │ T0160  │ FUS-BBB excitotoxic │ AUT-D-003  │ 7.5    │ │
│          │  │ T0161  │ CSD initiation      │ AUT-D-004  │ 7.1    │ │
│          │  └────────┴─────────────────────┴────────────┴────────┘ │
│          │                                                           │
│          │  🔒 Client-side only. No data leaves your browser.       │
│          │  Blocked: COPY, ATTACH, EXPORT, CREATE, external URLs    │
└──────────┴───────────────────────────────────────────────────────────┘
```

---

## Navigation Flow Summary

```
                    ┌──────────┐
                    │   HUB    │
                    │ 3 cards  │
                    └────┬─────┘
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        ┌──────────┐ ┌────────┐ ┌────────┐
        │ DEVICE   │ │CONDITION│ │CONSOLE │
        │ PICKER   │ │ PICKER │ │(direct)│
        └────┬─────┘ └───┬────┘ └────────┘
             ▼           ▼
        ┌──────────┐ ┌────────────┐
        │ DEVICE   │ │THERAPEUTIC │
        │ PROFILE  │ │ PROFILE    │
        │ + auto-  │ │ + cofactors│
        │ matched  │ │ + auto-    │
        │ threats  │ │ matched    │
        └────┬─────┘ └───┬────────┘
             │           │
             ▼           ▼
        ┌────────────────────┐
        │  TECHNIQUE DETAIL  │
        │  dual-use view     │
        │  + signal patterns │
        └────────┬───────────┘
                 ▼
        ┌────────────────────┐
        │  SIGNAL EXPLORER   │
        │  EEG datasets      │
        │  filtered by       │
        │  context           │
        └────────┬───────────┘
                 ▼
        ┌────────────────────┐
        │  QUERY CONSOLE     │
        │  KQL + SQL         │
        │  pre-populated     │
        │  from context      │
        └────────┬───────────┘
                 ▼
        ┌────────────────────┐
        │  EXPORT            │
        │  CSV / Parquet /   │
        │  Threat Report     │
        └────────────────────┘

  All panels accessible from sidebar at any time.
  Context persists across panels.
  URL params make every state shareable.
```
