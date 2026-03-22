import CoreML
import Vision
import UIKit

/// Embedding-based dog re-identification.
///
/// Uses MobileNetV3-Small (headless) to generate 576-dim feature vectors.
/// Enrollment stores embeddings only — no images retained on device.
/// Cosine similarity against enrolled embeddings at inference time.
/// No MLUpdateTask, no gradient computation, no memory leak.
final class DogEmbeddingService {

    private var model: VNCoreMLModel?

    /// Enrolled embeddings for the patient's guide dog
    /// Stored as [[Float]] — each entry is a 576-dim vector from one enrollment image
    private(set) var enrolledEmbeddings: [[Float]] = []

    /// Similarity threshold for a positive match
    let matchThreshold: Float = 0.85

    init() {
        loadModel()
        loadEnrolledEmbeddings()
    }

    private func loadModel() {
        // Try compiled first, then raw package
        let urls: [(String, String)] = [
            ("DogReID", "mlmodelc"),
            ("DogReID", "mlpackage")
        ]

        for (name, ext) in urls {
            guard let url = Bundle.main.url(forResource: name, withExtension: ext) else { continue }
            do {
                let compiled = ext == "mlmodelc" ? url : try MLModel.compileModel(at: url)
                let mlModel = try MLModel(contentsOf: compiled)
                model = try VNCoreMLModel(for: mlModel)
                return
            } catch {
                continue
            }
        }
        print("[DogEmbeddingService] Re-ID model not found in bundle")
    }

    // MARK: - Embedding Extraction

    /// Extract a 576-dim embedding from a cropped dog image
    func extractEmbedding(from image: UIImage, completion: @escaping ([Float]?) -> Void) {
        guard let model = model,
              let cgImage = image.cgImage else {
            completion(nil)
            return
        }

        let request = VNCoreMLRequest(model: model) { request, error in
            guard let results = request.results as? [VNCoreMLFeatureValueObservation],
                  let multiArray = results.first?.featureValue.multiArrayValue else {
                completion(nil)
                return
            }

            // Convert MLMultiArray to [Float]
            var embedding = [Float](repeating: 0, count: multiArray.count)
            for i in 0..<multiArray.count {
                embedding[i] = multiArray[i].floatValue
            }

            // L2 normalize for cosine similarity
            let norm = sqrt(embedding.reduce(0) { $0 + $1 * $1 })
            if norm > 0 {
                embedding = embedding.map { $0 / norm }
            }

            completion(embedding)
        }

        request.imageCropAndScaleOption = .centerCrop

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        DispatchQueue.global(qos: .userInitiated).async {
            try? handler.perform([request])
        }
    }

    /// Extract embedding from a CVPixelBuffer crop (for real-time inference)
    func extractEmbedding(from buffer: CVPixelBuffer, completion: @escaping ([Float]?) -> Void) {
        guard let model = model else {
            completion(nil)
            return
        }

        let request = VNCoreMLRequest(model: model) { request, error in
            guard let results = request.results as? [VNCoreMLFeatureValueObservation],
                  let multiArray = results.first?.featureValue.multiArrayValue else {
                completion(nil)
                return
            }

            var embedding = [Float](repeating: 0, count: multiArray.count)
            for i in 0..<multiArray.count {
                embedding[i] = multiArray[i].floatValue
            }

            let norm = sqrt(embedding.reduce(0) { $0 + $1 * $1 })
            if norm > 0 {
                embedding = embedding.map { $0 / norm }
            }

            completion(embedding)
        }

        request.imageCropAndScaleOption = .centerCrop

        let handler = VNImageRequestHandler(cvPixelBuffer: buffer, options: [:])
        DispatchQueue.global(qos: .userInteractive).async {
            try? handler.perform([request])
        }
    }

    // MARK: - Enrollment

    /// Enroll a guide dog from sample images.
    /// Extracts embeddings and stores them locally. No images retained.
    /// Handler must be physically present during enrollment.
    func enroll(images: [UIImage], completion: @escaping (Bool) -> Void) {
        var embeddings: [[Float]] = []
        let group = DispatchGroup()

        for image in images {
            group.enter()
            extractEmbedding(from: image) { embedding in
                if let embedding = embedding {
                    embeddings.append(embedding)
                }
                group.leave()
            }
        }

        group.notify(queue: .main) { [weak self] in
            guard !embeddings.isEmpty else {
                completion(false)
                return
            }
            self?.enrolledEmbeddings = embeddings
            self?.saveEnrolledEmbeddings()
            completion(true)
        }
    }

    /// Clear enrollment data
    func clearEnrollment() {
        enrolledEmbeddings = []
        let url = embeddingsFileURL()
        try? FileManager.default.removeItem(at: url)
    }

    // MARK: - Matching

    /// Compare a detection embedding against enrolled embeddings.
    /// Returns the maximum cosine similarity (0-1).
    func match(embedding: [Float]) -> Float {
        guard !enrolledEmbeddings.isEmpty else { return 0 }

        var maxSim: Float = 0
        for enrolled in enrolledEmbeddings {
            let sim = cosineSimilarity(embedding, enrolled)
            maxSim = max(maxSim, sim)
        }
        return maxSim
    }

    /// Is this embedding a match for the enrolled dog?
    func isMatch(embedding: [Float]) -> Bool {
        return match(embedding: embedding) >= matchThreshold
    }

    // MARK: - Cosine Similarity

    private func cosineSimilarity(_ a: [Float], _ b: [Float]) -> Float {
        guard a.count == b.count, !a.isEmpty else { return 0 }
        // Both are L2-normalized, so dot product = cosine similarity
        var dot: Float = 0
        for i in 0..<a.count {
            dot += a[i] * b[i]
        }
        return dot
    }

    // MARK: - Persistence (embeddings only, no images)

    private func embeddingsFileURL() -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return docs.appendingPathComponent("guide_dog_embeddings.json")
    }

    private func saveEnrolledEmbeddings() {
        let encoder = JSONEncoder()
        if let data = try? encoder.encode(enrolledEmbeddings) {
            try? data.write(to: embeddingsFileURL())
        }
    }

    private func loadEnrolledEmbeddings() {
        let url = embeddingsFileURL()
        guard let data = try? Data(contentsOf: url) else { return }
        let decoder = JSONDecoder()
        enrolledEmbeddings = (try? decoder.decode([[Float]].self, from: data)) ?? []
    }
}
