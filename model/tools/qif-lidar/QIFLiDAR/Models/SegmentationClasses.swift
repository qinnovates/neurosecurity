import SwiftUI

/// DeepLabV3 PASCAL VOC class definitions — 21 classes
enum SegmentationClass: Int, CaseIterable {
    case background = 0
    case airplane = 1
    case bicycle = 2
    case bird = 3
    case boat = 4
    case bottle = 5
    case bus = 6
    case car = 7
    case cat = 8
    case chair = 9
    case cow = 10
    case diningTable = 11
    case dog = 12
    case horse = 13
    case motorcycle = 14
    case person = 15
    case pottedPlant = 16
    case sheep = 17
    case sofa = 18
    case train = 19
    case tvMonitor = 20

    var label: String {
        switch self {
        case .background: return "background"
        case .airplane: return "airplane"
        case .bicycle: return "bicycle"
        case .bird: return "bird"
        case .boat: return "boat"
        case .bottle: return "bottle"
        case .bus: return "bus"
        case .car: return "car"
        case .cat: return "cat"
        case .chair: return "chair"
        case .cow: return "cow"
        case .diningTable: return "table"
        case .dog: return "dog"
        case .horse: return "horse"
        case .motorcycle: return "motorcycle"
        case .person: return "person"
        case .pottedPlant: return "plant"
        case .sheep: return "sheep"
        case .sofa: return "sofa"
        case .train: return "train"
        case .tvMonitor: return "tv"
        }
    }

    /// Color for AI classification rendering
    var color: Color {
        switch self {
        case .background: return .clear
        case .person: return .red
        case .dog: return .green         // Guide dog = bright green
        case .cat: return .orange
        case .car: return .blue
        case .bus: return .blue
        case .train: return .blue
        case .bicycle: return .cyan
        case .motorcycle: return .cyan
        case .chair: return .brown
        case .sofa: return .brown
        case .diningTable: return .brown
        case .tvMonitor: return .purple
        case .bottle: return .pink
        case .pottedPlant: return .mint
        default: return .gray
        }
    }

    /// SIMD color for Metal shader
    var metalColor: SIMD4<Float> {
        switch self {
        case .background: return SIMD4(0.05, 0.05, 0.1, 0.3)
        case .person: return SIMD4(0.9, 0.2, 0.2, 1.0)
        case .dog: return SIMD4(0.2, 0.95, 0.4, 1.0)
        case .cat: return SIMD4(0.95, 0.6, 0.1, 1.0)
        case .car: return SIMD4(0.2, 0.4, 0.95, 1.0)
        case .bus: return SIMD4(0.2, 0.3, 0.8, 1.0)
        case .bicycle: return SIMD4(0.1, 0.8, 0.8, 1.0)
        case .chair: return SIMD4(0.6, 0.4, 0.2, 1.0)
        case .bottle: return SIMD4(0.9, 0.5, 0.7, 1.0)
        case .pottedPlant: return SIMD4(0.3, 0.8, 0.5, 1.0)
        default: return SIMD4(0.5, 0.5, 0.5, 0.8)
        }
    }
}
