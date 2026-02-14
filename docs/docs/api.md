# QIF API Documentation

This API provides programmatic access to the **Threat Analysis & Risk Assessment (TARA)** framework, allowing security tools (SIEM, SOAR) and researchers to ingest verified BCI threat data.

## Base URL
`https://qinnovate.com/api`

## Endpoints

### 1. TARA Registry (JSON)
**Endpoint**: `GET /tara.json`

Returns the full QIF TARA registry, including all techniques, mechanisms, and dual-use classifications.

**Usage:**
```bash
curl https://qinnovate.com/api/tara.json
```

**Response Format:**
```json
{
  "version": "1.0",
  "generated": "2026-02-14T...",
  "stats": {
    "total_threats": 71,
    "critical_count": 5
  },
  "techniques": [
    {
      "id": "TARA-001",
      "name": "Neural Signal Injection",
      "severity": "critical",
      "bands": ["I0", "N1"],
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

### 2. STIX 2.1 Threat Intelligence (JSON)
**Endpoint**: `GET /stix.json`

Returns TARA data formatted as **STIX 2.1 (Structured Threat Information Expression)** objects, compatible with standard threat intelligence platforms (TIPs).

**Usage:**
```bash
curl https://qinnovate.com/api/stix.json
```

## Python SDK (`qtara`)

For researchers and developers, we provide an official Python package to interact with the QIF/TARA framework.

### Installation
```bash
pip install qtara
```

### CLI Usage
```bash
# List all critical threats in the registry
qtara list --severity critical

# Get detailed info on a specific mechanism
qtara info TARA-001

# Generate an academic citation for your research
qtara cite
```

### Programmatic Usage
You can use `qtara` to load and validate STIX data from this API:

```python
import requests
from qtara import STIXImporter # Hypothetical helper

# Fetch the live STIX feed
response = requests.get("https://qinnovate.com/api/stix.json")
stix_data = response.json()

# Process TARA objects
for obj in stix_data['objects']:
    if obj['type'] == 'attack-pattern':
        print(f"Verified Threat: {obj['name']}")
```

**Response Format:**
```json
{
  "type": "bundle",
  "id": "bundle--...",
  "objects": [
    {
      "type": "attack-pattern",
      "id": "attack-pattern--...",
      "name": "Neural Signal Injection",
      "description": "Injecting false neural signals...",
      "external_references": [
        {
          "source_name": "QIF TARA",
          "external_id": "TARA-001"
        }
      ]
    }
  ]
}
```

## Rate Limiting
Currently unrestricted for academic and research use.

## License
Creative Commons Attribution 4.0 International (CC BY 4.0). Data must be attributed to **Qinnovate Interface Framework (QIF)**.
