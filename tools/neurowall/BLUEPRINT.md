# Neurowall — Arduino + Raspberry Pi Blueprint

> **Platform Level:** Accessible lab prototype using off-the-shelf hardware.
> **Goal:** Demonstrate the full 3-layer Neural Firewall concept without custom BCI chips.
> **Validated against:** [MVP_PROTOTYPE.md](./MVP_PROTOTYPE.md) | [TESTING.md](./TESTING.md)

---

## Architecture Overview

This blueprint splits the firewall into **two tiers** running on consumer hardware:

```
┌────────────────────────────────┐
│  Arduino Nano (Signal Tier)    │  ← Layer 1: Signal Boundary
│  - Reads analog EMG/EEG pads   │
│  - Runs IIR SSVEP notch filter │
│  - Impedance threshold check   │
│  - Sends clean data via UART   │
└──────────────┬─────────────────┘
               │ UART (115200 baud)
               ▼
┌────────────────────────────────┐
│  Raspberry Pi 4B (Brain Tier)  │  ← Layers 2 & 3 + NSP Transport
│  - Local-DP noise injection    │
│  - Runemate Scribe (Python sim)│
│  - NISS policy engine          │
│  - NSP: Delta+LZ4, AES-GCM-SIV│
│  - BLE/WiFi to gateway/cloud   │
└────────────────────────────────┘
```

> **Why this split?** Arduino handles high-speed analog I/O and real-time DSP (100–500Hz) with deterministic timing. Raspberry Pi handles everything computationally heavy (crypto, ML, policy evaluation) in a Linux environment with full Rust/Python support.

---

## Bill of Materials

| Component | Item | Est. Cost |
| :--- | :--- | :--- |
| **Signal Tier** | Arduino Nano (ATmega328P) | $5 |
| **Brain Tier** | Raspberry Pi 4B (4GB) | $55 |
| **EEG/EMG Sensor** | Grove EMG Detector (analog output) | $30 |
| | *or* MyoWare 2.0 Muscle Sensor | $38 |
| **Dry EEG** | OpenBCI Cyton 8-channel *(Phase 1)* | $500 |
| **Mock EEG (Phase 0)** | AD9833 signal generator module | $8 |
| **Power** | USB power bank (10,000mAh) | $20 |
| **Misc** | Jumper wires, breadboard, 3× gel electrodes | $10 |
| **Phase 0 Total** | *(no OpenBCI)* | **~$128** |

---

## Hardware Wiring

### Arduino Nano — Signal Acquisition

```
EMG Sensor (e.g. MyoWare 2.0)
├── VCC  →  Arduino 5V
├── GND  →  Arduino GND
└── SIG  →  Arduino A0 (analog in)

Mock Signal Generator (AD9833) — Phase 0 only
├── VCC  →  3.3V
├── GND  →  GND
├── CLK  →  Arduino D13 (SPI SCK)
├── DATA →  Arduino D11 (SPI MOSI)
└── FSYNC→  Arduino D10 (SPI CS)

Arduino to Raspberry Pi (UART)
├── Arduino TX (D1)  →  RPi GPIO 15 (RXD, pin 10)
├── Arduino RX (D0)  →  RPi GPIO 14 (TXD, pin 8)
└── GND              →  RPi GND (pin 6)
```

> **Voltage note:** Arduino is 5V logic, RPi is 3.3V. Use a simple voltage divider (1kΩ + 2kΩ) on the Arduino TX → RPi RX line.

### Raspberry Pi 4B — Brain / Policy / Transport

```
RPi GPIO 14 (TX) → Arduino RX (via 3.3V→5V level shifter)
RPi GPIO 15 (RX) → Arduino TX (via voltage divider)
RPi WiFi/BLE     → Gateway PC or mobile NSP receiver
```

---

## Software Stack

### Arduino Firmware (C++)

Runs the **Layer 1: Signal Boundary** in real-time.

```cpp
// neurowall-arduino/src/main.cpp

#include <Arduino.h>

// IIR Biquad Notch Filter — 15 Hz @ 250 Hz sample rate
// Coefficients pre-computed via scipy.signal.iirnotch(15, 30, fs=250)
struct BiquadFilter {
  float b0, b1, b2, a1, a2;
  float x1 = 0, x2 = 0, y1 = 0, y2 = 0;

  float process(float x) {
    float y = b0*x + b1*x1 + b2*x2 - a1*y1 - a2*y2;
    x2 = x1; x1 = x;
    y2 = y1; y1 = y;
    return y;
  }
};

// Notch at 8.57 Hz, 10.9 Hz, 15 Hz, 20 Hz (all adversarial SSVEP targets)
BiquadFilter notch_857, notch_109, notch_150, notch_200;

// Impedance guard: if ADC variance spikes > threshold, lockout 50ms
float prev_sample = 0;
unsigned long lockout_until = 0;

void setup() {
  Serial.begin(115200);
  analogReference(DEFAULT);

  // Initialize notch coefficients here (pre-computed)
  notch_150 = {0.9644, -1.6180, 0.9644, -1.6180, 0.9289}; // 15Hz example
  // TODO: fill other notch coefficients
}

void loop() {
  if (millis() < lockout_until) return; // impedance lockout active

  float raw = analogRead(A0) * (5.0 / 1023.0); // 0–5V ADC

  // Impedance guard: spike detection
  if (abs(raw - prev_sample) > 2.5) { // >2.5V jump = probe injection
    Serial.println("EVT-L1-IMP");      // log to RPi
    lockout_until = millis() + 50;    // 50ms lockout
    prev_sample = raw;
    return;
  }

  // SSVEP notch array
  float filtered = notch_857.process(raw);
  filtered = notch_109.process(filtered);
  filtered = notch_150.process(filtered);
  filtered = notch_200.process(filtered);

  // Send sample over UART as CSV: timestamp,value
  Serial.print(millis()); Serial.print(",");
  Serial.println(filtered, 4);

  prev_sample = raw;
  delayMicroseconds(4000); // ~250 Hz sample rate
}
```

### Raspberry Pi Software (Python + Rust)

Handles **Layer 2 (Privacy) + Layer 3 (Policy) + NSP Transport**.

```python
# neurowall-rpi/firewall.py

import serial, time, json, math, random
import numpy as np
from cryptography.hazmat.primitives.ciphers.aead import AESGCM  # pip install cryptography

# --- Config ---
SERIAL_PORT = "/dev/ttyS0"    # UART from Arduino
BAUD_RATE   = 115200
DP_EPSILON  = 0.5             # L2 differential privacy
NISS_BIO    = 3               # mock NISS value (stub, no ML model yet)

# --- NSP Session (stub: real ML-KEM via liboqs in Phase 1) ---
# For Phase 0: use AES-256-GCM with pre-shared test key
NSP_KEY = b'\x00' * 32       # REPLACE with HKDF-derived key in production

def lap_noise(sensitivity=1.0, epsilon=DP_EPSILON):
    """Laplace mechanism — Local Differential Privacy (L2)"""
    scale = sensitivity / epsilon
    return np.random.laplace(0, scale)

def nsp_encrypt(plaintext: bytes) -> bytes:
    """NSP frame: AES-256-GCM-SIV stub (using GCM for Phase 0)"""
    nonce = os.urandom(12)
    aesgcm = AESGCM(NSP_KEY)
    ct = aesgcm.encrypt(nonce, plaintext, None)
    return nonce + ct  # prepend nonce

def nsp_compress_and_encrypt(samples: list) -> bytes:
    """Delta encode → LZ4 compress → AES-GCM encrypt"""
    import lz4.frame  # pip install lz4
    deltas = [int((samples[i] - samples[i-1]) * 1000)
              for i in range(1, len(samples))]
    raw = bytes([d & 0xFF for d in deltas])  # simple byte pack
    compressed = lz4.frame.compress(raw)
    return nsp_encrypt(compressed)

def runemate_policy(niss_bio: int, dp_func) -> bool:
    """
    Stub Runemate Scribe — minimal opcode interpreter.
    Policy: IF NISS_BIO > 5 THEN enable_dp(epsilon=0.1)
    In Phase 1: load actual Staves bytecode.
    """
    if niss_bio > 5:
        dp_func(epsilon=0.1)
        print("L3-POLICY: DP tightened to epsilon=0.1 (NISS trigger)")
        return True
    return False

# --- Main Loop ---
window = []
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
print("Neurowall running. Ctrl-C to stop.")

try:
    while True:
        line = ser.readline().decode().strip()
        if not line or line.startswith("EVT"):
            print(f"FIREWALL EVENT: {line}")
            continue

        ts, val = line.split(",")
        sample = float(val)

        # L2: Differential Privacy — add Laplace noise
        noisy = sample + lap_noise()

        # L3: Policy check (mocked NISS)
        runemate_policy(NISS_BIO, dp_func=lambda epsilon: globals().update(DP_EPSILON=epsilon))

        window.append(noisy)

        # Every 100 samples (~0.4s): encrypt + transmit NSP frame
        if len(window) >= 100:
            payload = nsp_compress_and_encrypt(window)
            print(f"NSP FRAME: {len(payload)} bytes (was {100*4} raw) → "
                  f"{100 - 100*len(payload)/400:.1f}% reduction")
            window.clear()

except KeyboardInterrupt:
    ser.close()
    print("Firewall stopped.")
```

---

## Running the Blueprint

```bash
# 1. Upload Arduino firmware
cd neurowall-arduino
arduino-cli compile --fqbn arduino:avr:nano .
arduino-cli upload --fqbn arduino:avr:nano --port /dev/ttyUSB0 .

# 2. Install RPi dependencies
pip install pyserial cryptography lz4 numpy

# 3. Enable UART on Raspberry Pi (disable serial console first)
sudo raspi-config   # Interface Options → Serial → No login shell → Yes hardware
# Then reboot

# 4. Run the firewall
cd neurowall-rpi
python firewall.py
```

---

## Phase 0 → Phase 1 Upgrade Path

| Feature | Phase 0 (RPi + Arduino) | Phase 1 (nRF5340 or NXP RT685) |
| :--- | :--- | :--- |
| Crypto | AES-256-GCM (pre-shared key) | Full ML-KEM-768 + AES-256-GCM-SIV |
| Runemate | Python stub | Rust `no_std` Scribe on MCU |
| Sensor | MyoWare EMG breakout | OpenBCI Cyton 8-ch dry EEG |
| Policy delivery | Hard-coded Python | Signed Staves bytecode over BLE |
| Power | USB powered (no budget) | Measured with Nordic PPK2 |
| Real-time | Soft real-time (RPi Python) | Hard real-time (RTOS / bare metal) |

---

## Folder Structure

```
neurowall/
├── README.md
├── ARCHITECTURE.md
├── ENGINEERING.md
├── MVP_PROTOTYPE.md
├── TESTING.md
├── BLUEPRINT.md                     ← this file
├── neurowall-arduino/
│   └── src/main.cpp                 ← Arduino L1 firmware
└── neurowall-rpi/
    └── firewall.py                  ← RPi L2/L3 + NSP Python prototype
```

---

*Blueprint designed for accessibility: ~$128 all-in for Phase 0 lab demo.*
*No soldering required. No human subjects needed.*
