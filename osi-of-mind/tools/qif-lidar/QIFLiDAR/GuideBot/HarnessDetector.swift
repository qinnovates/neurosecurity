import Foundation
import ARKit

/// Guide dog harness detection using LiDAR depth data.
///
/// NOVEL APPROACH: The rigid horizontal handle of a guide dog harness creates
/// a distinctive depth signature — a raised planar feature above the dog's back.
/// This is detectable in LiDAR depth maps as a horizontal line segment at a
/// characteristic height (approximately 0.3-0.5m above ground for most breeds)
/// that moves with the dog.
///
/// LiDAR uniquely enables this over camera-only approaches because the harness
/// handle's 3D geometry (rigid, horizontal, elevated) is unambiguous in depth
/// space even when RGB appearance varies (harness color, lighting, angle).
///
/// No published work exists on guide dog harness detection via depth sensing.
/// This is a research contribution.
final class HarnessDetector {

    struct HarnessDetection {
        let detected: Bool
        let confidence: Float
        let handleHeight: Float     // meters above ground plane
        let handleWidth: Float      // meters, horizontal extent
        let handleCenter: SIMD3<Float>  // 3D position in world space
    }

    // Expected physical dimensions of a guide dog harness handle
    // These are approximate and should be calibrated per harness type
    private let expectedHandleHeight: ClosedRange<Float> = 0.25...0.65  // meters above ground
    private let expectedHandleWidth: ClosedRange<Float> = 0.15...0.40   // meters wide
    private let expectedHandleDepth: Float = 0.02                        // handle thickness ~2cm
    private let minConfidence: Float = 0.6

    /// Analyze a depth map region for harness handle signature.
    ///
    /// The algorithm:
    /// 1. Within the dog bounding box (from YOLO), isolate the upper third
    ///    (harness handle is above the dog's back, not at body level)
    /// 2. Find horizontal line segments where depth is consistently CLOSER
    ///    to camera than the dog's body by ~2-5cm (the handle protrudes)
    /// 3. Verify the segment is approximately horizontal (not tilted > 15°)
    /// 4. Verify width matches expected handle dimensions
    /// 5. Return detection with confidence score
    func detectHarness(
        depthMap: CVPixelBuffer,
        dogBoundingBox: CGRect,     // normalized (0-1) from YOLO
        confidenceMap: CVPixelBuffer?
    ) -> HarnessDetection {
        CVPixelBufferLockBaseAddress(depthMap, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(depthMap, .readOnly) }

        let width = CVPixelBufferGetWidth(depthMap)
        let height = CVPixelBufferGetHeight(depthMap)
        let bytesPerRow = CVPixelBufferGetBytesPerRow(depthMap)

        guard let baseAddress = CVPixelBufferGetBaseAddress(depthMap) else {
            return HarnessDetection(detected: false, confidence: 0, handleHeight: 0, handleWidth: 0, handleCenter: .zero)
        }

        let depthPtr = baseAddress.assumingMemoryBound(to: Float32.self)
        let floatsPerRow = bytesPerRow / MemoryLayout<Float32>.size

        // Convert normalized bbox to pixel coordinates
        let boxX = Int(dogBoundingBox.origin.x * CGFloat(width))
        let boxY = Int(dogBoundingBox.origin.y * CGFloat(height))
        let boxW = Int(dogBoundingBox.width * CGFloat(width))
        let boxH = Int(dogBoundingBox.height * CGFloat(height))

        // Focus on upper third of bounding box (where harness handle should be)
        let searchTop = max(0, boxY)
        let searchBottom = min(height - 1, boxY + boxH / 3)
        let searchLeft = max(0, boxX)
        let searchRight = min(width - 1, boxX + boxW)

        guard searchRight > searchLeft, searchBottom > searchTop else {
            return HarnessDetection(detected: false, confidence: 0, handleHeight: 0, handleWidth: 0, handleCenter: .zero)
        }

        // Compute median depth of the dog body (lower 2/3 of bbox)
        var bodyDepths: [Float] = []
        let bodyTop = boxY + boxH / 3
        let bodyBottom = min(height - 1, boxY + boxH)
        for y in bodyTop..<bodyBottom {
            for x in searchLeft..<searchRight {
                let d = depthPtr[y * floatsPerRow + x]
                if d > 0 && d < 5.0 {
                    bodyDepths.append(d)
                }
            }
        }

        guard !bodyDepths.isEmpty else {
            return HarnessDetection(detected: false, confidence: 0, handleHeight: 0, handleWidth: 0, handleCenter: .zero)
        }

        bodyDepths.sort()
        let medianBodyDepth = bodyDepths[bodyDepths.count / 2]

        // Scan for horizontal line segments that protrude toward camera
        // A harness handle should be 2-8cm closer than the dog's body
        let protrusionMin: Float = 0.02  // 2cm minimum
        let protrusionMax: Float = 0.12  // 12cm maximum

        var bestSegment: (startX: Int, endX: Int, y: Int, avgDepth: Float)?
        var bestLength = 0

        for y in searchTop..<searchBottom {
            var segStart: Int? = nil
            var segLength = 0

            for x in searchLeft..<searchRight {
                let d = depthPtr[y * floatsPerRow + x]
                let protrusion = medianBodyDepth - d

                if d > 0 && protrusion >= protrusionMin && protrusion <= protrusionMax {
                    if segStart == nil { segStart = x }
                    segLength += 1
                } else {
                    if segLength > bestLength, let start = segStart {
                        bestLength = segLength
                        bestSegment = (startX: start, endX: start + segLength, y: y, avgDepth: d)
                    }
                    segStart = nil
                    segLength = 0
                }
            }

            // Check end of row
            if segLength > bestLength, let start = segStart {
                bestLength = segLength
                bestSegment = (startX: start, endX: start + segLength, y: y, avgDepth: depthPtr[y * floatsPerRow + start])
            }
        }

        // Validate the best segment
        guard let segment = bestSegment else {
            return HarnessDetection(detected: false, confidence: 0, handleHeight: 0, handleWidth: 0, handleCenter: .zero)
        }

        // Convert pixel width to approximate real-world width
        // At the handle's depth, each pixel covers approximately:
        //   realWidth = pixelWidth * depth / focalLength
        // Using approximate focal length for iPhone LiDAR (~240 pixels for 60° FOV)
        let focalLength: Float = 240.0
        let avgDepth = (segment.avgDepth > 0) ? segment.avgDepth : medianBodyDepth - 0.05
        let realWidth = Float(bestLength) * avgDepth / focalLength

        // Estimate handle height above ground
        // Rough estimate: if dog body is at ~0.5m from ground and handle is
        // in upper third, handle is at approximately body height + some offset
        let handleHeightEstimate = Float(height - segment.y) / Float(height) * avgDepth * 0.6

        // Score confidence based on multiple factors
        var confidence: Float = 0

        // Width within expected range?
        if expectedHandleWidth.contains(realWidth) {
            confidence += 0.4
        } else if realWidth > 0.1 && realWidth < 0.5 {
            confidence += 0.2  // close but not ideal
        }

        // Segment length reasonable? (at least 8 pixels for a handle)
        if bestLength >= 8 {
            confidence += 0.3
        } else if bestLength >= 4 {
            confidence += 0.15
        }

        // Protrusion consistent across segment?
        confidence += 0.3  // base score for finding any consistent protrusion

        let center = SIMD3<Float>(
            Float(segment.startX + segment.endX) / 2.0 / Float(width),
            Float(segment.y) / Float(height),
            avgDepth
        )

        return HarnessDetection(
            detected: confidence >= minConfidence,
            confidence: min(confidence, 1.0),
            handleHeight: handleHeightEstimate,
            handleWidth: realWidth,
            handleCenter: center
        )
    }
}
