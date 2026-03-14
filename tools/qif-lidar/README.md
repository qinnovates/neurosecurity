# Guide Dog, Not Guide Dog

**An homage to Jian-Yang**

QIF-LiDAR --- iPhone depth sensing for vision prosthesis research.

---

## What It Does

QIF-LiDAR turns an iPhone's LiDAR sensor into a depth-aware scene viewer with four display modes:

| Mode | What You See |
|------|-------------|
| **Raw Depth** | Phosphene-colored particle cloud from the depth buffer alone |
| **Color Fusion** | Camera feed with depth-colored particle overlay |
| **AI Classification** | DeepLabV3 semantic segmentation (21 object classes) |
| **Guide Dog Detection** | Is it a guide dog? Or not a guide dog? That is the question |

### The Guide Dog Pipeline

The guide dog detector runs a 3-signal pipeline. All three must agree before declaring "guide dog":

1. **YOLO object detection** --- YOLOv8n identifies a dog in the camera frame
2. **Re-identification embedding** --- DogReID (MobileNetV3) computes a feature vector. The harness changes the silhouette enough to shift the embedding space
3. **Harness depth analysis** --- LiDAR depth map checks for a rigid structure (the harness) on the dog's back at a consistent depth offset from the body surface

Dog with harness-shaped depth signature + YOLO dog + shifted embedding = guide dog. Everything else = not guide dog.

### Other Features

- **Screen recording** --- tap record, walk around, save to Photos. No third-party screen capture
- **Dual-layer rendering** --- Metal shader pipeline composites camera feed (background) and depth particles (foreground) independently
- **Privacy by design** --- no CoreLocation, EXIF stripped from exports, no face detection. See `Privacy/PrivacyGuard.swift`

---

## The Phosphene Story

The depth color ramp is not decorative. It is designed from reported phosphene characteristics in the vision prosthesis literature.

People with retinal or cortical implants typically perceive phosphenes as small points of light. The most commonly reported colors fall in the blue-to-teal range, and brightness is the most reliable perceptual dimension --- brighter means the signal is stronger.

The QIF-LiDAR color ramp maps this directly:

- **Near objects** (0--1.25m): bright teal. Maximum brightness = maximum proximity warning
- **Mid-near** (1.25--2.5m): teal fading to bright blue
- **Mid-far** (2.5--3.75m): blue dimming to blue-grey
- **Far objects** (3.75--5m): dim blue-grey fading to near-black

Brightness encodes depth. Hue stays within the reported phosphene color range. No reds, no greens, no rainbow --- just what the visual cortex is most likely to actually produce through electrical stimulation.

The ramp lives in `Renderer/DepthShaders.metal` as the `lidarColorRamp()` function.

---

## Field Test Findings

Things we learned by actually walking around with this:

1. **iPhone LiDAR is 256x192 pixels.** That is 0.05 megapixels. At arm's length you can count the individual depth samples. For navigation assistance this is marginal; for fine object recognition it is insufficient
2. **Fur scatters infrared.** Dogs absorb and scatter the LiDAR's IR dot pattern unpredictably. Depth readings on fur are noisy, patchy, and vary with coat color and length. The harness (rigid, smooth surface) returns cleaner depth than the dog itself
3. **Camera-first architecture is required.** Any real vision prosthesis depth system needs the RGB camera as primary and LiDAR as supplementary. The camera has 1000x more pixels and handles texture, color, and context. LiDAR adds metric depth and occlusion ordering. Not the other way around
4. **Developer Mode is a deployment barrier.** iOS requires Developer Mode enabled on-device to sideload. This is a 4-step buried settings toggle that most users will never find. Real deployment needs TestFlight or App Store

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Swift |
| Graphics | Metal shaders (vertex + fragment pipeline) |
| Depth capture | ARKit (ARSession, ARFrame depth buffer) |
| Object detection | CoreML --- YOLOv8n (`.mlpackage`) |
| Segmentation | CoreML --- DeepLabV3 (`.mlmodel`) |
| Re-identification | CoreML --- DogReID / MobileNetV3 (`.mlpackage`) |
| UI | SwiftUI (single `ContentView`) |

### Project Structure

```
QIFLiDAR/
  App/              QIFLiDARApp.swift (entry point)
  Capture/           ARSessionManager, SegmentationService
  Export/            SessionExporter (screen recording to Photos)
  GuideBot/          GuideDogDetector, HarnessDetector, DogEmbeddingService
  Models/            CaptureSession, DisplayMode, SegmentationClasses
  Privacy/           PrivacyGuard (EXIF stripping, no location)
  Renderer/          DepthRenderer.swift, DepthShaders.metal
  Resources/         ML models (YOLOv8n, DeepLabV3, DogReID), Info.plist
  Views/             ContentView.swift
```

---

## Requirements

- **iPhone 12 Pro** or later (LiDAR sensor required)
- **iOS 17.0+**
- **Developer Mode** enabled on device (Settings > Privacy & Security > Developer Mode)
- Xcode 15+ to build

---

## Connected Research

This tool is part of the QIF research program exploring sensor-to-perception pipelines for BCI safety.

- **Tech spec:** `tools/qif-lidar/project.yml`
- **Derivation log:** Entries 91--92 in `qif-framework/QIF-DERIVATION-LOG.md` cover the phosphene ramp derivation and field test observations

---

## License

Apache License 2.0 --- same as the parent project. See [LICENSE](../../LICENSE).
