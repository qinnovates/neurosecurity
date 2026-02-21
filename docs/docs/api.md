# QIF API Documentation

Programmatic access to the full Quantified Interconnection Framework dataset: 103 threat techniques, 24 BCI devices, 38 brain regions, 13 physics constraints, and scoring systems. All cross-referenced by QIF hourglass band IDs.

**Interactive docs:** [qinnovate.com/bci/api](https://qinnovate.com/bci/api/)

## Base URL

```
https://qinnovate.com/api
```

All endpoints are static JSON generated at build time. No authentication required. CORS enabled (`Access-Control-Allow-Origin: *`). Cache: `public, max-age=3600`.

---

## Endpoints

### 1. Unified QIF Dataset (recommended)

**Endpoint:** `GET /api/qif.json`

Returns the complete QIF dataset as a single JSON object. This is the recommended endpoint for new integrations.

```bash
curl https://qinnovate.com/api/qif.json
```

**Response structure:**

```json
{
  "version": "1.0",
  "generated": "2026-02-21T...",
  "description": "Unified QIF dataset...",

  "hourglass_bands": [...],

  "threats": {
    "techniques": [...],
    "categories": [...],
    "tactics": [...],
    "domains": [...],
    "changelog": {...},
    "stats": {...},
    "tara_stats": {...},
    "dsm5_stats": {...},
    "physics_feasibility": {...},
    "neurorights": {...},
    "regulatory": {...}
  },

  "devices": {
    "inventory": [...],
    "stats": {...}
  },

  "brain_atlas": {
    "regions": [...],
    "device_mappings": [...],
    "neural_latency": [...],
    "physics_constraints": [...]
  },

  "physics": {
    "constraints": [...],
    "categories": [...],
    "constants": [...],
    "validation": {...}
  },

  "specs": {
    "niss": {...},
    "tara": {...},
    "dsm5": {...}
  },

  "timeline": [...],
  "current_stats": {...}
}
```

**Key sections:**

| Section | Description | Count |
|---------|-------------|-------|
| `hourglass_bands` | QIF 11-band model (7 neural, 1 interface, 3 synthetic) | 11 |
| `threats.techniques` | TARA attack techniques with NISS scores, bands, dual-use, DSM-5 mappings | 103 |
| `threats.categories` | Attack categories (SI, SE, DM, DS, PE, CI, PS, EX) | 8 |
| `threats.tactics` | TARA tactics from registry | 15 |
| `devices.inventory` | BCI devices with specs, band mappings, threat profiles | 24 |
| `brain_atlas.regions` | Brain structures with neuroanatomical data | 38 |
| `brain_atlas.device_mappings` | Device-to-brain-region links | varies |
| `physics.constraints` | BCI Limits Equation constraints | 13 |
| `physics.constants` | Physical constants used in calculations | 14 |
| `specs.niss` | Neural Impact Scoring System specification | 1 |
| `specs.tara` | TARA specification (v1.6) | 1 |
| `specs.dsm5` | DSM-5 bridge specification | 1 |
| `timeline` | Project milestones from derivation log | 30+ |
| `current_stats` | Live dataset statistics (31 metric counters) | 1 |

**Cross-referencing:** Everything links through QIF hourglass band IDs. A threat technique targets bands, bands map to brain regions, brain regions map to devices, devices have physics constraints. One graph.

---

### 2. TARA Registry (legacy)

**Endpoint:** `GET /api/tara.json`

Returns TARA threat techniques only. Same data as `qif.json > threats`, but without devices, atlas, or physics.

```bash
curl https://qinnovate.com/api/tara.json
```

**Response:**

```json
{
  "version": "1.0",
  "generated": "2026-02-21T...",
  "stats": {
    "total": 103,
    "by_severity": { "critical": 5, "high": 28, "moderate": 45, "low": 25 }
  },
  "changelog": {...},
  "techniques": [
    {
      "id": "TARA-001",
      "name": "Neural Signal Injection",
      "severity": "critical",
      "bands": ["I0", "N1"],
      "description": "...",
      "tara": {
        "dual_use": "confirmed",
        "clinical": {
          "therapeutic_analog": "Deep Brain Stimulation",
          "conditions": ["Parkinson's Disease"]
        }
      }
    }
  ]
}
```

---

### 3. STIX 2.1 Threat Intelligence (legacy)

**Endpoint:** `GET /api/stix.json`

Returns TARA data formatted as STIX 2.1 (Structured Threat Information Expression) objects. Compatible with standard threat intelligence platforms (TIPs).

```bash
curl https://qinnovate.com/api/stix.json
```

**Headers:**
- `X-Generator: Qinnovate-QIF-Stix-Engine/1.0`
- `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`

**Response:**

```json
{
  "type": "bundle",
  "id": "bundle--<uuid>",
  "spec_version": "2.1",
  "objects": [
    {
      "type": "identity",
      "id": "identity--qinnovate-tara",
      "name": "Qinnovate Interface Framework (QIF)",
      "identity_class": "organization",
      "sectors": ["technology", "healthcare", "research"]
    },
    {
      "type": "attack-pattern",
      "id": "attack-pattern--tara001",
      "name": "Neural Signal Injection",
      "description": "...",
      "kill_chain_phases": [
        { "kill_chain_name": "qif-interaction-chain", "phase_name": "exploitation" }
      ],
      "external_references": [
        { "source_name": "QIF TARA", "external_id": "TARA-001", "url": "https://qinnovate.com/TARA/TARA-001" }
      ],
      "x_qif_severity": "critical",
      "x_qif_bands": ["I0", "N1"],
      "x_qif_dual_use": "confirmed"
    }
  ]
}
```

---

### 4. RSS Feed

**Endpoint:** `GET /rss.xml`

RSS 2.0 feed combining intelligence briefs and blog publications. Sorted by date descending.

```bash
curl https://qinnovate.com/rss.xml
```

---

## Usage Examples

### JavaScript / TypeScript

```javascript
const res = await fetch('https://qinnovate.com/api/qif.json');
const qif = await res.json();

// Get all critical threats targeting cortical implants
const corticalDevices = qif.devices.inventory
  .filter(d => d.deviceType === 'Cortical BCI');

const corticalBands = [...new Set(
  corticalDevices.flatMap(d => d.qifBands)
)];

const criticalThreats = qif.threats.techniques
  .filter(t => t.severity === 'critical')
  .filter(t => t.bands.some(b => corticalBands.includes(b)));
```

### Python

```python
import requests

qif = requests.get('https://qinnovate.com/api/qif.json').json()

# Find devices that target the hippocampus
hippo_devices = [
    m['device_id']
    for m in qif['brain_atlas']['device_mappings']
    if 'hippocampus' in m.get('target_regions', [])
]

# Get physics constraints for those devices
for dev in qif['devices']['inventory']:
    if dev['id'] in hippo_devices:
        print(f"{dev['name']}: {dev['thermalBudget']}")
```

### curl + jq

```bash
# Count threats by severity
curl -s https://qinnovate.com/api/qif.json | jq '.threats.stats.severity'

# List all device names
curl -s https://qinnovate.com/api/qif.json | jq '[.devices.inventory[].name]'

# Get physics constants
curl -s https://qinnovate.com/api/qif.json | jq '.physics.constants'

# STIX attack patterns only
curl -s https://qinnovate.com/api/stix.json | jq '[.objects[] | select(.type=="attack-pattern") | .name]'
```

---

## Python SDK (`qtara`)

Official Python package for the QIF/TARA framework.

### Installation

```bash
pip install qtara
```

### CLI

```bash
# List all critical threats
qtara list --severity critical

# Get details on a specific technique
qtara info TARA-001

# Generate an academic citation
qtara cite
```

### Programmatic

```python
import requests

# Fetch STIX feed and process
stix = requests.get("https://qinnovate.com/api/stix.json").json()

for obj in stix['objects']:
    if obj['type'] == 'attack-pattern':
        print(f"{obj['external_references'][0]['external_id']}: {obj['name']}")
```

---

## Data Sources

The API is built from these shared data files at compile time:

| File | Feeds | Description |
|------|-------|-------------|
| `shared/qtara-registrar.json` | `qif.json`, `tara.json`, `stix.json` | Master threat registry (103 techniques) |
| `shared/qif-brain-bci-atlas.json` | `qif.json` | Brain regions, device mappings, neural latency, physics constraints |
| `docs/bci-hardware-inventory.json` | `qif.json` | 24 BCI device specifications |
| `shared/derivation-timeline.json` | `qif.json` | Project milestones and current stats |
| `src/lib/bci-limits-constants.ts` | `qif.json` | BCI Limits Equation (13 constraints, 14 constants) |
| `src/lib/qif-constants.ts` | `qif.json` | 11 hourglass bands, coherence thresholds |
| `src/lib/threat-data.ts` | `qif.json`, `tara.json`, `stix.json` | Threat categories, tactics, domains, NISS/TARA/DSM-5 specs |
| `src/lib/news-data.ts` | `rss.xml` | Intelligence briefs |
| `src/data/external-news-cache.json` | News page | Cached RSS feeds (auto-updated daily) |

When any of these source files change and a build runs, the API responses update automatically.

---

## Rate Limiting

Currently unrestricted for academic and research use.

## License

Creative Commons Attribution 4.0 International (CC BY 4.0). Data must be attributed to **Qinnovate Interface Framework (QIF)**.
