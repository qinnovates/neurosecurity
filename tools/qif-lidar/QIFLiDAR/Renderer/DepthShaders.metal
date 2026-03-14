#include <metal_stdlib>
using namespace metal;

/// Vertex output for 3D depth particle rendering
struct VertexOut {
    float4 position [[position]];
    float4 color;
    float pointSize [[point_size]];
    float depth;
};

/// Uniforms passed from Swift each frame
struct Uniforms {
    float2 resolution;      // depth map width, height (256, 192)
    float2 depthRange;      // min, max depth in meters (0.1, 5.0)
    float2 screenSize;      // render target pixel size
    float time;             // seconds since start — drives particle animation
    float focalLength;      // camera focal length in pixels (~240)
};

// ═══════════════════════════════════════════════════
// Color Ramp — the classic LiDAR depth visualization
// Red (near) → Orange → Yellow → Green → Cyan → Blue (far)
// Same spectrum used by Velodyne, Kinect depth view, and
// every LiDAR point cloud viewer
// ═══════════════════════════════════════════════════

float4 lidarColorRamp(float t) {
    // t = 0.0 (nearest) → 1.0 (farthest)
    float3 c;
    if (t < 0.16) {
        // Very near: hot red → orange
        c = mix(float3(1.0, 0.0, 0.1), float3(1.0, 0.5, 0.0), t / 0.16);
    } else if (t < 0.33) {
        // Near: orange → yellow
        c = mix(float3(1.0, 0.5, 0.0), float3(1.0, 1.0, 0.0), (t - 0.16) / 0.17);
    } else if (t < 0.5) {
        // Mid-near: yellow → green
        c = mix(float3(1.0, 1.0, 0.0), float3(0.0, 1.0, 0.2), (t - 0.33) / 0.17);
    } else if (t < 0.66) {
        // Mid-far: green → cyan
        c = mix(float3(0.0, 1.0, 0.2), float3(0.0, 0.9, 1.0), (t - 0.5) / 0.16);
    } else if (t < 0.83) {
        // Far: cyan → blue
        c = mix(float3(0.0, 0.9, 1.0), float3(0.1, 0.3, 1.0), (t - 0.66) / 0.17);
    } else {
        // Very far: blue → deep purple
        c = mix(float3(0.1, 0.3, 1.0), float3(0.3, 0.0, 0.5), (t - 0.83) / 0.17);
    }
    return float4(c, 1.0);
}


// ═══════════════════════════════════════════════════
// Vertex Shader: 3D Particle Cloud
//
// Each depth pixel becomes a particle positioned in 3D space.
// Near particles: large, bright, red/orange
// Far particles: small, dim, blue/purple
// Subtle wave animation gives the flowing particle feel.
// ═══════════════════════════════════════════════════

vertex VertexOut depthVertex(
    uint vertexID [[vertex_id]],
    constant float *depthData [[buffer(0)]],
    constant Uniforms &uniforms [[buffer(1)]]
) {
    uint width = uint(uniforms.resolution.x);
    uint height = uint(uniforms.resolution.y);

    uint px = vertexID % width;
    uint py = vertexID / width;

    float depth = depthData[vertexID];

    // Normalize depth to 0–1
    float t = saturate((depth - uniforms.depthRange.x) / (uniforms.depthRange.y - uniforms.depthRange.x));

    // ─── 3D camera-space position from depth + pixel coordinates ───
    float fx = uniforms.focalLength;
    float fy = uniforms.focalLength;
    float cx = uniforms.resolution.x * 0.5;
    float cy = uniforms.resolution.y * 0.5;

    float3 pos3D = float3(
        (float(px) - cx) / fx * depth,
        (float(py) - cy) / fy * depth,
        depth
    );

    // ─── Subtle particle wave animation ───
    // Particles breathe and drift slightly — gives the living cloud feel
    float wave = sin(uniforms.time * 1.2 + pos3D.x * 4.0 + pos3D.z * 2.5) * 0.002;
    pos3D.y += wave;
    pos3D.x += cos(uniforms.time * 0.7 + pos3D.y * 3.0) * 0.0015;

    // ─── Perspective projection to screen ───
    float2 screenPos = float2(
        (pos3D.x * fx / depth + cx) / uniforms.resolution.x * 2.0 - 1.0,
        1.0 - (pos3D.y * fy / depth + cy) / uniforms.resolution.y * 2.0
    );

    // ─── Particle size: near = large, far = small ───
    float baseSize = uniforms.screenSize.x / uniforms.resolution.x;
    float depthScale = mix(3.0, 0.5, t);
    float particleSize = baseSize * depthScale;

    // Organic size variation
    float sizeJitter = sin(float(vertexID) * 73.1 + uniforms.time * 0.5) * 0.12 + 1.0;
    particleSize *= sizeJitter;

    VertexOut out;
    out.position = float4(screenPos, t, 1.0);
    out.color = lidarColorRamp(t);
    out.pointSize = max(particleSize, 1.0);
    out.depth = depth;

    // Hide invalid depth
    if (depth <= 0.0 || depth > uniforms.depthRange.y) {
        out.position = float4(0, 0, -2, 1);
        out.pointSize = 0;
    }

    // Fade edges of depth range
    float edgeFade = smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.95, t);
    out.color.a *= edgeFade;

    return out;
}


// ═══════════════════════════════════════════════════
// Fragment Shader: Soft Glowing Particles
//
// Each point renders as a soft circular glow, not a hard square.
// Bright core + gaussian falloff = the particle cloud aesthetic.
// ═══════════════════════════════════════════════════

fragment float4 depthFragment(
    VertexOut in [[stage_in]],
    float2 pointCoord [[point_coord]]
) {
    // Distance from particle center (0 = center, 0.5 = edge)
    float2 center = pointCoord - float2(0.5);
    float dist = length(center);

    // Soft gaussian glow
    float glow = exp(-dist * dist * 8.0);

    // Hot bright core
    float core = exp(-dist * dist * 24.0) * 0.4;

    float4 color = in.color;
    color.rgb += core;
    color.a *= glow;

    if (color.a < 0.01) discard_fragment();

    return color;
}


// ═══════════════════════════════════════════════════
// Guide Dog Fragment: dog = bright green glow,
// everything else = dim grayscale particles
// ═══════════════════════════════════════════════════

fragment float4 guideDogFragment(
    VertexOut in [[stage_in]],
    float2 pointCoord [[point_coord]],
    constant float *isGuideDog [[buffer(3)]]
) {
    float2 center = pointCoord - float2(0.5);
    float dist = length(center);
    float glow = exp(-dist * dist * 8.0);
    float core = exp(-dist * dist * 24.0) * 0.5;

    float4 color;
    if (isGuideDog[0] > 0.5) {
        // Guide dog: bright green with strong glow
        color = float4(0.1, 1.0, 0.4, 1.0);
        color.rgb += core * float3(0.5, 1.0, 0.5);
    } else {
        // Background: dim grayscale depth
        float gray = mix(0.12, 0.04, in.depth / 5.0);
        color = float4(gray, gray, gray * 1.1, 0.5);
    }

    color.a *= glow;
    if (color.a < 0.01) discard_fragment();

    return color;
}
