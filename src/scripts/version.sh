#!/bin/bash
# TARA/QIF Semantic Versioning
# Usage: ./scripts/version.sh [major|minor|patch|show]
#
# Manages semantic versioning across VERSION file, package.json, and git tags.
# All version bumps create a git tag and update both sources of truth.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VERSION_FILE="$ROOT/VERSION"
PACKAGE_JSON="$ROOT/package.json"

# Colors (disabled if not a terminal)
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  GREEN='' YELLOW='' RED='' BOLD='' NC=''
fi

usage() {
  echo "Usage: $0 [major|minor|patch|show]"
  echo ""
  echo "Commands:"
  echo "  major   Bump major version (X.0.0) -- breaking changes"
  echo "  minor   Bump minor version (x.Y.0) -- new features, backward-compatible"
  echo "  patch   Bump patch version (x.y.Z) -- bug fixes, docs, maintenance"
  echo "  show    Display current version and recent tags"
  echo ""
  echo "Options:"
  echo "  --dry-run   Show what would happen without making changes"
  echo "  --no-tag    Update files but skip git tag creation"
  echo "  --help      Show this help message"
  exit 0
}

# Parse flags
DRY_RUN=false
NO_TAG=false
COMMAND=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --no-tag)  NO_TAG=true ;;
    --help|-h) usage ;;
    major|minor|patch|show) COMMAND="$arg" ;;
    *) echo -e "${RED}Unknown argument: $arg${NC}"; usage ;;
  esac
done

if [ -z "$COMMAND" ]; then
  usage
fi

# Read current version from VERSION file (single source of truth)
read_version() {
  if [ ! -f "$VERSION_FILE" ]; then
    echo -e "${RED}VERSION file not found at $VERSION_FILE${NC}" >&2
    exit 1
  fi
  tr -d '[:space:]' < "$VERSION_FILE"
}

# Validate semver format
validate_version() {
  local ver="$1"
  if ! echo "$ver" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo -e "${RED}Invalid version format: $ver (expected X.Y.Z)${NC}" >&2
    exit 1
  fi
}

# Bump version
bump_version() {
  local current="$1"
  local part="$2"
  local major minor patch

  IFS='.' read -r major minor patch <<< "$current"

  case "$part" in
    major) major=$((major + 1)); minor=0; patch=0 ;;
    minor) minor=$((minor + 1)); patch=0 ;;
    patch) patch=$((patch + 1)) ;;
  esac

  echo "${major}.${minor}.${patch}"
}

# Update VERSION file
update_version_file() {
  local new_ver="$1"
  echo "$new_ver" > "$VERSION_FILE"
}

# Update package.json version field
update_package_json() {
  local new_ver="$1"
  if [ ! -f "$PACKAGE_JSON" ]; then
    echo -e "${YELLOW}No package.json found, skipping${NC}"
    return
  fi

  # Use node for reliable JSON editing (no sed JSON mangling)
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
    pkg.version = '$new_ver';
    fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
  "
}

# Check for uncommitted changes
check_clean_tree() {
  if ! git -C "$ROOT" diff --quiet HEAD 2>/dev/null; then
    echo -e "${YELLOW}Warning: You have uncommitted changes.${NC}"
    echo "Consider committing before tagging."
    echo ""
  fi
}

# --- Commands ---

cmd_show() {
  local current
  current=$(read_version)
  validate_version "$current"

  echo -e "${BOLD}Current version:${NC} v${current}"
  echo ""

  # Show package.json version for comparison
  if [ -f "$PACKAGE_JSON" ]; then
    local pkg_ver
    pkg_ver=$(node -e "console.log(require('$PACKAGE_JSON').version)" 2>/dev/null || echo "unknown")
    if [ "$pkg_ver" != "$current" ]; then
      echo -e "${YELLOW}package.json version: $pkg_ver (out of sync!)${NC}"
    else
      echo -e "package.json version: ${GREEN}$pkg_ver (in sync)${NC}"
    fi
  fi

  echo ""
  echo -e "${BOLD}Recent tags:${NC}"
  git -C "$ROOT" tag -l 'v*' --sort=-version:refname | head -10 || echo "  (no tags found)"
}

cmd_bump() {
  local part="$1"
  local current new_ver

  current=$(read_version)
  validate_version "$current"
  new_ver=$(bump_version "$current" "$part")

  echo -e "${BOLD}Version bump:${NC} v${current} -> v${new_ver} (${part})"
  echo ""

  if $DRY_RUN; then
    echo -e "${YELLOW}[dry-run]${NC} Would update VERSION file"
    echo -e "${YELLOW}[dry-run]${NC} Would update package.json"
    if ! $NO_TAG; then
      echo -e "${YELLOW}[dry-run]${NC} Would create git tag v${new_ver}"
    fi
    return
  fi

  check_clean_tree

  # Update files
  update_version_file "$new_ver"
  echo -e "${GREEN}Updated${NC} VERSION -> $new_ver"

  update_package_json "$new_ver"
  echo -e "${GREEN}Updated${NC} package.json -> $new_ver"

  # Stage version files
  git -C "$ROOT" add "$VERSION_FILE" "$PACKAGE_JSON" 2>/dev/null || true

  # Create git tag
  if ! $NO_TAG; then
    local tag_msg="v${new_ver}: ${part} release"
    git -C "$ROOT" tag -a "v${new_ver}" -m "$tag_msg"
    echo -e "${GREEN}Created${NC} git tag v${new_ver}"
    echo ""
    echo "To push the tag:"
    echo "  git push origin v${new_ver}"
    echo "  git push origin v${new_ver} --tags  # (push all tags)"
  fi

  echo ""
  echo -e "${GREEN}Done.${NC} Remember to commit the version bump:"
  echo "  git commit -m '[Release] v${new_ver}'"
}

# --- Main ---

case "$COMMAND" in
  show)  cmd_show ;;
  major) cmd_bump major ;;
  minor) cmd_bump minor ;;
  patch) cmd_bump patch ;;
esac
