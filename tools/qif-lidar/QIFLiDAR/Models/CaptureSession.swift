import Foundation

/// Metadata for a single capture session — exported as manifest.json
struct CaptureManifest: Codable {
    let version: String = "1.0"
    let app: String = "QIF-LiDAR"
    let captureDate: String
    let durationSeconds: Double
    let frameCount: Int
    let frameRate: Int
    let depthResolution: [Int]
    let deviceClass: String
    let lidarAvailable: Bool
    let modesActive: [String]
    let ocrEnabled: Bool
    let privacy: PrivacyInfo

    struct PrivacyInfo: Codable {
        let locationStripped: Bool = true
        let deviceIdStripped: Bool = true
        let exifGpsStripped: Bool = true
        let networkCallsDuringCapture: Int = 0
        let telemetrySdks: [String] = []
    }
}

/// Per-frame environmental data
struct FrameEnvironment: Codable {
    let timestamp: Double
    let ambientLightLux: Float?
    let barometerHPa: Float?
    let magneticHeadingDegrees: Float?
}

/// Per-frame IMU reading (raw, not ARKit-fused)
struct FrameIMU: Codable {
    let timestamp: Double
    let accelerometerX: Double
    let accelerometerY: Double
    let accelerometerZ: Double
    let gyroscopeX: Double
    let gyroscopeY: Double
    let gyroscopeZ: Double
}

/// Per-frame timing for side-channel analysis
struct FrameTiming: Codable {
    let timestamp: Double
    let metalGpuMs: Double
    let neuralEngineMs: Double
    let totalFrameMs: Double
}

/// Per-frame confidence histogram
struct ConfidenceHistogram: Codable {
    let low: Int
    let medium: Int
    let high: Int
}

/// Guide dog detection result per frame
struct GuideDogDetection: Codable {
    let timestamp: Double
    let dogPresent: Bool
    let confidence: Float
    let boundingBox: [Float]?  // [x, y, width, height] normalized
    let direction: String?     // "left", "center", "right", "behind"
}
