#!/bin/bash
set -e

echo "[prebuild] Starting..."

# 1. Create output directories
mkdir -p src/site/data src/site/data/parquet src/site/papers

# 2. Copy source JSON to src/site/data (static serving)
echo "[prebuild] Copying data files..."
cp datalake/qtara-registrar.json src/site/data/
cp datalake/derivation-timeline.json src/site/data/
cp datalake/validation-registry.json src/site/data/
cp datalake/research-registry.json src/site/data/

# 3. Generate KQL JSON (async-fetchable tables for BciKql)
echo "[prebuild] Generating KQL JSON..."
node src/scripts/generate-kql-json.mjs

# 4. Generate Parquet datasets (optional — requires pyarrow)
if python3 -c "import pyarrow" 2>/dev/null; then
  echo "[prebuild] Generating Parquet..."
  python3 src/scripts/generate-parquet.py
else
  echo "[prebuild] Skipping Parquet (pyarrow not installed)"
fi

# 4b. Copy Parquet from datalake to site for serving
if [ -d datalake/parquet ]; then
  echo "[prebuild] Copying Parquet to src/site/data/parquet/..."
  cp -r datalake/parquet/* src/site/data/parquet/
fi

# 5. Regenerate governance docs from derivation log
echo "[prebuild] Regenerating governance docs..."
node src/scripts/generate-governance.mjs

# 6. Copy paper PDF if it exists
if [ -f research/paper/main.pdf ]; then
  cp research/paper/main.pdf src/site/papers/qif-bci-security-2026.pdf
fi

echo "[prebuild] Done."
