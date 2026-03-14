import Vision
import CoreML
import UIKit

/// Guide dog detection pipeline.
///
/// Three-signal detection:
/// 1. YOLOv8n detects all dogs in frame (COCO class 16)
/// 2. DogEmbeddingService re-identifies the specific enrolled dog (cosine similarity)
/// 3. HarnessDetector confirms guide dog harness via LiDAR depth signature
///
/// All three signals combined produce a high-confidence guide dog detection
/// that distinguishes the patient's specific guide dog from any other dog.
final class GuideDogDetector: ObservableObject {

    @Published var isDetected: Bool = false
    @Published var confidence: Float = 0
    @Published var boundingBox: CGRect = .zero
    @Published var direction: String = "none"
    @Published var isEnrolledDogMatch: Bool = false
    @Published var harnessDetected: Bool = false

    private var yoloModel: VNCoreMLModel?
    let embeddingService = DogEmbeddingService()
    private let harnessDetector = HarnessDetector()

    // COCO class for "dog"
    private let dogClassLabel = "dog"

    init() {
        loadYOLO()
    }

    private func loadYOLO() {
        let urls: [(String, String)] = [
            ("YOLOv8n", "mlmodelc"),
            ("YOLOv8n", "mlpackage")
        ]

        for (name, ext) in urls {
            guard let url = Bundle.main.url(forResource: name, withExtension: ext) else { continue }
            do {
                let compiled = ext == "mlmodelc" ? url : try MLModel.compileModel(at: url)
                let mlModel = try MLModel(contentsOf: compiled)
                yoloModel = try VNCoreMLModel(for: mlModel)
                return
            } catch {
                continue
            }
        }
        print("[GuideDogDetector] YOLOv8n model not found in bundle")
    }

    /// Run the full detection pipeline on a camera frame + depth map
    func detect(_ pixelBuffer: CVPixelBuffer, depthMap: CVPixelBuffer? = nil, confidenceMap: CVPixelBuffer? = nil) {
        guard let model = yoloModel else { return }

        let request = VNCoreMLRequest(model: model) { [weak self] request, error in
            self?.processResults(
                request.results,
                cameraFrame: pixelBuffer,
                depthMap: depthMap,
                confidenceMap: confidenceMap
            )
        }
        request.imageCropAndScaleOption = .scaleFill

        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        DispatchQueue.global(qos: .userInteractive).async {
            try? handler.perform([request])
        }
    }

    private func processResults(
        _ results: [VNObservation]?,
        cameraFrame: CVPixelBuffer,
        depthMap: CVPixelBuffer?,
        confidenceMap: CVPixelBuffer?
    ) {
        guard let observations = results as? [VNRecognizedObjectObservation] else {
            updateState(detected: false)
            return
        }

        // Find all dog detections
        let dogs = observations.filter { observation in
            observation.labels.first?.identifier.lowercased() == dogClassLabel
        }

        guard let bestDog = dogs.max(by: { $0.confidence < $1.confidence }) else {
            updateState(detected: false)
            return
        }

        let bbox = bestDog.boundingBox
        let yoloConfidence = bestDog.confidence
        let dir = computeDirection(bbox: bbox)

        // Signal 2: Re-ID — is this the enrolled dog?
        var reIdMatch = false
        if embeddingService.enrolledEmbeddings.count > 0 {
            // Extract embedding from the dog crop
            embeddingService.extractEmbedding(from: cameraFrame) { [weak self] embedding in
                guard let embedding = embedding, let self = self else { return }
                reIdMatch = self.embeddingService.isMatch(embedding: embedding)
            }
        }

        // Signal 3: Harness detection via LiDAR depth
        var harnessResult: HarnessDetector.HarnessDetection?
        if let depthMap = depthMap {
            harnessResult = harnessDetector.detectHarness(
                depthMap: depthMap,
                dogBoundingBox: bbox,
                confidenceMap: confidenceMap
            )
        }

        // Combine signals for final confidence
        var combinedConfidence = yoloConfidence

        // Boost confidence if re-ID matches
        if reIdMatch {
            combinedConfidence = min(1.0, combinedConfidence + 0.15)
        }

        // Boost confidence if harness detected
        if let harness = harnessResult, harness.detected {
            combinedConfidence = min(1.0, combinedConfidence + 0.1)
        }

        // Reduce confidence if enrolled but NOT matched (wrong dog)
        if embeddingService.enrolledEmbeddings.count > 0 && !reIdMatch {
            combinedConfidence *= 0.5  // Penalize: this is probably not our dog
        }

        DispatchQueue.main.async { [weak self] in
            self?.isDetected = true
            self?.confidence = combinedConfidence
            self?.boundingBox = bbox
            self?.direction = dir
            self?.isEnrolledDogMatch = reIdMatch
            self?.harnessDetected = harnessResult?.detected ?? false
        }
    }

    private func updateState(detected: Bool) {
        DispatchQueue.main.async { [weak self] in
            self?.isDetected = detected
            if !detected {
                self?.confidence = 0
                self?.boundingBox = .zero
                self?.direction = "none"
                self?.isEnrolledDogMatch = false
                self?.harnessDetected = false
            }
        }
    }

    private func computeDirection(bbox: CGRect) -> String {
        let centerX = bbox.midX
        if centerX < 0.33 {
            return "left"
        } else if centerX > 0.66 {
            return "right"
        } else {
            return "center"
        }
    }

    /// Get a GuideDogDetection struct for export
    func currentDetection() -> GuideDogDetection {
        return GuideDogDetection(
            timestamp: Date().timeIntervalSince1970,
            dogPresent: isDetected,
            confidence: confidence,
            boundingBox: isDetected ? [
                Float(boundingBox.origin.x),
                Float(boundingBox.origin.y),
                Float(boundingBox.width),
                Float(boundingBox.height)
            ] : nil,
            direction: isDetected ? direction : nil
        )
    }
}
