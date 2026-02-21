#!/usr/bin/env python3
"""
neurowall-rpi/firewall.py
Raspberry Pi 4B — Layer 2 (Privacy) + Layer 3 (Policy) + NSP Transport

Reads filtered EMG/EEG samples from Arduino Nano over UART.
Applies:
  - L2 Local Differential Privacy (Laplace noise, epsilon=0.5)
  - L3 Runemate Stub Policy (NISS-based trigger)
  - NSP Frame: Delta + LZ4 compression + AES-256-GCM encryption

Phase 0: Uses pre-shared AES key (no ML-KEM handshake yet).
Phase 1: Replace NSP_KEY derivation with liboqs ML-KEM-768.

Dependencies:
    pip install pyserial cryptography lz4 numpy

See: neurowall/BLUEPRINT.md for full setup and wiring guide.
"""

import os
import serial
import time
import random
import numpy as np
import lz4.frame  # pip install lz4
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dataclasses import dataclass, field
from typing import List

# ─── Configuration ────────────────────────────────────────────────────────────
SERIAL_PORT   = "/dev/ttyS0"   # UART GPIO on RPi (enable in raspi-config)
BAUD_RATE     = 115200
WINDOW_SIZE   = 100            # Samples per NSP frame (at 250Hz = ~0.4s)
DP_EPSILON    = 0.5            # L2 Differential Privacy sensitivity
DP_SENSITIVITY = 1.0           # L∞ sensitivity of one sample

# Phase 0: Pre-shared test key (32 bytes = AES-256)
# ⚠️  Replace with HKDF output from ML-KEM session in Phase 1
NSP_KEY = bytes.fromhex(
    "0000000000000000000000000000000000000000000000000000000000000000"
)

# ─── Mock NISS Source (stub) ───────────────────────────────────────────────────
# In Phase 1: replace with inference engine output
def get_mock_niss_bio() -> int:
    """Simulates a slowly changing NISS Biological Impact score (0-10)."""
    return random.choices([2, 3, 6, 8], weights=[5, 3, 1, 1])[0]

# ─── Layer 2: Differential Privacy ────────────────────────────────────────────
def apply_local_dp(sample: float, epsilon: float = DP_EPSILON) -> float:
    """Laplace Mechanism — Local DP. Adds Laplace(0, Δf/ε) noise."""
    scale = DP_SENSITIVITY / epsilon
    noise = np.random.laplace(0, scale)
    return sample + noise

# ─── Layer 3: Runemate Stub Interpreter ───────────────────────────────────────
@dataclass
class RunematePolicy:
    """
    Minimal Runemate Scribe stub.
    Phase 0: implemented as Python dataclass.
    Phase 1: replace with actual Staves v2 bytecode interpreter.
    """
    niss_threshold: int = 5
    tight_epsilon: float = 0.1

    def evaluate(self, niss_bio: int, current_epsilon: float) -> float:
        """Returns the epsilon to use this cycle. Logs policy events."""
        if niss_bio > self.niss_threshold:
            if current_epsilon != self.tight_epsilon:
                print(f"[L3-POLICY] NISS_BIO={niss_bio} > {self.niss_threshold}"
                      f" → DP tightened to ε={self.tight_epsilon}")
            return self.tight_epsilon
        return DP_EPSILON  # default epsilon

# ─── NSP Transport ────────────────────────────────────────────────────────────
def nsp_delta_encode(samples: List[float]) -> bytes:
    """Step 1: Delta encode. Step 2: LZ4 compress. (Compress-before-encrypt)"""
    raw = np.array(samples, dtype=np.float32).tobytes()
    deltas = np.diff(np.array(samples, dtype=np.float32)).tobytes()
    compressed = lz4.frame.compress(deltas)
    return compressed

def nsp_encrypt(plaintext: bytes) -> bytes:
    """Step 3: AES-256-GCM encrypt (Phase 0 — no ML-KEM yet)."""
    nonce = os.urandom(12)
    aesgcm = AESGCM(NSP_KEY)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    return nonce + ciphertext  # nonce prepended for receiver

def build_nsp_frame(samples: List[float]) -> bytes:
    """Full NSP pipeline: Delta → LZ4 → AES-256-GCM."""
    compressed = nsp_delta_encode(samples)
    encrypted  = nsp_encrypt(compressed)
    return encrypted

# ─── Main Firewall Loop ────────────────────────────────────────────────────────
def main():
    policy = RunematePolicy(niss_threshold=5, tight_epsilon=0.1)
    window: List[float] = []
    current_epsilon = DP_EPSILON

    print("=== Neurowall v0.1 — Phase 0 (RPi + Arduino) ===")
    print(f"UART: {SERIAL_PORT} @ {BAUD_RATE} baud")
    print(f"Default ε={DP_EPSILON} | Policy threshold: NISS_BIO > {policy.niss_threshold}")
    print("Waiting for signal...\n")

    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
    raw_bytes = 0
    frame_count = 0

    try:
        while True:
            line = ser.readline().decode("ascii", errors="ignore").strip()
            if not line:
                continue

            # ── Firewall events from Arduino (L1) ──────────────────────────
            if line.startswith("EVT"):
                print(f"[L1-EVENT] {line}")
                continue

            # ── Parse sample: "timestamp_ms,value" ─────────────────────────
            try:
                ts_str, val_str = line.split(",")
                sample = float(val_str)
                raw_bytes += 4  # float32 = 4 bytes
            except ValueError:
                continue

            # ── L3: Policy evaluation (every sample for demo, period in prod) ─
            niss_bio = get_mock_niss_bio()
            current_epsilon = policy.evaluate(niss_bio, current_epsilon)

            # ── L2: Differential Privacy ────────────────────────────────────
            noisy_sample = apply_local_dp(sample, epsilon=current_epsilon)
            window.append(noisy_sample)

            # ── NSP Frame transmission every WINDOW_SIZE samples ────────────
            if len(window) >= WINDOW_SIZE:
                frame = build_nsp_frame(window)
                frame_count += 1
                reduction = (1 - len(frame) / raw_bytes) * 100

                print(f"[NSP-FRAME #{frame_count}] "
                      f"{raw_bytes}B raw → {len(frame)}B encrypted "
                      f"({reduction:.1f}% reduction) | ε={current_epsilon:.2f}")

                # TODO Phase 1: send `frame` over BLE to gateway
                # ble_send(frame)

                window.clear()
                raw_bytes = 0

    except KeyboardInterrupt:
        ser.close()
        print(f"\nFirewall stopped. {frame_count} NSP frames transmitted.")

if __name__ == "__main__":
    main()
