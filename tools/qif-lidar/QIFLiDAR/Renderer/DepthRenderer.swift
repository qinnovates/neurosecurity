import SwiftUI
import MetalKit
import ARKit

/// Metal-backed renderer that displays LiDAR depth data as a colored point cloud.
/// This is the failsafe layer — it renders from raw depth without any AI dependency.
struct DepthRendererView: UIViewRepresentable {
    let depthMap: CVPixelBuffer?
    let confidenceMap: CVPixelBuffer?
    let cameraFrame: CVPixelBuffer?
    let displayMode: DisplayMode
    let segmentationMask: [UInt8]?  // 513×513 class IDs from DeepLabV3
    let guideDogBBox: CGRect?       // Normalized bounding box from guide dog detector

    func makeUIView(context: Context) -> MTKView {
        let view = MTKView()
        view.device = MTLCreateSystemDefaultDevice()
        view.colorPixelFormat = .bgra8Unorm
        view.clearColor = MTLClearColor(red: 0.05, green: 0.05, blue: 0.1, alpha: 1.0)
        view.delegate = context.coordinator
        view.preferredFramesPerSecond = 60
        view.isPaused = false
        view.enableSetNeedsDisplay = false
        return view
    }

    func updateUIView(_ uiView: MTKView, context: Context) {
        context.coordinator.depthMap = depthMap
        context.coordinator.confidenceMap = confidenceMap
        context.coordinator.cameraFrame = cameraFrame
        context.coordinator.displayMode = displayMode
        context.coordinator.segmentationMask = segmentationMask
        context.coordinator.guideDogBBox = guideDogBBox
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator: NSObject, MTKViewDelegate {
        var depthMap: CVPixelBuffer?
        var confidenceMap: CVPixelBuffer?
        var cameraFrame: CVPixelBuffer?
        var displayMode: DisplayMode = .rawDepth
        var segmentationMask: [UInt8]?
        var guideDogBBox: CGRect?

        private var device: MTLDevice?
        private var commandQueue: MTLCommandQueue?
        private var pipelineState: MTLRenderPipelineState?
        private var textureCache: CVMetalTextureCache?

        // Buffers
        private var depthDataBuffer: MTLBuffer?
        private var uniformsBuffer: MTLBuffer?

        // Animation
        private var startTime: Date = Date()

        // Uniforms struct — must match Metal shader
        struct Uniforms {
            var resolution: SIMD2<Float>
            var depthRange: SIMD2<Float>
            var screenSize: SIMD2<Float>
            var time: Float
            var focalLength: Float
        }

        override init() {
            super.init()
            setupMetal()
        }

        private func setupMetal() {
            guard let device = MTLCreateSystemDefaultDevice() else { return }
            self.device = device
            self.commandQueue = device.makeCommandQueue()

            CVMetalTextureCacheCreate(nil, nil, device, nil, &textureCache)

            guard let library = device.makeDefaultLibrary() else { return }

            let descriptor = MTLRenderPipelineDescriptor()
            descriptor.vertexFunction = library.makeFunction(name: "depthVertex")
            descriptor.fragmentFunction = library.makeFunction(name: "depthFragment")
            descriptor.colorAttachments[0].pixelFormat = .bgra8Unorm

            // Enable alpha blending for soft particle glow
            descriptor.colorAttachments[0].isBlendingEnabled = true
            descriptor.colorAttachments[0].rgbBlendOperation = .add
            descriptor.colorAttachments[0].alphaBlendOperation = .add
            descriptor.colorAttachments[0].sourceRGBBlendFactor = .sourceAlpha
            descriptor.colorAttachments[0].destinationRGBBlendFactor = .oneMinusSourceAlpha
            descriptor.colorAttachments[0].sourceAlphaBlendFactor = .one
            descriptor.colorAttachments[0].destinationAlphaBlendFactor = .oneMinusSourceAlpha

            pipelineState = try? device.makeRenderPipelineState(descriptor: descriptor)

            // Uniforms buffer
            uniformsBuffer = device.makeBuffer(length: MemoryLayout<Uniforms>.size, options: .storageModeShared)
        }

        func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {}

        func draw(in view: MTKView) {
            guard let device = device,
                  let drawable = view.currentDrawable,
                  let descriptor = view.currentRenderPassDescriptor,
                  let commandBuffer = commandQueue?.makeCommandBuffer(),
                  let encoder = commandBuffer.makeRenderCommandEncoder(descriptor: descriptor),
                  let pipelineState = pipelineState else {
                return
            }

            if let depthMap = depthMap {
                let depthData = extractDepthData(depthMap)

                // Upload depth to GPU
                if depthDataBuffer == nil || depthDataBuffer!.length != depthData.count * MemoryLayout<Float>.size {
                    depthDataBuffer = device.makeBuffer(
                        bytes: depthData,
                        length: depthData.count * MemoryLayout<Float>.size,
                        options: .storageModeShared
                    )
                } else {
                    depthDataBuffer?.contents().copyMemory(
                        from: depthData,
                        byteCount: depthData.count * MemoryLayout<Float>.size
                    )
                }

                // Update uniforms with current time + screen size
                let drawableSize = view.drawableSize
                var uniforms = Uniforms(
                    resolution: SIMD2<Float>(256, 192),
                    depthRange: SIMD2<Float>(0.1, 5.0),
                    screenSize: SIMD2<Float>(Float(drawableSize.width), Float(drawableSize.height)),
                    time: Float(Date().timeIntervalSince(startTime)),
                    focalLength: 240.0
                )
                uniformsBuffer?.contents().copyMemory(from: &uniforms, byteCount: MemoryLayout<Uniforms>.size)

                encoder.setRenderPipelineState(pipelineState)
                encoder.setVertexBuffer(depthDataBuffer, offset: 0, index: 0)
                encoder.setVertexBuffer(uniformsBuffer, offset: 0, index: 1)

                // Draw one point per depth pixel as soft particles
                let vertexCount = 256 * 192
                encoder.drawPrimitives(type: .point, vertexStart: 0, vertexCount: vertexCount)
            }

            encoder.endEncoding()
            commandBuffer.present(drawable)
            commandBuffer.commit()
        }

        /// Extract raw float depth values from CVPixelBuffer
        private func extractDepthData(_ buffer: CVPixelBuffer) -> [Float] {
            CVPixelBufferLockBaseAddress(buffer, .readOnly)
            defer { CVPixelBufferUnlockBaseAddress(buffer, .readOnly) }

            let width = CVPixelBufferGetWidth(buffer)
            let height = CVPixelBufferGetHeight(buffer)
            let bytesPerRow = CVPixelBufferGetBytesPerRow(buffer)

            guard let baseAddress = CVPixelBufferGetBaseAddress(buffer) else {
                return Array(repeating: 0, count: width * height)
            }

            var result = [Float](repeating: 0, count: width * height)
            let ptr = baseAddress.assumingMemoryBound(to: Float32.self)
            let floatsPerRow = bytesPerRow / MemoryLayout<Float32>.size

            for y in 0..<height {
                for x in 0..<width {
                    result[y * width + x] = ptr[y * floatsPerRow + x]
                }
            }

            return result
        }
    }
}
