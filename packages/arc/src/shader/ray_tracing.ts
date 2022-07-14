export var computeShader = `
struct RayPayload {
  vec3<f32> radiance;
  // vec3 scatterDirection;
  // vec3 throughput;
  // uint seed;
  // vec3 worldHitPoint;
};

struct Ray {
  // vec3<f32> origin;
  // vec3<f32> direction;
  // f32 tMin;
  // f32 tMax;

  vec2<f32> target;
};


struct RingIntersect {
  // f32 t;
  // vec3 barycentric;
  bool isClosestHit;
  // float primitiveIndex;
  f32 instanceIndex;
};

struct 2DAABB {
  min : vec2<f32>;
  max : vec2<f32>;
};




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
  materials :  array<Material>;
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

fn _isIntersectWithAABB(ray: Ray, aabb: 2DAABB) -> bool {
  var target = ray.target;
  var min = aabb.min;
  var max = aabb.max;

return target.x > min.x && target.x < max.x && target.y > min.y && target.y < max.y;
}


fn _isIntersectWithRing(ray: Ray, geometry: Geometry) -> bool {
  var target = ray.target;

  var c = geometry.c;
  var w = geometry.w;
  var r = geometry.r;

return target.x > c.x - r - w && target.x < c.x - r && target.y > c.y + r && target.y < c.y + r + w;
}


fn _intersectScene(ray: Ray)->RingIntersect {
  RingIntersect intersectResult;

  intersectResult.isClosestHit = false;
  // intersectResult.t = POSITIVE_INFINITY;

  var as: AccelerationStructure;

  for (var i : u32 = 0u; i < arrayLength(&sceneAccelerationStructure.accelerationStructures); i = i + 1u) {
    as = sceneAccelerationStructure.accelerationStructures[i];

    if (_isIntersectWithAABB(ray, 2DAABB(as.worldMin, as.worldMax))) {
var instance: Instance = sceneInstanceData.instances[as.instanceIndex]
var geometryIndex = u32(instance.geometryIndex)


 var geometry:Geometry = Geometrys.geometrys[geometryIndex]

      if (_isIntersectWithRing(ray, geometry)) {
        if (!intersectResult.isClosestHit) {
          intersectResult.isClosestHit = true;
          intersectResult.instanceIndex = as.instanceIndex;
        }
      }
    }
  }
}

fn _handleRayClosestHit(payload: ptr<private,RayPayload>, ray: Ray, intersectResult: RingIntersect)->bool {
var instance: Instance = sceneInstanceData.instances[intersectResult.instanceIndex];
var materialIndex = u32(instance.materialIndex);

 var material:Material = Materials.materials[materialIndex];

(*payload).radiance = material.color;

return false
}

fn _handleRayMiss(payload: ptr<private,RayPayload>)->bool {
(*payload).radiance = vec3<f32>(0.0, 0.0, 0.0);

return false
}

fn _traceRay(ray: Ray, payload: ptr<private,RayPayload>, isCameraRay: bool)->bool {
  RingIntersect intersectResult = _intersectScene(ray);

  if (intersectResult.isClosestHit) {
    return _handleRayClosestHit(payload, ray, intersectResult);
  }

  return _handleRayMiss(payload);
}

@compute
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
//   var vec2<u32> ipos = vec2(GlobalInvocationID.x, GlobalInvocationID.y);

//   var resolution = vec2<f32>(screenDimension.resolution)

//   vec3 pixelColor = vec3<f32>(0.0, 0.0, 0.0);


//     // vec4 origin = uCamera.viewInverse * vec4(0, 0, 0, 1);
//     vec4<f32> origin = vec4<f32>(0, 0, 0, 1);

//     var vec2<f32> sampledPixel = vec2<f32>(ipos.x + 0.5, ipos.y + 0.5);

//     var vec2<f32> uv = (sampledPixel / resolution) * 2.0 - 1.0;

//     // vec4 target = uCamera.projectionInverse * (vec4(uv.x, uv.y, -1, 1));
//     vec4<f32> target = vec4<f32>(uv.x, uv.y, -1, 1);

//     vec4<f32> direction =
//         // normalize(uCamera.viewInverse * vec4(normalize(target.xyz), 0));
//         vec4<f32>(normalize(target.xyz), 0);

//     vec3<f32> wi = direction.xyz;


//   RayPayload payload;
//     payload.radiance = vec3<f32>(0.0, 0.0, 0.0);

// _traceRay( Ray(origin.xyz, wi, uCamera.near, uCamera.far), payload);


//     pixelColor = payload.radiance;

//   var u32 pixelIndex = ipos.y * i32(resolution.x) + ipos.x;
//   pixelBuffer.pixels[pixelIndex] = vec4<f32>(pixelColor, 1.0);




  var ipos = vec2<u32>(GlobalInvocationID.x, GlobalInvocationID.y);

  var resolution = vec2<f32>(screenDimension.resolution)

  var pixelColor = vec3<f32>(0.0, 0.0, 0.0);


    // vec4 origin = uCamera.viewInverse * vec4(0, 0, 0, 1);
    var origin = vec4<f32>(0, 0, 0, 1);

    var sampledPixel = vec2<f32>(ipos.x + 0.5, ipos.y + 0.5);

    var uv = (sampledPixel / resolution) * 2.0 - 1.0;

    // vec4 target = uCamera.projectionInverse * (vec4(uv.x, uv.y, -1, 1));
    // var target = vec4<f32>(uv.x, uv.y, -1, 1);
    var target = vec3<f32>(uv.x, uv.y, 1);

    // var direction =
    //     // normalize(uCamera.viewInverse * vec4(normalize(target.xyz), 0));
    //     vec4<f32>(normalize(target.xyz), 0);

    // var wi = direction.xyz;


  RayPayload payload;
    payload.radiance = vec3<f32>(0.0, 0.0, 0.0);

// _traceRay( Ray(origin.xyz, wi, uCamera.near, uCamera.far), payload);
var isContinueBounce = _traceRay( Ray(target.xy), payload);


    pixelColor = (*payload).radiance;

  var pixelIndex = ipos.y * u32(resolution.x) + ipos.x;
  pixelBuffer.pixels[pixelIndex] = vec4<f32>(pixelColor, 1.0);
}
`