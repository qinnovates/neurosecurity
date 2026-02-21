# Runemate

Rendering pipeline for BCI neural content delivery. Compiles semantic content into compact bytecode (Staves format) with 67.8% compression, encrypted via NSP for secure transmission to implant-class interpreters.

## Table of Contents

- [Architecture](#architecture)
- [Forge (Gateway Compiler)](#forge-gateway-compiler)
- [Building](#building)
- [Specification](#specification)

## Architecture

Runemate splits into two components:

| Component | Environment | Rust Mode | Size |
|-----------|-------------|-----------|------|
| **Forge** | Gateway/server | `std` | Full compiler |
| **Scribe** | Implant/device | `no_std` | ~200 KB interpreter |

The Forge compiles content from the Runemate DSL into Staves bytecode. The Scribe interprets that bytecode on-device. TARA validates every output pattern before delivery, bounding both attack severity and therapeutic safety.

## Forge (Gateway Compiler)

The `forge/` crate is the DSL-to-Staves compiler. It handles lexing, parsing, code generation, disassembly, and NSP-encrypted output.

**Modules:**

| Module | Purpose |
|--------|---------|
| `lexer.rs` | Tokenizer for the Runemate DSL |
| `parser.rs` | AST construction from token stream |
| `ast.rs` | Abstract syntax tree definitions |
| `codegen.rs` | Staves bytecode generation |
| `disasm.rs` | Bytecode disassembler |
| `secure.rs` | NSP encryption integration |
| `tara.rs` | TARA safety validation |
| `error.rs` | Error types |

Depends on `nsp-core` for post-quantum encryption of compiled output.

## Building

Requires Rust (edition 2024).

```bash
# Build the compiler
cd qif-framework/runemate/forge
cargo build

# Run tests
cargo test

# Run the demo binary
cargo run --bin demo

# Run benchmarks
cargo bench
```

## Specification

- Full DSL spec: [RUNEMATE.md](../RUNEMATE.md) (173 KB, 19 sections, ~2900 lines)
- Website: [qinnovate.com/runemate](https://qinnovate.com/runemate/)

---

*v1.0, Native DSL Compiler. Apache 2.0.*
