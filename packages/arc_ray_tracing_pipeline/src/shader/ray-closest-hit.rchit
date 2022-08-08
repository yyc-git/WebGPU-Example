#version 460
#extension GL_EXT_ray_tracing : require
#extension GL_EXT_nonuniform_qualifier : enable
#extension GL_EXT_scalar_block_layout : enable

#pragma shader_stage(closest)

// TODO refactor: duplicate
struct RayPayload {
  vec3 radiance;
  vec2 target;
};

struct Instance {
  // /*
  //  because scalar not work(not support float objId; mat4 modelMatrix;),
  //  so all aligned to vec4
  //  */

  // include geometryIndex, materialIndex, localPosition
  // vec4 compressedData;

  float geometryIndex;
  float materialIndex;
  // vec2 localPosition;
  float pad_0;
  float pad_1;
};

// struct Geometry {
//   vec2 c;
//   float w;
//   float r;
// };

struct Material {
  vec3 color;
  float pad_0;
};

layout(location = 0) rayPayloadInEXT RayPayload payload;

layout(std140, set = 0, binding = 2) buffer SceneInstanceData {
  Instance instances[];
}
sceneInstanceData;

layout(std140, set = 0, binding = 4) buffer SceneMaterialData {
  Material materials[];
}
sceneMaterialData;

void main() {
  uint instanceIndex = gl_InstanceID;

  Instance instance = sceneInstanceData.instances[instanceIndex];
  uint materialIndex = uint(instance.materialIndex);

  Material material = sceneMaterialData.materials[materialIndex];

  // if (instanceIndex % 2 == 0) {
  //   payload.radiance = vec3(1.0, 0.0, 0.0);
  // } else {
  //   payload.radiance = vec3(0.0, 1.0, 0.0);
  // }
  payload.radiance = material.color;

  // payload.radiance = vec3(1.0,0.0,0.0);
}