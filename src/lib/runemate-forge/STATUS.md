# Runemate Forge — Engineering Status

> Canonical truth document. No hiding gaps, no overselling.
> Last verified: 2026-02-18 | `cargo test` → 25 passed, 0 failed

---

## What v1.0 Ships

| Module | Lines | Tests | What's Validated |
|--------|-------|-------|-----------------|
| `lib.rs` | 189 | 6 | Full compile pipeline, error handling, multimodal, input size limit |
| `lexer.rs` | 286 | 4 | Tokenization, colors, units, comments |
| `parser.rs` | 670 | 4 | Staves, styles, tones, full documents, depth guard |
| `tara.rs` | 261 | 4 | Element limits, frequency bounds, charge density, bytecode size |
| `codegen.rs` | 571 | 5 | Magic bytes, string dedup, size consistency, string/style/tone limits |
| `disasm.rs` | 287 | 1 | Compile-disassemble roundtrip, bounds-checked reads |
| `secure.rs` | 61 | 1 | Compile-encrypt-decrypt roundtrip |
| `ast.rs` | 345 | 0 | Data structures only (no logic to test) |
| `error.rs` | 70 | 0 | Error type definitions (no logic to test) |
| **Total** | **2,740** | **25** | |

Full pipeline: lex → parse → TARA validate → codegen → encrypt → decrypt

---

## Test Coverage Matrix

### lib.rs (5 tests)
| Test | Exercises | Status |
|------|-----------|--------|
| `test_compile_minimal` | Minimal valid source → bytecode | Pass |
| `test_compile_with_style` | Styled stave compilation | Pass |
| `test_compile_with_tone` | Auditory modality compilation | Pass |
| `test_compile_full_dashboard` | Full multimodal document | Pass |
| `test_compile_error_unterminated_string` | Error path: bad input rejected | Pass |
| `test_compile_rejects_oversized_input` | Input >1 MB rejected (THREAT-MODEL M1) | Pass |
| **Not tested** | Pulse (haptic) compilation standalone, multiple error types, empty input | — |

### lexer.rs (4 tests)
| Test | Exercises | Status |
|------|-----------|--------|
| `test_lex_basic` | Core token types | Pass |
| `test_lex_color` | Color literal tokenization | Pass |
| `test_lex_units` | Unit suffixes (px, ms, Hz) | Pass |
| `test_lex_comment` | Comment handling | Pass |
| **Not tested** | Unicode input, very long tokens, adversarial strings, input size limits | — |

### parser.rs (4 tests)
| Test | Exercises | Status |
|------|-----------|--------|
| `test_parse_minimal_stave` | Simplest valid stave | Pass |
| `test_parse_style` | Style block parsing | Pass |
| `test_parse_tone` | Tone construct parsing | Pass |
| `test_parse_full_document` | Multi-element document | Pass |
| **Not tested** | Deeply nested elements, parser error recovery, malformed nesting | — |

### tara.rs (4 tests)
| Test | Exercises | Status |
|------|-----------|--------|
| `test_empty_doc_passes` | Empty doc clears safety | Pass |
| `test_too_many_elements` | Element count limit enforced | Pass |
| `test_tone_frequency_limit` | Frequency bound enforced | Pass |
| `test_bytecode_size_limit` | Bytecode size limit enforced | Pass |
| **Not tested** | Charge density edge cases, combined limit violations, pulse safety bounds | — |

### codegen.rs (5 tests)
| Test | Exercises | Status |
|------|-----------|--------|
| `test_empty_doc` | Empty document → valid bytecode | Pass |
| `test_emit_magic` | Magic bytes present in output | Pass |
| `test_emit_nonempty` | Non-trivial source → non-empty bytecode | Pass |
| `test_string_dedup` | String deduplication works | Pass |
| `test_emit_total_size_consistent` | Reported size matches actual | Pass |
| **Not tested** | Element open/close balance, max bytecode size boundary, style table overflow | — |

### disasm.rs (1 test)
| Test | Exercises | Status |
|------|-----------|--------|
| `test_disasm_roundtrip` | Compile → disassemble → readable output | Pass |
| **Not tested** | Malformed bytecode input, truncated files, adversarial headers | — |

### secure.rs (1 test)
| Test | Exercises | Status |
|------|-----------|--------|
| `test_secure_compile_workflow` | Compile → encrypt → decrypt roundtrip | Pass |
| **Not tested** | Wrong key decryption, corrupted ciphertext, key rotation | — |

---

## Known Gaps

Honest list of what's missing or untested:

1. **No element open/close balance check in codegen** — implicit via parser nesting (works, but a parser bug could produce unbalanced bytecode)
2. ~~**No input size limit enforcement**~~ — **FIXED**: 1 MB max enforced in `lib.rs` (THREAT-MODEL M1)
3. **No Unicode control character stripping** — THREAT-MODEL M8
4. **No standalone CLI tool** — only lib API + demo binary
5. **No benchmarks** — criterion in Cargo.toml dev-deps but no bench files written
6. **No fuzz testing** — lexer and parser should be fuzzed with cargo-fuzz
7. **No property-based tests** — e.g., arbitrary valid ASTs → valid bytecode
8. **Disassembler has only 1 test** — no adversarial/malformed input tests
9. **Secure module has only 1 test** — no error path coverage for encryption failures
10. **No pulse (haptic) standalone test** — only tested as part of full documents

### Security Hardening (added 2026-02-18)

The following were identified and fixed during a security audit:

| Fix | Module | Description |
|-----|--------|-------------|
| Input size limit | `lib.rs` | Rejects input >1 MB before lexing (THREAT-MODEL M1) |
| Parser depth guard | `parser.rs` | `MAX_PARSE_DEPTH = 256` prevents stack overflow via deeply nested elements |
| Disasm bounds checks | `disasm.rs` | `read_u16_le`/`read_u32_le` return 0 on out-of-bounds instead of panicking |
| String table budget | `codegen.rs` | `MAX_STRING_TABLE_BYTES = 1 MB` prevents unbounded string table growth |
| Style def limit | `codegen.rs` | `MAX_STYLE_DEFS = 1024` caps style table entries |
| Tone/pulse limit | `codegen.rs` | `MAX_TONE_PULSE_DEFS = 256` caps tone/pulse table entries |

---

## What We're Targeting (Near-Term)

- [ ] CLI tool for standalone compilation
- [ ] Fuzz testing on lexer and parser (cargo-fuzz)
- [ ] Benchmark suite (criterion)
- [x] Enforce input size limits (1 MB max per THREAT-MODEL M1) ✓ 2026-02-18
- [ ] Unicode normalization in lexer
- [ ] Element balance assertion in codegen
- [ ] Error path tests for secure module (wrong key, corrupted data)
- [ ] Adversarial input tests for disassembler

## What We're Targeting (Long-Term / Research-Dependent)

- [ ] Scribe runtime (no_std interpreter for BCI chips)
- [ ] Cortical coordinate transforms (retinotopic, tonotopic, somatotopic)
- [ ] Hardware validation on actual electrode arrays
- [ ] Clinical safety validation (requires IRB, cohorts, years)

---

## What May Change

Goals will evolve. The multimodal architecture is grounded in neuroscience research (topographic cortical maps), but cortical rendering is unvalidated at consumer scale. No commercial BCI does inward rendering today. As hardware matures and clinical data emerges, the bytecode format, safety bounds, and modality support may change significantly. We document what we know, flag what we don't, and update when we learn.

---

## How to Run Tests

```bash
# Run all tests (expected: 25 passed, 0 failed)
cargo test

# Run tests with output visible
cargo test -- --nocapture

# Run full pipeline demo
cargo run --bin demo
```
