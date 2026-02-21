# Neurowall — Test Plan

> **Multi-AI Review:** Validation steps confirmed by Gemini 2.5 via Gemini CLI (2026-02-21).
> **Status:** Phase 0 MVP — no human subjects required.

---

## Test Environment Setup

```
[Host PC] (Python mock sensor / NSP gateway)
     │
     │ USB Serial (UART) — mock EEG/EMG @ 250Hz
     ▼
[nRF5340 DK] (Firewall under test)
     │
     │ BLE / USB (encrypted NSP stream)
     ▼
[Host PC RX] (verify decrypted output)
```

**Tools needed:**
- `nrf-serial` or `pyserial` for UART mock input
- Logic analyzer (Saleae) for signal capture
- Nordic PPK2 for power measurement
- Python `scipy.fft` for spectral validation

---

## Test Suite

### Step 1 — L2: Differential Privacy

| Field | Detail |
| :--- | :--- |
| **Testing** | Local-DP Laplace noise injection (ε = 0.5) |
| **Mock Input** | Generate 10Hz clean sine wave at 250Hz sample rate (Python: `np.sin(2π×10×t)`) |
| **Action** | Enable firewall DP module, stream through nRF5340 |
| **Pass Criterion** | FFT of output: 10Hz peak still present, noise floor raised ≥15dB. Reconstructed signal after denoising has MSE < 5%. |
| **Fail Criterion** | 10Hz peak disappears (over-noised) or noise floor unchanged (DP not applied). |

---

### Step 2 — L1: SSVEP Injection Blocking

| Field | Detail |
| :--- | :--- |
| **Testing** | Adversarial SSVEP notch array (8.57Hz, 10.9Hz, 15Hz, 20Hz) |
| **Mock Input** | White noise baseline + injected 15Hz square wave at 10× noise amplitude |
| **Action** | Feed through firewall L1 filter bank |
| **Pass Criterion** | FFT: 15Hz fundamental and harmonics (45Hz, 75Hz) attenuated ≥ 20dB. TAL log shows `EVT-L1-SSVEP`. |
| **Fail Criterion** | < 20dB attenuation on any targeted frequency. |

---

### Step 3 — L3: NISS Policy Trigger

| Field | Detail |
| :--- | :--- |
| **Testing** | Runemate Scribe reads NISS field and conditionally activates L2 DP |
| **Mock Input** | UART stream with packets containing `NISS_BIO` field. First 30s: `NISS_BIO=2`. Next 30s: `NISS_BIO=8`. |
| **Action** | Load policy Stave: `IF NISS_BIO > 5 THEN enable_dp(epsilon=0.1)` |
| **Pass Criterion** | First 30s: clean output. After `NISS_BIO=8`: output becomes noisy. |
| **Fail Criterion** | DP applied regardless of NISS value, or not applied at all. |

---

### Step 4 — L3: Policy Hot-Swap (Zero Downtime)

| Field | Detail |
| :--- | :--- |
| **Testing** | Runemate atomic policy update while streaming |
| **Mock Input** | Continue `NISS_BIO=8` stream (noisy output) |
| **Action** | Deliver new signed Stave changing threshold to `IF NISS_BIO > 9`. Do not reset connection. |
| **Pass Criterion** | Within 1 packet after swap completes: output becomes clean (NISS_BIO=8 no longer triggers DP). No dropped frames. |
| **Fail Criterion** | Connection drops, frames lost, or policy doesn't update within 500ms. |

---

### Step 5 — NSP: Full Handshake & Transport

| Field | Detail |
| :--- | :--- |
| **Testing** | ML-KEM-768 key exchange + AES-256-GCM-SIV encrypted NSP session |
| **Mock Input** | Static "hello neural world" payload from host PC |
| **Action** | Initiate NSP session between nRF5340 and host PC via USB serial |
| **Pass Criterion** | Logic analyzer confirms: (1) ML-KEM encapsulation packets visible in handshake, (2) subsequent frames are encrypted (random-looking bytes), (3) host PC decrypts successfully. Total handshake time < 500ms. |
| **Fail Criterion** | Plaintext data visible after handshake, or handshake > 2s. |

---

### Step 6 — Compression Efficiency

| Field | Detail |
| :--- | :--- |
| **Testing** | Delta + LZ4 pipeline on continuous EEG-like signal |
| **Mock Input** | 10s of slowly-varying 1Hz sine wave at 250Hz sample rate (highly compressible) |
| **Action** | Transmit via NSP with compression enabled. Compare total bytes-on-wire to raw uncompressed size. |
| **Pass Criterion** | Total transmitted bytes ≤ 35% of raw size (≥ 65% reduction). Decompressed output = lossless (zero diff). |
| **Fail Criterion** | < 50% reduction achieved, or decompressed data has any errors. |

---

## Power Budget Test (Phase 1 only — Nordic PPK2 required)

| State | Target |
| :--- | :--- |
| BLE idle (no stream) | < 1mA |
| Active streaming (250Hz, compressed) | < 5mA |
| PQC handshake spike (peak) | < 25mA (< 200ms duration) |
| Full system continuous (CPU + BLE + ADC) | < 15mA @ 3.3V = **< 50mW** |

---

## Regression Suite

After each firmware update, run the full suite automatically via a host-side Python test harness:

```python
# pseudo-code
tests = [test_dp, test_ssvep, test_niss_trigger, test_hotswap, test_nsp, test_compression]
for t in tests:
    result = t(serial_port="/dev/tty.usbmodem1234")
    assert result.passed, f"REGRESSION FAILURE: {t.__name__}: {result.message}"
```

---

*Validated by: Gemini 2.5 (Gemini CLI, 2026-02-21). Human oversight: Kevin Qi.*
