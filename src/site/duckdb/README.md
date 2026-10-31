# DuckDB-Wasm files served from this origin

The engine, its two workers and the Parquet reader extension are served from here, so the SQL
console loads nothing from another host.

| File | Source | Pinned SHA-256 |
|---|---|---|
| duckdb-eh.wasm, duckdb-mvp.wasm, duckdb-browser-*.worker.js | `@duckdb/duckdb-wasm` 1.32.0, copied unmodified | not pinned here; follows package-lock.json |
| ext/v1.1.1/wasm_eh/parquet.duckdb_extension.wasm | `https://extensions.duckdb.org/v1.1.1/wasm_eh/parquet.duckdb_extension.wasm` | `e24fb2953c6a80e32d17fa3921f90f1f05ccbfa40f382e77702c1e6af9b79479` |

The extension is 2,803,379 bytes. DuckDB signs its extensions and the engine rejects an unsigned or
altered file ("signature is either missing or invalid"). The hash is also checked by
`src/scripts/__tests__/duckdb-extension.test.mjs`, so a changed file fails the test run.

Only the `wasm_eh` build is hosted. A browser that falls back to the `mvp` engine cannot open the
Parquet tables until `ext/v1.1.1/wasm_mvp/` is added the same way.

To update: bump `@duckdb/duckdb-wasm`, read the version path the engine requests (it appears in the
failed request when the extension is missing), fetch that one file, check that the console opens a
table, then update the path and hash here and in the test.
