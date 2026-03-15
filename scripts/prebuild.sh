#!/bin/bash
set -e

echo "[prebuild] Starting..."

# 1. Create output directories
mkdir -p docs/data docs/data/parquet docs/papers

# 2. Copy source JSON to docs/data (static serving)
echo "[prebuild] Copying data files..."
cp datalake/qtara-registrar.json docs/data/
cp datalake/derivation-timeline.json docs/data/
cp datalake/validation-registry.json docs/data/
cp datalake/research-registry.json docs/data/

# 3. Generate KQL JSON (async-fetchable tables for BciKql)
echo "[prebuild] Generating KQL JSON..."
node scripts/generate-kql-json.mjs

# 4. Generate Parquet datasets
echo "[prebuild] Generating Parquet..."
python3 scripts/generate-parquet.py

# 5. Regenerate governance docs from derivation log
echo "[prebuild] Regenerating governance docs..."
node scripts/generate-governance.mjs

# 6. Copy paper PDF if it exists
if [ -f paper/main.pdf ]; then
  cp paper/main.pdf docs/papers/qif-bci-security-2026.pdf
fi

echo "[prebuild] Done."
