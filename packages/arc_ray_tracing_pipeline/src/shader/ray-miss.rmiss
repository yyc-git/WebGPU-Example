#version 460
#extension GL_EXT_ray_tracing : enable
#pragma shader_stage(miss)

// TODO refactor: duplicate
struct RayPayload {
  vec3 radiance;
};

layout(location = 0) rayPayloadInEXT RayPayload payload;

void main() { payload.radiance = vec3(0.0); }
