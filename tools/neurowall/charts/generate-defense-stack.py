#!/usr/bin/env python3
"""
Generate the QIF Neural Defense Stack architecture diagram.
Neural Cartography aesthetic: dark field, precise chromatic taxonomy,
clinical typography, concentric defense mapping.

Output: qif-defense-stack.png (2400x1650, 1.5x base for crisp rendering)
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

# ── Scale factor (1.5x base for high-res output) ─────────────────────────
S = 1.5

def s(v):
    """Scale a value."""
    return int(v * S)

# ── Canvas ────────────────────────────────────────────────────────────────
W, H = s(1600), s(1100)
BG = (13, 17, 28)
SUBTLE_BG = (18, 23, 38)

# ── Color Taxonomy ────────────────────────────────────────────────────────
NW_ACCENT = (56, 189, 248)
NW_BG = (15, 30, 50)
NW_BORDER = (40, 120, 180)
NW_DIM = (30, 80, 140)

RM_ACCENT = (251, 191, 36)
RM_BG = (35, 28, 12)
RM_BORDER = (160, 120, 30)
RM_DIM = (120, 90, 20)

NSP_ACCENT = (52, 211, 153)
NSP_BG = (12, 35, 28)
NSP_BORDER = (30, 140, 100)

QIF_ACCENT = (167, 139, 250)
QIF_BG = (25, 20, 45)

TEXT_PRIMARY = (220, 225, 235)
TEXT_SECONDARY = (140, 150, 170)
TEXT_DIM = (90, 100, 120)
LINE_COLOR = (50, 60, 80)
FLOW_LINE = (60, 75, 100)

# ── Fonts ─────────────────────────────────────────────────────────────────
FONT_DIR = os.path.expanduser("~/.claude/skills/canvas-design/canvas-fonts")

def load_font(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONT_DIR, name), s(size))
    except Exception:
        return ImageFont.load_default()

f_title = load_font("Jura-Medium.ttf", 28)
f_section = load_font("Jura-Medium.ttf", 18)
f_label = load_font("InstrumentSans-Regular.ttf", 13)
f_label_b = load_font("InstrumentSans-Bold.ttf", 14)
f_spec = load_font("GeistMono-Regular.ttf", 11)
f_spec_b = load_font("GeistMono-Bold.ttf", 12)
f_tiny = load_font("GeistMono-Regular.ttf", 10)
f_sub = load_font("InstrumentSans-Regular.ttf", 12)
f_head = load_font("Jura-Medium.ttf", 15)

# ── Drawing ───────────────────────────────────────────────────────────────
img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

def rr(x, y, w, h, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle([s(x), s(y), s(x+w), s(y+h)], radius=s(r),
                           fill=fill, outline=outline, width=max(1, int(width * S)))

def tx(x, y, text, font, fill):
    draw.text((s(x), s(y)), text, font=font, fill=fill)

def txc(x, y, w, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text((s(x) + (s(w) - tw) / 2, s(y)), text, font=font, fill=fill)

def line(x1, y1, x2, y2, color, width=1):
    draw.line([(s(x1), s(y1)), (s(x2), s(y2))], fill=color, width=max(1, int(width * S)))

def arrow_d(x, y1, y2, color, w=1):
    line(x, y1, x, y2, color, w)
    sz = 5
    draw.polygon([(s(x)-s(sz), s(y2)-s(sz+2)), (s(x)+s(sz), s(y2)-s(sz+2)),
                  (s(x), s(y2))], fill=color)

def arrow_r(x1, x2, y, color, w=1):
    line(x1, y, x2, y, color, w)
    sz = 4
    draw.polygon([(s(x2)-s(sz+1), s(y)-s(sz)), (s(x2)-s(sz+1), s(y)+s(sz)),
                  (s(x2), s(y))], fill=color)

def dashed(x1, y1, x2, y2, color, dash=6, gap=4, width=1):
    dx, dy = x2-x1, y2-y1
    length = math.sqrt(dx*dx + dy*dy)
    if length == 0: return
    ux, uy = dx/length, dy/length
    pos = 0
    while pos < length:
        end = min(pos + dash, length)
        draw.line([(s(x1 + ux*pos), s(y1 + uy*pos)),
                   (s(x1 + ux*end), s(y1 + uy*end))],
                  fill=color, width=max(1, int(width * S)))
        pos += dash + gap

# ══════════════════════════════════════════════════════════════════════════
# LAYOUT (all values in base coordinates, scaled at render time)
# ══════════════════════════════════════════════════════════════════════════
M = 40           # margin
GAP = 30         # column gap
NW_X = M + 10
NW_W = 680
RM_X = NW_X + NW_W + GAP
RM_W = 680
FULL_W = NW_W + GAP + RM_W

# ── Title ─────────────────────────────────────────────────────────────────
tx(M+10, 18, "QIF NEURAL DEFENSE STACK", f_title, TEXT_PRIMARY)
tx(M+10, 50, "Architecture: Neurowall + Runemate + NSP Transport", f_sub, TEXT_SECONDARY)

# Badges
rr(W/S - M - 75, 22, 62, 22, 4, fill=NW_ACCENT)
txc(W/S - M - 75, 24, 62, "v0.8", f_spec_b, BG)

rr(W/S - M - 195, 22, 110, 22, 4, fill=QIF_BG, outline=QIF_ACCENT)
txc(W/S - M - 195, 25, 110, "I0 Bottleneck", f_spec, QIF_ACCENT)

line(M, 65, W/S - M, 65, LINE_COLOR)

# ── Signal Source ─────────────────────────────────────────────────────────
sig_w = 280
sig_x = M + 10 + (FULL_W - sig_w) // 2
rr(sig_x, 75, sig_w, 36, 6, fill=(25, 30, 45), outline=TEXT_DIM)
txc(sig_x, 79, sig_w, "RAW NEURAL SIGNAL", f_head, TEXT_PRIMARY)
txc(sig_x, 96, sig_w, "EEG / EMG / ECoG electrodes", f_tiny, TEXT_SECONDARY)

mid_x = sig_x + sig_w // 2
arrow_d(mid_x, 111, 126, FLOW_LINE)

split_y = 126
nw_mid = NW_X + NW_W // 2
rm_mid = RM_X + RM_W // 2
line(nw_mid, split_y, rm_mid, split_y, FLOW_LINE)
arrow_d(nw_mid, split_y, split_y + 14, NW_DIM)
arrow_d(rm_mid, split_y, split_y + 14, RM_DIM)

# ══════════════════════════════════════════════════════════════════════════
# NEUROWALL (LEFT)
# ══════════════════════════════════════════════════════════════════════════
nw_top = split_y + 14
nw_h = 575
hdr = 34

rr(NW_X, nw_top, NW_W, nw_h, 10, outline=NW_BORDER)
rr(NW_X, nw_top, NW_W, hdr, 10, fill=NW_BG)
draw.rectangle([s(NW_X+1), s(nw_top+hdr-10), s(NW_X+NW_W-1), s(nw_top+hdr)], fill=NW_BG)
line(NW_X, nw_top+hdr, NW_X+NW_W, nw_top+hdr, NW_BORDER)

tx(NW_X+14, nw_top+8, "NEUROWALL", f_section, NW_ACCENT)
tx(NW_X+140, nw_top+12, "Inbound Signal Defense", f_sub, TEXT_SECONDARY)

rr(NW_X+NW_W-90, nw_top+7, 72, 20, 3, outline=NW_DIM)
txc(NW_X+NW_W-90, nw_top+9, 72, "THE MOAT", f_tiny, NW_DIM)

cx = NW_X + 12
cw = NW_W - 24

# ── L1 ────────────────────────────────────────────────────────────────────
l1y = nw_top + hdr + 10
l1h = 120

rr(cx, l1y, cw, l1h, 8, fill=SUBTLE_BG, outline=NW_DIM)
rr(cx+10, l1y+8, 28, 18, 3, fill=NW_ACCENT)
txc(cx+10, l1y+10, 28, "L1", f_spec_b, BG)
tx(cx+46, l1y+9, "Signal Boundary", f_label_b, TEXT_PRIMARY)
tx(cx+185, l1y+10, "Hardware-level voltage guard", f_spec, TEXT_SECONDARY)

for i, (lbl, spec) in enumerate([
    ("Impedance Guard", "|sample - prev| > 2.5V  ->  50ms lockout"),
    ("Notch Filter Bank", "8.57, 10.9, 15.0, 20.0 Hz  (Q=30, scipy iirnotch)"),
    ("Voltage Slew Rate", "Binary block, instant, zero FPR on clean signal"),
    ("SSVEP Signature", "Known-frequency visual attack detection"),
]):
    y = l1y + 34 + i * 20
    tx(cx+18, y, lbl, f_label, NW_ACCENT)
    tx(cx+180, y, spec, f_spec, TEXT_DIM)

arrow_d(NW_X+NW_W//2, l1y+l1h, l1y+l1h+8, NW_DIM)

# ── L2 ────────────────────────────────────────────────────────────────────
l2y = l1y + l1h + 8
l2h = 170

rr(cx, l2y, cw, l2h, 8, fill=SUBTLE_BG, outline=NW_DIM)
rr(cx+10, l2y+8, 28, 18, 3, fill=NW_ACCENT)
txc(cx+10, l2y+10, 28, "L2", f_spec_b, BG)
tx(cx+46, l2y+9, "Inference Guard", f_label_b, TEXT_PRIMARY)
tx(cx+185, l2y+10, "Signal processing + anomaly detection", f_spec, TEXT_SECONDARY)

for i, (lbl, spec) in enumerate([
    ("Differential Privacy", "Laplace noise, sensitivity=0.001, epsilon=0.5"),
    ("Coherence Monitor", "Cs = exp(-(w1*sigma_phi^2 + w2*H_tau))"),
    ("  Baseline", "Cs ~ 0.70 (auto-calibrated w2, 4s calibration window)"),
    ("Spectral Peak", "Z-score > 5.0 sustained 3/4 windows (novel freq)"),
    ("CUSUM Detector", "Cumulative sum for sustained low-level anomalies"),
    ("Growth Detector", "Log-linear regression, 8-window, slope > 0.2, R^2 > 0.5"),
]):
    y = l2y + 34 + i * 20
    color = NW_ACCENT if not lbl.startswith("  ") else (80, 160, 220)
    tx(cx+18, y, lbl, f_label, color)
    tx(cx+190, y, spec, f_spec, TEXT_DIM)

arrow_d(NW_X+NW_W//2, l2y+l2h, l2y+l2h+8, NW_DIM)

# ── L3 ────────────────────────────────────────────────────────────────────
l3y = l2y + l2h + 8
l3h = 230

rr(cx, l3y, cw, l3h, 8, fill=SUBTLE_BG, outline=NW_DIM)
rr(cx+10, l3y+8, 28, 18, 3, fill=NW_ACCENT)
txc(cx+10, l3y+10, 28, "L3", f_spec_b, BG)
tx(cx+46, l3y+9, "Policy Agent", f_label_b, TEXT_PRIMARY)
tx(cx+165, l3y+10, "RunematePolicy Engine (5-rule priority stack)", f_spec, TEXT_SECONDARY)

# Table header
ty = l3y + 34
tx(cx+18, ty, "#", f_spec_b, TEXT_DIM)
tx(cx+35, ty, "RULE", f_spec_b, TEXT_DIM)
tx(cx+185, ty, "CONDITION", f_spec_b, TEXT_DIM)
tx(cx+445, ty, "EPS", f_spec_b, TEXT_DIM)
tx(cx+500, ty, "ALERT", f_spec_b, TEXT_DIM)
line(cx+18, ty+15, cx+cw-18, ty+15, LINE_COLOR)

for i, (num, name, cond, eps, alert, ac) in enumerate([
    ("1", "critical_niss", "NISS>=8, anomaly>=3.0, 2+ windows", "0.05", "CRITICAL", (255, 80, 80)),
    ("2", "high_niss", "NISS >= 7", "0.10", "WARNING", (255, 180, 50)),
    ("3", "sustained_anomaly", "anomaly>=2.0, 3+ windows", "0.20", "ADVISORY", (100, 200, 255)),
    ("4", "growth_detected", "growth detector triggered", "0.10", "WARNING", (255, 180, 50)),
    ("5", "spectral_peak", "spectral peak detector triggered", "0.20", "ADVISORY", (100, 200, 255)),
]):
    y = ty + 19 + i * 22
    tx(cx+20, y, num, f_spec, TEXT_DIM)
    tx(cx+35, y, name, f_spec, NW_ACCENT)
    tx(cx+185, y, cond, f_spec, TEXT_DIM)
    tx(cx+448, y, eps, f_spec_b, TEXT_PRIMARY)
    tx(cx+500, y, alert, f_spec, ac)

# Cooldown note
ny = ty + 19 + 5 * 22 + 8
tx(cx+18, ny, "4-window cooldown  |  Rules 1,4 suppress stimulation  |  NISS per-sample, policy per-window", f_tiny, TEXT_DIM)

# Stimulation suppression visual indicator
rr(cx+18, ny+18, cw-36, 20, 3, fill=(40, 15, 15), outline=(120, 40, 40))
txc(cx+18, ny+20, cw-36, "STIMULATION SUPPRESSED when critical_niss or growth_detected fires", f_tiny, (200, 80, 80))

# ══════════════════════════════════════════════════════════════════════════
# RUNEMATE (RIGHT)
# ══════════════════════════════════════════════════════════════════════════
rm_top = nw_top
rm_h = nw_h

rr(RM_X, rm_top, RM_W, rm_h, 10, outline=RM_BORDER)
rr(RM_X, rm_top, RM_W, hdr, 10, fill=RM_BG)
draw.rectangle([s(RM_X+1), s(rm_top+hdr-10), s(RM_X+RM_W-1), s(rm_top+hdr)], fill=RM_BG)
line(RM_X, rm_top+hdr, RM_X+RM_W, rm_top+hdr, RM_BORDER)

tx(RM_X+14, rm_top+8, "RUNEMATE", f_section, RM_ACCENT)
tx(RM_X+135, rm_top+12, "Content Rendering Defense", f_sub, TEXT_SECONDARY)

rr(RM_X+RM_W-100, rm_top+7, 82, 20, 3, outline=RM_DIM)
txc(RM_X+RM_W-100, rm_top+9, 82, "THE CASTLE", f_tiny, RM_DIM)

rx = RM_X + 12
rw = RM_W - 24
sx_badge = rx + rw - 82

# ── Forge ─────────────────────────────────────────────────────────────────
fy = rm_top + hdr + 10
fh = 150

rr(rx, fy, rw, fh, 8, fill=SUBTLE_BG, outline=RM_DIM)
rr(rx+10, fy+8, 50, 18, 3, fill=RM_ACCENT)
txc(rx+10, fy+10, 50, "FORGE", f_spec_b, BG)
tx(rx+68, fy+9, "DSL Compiler", f_label_b, TEXT_PRIMARY)
tx(rx+195, fy+10, "HTML -> Staves bytecode  (Rust, 2740 lines)", f_spec, TEXT_SECONDARY)

rr(sx_badge, fy+7, 70, 18, 3, fill=(20, 60, 30), outline=(50, 160, 80))
txc(sx_badge, fy+9, 70, "COMPLETE", f_tiny, (80, 220, 120))

for i, (lbl, spec) in enumerate([
    ("Compression", "67.8% (1059B HTML -> 341B Staves)"),
    ("Breakeven", "~23 KB (above this, PQ+Staves < classical+HTML)"),
    ("String Table", "Deduplication, 80-90% size reduction"),
    ("Style Table", "Merged style constants, 85-90% reduction"),
    ("Safety", "Closed vocabulary, safety by construction"),
]):
    y = fy + 34 + i * 20
    tx(rx+18, y, lbl, f_label, RM_ACCENT)
    tx(rx+155, y, spec, f_spec, TEXT_DIM)

arrow_d(RM_X+RM_W//2, fy+fh, fy+fh+8, RM_DIM)

# ── Scribe ────────────────────────────────────────────────────────────────
sy = fy + fh + 8
sh = 125

rr(rx, sy, rw, sh, 8, fill=SUBTLE_BG, outline=RM_DIM)
rr(rx+10, sy+8, 55, 18, 3, fill=RM_ACCENT)
txc(rx+10, sy+10, 55, "SCRIBE", f_spec_b, BG)
tx(rx+73, sy+9, "On-Chip Interpreter", f_label_b, TEXT_PRIMARY)

rr(sx_badge, sy+7, 70, 18, 3, fill=(40, 35, 15), outline=(160, 130, 40))
txc(sx_badge, sy+9, 70, "PHASE 2", f_tiny, (220, 180, 60))

for i, (lbl, spec) in enumerate([
    ("Footprint", "<200 KB on-chip (Cortex-M4F target)"),
    ("Power", "<5% overhead on 40mW wearable thermal budget"),
    ("Execution", "Staves bytecode -> cortical rendering commands"),
    ("Runtime", "Policy constraints enforced at interpretation time"),
]):
    y = sy + 34 + i * 20
    tx(rx+18, y, lbl, f_label, RM_ACCENT)
    tx(rx+155, y, spec, f_spec, TEXT_DIM)

arrow_d(RM_X+RM_W//2, sy+sh, sy+sh+8, RM_DIM)

# ── Multimodal ────────────────────────────────────────────────────────────
my = sy + sh + 8
mh = 125

rr(rx, my, rw, mh, 8, fill=SUBTLE_BG, outline=RM_DIM)
tx(rx+14, my+9, "Multimodal Neural Rendering", f_label_b, TEXT_PRIMARY)

rr(sx_badge, my+7, 70, 18, 3, fill=(25, 20, 40), outline=(120, 100, 200))
txc(sx_badge, my+9, 70, "PHASE 3", f_tiny, (160, 140, 240))

mod_w = (rw - 48) // 3
mod_y = my + 34

for i, (name, cortex, topo, opcode) in enumerate([
    ("VISUAL", "V1-V3", "Retinotopic", "stave / layout"),
    ("AUDITORY", "A1", "Tonotopic", "tone (Hz, ms)"),
    ("HAPTIC", "S1", "Somatotopic", "pulse (int, ms)"),
]):
    mx = rx + 14 + i * (mod_w + 10)
    rr(mx, mod_y, mod_w, 75, 6, fill=(25, 25, 35), outline=RM_DIM)
    txc(mx, mod_y+6, mod_w, name, f_spec_b, RM_ACCENT)
    txc(mx, mod_y+22, mod_w, cortex, f_label, TEXT_PRIMARY)
    txc(mx, mod_y+38, mod_w, topo, f_spec, TEXT_SECONDARY)
    txc(mx, mod_y+54, mod_w, opcode, f_tiny, TEXT_DIM)

# Remaining space: description
rr(rx+14, mod_y+82, rw-28, 20, 3, fill=(28, 25, 18), outline=RM_DIM)
txc(rx+14, mod_y+84, rw-28, "Topographic cortical maps ensure neural rendering targets correct brain regions", f_tiny, TEXT_DIM)

# ══════════════════════════════════════════════════════════════════════════
# BRIDGE: L3 <-> Forge (RunematePolicy DSL link)
# ══════════════════════════════════════════════════════════════════════════
bridge_y = l3y + 30
dashed(NW_X+NW_W, bridge_y, RM_X, bridge_y, QIF_ACCENT, dash=5, gap=3)

bl = "RunematePolicy DSL"
bl_bbox = draw.textbbox((0, 0), bl, font=f_tiny)
bl_w = (bl_bbox[2] - bl_bbox[0]) / S
bl_x = NW_X + NW_W + (GAP - bl_w) / 2
rr(bl_x - 4, bridge_y - 10, bl_w + 8, 18, 3, fill=BG, outline=QIF_ACCENT)
tx(bl_x, bridge_y - 8, bl, f_tiny, QIF_ACCENT)

# Second bridge: Scribe <-> L2 coherence data
bridge_y2 = l2y + 60
dashed(NW_X+NW_W, bridge_y2, RM_X, bridge_y2, (60, 60, 90), dash=3, gap=4)

bl2 = "signal state"
bl2_bbox = draw.textbbox((0, 0), bl2, font=f_tiny)
bl2_w = (bl2_bbox[2] - bl2_bbox[0]) / S
bl2_x = NW_X + NW_W + (GAP - bl2_w) / 2
rr(bl2_x - 4, bridge_y2 - 10, bl2_w + 8, 18, 3, fill=BG, outline=(60, 60, 90))
tx(bl2_x, bridge_y2 - 8, bl2, f_tiny, TEXT_DIM)

# ══════════════════════════════════════════════════════════════════════════
# NSP TRANSPORT (BOTTOM)
# ══════════════════════════════════════════════════════════════════════════
nsp_y = nw_top + nw_h + 18
nsp_h = 100
nsp_x = NW_X
nsp_w = NW_W + GAP + RM_W

arrow_d(NW_X+NW_W//2, nw_top+nw_h, nsp_y, NSP_BORDER)
arrow_d(RM_X+RM_W//2, rm_top+rm_h, nsp_y, NSP_BORDER)

rr(nsp_x, nsp_y, nsp_w, nsp_h, 10, fill=NSP_BG, outline=NSP_BORDER)

tx(nsp_x+14, nsp_y+8, "NSP TRANSPORT", f_section, NSP_ACCENT)
tx(nsp_x+185, nsp_y+12, "Neural Sensory Protocol v0.5  |  Shared cryptographic foundation", f_sub, TEXT_SECONDARY)

nsp_specs = [
    ("COMPRESS", "Delta + LZ4\n65-90% reduction"),
    ("QI CHECK", "Signal coherence\nverification"),
    ("ENCRYPT", "AES-256-GCM-SIV\nper-frame"),
    ("PQ KEY EXCH", "ML-KEM-768\nhybrid handshake"),
    ("SIGN", "ML-DSA-65\nMerkle amortized"),
    ("TRANSPORT", "BLE / wired\n~144B overhead"),
]

box_w = (nsp_w - 28 - 5 * 10) // 6
for i, (title, desc) in enumerate(nsp_specs):
    bx = nsp_x + 14 + i * (box_w + 10)
    by = nsp_y + 38
    bh = 52
    rr(bx, by, box_w, bh, 5, fill=(15, 40, 32), outline=NSP_BORDER)
    txc(bx, by+4, box_w, title, f_tiny, NSP_ACCENT)
    for j, ln in enumerate(desc.split("\n")):
        txc(bx, by+18+j*14, box_w, ln, f_tiny, TEXT_DIM)

for i in range(5):
    ax_start = nsp_x + 14 + (i+1) * (box_w + 10) - 8
    arrow_r(ax_start - 3, ax_start + 5, nsp_y + 62, NSP_BORDER)

# ── Direction Labels ──────────────────────────────────────────────────────
for i, ch in enumerate("INBOUND"):
    tx(NW_X-2, nw_top + nw_h//2 - 30 + i*14, ch, f_tiny, NW_DIM)

for i, ch in enumerate("OUTBOUND"):
    tx(RM_X+RM_W+6, rm_top + rm_h//2 - 35 + i*14, ch, f_tiny, RM_DIM)

# ── QIF Hourglass Strip ──────────────────────────────────────────────────
qy = nsp_y + nsp_h + 10
qx = nsp_x + nsp_w - 380

tx(qx, qy, "QIF Hourglass:", f_tiny, QIF_ACCENT)
for i, band in enumerate(["N7","N6","N5","N4","N3","N2","N1","I0","S1","S2","S3"]):
    bx = qx + 95 + i * 26
    if band == "I0":
        rr(bx-2, qy-2, 24, 16, 3, fill=QIF_BG, outline=QIF_ACCENT)
    tx(bx, qy, band, f_tiny, QIF_ACCENT if band == "I0" else TEXT_DIM)

tx(qx, qy+16, "Both systems operate at I0 — the neural interface bottleneck", f_tiny, TEXT_DIM)

# ══════════════════════════════════════════════════════════════════════════
# SAVE
# ══════════════════════════════════════════════════════════════════════════
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "qif-defense-stack.png")
img.save(out, "PNG")
print(f"Saved: {out} ({W}x{H}px)")
