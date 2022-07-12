export const computeShader = `
struct AccelerationStructure {
  worldMin : vec2<f32>;
  worldMax : vec2<f32>;

  instanceIndex: f32;
  // TODO remove pad?
  pad_0: f32;
  pad_1: f32;
  pad_2: f32;
};

struct Instance {
  geometryIndex: f32;
  materialIndex: f32;

  position: vec2<f32>;
};


struct Geometry {
  w: f32;
  r: f32;
  // TODO remove pad?
  pad_0: f32;
  pad_1: f32;
};

struct Material {
  color: vec3<f32>;
  // TODO remove pad?
  pad_0: f32;
};

[[block]] struct AccelerationStructures {
  accelerationStructures : [[stride(32)]] array<AccelerationStructure>;
};

[[block]] struct Instances {
  instances : [[stride(16)]] array<Instance>;
};

[[block]] struct Geometrys {
  geometrys : [[stride(16)]] array<Geometry>;
};

[[block]] struct Materials {
  material : [[stride(16)]] array<Material>;
};

[[block]] struct Pixels {
  pixels : vec4<f32>
};

[[binding(0), group(0)]] var<storage> SceneAccelerationStructure : [[access(read)]] AccelerationStructures;
[[binding(1), group(0)]] var<storage> SceneInstanceData : [[access(read)]] Instances;
[[binding(2), group(0)]] var<storage> SceneGeometryData : [[access(read)]] Geometrys;
[[binding(3), group(0)]] var<storage> SceneMaterialData : [[access(read)]] Materials;

[[binding(4), group(0)]] var<storage> PixelBuffer : [[access(read_write)]] Pixels;



// [[stage(compute), workgroup_size(64)]]
[[stage(compute)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
}
`