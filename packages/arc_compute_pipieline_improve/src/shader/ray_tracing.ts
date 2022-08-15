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
var<workgroup>rayPacketAABB: AABB2D;
var<workgroup>isRayPacketAABBIntersectWithTopLevelNode: bool;
// var<workgroup>rayPacketTempForFindFirstActiveRayIndex: array<bool, 64>;
// var<workgroup>rayPacketTemp2ForFindFirstActiveRayIndex: u32;
var<workgroup>rayPacketRingIntersectLayer: array<u32, 64>;
var<workgroup>isNodeBehindRayPacket: bool;
// var<workgroup>hasChild1: bool;
// var<workgroup>hasChild2: bool;
var<workgroup>stackSize: u32;
// var<workgroup>child1Index: u32;
// var<workgroup>child2Index: u32;


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

fn _getPositiveInfinity()->f32{
  return 1000000.0;
}

fn _getNegativeInfinity()->f32{
  return -1000000.0;
}

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

fn _intersectScene(ray: Ray, LocalInvocationIndex : u32) -> RingIntersect {
  var intersectResult: RingIntersect;

  intersectResult.isClosestHit = false;
  intersectResult.layer = 0;

var rootNode = topLevel.topLevels[0];

var pointInScreen = ray.rayTarget;

// // TODO use const
// if(LocalInvocationIndex < 20){
// bvhNodeFirstActiveRayIndexs[LocalInvocationIndex] = 0;
// }

if(LocalInvocationIndex == 0){
stackSize = 1;

stackContainer[0] = rootNode;

  var resolution = vec2 < f32 > (screenDimension.resolution);
  var step = 2 / resolution;

  rayPacketAABB.screenMin = pointInScreen;
  rayPacketAABB.screenMax = vec2<f32>(pointInScreen.x + 7.0 * step.x, pointInScreen.y + 7.0 * step.y);

}


workgroupBarrier();

// var child1Index: u32;
// var child2Index: u32;



// var isFirstActiveRayIndexsChange = true;

while(stackSize > 0){
        workgroupBarrier();

        // rayPacketTempForFindFirstActiveRayIndex[LocalInvocationIndex] = false;

rayPacketRingIntersectLayer[LocalInvocationIndex] = intersectResult.layer;

        if(LocalInvocationIndex ==0){
        stackSize -= 1;
        }

        workgroupBarrier();



		// let currentNode = stackContainer[localStackSize - 1];
		let currentNode = stackContainer[stackSize ];
        // localStackSize -= 1;

		var leafInstanceCountAndMaxLayer = u32(currentNode.leafInstanceCountAndMaxLayer);
        
		// var firstActiveRayIndex = bvhNodeFirstActiveRayIndexs[stackSize];

        var maxLayer =   _getMaxLayer(leafInstanceCountAndMaxLayer);


// rayPacketRingIntersectLayer[LocalInvocationIndex] = intersectResult.layer;

// workgroupBarrier();


      if (LocalInvocationIndex < 32){
        rayPacketRingIntersectLayer[LocalInvocationIndex] = min(rayPacketRingIntersectLayer[LocalInvocationIndex], rayPacketRingIntersectLayer[LocalInvocationIndex + 32]);};
      workgroupBarrier();
      if (LocalInvocationIndex < 16){
        rayPacketRingIntersectLayer[LocalInvocationIndex] = min(rayPacketRingIntersectLayer[LocalInvocationIndex], rayPacketRingIntersectLayer[LocalInvocationIndex + 16]);};
      workgroupBarrier();
      if (LocalInvocationIndex < 8){
        rayPacketRingIntersectLayer[LocalInvocationIndex] = min(rayPacketRingIntersectLayer[LocalInvocationIndex], rayPacketRingIntersectLayer[LocalInvocationIndex + 8]);};
      workgroupBarrier();
      if (LocalInvocationIndex < 4){
        rayPacketRingIntersectLayer[LocalInvocationIndex] = min(rayPacketRingIntersectLayer[LocalInvocationIndex], rayPacketRingIntersectLayer[LocalInvocationIndex + 4]);};
      workgroupBarrier();
      if (LocalInvocationIndex < 2){
        rayPacketRingIntersectLayer[LocalInvocationIndex] = min(rayPacketRingIntersectLayer[LocalInvocationIndex], rayPacketRingIntersectLayer[LocalInvocationIndex + 2]);};
      workgroupBarrier();

      if(LocalInvocationIndex == 0){
        isNodeBehindRayPacket = maxLayer<= rayPacketRingIntersectLayer[0];
      }
      workgroupBarrier();

// if(maxLayer <= rayPacketRingIntersectLayer[0]){
//    continue;
//  }

if(isNodeBehindRayPacket){
   continue;
 }



    // var isPointIntersectWithTopLevelNode:bool;

// if(LocalInvocationIndex == 0){
//   //pointInScreen is left-bottom conner point of 8*8 region


//   if(isFirstActiveRayIndexsChange){
//   var resolution = vec2 < f32 > (screenDimension.resolution);
//   var step = 2 / resolution;

//   rayPacketAABB.screenMin = vec2<f32>(pointInScreen.x, pointInScreen.y +  _getMultiplierForBuildRayPacketAABB(firstActiveRayIndex) * step.y);
//   rayPacketAABB.screenMax = vec2<f32>(pointInScreen.x + 7.0 * step.x, pointInScreen.y + 7.0 * step.y);
//   }

  
//   isRayPacketAABBIntersectWithTopLevelNode = _isRayPacketAABBIntersectWithTopLevelNode(rayPacketAABB, currentNode);
// }
// else if(LocalInvocationIndex >= firstActiveRayIndex){
//   isPointIntersectWithTopLevelNode = _isPointIntersectWithTopLevelNode(pointInScreen, currentNode);
//   rayPacketTempForFindFirstActiveRayIndex[LocalInvocationIndex - firstActiveRayIndex] = isPointIntersectWithTopLevelNode;
// }


if(LocalInvocationIndex == 0){
  isRayPacketAABBIntersectWithTopLevelNode = _isRayPacketAABBIntersectWithTopLevelNode(rayPacketAABB, currentNode);
}
        workgroupBarrier();

		if (!isRayPacketAABBIntersectWithTopLevelNode) {
			continue;
		}


//     if(firstActiveRayIndex == 0){
//       if(LocalInvocationIndex ==0){
//   isPointIntersectWithTopLevelNode = _isPointIntersectWithTopLevelNode(pointInScreen, currentNode);
//             rayPacketTempForFindFirstActiveRayIndex[0] = isPointIntersectWithTopLevelNode;
//       }
//       workgroupBarrier();
//     }

//     var firstActiveRayIndexBefore = firstActiveRayIndex;

//         firstActiveRayIndex = _findFirstActiveRayIndex(firstActiveRayIndex,pointInScreen, LocalInvocationIndex , currentNode);

//         if(firstActiveRayIndex != firstActiveRayIndexBefore){
// isFirstActiveRayIndexsChange = true;
//         }
//         else{
// isFirstActiveRayIndexsChange = false;
//         }


        // TODO check: if(firstActiveRayIndex > 100), throw error
        // if(firstActiveRayIndex > 100){
        //   continue;
        // }


        var leafInstanceCount = _getLeafInstanceCount(leafInstanceCountAndMaxLayer);

        if (_isLeafNode(leafInstanceCount)) {
            // if(LocalInvocationIndex >= firstActiveRayIndex && isPointIntersectWithTopLevelNode){
            if(_isPointIntersectWithTopLevelNode(pointInScreen, currentNode)){
                var leafInstanceOffset = u32(currentNode.leafInstanceOffset);

                var isBreak =false;
                while(leafInstanceCount > 0){
                    var bottomLevel = bottomLevel.bottomLevels[leafInstanceOffset];

                    if(!isBreak && _isPointIntersectWithAABB(pointInScreen, bottomLevel.screenMin, bottomLevel.screenMax)){
                        var instance: Instance = sceneInstanceData.instances[u32(bottomLevel.instanceIndex)];
                        var geometryIndex = u32(instance.geometryIndex);
                        var geometry:Geometry = sceneGeometryData.geometrys[geometryIndex];

                        if (_isIntersectWithRing(pointInScreen,instance, geometry)) {
                            var layer = u32(bottomLevel.layer);

                            if (!intersectResult.isClosestHit || layer > intersectResult.layer) {
                            intersectResult.isClosestHit = true;
                            intersectResult.layer = layer;
                            intersectResult.instanceIndex = bottomLevel.instanceIndex;

                    if(layer == maxLayer){
                      isBreak = true;
                    }
                            }
                        }
                    }

                    leafInstanceCount = leafInstanceCount - 1;
                    leafInstanceOffset = leafInstanceOffset + 1;
                }
          }
        }
        else {
          // TODO perf: 如果Packet与两个子节点都相交则优先遍历相交Ray数目多的那个节点


          // if (LocalInvocationIndex == 0) {
          //     child1Index = u32(currentNode.child1Index);
          // }
          // if (LocalInvocationIndex == 1) {
          //     child2Index = u32(currentNode.child2Index);
          // }
          // workgroupBarrier();


          // if(LocalInvocationIndex == 0){
          //   if( _hasChild(child1Index)){
          //     stackContainer[stackSize] = topLevel.topLevels[child1Index];
          //     bvhNodeFirstActiveRayIndexs[stackSize] = firstActiveRayIndex;
          //   }
          // }
          // if(LocalInvocationIndex == 1){
          //   if( _hasChild(child2Index)){
          //     var localStackSize = stackSize;

          //   if( _hasChild(child1Index)){
          //       localStackSize +=1;
          //   }

          //     stackContainer[localStackSize] = topLevel.topLevels[child1Index];
          //     bvhNodeFirstActiveRayIndexs[localStackSize] = firstActiveRayIndex;
          //   }
          // }

          // workgroupBarrier();


          // if(LocalInvocationIndex == 0){
          //   if( _hasChild(child1Index)){
          //       stackSize +=1;
          //   }

          //   if( _hasChild(child2Index)){
          //       stackSize +=1;
          //   }
          // }
          // workgroupBarrier();






          if (LocalInvocationIndex == 0) {
              var child1Index = u32(currentNode.child1Index);
              var child2Index = u32(currentNode.child2Index);




              if (_hasChild(child1Index) && _hasChild(child2Index)) {
                var child1 = topLevel.topLevels[child1Index];
		var leafInstanceCountAndMaxLayer = u32(child1.leafInstanceCountAndMaxLayer);
        var child1MaxLayer =   _getMaxLayer(leafInstanceCountAndMaxLayer);

                var child2 = topLevel.topLevels[child2Index];
		leafInstanceCountAndMaxLayer = u32(child2.leafInstanceCountAndMaxLayer);
        var child2MaxLayer =   _getMaxLayer(leafInstanceCountAndMaxLayer);

                  // bvhNodeFirstActiveRayIndexs[stackSize] = firstActiveRayIndex;
                  // bvhNodeFirstActiveRayIndexs[stackSize+1] = firstActiveRayIndex;
        if(child1MaxLayer > child2MaxLayer){
                  stackContainer[stackSize] = child1;
                  stackContainer[stackSize+1] = child2;
        }
        else{
                  stackContainer[stackSize] = child2;
                  stackContainer[stackSize+1] = child1;
        }

stackSize += 2;
              }
              else{
              if (_hasChild(child1Index)) {
                  stackContainer[stackSize] = topLevel.topLevels[child1Index];
                  // if(isFirstActiveRayIndexsChange){
                  // bvhNodeFirstActiveRayIndexs[stackSize] = firstActiveRayIndex;
                  // }

                  stackSize += 1;
              }
              if (_hasChild(child2Index)) {
                  stackContainer[stackSize] = topLevel.topLevels[child2Index];
                  // bvhNodeFirstActiveRayIndexs[stackSize] = firstActiveRayIndex;

                  stackSize += 1;
              }
              }

          }
          workgroupBarrier();
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