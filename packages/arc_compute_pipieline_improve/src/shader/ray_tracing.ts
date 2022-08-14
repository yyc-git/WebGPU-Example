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

// var<workgroup>rayPacketRingIntersects: array<RingIntersect, 64>;
var<workgroup>stackContainer: array<TopLevel, 20>;
// var<workgroup>stackSize: u32;
var<workgroup>bvhNodeFirstActiveRayIndexs: array <u32, 20>;
// var<workgroup>rayPacketAABB: AABB2D;
var<workgroup>isRayPacketAABBIntersectWithTopLevelNode: bool;
// var<workgroup>rayPacketPointInScreenForFindMin: array<vec2<f32>, 64>;
// var<workgroup>rayPacketPointInScreenForFindMax: array<vec2<f32>, 64>;
var<workgroup>rayPacketTempForFindFirstActiveRayIndex: array<bool, 64>;
var<workgroup>rayPacketTemp2ForFindFirstActiveRayIndex: u32;


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

// fn _isIntersectWithAABB2D(ray: Ray, aabb: AABB2D) -> bool {
//   var rayTarget = ray.rayTarget;
//   var screenMin = aabb.screenMin;
//   var screenMax = aabb.screenMax;

// return rayTarget.x > screenMin.x && rayTarget.x < screenMax.x && rayTarget.y > screenMin.y && rayTarget.y < screenMax.y;
// }


// fn _isIntersectWithRing(ray: Ray, instance: Instance, geometry: Geometry) -> bool {
fn _isIntersectWithRing(pointInScreen: vec2<f32>, instance: Instance, geometry: Geometry) -> bool {
  // var rayTarget = ray.rayTarget;

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

// fn _buildRayPacketAABB (firstActiveRayIndex:u32,pointInScreen: vec2<f32>, LocalInvocationIndex : u32) {
// if(LocalInvocationIndex>= firstActiveRayIndex){
//     rayPacketAABB.screenMin = vec2<f32>(min(rayPacketAABB.screenMin.x, pointInScreen.x), min(rayPacketAABB.screenMin.y, pointInScreen.y));
//     rayPacketAABB.screenMax = vec2<f32>(max(rayPacketAABB.screenMax.x, pointInScreen.x), max(rayPacketAABB.screenMax.y, pointInScreen.y));
// }

// // workgroupBarrier();
// }

fn _isAABBIntersection(aabb1:AABB2D, aabb2:AABB2D) ->bool {
	if(aabb2.screenMax.x < aabb1.screenMin.x || aabb2.screenMin.x > aabb1.screenMax.x ||
		aabb2.screenMax.y < aabb1.screenMin.y || aabb2.screenMin.y > aabb1.screenMax.y ){
      return false;
    } 

    return true;
}

fn _isRayPacketAABBIntersectWithTopLevelNode(aabb:AABB2D, node:TopLevel) ->bool {
    var nodeAABB:AABB2D;
    nodeAABB.screenMin = node.screenMin;
    nodeAABB.screenMax = node.screenMax;

	return _isAABBIntersection(aabb, nodeAABB);
}

fn _findFirstActiveRayIndex(firstActiveRayIndex:u32,pointInScreen: vec2<f32>, LocalInvocationIndex : u32, node: TopLevel) -> u32 {
    // if(LocalInvocationIndex >= firstActiveRayIndex && _isPointIntersectWithTopLevelNode(pointInScreen, node)){
    //     rayPacketTempForFindFirstActiveRayIndex[LocalInvocationIndex - firstActiveRayIndex] = true;
    // }

    // workgroupBarrier();

    if(LocalInvocationIndex == 0){
        var result:u32 = 100;
        for (var s: u32 = 0; s < 64; s +=1) {
            if(rayPacketTempForFindFirstActiveRayIndex[s]){
                result = s;
                break;
            }
        }

rayPacketTemp2ForFindFirstActiveRayIndex = result;
    }


    workgroupBarrier();

    // return result + firstActiveRayIndex;
    return rayPacketTemp2ForFindFirstActiveRayIndex + firstActiveRayIndex;
}

fn _getPositiveInfinity()->f32{
  return 1000000.0;
}

fn _getNegativeInfinity()->f32{
  return -1000000.0;
}

fn _getMultiplierForBuildRayPacketAABB(firstActiveRayIndex:u32) -> u32{

 if(firstActiveRayIndex < 8){
  return 0;
 }
 if(firstActiveRayIndex < 16){
  return 1;
 }
 if(firstActiveRayIndex < 24){
  return 2;
 }
 if(firstActiveRayIndex < 32){
  return 3;
 }
 if(firstActiveRayIndex < 40){
  return 4;
 }
 if(firstActiveRayIndex < 48){
  return 5;
 }
 if(firstActiveRayIndex < 56){
  return 6;
 }
//  if(firstActiveRayIndex < 64){
//   return 7;
//  }

  return 7;
}

// fn _convertStartFromLeftBottomToLeftTop(LocalInvocationIndex : u32) -> u32 {

// }

fn _intersectScene(ray: Ray, LocalInvocationIndex : u32) -> RingIntersect {
  var intersectResult: RingIntersect;

  intersectResult.isClosestHit = false;
  intersectResult.layer = 0;

// rayPacketRingIntersects[LocalInvocationIndex] = intersectResult;

var rootNode = topLevel.topLevels[0];

// TODO use const
if(LocalInvocationIndex < 20){
bvhNodeFirstActiveRayIndexs[LocalInvocationIndex] = 0;
}

if(LocalInvocationIndex == 0){
// stackSize = 1;

stackContainer[0] = rootNode;
}


workgroupBarrier();

var child1Index: u32;
var child2Index: u32;


var pointInScreen = ray.rayTarget;

// var localStackSize:u32;
var localStackSize = 1;

while(localStackSize > 0){
        rayPacketTempForFindFirstActiveRayIndex[LocalInvocationIndex] = false;

//         if(LocalInvocationIndex == 0){
//             // stackSize = localStackSize;


// // rayPacketAABB.screenMin = vec2<f32>(_getPositiveInfinity(), _getPositiveInfinity());
// // rayPacketAABB.screenMax = vec2<f32>(_getNegativeInfinity(), _getNegativeInfinity());


// // isRayPacketAABBIntersectWithTopLevelNode = false;
//         }

        workgroupBarrier();


        // localStackSize = stackSize;

		let currentNode = stackContainer[localStackSize - 1];
		// stackSize = stackSize - 1;
        localStackSize -= 1;

		var leafInstanceCountAndMaxLayer = u32(currentNode.leafInstanceCountAndMaxLayer);
        
		var firstActiveRayIndex = bvhNodeFirstActiveRayIndexs[localStackSize];

        // var maxLayer =   _getMaxLayer(leafInstanceCountAndMaxLayer);


// TODO restore
//  if(maxLayer <= intersectResult.layer){
//    continue;
//  }



        // _buildRayPacketAABB(firstActiveRayIndex, pointInScreen, LocalInvocationIndex);

// rayPacketPointInScreenForFindMin[LocalInvocationIndex] = pointInScreen;
// rayPacketPointInScreenForFindMax[LocalInvocationIndex] = pointInScreen;

// workgroupBarrier();

// //TODO perf: unroll?

// //paralle reduction to find min, max

// for (var s: u32 = 1; s < 64; s = s * 2) {
//   var index = 2 * s * LocalInvocationIndex;
//   if(LocalInvocationIndex % (2 * s) == 0){
//     rayPacketPointInScreenForFindMin[LocalInvocationIndex] = min(rayPacketPointInScreenForFindMin[LocalInvocationIndex], rayPacketPointInScreenForFindMin[LocalInvocationIndex + s]);
//     rayPacketPointInScreenForFindMax[LocalInvocationIndex] = max(rayPacketPointInScreenForFindMax[LocalInvocationIndex], rayPacketPointInScreenForFindMax[LocalInvocationIndex + s]);
//   }
//   workgroupBarrier();
// }




//         if(LocalInvocationIndex == 0){
// // var rayPacketAABB: AABB2D;
// // rayPacketAABB.screenMin = rayPacketPointInScreenForFindMin[0];
// // rayPacketAABB.screenMax = rayPacketPointInScreenForFindMax[0];





// isRayPacketAABBIntersectWithTopLevelNode = _isRayPacketAABBIntersectWithTopLevelNode(rayPacketAABB, currentNode);
//         }

//         workgroupBarrier();

// 		if (!isRayPacketAABBIntersectWithTopLevelNode) {
// 			continue;
// 		}



if(LocalInvocationIndex == 0){
  //pointInScreen is left-bottom conner point of 8*8 region

  var resolution = vec2 < f32 > (screenDimension.resolution);
  var step = 2 / resolution;

  var rayPacketAABB:AABB2D;


  rayPacketAABB.screenMin = pointInScreen;
  rayPacketAABB.screenMax = vec2<f32>(pointInScreen.x + 7.0 * step.x, pointInScreen.y + f32(7 - _getMultiplierForBuildRayPacketAABB(firstActiveRayIndex)) * step.y);


  isRayPacketAABBIntersectWithTopLevelNode = _isRayPacketAABBIntersectWithTopLevelNode(rayPacketAABB, currentNode);
}

    if(firstActiveRayIndex == 0){
      if(_isPointIntersectWithTopLevelNode(pointInScreen, currentNode)){
          rayPacketTempForFindFirstActiveRayIndex[LocalInvocationIndex] = true;
      }
    }
    else{
      if(LocalInvocationIndex >= firstActiveRayIndex && _isPointIntersectWithTopLevelNode(pointInScreen, currentNode)){
          rayPacketTempForFindFirstActiveRayIndex[LocalInvocationIndex - firstActiveRayIndex] = true;
      }
    }

        workgroupBarrier();

		if (!isRayPacketAABBIntersectWithTopLevelNode) {
			continue;
		}




        firstActiveRayIndex = _findFirstActiveRayIndex(firstActiveRayIndex,pointInScreen, LocalInvocationIndex , currentNode);

        // TODO check: if(firstActiveRayIndex > 100), throw error
        // if(firstActiveRayIndex > 100){
        //   continue;
        // }


        var leafInstanceCount = _getLeafInstanceCount(leafInstanceCountAndMaxLayer);


        if (_isLeafNode(leafInstanceCount)) {
            if(LocalInvocationIndex >= firstActiveRayIndex){
                var leafInstanceOffset = u32(currentNode.leafInstanceOffset);

                // var intersectResult = rayPacketRingIntersects[LocalInvocationIndex];

                while(leafInstanceCount > 0){
                    var bottomLevel = bottomLevel.bottomLevels[leafInstanceOffset];

                    if(_isPointIntersectWithAABB(pointInScreen, bottomLevel.screenMin, bottomLevel.screenMax)){
                        var instance: Instance = sceneInstanceData.instances[u32(bottomLevel.instanceIndex)];
                        var geometryIndex = u32(instance.geometryIndex);
                        var geometry:Geometry = sceneGeometryData.geometrys[geometryIndex];

                        if (_isIntersectWithRing(pointInScreen,instance, geometry)) {
                            var layer = u32(bottomLevel.layer);

                            if (!intersectResult.isClosestHit || layer > intersectResult.layer) {
                            intersectResult.isClosestHit = true;
                            intersectResult.layer = layer;
                            intersectResult.instanceIndex = bottomLevel.instanceIndex;

                    // TODO restore
                    // if(layer == maxLayer){
                    //   break;
                    // }
                            }
                        }
                    }

                    leafInstanceCount = leafInstanceCount - 1;
                    leafInstanceOffset = leafInstanceOffset + 1;
                }
            }
        }
        else {
            child1Index = u32(currentNode.child1Index);
            child2Index = u32(currentNode.child2Index);

			// TODO perf: 如果Packet与两个子节点都相交则优先遍历相交Ray数目多的那个节点

            if (_hasChild(child1Index)) {
                if(LocalInvocationIndex == 0){
                    stackContainer[localStackSize] = topLevel.topLevels[child1Index];
                    bvhNodeFirstActiveRayIndexs[localStackSize] = firstActiveRayIndex;
                }
                localStackSize += 1;
            }
            if (_hasChild(child2Index)) {
                if(LocalInvocationIndex == 0){
                    stackContainer[localStackSize] = topLevel.topLevels[child2Index];
                    bvhNodeFirstActiveRayIndexs[localStackSize] = firstActiveRayIndex;
                }
                localStackSize += 1;
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