#!/usr/bin/env bash
# macshield installer - Zero-Permission Pattern
# Uses System LaunchDaemon instead of Sudoers/Keychain.
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_PATH="/usr/local/bin/macshield"
CONFIG_DIR="/Library/Application Support/macshield"
DAEMON_PLIST_NAME="com.qinnovates.macshield.daemon.plist"
DAEMON_PATH="/Library/LaunchDaemons/$DAEMON_PLIST_NAME"

echo "=== macshield installer (Hardened) ==="
echo ""
echo "PRIVACY NOTICE: Zero Telemetry Architecture"
echo "  - All network fingerprints, state, and logs remain strictly LOCAL."
echo "  - No data is ever sent to Qinnovate or any external server."
echo "  - The only external traffic is your DNS queries to your chosen provider."
echo ""
echo "DISCLAIMER: Limits of Liability"
echo "  - USE AT YOUR OWN RISK. This software is provided \"as is\"."
echo "  - The developers assume NO LIABILITY for any damages or system issues."
echo "  - This is NOT anti-malware; it is a network identity protector."
echo "  - It is not fool-proof; use it as part of a layered security strategy."
echo "  - Settings may collide with certain VPN providers/configurations."
echo "  - Philosophy: We trust known privacy-first DNS providers over free VPNs."
echo ""
echo "This installer implements a Zero-Permission Pattern:"
echo "  - No modification to /etc/sudoers (zero passwordless sudo risk)."
echo "  - No records kept in your personal Keychain."
echo "  - Minimal system footprint via a System LaunchDaemon."
echo ""

# Step 0: PQ Signer Build
echo "Step 0: Building Post-Quantum Signer (ML-DSA)"
if command -v cargo >/dev/null 2>&1; then
    (
        cd "$SCRIPT_DIR/pq-signer"
        cargo build --release
        sudo mkdir -p /usr/local/bin
        sudo cp target/release/pq-signer /usr/local/bin/pq-signer
        sudo chmod 755 /usr/local/bin/pq-signer
    )
    echo "  PQ Signer installed."
else
    echo "  WARNING: Rust/Cargo not found. Falling back to legacy HMAC only."
fi
echo ""

# Step 1: Binary & Monitor Installation
echo "Step 1: Installing macshield and monitor to $INSTALL_PATH"
sudo cp "$SCRIPT_DIR/macshield.sh" "$INSTALL_PATH"
sudo cp "$SCRIPT_DIR/monitor.sh" "/usr/local/bin/monitor.sh"
sudo chown root:wheel "$INSTALL_PATH" "/usr/local/bin/monitor.sh"
sudo chmod 755 "$INSTALL_PATH" "/usr/local/bin/monitor.sh"
echo "  Installed."
echo ""

# Step 1b: Dashboard UI Installation
echo "Step 1b: Installing Shield Dashboard UI"
sudo mkdir -p "/usr/local/bin/ui"
sudo cp -R "$SCRIPT_DIR/ui/"* "/usr/local/bin/ui/"
sudo chown -R root:wheel "/usr/local/bin/ui"
sudo chmod -R 755 "/usr/local/bin/ui"
echo "  UI components installed."
echo ""

# Step 2: Secure State Directory
echo "Step 2: Creating root-locked config directory"
sudo mkdir -p "$CONFIG_DIR/keys"
sudo chown -R root:wheel "$CONFIG_DIR"
sudo chmod 700 "$CONFIG_DIR"
echo "  Secure directory created at $CONFIG_DIR."
echo ""

# Step 3: PQ Key Generation
if [[ -f "/usr/local/bin/pq-signer" ]]; then
    echo "Step 3: Generating Workshop ML-DSA keys"
    # Execute keygen as root and store in root dir
    sudo /usr/local/bin/pq-signer keygen > /tmp/ms_keys.txt
    PK=$(grep "PUBLIC_KEY:" /tmp/ms_keys.txt | cut -d: -f2)
    SK=$(grep "PRIVATE_KEY:" /tmp/ms_keys.txt | cut -d: -f2)
    echo "$PK" | sudo tee "$CONFIG_DIR/keys/public_key.base64" > /dev/null
    echo "$SK" | sudo tee "$CONFIG_DIR/keys/private_key.base64" > /dev/null
    sudo chmod 600 "$CONFIG_DIR/keys/"*
    rm -f /tmp/ms_keys.txt
    echo "  PQ keys stored securely."
fi
echo ""

# Step 4: System LaunchDaemon
echo "Step 4: Installing System LaunchDaemon"
sudo cp "$SCRIPT_DIR/$DAEMON_PLIST_NAME" "$DAEMON_PATH"
sudo chown root:wheel "$DAEMON_PATH"
sudo chmod 644 "$DAEMON_PATH"
sudo launchctl load -w "$DAEMON_PATH" 2>/dev/null || true
echo "  LaunchDaemon activated."
echo ""

# Step 5: DNS Security (Encrypted/Fast DNS)
echo "Step 5: Configure DNS Security?"
echo "  Select a privacy-focused DNS provider to apply to all network interfaces:"
echo "  1) Cloudflare (1.1.1.1) - Fastest, Privacy-first"
echo "  2) Google (8.8.8.8) - Reliable, Fast"
echo "  3) Quad9 (9.9.9.9) - Open Source, Malware Blocking"
echo "  4) OpenDNS (208.67.222.222) - Customizable"
echo "  5) Skip / Keep Existing"
read -rp "  Select [1-5]: " dns_choice

DNS_SERVERS=""
case "$dns_choice" in
    1) DNS_SERVERS="1.1.1.1 1.0.0.1" ;;
    2) DNS_SERVERS="8.8.8.8 8.8.4.4" ;;
    3) DNS_SERVERS="9.9.9.9 149.112.112.112" ;;
    4) DNS_SERVERS="208.67.222.222 208.67.220.220" ;;
    *) echo "  Skipping DNS configuration." ;;
esac

if [[ -n "$DNS_SERVERS" ]]; then
    while IFS= read -r service; do
        [[ -z "$service" ]] && continue
        # Ignore virtual/internal interfaces
        if networksetup -getinfo "$service" >/dev/null 2>&1; then
            echo "  Applying to $service..."
            sudo networksetup -setdnsservers "$service" $DNS_SERVERS 2>/dev/null || true
        fi
    done < <(networksetup -listallnetworkservices | tail -n +2)
    echo "  DNS security configured."
fi
echo ""

echo "=== Installation complete ==="
echo "macshield will now automatically harden your Mac on untrusted networks."
echo "Manual control: sudo macshield [harden|relax|trust]"
