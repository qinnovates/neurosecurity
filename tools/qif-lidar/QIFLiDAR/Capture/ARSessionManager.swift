import ARKit
import Combine
import CoreMotion

/// Manages the ARKit session and raw sensor data capture.
/// This is the core data pipeline — LiDAR depth, RGB camera, mesh, IMU.
@MainActor
final class ARSessionManager: NSObject, ObservableObject {

    let session = ARSession()

    @Published var isRunning = false
    @Published var depthMap: CVPixelBuffer?
    @Published var confidenceMap: CVPixelBuffer?
    @Published var cameraFrame: CVPixelBuffer?
    @Published var cameraIntrinsics: simd_float3x3?
    @Published var cameraTransform: simd_float4x4?
    @Published var meshAnchors: [ARMeshAnchor] = []
    @Published var confidenceHistogram = ConfidenceHistogram(low: 0, medium: 0, high: 0)
    @Published var currentFrameTiming = FrameTiming(timestamp: 0, metalGpuMs: 0, neuralEngineMs: 0, totalFrameMs: 0)

    // Raw IMU (not ARKit-fused) for anomaly detection
    private let motionManager = CMMotionManager()
    @Published var latestIMU: FrameIMU?

    // Environment sensors
    private let altimeter = CMAltimeter()
    @Published var latestEnvironment: FrameEnvironment?

    // Frame counter
    @Published var frameCount: Int = 0
    private var sessionStartTime: Date?

    override init() {
        super.init()
        session.delegate = self
    }

    func start() {
        let config = ARWorldTrackingConfiguration()

        // LiDAR depth
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
            config.frameSemantics.insert(.sceneDepth)
        }

        // Scene reconstruction (mesh)
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            config.sceneReconstruction = .mesh
        }

        // Person segmentation (free, useful for guide dog context)
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentation) {
            config.frameSemantics.insert(.personSegmentation)
        }

        // NO location — we never request it
        config.worldAlignment = .gravity  // not .gravityAndHeading (uses compass = location)

        session.run(config)
        isRunning = true
        sessionStartTime = Date()
        startIMU()
        startEnvironmentSensors()
    }

    func stop() {
        session.pause()
        isRunning = false
        motionManager.stopAccelerometerUpdates()
        motionManager.stopGyroUpdates()
        altimeter.stopRelativeAltitudeUpdates()
    }

    // MARK: - Raw IMU (100Hz, not ARKit-fused)

    private func startIMU() {
        guard motionManager.isAccelerometerAvailable,
              motionManager.isGyroAvailable else { return }

        motionManager.accelerometerUpdateInterval = 0.01  // 100Hz
        motionManager.gyroUpdateInterval = 0.01

        motionManager.startAccelerometerUpdates(to: .main) { [weak self] data, _ in
            guard let data = data, let gyro = self?.motionManager.gyroData else { return }
            self?.latestIMU = FrameIMU(
                timestamp: data.timestamp,
                accelerometerX: data.acceleration.x,
                accelerometerY: data.acceleration.y,
                accelerometerZ: data.acceleration.z,
                gyroscopeX: gyro.rotationRate.x,
                gyroscopeY: gyro.rotationRate.y,
                gyroscopeZ: gyro.rotationRate.z
            )
        }

        motionManager.startGyroUpdates()
    }

    // MARK: - Environment Sensors

    private func startEnvironmentSensors() {
        if CMAltimeter.isRelativeAltitudeAvailable() {
            altimeter.startRelativeAltitudeUpdates(to: .main) { [weak self] data, _ in
                guard let data = data else { return }
                self?.latestEnvironment = FrameEnvironment(
                    timestamp: Date().timeIntervalSince1970,
                    ambientLightLux: nil,  // Updated from ARFrame light estimate
                    barometerHPa: Float(truncating: data.pressure),  // kPa from API, convert
                    magneticHeadingDegrees: nil
                )
            }
        }
    }

    // MARK: - Confidence Histogram

    private func computeConfidenceHistogram(_ buffer: CVPixelBuffer) -> ConfidenceHistogram {
        CVPixelBufferLockBaseAddress(buffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(buffer, .readOnly) }

        guard let baseAddress = CVPixelBufferGetBaseAddress(buffer) else {
            return ConfidenceHistogram(low: 0, medium: 0, high: 0)
        }

        let width = CVPixelBufferGetWidth(buffer)
        let height = CVPixelBufferGetHeight(buffer)
        let bytesPerRow = CVPixelBufferGetBytesPerRow(buffer)
        let ptr = baseAddress.assumingMemoryBound(to: UInt8.self)

        var low = 0, med = 0, high = 0
        for y in 0..<height {
            for x in 0..<width {
                let val = ptr[y * bytesPerRow + x]
                switch val {
                case 0: low += 1
                case 1: med += 1
                default: high += 1
                }
            }
        }
        return ConfidenceHistogram(low: low, medium: med, high: high)
    }
}

// MARK: - ARSessionDelegate

extension ARSessionManager: @preconcurrency ARSessionDelegate {
    nonisolated func session(_ session: ARSession, didUpdate frame: ARFrame) {
        Task { @MainActor in
            // Depth + confidence
            if let sceneDepth = frame.sceneDepth {
                self.depthMap = sceneDepth.depthMap
                self.confidenceMap = sceneDepth.confidenceMap
                if let conf = sceneDepth.confidenceMap {
                    self.confidenceHistogram = self.computeConfidenceHistogram(conf)
                }
            }

            // RGB camera
            self.cameraFrame = frame.capturedImage
            self.cameraIntrinsics = frame.camera.intrinsics
            self.cameraTransform = frame.camera.transform

            // Mesh anchors
            self.meshAnchors = frame.anchors.compactMap { $0 as? ARMeshAnchor }

            // Light estimate for environment data
            if let lightEstimate = frame.lightEstimate {
                let prevEnv = self.latestEnvironment
                self.latestEnvironment = FrameEnvironment(
                    timestamp: frame.timestamp,
                    ambientLightLux: Float(lightEstimate.ambientIntensity),
                    barometerHPa: prevEnv?.barometerHPa,
                    magneticHeadingDegrees: prevEnv?.magneticHeadingDegrees
                )
            }

            self.frameCount += 1
        }
    }

    nonisolated func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        Task { @MainActor in
            let newMeshes = anchors.compactMap { $0 as? ARMeshAnchor }
            self.meshAnchors.append(contentsOf: newMeshes)
        }
    }
}
