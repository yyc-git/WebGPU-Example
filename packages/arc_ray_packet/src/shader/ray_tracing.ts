export var computeShader = `
struct Ray {
rayTarget: vec2<f32>,
}


struct RingIntersect {
  isClosestHit: bool,
  layer: u32,
  instanceIndex: f32,
}

struct TopLevel {
  screenMin : vec2<f32>,
  screenMax : vec2<f32>,

	leafInstanceOffset: f32,
	leafInstanceCountAndMaxLayer: f32,
	child1Index: f32,
	child2Index: f32
}

struct AABB2D {
  screenMin : vec2<f32>,
  screenMax : vec2<f32>,
}


  // TODO set const
// const maxDepth = 20;
// const workGroupSize = 64;

var<workgroup>stackContainer: array<TopLevel, 20>;
// var<workgroup>bvhNodeFirstActiveRayIndexs: array <u32, 20>;
// var<workgroup>rayPacketAABB: AABB2D;
var<workgroup>rayPacketAABBData: array<f32, 4>;
var<workgroup>isRayPacketAABBIntersectWithTopLevelNode: bool;
// var<workgroup>rayPacketTempForFindFirstActiveRayIndex: array<bool, 64>;
// var<workgroup>rayPacketTemp2ForFindFirstActiveRayIndex: u32;
var<workgroup>rayPacketRingIntersectLayer: array<u32, 64>;
// var<workgroup>isNodeBehindRayPacketForChild1: bool;
// var<workgroup>isNodeBehindRayPacketForChild2: bool;
// var<workgroup>hasChild1: bool;
// var<workgroup>hasChild2: bool;
var<workgroup>stackSize: u32;
// var<workgroup>child1Index: u32;
// var<workgroup>child2Index: u32;
// var<workgroup>lastFirstActiveRayIndex: u32;
var<workgroup>isAddChild1: bool;
var<workgroup>isAddChild2: bool;


struct RayPayload {
   radiance: vec3<f32>,
}




struct BottomLevel {
  screenMin : vec2<f32>,
  screenMax : vec2<f32>,

  instanceIndex: f32,
  layer: f32,
  pad_0: f32,
  pad_1: f32,
}

struct Instance {
  geometryIndex: f32,
  materialIndex: f32,

  localPosition: vec2<f32>,

  // layer: f32,
  // pad_0: f32,
  // pad_1: f32,
  // pad_2: f32,
}


struct Geometry {
  c: vec2<f32>,
  w: f32,
  r: f32,
  // pad_0: f32,
  // pad_1: f32,
}

struct Material {
  color: vec3<f32>,
  pad_0: f32,
}

 struct TopLevels {
  topLevels : array<TopLevel>,
}

 struct BottomLevels {
  bottomLevels : array<BottomLevel>,
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


@binding(0) @group(0) var<storage> topLevel : TopLevels;
@binding(1) @group(0) var<storage> bottomLevel : BottomLevels;
@binding(2) @group(0) var<storage, read> sceneInstanceData :  Instances;
@binding(3) @group(0) var<storage, read> sceneGeometryData :  Geometrys;
@binding(4) @group(0) var<storage, read> sceneMaterialData :  Materials;

@binding(5) @group(0) var<storage, read_write> pixelBuffer :  Pixels;

@binding(6) @group(0) var<uniform> screenDimension : ScreenDimension;

fn _isIntersectWithRing(pointInScreen: vec2<f32>, instance: Instance, geometry: Geometry) -> bool {
var localPosition = instance.localPosition;

  var c = geometry.c;
  var w = geometry.w;
  var r = geometry.r;

  var screenPosition = localPosition + c;

  var distanceSquare = pow(pointInScreen.x - screenPosition.x, 2.0) + pow( pointInScreen.y - screenPosition.y, 2.0);

  return distanceSquare >= pow(r, 2) && distanceSquare <= pow(r + w, 2);
}

fn _isPointIntersectWithAABB(pointInScreen: vec2<f32>, screenMin: vec2<f32>, screenMax: vec2<f32>) -> bool {
return pointInScreen.x > screenMin.x && pointInScreen.x < screenMax.x && pointInScreen.y > screenMin.y && pointInScreen.y < screenMax.y;
}

fn _isPointIntersectWithTopLevelNode(pointInScreen: vec2<f32>, node: TopLevel) -> bool {
return _isPointIntersectWithAABB(pointInScreen, node.screenMin, node. screenMax);
}

fn _isLeafNode(leafInstanceCount:u32) -> bool {
  return leafInstanceCount != 0;
}

fn _hasChild(childIndex: u32) -> bool {
  return childIndex != 0;
}

fn _getMaxLayer(leafInstanceCountAndMaxLayer: u32) -> u32 {
  return leafInstanceCountAndMaxLayer & 0xff;
}

fn _getLeafInstanceCount(leafInstanceCountAndMaxLayer: u32) -> u32 {
  return (leafInstanceCountAndMaxLayer >> 8) & 0xffffff;
}

// fn _isAABBIntersection(aabb1:AABB2D, aabb2:AABB2D) ->bool {
// 	if(aabb2.screenMax.x < aabb1.screenMin.x || aabb2.screenMin.x > aabb1.screenMax.x ||
// 		aabb2.screenMax.y < aabb1.screenMin.y || aabb2.screenMin.y > aabb1.screenMax.y ){
//       return false;
//     } 

//     return true;
// }

// fn _isAABBIntersection(minX1:f32, minY1:f32, maxX1:f32, maxY1:f32, 
//   minX2:f32, minY2:f32, maxX2:f32, maxY2:f32
//   ) ->bool {
// 	if(maxX2 < minX1 || minX2 > maxX1 ||
// 		maxY2 < minY1 || minY2 > maxY1 ){
//       return false;
//     } 

//     return true;
// }


fn _isAABBIntersection(aabbData1:array<f32, 4>, 
screenMin2:vec2<f32>,
screenMax2:vec2<f32>,
  ) ->bool {
	if(screenMax2.x < aabbData1[0] || screenMin2.x > aabbData1[2] ||
		screenMax2.y < aabbData1[1] || screenMin2.y > aabbData1[3] ){
      return false;
    } 

    return true;
}


fn _isRayPacketAABBIntersectWithTopLevelNode(aabbData:array<f32, 4>, node:TopLevel) ->bool {
    // var nodeAABB:AABB2D;
    // nodeAABB.screenMin = node.screenMin;
    // nodeAABB.screenMax = node.screenMax;

	return _isAABBIntersection(aabbData, node.screenMin, node.screenMax);
}

// fn _findFirstActiveRayIndex(firstActiveRayIndex:u32,pointInScreen: vec2<f32>, LocalInvocationIndex : u32, node: TopLevel) -> u32 {
//     if(LocalInvocationIndex == 0){
//         var result:u32 = 100;
//         for (var s: u32 = 0; s < 64; s +=1) {
//             if(rayPacketTempForFindFirstActiveRayIndex[s]){
//                 result = s;
//                 break;
//             }
//         }

// rayPacketTemp2ForFindFirstActiveRayIndex = result;
//     }


//     workgroupBarrier();

//     return rayPacketTemp2ForFindFirstActiveRayIndex + firstActiveRayIndex;
// }

fn _getPositiveInfinity()->u32{
  return 1000000;
}

// fn _getNegativeInfinity()->f32{
//   return -1000000.0;
// }

fn _getMultiplierForBuildRayPacketAABB(firstActiveRayIndex:u32) -> f32{

 if(firstActiveRayIndex < 8){
  return 0.0;
 }
 if(firstActiveRayIndex < 16){
  return 1.0;
 }
 if(firstActiveRayIndex < 24){
  return 2.0;
 }
 if(firstActiveRayIndex < 32){
  return 3.0;
 }
 if(firstActiveRayIndex < 40){
  return 4.0;
 }
 if(firstActiveRayIndex < 48){
  return 5.0;
 }
 if(firstActiveRayIndex < 56){
  return 6.0;
 }
//  if(firstActiveRayIndex < 64){
//   return 7.0;
//  }

  return 7.0;
}

fn _minForRayPacketRingIntersectLayer(index1: u32, index2: u32) {
  rayPacketRingIntersectLayer[index1] = min(rayPacketRingIntersectLayer[index1], rayPacketRingIntersectLayer[index2]);
}

fn _intersectScene(ray: Ray, LocalInvocationIndex : u32) -> RingIntersect {
  var intersectResult: RingIntersect;

  intersectResult.isClosestHit = false;
  intersectResult.layer = 0;

  var rootNode = topLevel.topLevels[0];

  var pointInScreen = ray.rayTarget;

  if (LocalInvocationIndex == 0) {
    rayPacketAABBData[0] = pointInScreen.x;
    rayPacketAABBData[1] = pointInScreen.y;
  }
  if (LocalInvocationIndex == 63) {
    rayPacketAABBData[2] = pointInScreen.x;
    rayPacketAABBData[3] = pointInScreen.y;
  }

  if (LocalInvocationIndex == 1) {
    stackSize = 1;

    stackContainer[0] = rootNode;
  }

  workgroupBarrier();

  while (stackSize > 0) {
    workgroupBarrier();

    if (LocalInvocationIndex == 0) {
      stackSize -= 1;
    }

    workgroupBarrier();


    var currentNode = stackContainer[stackSize];
    var leafInstanceCountAndMaxLayer = u32(currentNode.leafInstanceCountAndMaxLayer);

    var leafInstanceCount = _getLeafInstanceCount(leafInstanceCountAndMaxLayer);

    if (_isLeafNode(leafInstanceCount)) {
      if (_isPointIntersectWithTopLevelNode(pointInScreen, currentNode)) {
        var leafInstanceOffset = u32(currentNode.leafInstanceOffset);

        var maxLayer = _getMaxLayer(u32(currentNode.leafInstanceCountAndMaxLayer));

        // var isBreak = false;
        while (leafInstanceCount > 0) {
          // var bottomLevel = bottomLevel.bottomLevels[leafInstanceOffset];

          // if (!isBreak && _isPointIntersectWithAABB(pointInScreen, bottomLevel.screenMin, bottomLevel.screenMax)) {
          //   var instance: Instance = sceneInstanceData.instances[u32(bottomLevel.instanceIndex)];
          //   var geometry: Geometry = sceneGeometryData.geometrys[u32(instance.geometryIndex)];

          //   if (_isIntersectWithRing(pointInScreen, instance, geometry)) {
          //     var layer = u32(bottomLevel.layer);

          //     if (!intersectResult.isClosestHit || layer > intersectResult.layer) {
          //       intersectResult.isClosestHit = true;
          //       intersectResult.layer = layer;
          //       intersectResult.instanceIndex = bottomLevel.instanceIndex;

          //       if (layer == maxLayer) {
          //         isBreak = true;
          //       }
          //     }
          //   }
          // }


          var bottomLevel = bottomLevel.bottomLevels[leafInstanceOffset];
          if (_isPointIntersectWithAABB(pointInScreen, bottomLevel.screenMin, bottomLevel.screenMax)) {
            var instance: Instance = sceneInstanceData.instances[u32(bottomLevel.instanceIndex)];
            var geometry: Geometry = sceneGeometryData.geometrys[u32(instance.geometryIndex)];

            if (_isIntersectWithRing(pointInScreen, instance, geometry)) {
              var layer = u32(bottomLevel.layer);

              if (!intersectResult.isClosestHit || layer > intersectResult.layer) {
                intersectResult.isClosestHit = true;
                intersectResult.layer = layer;
                intersectResult.instanceIndex = bottomLevel.instanceIndex;
              }
            }
          }

          leafInstanceCount = leafInstanceCount - 1;
          leafInstanceOffset = leafInstanceOffset + 1;
        }
      }
    }
    else {
      var child1Node = topLevel.topLevels[u32(currentNode.child1Index)];
      var child2Node = topLevel.topLevels[u32(currentNode.child2Index)];

      var child1NodeMaxLayer = _getMaxLayer(u32(child1Node.leafInstanceCountAndMaxLayer));
      var child2NodeMaxLayer = _getMaxLayer(u32(child2Node.leafInstanceCountAndMaxLayer));

      rayPacketRingIntersectLayer[LocalInvocationIndex] = intersectResult.layer;

      workgroupBarrier();

      if (LocalInvocationIndex < 32) {
        _minForRayPacketRingIntersectLayer(LocalInvocationIndex, LocalInvocationIndex + 32);
      }
      workgroupBarrier();
      if (LocalInvocationIndex < 16) {
        _minForRayPacketRingIntersectLayer(LocalInvocationIndex, LocalInvocationIndex + 16);
      }
      workgroupBarrier();
      if (LocalInvocationIndex < 8) {
        _minForRayPacketRingIntersectLayer(LocalInvocationIndex, LocalInvocationIndex + 8);
      }
      workgroupBarrier();
      if (LocalInvocationIndex < 4) {
        _minForRayPacketRingIntersectLayer(LocalInvocationIndex, LocalInvocationIndex + 4);
      }
      workgroupBarrier();
      if (LocalInvocationIndex < 2) {
        _minForRayPacketRingIntersectLayer(LocalInvocationIndex, LocalInvocationIndex + 2);
      }
      workgroupBarrier();

      // if (LocalInvocationIndex == 0) {
      //   isNodeBehindRayPacketForChild1 = child1NodeMaxLayer <= rayPacketRingIntersectLayer[0];
      //   isNodeBehindRayPacketForChild2 = child2NodeMaxLayer <= rayPacketRingIntersectLayerForChild2[0];
      // }
      // workgroupBarrier();


      if (LocalInvocationIndex == 0) {
        isAddChild1 = child1NodeMaxLayer > rayPacketRingIntersectLayer[0] && _isRayPacketAABBIntersectWithTopLevelNode(rayPacketAABBData, child1Node); 
      }
      if (LocalInvocationIndex == 1) {
        isAddChild2 = child2NodeMaxLayer > rayPacketRingIntersectLayer[0] && _isRayPacketAABBIntersectWithTopLevelNode(rayPacketAABBData, child2Node);
      }

      workgroupBarrier();

      if (LocalInvocationIndex == 0) {
        if (isAddChild1) {
          stackContainer[stackSize ] = child1Node;

          stackSize += 1;
        }

        if (isAddChild2) {
          stackContainer[stackSize ] = child2Node;

          stackSize += 1;
        }
      }
      }

      workgroupBarrier();
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

fn _traceRay(ray: Ray, payload: ptr<function,RayPayload>, LocalInvocationIndex: u32) ->bool {
  var intersectResult: RingIntersect = _intersectScene(ray, LocalInvocationIndex);

  if (intersectResult.isClosestHit) {
    return _handleRayClosestHit(payload, ray, intersectResult);
  }

  return _handleRayMiss(payload);
}

@compute @workgroup_size(8, 8, 1)
fn main(
@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>, 
@builtin(local_invocation_index) LocalInvocationIndex : u32,
    ) {
  var ipos = vec2<u32>(GlobalInvocationID.x, GlobalInvocationID.y);

  var resolution = vec2<f32>(screenDimension.resolution);

  var pixelColor = vec3<f32>(0.0, 0.0, 0.0);


    // vec4 origin = uCamera.viewInverse * vec4(0, 0, 0, 1);
    var origin = vec4<f32>(0, 0, 0, 1);

    var sampledPixel = vec2<f32>(f32(ipos.x) + 0.5, f32(ipos.y) + 0.5);

    var uv = (sampledPixel / resolution) * 2.0 - 1.0;

    // vec4 rayTarget = uCamera.projectionInverse * (vec4(uv.x, uv.y, -1, 1));
    // var rayTarget = vec4<f32>(uv.x, uv.y, -1, 1);
    var rayTarget = vec3<f32>(uv.x, uv.y, 1);

    // var direction =
    //     // normalize(uCamera.viewInverse * vec4(normalize(rayTarget.xyz), 0));
    //     vec4<f32>(normalize(rayTarget.xyz), 0);

    // var wi = direction.xyz;


  var payload: RayPayload;
    payload.radiance = vec3<f32>(0.0, 0.0, 0.0);


var isContinueBounce = _traceRay( Ray(rayTarget.xy), &payload, LocalInvocationIndex);


    pixelColor = payload.radiance;

  var pixelIndex = ipos.y * u32(resolution.x) + ipos.x;
  pixelBuffer.pixels[pixelIndex] = vec4<f32>(pixelColor, 1.0);
  // pixelBuffer.pixels[pixelIndex] = vec4<f32>(1.0,0.0,0.0, 1.0);
}
`