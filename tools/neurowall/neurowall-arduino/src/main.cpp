// neurowall-arduino/src/main.cpp
// Layer 1: Signal Boundary — SSVEP Notch Array + Impedance Guard
// Target: Arduino Nano (ATmega328P) @ 16MHz
// Sample rate: 250Hz | Output: UART 115200 baud to Raspberry Pi
//
// See: neurowall/BLUEPRINT.md for full wiring and setup guide.

#include <Arduino.h>

// ─── IIR Biquad Notch Filter ────────────────────────────────────────────────
// Coefficients pre-computed with scipy.signal.iirnotch(f0, Q=30, fs=250)
// Replace with values for your sample rate if different.
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

// SSVEP adversarial injection targets (Hz): 8.57, 10.9, 15.0, 20.0
// Coefficients generated via: scipy.signal.iirnotch(f0, Q=30, fs=250)
// TODO: replace placeholder coefficients with scipy-generated values
BiquadFilter notch_857  = {0.9751, -1.9177, 0.9751, -1.9177, 0.9502}; // ~8.57 Hz
BiquadFilter notch_109  = {0.9644, -1.7820, 0.9644, -1.7820, 0.9289}; // ~10.9 Hz
BiquadFilter notch_150  = {0.9644, -1.6180, 0.9644, -1.6180, 0.9289}; // ~15.0 Hz
BiquadFilter notch_200  = {0.9644, -1.4142, 0.9644, -1.4142, 0.9289}; // ~20.0 Hz

// ─── Impedance Guard ─────────────────────────────────────────────────────────
const float  IMP_THRESHOLD_V  = 2.5;   // Volts — sudden spike = probe injection
const uint32_t LOCKOUT_MS     = 50;    // 50ms signal lockout after anomaly
float        prev_sample      = 0.0f;
uint32_t     lockout_until    = 0;

// ─── Sampling ─────────────────────────────────────────────────────────────────
const uint16_t SAMPLE_RATE_HZ = 250;
const uint32_t SAMPLE_US      = 1000000UL / SAMPLE_RATE_HZ; // 4000µs

void setup() {
  Serial.begin(115200);
  analogReference(DEFAULT); // 0–5V on Arduino Nano
}

void loop() {
  uint32_t now = millis();

  // ── Impedance lockout active ───────────────────────────────────────────────
  if (now < lockout_until) return;

  // ── ADC read: 0–1023 → 0.0–5.0V ─────────────────────────────────────────
  float raw = analogRead(A0) * (5.0f / 1023.0f);

  // ── Impedance Guard ───────────────────────────────────────────────────────
  if (abs(raw - prev_sample) > IMP_THRESHOLD_V) {
    Serial.println("EVT-L1-IMP");          // Sentinel consumed by RPi firewall
    lockout_until = now + LOCKOUT_MS;
    prev_sample = raw;
    return;
  }

  // ── SSVEP Notch Array ─────────────────────────────────────────────────────
  float filtered = notch_857.process(raw);
  filtered       = notch_109.process(filtered);
  filtered       = notch_150.process(filtered);
  filtered       = notch_200.process(filtered);

  // ── UART output: "timestamp_ms,filtered_value\n" ─────────────────────────
  Serial.print(now);
  Serial.print(",");
  Serial.println(filtered, 4);  // 4 decimal places

  prev_sample = raw;
  delayMicroseconds(SAMPLE_US);
}
