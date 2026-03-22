#!/bin/bash
# Pre-commit hook: scan derivation log and governance docs for sensitive patterns.
# Blocks commit if Tier 1 sensitive data is detected in new lines.
#
# Install: cp scripts/governance-precommit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
# Or:      ln -sf ../../scripts/governance-precommit.sh .git/hooks/pre-commit

SENSITIVE_FILES=(
  "osi-of-mind/QIF-DERIVATION-LOG.md"
  "governance/DECISION-LOG.md"
  "governance/TRANSPARENCY.md"
)

# Tier 1 patterns — auto-block, no exceptions
PATTERNS=(
  '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
  '(\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}'
  'sk-[a-zA-Z0-9]{20,}'
  'ghp_[a-zA-Z0-9]{36}'
  'xoxb-[0-9]+-[0-9]+'
  'AKIA[0-9A-Z]{16}'
  '-----BEGIN .* PRIVATE KEY-----'
  '/Users/[a-zA-Z0-9._-]+/'
  '/home/[a-zA-Z0-9._-]+/'
  'EP_[A-Z][0-9]{2}'
  'SUB-[0-9]+'
  'IRB-[0-9]+-[0-9]+'
  '\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b'
)

PATTERN_NAMES=(
  "Email address"
  "Phone number"
  "OpenAI API key"
  "GitHub PAT"
  "Slack token"
  "AWS access key"
  "Private key"
  "macOS home path"
  "Linux home path"
  "EEG subject identifier"
  "Subject identifier"
  "IRB protocol number"
  "SSN"
)

# Known safe patterns to whitelist (prevent false positives)
WHITELIST=(
  "noreply@anthropic.com"
  "noreply@github.com"
  "/Users/mac/"   # Generic example in docs — actual path is fine in CLAUDE.md but not in governance
)

EXIT_CODE=0

for file in "${SENSITIVE_FILES[@]}"; do
  # Only check staged changes to these specific files
  STAGED_DIFF=$(git diff --cached -- "$file" 2>/dev/null)
  if [ -z "$STAGED_DIFF" ]; then
    continue
  fi

  # Only scan added lines (lines starting with +, excluding the +++ header)
  ADDED_LINES=$(echo "$STAGED_DIFF" | grep '^+' | grep -v '^+++')

  for i in "${!PATTERNS[@]}"; do
    MATCHES=$(echo "$ADDED_LINES" | grep -E "${PATTERNS[$i]}" 2>/dev/null)
    if [ -n "$MATCHES" ]; then
      # Check whitelist
      IS_WHITELISTED=false
      for wl in "${WHITELIST[@]}"; do
        if echo "$MATCHES" | grep -qF "$wl"; then
          IS_WHITELISTED=true
          break
        fi
      done

      if [ "$IS_WHITELISTED" = false ]; then
        echo "BLOCKED: ${PATTERN_NAMES[$i]} detected in $file"
        echo "  Pattern: ${PATTERNS[$i]}"
        echo "  Match: $(echo "$MATCHES" | head -1 | sed 's/^+//' | head -c 100)"
        echo ""
        EXIT_CODE=1
      fi
    fi
  done
done

if [ $EXIT_CODE -ne 0 ]; then
  echo "=== SENSITIVE DATA DETECTED ==="
  echo "Derivation log or governance docs contain sensitive patterns."
  echo "Fix the issues above, then re-stage and commit."
  echo ""
  echo "If this is a false positive, bypass with: git commit --no-verify"
  echo "(Use sparingly — document why in the commit message)"
  exit 1
fi

exit 0
