#!/usr/bin/env bash
# Run one atlas pipeline command inside its own virtual environment.
# Usage: atlas.sh <fetch|evidence|build|buildability|register|test> [arguments]
# ATLAS_CACHE_DIR: downloads, the archived transform and review sheets (default ~/.cache/qinnovate-atlas).
# ATLAS_VENV_DIR:  the virtual environment (default $ATLAS_CACHE_DIR/venv).
set -euo pipefail

pipeline_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export ATLAS_CACHE_DIR="${ATLAS_CACHE_DIR:-$HOME/.cache/qinnovate-atlas}"
venv_dir="${ATLAS_VENV_DIR:-$ATLAS_CACHE_DIR/venv}"
python_bin="$venv_dir/bin/python"
stamp="$venv_dir/.requirements.sha256"
wanted="$(cat "$pipeline_dir/requirements.txt" "$pipeline_dir/requirements-dev.txt" | shasum -a 256 | cut -d' ' -f1)"

if [[ ! -x "$python_bin" ]]; then
  mkdir -p "$ATLAS_CACHE_DIR"
  python3 -m venv "$venv_dir"
fi
if [[ ! -f "$stamp" || "$(cat "$stamp")" != "$wanted" ]]; then
  "$python_bin" -m pip install --quiet --require-hashes -r "$pipeline_dir/requirements.txt"
  "$python_bin" -m pip install --quiet --require-hashes -r "$pipeline_dir/requirements-dev.txt"
  printf '%s' "$wanted" > "$stamp"
fi

command="${1:?usage: atlas.sh <fetch|evidence|build|buildability|register|test> [arguments]}"
shift
if [[ "$command" == "test" ]]; then
  exec "$python_bin" -I -m pytest -p no:cacheprovider "$pipeline_dir/tests" "$@"
fi
exec "$python_bin" -I "$pipeline_dir/atlas_build.py" "$command" "$@"
