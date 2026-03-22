# The OSI of Mind

If someone loses their vision and a BCI can restore it, every layer between the electrode and the cortex must be secure. Not just encrypted. Not just authenticated. Secure in a way that accounts for the fact that the endpoint is a human brain.

This directory contains every piece of that puzzle.

## How the Pieces Fit

```
                    ┌─────────────────────────┐
                    │      RESTORED VISION     │
                    │   (the goal, not the tech)│
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
     ┌────────────────┐ ┌───────────────┐ ┌─────────────────┐
     │   QIF Model    │ │     NISS      │ │   GUARDRAILS    │
     │  (architecture)│ │   (scoring)   │ │  (constraints)  │
     │                │ │               │ │                 │
     │ 11-band        │ │ 6 neural      │ │ 8 neuroethics   │
     │ hourglass:     │ │ metrics that  │ │ checks that     │
     │ maps every     │ │ CVSS can't    │ │ prevent the     │
     │ layer from     │ │ express —     │ │ security tools  │
     │ cortex to      │ │ reversibility,│ │ from becoming   │
     │ cloud          │ │ consent,      │ │ surveillance    │
     │                │ │ neuroplastic  │ │ tools           │
     │                │ │ change        │ │                 │
     └───────┬────────┘ └───────┬───────┘ └────────┬────────┘
             │                  │                   │
             ▼                  ▼                   ▼
     ┌────────────────┐ ┌───────────────┐ ┌─────────────────┐
     │     TARA       │ │  Neurowall    │ │    Governance   │
     │  (threat map)  │ │  (detection)  │ │    (policy)     │
     │                │ │               │ │                 │
     │ 161 techniques │ │ Real-time     │ │ Consent models, │
     │ — every known  │ │ coherence     │ │ neurorights,    │
     │ way a BCI can  │ │ monitoring.   │ │ regulatory      │
     │ be attacked.   │ │ Detects when  │ │ compliance.     │
     │ 75% have       │ │ signals       │ │ Who decides     │
     │ therapeutic    │ │ deviate from  │ │ what the device │
     │ counterparts   │ │ baseline      │ │ is allowed      │
     │                │ │               │ │ to do           │
     └───────┬────────┘ └───────┬───────┘ └────────┬────────┘
             │                  │                   │
             ▼                  ▼                   ▼
     ┌────────────────┐ ┌───────────────┐ ┌─────────────────┐
     │     NSP        │ │   Runemate    │ │   Coherence     │
     │  (encryption)  │ │  (rendering)  │ │   Metric (Cs)   │
     │                │ │               │ │                 │
     │ Post-quantum   │ │ Compiles      │ │ Multi-signal    │
     │ wire protocol. │ │ visual        │ │ confidence      │
     │ ML-KEM-768,    │ │ content into  │ │ score. Fuses    │
     │ AES-256-GCM.   │ │ electrode     │ │ multiple data   │
     │ Secures the    │ │ stimulation   │ │ streams into    │
     │ pipe between   │ │ patterns.     │ │ one trust       │
     │ device and     │ │ This is how   │ │ signal: is      │
     │ brain          │ │ vision gets   │ │ this neural     │
     │                │ │ restored      │ │ activity real?  │
     └────────────────┘ └───────────────┘ └─────────────────┘
```

**Read top to bottom:** The goal is restored vision. To get there safely, you need architecture (QIF), threat awareness (TARA), scoring (NISS), constraints (Guardrails), detection (Neurowall), encryption (NSP), rendering (Runemate), trust measurement (Cs), and governance (policy). Remove any piece and the patient is exposed.

**Read bottom to top:** NSP secures the wire. Runemate encodes the signal. Cs validates it. Neurowall monitors it. TARA maps what can go wrong. NISS scores how bad it is. Guardrails keep the tools honest. QIF holds the architecture together. Governance decides who gets to use it and how.

## Directory Map

| Directory | What | Status |
|-----------|------|--------|
| [specs/](specs/) | NSP, Runemate, NISS extensions, guardrails, integration roadmap | Active specs |
| [whitepapers/](whitepapers/) | QIF Whitepaper v6.3, v8.0 draft, wiki, canonical truth | v8.0 in progress |
| [framework/](framework/) | 9-document architecture series (read in order) | Complete |
| [nsp/](nsp/) | NSP Rust implementation (post-quantum) | In development |
| [runemate/](runemate/) | Runemate compiler (Staves DSL → bytecode) | v1.0 compiler |
| [tools/](tools/) | Neurowall, neurosim, macshield | Prototypes |
| [tara-threat/](tara-threat/) | TARA technique deep-dives and PoCs | Active |
| [logs/](logs/) | Neurorights derivation log | Active |

## Source of Truth

These files stay at root because every build script depends on them:

| File | What |
|------|------|
| [QIF-DERIVATION-LOG.md](QIF-DERIVATION-LOG.md) | 113 entries — every decision, insight, correction |
| [QIF-FIELD-JOURNAL.md](QIF-FIELD-JOURNAL.md) | First-person research observations (Kevin's voice) |
| [QIF-RESEARCH-SOURCES.md](QIF-RESEARCH-SOURCES.md) | 340+ verified citations |
| [GUARDRAILS.md](GUARDRAILS.md) | 8 neuroethics constraints (G1-G8) |
| [VALIDATION.md](VALIDATION.md) | What has been tested, what has not |

## The Vision Problem

A cortical visual prosthesis takes camera input, processes it, and stimulates the visual cortex through an electrode array. The patient sees phosphenes — points of light — that form a rough image.

Every layer of that pipeline is an attack surface. A compromised rendering engine could inject false visual percepts. A tampered wire protocol could alter stimulation patterns. A rogue firmware update could change electrode behavior without the patient knowing.

QIF maps these layers. TARA catalogs the threats. NISS scores the harm. NSP encrypts the pipe. Runemate compiles the content. Neurowall watches for anomalies. Guardrails prevent the security tools from being repurposed for surveillance. Governance decides who has authority over the device.

No single piece solves the problem. Together, they are the security architecture that makes it possible to restore vision without exposing the patient to risks that current frameworks cannot even describe.

---

*Author: Kevin Qi*
*Status: Active Design Phase*
*See also: [qinnovate.com](https://qinnovate.com) | [TARA Atlas](https://qinnovate.com/TARA/) | [Preprint](https://doi.org/10.5281/zenodo.18640105)*
