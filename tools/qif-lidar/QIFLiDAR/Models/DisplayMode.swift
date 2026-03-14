import Foundation

/// The four visualization modes for LiDAR data
enum DisplayMode: String, CaseIterable, Identifiable {
    case rawDepth = "Raw Depth"
    case colorFusion = "Color"
    case aiClassification = "AI"
    case guideDog = "Guide Dog"

    var id: String { rawValue }

    var description: String {
        switch self {
        case .rawDepth:
            return "Depth gradient — failsafe layer. Always renders even if AI fails."
        case .colorFusion:
            return "Camera RGB projected onto LiDAR point cloud."
        case .aiClassification:
            return "DeepLabV3 semantic segmentation — 21 object classes."
        case .guideDog:
            return "Guide dog detection — single-class, safety-critical."
        }
    }
}
