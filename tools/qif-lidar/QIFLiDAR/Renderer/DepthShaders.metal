#include <metal_stdlib>
using namespace metal;

// ═══════════════════════════════════════════════════
// Camera Passthrough — full-screen textured quad
// Renders the RGB camera feed as the background layer
// ═══════════════════════════════════════════════════

struct CameraVertexOut {
    float4 position [[position]];
    float2 texCoord;
};

vertex CameraVertexOut cameraVertex(
    uint vertexID [[vertex_id]],
    constant float *vertices [[buffer(0)]]
) {
    // Each vertex: pos.x, pos.y, tex.u, tex.v (4 floats)
    uint idx = vertexID * 4;
    CameraVertexOut out;
    out.position = float4(vertices[idx], vertices[idx + 1], 0.0, 1.0);
    out.texCoord = float2(vertices[idx + 2], vertices[idx + 3]);
    return out;
}

fragment float4 cameraFragment(
    CameraVertexOut in [[stage_in]],
    texture2d<float> cameraTexture [[texture(0)]]
) {
    constexpr sampler s(mag_filter::linear, min_filter::linear);
    return cameraTexture.sample(s, in.texCoord);
}


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
    int orientation;        // 0=portrait, 1=landscapeLeft, 2=landscapeRight
};

// ═══════════════════════════════════════════════════
// Color Ramp — Phosphene-informed depth palette
// Bright teal (near) → blue → dim blue-grey → dark (far)
// Brightness = proximity (accurate to prosthetic vision)
// Blue/teal hues within reported phosphene color range
// ═══════════════════════════════════════════════════

float4 lidarColorRamp(float t) {
    // t = 0.0 (nearest) → 1.0 (farthest)
    float3 c;
    if (t < 0.25) {
        // Very near: bright teal
        c = mix(float3(0.0, 1.0, 0.9), float3(0.0, 0.8, 0.85), t / 0.25);
    } else if (t < 0.5) {
        // Near: teal → bright blue
        c = mix(float3(0.0, 0.8, 0.85), float3(0.15, 0.4, 0.9), (t - 0.25) / 0.25);
    } else if (t < 0.75) {
        // Mid: blue → dim blue-grey
        c = mix(float3(0.15, 0.4, 0.9), float3(0.15, 0.2, 0.4), (t - 0.5) / 0.25);
    } else {
        // Far: dim blue-grey → near-black
        c = mix(float3(0.15, 0.2, 0.4), float3(0.05, 0.06, 0.1), (t - 0.75) / 0.25);
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

    uint px = vertexID % width;
    uint py = vertexID / width;

    float depth = depthData[vertexID];

    // Normalize depth to 0–1
    float t = saturate((depth - uniforms.depthRange.x) / (uniforms.depthRange.y - uniforms.depthRange.x));

    // ─── Rotate depth pixel coords to match device orientation ───
    // ARKit depth map is always in landscape-left (256w × 192h)
    // In portrait mode, we rotate 90° clockwise so depth aligns with camera
    float normX, normY;
    if (uniforms.orientation == 0) {
        // Portrait: rotate 90° CW — depth x→screen y, depth y→screen x (flipped)
        normX = 1.0 - float(py) / uniforms.resolution.y;
        normY = float(px) / uniforms.resolution.x;
    } else {
        // Landscape: use as-is
        normX = float(px) / uniforms.resolution.x;
        normY = float(py) / uniforms.resolution.y;
    }

    // ─── Map to screen coordinates ───
    float2 screenPos = float2(
        normX * 2.0 - 1.0,
        1.0 - normY * 2.0
    );

    // ─── Particle size: fill screen without gaps ───
    // In portrait, screen maps 192 depth pixels across width, 256 across height
    // Use the larger ratio to ensure full coverage
    float sizeX = uniforms.screenSize.x / (uniforms.orientation == 0 ? uniforms.resolution.y : uniforms.resolution.x);
    float sizeY = uniforms.screenSize.y / (uniforms.orientation == 0 ? uniforms.resolution.x : uniforms.resolution.y);
    float baseSize = max(sizeX, sizeY) * 0.95;
    float depthScale = mix(1.2, 0.8, t);
    float particleSize = baseSize * depthScale;

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
// Fragment Shader: Glass Circle Particles
//
// Matches the qinnovate.com hero wave particle style:
// Hard circular cutoff, bright edge ring, soft translucent fill.
// ═══════════════════════════════════════════════════

fragment float4 depthFragment(
    VertexOut in [[stage_in]],
    float2 pointCoord [[point_coord]]
) {
    float dist = length(pointCoord - float2(0.5));

    // Hard circle cutoff
    if (dist > 0.475) discard_fragment();

    // Glass effect: brighter edge ring + softer center fill
    float ring = smoothstep(0.35, 0.475, dist) * 0.6;
    float fill = smoothstep(0.475, 0.0, dist) * 0.45;
    float alpha = fill + ring;

    float3 col = in.color.rgb + ring * 0.4;

    return float4(col, alpha);
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
    float dist = length(pointCoord - float2(0.5));
    if (dist > 0.475) discard_fragment();

    float ring = smoothstep(0.35, 0.475, dist) * 0.6;
    float fill = smoothstep(0.475, 0.0, dist) * 0.45;
    float alpha = fill + ring;

    float3 col;
    if (isGuideDog[0] > 0.5) {
        // Guide dog: bright green glass circles
        col = float3(0.1, 1.0, 0.4) + ring * 0.4;
        alpha += 0.2;
    } else {
        // Background: dim grey glass circles
        float gray = mix(0.12, 0.04, in.depth / 5.0);
        col = float3(gray, gray, gray * 1.1) + ring * 0.2;
    }

    return float4(col, alpha);
}
