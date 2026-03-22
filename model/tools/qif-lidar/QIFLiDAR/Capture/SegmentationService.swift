import CoreML
import Vision
import CoreImage
import UIKit

/// On-device semantic segmentation using DeepLabV3 (Core ML).
/// Runs on the Neural Engine — no network calls.
final class SegmentationService {

    private var model: VNCoreMLModel?
    private var lastSegmentationMask: MLMultiArray?

    /// 21-class segmentation mask (256×256 after model processing)
    var currentMask: MLMultiArray? { lastSegmentationMask }

    init() {
        loadModel()
    }

    private func loadModel() {
        guard let modelURL = Bundle.main.url(forResource: "DeepLabV3", withExtension: "mlmodelc") else {
            // Try .mlmodel (not yet compiled)
            guard let rawURL = Bundle.main.url(forResource: "DeepLabV3", withExtension: "mlmodel") else {
                print("[SegmentationService] DeepLabV3 model not found in bundle")
                return
            }
            do {
                let compiled = try MLModel.compileModel(at: rawURL)
                let mlModel = try MLModel(contentsOf: compiled)
                model = try VNCoreMLModel(for: mlModel)
            } catch {
                print("[SegmentationService] Failed to compile DeepLabV3: \(error)")
            }
            return
        }

        do {
            let mlModel = try MLModel(contentsOf: modelURL)
            model = try VNCoreMLModel(for: mlModel)
        } catch {
            print("[SegmentationService] Failed to load DeepLabV3: \(error)")
        }
    }

    /// Run segmentation on a camera frame (CVPixelBuffer from ARKit)
    func segment(_ pixelBuffer: CVPixelBuffer, completion: @escaping (MLMultiArray?) -> Void) {
        guard let model = model else {
            completion(nil)
            return
        }

        let request = VNCoreMLRequest(model: model) { [weak self] request, error in
            guard let results = request.results as? [VNCoreMLFeatureValueObservation],
                  let segmentationMap = results.first?.featureValue.multiArrayValue else {
                completion(nil)
                return
            }
            self?.lastSegmentationMask = segmentationMap
            completion(segmentationMap)
        }

        request.imageCropAndScaleOption = .scaleFill

        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        DispatchQueue.global(qos: .userInteractive).async {
            try? handler.perform([request])
        }
    }

    /// Get the class label at a specific pixel in the segmentation mask
    func classAt(x: Int, y: Int, maskWidth: Int = 513, maskHeight: Int = 513) -> SegmentationClass? {
        guard let mask = lastSegmentationMask else { return nil }
        let index = y * maskWidth + x
        guard index < mask.count else { return nil }
        let classID = mask[index].intValue
        return SegmentationClass(rawValue: classID)
    }

    /// Check if a dog is detected anywhere in the current segmentation
    func isDogDetected() -> Bool {
        guard let mask = lastSegmentationMask else { return false }
        let dogClass = SegmentationClass.dog.rawValue
        for i in 0..<mask.count {
            if mask[i].intValue == dogClass { return true }
        }
        return false
    }

    /// Get bounding box of the dog region in normalized coordinates
    func dogBoundingBox(maskWidth: Int = 513, maskHeight: Int = 513) -> CGRect? {
        guard let mask = lastSegmentationMask else { return nil }
        let dogClass = SegmentationClass.dog.rawValue

        var minX = maskWidth, minY = maskHeight, maxX = 0, maxY = 0
        var found = false

        for y in 0..<maskHeight {
            for x in 0..<maskWidth {
                if mask[y * maskWidth + x].intValue == dogClass {
                    minX = min(minX, x)
                    minY = min(minY, y)
                    maxX = max(maxX, x)
                    maxY = max(maxY, y)
                    found = true
                }
            }
        }

        guard found else { return nil }

        return CGRect(
            x: CGFloat(minX) / CGFloat(maskWidth),
            y: CGFloat(minY) / CGFloat(maskHeight),
            width: CGFloat(maxX - minX) / CGFloat(maskWidth),
            height: CGFloat(maxY - minY) / CGFloat(maskHeight)
        )
    }
}
