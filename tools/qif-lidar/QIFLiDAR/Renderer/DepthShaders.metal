#include <metal_stdlib>
using namespace metal;

/// Vertex output for depth point rendering
struct VertexOut {
    float4 position [[position]];
    float4 color;
    float pointSize [[point_size]];
};

/// Viridis-inspired color ramp for depth visualization
/// Near = warm (yellow), Far = cool (purple)
float4 depthToColor(float depth, float minDepth, float maxDepth) {
    float t = saturate((depth - minDepth) / (maxDepth - minDepth));

    // Viridis approximation
    float3 c0 = float3(0.267, 0.004, 0.329);  // purple (near)
    float3 c1 = float3(0.282, 0.140, 0.458);
    float3 c2 = float3(0.127, 0.566, 0.551);
    float3 c3 = float3(0.993, 0.906, 0.144);  // yellow (far)

    float3 color;
    if (t < 0.33) {
        color = mix(c0, c1, t / 0.33);
    } else if (t < 0.66) {
        color = mix(c1, c2, (t - 0.33) / 0.33);
    } else {
        color = mix(c2, c3, (t - 0.66) / 0.34);
    }

    return float4(color, 1.0);
}

/// Per-point vertex shader — positions depth pixels in screen space
vertex VertexOut depthVertex(
    uint vertexID [[vertex_id]],
    constant float *depthData [[buffer(0)]],
    constant float2 *resolution [[buffer(1)]],
    constant float2 *depthRange [[buffer(2)]]
) {
    uint width = uint(resolution[0].x);
    uint height = uint(resolution[0].y);

    uint x = vertexID % width;
    uint y = vertexID / width;

    float depth = depthData[vertexID];

    // Map pixel coordinates to NDC (-1 to 1)
    float2 ndc = float2(
        (float(x) / float(width)) * 2.0 - 1.0,
        1.0 - (float(y) / float(height)) * 2.0  // flip Y
    );

    VertexOut out;
    out.position = float4(ndc, 0.0, 1.0);
    out.color = depthToColor(depth, depthRange[0].x, depthRange[0].y);
    out.pointSize = 3.0;

    // Hide invalid depth values
    if (depth <= 0.0 || depth > 5.0) {
        out.position = float4(0, 0, -2, 1);  // behind camera
    }

    return out;
}

/// Fragment shader — outputs the interpolated color
fragment float4 depthFragment(VertexOut in [[stage_in]]) {
    return in.color;
}

/// Guide dog highlight shader — renders matched dog region in bright green,
/// everything else in muted grayscale depth
fragment float4 guideDogFragment(
    VertexOut in [[stage_in]],
    constant float *isGuideDog [[buffer(3)]]
) {
    if (isGuideDog[0] > 0.5) {
        return float4(0.2, 0.95, 0.4, 1.0);  // bright green
    }
    // Muted grayscale for non-dog regions
    float gray = dot(in.color.rgb, float3(0.299, 0.587, 0.114)) * 0.3;
    return float4(gray, gray, gray, 1.0);
}
