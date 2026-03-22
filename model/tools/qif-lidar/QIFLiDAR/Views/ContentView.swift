import SwiftUI
import ReplayKit
import Photos

struct ContentView: View {
    @StateObject private var sessionManager = ARSessionManager()
    @StateObject private var guideDogDetector = GuideDogDetector()
    @State private var displayMode: DisplayMode = .rawDepth
    @State private var isRecording = false
    @State private var ocrEnabled = false
    @State private var segmentationMask: [UInt8]? = nil
    @State private var tapDepthInfo: TapDepthInfo? = nil
    @State private var recordingError: String? = nil

    private let segmentationService = SegmentationService()
    private let exporter = SessionExporter()
    private let screenRecorder = RPScreenRecorder.shared()

    var body: some View {
        ZStack {
            // LiDAR renderer (full screen)
            DepthRendererView(
                depthMap: sessionManager.depthMap,
                confidenceMap: sessionManager.confidenceMap,
                cameraFrame: sessionManager.cameraFrame,
                displayMode: displayMode,
                segmentationMask: segmentationMask,
                guideDogBBox: guideDogDetector.isDetected ? guideDogDetector.boundingBox : nil
            )
            .ignoresSafeArea()
            .onTapGesture { location in
                tapDepthInfo = queryDepth(at: location)
            }

            // Tap depth overlay
            if let info = tapDepthInfo {
                DepthTapOverlay(info: info) {
                    tapDepthInfo = nil
                }
            }

            // Controls overlay
            VStack {
                // Top bar — mode selector
                HStack {
                    Picker("Mode", selection: $displayMode) {
                        ForEach(DisplayMode.allCases) { mode in
                            Text(mode.rawValue).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)
                }
                .padding(.top, 8)
                .background(.ultraThinMaterial)

                Spacer()

                // Guide dog direction indicator (when in guide dog mode)
                if displayMode == .guideDog && guideDogDetector.isDetected {
                    GuideDogDirectionView(direction: guideDogDetector.direction)
                        .padding(.bottom, 20)
                }

                // Bottom bar
                VStack(spacing: 8) {
                    // Stats bar
                    HStack(spacing: 16) {
                        StatBadge(label: "FPS", value: "60")
                        StatBadge(label: "Frames", value: "\(sessionManager.frameCount)")
                        StatBadge(label: "Conf", value: confidenceSummary)

                        if displayMode == .guideDog {
                            StatBadge(
                                label: "Dog",
                                value: guideDogDetector.isDetected ?
                                    String(format: "%.0f%%", guideDogDetector.confidence * 100) : "—",
                                highlight: guideDogDetector.isDetected
                            )
                        }

                        if displayMode == .aiClassification {
                            StatBadge(label: "AI", value: segmentationMask != nil ? "ON" : "—")
                        }
                    }
                    .font(.caption.monospaced())

                    // Control buttons
                    HStack(spacing: 24) {
                        // OCR toggle
                        Button {
                            ocrEnabled.toggle()
                        } label: {
                            Label("OCR", systemImage: "text.viewfinder")
                                .font(.caption)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(ocrEnabled ? Color.blue.opacity(0.3) : Color.gray.opacity(0.3))
                                .clipShape(Capsule())
                        }

                        // Record button
                        Button {
                            if isRecording {
                                stopRecording()
                            } else {
                                startRecording()
                            }
                        } label: {
                            ZStack {
                                Circle()
                                    .fill(isRecording ? Color.red : Color.white.opacity(0.3))
                                    .frame(width: 64, height: 64)
                                Circle()
                                    .stroke(Color.white, lineWidth: 3)
                                    .frame(width: 70, height: 70)
                                if isRecording {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color.white)
                                        .frame(width: 24, height: 24)
                                } else {
                                    Circle()
                                        .fill(Color.red)
                                        .frame(width: 54, height: 54)
                                }
                            }
                        }

                        // Export
                        Button {
                            exportSession()
                        } label: {
                            Label("Export", systemImage: "square.and.arrow.up")
                                .font(.caption)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.gray.opacity(0.3))
                                .clipShape(Capsule())
                        }
                    }
                }
                .padding()
                .background(.ultraThinMaterial)
            }

            // Privacy indicator — always visible
            VStack {
                HStack {
                    Spacer()
                    PrivacyBadge()
                        .padding(.trailing, 8)
                        .padding(.top, 60)
                }
                Spacer()
            }
        }
        .onAppear {
            sessionManager.start()
        }
        .onDisappear {
            sessionManager.stop()
        }
        .onChange(of: sessionManager.cameraFrame) { _, frame in
            processFrame(frame)
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Frame Processing

    private func processFrame(_ frame: CVPixelBuffer?) {
        guard let frame = frame else { return }

        // Run AI classification if in AI mode
        if displayMode == .aiClassification {
            segmentationService.segment(frame) { mask in
                // Convert MLMultiArray to [UInt8] for renderer
                if let mask = mask {
                    var result = [UInt8](repeating: 0, count: mask.count)
                    for i in 0..<mask.count {
                        result[i] = UInt8(mask[i].intValue)
                    }
                    DispatchQueue.main.async {
                        self.segmentationMask = result
                    }
                }
            }
        }

        // Run guide dog detection if in guide dog mode (3-signal: YOLO + re-ID + harness)
        if displayMode == .guideDog {
            guideDogDetector.detect(
                frame,
                depthMap: sessionManager.depthMap,
                confidenceMap: sessionManager.confidenceMap
            )
        }

        // Export frame data if recording
        if isRecording {
            if let depth = sessionManager.depthMap {
                exporter.exportDepthFrame(depth)
            }
            if let conf = sessionManager.confidenceMap {
                exporter.exportConfidenceFrame(conf, histogram: sessionManager.confidenceHistogram)
            }
            if let intrinsics = sessionManager.cameraIntrinsics {
                exporter.exportIntrinsics(intrinsics)
            }
            if let transform = sessionManager.cameraTransform {
                exporter.exportTransform(transform)
            }
            if let imu = sessionManager.latestIMU {
                exporter.exportIMU(imu)
            }
            if let env = sessionManager.latestEnvironment {
                exporter.exportEnvironment(env)
            }
            if displayMode == .guideDog {
                exporter.exportGuideDogDetection(guideDogDetector.currentDetection())
            }
            exporter.advanceFrame()
        }
    }

    // MARK: - Screen Recording

    private func startRecording() {
        guard screenRecorder.isAvailable else {
            recordingError = "Screen recording not available"
            return
        }

        screenRecorder.startRecording { error in
            DispatchQueue.main.async {
                if let error = error {
                    recordingError = error.localizedDescription
                } else {
                    isRecording = true
                }
            }
        }
    }

    private func stopRecording() {
        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("QIFLiDAR-\(Int(Date().timeIntervalSince1970)).mp4")

        screenRecorder.stopRecording(withOutput: tempURL) { error in
            DispatchQueue.main.async {
                isRecording = false
                if let error = error {
                    recordingError = error.localizedDescription
                    return
                }
                // Auto-save to Photos
                PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                    guard status == .authorized else {
                        DispatchQueue.main.async {
                            recordingError = "Photos access denied"
                        }
                        return
                    }
                    PHPhotoLibrary.shared().performChanges {
                        PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: tempURL)
                    } completionHandler: { success, error in
                        // Clean up temp file
                        try? FileManager.default.removeItem(at: tempURL)
                        if !success {
                            DispatchQueue.main.async {
                                recordingError = error?.localizedDescription ?? "Save failed"
                            }
                        }
                    }
                }
            }
        }
    }

    private func exportSession() {
        let manifest = PrivacyGuard.generateManifest(
            startTime: Date().addingTimeInterval(-Double(sessionManager.frameCount) / 60.0),
            endTime: Date(),
            frameCount: sessionManager.frameCount,
            frameRate: 60,
            modesActive: [displayMode],
            ocrEnabled: ocrEnabled
        )
        exporter.exportManifest(manifest)
    }

    // MARK: - Tap to Measure Depth

    private func queryDepth(at screenPoint: CGPoint) -> TapDepthInfo? {
        guard let depthMap = sessionManager.depthMap else { return nil }

        CVPixelBufferLockBaseAddress(depthMap, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(depthMap, .readOnly) }

        let depthWidth = CVPixelBufferGetWidth(depthMap)
        let depthHeight = CVPixelBufferGetHeight(depthMap)
        let bytesPerRow = CVPixelBufferGetBytesPerRow(depthMap)

        guard let baseAddress = CVPixelBufferGetBaseAddress(depthMap) else { return nil }

        // Map screen tap to depth buffer coordinates
        let screenSize = UIScreen.main.bounds.size
        let normX = screenPoint.x / screenSize.width
        let normY = screenPoint.y / screenSize.height
        let depthX = Int(normX * CGFloat(depthWidth))
        let depthY = Int(normY * CGFloat(depthHeight))

        guard depthX >= 0, depthX < depthWidth, depthY >= 0, depthY < depthHeight else { return nil }

        let ptr = baseAddress.assumingMemoryBound(to: Float32.self)
        let floatsPerRow = bytesPerRow / MemoryLayout<Float32>.size
        let depth = ptr[depthY * floatsPerRow + depthX]

        guard depth > 0, depth < 10.0 else { return nil }

        // Get confidence at this point
        var confidence: String = "—"
        if let confMap = sessionManager.confidenceMap {
            CVPixelBufferLockBaseAddress(confMap, .readOnly)
            defer { CVPixelBufferUnlockBaseAddress(confMap, .readOnly) }
            if let confBase = CVPixelBufferGetBaseAddress(confMap) {
                let confPtr = confBase.assumingMemoryBound(to: UInt8.self)
                let confBytesPerRow = CVPixelBufferGetBytesPerRow(confMap)
                let confVal = confPtr[depthY * confBytesPerRow + depthX]
                confidence = confVal == 0 ? "Low" : confVal == 1 ? "Medium" : "High"
            }
        }

        // Get AI class at this point if segmentation is active
        var objectClass: String? = nil
        if let mask = segmentationMask, displayMode == .aiClassification {
            let maskSize = 513  // DeepLabV3 output size
            let maskX = Int(normX * CGFloat(maskSize))
            let maskY = Int(normY * CGFloat(maskSize))
            let idx = maskY * maskSize + maskX
            if idx >= 0, idx < mask.count {
                let classID = mask[idx]
                objectClass = SegmentationClass(rawValue: Int(classID))?.label
            }
        }

        return TapDepthInfo(
            screenPoint: screenPoint,
            depthMeters: depth,
            depthFeet: depth * 3.28084,
            confidence: confidence,
            objectClass: objectClass
        )
    }

    private var confidenceSummary: String {
        let h = sessionManager.confidenceHistogram
        let total = max(h.low + h.medium + h.high, 1)
        let highPct = (h.high * 100) / total
        return "\(highPct)%"
    }
}

// MARK: - Tap Depth Data

struct TapDepthInfo {
    let screenPoint: CGPoint
    let depthMeters: Float
    let depthFeet: Float
    let confidence: String
    let objectClass: String?
}

// MARK: - Tap Depth Overlay

struct DepthTapOverlay: View {
    let info: TapDepthInfo
    let onDismiss: () -> Void

    var body: some View {
        VStack {
            Spacer()

            // Measurement card
            VStack(spacing: 8) {
                // Distance (large)
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(String(format: "%.2f", info.depthMeters))
                        .font(.system(size: 42, weight: .bold, design: .monospaced))
                        .foregroundStyle(.white)
                    Text("m")
                        .font(.title3.bold())
                        .foregroundStyle(.white.opacity(0.6))

                    Spacer()

                    // Feet
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.1f ft", info.depthFeet))
                            .font(.title3.monospaced().bold())
                            .foregroundStyle(.white.opacity(0.8))
                        Text(String(format: "%.0f in", info.depthFeet * 12))
                            .font(.caption.monospaced())
                            .foregroundStyle(.white.opacity(0.5))
                    }
                }

                // Details row
                HStack(spacing: 16) {
                    Label(info.confidence, systemImage: "signal.bars")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))

                    if let obj = info.objectClass {
                        Label(obj, systemImage: "cube.fill")
                            .font(.caption.bold())
                            .foregroundStyle(.cyan)
                    }

                    Spacer()

                    Button("Dismiss") {
                        onDismiss()
                    }
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.5))
                }
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(.white.opacity(0.1), lineWidth: 1)
                    )
            )
            .padding(.horizontal, 16)
            .padding(.bottom, 120)
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
        .animation(.spring(response: 0.3), value: info.depthMeters)
    }
}

// MARK: - Guide Dog Direction Indicator

struct GuideDogDirectionView: View {
    let direction: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: arrowSystemName)
                .font(.title)
                .foregroundStyle(.green)
                .shadow(color: .green.opacity(0.6), radius: 8)

            VStack(alignment: .leading, spacing: 2) {
                Text("GUIDE DOG")
                    .font(.caption2.bold())
                    .foregroundStyle(.green.opacity(0.8))
                Text(direction.uppercased())
                    .font(.title3.bold())
                    .foregroundStyle(.green)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Color.green.opacity(0.15))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var arrowSystemName: String {
        switch direction {
        case "left": return "arrow.left.circle.fill"
        case "right": return "arrow.right.circle.fill"
        case "center": return "checkmark.circle.fill"
        default: return "questionmark.circle"
        }
    }
}

// MARK: - Subviews

struct StatBadge: View {
    let label: String
    let value: String
    var highlight: Bool = false

    var body: some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.caption.monospaced().bold())
                .foregroundStyle(highlight ? .green : .primary)
        }
    }
}

struct PrivacyBadge: View {
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "lock.shield.fill")
                .font(.caption2)
            Text("NO LOCATION")
                .font(.system(size: 9, weight: .bold, design: .monospaced))
        }
        .foregroundStyle(.green)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.green.opacity(0.15))
        .clipShape(Capsule())
    }
}
