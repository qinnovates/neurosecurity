import SwiftUI
import MetalKit
import ARKit

/// Metal-backed renderer that displays LiDAR depth data as a colored point cloud,
/// optionally layered over the live camera feed (dual-layer mode).
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
        view.clearColor = MTLClearColor(red: 0.0, green: 0.0, blue: 0.0, alpha: 1.0)
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
        private var depthPipelineState: MTLRenderPipelineState?
        private var cameraPipelineState: MTLRenderPipelineState?
        private var textureCache: CVMetalTextureCache?

        // Buffers
        private var depthDataBuffer: MTLBuffer?
        private var uniformsBuffer: MTLBuffer?
        private var quadVertexBuffer: MTLBuffer?

        // Animation
        private var startTime: Date = Date()

        // Uniforms struct — must match Metal shader
        struct Uniforms {
            var resolution: SIMD2<Float>
            var depthRange: SIMD2<Float>
            var screenSize: SIMD2<Float>
            var time: Float
            var focalLength: Float
            var orientation: Int32
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

            // Depth particle pipeline
            let depthDescriptor = MTLRenderPipelineDescriptor()
            depthDescriptor.vertexFunction = library.makeFunction(name: "depthVertex")
            depthDescriptor.fragmentFunction = library.makeFunction(name: "depthFragment")
            depthDescriptor.colorAttachments[0].pixelFormat = .bgra8Unorm
            depthDescriptor.colorAttachments[0].isBlendingEnabled = true
            depthDescriptor.colorAttachments[0].rgbBlendOperation = .add
            depthDescriptor.colorAttachments[0].alphaBlendOperation = .add
            depthDescriptor.colorAttachments[0].sourceRGBBlendFactor = .sourceAlpha
            depthDescriptor.colorAttachments[0].destinationRGBBlendFactor = .oneMinusSourceAlpha
            depthDescriptor.colorAttachments[0].sourceAlphaBlendFactor = .one
            depthDescriptor.colorAttachments[0].destinationAlphaBlendFactor = .oneMinusSourceAlpha
            depthPipelineState = try? device.makeRenderPipelineState(descriptor: depthDescriptor)

            // Camera passthrough pipeline (full-screen textured quad)
            let cameraDescriptor = MTLRenderPipelineDescriptor()
            cameraDescriptor.vertexFunction = library.makeFunction(name: "cameraVertex")
            cameraDescriptor.fragmentFunction = library.makeFunction(name: "cameraFragment")
            cameraDescriptor.colorAttachments[0].pixelFormat = .bgra8Unorm
            cameraPipelineState = try? device.makeRenderPipelineState(descriptor: cameraDescriptor)

            // Uniforms buffer
            uniformsBuffer = device.makeBuffer(length: MemoryLayout<Uniforms>.stride, options: .storageModeShared)

            // Full-screen quad vertices (position xy + texcoord uv)
            // Portrait: camera feed needs 90° rotation to match screen
            let quadVertices: [Float] = [
                // pos x,  y,    tex u, v
                -1.0, -1.0,    1.0, 1.0,   // bottom-left
                 1.0, -1.0,    1.0, 0.0,   // bottom-right
                -1.0,  1.0,    0.0, 1.0,   // top-left
                 1.0,  1.0,    0.0, 0.0,   // top-right
            ]
            quadVertexBuffer = device.makeBuffer(
                bytes: quadVertices,
                length: quadVertices.count * MemoryLayout<Float>.size,
                options: .storageModeShared
            )
        }

        func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {}

        func draw(in view: MTKView) {
            guard let device = device,
                  let drawable = view.currentDrawable,
                  let descriptor = view.currentRenderPassDescriptor,
                  let commandBuffer = commandQueue?.makeCommandBuffer() else {
                return
            }

            let drawableSize = view.drawableSize
            let isPortrait = drawableSize.height > drawableSize.width

            // === Layer 1: Camera passthrough (background) ===
            if displayMode == .colorFusion,
               let cameraFrame = cameraFrame,
               let cameraPipeline = cameraPipelineState,
               let cameraTexture = makeTexture(from: cameraFrame) {

                let encoder = commandBuffer.makeRenderCommandEncoder(descriptor: descriptor)!
                encoder.setRenderPipelineState(cameraPipeline)
                encoder.setVertexBuffer(quadVertexBuffer, offset: 0, index: 0)
                encoder.setFragmentTexture(cameraTexture, index: 0)
                encoder.drawPrimitives(type: .triangleStrip, vertexStart: 0, vertexCount: 4)
                encoder.endEncoding()

                // For the depth overlay, don't clear (load existing content)
                descriptor.colorAttachments[0].loadAction = .load
            }

            // === Layer 2: Depth particles (overlay) ===
            if let depthMap = depthMap, let depthPipeline = depthPipelineState {
                let depthData = extractDepthData(depthMap)

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

                var uniforms = Uniforms(
                    resolution: SIMD2<Float>(256, 192),
                    depthRange: SIMD2<Float>(0.1, 5.0),
                    screenSize: SIMD2<Float>(Float(drawableSize.width), Float(drawableSize.height)),
                    time: Float(Date().timeIntervalSince(startTime)),
                    focalLength: 240.0,
                    orientation: isPortrait ? 0 : 1
                )
                uniformsBuffer?.contents().copyMemory(from: &uniforms, byteCount: MemoryLayout<Uniforms>.stride)

                let encoder = commandBuffer.makeRenderCommandEncoder(descriptor: descriptor)!
                encoder.setRenderPipelineState(depthPipeline)
                encoder.setVertexBuffer(depthDataBuffer, offset: 0, index: 0)
                encoder.setVertexBuffer(uniformsBuffer, offset: 0, index: 1)
                encoder.drawPrimitives(type: .point, vertexStart: 0, vertexCount: 256 * 192)
                encoder.endEncoding()
            }

            commandBuffer.present(drawable)
            commandBuffer.commit()
        }

        /// Create a Metal texture from a CVPixelBuffer (camera frame)
        private func makeTexture(from pixelBuffer: CVPixelBuffer) -> MTLTexture? {
            guard let textureCache = textureCache else { return nil }

            let width = CVPixelBufferGetWidth(pixelBuffer)
            let height = CVPixelBufferGetHeight(pixelBuffer)

            var cvTexture: CVMetalTexture?
            let status = CVMetalTextureCacheCreateTextureFromImage(
                nil, textureCache, pixelBuffer, nil,
                .bgra8Unorm, width, height, 0, &cvTexture
            )

            guard status == kCVReturnSuccess, let texture = cvTexture else { return nil }
            return CVMetalTextureGetTexture(texture)
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
