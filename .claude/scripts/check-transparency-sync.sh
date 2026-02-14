#!/usr/bin/env bash
# Check if TRANSPARENCY.md validation table is in sync with Derivation Log
# Usage: bash .claude/scripts/check-transparency-sync.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TRANSPARENCY="$REPO_ROOT/governance/TRANSPARENCY.md"
# Check multiple possible locations for the Derivation Log
DERIV_LOG=""
for candidate in \
    "$REPO_ROOT/qif-framework/QIF-DERIVATION-LOG.md" \
    "$REPO_ROOT/../mindloft/drafts/ai-working/QIF-DERIVATION-LOG.md" \
    "$REPO_ROOT/../drafts/ai-working/QIF-DERIVATION-LOG.md"; do
    if [ -f "$candidate" ]; then
        DERIV_LOG="$candidate"
        break
    fi
done

# Count data rows in TRANSPARENCY.md validation table (lines starting with | 2026-)
TRANS_COUNT=$(grep -cE '^\| 2026-' "$TRANSPARENCY" 2>/dev/null || echo 0)

echo "=== Transparency Sync Check ==="
echo "TRANSPARENCY.md validation entries: $TRANS_COUNT"

if [ -f "$DERIV_LOG" ]; then
    # Count entries in Derivation Log that involve cross-AI validation
    DERIV_COUNT=$(grep -ciE '(gemini|multi-model|independent review|cross-ai|deepseek|grok|qwq|peer review)' "$DERIV_LOG" 2>/dev/null || echo 0)
    echo "Derivation Log validation-related lines: $DERIV_COUNT"
    echo ""

    if [ "$TRANS_COUNT" -eq 0 ]; then
        echo "WARNING: No validation entries found in TRANSPARENCY.md"
    else
        echo "Transparency table has $TRANS_COUNT entries."
        echo "Run a manual review if the Derivation Log has grown since last sync."
    fi
else
    echo "WARNING: Derivation Log not found at $DERIV_LOG"
    echo "Check that the path is correct relative to the repo root."
fi
