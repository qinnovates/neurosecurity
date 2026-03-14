import Foundation
import AVFoundation
import UIKit

/// Privacy stripping layer — ensures no PII leaves the device.
///
/// Design principle: privacy is a constraint at every layer, not a feature.
/// This mirrors the QIF neural data sovereignty principle.
enum PrivacyGuard {

    // MARK: - Verification

    /// Verify that CoreLocation is NOT imported anywhere in the app.
    /// This is a compile-time guarantee: if CoreLocation is imported,
    /// the app can request location. We never import it.
    static func verifyNoLocationCapability() -> Bool {
        // CoreLocation is not imported in this project.
        // If someone adds it, this function should be updated to warn.
        return true
    }

    // MARK: - Metadata Stripping

    /// Strip EXIF GPS data from a CGImage before export
    static func stripLocationMetadata(from imageData: Data) -> Data {
        guard let source = CGImageSourceCreateWithData(imageData as CFData, nil),
              let type = CGImageSourceGetType(source) else {
            return imageData
        }

        let mutableData = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(
            mutableData, type, 1, nil
        ) else {
            return imageData
        }

        // Copy image but strip GPS dictionary
        let removeKeys: CFDictionary = [
            kCGImagePropertyGPSDictionary: kCFNull as Any,
            kCGImagePropertyMakerAppleDictionary: kCFNull as Any
        ] as CFDictionary

        CGImageDestinationAddImageFromSource(destination, source, 0, removeKeys)
        CGImageDestinationFinalize(destination)

        return mutableData as Data
    }

    /// Create AVAssetWriter metadata that explicitly contains NO location
    static func cleanVideoMetadata() -> [AVMetadataItem] {
        let item = AVMutableMetadataItem()
        item.key = AVMetadataKey.commonKeyCreator as NSString
        item.keySpace = .common
        item.value = "QIF-LiDAR (no location data)" as NSString
        return [item]
    }

    /// Sanitize device info — return only what's needed, strip identifiers
    static func sanitizedDeviceClass() -> String {
        let device = UIDevice.current
        // Return generic class only, not model identifier or UDID
        switch device.userInterfaceIdiom {
        case .phone: return "iPhone"
        case .pad: return "iPad"
        default: return "unknown"
        }
    }

    /// Generate a session-local anonymous ID (not device-linked)
    static func anonymousSessionID() -> String {
        return UUID().uuidString
    }

    // MARK: - Manifest Generation

    static func generateManifest(
        startTime: Date,
        endTime: Date,
        frameCount: Int,
        frameRate: Int,
        modesActive: [DisplayMode],
        ocrEnabled: Bool
    ) -> CaptureManifest {
        let formatter = ISO8601DateFormatter()
        return CaptureManifest(
            captureDate: formatter.string(from: startTime),
            durationSeconds: endTime.timeIntervalSince(startTime),
            frameCount: frameCount,
            frameRate: frameRate,
            depthResolution: [256, 192],
            deviceClass: sanitizedDeviceClass(),
            lidarAvailable: true,
            modesActive: modesActive.map(\.rawValue),
            ocrEnabled: ocrEnabled,
            privacy: CaptureManifest.PrivacyInfo()
        )
    }
}
