#!/usr/bin/env bash
# macshield uninstaller
set -euo pipefail

INSTALL_PATH="/usr/local/bin/macshield"
SUDOERS_PATH="/etc/sudoers.d/macshield"
PLIST_NAME="com.qinnovates.macshield.plist"
LAUNCH_AGENT_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME"
KEYCHAIN_SERVICE="com.macshield.trusted"
STATE_FILE="/tmp/macshield.state"
LOCK_FILE="/tmp/macshield.lock.d"

echo "=== macshield uninstaller ==="
echo ""
echo "This will remove:"
echo "  1. $INSTALL_PATH"
echo "  2. $SUDOERS_PATH (sudoers fragment)"
echo "  3. $LAUNCH_AGENT_PATH"
echo "  4. Keychain entries under \"$KEYCHAIN_SERVICE\""
echo "  5. Ephemeral state files (/tmp/macshield.*)"
echo ""
echo "Your hostname and firewall settings will remain as currently set."
echo ""
read -rp "Proceed? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

# 1. Unload and remove LaunchAgent
if [[ -f "$LAUNCH_AGENT_PATH" ]]; then
    echo "Unloading LaunchAgent..."
    launchctl bootout "gui/$(id -u)/$PLIST_NAME" 2>/dev/null || true
    rm -f "$LAUNCH_AGENT_PATH"
    echo "  Removed: $LAUNCH_AGENT_PATH"
else
    echo "  LaunchAgent not found. Skipping."
fi

# 2. Remove binary
if [[ -f "$INSTALL_PATH" ]]; then
    sudo rm -f "$INSTALL_PATH"
    echo "  Removed: $INSTALL_PATH"
else
    echo "  Binary not found. Skipping."
fi

# 3. Remove sudoers fragment
if [[ -f "$SUDOERS_PATH" ]]; then
    sudo rm -f "$SUDOERS_PATH"
    echo "  Removed: $SUDOERS_PATH"
else
    echo "  Sudoers fragment not found. Skipping."
fi

# 4. Remove Keychain entries
echo "Removing Keychain entries..."
while security delete-generic-password -s "$KEYCHAIN_SERVICE" 2>/dev/null; do
    true
done
while security delete-generic-password -s "$KEYCHAIN_SERVICE.hostname" 2>/dev/null; do
    true
done
echo "  Keychain entries removed."

# 5. Remove state files
rm -f "$STATE_FILE" /tmp/macshield.stdout.log /tmp/macshield.stderr.log
rm -f "$HOME/Library/Logs/macshield.stdout.log" "$HOME/Library/Logs/macshield.stderr.log"
rmdir "$LOCK_FILE" 2>/dev/null || true
echo "  State files removed."

echo ""
echo "=== Uninstall complete ==="
echo "macshield has been fully removed from your system."
echo ""
