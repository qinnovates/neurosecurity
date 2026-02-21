#!/usr/bin/env bash
# monitor.sh - Sanitized firewall log extractor for Shield Dashboard
# Exports real-time socketfilterfw events to JSON for the UI.

set -euo pipefail

UI_DATA_DIR="$(dirname "$0")/ui/public/data"
mkdir -p "$UI_DATA_DIR"
JSON_FILE="$UI_DATA_DIR/firewall_events.json"

# Initialize empty JSON array if not exists
if [[ ! -f "$JSON_FILE" ]]; then
    echo "[]" > "$JSON_FILE"
fi

echo "Shield Dashboard Monitor started..."
echo "Polling macOS log stream for socketfilterfw events..."

# Use log stream to capture Application Firewall events
# Predicate focuses on socketfilterfw blocks/allows
log stream --predicate 'process == "socketfilterfw"' --style json | while read -r line; do
    # Skip non-JSON lines (metadata/headers)
    [[ "$line" != "{"* ]] && continue

    # Extract event data using simple awk/sed (to avoid jq dependency in base install)
    # We want: timestamp, event message
    TIMESTAMP=$(echo "$line" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    MESSAGE=$(echo "$line" | grep -o '"eventMessage":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

    # SANITIZATION: Strip specific IPs and hostnames for privacy
    # Replaces common IP patterns with [REDACTED]
    SAFE_MESSAGE=$(echo "$MESSAGE" | sed -E 's/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[IP_REDACTED]/g')

    # Convert to a simple JSON object and prepend to the array (limit to 50 events)
    EVENT_JSON="{\"timestamp\":\"$TIMESTAMP\",\"event\":\"$SAFE_MESSAGE\"}"
    
    # Update the JSON file (Note: This is a simple implementation for alpha)
    # real production would use a proper database or bounded buffer
    (
        echo "["
        echo "  $EVENT_JSON,"
        cat "$JSON_FILE" | sed '1d;$d' | head -n 49
        echo "]"
    ) > "${JSON_FILE}.tmp" && mv "${JSON_FILE}.tmp" "$JSON_FILE"

done
