# Layer Validation Rules

> Sub-instruction file for Editor Agent — validates 14-layer model accuracy

---

## ⚠️ CRITICAL: Domain Assignment Rule

**L8 is the BRIDGE. Everything above L8 is on the BIOLOGY side.**

```
L1-L7:  Silicon (OSI networking - computer side)
L8:     Bridge  (Neural Gateway - firewall location)
L9-L14: Biology (Neural/cognitive - brain side)
```

**Common Error:** Labeling L9-L14 as "Silicon" because they involve signal processing or protocols. This is WRONG. Even though L9-L10 involve digital processing of neural signals, they operate on the BIOLOGY side of the L8 bridge — they are processing neural data, not networking data.

**Memory Aid:** The bridge (L8) separates computers from brains. Below the bridge = computers (Silicon). Above the bridge = brains (Biology).

---

## Authoritative Definition

**Source:** `MAIN/legacy-core/publications/0-oni-framework/TechDoc-ONI_Framework.md`

### The 14 ONI Layers (Canonical)

| Layer | Name | Domain | Description |
|:-----:|------|--------|-------------|
| L1 | Physical Carrier | Silicon | Conveys raw data through electromagnetic means |
| L2 | Link Framing | Silicon | Handles error detection and synchronization |
| L3 | Network Routing | Silicon | Manages addressing and packet pathfinding |
| L4 | Transport Flow | Silicon | Ensures dependable delivery with flow management |
| L5 | Session State | Silicon | Oversees connection lifecycle |
| L6 | Data Encoding | Silicon | Translates formats, encryption, compression |
| L7 | Application Interface | Silicon | Provides user-accessible services and APIs |
| L8 | Neural Gateway | Bridge | Physical boundary between digital and biological (Firewall) |
| L9 | Signal Processing | Biology | Filtering, amplification, digitization (Filtering) |
| L10 | Neural Protocol | Biology | Neural data formatting, codecs (Encoding) |
| L11 | Cognitive Transport | Biology | Reliable neural data delivery (Delivery) |
| L12 | Cognitive Session | Biology | Context persistence, working memory (Context) |
| L13 | Semantic Layer | Biology | Meaning construction, intent decoding (Intent) |
| L14 | Identity Layer | Biology | Self-model, ethics, continuity of self (Self) |

---

## Validation Checks

### Check 1: Layer Name Accuracy

**Detection:** Search for tables containing "Layer" and layer numbers (L1-L14)

**Patterns to find:**
```
grep -E "L[0-9]{1,2}.*\|"
grep -E "\| L[0-9]"
grep -E "Layer.*[0-9]"
```

**Validation:** Each layer number must have the correct name:
- L1 = "Physical Carrier" (NOT "Molecular")
- L2 = "Link Framing" (NOT "Cellular")
- L8 = "Neural Gateway" (always correct, bridge layer)
- L9 = "Ion Channel Encoding" (NOT "Signal Processing")
- etc.

### Check 2: Domain Accuracy

**Silicon Layers:** L1-L7
**Bridge Layer:** L8
**Biology Layers:** L9-L14

**Common Error:** Domains inverted (Biology for L1-L7, Silicon for L9-L14)

### Check 3: Layer Count

**Must always be exactly 14 layers**

If document mentions "7-layer" or "OSI extension" — verify it explains the full 14.

---

## Files to Validate

These files contain layer references:

| File | Contains | Priority |
|------|----------|----------|
| `publications/0-oni-framework/README.md` | Full 14-layer table | CRITICAL |
| `publications/0-oni-framework/Blog-ONI_Framework.md` | Layer descriptions | HIGH |
| `MAIN/legacy-core/INDEX.md` | Layer references | HIGH |
| `oni-framework/oni/layers.py` | Code implementation | CRITICAL |
| Root `README.md` | May contain summary | MEDIUM |

---

## Common Errors

### Error Type 1: Inverted Model
**Wrong:**
```
L1: Molecular (Biology)
L7: Behavioral (Biology)
L9: Signal Processing (Silicon)
L14: Application (Silicon)
```

**Correct:**
```
L1: Physical Carrier (Silicon)
L7: Application Interface (Silicon)
L9: Signal Processing (Biology)
L14: Identity Layer (Biology)
```

### Error Type 2: OSI Names Used
**Wrong:** Using pure OSI names for L1-L7
```
L1: Physical
L2: Data Link
L3: Network
```

**Correct:** Using ONI-specific names
```
L1: Physical Carrier
L2: Link Framing
L3: Network Routing
```

### Error Type 3: Missing Layers
**Wrong:** Only showing 7 layers or skipping L8

**Correct:** All 14 layers, L8 (Neural Gateway) explicitly shown as bridge

---

## Action Protocol

**If mismatch found:**

1. **STOP** — Do not auto-fix layer content
2. **REPORT** — Show exact mismatch with line numbers
3. **PROPOSE** — Show correct values from authoritative source
4. **WAIT** — Require explicit user approval
5. **FIX** — Apply correction only after approval
6. **VERIFY** — Re-check after fix applied

---

## Verification Command

After fixing, verify all layer tables match:

```bash
# Find all layer tables
grep -rn "14 Layers\|L1.*L14\|Layer.*Silicon\|Layer.*Biology" MAIN/legacy-core/

# Compare against authoritative source
diff <(grep "L[0-9]" TechDoc-ONI_Framework.md) <(grep "L[0-9]" README.md)
```

---

*Layer Validation v1.0*
