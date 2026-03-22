# LiDAR-to-BCI Bridge: Technical Specification for a Spatial Sensing Prototype with Implications for Vision Prosthesis Security

**Document Type:** Research Technical Specification
**Version:** 1.1 DRAFT (reviewed, corrections applied)
**Date:** 2026-03-13
**Author:** Kevin L. Qi, Qinnovate
**Status:** Pre-implementation — seeking clinical collaborator feedback
**Classification:** PUBLIC — Qinnovate Research

---

## 1. Objective

Build a functional iOS prototype application that demonstrates a complete sensor-to-classification pipeline using iPhone LiDAR hardware. The application will:

1. Capture real-time spatial depth data from the iPhone's dToF LiDAR sensor
2. Render the data as an interactive 3D visualization with multiple display modes
3. Classify objects in the scene using on-device machine learning
4. Export both raw data and rendered video with all personally identifiable metadata stripped

The prototype serves as an **architectural proof-of-concept** for the signal processing, classification, and privacy pipeline required by neural vision prostheses — establishing that the software architecture works with commodity hardware before clinical adaptation.

### 1.1 Initial Clinical Use-Case: Guide Dog Detection

Early vision prostheses will produce low-resolution, unreliable visual output. Patients will not be able to navigate independently using prosthesis vision alone. **The guide dog remains the primary mobility and safety system.** The prosthesis is an augmentation, not a replacement.

The first practical application of AI-assisted classification in this pipeline is therefore not general scene understanding — it is **reliably identifying the patient's guide dog** within the prosthesis visual field. This is the minimum viable perception task:

- **Single-class problem.** The classifier needs to distinguish one object (the guide dog) from everything else. This is orders of magnitude easier than 21-class semantic segmentation and can achieve higher accuracy at the resolution limits of current prostheses.
- **Always present.** The guide dog is the one object guaranteed to be in the patient's environment during mobility. It is the highest-value detection target.
- **Safety-critical anchor.** If the prosthesis produces confusing or incorrect visual output, the patient needs to immediately locate their dog. The guide dog is the fallback — the one thing the system must get right.
- **Trainable to the individual animal.** Unlike generic "dog" detection, the classifier can be fine-tuned to recognize a specific guide dog (breed, size, harness silhouette) using a small set of enrollment images captured during device calibration. This improves accuracy and reduces false positives.
- **Testable without clinical hardware.** The LiDAR prototype can validate guide dog detection accuracy, false positive rate, and adversarial robustness using real guide dogs in real environments — before any prosthesis integration.

The full 21-class DeepLabV3 segmentation remains in the prototype for research purposes, but the clinical deployment path narrows to: **Can the patient find their dog?** Everything else is secondary until that works reliably.

### 1.2 Explicit Scope Exclusion: Human Face Detection and Recognition

**Human face rendering is intentionally excluded from all phases of this prototype.** This is a design constraint, not a technical limitation.

**Technical rationale:** Face detection and recognition at prosthesis resolution (60–378 pixels) is a substantially harder problem than object classification. At 60 phosphenes, a face occupying 20% of the visual field resolves to approximately 12 points — insufficient for identification and likely to produce uncanny or distressing output. Solving face rendering well enough to be useful requires significantly higher prosthesis resolution than currently exists.

**Ethical rationale:** Face recognition in a vision prosthesis introduces surveillance capabilities that the patient may not intend or consent to. A prosthesis that identifies faces creates a walking biometric scanner. This raises questions that are not engineering problems:

- **Consent of the observed.** Bystanders do not consent to being identified by another person's medical device. Unlike a sighted person recognizing someone, a prosthesis with face recognition creates a logged, searchable, potentially networked record.
- **Dual-use risk.** A face recognition model in a neural device is indistinguishable from a surveillance tool. The same architecture that helps a blind patient recognize their family could be mandated by an employer, coerced by law enforcement, or exploited by a state actor.
- **Data sovereignty.** If face embeddings are stored or transmitted, the prosthesis generates biometric data about non-patients. This conflicts with the QIF principle that neural device data belongs exclusively to the patient.
- **Perceptual harm.** Incorrect face identification in a prosthesis could produce distressing experiences — perceiving a stranger as a loved one, or a loved one as unrecognized.

These are solvable problems, but they require a dedicated ethical framework, not an engineering workaround. We will not include face recognition until that framework exists.

### 1.3 Future Consideration: Consent-Based Identification for Public Safety

A natural question arises: if a vision prosthesis can eventually identify people, could it be used for public good?

**Potential use-case: Amber Alert opt-in.** A future version of this system — once face rendering is technically viable and the ethical framework is in place — could allow patients to voluntarily opt in to a missing child identification service. The architecture would work as follows:

1. Patient explicitly opts in through an informed consent process (not a default, not a prompt — a deliberate enrollment with full disclosure of what data is processed)
2. A small, locally-stored set of Amber Alert facial embeddings is pushed to the device (not cloud-queried per face — the lookup is local)
3. If a match exceeds a high-confidence threshold, the patient receives a notification: "Possible Amber Alert match nearby. Contact authorities?"
4. No image, no embedding, and no match data leaves the device unless the patient explicitly initiates a report
5. The patient can opt out at any time with immediate local deletion of all Amber Alert data

**Why this matters for the research:**

This use-case illustrates a design principle that applies to every capability added to a neural device: **the patient's consent architecture must be designed before the technical capability is built.** Adding face recognition first and consent later is the pattern that created the problems we see in consumer technology. We are explicitly choosing the reverse order.

This opt-in model also demonstrates that privacy and public safety are not in conflict — they are in sequence. Privacy is the default. Public safety is an option the patient grants. The device never acts without the patient's knowledge and permission.

**Status:** This is a long-term research direction, not a current deliverable. It is documented here to establish the ethical reasoning before the technical pressure to "just add face detection" arrives. When prosthesis resolution supports face rendering (estimated: 1,000+ channels, not yet commercially available), the consent framework must already exist.

### 1.4 "BCI Knight's Watch" — Consent-Gated Playbook Architecture

The Amber Alert opt-in is not a simple feature toggle. It is a **conditional playbook** that executes only when a chain of criteria are met. This follows the same pattern Apple uses for Face ID — all biometric computation stays on-device, nothing leaves unless the user explicitly acts.

**Design principle:** Like Apple Face ID, where the Secure Enclave stores the facial geometry on-device and never transmits it, the BCI Knight's Watch feature stores nothing and transmits nothing unless every gate in the playbook passes. The patient's device is not a surveillance tool. It is a locked safe that only opens under specific, user-consented conditions.

**Playbook execution chain (ALL gates must pass in sequence):**

```
Gate 0: USER CONSENT
  └─ Patient has explicitly enrolled in "BCI Knight's Watch"
     (not a default, not a prompt — a deliberate opt-in with full disclosure)
     └─ If NO → playbook never activates. No compute. No scanning. Full stop.

Gate 1: AMBER ALERT RECEIVED
  └─ A verified Amber Alert push notification is received from the
     national Amber Alert system (NCMEC/Wireless Emergency Alerts)
     └─ If NO → playbook does not activate. No scanning occurs.
     └─ This is the trigger. Without an active alert, the playbook is dormant.

Gate 2: LOCATION RELEVANCE
  └─ The device confirms it is in the geographic area specified by the alert
     (using on-device location check — location is NOT transmitted)
     └─ If NO → playbook does not activate. Not your area, not your alert.
     └─ This prevents the device from scanning for children in Alaska
        when the alert is for Florida.

Gate 3: PHYSICAL PROFILE PRE-SCREEN (no facial data)
  └─ Before ANY facial processing, the system uses non-biometric attributes
     from the alert: approximate height, weight, age range, clothing description
     └─ The LiDAR depth data estimates height of detected persons in the scene
     └─ Only if a person in the scene matches the physical profile within
        confidence bounds does the playbook advance
     └─ If NO match on physical profile → no facial scan occurs. Nothing stored.
     └─ This gate ensures the vast majority of people in the scene are never
        subjected to any facial analysis at all.

Gate 4: HIGH-CONFIDENCE AI MATCH
  └─ Only after Gates 0-3 pass does the system perform a facial similarity
     check against the single missing child's embedding from the alert
     └─ This is a 1:1 comparison (is this specific person the missing child?)
        NOT a 1:N search (who is this person?)
     └─ The comparison runs entirely on-device
     └─ If confidence < threshold → no action. Nothing stored. Embedding discarded.
     └─ If confidence ≥ threshold → proceed to Gate 5

Gate 5: PATIENT DECISION
  └─ The patient receives a private notification:
     "Possible Amber Alert match nearby. Would you like to contact authorities?"
     └─ If patient declines → nothing is stored, nothing is transmitted, done.
     └─ If patient confirms → the device provides location to 911/NCMEC
        (the patient's location, not the child's biometric data)
     └─ The patient is the human in the loop. The device does not act autonomously.
```

**What is NEVER stored or transmitted:**
- Facial embeddings of bystanders (never computed unless Gate 3 passes)
- Facial embeddings of non-matching individuals (discarded immediately)
- Any biometric data about children (COPPA compliance is non-negotiable)
- The missing child's reference embedding after the alert expires (auto-deleted)
- Any data about the patient's scanning activity (no logs, no telemetry)

**COPPA compliance (Children's Online Privacy Protection Act):**
This is the hardest constraint and the most important. COPPA prohibits collection of personal information from children under 13 without verifiable parental consent. In this architecture:
- The device does NOT collect personal information from any child. It performs a 1:1 on-device comparison and discards all data regardless of result.
- No child's biometric data is ever stored on the patient's device beyond the active alert period.
- No child's biometric data is ever transmitted from the patient's device.
- The only data that leaves the device (if the patient chooses to report) is the patient's own location.
- Legal review is required before any implementation to confirm this architecture satisfies COPPA, state biometric laws (BIPA, CCPA), and GDPR Article 9 (biometric data of minors).

**Why this matters for the research:**
This playbook architecture demonstrates that privacy, consent, and public safety can coexist in a neural device if the consent gates are designed before the capability is built. Each gate is a checkpoint that can be independently audited. The architecture is inspectable — a patient, a regulator, or an ethicist can trace exactly what happens at each step and verify that no data leaks between gates.

This is consent-as-architecture applied to a real use-case, not a theoretical principle.

*Note: Any implementation of face recognition in a medical device would require IRB approval, compliance with biometric data protection laws (BIPA, GDPR Article 9, state-level biometric statutes), COPPA compliance review, and coordination with NCMEC and law enforcement agencies regarding Amber Alert data handling. These requirements are non-negotiable and must precede any technical work.*

## 2. Purpose and Scientific Framing

### 2.1 The Gap

Vision restoration BCIs are entering clinical deployment. The Science Corp PRIMA retinal implant (378 pixels, 38 patients in PRIMAvera trial, NEJM Oct 2025) and Cortigent Orion cortical visual prosthesis (60 electrodes, 6-year early feasibility data presented at NANS 2026) each implement some variant of the same pipeline:

```
External sensor → Signal processing → Neural stimulation → Perception
```

No published security analysis exists for this pipeline in any shipping or trial-stage vision prosthesis. TARA catalogs 109 attack techniques, several of which directly target the visual pathway — but no prototype exists to test whether those techniques can be detected, mitigated, or simulated in a controlled environment.

### 2.2 The Hypothesis

**H1:** A commodity spatial sensing pipeline (iPhone LiDAR → on-device AI → classified output) is architecturally isomorphic to the signal processing stage of a vision prosthesis pipeline (camera → processor → electrode stimulation pattern). If we can demonstrate real-time spatial capture, classification, privacy-preserving export, and anomaly detection on the commodity pipeline, the same software architecture can be adapted to validate TARA threat techniques against clinical vision restoration systems.

**H2:** TARA techniques targeting the visual pathway (signal injection, stimulation pattern manipulation, depth perception distortion) can be modeled as adversarial perturbations to the classification stage of this pipeline, enabling controlled security testing without requiring access to implanted hardware or human subjects.

### 2.3 Why LiDAR

The iPhone LiDAR sensor is selected because:

| Property | iPhone LiDAR | Vision Prosthesis |
|----------|-------------|-------------------|
| Sensing modality | Direct time-of-flight (dToF), 256×192 ARKit-interpolated output (576 physical VCSEL detection points) | Photodiode array (PRIMA: 378 pixels) or camera + processor |
| Depth resolution | mm-accurate, 5m range | Phosphene resolution varies (60–8,192 channels) |
| Frame rate | 60 Hz | 20–60 Hz typical stimulation rate |
| Processing | A-series Neural Engine, on-device | External processor unit (pocket/belt-worn) |
| Output | 3D point cloud + mesh | Electrical stimulation pattern |
| Data format | Structured (CVPixelBuffer, ARMeshAnchor) | Proprietary per manufacturer |

The resolution and frame rate are comparable. The processing architecture (on-device neural engine) mirrors the edge processing required by implanted systems. The critical difference — electrical stimulation of neural tissue vs. visual rendering on a screen — is precisely the gap this prototype is designed to bridge toward.

### 2.4 Connection to TARA

The following TARA techniques are directly relevant to vision prosthesis pipelines:

| TARA ID | Technique | Relevance to Vision Prosthesis |
|---------|-----------|-------------------------------|
| QIF-T0001 | Signal Injection | Injecting false depth/spatial data into the processing pipeline |
| QIF-T0003 | Data Exfiltration | Extracting what the user "sees" from the prosthesis data stream |
| QIF-T0005 | Firmware Manipulation | Altering the stimulation pattern generation firmware |
| QIF-T0008 | Wireless Interception | Intercepting the wireless link between external camera and implant processor |
| QIF-T0010 | Replay Attack | Replaying previously captured stimulation patterns |
| QIF-T0015 | Stimulation Parameter Manipulation | Altering intensity, frequency, or spatial pattern of stimulation |
| QIF-T0025 | Data Poisoning | Corrupting the training data for AI-driven scene interpretation |
| QIF-T0030 | Side-Channel Leakage | Inferring visual scene content from power consumption or RF emissions |

This prototype enables controlled testing of T0001 (signal injection), T0010 (replay), T0025 (data poisoning), and T0030 (side-channel analysis) without access to implanted hardware.

**Prototype implementation specifics:**

| TARA ID | Prototype Implementation | Perturbation Method | Transferability to Prosthesis |
|---------|------------------------|---------------------|-------------------------------|
| QIF-T0001 | Inject synthetic depth values into CVPixelBuffer before classifier | Gaussian noise at σ = {0.1, 0.3, 0.5, 1.0}m applied to defined spatial regions | **High** — software-layer attack independent of output modality |
| QIF-T0010 | Record 60s depth stream, replay to classifier while device moves | Compare live vs. replayed classification distributions via Mahalanobis distance | **High** — replay is sensor-agnostic |
| QIF-T0015 | Apply systematic depth bias (+10%, +20%, +50%) to specific scene regions | Multiplicative and additive depth perturbation | **Partial** — tests classification sensitivity to depth errors; does not test stimulation amplitude manipulation |
| QIF-T0025 | Fine-tune DeepLabV3 on mislabeled data at {1%, 5%, 10%, 20%} poisoning ratio | Label-flipping attack on PASCAL VOC fine-tune set | **High** — poisoning attacks target the training pipeline, which is architecture-independent |
| QIF-T0030 | Monitor thermal signature and frame processing latency during scene classification | Correlate scene complexity / class distribution with observable side-channel signals | **Partial** — iPhone thermal profile differs from prosthesis processor; attack class transfers, specific thresholds do not |

---

## 3. Technical Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────┐
│                    iPhone Hardware                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ LiDAR    │  │ RGB      │  │ IMU / Motion      │  │
│  │ (dToF)   │  │ Camera   │  │ (Accelerometer,   │  │
│  │ 256×192  │  │ 12MP     │  │  Gyroscope)       │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
│  ┌────▼──────────────▼─────────────────▼──────────┐  │
│  │              ARKit Session                      │  │
│  │  ARWorldTrackingConfiguration                   │  │
│  │  + .sceneDepth + .sceneReconstruction           │  │
│  │  + .personSegmentation                          │  │
│  └────┬──────────────┬─────────────────┬──────────┘  │
│       │              │                 │              │
│  ┌────▼────┐   ┌─────▼─────┐   ┌──────▼──────────┐  │
│  │ Depth   │   │ RGB       │   │ Mesh / Point     │  │
│  │ Buffer  │   │ Frame     │   │ Cloud            │  │
│  │ + Conf  │   │           │   │ (ARMeshAnchor)   │  │
│  └────┬────┘   └─────┬─────┘   └──────┬──────────┘  │
│       │              │                 │              │
│  ┌────▼──────────────▼─────────────────▼──────────┐  │
│  │           Processing Pipeline                   │  │
│  │                                                 │  │
│  │  ┌─────────────┐  ┌──────────────┐             │  │
│  │  │ DeepLabV3   │  │ Vision OCR   │             │  │
│  │  │ Semantic    │  │ VNRecognize  │             │  │
│  │  │ Segmentation│  │ TextRequest  │             │  │
│  │  │ (Core ML)   │  │ (Built-in)   │             │  │
│  │  └──────┬──────┘  └──────┬───────┘             │  │
│  │         │                │                      │  │
│  │  ┌──────▼────────────────▼───────────────────┐ │  │
│  │  │        Privacy Stripping Layer            │ │  │
│  │  │  - Strip CLLocation from all frames       │ │  │
│  │  │  - Strip device UDID / serial / model ID  │ │  │
│  │  │  - Zero EXIF GPS atoms in video export    │ │  │
│  │  │  - No CoreLocation import                 │ │  │
│  │  │  - No network calls during capture        │ │  │
│  │  │  - No analytics / telemetry SDKs          │ │  │
│  │  └──────┬────────────────────────────────────┘ │  │
│  └─────────┼──────────────────────────────────────┘  │
│            │                                          │
│  ┌─────────▼──────────────────────────────────────┐  │
│  │              Output Layer                       │  │
│  │                                                 │  │
│  │  ┌─────────────┐  ┌────────────┐  ┌──────────┐│  │
│  │  │ Metal       │  │ Raw Data   │  │ Video    ││  │
│  │  │ Renderer    │  │ Export     │  │ Export   ││  │
│  │  │ (real-time  │  │ (.ply,     │  │ (.mp4,   ││  │
│  │  │  display)   │  │  .bin+json)│  │  H.264)  ││  │
│  │  └─────────────┘  └────────────┘  └──────────┘│  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 3.2 Display Modes

The application provides three visualization modes, toggled via a segmented control:

#### Mode 1: Raw Depth (Failsafe Layer)
- Input: `ARFrame.sceneDepth.depthMap` (CVPixelBuffer, Float32, 256×192)
- Rendering: Metal shader maps depth values to a perceptually uniform color ramp (Viridis or Inferno). Near objects render warm (yellow/red), far objects render cool (purple/blue).
- Purpose: Visualize what the LiDAR sensor captures without processing. Analogous to raw electrode readings from a cortical implant.
- **Defense-in-depth role:** This mode is the failsafe. If the AI classifier crashes, the network drops, or the Neural Engine hangs, the raw depth rendering continues because it requires only the GPU shader — no ML inference. The guide dog is always visible as a moving depth silhouette even when the classifier cannot identify it as a dog. In a clinical prosthesis, this translates to: the patient always receives some spatial information from the electrode array, even if the scene interpretation AI fails. Building this failsafe into the prototype from day one demonstrates a BCI security principle: no single system failure should leave the patient in the dark.

#### Mode 2: Camera Fusion (Color)
- Input: `ARFrame.capturedImage` (YCbCr) + `ARFrame.sceneDepth.depthMap` + `ARFrame.camera.intrinsics`
- Rendering: Each 3D point in the depth map is projected into the RGB camera image plane using the camera intrinsics matrix. The corresponding RGB pixel value is assigned to the point. The result is a colored 3D point cloud.
- Projection: `pixel_uv = intrinsics * (rotation * point_3d + translation)`
- Purpose: Demonstrates multi-modal sensor fusion. Analogous to combining electrode data with external camera data in a vision prosthesis (the pattern used by PRIMA's NIR projection glasses).

#### Mode 3: AI Classification
- Input: `ARFrame.capturedImage` → DeepLabV3 (Core ML) → segmentation mask (21 classes)
- Rendering: Each 3D point is colored by its semantic class. Person = red, car = blue, chair = orange, etc. A legend overlay maps colors to class names.
- Model: DeepLabV3 with MobileNetV2 backbone. 8.6MB. Runs on Apple Neural Engine at 30fps+.
- Purpose: Demonstrates real-time object classification from spatial data. Analogous to the scene interpretation AI that future vision prostheses will require to generate meaningful stimulation patterns (e.g., highlighting a person approaching vs. a static wall).

#### Mode 4: Guide Dog Detection
- Input: `ARFrame.capturedImage` → fine-tuned single-class detector (Core ML) → bounding box + confidence
- Rendering: The guide dog is highlighted with a high-contrast outline (bright green) in the point cloud. All other objects render in muted grayscale depth. The dog's position is indicated with a directional cue (arrow, haptic pulse, or audio tone) when it exits the center of the visual field.
- Model: **Re-identification architecture** (not two-stage classification):
  1. **Generic dog detector:** YOLOv8n (12MB, 60fps+ on Neural Engine after INT8 quantization) detects all dogs in frame and crops bounding boxes
  2. **Individual dog re-ID:** ViT-Tiny embedding model generates a 256-dim feature vector for each detected dog region. Cosine similarity against enrolled embeddings of the patient's specific guide dog. Threshold: >0.85 = match. This is a re-identification problem ("is this MY dog?"), not a classification problem ("is this A dog?"). Re-ID is the correct framing because it distinguishes the patient's specific animal from any other dog.
  3. **Harness detection (depth-assisted):** The rigid horizontal handle of a guide dog harness is detectable in LiDAR depth maps as a raised planar feature above the dog's back. Depth + RGB combined harness detection is a novel discriminating feature that LiDAR uniquely enables over camera-only approaches. This provides a secondary confirmation signal independent of breed appearance.
- Enrollment: During device calibration, the patient (or handler) captures 50-100 images of the guide dog from multiple angles, distances, and lighting conditions. Embeddings are computed on-device and stored locally. **No gradient computation, no fine-tuning, no MLUpdateTask** — enrollment is embedding extraction only, avoiding the documented MLUpdateTask memory leak (~250MB non-releasing allocation per invocation). Embeddings are <50KB total.
- Enrollment security: The enrollment pipeline is a targeted attack surface (see Section 9). An adversary who supplies or manipulates enrollment images can enroll the wrong animal. Mitigations: enrollment requires physical proximity to the dog (handler must be present), enrollment images are checksummed, and re-enrollment requires explicit handler authorization.
- Output: Binary classification per frame: `{dog_present: bool, confidence: float, bounding_box: CGRect, direction: "left"|"center"|"right"|"behind"}`
- False positive target: <1 false positive per 10 minutes of continuous operation
- False negative target: <1 missed detection per 60 seconds when dog is in frame
- Purpose: Minimum viable perception for a vision prosthesis patient. If the system can reliably answer "where is my dog?" at prosthesis resolution, it demonstrates the clinical value of AI-assisted classification in the pipeline.

**Phosphene rendering in Guide Dog mode:**
When combined with the phosphene simulation (Section 8), the guide dog is rendered as the brightest cluster of phosphenes in the field, with surrounding scene dimmed to background intensity. This maximizes contrast at the limited resolution of a 378-pixel (PRIMA) or 60-electrode (Orion) prosthesis. At 60 phosphenes, the dog appears as approximately 8-12 bright points in the correct spatial position — enough for the patient to orient toward it.

#### OCR Overlay (all modes)
- Input: `ARFrame.capturedImage` → `VNRecognizeTextRequest`
- Rendering: Detected text strings rendered as floating labels anchored to their 3D position in the scene.
- Purpose: Demonstrates text recognition from spatial context. Relevant to prosthesis UX — a vision restoration system that can identify and announce text (signs, labels, screens) provides higher utility than raw phosphene patterns.

### 3.3 Data Capture Pipeline

#### Raw Data Export Format

Each capture session produces a directory:

```
session_YYYYMMDD_HHMMSS/
├── manifest.json           # Session metadata, frame count, duration, settings
├── depth/
│   ├── frame_000000.bin    # Float32 256×192 depth map (raw meters)
│   ├── frame_000001.bin
│   └── ...
├── confidence/
│   ├── frame_000000.bin    # UInt8 256×192 confidence map (0=low, 1=med, 2=high)
│   ├── histogram.json      # Per-frame confidence distribution {low: N, med: N, high: N}
│   └── ...
├── intrinsics/
│   ├── frame_000000.json   # 3×3 camera intrinsics matrix per frame
│   └── ...
├── transforms/
│   ├── frame_000000.json   # 4×4 camera transform matrix per frame (world space)
│   └── ...
├── imu/
│   ├── frame_000000.json   # Raw accelerometer xyz + gyroscope xyz at 100Hz
│   └── ...                 # (Not ARKit-fused — raw CMMotionManager for anomaly detection)
├── timing/
│   ├── frame_000000.json   # Per-frame: Metal GPU time (ms), Neural Engine inference time (ms)
│   └── ...                 # (Side-channel signal for T0030 testing)
├── environment/
│   ├── frame_000000.json   # Ambient light (lux), barometer (hPa), magnetic heading (°)
│   └── ...                 # (Correlate detection accuracy with conditions)
├── mesh/
│   ├── mesh_000.ply        # Scene reconstruction mesh (PLY format)
│   └── ...
├── segmentation/           # Only if AI mode was active
│   ├── frame_000000.bin    # UInt8 256×192 class labels (0-20)
│   ├── frame_000000_conf.bin  # Float16 256×192×21 full softmax distribution
│   └── ...                 # (Full softmax needed for anomaly detection, not just argmax)
├── guide_dog/              # Only if Guide Dog mode was active
│   ├── detections.json     # Per-frame: {dog_present, confidence, bbox, direction}
│   └── ...
├── ocr/
│   ├── detections.json     # All OCR detections with timestamps and 3D positions
│   └── ...
├── audio/                  # Optional (disabled by default — privacy: captures bystander speech)
│   ├── ambient.wav         # 16kHz mono, synchronized to frame timestamps
│   └── ...                 # (Research value: dog tags, handler commands, surface sounds)
└── render.mp4              # Video recording of the Metal renderer output
```

**Note on dark-furred guide dogs:** Some common guide dog breeds (black Labrador Retrievers, German Shepherds with dark coats) absorb near-infrared light, producing low-confidence LiDAR returns. The confidence histogram captures this effect per-frame, enabling analysis of breed-specific LiDAR reliability. When LiDAR confidence is low, the system should weight RGB-based detection more heavily — the confidence distribution drives this fallback logic.

**manifest.json schema:**
```json
{
  "version": "1.0",
  "app": "QIF-LiDAR",
  "capture_date": "2026-03-13T14:30:00Z",
  "duration_seconds": 120.5,
  "frame_count": 7230,
  "frame_rate": 60,
  "depth_resolution": [256, 192],
  "device_class": "iPhone",
  "lidar_available": true,
  "modes_active": ["raw_depth", "camera_fusion", "ai_classification"],
  "ai_model": "DeepLabV3_MobileNetV2_8.6MB",
  "ocr_enabled": true,
  "privacy": {
    "location_stripped": true,
    "device_id_stripped": true,
    "exif_gps_stripped": true,
    "network_calls_during_capture": 0,
    "telemetry_sdks": []
  }
}
```

#### Video Export

- Codec: H.264 (broad compatibility) or HEVC (smaller files)
- Resolution: Device screen resolution
- Source: Metal texture capture via `MTLTexture` → `CVPixelBuffer` → `AVAssetWriter`
- GPS atoms: Explicitly zeroed. No location metadata in MP4 container.
- Audio: Optional ambient microphone capture (disabled by default for privacy)

### 3.4 Privacy Architecture

Privacy is not a feature — it is a constraint applied at every layer of the pipeline. This mirrors the neural data sovereignty principle in QIF: the person generating the data controls what leaves the device.

| Layer | Privacy Measure | Implementation |
|-------|----------------|----------------|
| Sensor | No CoreLocation import | App does not request location permission |
| Processing | Strip ARFrame.rawFeaturePoints worldPosition origin | Normalize all coordinates to session-relative origin |
| Processing | No device identifiers in any data structure | Sanitize UIDevice properties before export |
| Export | Zero EXIF GPS in all image/video files | AVAssetWriterInput metadata filter |
| Export | No MP4 location atom (©xyz) | Custom AVAssetWriter metadata configuration |
| Export | Manifest records what was stripped | Auditable privacy log per session |
| Network | No network calls during capture or export | Verified via Network.framework monitor |
| Network | No analytics SDKs (Firebase, Amplitude, etc.) | Enforced via dependency audit |
| Storage | Data stays in app sandbox until explicit user share | No automatic cloud backup of session data |

### 3.5 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Language | Swift 5.9+ | Native iOS, ARKit integration |
| UI | SwiftUI | Modern declarative UI |
| AR | ARKit (ARWorldTrackingConfiguration) | LiDAR depth, scene reconstruction, camera intrinsics |
| Rendering | Metal + MetalKit | GPU-accelerated point cloud / mesh rendering |
| AI: Segmentation | Core ML + DeepLabV3 | 21-class semantic segmentation, 8.6MB, Neural Engine |
| AI: OCR | Vision (VNRecognizeTextRequest) | Built-in, 60+ languages, no model download |
| AI: Detection | Vision (VNDetectHumanBodyPoseRequest) | Optional: human pose overlay |
| Video capture | AVFoundation (AVAssetWriter) | GPU texture → H.264/HEVC MP4 |
| Data export | Foundation (FileManager, JSONEncoder) | PLY + binary + JSON to app sandbox |
| Privacy | No CoreLocation, no analytics SDKs | Enforced at dependency level |

### 3.6 Hardware Requirements

- iPhone 12 Pro or later (LiDAR sensor required)
- iPad Pro 2020 or later (alternative)
- iOS 17.0+ (ARKit 6 APIs, Scene Reconstruction improvements)
- Minimum 128GB storage recommended for extended capture sessions

---

## 4. Experimental Design

### 4.1 Controlled Environment Tests

| Test | Setup | Measure | TARA Relevance |
|------|-------|---------|----------------|
| **Baseline classification accuracy** | Scan a room with known objects | DeepLabV3 class accuracy vs. ground truth | Establishes baseline before adversarial testing |
| **Signal injection simulation** | Programmatically inject false depth values into the pipeline | Does the classifier misidentify objects? At what perturbation threshold? | QIF-T0001: Signal Injection |
| **Replay attack** | Record a session, replay the depth stream to the classifier | Can the system distinguish live vs. replayed data? | QIF-T0010: Replay Attack |
| **Data poisoning** | Fine-tune DeepLabV3 on mislabeled data, measure classification drift | How many poisoned samples shift classification? | QIF-T0025: Data Poisoning |
| **Side-channel analysis** | Monitor power consumption / thermal signature during different scene classifications | Can scene content be inferred from side-channel data? | QIF-T0030: Side-Channel Leakage |
| **Depth distortion** | Apply systematic bias to depth values (e.g., +20% at specific regions) | Does depth distortion cause misclassification or navigation hazard? | QIF-T0015: Stimulation Parameter Manipulation (analog) |
| **OCR tampering** | Place adversarial text patterns in the scene | Does OCR misread or hallucinate text? | Relevant to prosthesis UX safety |
| **Guide dog detection baseline** | Scan 10+ real guide dogs (various breeds, harness types) at distances 0.5-5m, indoors and outdoors | Detection rate, false positive rate, distance limits, lighting sensitivity | Establishes baseline for the primary clinical use-case |
| **Guide dog adversarial: occlusion** | Partially occlude the dog (behind furniture, person, doorway) at 25%, 50%, 75% | At what occlusion percentage does detection fail? | Critical: patient must locate dog even when partially hidden |
| **Guide dog adversarial: confusion** | Introduce a second dog (non-guide) into the scene | Does the individual classifier correctly identify only the enrolled guide dog? | False positive with wrong dog could misdirect a blind patient |
| **Guide dog at prosthesis resolution** | Run detection on phosphene-simulated output (60px, 378px) | Does detection survive downsampling to prosthesis resolution? | The real question: does this work at the resolution the patient actually perceives? |

### 4.2 Metrics

| Metric | Unit | Baseline Target |
|--------|------|----------------|
| Classification accuracy (mIoU) | % | >65% (DeepLabV3 + MobileNetV2 published: ~70.7% mIoU on PASCAL VOC 2012 val, Chen et al. 2017 Table 2, OS=16) |
| Frame processing latency | ms | <33ms (30fps minimum) |
| Depth map accuracy | mm | <10mm at 2m (empirically measured: ~4.9mm RMSE at close range, Luetzenburg et al. 2021; Teppati Losè et al. 2023, doi:10.3390/s23187832) |
| Privacy compliance | binary | 100% (zero location/device data in exports) |
| Injection detection rate | % | To be established (no baseline exists) |
| Replay detection rate | % | To be established |
| Side-channel information leakage | bits/frame | To be established |
| Guide dog detection rate | % | >99% at ≤3m, >95% at ≤5m (enrolled dog, clear line of sight) |
| Guide dog false positive rate | per hour | <6 (target: <1 per 10 minutes continuous) |
| Guide dog detection at 60px (Orion) | % | To be established (critical clinical metric) |
| Guide dog detection at 378px (PRIMA) | % | To be established |
| Enrolled vs. non-enrolled dog discrimination | % | >95% (reject non-enrolled dogs) |

### 4.3 Phases

**Phase 1: Prototype (current scope)**
- iOS app with four display modes (Raw Depth, Color Fusion, AI Classification, Guide Dog Detection) + OCR
- Guide dog enrollment pipeline (on-device fine-tuning, 50-100 images)
- Raw data capture and export
- Privacy stripping verified
- Duration: 2-4 weeks

**Phase 1.5: Phosphene Simulation**
- Add PRIMA (378px) and Orion (60px) phosphene rendering modes
- Guide dog detection at prosthesis resolution — the critical metric
- Side-by-side comparison: full resolution vs. what the patient perceives
- Duration: 1-2 weeks (parallel with Phase 1 testing)

**Phase 2: Adversarial Testing**
- Implement signal injection simulation framework
- Replay attack test harness
- Data poisoning experiments (general + guide dog enrollment poisoning)
- Guide dog-specific adversarial tests: occlusion, confusion (second dog), depth bias
- Anomaly detection baseline with pre-registered thresholds
- Publish results as addendum to QIF preprint
- Duration: 4-6 weeks

**Phase 3: Clinical Bridge (requires collaborator)**
- Partner with guide dog organizations (Guide Dogs for the Blind, Seeing Eye, Guide Dogs UK) for real-world testing scenarios
- Map guide dog detection output to phosphene stimulation patterns
- Simulate prosthesis patient experience of locating guide dog under normal and adversarial conditions
- Apply TARA techniques to the simulated prosthesis pipeline
- Identify which techniques transfer from the LiDAR prototype to the clinical context
- **Requires:** Clinical researcher with access to prosthesis specifications or simulation environment AND guide dog training organization for controlled testing with working guide dog teams
- Duration: 3-6 months

---

## 5. Bridge to Clinical Vision Restoration

### 5.1 The Translation Path

```
Phase 1 (Prototype)          Phase 2 (Adversarial)       Phase 3 (Clinical Bridge)
───────────────────          ─────────────────────       ────────────────────────
iPhone LiDAR                 + Injection tests            Electrode array model
    ↓                            ↓                            ↓
Depth buffer (256×192)       Perturbed depth buffer       Phosphene pattern (60-8192)
    ↓                            ↓                            ↓
DeepLabV3 segmentation       Adversarial classification   Stimulation-aware classification
    ↓                            ↓                            ↓
Colored point cloud          Detection/mitigation         Simulated prosthesis view
    ↓                            ↓                            ↓
Privacy-stripped export       TARA validation data         Clinical security requirements
```

### 5.2 What This Proves for TARA

Each phase validates a subset of TARA techniques in a controlled, non-clinical environment:

| Phase | TARA Techniques Testable | Evidence Produced |
|-------|-------------------------|-------------------|
| 1 | None directly (establishes baseline) | Functional pipeline, export format, privacy architecture |
| 2 | T0001, T0010, T0025, T0030, T0015 (analogs) | Adversarial perturbation thresholds, detection rates |
| 3 | T0001, T0003, T0005, T0008, T0010, T0015, T0025, T0030 | Clinical transferability assessment, prosthesis-specific mitigations |

### 5.3 What This Does NOT Prove

Per QIF epistemic integrity requirements, the following limitations are explicitly stated:

1. **This prototype does not interact with neural tissue.** All findings are computational, not clinical. No claims about biological efficacy or safety can be derived from this work.
2. **LiDAR is not an electrode array.** The architectural isomorphism is structural (pipeline shape), not functional (sensing mechanism). Findings transfer at the software layer, not the physics layer.
3. **DeepLabV3 is not a prosthesis decoder.** The segmentation model serves as a stand-in for the AI classification stage. Clinical prosthesis systems use proprietary, patient-calibrated decoders that differ in architecture and training.
4. **Adversarial results on this prototype establish feasibility, not clinical risk.** Demonstrating that signal injection causes misclassification in a LiDAR pipeline does not prove the same attack succeeds against a specific prosthesis. It proves the attack category is worth testing.
5. **Phase 3 requires IRB review** if any human subjects data (even simulated prosthesis output viewed by participants) is involved.

### 5.4 Clinical Collaboration Requirements

To advance from Phase 2 to Phase 3, the following collaborator capabilities are needed:

- Access to vision prosthesis stimulation pattern specifications (pixel-to-phosphene mapping)
- Prosthesis simulation environment (software that models what a patient perceives from a given stimulation pattern)
- IRB protocol for any human-subjects component
- Clinical validation of TARA technique transferability assessments
- Co-authorship on resulting publications

### 5.5 UWB Ground Truth for Guide Dog Position

The iPhone U1 chip supports Ultra-Wideband (UWB) ranging via the Nearby Interaction framework. An AirTag attached to the guide dog's harness would provide cm-precise distance and direction to the dog independent of the LiDAR/camera pipeline. This creates a ground truth signal for measuring classifier error: the classifier says the dog is at position X; the UWB says the dog is at position Y; the delta is the error. This also solves the enrolled-vs-non-enrolled discrimination test definitively — the enrolled dog is always the one with the UWB tag.

**Status:** Future enhancement. Not required for Phase 1. Named here because it costs nothing to implement and creates significant research value for Phase 2 validation.

Target institutions (based on QIF Research Registry):
- Stanford (Palanker Lab — PRIMA development)
- University of Michigan (Willsey Lab — Connexus/Paradromics clinical site)
- Second Sight / Cortigent (Orion clinical team)
- Baylor College of Medicine (visual prosthesis research)
- University of Pittsburgh (Bhatt Lab — BCI clinical trials)

---

## 6. Deliverables

| # | Deliverable | Format | Timeline |
|---|------------|--------|----------|
| 1 | iOS application (QIF-LiDAR) with guide dog detection | Xcode project, Swift | Phase 1 (2-4 weeks) |
| 2 | Guide dog enrollment + fine-tuning pipeline | Core ML on-device training | Phase 1 |
| 3 | Raw data export specification | JSON schema + PLY format spec | Phase 1 |
| 4 | Privacy audit report | Markdown, reproducible test procedure | Phase 1 |
| 5 | Phosphene simulation (PRIMA 378px + Orion 60px) | Metal shader, side-by-side render | Phase 1.5 (1-2 weeks) |
| 6 | Guide dog detection at prosthesis resolution — benchmark data | Structured JSON, accuracy curves | Phase 1.5 |
| 7 | Adversarial test framework (general + guide dog specific) | Swift test harness + Python analysis scripts | Phase 2 (4-6 weeks) |
| 8 | TARA validation data | Structured JSON per technique tested | Phase 2 |
| 9 | Technical paper | LaTeX, submitted to WOOT or IEEE S&P Workshop | Phase 2-3 |
| 10 | Prosthesis simulation bridge | Python/Swift, requires collaborator | Phase 3 (3-6 months) |
| 11 | Guide dog organization partnership protocol | IRB-ready study design | Phase 3 |

---

## 7. Related Work

No published work bridges LiDAR spatial sensing prototypes to BCI vision prosthesis security testing. The closest adjacent work falls into three categories:

### 7.1 BCI Security

- **Martinovic et al. (2012).** "On the Feasibility of Side-Channel Attacks with Brain-Computer Interfaces." USENIX Security. Demonstrated that consumer EEG headsets can leak private information (PINs, bank details) through subliminal visual stimuli in P300-based BCI applications. Established that BCI data streams contain exploitable side-channel information. *Relevance: establishes the threat class that T0030 (Side-Channel Leakage) operationalizes. Our prototype tests the spatial-data analog of this attack.*

- **Bonaci et al. (2015).** "App Stores for the Brain: Privacy & Security in Brain-Computer Interfaces." IEEE Ethics in Engineering, Science, and Technology. Proposed a security framework for BCI application ecosystems. *Relevance: their app-store threat model maps to the processing pipeline in our prototype — the classification stage is analogous to a BCI "app" operating on neural data.*

- **Denning, Matsuoka, & Kohno (2009).** "Neurosecurity: Security and Privacy for Neural Devices." Neurosurgical Focus. Foundational paper defining the neurosecurity research domain. *Relevance: the threat taxonomy they proposed is the precursor to TARA. Our prototype operationalizes their recommendations.*

### 7.2 Adversarial Attacks on LiDAR Systems

- **Cao et al. (2019).** "Adversarial Sensor Attack on LiDAR-based Perception in Autonomous Driving." ACM CCS. Demonstrated that spoofed LiDAR returns can cause autonomous vehicles to misdetect or fail to detect obstacles. *Relevance: directly analogous to T0001 (Signal Injection) in the visual prosthesis context. Their attack methodology (injecting synthetic returns) maps to our Phase 2 depth perturbation experiments. The key difference: in autonomous vehicles, misclassification causes a navigation error; in a vision prosthesis, it causes a perceptual error with potential clinical consequences.*

- **Sun et al. (2020).** "Towards Robust LiDAR-based Perception in Autonomous Driving." IEEE/CVF CVPR. Proposed defense mechanisms against LiDAR point cloud adversarial attacks. *Relevance: their detection methodology (temporal consistency, spatial coherence checks) informs our Phase 2 anomaly detection baseline.*

### 7.3 Vision Prosthesis Engineering

- **Palanker et al. (2025).** PRIMAvera pivotal trial results. NEJM. 378-pixel subretinal implant achieving +25.5 ETDRS letters at 12 months. *Relevance: provides the target device specification for Phase 3 phosphene simulation.*

- **Beauchamp et al. (2020).** "Dynamic Stimulation of Visual Cortex Produces Form Vision in Sighted and Blind Humans." Cell. Demonstrated that sequential electrical stimulation of visual cortex electrodes can produce coherent letter-shaped percepts. *Relevance: establishes that stimulation pattern integrity directly determines perception quality — making stimulation pattern manipulation (T0015) a clinically meaningful attack.*

**Novelty claim:** No published work applies adversarial perturbation testing to the signal processing pipeline of a vision prosthesis, either directly or via architectural proxy. This prototype is, to our knowledge, the first attempt to bridge spatial sensing security research with BCI vision restoration security.

---

## 8. Phosphene Simulation Output (Phase 1.5)

To bridge from the prototype to clinical relevance, the application will include a fourth display mode that simulates what a vision prosthesis patient would perceive from the classified scene.

### 8.1 Simulation Fidelity

The initial implementation uses a simplified majority-class hex-grid downsampling. This is sufficient for demonstrating the concept but does not model the psychophysics of actual prosthesis perception. For clinical credibility, Phase 3 should integrate `pulse2percept` (Beyeler et al., 2017, Bionic Vision Lab, University of Washington) — an open-source Python framework that models phosphene fading, axonal spread, stimulation thresholds, and temporal nonlinearities calibrated to Argus II behavioral data. The eLife 2024 biologically-plausible phosphene simulator (Granley et al.) provides an updated differentiable model suitable for optimization. The gap between our simplified renderer and these validated models should be explicitly characterized.

### 8.2 Implementation

- Take the DeepLabV3 segmentation mask (21 classes, 256×192)
- Downsample to match the target prosthesis resolution:
  - PRIMA mode: 378-point hexagonal grid (matching the PRIMA pixel layout)
  - Orion mode: 60-point cortical grid (matching the Orion electrode array)
- Each grid point receives the majority class from its receptive field
- Render as a phosphene simulation: bright spots on dark background, intensity proportional to classification confidence, color by object class
- Display side-by-side with the full-resolution AI classification view

### 8.2 What This Demonstrates

A clinical researcher viewing this mode sees:
1. What the LiDAR captures (full resolution)
2. What the AI classifies (labeled scene)
3. What the patient would perceive (phosphene grid)
4. What an adversarial perturbation changes in the patient's perception

This is the single most compelling visual for clinical collaboration. It translates security metrics into perceptual consequences without making clinical claims — it shows "if this classification error occurs, this is how the phosphene pattern changes."

### 8.3 Threat-to-Patient-Outcome Mapping

For each TARA technique tested in Phase 2, the phosphene simulation enables a perceptual consequence narrative:

| TARA Technique | Classification Effect | Potential Perceptual Consequence |
|---------------|----------------------|----------------------------------|
| T0001: Signal Injection | Person misclassified as background | Approaching human becomes invisible in phosphene field |
| T0010: Replay Attack | Scene frozen to prior state | Patient perceives a static environment while reality changes |
| T0015: Parameter Manipulation | Depth values systematically biased | Objects appear closer/farther than reality — navigation hazard |
| T0025: Data Poisoning | Systematic class confusion (e.g., car→bicycle) | Vehicles consistently misidentified — collision risk |
| T0001 on guide dog | Dog misclassified as background | **Patient loses awareness of their guide dog's position.** The one reliable anchor in their environment disappears from the phosphene field. Patient is effectively alone. |
| T0025 on guide dog | Enrollment data poisoned — wrong animal enrolled | Non-guide dog (stranger's pet, stray) highlighted as the patient's guide dog. Patient follows wrong animal. |
| T0015 on guide dog | Depth bias on dog's position | Guide dog appears closer or farther than reality. Patient reaches for harness and misses, or trips over the dog. |

*Note: These are potential perceptual consequences for threat modeling purposes, not clinical predictions. Actual patient perception depends on prosthesis-specific factors including electrode-to-cortex mapping, stimulation thresholds, and individual neural adaptation. The guide dog scenarios are highlighted because guide dog loss-of-detection has immediate, concrete safety consequences that do not require clinical interpretation — the patient cannot navigate safely without knowing where their dog is.*

---

## 9. Anomaly Detection Baseline

Phase 2 adversarial experiments require a detection mechanism, not just attack demonstration. The following baseline detector is implementable within the prototype:

### 9.1 Detection Approach: Multi-Signal Consistency

```
For each frame:
  1. Compute classification confidence distribution (DeepLabV3 softmax)
  2. Compute frame-to-frame depth consistency (L2 norm of depth delta)
  3. Compute scene graph consistency (object class persistence across frames)

Alert conditions:
  - Classification confidence drops below threshold T_conf for >N consecutive frames
  - Depth delta exceeds threshold T_depth without corresponding IMU acceleration
  - Object class flips (person→background→person) faster than physical plausibility
```

### 9.2 Pre-Registered Thresholds

Before running Phase 2 experiments, the following thresholds will be established from Phase 1 baseline data (minimum 10 sessions, 5 different environments):

| Parameter | Definition | Establishment Method |
|-----------|-----------|---------------------|
| T_conf | Minimum classification confidence for valid frame | Mean - 2σ of baseline confidence distribution |
| T_depth | Maximum frame-to-frame depth change (m) | 99th percentile of baseline depth deltas |
| N_consecutive | Minimum frames for confidence alert | 5 frames (83ms at 60fps) |
| T_class_flip | Maximum class transitions per second per pixel | 99th percentile of baseline class transition rate |

### 9.3 Statistical Methodology for Adversarial Experiments

Each Phase 2 experiment follows this protocol:

1. **Hypothesis:** Pre-registered before data collection. Example: "Gaussian depth noise at σ ≥ 0.3m causes mIoU degradation >10% relative to baseline."
2. **Sample size:** Minimum 30 sessions per condition (power analysis: α=0.05, β=0.80, expected effect size d=0.8 based on Cao et al. 2019 AV results).
3. **Outcome variable:** mIoU on held-out clean test frames (classification accuracy) AND detector alert rate (detection sensitivity).
4. **Statistical test:** Paired t-test (baseline vs. perturbed) for mIoU; ROC-AUC for detector performance.
5. **Significance threshold:** p < 0.01 (Bonferroni-corrected for multiple technique comparisons).
6. **Data poisoning specifics:** Label-flipping attack at 1%, 5%, 10%, 20% poisoning ratios on a fine-tuned DeepLabV3. Outcome: mIoU on clean validation set. Per-class accuracy drift reported.

---

## 10. IRB and Ethical Considerations

**Phase 1:** Purely computational. No human subjects. Scenes are captured by the researcher in controlled environments (no bystanders). IRB exemption documented.

**Phase 2:** Adversarial experiments are computational perturbations to stored data. No human subjects. If any person appears in captured LiDAR data, their identity is not recoverable from depth maps alone (LiDAR does not capture face-identifiable features at 256×192 resolution). IRB exemption documented.

**Phase 3:** Requires full IRB approval before any work begins. Any study involving human perception of simulated prosthesis output — including viewing phosphene simulations and reporting on perceptual quality — constitutes human subjects research. Protocol must address: informed consent for perception studies, data handling for any subjective reports, and risk assessment for viewing adversarially perturbed prosthesis simulations (potential for discomfort or disorientation, even in simulation).

---

## 11. References

1. Qi, K.L. (2026). Securing Neural Interfaces: Architecture, Threat Taxonomy, and Neural Impact Scoring for Brain-Computer Interfaces. Zenodo. https://doi.org/10.5281/zenodo.18640105
2. Apple Inc. (2025). ARKit Documentation: Scene Depth. https://developer.apple.com/documentation/arkit/ardepthdata
3. Apple Inc. (2025). Core ML Models: DeepLabV3. https://developer.apple.com/machine-learning/models/
4. Chen, L.-C., Papandreou, G., Schroff, F., & Adam, H. (2017). Rethinking Atrous Convolution for Semantic Image Segmentation. arXiv:1706.05587.
5. Palanker, D., et al. (2025). PRIMAvera: Pivotal Trial Results for Subretinal Photovoltaic Prosthesis. NEJM. DOI: 10.1056/NEJMoa2501396.
6. Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security and Privacy for Neural Devices. Neurosurgical Focus, 27(1), E7.
7. Ienca, M., & Haselager, P. (2016). Hacking the Brain: Brain-Computer Interfacing Technology and the Ethics of Neurosecurity. Ethics and Information Technology, 18(2), 117-129.
8. Martinovic, I., Davies, D., Frank, M., Perito, D., Ros, T., & Song, D. (2012). On the Feasibility of Side-Channel Attacks with Brain-Computer Interfaces. USENIX Security Symposium.
9. Bonaci, T., Calo, R., & Chizeck, H.J. (2015). App Stores for the Brain: Privacy & Security in Brain-Computer Interfaces. IEEE Ethics in Engineering, Science, and Technology.
10. Cao, Y., Xiao, C., Cyr, B., Zhou, Y., Park, W., Rampazzi, S., Chen, Q.A., Fu, K., & Mao, Z.M. (2019). Adversarial Sensor Attack on LiDAR-based Perception in Autonomous Driving. ACM CCS 2019.
11. Sun, J., Cao, Y., Chen, Q.A., & Mao, Z.M. (2020). Towards Robust LiDAR-based Perception in Autonomous Driving. IEEE/CVF CVPR.
12. Beauchamp, M.S., Oswalt, D., Sun, P., Foster, B.L., Magnotti, J.F., Niketeghad, S., Pouratian, N., Bosking, W.H., & Yoshor, D. (2020). Dynamic Stimulation of Visual Cortex Produces Form Vision in Sighted and Blind Humans. Cell, 181(4), 774-783.
13. Luetzenburg, G., Kroon, A., & Bjørk, A.A. (2021). Evaluation of the Apple iPhone 12 Pro LiDAR for an application in geosciences. Scientific Reports, 11, 22221.
14. Teppati Losè, L., Spreafico, A., Chiabrando, F., & Giulio Tonolo, F. (2023). Apple LiDAR Sensor for 3D Surveying: Tests and Results in the Cultural Heritage Domain. Sensors, 23(18), 7832. doi:10.3390/s23187832.
15. Beyeler, M., Boynton, G.M., Fine, I., & Rokem, A. (2017). pulse2percept: A Python-based simulation framework for bionic vision. Proceedings of the 16th Python in Science Conference (SciPy), 81-88.
16. Granley, J., Beyeler, M., et al. (2024). Towards biologically plausible phosphene simulation for the differentiable optimization of visual cortical prostheses. eLife, 12:RP85812.
17. Finlayson, S.G., Bowers, J.D., Ito, J., Zittrain, J.L., Beam, A.L., & Kohane, I.S. (2019). Adversarial attacks on medical machine learning. Science, 363(6433), 1287-1289.
18. Eykholt, K., et al. (2018). Robust Physical-World Attacks on Deep Learning Visual Classification. IEEE/CVF CVPR.

---

## 12. Field Test Findings (2026-03-14)

First device deployment of QIF-LiDAR on iPhone 16 Pro Max. The following findings emerged from hands-on testing. See also: [Derivation Log Entry 91](../../osi-of-mind/QIF-DERIVATION-LOG.md#entry-91-lidar-sensor-limitations).

### 12.1 iPhone LiDAR Sensor Limitations

**Resolution is severely limiting.** The dToF sensor produces a 256x192 depth map (49,152 points). Rendered on a 1290x2796 display, each depth pixel maps to approximately 7x15 screen pixels. The result appears filtered or blurry compared to the RGB camera (4032x3024). Visible grid artifacts from the VCSEL dot array are present even after Apple's interpolation.

**Fur scatters infrared light.** A white dog was not reliably detected by the LiDAR depth sensor. Fur is not a hard reflective surface — IR photons penetrate into the fur, scatter at multiple depths, and return noisy or absent signal. This is consistent with findings in autonomous vehicle LiDAR research, where animals are among the hardest objects to detect. This directly impacts the HarnessDetector module (Section 4.4), which relies on LiDAR depth protrusion to identify harness handles.

**Material-dependent failures.** In addition to fur, dToF LiDAR is known to fail on transparent surfaces (glass), highly absorptive surfaces (dark matte objects), and specular surfaces (mirrors, polished metal). These failure modes are inherent to indirect time-of-flight sensing and are not addressable through software.

### 12.2 Architectural Implication

The guide dog detection pipeline's three-signal design (Section 4) is validated by these findings: YOLO dog detection (Signal 1, RGB) and re-ID embedding matching (Signal 2, RGB) do not depend on LiDAR and are unaffected by fur scattering. Only Signal 3 (harness depth detection) is degraded. The architecture correctly treats LiDAR as a supplementary signal, not the primary classifier.

### 12.3 Platform Pivot: Multi-Sensor and Head-Mounted Devices

**iPhone LiDAR is not feasible as the primary sensor for vision prosthesis prototyping.** The resolution, grid artifacts, and material-dependent failures make it unsuitable for the spatial awareness fidelity required.

**Next platform: Meta Quest (Oculus) headset.** Advantages over iPhone LiDAR:
- Stereo RGB cameras with passthrough — higher resolution spatial awareness via stereo depth estimation
- Head-mounted form factor matches the actual use case for vision prosthesis (worn device, not handheld)
- Built-in hand/body tracking
- Spatial computing SDK with scene understanding
- Larger developer ecosystem for XR accessibility applications

**iPhone LiDAR remains useful for:** quick depth measurements (tap-to-measure), general 3D scanning at room scale, proof-of-concept demos, and raw depth data export for offline ML training.

### 12.4 Sensor Hierarchy Revision: Camera-First, Not Depth-First

Field testing revealed a fundamental architectural insight: **the sensor pipeline for prosthetic vision should be camera-first, not depth-first.** This inverts the original assumption in Section 2 that LiDAR depth sensing would be the primary input.

**Reasoning:**

Current prostheses produce 60–378 phosphenes. Even next-generation devices (1,000+ channels) will not approach camera resolution. The output is fundamentally low-resolution. Therefore, the bottleneck is not sensor resolution — it is ML classification. The question is not "how many depth pixels can we capture" but "can we correctly label what matters in the scene."

The pipeline is reductive, not preservative:

```
High-res RGB camera → ML classification → simplified scene map → low-res phosphene output
```

The camera captures everything. ML decides what matters. The output to the brain is labeled points with positions: "dog at 2m center, wall at 4m left, car at 15m right." Full spatial detail is never transmitted to the patient — it is compressed into semantically meaningful objects.

**Three range zones require different sensors:**

| Range | Need | Best Sensor |
|-------|------|-------------|
| Long (5–50m) | "What's ahead on the sidewalk" | RGB camera + ML object detection |
| Medium (1–5m) | "Where are walls, furniture, people" | Stereo depth estimation |
| Close (<1m) | "Where is the harness handle" | LiDAR/ToF or stereo + ML segmentation |

**Revised sensor hierarchy:**

1. **Primary:** Wide-angle RGB camera (ML object detection at all ranges)
2. **Secondary:** Stereo depth estimation (distance without dedicated depth sensor)
3. **Supplementary:** IMU (orientation, motion context)
4. **Optional:** LiDAR/ToF (close-range precision, not required)

**Security implication:** If the camera is primary, adversarial attacks on the visual classifier (adversarial patches, perturbation attacks) become the highest-priority threat vector, not depth sensor spoofing. The ML model IS the prosthesis — a compromised model is a compromised sense. This makes model integrity a patient safety issue, not just a cybersecurity concern. Multi-sensor fusion provides defense-in-depth: an attacker who fools the RGB classifier still faces depth data that contradicts the false classification.

See also: [Derivation Log Entry 92](../../osi-of-mind/QIF-DERIVATION-LOG.md#entry-92-sensor-hierarchy).

### 12.5 Phosphene Color Ramp Design

During testing, the depth visualization was iterated through several color ramps. A phosphene-informed design was developed based on reported characteristics of electrically-induced phosphenes in the literature:

- White/achromatic phosphenes are the most common and lowest-threshold (Brindley & Lewin 1968, Schmidt et al. 1996)
- Yellow is second most commonly reported, particularly at higher stimulation currents
- Blue is occasionally reported in cortical stimulation (Penfield & Rasmussen 1950)
- Color is not reliably controllable in current prostheses (Dobelle 2000)
- Brightness (current amplitude) is the primary reliable information channel

The prototype uses a blue-teal ramp (bright teal near → blue mid → dim blue-grey far → dark) which stays within the reported phosphene color range while using brightness as the primary depth cue. This is framed as "informed by phosphene research," not "what prosthetic vision looks like" — individual variation is substantial and no visualization can be authoritative.

---

## 13. AI Disclosure

This technical specification was drafted with AI assistance (Claude Opus 4.6). Field test findings (Section 12) documented with AI assistance during live device testing. The architectural design, hypothesis framing, TARA mappings, and experimental design reflect the author's research direction. All technical claims about Apple frameworks, model specifications, and device capabilities are verified against official documentation. The connection between LiDAR spatial sensing and vision prosthesis security is the author's original research contribution.

---

*This document is part of the QIF research initiative. QIF is a proposed framework that has not been independently peer-reviewed or adopted by any standards body. All claims are classified per the QIF evidence classification system.*
