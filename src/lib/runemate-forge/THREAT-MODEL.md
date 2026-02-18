# Runemate Forge — Threat Model

## Context

Runemate Forge compiles HTML/CSS into Staves bytecode for delivery to brain-computer interface (BCI) implants. The compiler runs on the server/device side. The bytecode is encrypted via NSP and delivered to an on-chip interpreter. A compromised bytecode payload could manipulate neural rendering on an implanted device.

**Threat actors:** Malicious content authors, compromised servers, supply chain attackers, man-in-the-middle (pre-encryption).

**Trust boundary:** The compiler accepts untrusted HTML/CSS input and produces bytecode that will be trusted by the on-chip interpreter after decryption.

---

## Attack Surface Map

### 1. INPUT: Untrusted HTML/CSS

| Vector | Attack | Impact | Mitigation |
|--------|--------|--------|------------|
| Oversized input | Multi-MB HTML → OOM during parsing | DoS on compiler host | **M1:** Hard input size limit (configurable, default 1 MB) |
| Deeply nested DOM | `<div><div><div>...` 10K deep → stack overflow in recursive parser | Crash / DoS | **M2:** Max DOM depth limit (default 256) |
| Pathological HTML | Malformed tags causing html5ever to allocate excessively | DoS | **M3:** html5ever is battle-tested (Servo), but enforce input size limit upstream |
| `<script>` injection | Script tags in BCI UI template | XSS equivalent on neural interface | **M4:** Hard block `<script>`, `<style>`, event handler attrs. Not warn — reject. |
| CSS bomb | `style="width:999999999999999999px"` | Integer overflow in value parsing | **M5:** Clamp all parsed values to safe ranges. px: ±32767, percentages: 0-10000 |
| Excessive attributes | 10K attributes on a single element | Memory exhaustion | **M6:** Max attributes per element (default 64) |
| Excessive elements | 100K elements → huge bytecode | Memory / size exhaustion | **M7:** Max total elements (configurable, default 4096 for BCI) |
| Unicode exploits | RTL override, zero-width chars in text | Visual spoofing on neural display | **M8:** Strip/warn on Unicode control characters (categories Cc, Cf except newline/tab) |
| Attribute value injection | Malicious href/src values | Depends on interpreter behavior | **M9:** Sanitize URLs in attributes (allowlist protocols: none for v1.0, just preserve as data) |

### 2. COMPILER INTERNALS

| Vector | Attack | Impact | Mitigation |
|--------|--------|--------|------------|
| String table overflow | >65535 unique strings | Index wraps / corrupted bytecode | **M10:** Error on string table overflow, never wrap |
| Style table overflow | >65535 unique style sets | Index wraps | **M11:** Error on style table overflow |
| Integer overflow in size calculations | total_size exceeds u32 | Truncated size field → interpreter reads past buffer | **M12:** Check total_size fits u32 before writing header |
| Panic in codegen | Unwrap/expect on internal state | Compiler crash | **M13:** Zero unwrap/expect in non-test code. All fallible ops return Result. |
| Non-deterministic output | HashMap ordering changes between runs | Different bytecode for same input → cache invalidation, debugging hell | **M14:** Use BTreeMap or sort keys before emission |

### 3. BYTECODE OUTPUT (consumed by on-chip interpreter)

| Vector | Attack | Impact | Mitigation |
|--------|--------|--------|------------|
| Malformed header | Corrupted offsets point outside buffer | Interpreter reads garbage / crashes | **M15:** Validate all offsets are within total_size during encoding |
| Out-of-bounds string index | TEXT opcode references index beyond string table | Interpreter buffer overread | **M16:** Validate all string indices during codegen. Disassembler also validates. |
| Out-of-bounds style index | STYLE_REF references index beyond style table | Interpreter buffer overread | **M17:** Validate all style indices during codegen |
| Unterminated elements | ELEMENT_OPEN without matching CLOSE | Interpreter stack overflow | **M18:** Track open/close balance during codegen, error on mismatch |
| Excessively large bytecode | Bytecode larger than on-chip SRAM | Interpreter can't load | **M19:** Max bytecode output size (configurable, BCI default 256 KB) |

### 4. DEPENDENCY SUPPLY CHAIN

| Vector | Attack | Impact | Mitigation |
|--------|--------|--------|------------|
| Compromised crate | Malicious code in transitive dep | Full compiler compromise | **M20:** Run `cargo audit` in CI. Pin versions in Cargo.lock. |
| Unnecessary deps | Wider attack surface | More code to trust | **M21:** Remove `bincode` (replaced by custom codegen). Evaluate `bitvec` necessity. Minimize new deps. |
| `unsafe` in deps | Memory safety holes | Potential exploitation | **M22:** Audit `unsafe` usage with `cargo geiger`. Accept only in crypto/parsing hot paths. |

### 5. NSP INTEGRATION (upstream, not in scope for Forge itself)

| Vector | Attack | Impact | Mitigation |
|--------|--------|--------|------------|
| Nonce reuse | AES-GCM nonce reused → key recovery | Total session compromise | Upstream: nsp-core must enforce nonce uniqueness |
| Key material in memory | Secret keys not zeroed on drop | Cold boot / memory dump attack | Upstream: nsp-core should implement Zeroize+Drop |
| Return value confusion | `encapsulate()` return order mismatch | Shared secret / ciphertext swapped | Upstream: Fix API naming |

---

## Security Requirements (Hardening Spec)

### R1: Input Limits (enforced before parsing)
```
max_input_bytes:    1_048_576  (1 MB)
max_dom_depth:      256
max_elements:       4_096      (BCI default, configurable)
max_attrs_per_elem: 64
max_bytecode_bytes: 262_144    (256 KB)
```

### R2: Blocked Content (hard reject, not warn)
- `<script>` elements → `ForgeError`
- `<style>` elements → `ForgeError`
- Event handler attributes (`on*`) → stripped with warning
- `javascript:` protocol in href/src → stripped with warning

### R3: Value Clamping
- Pixel values: clamped to `[-32767, 32767]`
- Percentage: clamped to `[0, 10000]` basis points
- vh/vw: clamped to `[0, 10000]`
- font-size: clamped to `[1, 255]`
- z-index: clamped to `[-32767, 32767]`

### R4: Deterministic Output
- Attribute iteration order must be deterministic (BTreeMap or sorted)
- Same input always produces identical bytecode

### R5: No Panics
- Zero `unwrap()` or `expect()` in library code (non-test)
- All errors propagated via `Result<T, ForgeError>`

### R6: Bytecode Integrity
- All indices validated in-bounds before encoding
- Open/close balance verified
- Header offsets cross-checked against actual positions
- Magic bytes and version always present and correct

### R7: Dependency Minimalism
- Remove `bincode` after custom codegen
- Evaluate `bitvec` — replace with manual bit ops if only used for enum packing
- No new runtime dependencies without security justification
- `cargo audit` must pass in CI

---

## TARA Integration

The TARA `SafetyProfile` is NOT optional post-processing. It is a **compile gate**:

1. SafetyProfile is checked BEFORE parsing (input size)
2. SafetyProfile is checked DURING AST construction (element count, depth)
3. SafetyProfile is checked AFTER codegen (output size)
4. BCI default profile is ALWAYS active unless explicitly disabled

This means TARA validation moves from Phase 6 to Phase 1. It's wired into the pipeline from the start.

---

## Revised Implementation Order

```
Phase 0:  Spec + Scope + THIS THREAT MODEL  ← done
Phase 1:  AST + Error Model + SafetyProfile + Input Limits
Phase 2:  CSS Resolution (with value clamping)
Phase 3:  Real Bytecode Codegen (with index validation, deterministic output)
Phase 4:  Disassembler (hardened reader with bounds checks)
Phase 5:  Test Suite (including adversarial inputs, fuzz testing)
Phase 6:  Benchmarks
Phase 7:  Diagnostics (line/col in warnings)
Phase 8:  CLI
Phase 9:  Docs + Version Bump
```

Key changes from original plan:
- TARA moves to Phase 1 (was Phase 6)
- Disassembler moves to Phase 4 (was Phase 5) — it's a security tool, not just testing
- Adversarial test cases are first-class, not afterthoughts
- `bincode` removed after Phase 3
- `bitvec` evaluated for removal
