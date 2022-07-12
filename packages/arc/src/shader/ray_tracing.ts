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

  // position: vec2<f32>;

  // TODO remove pad?
  pad_0: f32;
  pad_1: f32;
};


struct Geometry {
  c: vec2<f32>;
  w: f32;
  r: f32;
  // // TODO remove pad?
  // pad_0: f32;
  // pad_1: f32;
};

struct Material {
  color: vec3<f32>;
  // TODO remove pad?
  pad_0: f32;
};

 struct AccelerationStructures {
  accelerationStructures : array<AccelerationStructure>;
};

 struct Instances {
  instances :  array<Instance>;
};

 struct Geometrys {
  geometrys :  array<Geometry>;
};

 struct Materials {
  material :  array<Material>;
};

 struct Pixels {
  pixels : vec4<f32>
};

 struct ScreenDimension {
  resolution : vec2<f32>
};

@binding(0) @group(0) var<storage, read> sceneAccelerationStructure :  AccelerationStructures;
@binding(1) @group(0) var<storage, read> sceneInstanceData :  Instances;
@binding(2) @group(0) var<storage, read> sceneGeometryData :  Geometrys;
@binding(3) @group(0) var<storage, read> sceneMaterialData :  Materials;

@binding(4) @group(0) var<storage, read_write> pixelBuffer :  Pixels;

@binding(5) @group(0) var<uniform> screenDimension : ScreenDimension;



@compute
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
}
`