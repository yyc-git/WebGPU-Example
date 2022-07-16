export var computeShader = `
struct RayPayload {
   radiance: vec3<f32>,
}

struct Ray {
   target: vec2<f32>,
}


struct RingIntersect {
  isClosestHit: bool,
  instanceIndex: f32,
}

struct AABB2D {
  worldMin : vec2<f32>,
  worldMax : vec2<f32>,
}




struct AccelerationStructure {
  worldMin : vec2<f32>,
  worldMax : vec2<f32>,

  instanceIndex: f32,
  // TODO remove pad?
  pad_0: f32,
  pad_1: f32,
  pad_2: f32,
}

struct Instance {
  geometryIndex: f32,
  materialIndex: f32,

  localPosition: vec2<f32>,
}


struct Geometry {
  c: vec2<f32>,
  w: f32,
  r: f32,
  // // TODO remove pad?
  // pad_0: f32,
  // pad_1: f32,
}

struct Material {
  color: vec3<f32>,
  // TODO remove pad?
  pad_0: f32,
}

 struct AccelerationStructures {
  accelerationStructures : array<AccelerationStructure>,
}

 struct Instances {
  instances :  array<Instance>,
}

 struct Geometrys {
  geometrys :  array<Geometry>,
}

 struct Materials {
  materials :  array<Material>,
}

 struct Pixels {
  pixels : array<vec4<f32>>
}

 struct ScreenDimension {
  resolution : vec2<f32>
}

@binding(0) @group(0) var<storage, read> sceneAccelerationStructure :  AccelerationStructures;
@binding(1) @group(0) var<storage, read> sceneInstanceData :  Instances;
@binding(2) @group(0) var<storage, read> sceneGeometryData :  Geometrys;
@binding(3) @group(0) var<storage, read> sceneMaterialData :  Materials;

@binding(4) @group(0) var<storage, read_write> pixelBuffer :  Pixels;

@binding(5) @group(0) var<uniform> screenDimension : ScreenDimension;

fn _isIntersectWithAABB2D(ray: Ray, aabb: AABB2D) -> bool {
  var target = ray.target;
  var worldMin = aabb.worldMin;
  var worldMax = aabb.worldMax;

return target.x > worldMin.x && target.x < worldMax.x && target.y > worldMin.y && target.y < worldMax.y;
}


fn _isIntersectWithRing(ray: Ray, instance: Instance, geometry: Geometry) -> bool {
  var target = ray.target;

var localPosition = instance.localPosition;

  var c = geometry.c;
  var w = geometry.w;
  var r = geometry.r;

  var worldPosition = localPosition + c;

  var distanceSquare = pow(target.x - worldPosition.x, 2.0) + pow( target.y - worldPosition.y, 2.0);

  return distanceSquare >= pow(r, 2) && distanceSquare <= pow(r + w, 2);
}


fn _intersectScene(ray: Ray)->RingIntersect {
  var intersectResult: RingIntersect;

  intersectResult.isClosestHit = false;

  var as: AccelerationStructure;

  var length = arrayLength(&sceneAccelerationStructure.accelerationStructures);

  for (var i : u32 = 0u; i < length; i = i + 1u) {
    as = sceneAccelerationStructure.accelerationStructures[i];

    if (_isIntersectWithAABB2D(ray, AABB2D(as.worldMin, as.worldMax))) {
var instance: Instance = sceneInstanceData.instances[u32(as.instanceIndex)];
var geometryIndex = u32(instance.geometryIndex);


 var geometry:Geometry = sceneGeometryData.geometrys[geometryIndex];

      if (_isIntersectWithRing(ray,instance, geometry)) {
        if (!intersectResult.isClosestHit) {
          intersectResult.isClosestHit = true;
          intersectResult.instanceIndex = as.instanceIndex;
        }
      }
    }
  }

  return intersectResult;
}

fn _handleRayClosestHit(payload: ptr<function,RayPayload>, ray: Ray, intersectResult: RingIntersect)->bool {
var instance: Instance = sceneInstanceData.instances[u32(intersectResult.instanceIndex)];
var materialIndex = u32(instance.materialIndex);

 var material:Material = sceneMaterialData.materials[materialIndex];

(*payload).radiance = material.color;

return false;
}

fn _handleRayMiss(payload: ptr<function,RayPayload>)->bool {
(*payload).radiance = vec3<f32>(0.0, 0.0, 0.0);
// (*payload).radiance = vec3<f32>(1.0, 1.0, 0.0);

return false;
}

fn _traceRay(ray: Ray, payload: ptr<function,RayPayload>)->bool {
  var intersectResult: RingIntersect = _intersectScene(ray);

  if (intersectResult.isClosestHit) {
    return _handleRayClosestHit(payload, ray, intersectResult);
  }

  return _handleRayMiss(payload);
}

@compute @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  var ipos = vec2<u32>(GlobalInvocationID.x, GlobalInvocationID.y);

  var resolution = vec2<f32>(screenDimension.resolution);

  var pixelColor = vec3<f32>(0.0, 0.0, 0.0);


    // vec4 origin = uCamera.viewInverse * vec4(0, 0, 0, 1);
    var origin = vec4<f32>(0, 0, 0, 1);

    var sampledPixel = vec2<f32>(f32(ipos.x) + 0.5, f32(ipos.y) + 0.5);

    var uv = (sampledPixel / resolution) * 2.0 - 1.0;

    // vec4 target = uCamera.projectionInverse * (vec4(uv.x, uv.y, -1, 1));
    // var target = vec4<f32>(uv.x, uv.y, -1, 1);
    var target = vec3<f32>(uv.x, uv.y, 1);

    // var direction =
    //     // normalize(uCamera.viewInverse * vec4(normalize(target.xyz), 0));
    //     vec4<f32>(normalize(target.xyz), 0);

    // var wi = direction.xyz;


  var payload: RayPayload;
    payload.radiance = vec3<f32>(0.0, 0.0, 0.0);


var isContinueBounce = _traceRay( Ray(target.xy), &payload);


    pixelColor = payload.radiance;

  var pixelIndex = ipos.y * u32(resolution.x) + ipos.x;
  pixelBuffer.pixels[pixelIndex] = vec4<f32>(pixelColor, 1.0);
  // pixelBuffer.pixels[pixelIndex] = vec4<f32>(1.0,0.0,0.0, 1.0);
}
`