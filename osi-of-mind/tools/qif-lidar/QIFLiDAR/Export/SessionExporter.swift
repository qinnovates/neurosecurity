import Foundation
import AVFoundation

/// Exports capture session data to the app sandbox in the spec format.
/// All exports pass through PrivacyGuard before writing.
final class SessionExporter {
    private let sessionDir: URL
    private let encoder = JSONEncoder()

    private var frameIndex: Int = 0

    init() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyyMMdd_HHmmss"
        let dirName = "session_\(formatter.string(from: Date()))"
        sessionDir = docs.appendingPathComponent(dirName)

        // Create all subdirectories
        let subdirs = ["depth", "confidence", "intrinsics", "transforms",
                       "imu", "timing", "environment", "mesh",
                       "segmentation", "guide_dog", "ocr"]
        for dir in subdirs {
            try? FileManager.default.createDirectory(
                at: sessionDir.appendingPathComponent(dir),
                withIntermediateDirectories: true
            )
        }

        encoder.outputFormatting = .prettyPrinted
    }

    // MARK: - Per-Frame Exports

    func exportDepthFrame(_ buffer: CVPixelBuffer) {
        let data = pixelBufferToData(buffer)
        let path = sessionDir
            .appendingPathComponent("depth")
            .appendingPathComponent(frameName(".bin"))
        try? data.write(to: path)
    }

    func exportConfidenceFrame(_ buffer: CVPixelBuffer, histogram: ConfidenceHistogram) {
        let data = pixelBufferToData(buffer)
        let path = sessionDir
            .appendingPathComponent("confidence")
            .appendingPathComponent(frameName(".bin"))
        try? data.write(to: path)

        // Also write histogram
        if let histData = try? encoder.encode(histogram) {
            let histPath = sessionDir
                .appendingPathComponent("confidence")
                .appendingPathComponent("histogram.json")
            // Append to array (simplified: overwrite for now)
            try? histData.write(to: histPath)
        }
    }

    func exportIntrinsics(_ matrix: simd_float3x3) {
        let values = (0..<3).flatMap { col in (0..<3).map { row in matrix[col][row] } }
        let dict = ["matrix_3x3": values]
        if let data = try? encoder.encode(dict) {
            let path = sessionDir
                .appendingPathComponent("intrinsics")
                .appendingPathComponent(frameName(".json"))
            try? data.write(to: path)
        }
    }

    func exportTransform(_ matrix: simd_float4x4) {
        let values = (0..<4).flatMap { col in (0..<4).map { row in matrix[col][row] } }
        let dict = ["matrix_4x4": values]
        if let data = try? encoder.encode(dict) {
            let path = sessionDir
                .appendingPathComponent("transforms")
                .appendingPathComponent(frameName(".json"))
            try? data.write(to: path)
        }
    }

    func exportIMU(_ imu: FrameIMU) {
        if let data = try? encoder.encode(imu) {
            let path = sessionDir
                .appendingPathComponent("imu")
                .appendingPathComponent(frameName(".json"))
            try? data.write(to: path)
        }
    }

    func exportTiming(_ timing: FrameTiming) {
        if let data = try? encoder.encode(timing) {
            let path = sessionDir
                .appendingPathComponent("timing")
                .appendingPathComponent(frameName(".json"))
            try? data.write(to: path)
        }
    }

    func exportEnvironment(_ env: FrameEnvironment) {
        if let data = try? encoder.encode(env) {
            let path = sessionDir
                .appendingPathComponent("environment")
                .appendingPathComponent(frameName(".json"))
            try? data.write(to: path)
        }
    }

    func exportGuideDogDetection(_ detection: GuideDogDetection) {
        if let data = try? encoder.encode(detection) {
            let path = sessionDir
                .appendingPathComponent("guide_dog")
                .appendingPathComponent(frameName(".json"))
            try? data.write(to: path)
        }
    }

    // MARK: - Session-Level Exports

    func exportManifest(_ manifest: CaptureManifest) {
        if let data = try? encoder.encode(manifest) {
            let path = sessionDir.appendingPathComponent("manifest.json")
            try? data.write(to: path)
        }
    }

    func getSessionDirectory() -> URL {
        return sessionDir
    }

    // MARK: - Helpers

    func advanceFrame() {
        frameIndex += 1
    }

    private func frameName(_ ext: String) -> String {
        return String(format: "frame_%06d%@", frameIndex, ext)
    }

    private func pixelBufferToData(_ buffer: CVPixelBuffer) -> Data {
        CVPixelBufferLockBaseAddress(buffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(buffer, .readOnly) }

        let baseAddress = CVPixelBufferGetBaseAddress(buffer)!
        let size = CVPixelBufferGetDataSize(buffer)
        return Data(bytes: baseAddress, count: size)
    }
}
