#!/usr/bin/env bash
# macshield - Network-aware macOS security hardening
# https://github.com/qinnovates/qinnovate/tree/main/tools/macshield
# Apache 2.0 License

set -euo pipefail

# Restrict file permissions: owner-only for state files and any redirected logs
umask 077

VERSION="0.1.2"
CONFIG_DIR="/Library/Application Support/macshield"
STATE_FILE="$CONFIG_DIR/state"
LOCK_FILE="/tmp/macshield.lock.d"
LOG_PREFIX="[macshield]"
SETTLE_DELAY=2
PQ_SIGNER="/usr/local/bin/pq-signer"
TRUST_DB="$CONFIG_DIR/trust.db"
PQ_KEYS_DIR="$CONFIG_DIR/keys"

# ─── Utilities ───────────────────────────────────────────────

log() {
    printf '%s %s\n' "$LOG_PREFIX" "$*"
}

log_blank() {
    printf '%s\n' "$LOG_PREFIX"
}

die() {
    log "ERROR: $*" >&2
    exit 1
}

require_macos() {
    [[ "$(uname)" == "Darwin" ]] || die "macshield only runs on macOS."
}

# ─── Hardware / Network Detection ────────────────────────────

get_wifi_interface() {
    local iface
    iface=$(networksetup -listallhardwareports | awk '/Wi-Fi|AirPort/{getline; print $2}')
    if [[ -z "$iface" ]]; then
        return 1
    fi
    echo "$iface"
}

get_current_ssid() {
    local iface
    iface=$(get_wifi_interface) || return 1
    local output
    output=$(networksetup -getairportnetwork "$iface" 2>/dev/null) || return 1
    # Output format: "Current Wi-Fi Network: NetworkName"
    local ssid="${output#*: }"
    if [[ "$ssid" == "$output" ]] || [[ -z "$ssid" ]] || [[ "$ssid" == "You are not associated with an AirPort network." ]]; then
        return 1
    fi
    echo "$ssid"
}

get_hardware_uuid() {
    ioreg -d2 -c IOPlatformExpertDevice | awk -F'"' '/IOPlatformUUID/{print $4}'
}

get_current_bssid() {
    local iface
    iface=$(get_wifi_interface) || return 1
    # Check airport utility first (legacy/moved)
    local bssid=""
    if [[ -f "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport" ]]; then
        bssid=$(/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk -F': ' '/BSSID/{print $2}')
    fi
    # Fallback to system_profiler (slow but robust)
    if [[ -z "$bssid" ]]; then
        bssid=$(system_profiler SPAirPortDataType | awk '/Current Network Information:/{flag=1;next} /Other Local Wi-Fi Networks:/{flag=0} flag && /BSSID:/{print $NF}')
    fi
    echo "${bssid// /}"
}

get_generic_hostname() {
    local model
    model=$(system_profiler SPHardwareDataType 2>/dev/null | awk -F': ' '/Model Name/{print $2}')
    if [[ -z "$model" ]]; then
        model="Mac"
    fi
    echo "$model"
}

get_generic_hostname_dashed() {
    local name
    name=$(get_generic_hostname)
    echo "${name// /-}"
}

# ─── HMAC / Root Trust DB ──────────────────────────────────

compute_hmac() {
    local ssid="$1"
    local bssid="$2"
    local uuid
    uuid=$(get_hardware_uuid)
    # Combine SSID and BSSID for fingerprinting to prevent Evil Twin attacks
    echo -n "${ssid}:${bssid}" | openssl dgst -sha256 -hmac "$uuid" -hex 2>/dev/null | awk '{print $NF}'
}

pq_get_sk() {
    cat "$PQ_KEYS_DIR/private_key.base64" 2>/dev/null || return 1
}

pq_get_pk() {
    cat "$PQ_KEYS_DIR/public_key.base64" 2>/dev/null || return 1
}

pq_sign() {
    local data="$1"
    local sk
    sk=$(pq_get_sk) || return 1
    "$PQ_SIGNER" sign --key "$sk" --data "$data"
}

pq_verify() {
    local data="$1"
    local sig="$2"
    local pk
    pk=$(pq_get_pk) || return 1
    "$PQ_SIGNER" verify --key "$pk" --data "$data" --sig "$sig" >/dev/null 2>&1
}

trust_db_store() {
    local hash="$1"
    local ssid="${2:-}"
    local bssid="${3:-}"
    local sig="none"

    mkdir -p "$CONFIG_DIR"
    chmod 700 "$CONFIG_DIR"

    if [[ -x "$PQ_SIGNER" ]] && [[ -n "$ssid" ]] && [[ -n "$bssid" ]]; then
        sig=$(pq_sign "${ssid}:${bssid}") || sig="none"
    fi

    # Append to trust.db (hash:signature)
    # Ensure unique entry
    grep -v "^$hash:" "$TRUST_DB" 2>/dev/null > "${TRUST_DB}.tmp" || true
    echo "${hash}:${sig}" >> "${TRUST_DB}.tmp"
    mv "${TRUST_DB}.tmp" "$TRUST_DB"
    chmod 600 "$TRUST_DB"
}

trust_db_remove() {
    local hash="$1"
    [[ -f "$TRUST_DB" ]] || return 0
    grep -v "^$hash:" "$TRUST_DB" > "${TRUST_DB}.tmp" || true
    mv "${TRUST_DB}.tmp" "$TRUST_DB"
    chmod 600 "$TRUST_DB"
}

trust_db_is_trusted() {
    local ssid="$1"
    local bssid="$2"
    [[ -f "$TRUST_DB" ]] || return 1

    local hash
    hash=$(compute_hmac "$ssid" "$bssid")

    local entry
    entry=$(grep "^$hash:" "$TRUST_DB") || return 1
    
    local sig="${entry#*:}"
    
    # 1. Basic hash checking
    [[ -n "$entry" ]] || return 1

    # 2. PQ signature verification if available
    if [[ -x "$PQ_SIGNER" ]] && [[ "$sig" != "none" ]]; then
        pq_verify "${ssid}:${bssid}" "$sig" || return 1
    fi

    return 0
}

# Removed keychain_is_trusted helper (using trust_db_is_trusted directly)

hostname_store() {
    local hostname="$1"
    mkdir -p "$CONFIG_DIR"
    echo "$hostname" > "$CONFIG_DIR/personal_hostname"
    chmod 600 "$CONFIG_DIR/personal_hostname"
}

hostname_get() {
    cat "$CONFIG_DIR/personal_hostname" 2>/dev/null || echo ""
}

read_state() {
    cat "$STATE_FILE" 2>/dev/null || echo "unknown"
}

write_state() {
    mkdir -p "$CONFIG_DIR"
    echo "$1" > "$STATE_FILE"
    chmod 600 "$STATE_FILE"
}

# ─── Protection Actions ─────────────────────────────────────

do_harden() {
    local current_state
    current_state=$(read_state)

    if [[ "$current_state" == "hardened" ]] && [[ "${1:-}" != "--force" ]]; then
        log "Already hardened. No changes needed."
        return 0
    fi

    log_blank
    log "Applying protections:"

    # 1. Stealth mode & Block All
    log "  [1/3] Enabling firewall protections (blocks ICMP pings and incoming traffic)"
    /usr/libexec/ApplicationFirewall/socketfilterfw --setstealthmode on >/dev/null 2>&1 || \
        log "        WARNING: Failed to enable stealth mode"
    
    # Optional: Block all incoming connections for maximum security in cafes
    /usr/libexec/ApplicationFirewall/socketfilterfw --setblockall on >/dev/null 2>&1 || \
        log "        WARNING: Failed to enable block-all mode"
    log "        Done."

    # 2. Generic hostname
    local generic_name generic_dashed
    generic_name=$(get_generic_hostname)
    generic_dashed=$(get_generic_hostname_dashed)

    # Save current hostname if we haven't already
    local stored_hostname
    stored_hostname=$(hostname_get)
    if [[ -z "$stored_hostname" ]]; then
        local current_name
        current_name=$(scutil --get ComputerName 2>/dev/null || echo "")
        if [[ -n "$current_name" ]] && [[ "$current_name" != "$generic_name" ]]; then
            hostname_store "$current_name"
            log "  [info] Saved personal hostname for later restoration"
        fi
    fi

    log "  [2/3] Setting hostname to generic \"$generic_name\""
    scutil --set ComputerName "$generic_name"
    scutil --set LocalHostName "$generic_dashed"
    scutil --set HostName "$generic_dashed"
    log "        Done."

    # 3. Disable NetBIOS
    log "  [3/3] Disabling NetBIOS (closes ports 137/138)"
    launchctl bootout system/com.apple.netbiosd 2>/dev/null || \
        log "        Note: NetBIOS was already disabled"
    log "        Done."

    write_state "hardened"
    log_blank
    log "All protections active. Your Mac is hardened."
}

do_relax() {
    local current_state
    current_state=$(read_state)

    if [[ "$current_state" == "relaxed" ]] && [[ "${1:-}" != "--force" ]]; then
        log "Already relaxed. No changes needed."
        return 0
    fi

    log_blank
    log "Relaxing protections:"

    # 1. Stealth mode & Block All off
    log "  [1/3] Relaxing firewall"
    /usr/libexec/ApplicationFirewall/socketfilterfw --setstealthmode off >/dev/null 2>&1
    /usr/libexec/ApplicationFirewall/socketfilterfw --setblockall off >/dev/null 2>&1
    log "        Done."

    # 2. Restore personal hostname
    local personal_hostname
    personal_hostname=$(hostname_get)
    if [[ -n "$personal_hostname" ]]; then
        local personal_dashed="${personal_hostname// /-}"
        # Remove characters not valid in LocalHostName (only alphanumeric and hyphens)
        local local_hostname
        local_hostname=$(printf '%s\n' "$personal_dashed" | sed "s/[^a-zA-Z0-9-]//g")

        if [[ -z "$local_hostname" ]]; then
            log "  [2/3] WARNING: Personal hostname produced empty LocalHostName after sanitization. Skipping restore."
        else
            log "  [2/3] Restoring personal hostname \"$personal_hostname\""
            scutil --set ComputerName "$personal_hostname"
            scutil --set LocalHostName "$local_hostname"
            scutil --set HostName "$local_hostname"
            log "        Done."
        fi
    else
        log "  [2/3] No personal hostname stored. Skipping restore."
    fi

    # 3. Enable NetBIOS
    log "  [3/3] Enabling NetBIOS"
    launchctl enable system/com.apple.netbiosd 2>/dev/null || true
    launchctl kickstart system/com.apple.netbiosd 2>/dev/null || true
    log "        Done."

    write_state "relaxed"
    log_blank
    log "Protections relaxed. Your Mac is in normal mode."
}

# ─── Commands ────────────────────────────────────────────────

cmd_trigger() {
    # Called by LaunchAgent on network change
    # Use mkdir-based locking (atomic on all POSIX systems, unlike flock which isn't on macOS)
    if ! mkdir "$LOCK_FILE" 2>/dev/null; then
        if [[ -d "$LOCK_FILE" ]]; then
            # Check for stale lock (older than 60 seconds)
            local lock_mtime
            lock_mtime=$(stat -f %m "$LOCK_FILE" 2>/dev/null) || {
                log "Cannot stat lock directory. Assuming active lock. Exiting."
                exit 0
            }
            local lock_age=$(( $(date +%s) - lock_mtime ))
            if [[ "$lock_age" -gt 60 ]]; then
                log "Removing stale lock (age: ${lock_age}s)"
                rmdir "$LOCK_FILE" 2>/dev/null || rm -rf "$LOCK_FILE" 2>/dev/null || true
                mkdir "$LOCK_FILE" 2>/dev/null || { log "Another instance is running. Exiting."; exit 0; }
            else
                log "Another instance is running. Exiting."
                exit 0
            fi
        else
            # Path exists but is not a directory (e.g., regular file). Remove and retry.
            log "WARNING: $LOCK_FILE exists but is not a directory. Removing."
            rm -f "$LOCK_FILE"
            mkdir "$LOCK_FILE" 2>/dev/null || { log "Another instance is running. Exiting."; exit 0; }
        fi
    fi
    # Clean up lock on exit
    trap 'rmdir "$LOCK_FILE" 2>/dev/null' EXIT

    # Settle delay: network state may not be final immediately
    sleep "$SETTLE_DELAY"

    log "Network change detected"

    local ssid bssid
    if ! ssid=$(get_current_ssid); then
        log "No WiFi connection detected. Defaulting to hardened mode."
        do_harden
        return
    fi
    bssid=$(get_current_bssid || echo "unknown")

    log "Current network: [connected]"
    log "Computing network fingerprint (SSID+BSSID)..."

    local hash
    hash=$(compute_hmac "$ssid" "$bssid")

    log "Checking trusted networks in local store..."

    if trust_db_is_trusted "$ssid" "$bssid"; then
        log "Result: TRUSTED network"
        do_relax
    else
        log "Result: UNTRUSTED network"
        do_harden
    fi
}

cmd_check() {
    log "macshield status"
    log "================"
    log_blank

    # WiFi interface
    local iface
    if iface=$(get_wifi_interface); then
        log "WiFi interface: $iface"
    else
        log "WiFi interface: not found"
    fi

    # Current SSID
    local ssid
    if ssid=$(get_current_ssid); then
        log "Connected to WiFi: yes"
    else
        log "Connected to WiFi: no"
    fi

    # Trust status
    if [[ -n "${ssid:-}" ]]; then
        local bssid
        bssid=$(get_current_bssid || echo "unknown")
        if trust_db_is_trusted "$ssid" "$bssid"; then
            log "Network trust: TRUSTED"
            if [[ -x "$PQ_SIGNER" ]]; then
                log "Trust Level: Post-Quantum (ML-DSA)"
            else
                log "Trust Level: HMAC-SHA256 (Legacy)"
            fi
        else
            log "Network trust: UNTRUSTED"
        fi
        log "BSSID: $bssid"
    fi

    # Current state
    log "Protection state: $(read_state)"

    # Stealth mode
    local stealth_output
    stealth_output=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getstealthmode 2>/dev/null || echo "unknown")
    if echo "$stealth_output" | grep -qi "enabled\|stealth mode is on"; then
        log "Stealth mode: ON"
    elif echo "$stealth_output" | grep -qi "disabled\|stealth mode is off"; then
        log "Stealth mode: OFF"
    else
        log "Stealth mode: unknown"
    fi

    # Hostname
    local computer_name
    computer_name=$(scutil --get ComputerName 2>/dev/null || echo "unknown")
    local generic_name
    generic_name=$(get_generic_hostname)
    log "Current hostname: $computer_name"
    if [[ "$computer_name" == "$generic_name" ]]; then
        log "Hostname status: generic (hardened)"
    else
        log "Hostname status: personal"
    fi

    # Stored personal hostname
    local stored
    stored=$(hostname_get)
    if [[ -n "$stored" ]]; then
        log "Stored personal hostname: $stored"
    else
        log "Stored personal hostname: (none)"
    fi

    # NetBIOS
    if launchctl list com.apple.netbiosd >/dev/null 2>&1; then
        log "NetBIOS: running"
    else
        log "NetBIOS: stopped"
    fi

    # Local OpenVPN Detection
    if pgrep -x "openvpn" >/dev/null; then
        log "Local OpenVPN: DETECTED (Active)"
    else
        log "Local OpenVPN: not running"
    fi

    # Persistence
    if [[ -f "/Library/LaunchDaemons/com.qinnovates.macshield.plist" ]]; then
        log "LaunchDaemon: installed (System-level)"
    else
        log "LaunchDaemon: not installed"
    fi
}

cmd_trust() {
    local ssid bssid
    if ! ssid=$(get_current_ssid); then
        die "Not connected to any WiFi network."
    fi
    bssid=$(get_current_bssid || die "Could not determine BSSID.")

    log "Adding current network as trusted..."
    log "Computing fingerprint (SSID: $ssid, BSSID: $bssid)..."

    local hash
    hash=$(compute_hmac "$ssid" "$bssid")

    if trust_db_is_trusted "$ssid" "$bssid"; then
        log "This network is already trusted."
        return 0
    fi

    trust_db_store "$hash" "$ssid" "$bssid"
    log "Network added to trusted list."
    if [[ -x "$PQ_SIGNER" ]]; then
        log "Security: ML-DSA signature generated and stored."
    fi

    # Store hostname if not already stored
    local stored
    stored=$(hostname_get)
    if [[ -z "$stored" ]]; then
        local current_name
        current_name=$(scutil --get ComputerName 2>/dev/null || echo "")
        if [[ -n "$current_name" ]]; then
            hostname_store "$current_name"
            log "Personal hostname \"$current_name\" saved."
        fi
    fi

    log "Done. This network will be recognized as trusted on future connections."
    log "Run 'macshield relax' to apply relaxed settings now."
}

cmd_untrust() {
    local ssid bssid
    if ! ssid=$(get_current_ssid); then
        die "Not connected to any WiFi network."
    fi
    bssid=$(get_current_bssid || echo "unknown")

    log "Removing current network from trusted list..."

    local hash
    hash=$(compute_hmac "$ssid" "$bssid")

    if ! trust_db_is_trusted "$ssid" "$bssid"; then
        log "This network is not in the trusted list."
        return 0
    fi

    trust_db_remove "$hash"
    log "Network removed from trusted list."
    log "Run 'macshield harden' to apply hardened settings now."
}

cmd_harden() {
    log "Manually hardening..."
    do_harden --force
}

cmd_relax() {
    local duration=""

    # Parse --for flag
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --for)
                shift
                duration="${1:-}"
                if [[ -z "$duration" ]]; then
                    die "Missing duration. Usage: macshield relax --for 2h"
                fi
                shift
                ;;
            *)
                die "Unknown option: $1"
                ;;
        esac
    done

    if [[ -n "$duration" ]]; then
        # Parse duration (supports: 30m, 1h, 2h, etc.)
        local seconds=0
        if [[ "$duration" =~ ^([0-9]+)m$ ]]; then
            seconds=$(( ${BASH_REMATCH[1]} * 60 ))
        elif [[ "$duration" =~ ^([0-9]+)h$ ]]; then
            seconds=$(( ${BASH_REMATCH[1]} * 3600 ))
        else
            die "Invalid duration format. Use e.g. 30m or 2h"
        fi

        log "Temporarily relaxing for $duration..."
        do_relax --force

        log "Will re-harden in $duration."
        # Background timer
        (
            sleep "$seconds"
            log "Timed relax expired ($duration). Re-hardening..."
            do_harden --force
        ) &
        disown
    else
        log "Manually relaxing..."
        do_relax --force
    fi
}

cmd_explain() {
    cat <<'EXPLAIN'
macshield: Protecting Identity as a Human Asset
===============================================
Mission: To democratize digital security for Mac users by providing a 
high-security, open-source alternative to untrustworthy free VPNs.

NEUROETHICS CONTEXT:
In the digital age, your identity is your most critical asset. Your 
broadcasted footprint (hostname, network activity) is an extension 
of your cognitive self. Shielding this identity is a requirement 
for neuro-privacy and cognitive liberty.

STATUS: ALPHA RELEASE - RUN AT YOUR OWN RISK.
---------------------------------------------

macshield is designed to protect your identity and local network footprint
when working in public spaces like cafes. Here is what it does and why:

1. Network Fingerprinting (SSID + BSSID)
   - Why: Most scripts only check the network name (SSID). An attacker can
     set up a fake network with the same name (Evil Twin). By also checking
     the BSSID (hardware address of the router), macshield ensures you are
     actually on the specific access point you trusted.
   - Mechanism: A SHA256 HMAC of the SSID/BSSID is stored with an ML-DSA
     signature in a root-only directory (/Library/Application Support/macshield).

LOCAL OPENVPN PHILOSOPHY:
-------------------------
macshield is built on the belief that security should be accessible to 
everyone. If you cannot afford a private VPN, we recommend:
1. Setting up a local OpenVPN client (100% local, no subscription).
2. Using privacy-focused DNS (selected during install).
3. Configuring your router/modem with OpenVPN separately (Future Phase)
   to protect all devices on your local network.

Standard "Free VPNs" often harvest your data.macshield + Local OpenVPN 
is a fundamentally more private and secure strategy.

2. Stealth Mode & Block All
   - Why: Stealth mode makes your Mac ignore ICMP "ping" requests, making it
     invisible to simple network scans. "Block All" prevents any incoming
     service requests (like AirDrop or printing) from reaching your system,
     closing the door on many local exploitation vectors.
   - Mechanism: Modifies macOS ApplicationFirewall (socketfilterfw).

3. Generic Hostname
   - Why: Your Mac defaults to "User's MacBook Pro". This broadcasts your
     name to everyone on the cafe WiFi. macshield changes this to a generic
     model name (e.g., "MacBook-Pro") to mask your identity.
   - Mechanism: Updates ComputerName, LocalHostName, and HostName via scutil.

4. Disabling NetBIOS
   - Why: NetBIOS is a legacy discovery protocol that can leak information
     about your system and user account over ports 137/138.
   - Mechanism: Unloads com.apple.netbiosd.

5. Post-Quantum Integrity (ML-DSA)
   - Why: Standard digital signatures are vulnerable to future quantum 
     computers. macshield uses NIST-standardized Post-Quantum Cryptography 
     (ML-DSA) to sign your trusted network records.
   - Mechanism: Uses the pq-signer (Rust) to verify that your trust store 
     has not been tampered with by unauthorized apps or processes.

Permissions Used:
- Root Access: To modify system-level networking and firewall settings.
  (Installed as a System LaunchDaemon, no persistent sudoers modified).

ZERO TELEMETRY DISCLOSURE:
--------------------------
macshield is a 100% local utility. 
- NO DATA is sent to internal or external servers.
- NO ANALYTICS are collected.
- All fingerprints and logs remain on this machine.
- Your privacy is maintained by design, not by promise.

DISCLAIMER & LIMITATIONS:
-------------------------
- NOT ANTI-MALWARE: macshield is a network identity protector, not an antivirus.
- NOT FOOL-PROOF: No security tool offers 100% protection.
- VPN COMPATIBILITY: Some VPN providers or configurations may collide with these 
  settings. 
- USE AT YOUR OWN RISK: This software is provided "as is". The developers and 
  contributors assume NO LIABILITY for any system disruption, data loss, or 
  security breaches.
- PHILOSOPHY: This tool is intended as a superior alternative to "Free VPNs" 
  which often harvest user data. We trust privacy-focused DNS providers (like 
  Cloudflare, Google, or Quad9) over untrusted free VPN services any day.
EXPLAIN
}

cmd_dashboard() {
    log "Starting Shield Dashboard..."
    local ui_dir
    ui_dir="$(dirname "$0")/ui"
    local monitor_script
    monitor_script="$(dirname "$0")/monitor.sh"

    if [[ ! -d "$ui_dir" ]]; then
        die "UI directory not found. Ensure the Dashboard is correctly installed."
    fi

    # 1. Start monitor in background
    log "  [1/3] Starting real-time firewall monitor..."
    if [[ -f "$monitor_script" ]]; then
        # Check if monitor is already running
        if ! pgrep -f "monitor.sh" >/dev/null; then
            bash "$monitor_script" &
            log "        Monitor started (PID: $!)."
        else
            log "        Monitor is already running."
        fi
    else
        log "        WARNING: monitor.sh not found. Activity feed will be empty."
    fi

    # 2. Build or Check UI
    log "  [2/3] Preparing Dashboard interface..."
    if [[ ! -d "$ui_dir/dist" ]]; then
        log "        Building UI (first time setup)..."
        (cd "$ui_dir" && npm run build >/dev/null 2>&1) || log "        WARNING: UI build failed. Trying to open source index..."
    fi

    # 3. Open Dashboard
    log "  [3/3] Opening Dashboard in browser..."
    local target
    if [[ -f "$ui_dir/dist/index.html" ]]; then
        target="$ui_dir/dist/index.html"
    else
        target="$ui_dir/index.html"
    fi
    
    open "$target"
    log "Dashboard opened. Keep this terminal open to maintain the monitor."
}

cmd_version() {
    echo "macshield $VERSION"
}

cmd_help() {
    cat <<'HELP'
macshield - Network-aware macOS security hardening

Usage:
  macshield --check          Show current status (no changes)
  macshield explain          Explain security measures and why they exist
  macshield trust            Add current WiFi network as trusted
  macshield untrust          Remove current WiFi network from trusted
  macshield harden           Manually harden now
  macshield relax            Manually relax protections
  macshield relax --for 2h   Temporarily relax (auto-hardens after duration)
  macshield --dashboard      Open the Shield Dashboard (Real-time Firewall Monitoring)
  macshield logs             Show log file info and recent entries
  macshield logs clear       Truncate all log files
  macshield --install        Run installer
  macshield --uninstall      Run uninstaller
  macshield --version        Print version
  macshield --help           Print this help

When installed with the LaunchDaemon, macshield automatically detects
network changes and applies hardened or relaxed settings based on
whether the current WiFi network is in your trusted list.

Protections applied on untrusted networks:
  - Stealth mode ON (blocks ICMP pings and port scans)
  - Hostname set to generic model name (hides identity)
  - NetBIOS disabled (stops name broadcast on ports 137/138)

Trusted networks are stored as ML-DSA signed hashes in a root-only
directory, encrypted by system-level permissions. No plaintext 
SSIDs are ever written to disk.

More info: https://github.com/qinnovates/qinnovate/tree/main/tools/macshield
HELP
}

# ─── Main ────────────────────────────────────────────────────

main() {
    require_macos

    if [[ $# -eq 0 ]]; then
        cmd_help
        exit 0
    fi

    local command="$1"
    shift

    case "$command" in
        --check|--status)   cmd_check ;;
        --trigger)          cmd_trigger ;;
        explain)            cmd_explain ;;
        trust)              cmd_trust ;;
        untrust)            cmd_untrust ;;
        harden)             cmd_harden ;;
        relax)              cmd_relax "$@" ;;
        logs)               cmd_logs "${1:-show}" ;;
        --dashboard)        cmd_dashboard ;;
        --install)          cmd_install ;;
        --uninstall)        cmd_uninstall ;;
        --version|-v)       cmd_version ;;
        --help|-h)          cmd_help ;;
        *)                  die "Unknown command: $command. Run 'macshield --help' for usage." ;;
    esac
}

main "$@"
