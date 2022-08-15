import { layer } from "../type/LayerType"
import { log } from "../utils/LogUtils"
import { isAABBIntersection, setByPoints } from "./AABB2D"
import { range } from "./Array"
import { tree } from "./LBVH2D"
import * as Vector2 from "./Vector2"

// type instanceOffset = number
// type instanceCount = number

// type accelerationStructures = Array<[instanceOffset, instanceCount]>

type wholeScreenMinX = number
type wholeScreenMinY = number
type wholeScreenMaxX = number
type wholeScreenMaxY = number

type leafInstanceOffset = number
// type leafInstanceCount = number
type leafInstanceCountAndMaxLayer = number
type child1Index = number
type child2Index = number

type topLevelNodeData = [
	wholeScreenMinX, wholeScreenMinY, wholeScreenMaxX, wholeScreenMaxY,
	leafInstanceOffset,
	// leafInstanceCount,
	// maxLayer,
	leafInstanceCountAndMaxLayer,
	child1Index,
	child2Index
]

type topLevelArr = Array<topLevelNodeData>


type screenMinX = number
type screenMinY = number
type screenMaxX = number
type screenMaxY = number

type instanceIndex = number

type bottomLevelArr = Array<[screenMinX, screenMinY, screenMaxX, screenMaxY, instanceIndex, layer]>

let _merge24BitValueAnd8BitValue = (value1, value2) => {
	return (value1 << 8) | value2
}

let _getLeafInstanceCount = (
	leafInstanceCountAndMaxLayer: number
) => {
	return (leafInstanceCountAndMaxLayer >> 8) & 0xffffff
}

let _getMaxLayer = (
	leafInstanceCountAndMaxLayer: number
) => {
	return leafInstanceCountAndMaxLayer & 0xff
}


// TODO refactor(rescript): not edit ref: topLevelArr, bottomLevelArr
// let _build = (node, topLevelArr, hierachyArr, bottomLevelArr): void => {
let _build = (node, topLevelArr, child1Arr, child2Arr, bottomLevelArr: bottomLevelArr): void => {
	let { aabb, maxLayer } = node.wholeAABBData
	let { screenMin, screenMax } = aabb

	if (node.leafAllAABBData !== null) {
		// TODO require check
		if (node.leafAllAABBData.length >= 10000 || maxLayer >= 65536 || maxLayer == 0) {
			throw new Error("error")
		}
		let leafInstanceCountAndMaxLayer = _merge24BitValueAnd8BitValue(node.leafAllAABBData.length, maxLayer)

		// // TODO remove
		// if(leafInstanceCountAndMaxLayer == 0){
		// 	throw new Error("error")
		// }

		topLevelArr.push(
			[
				screenMin[0],
				screenMin[1],
				screenMax[0],
				screenMax[1],
				bottomLevelArr.length,
				// _merge24BitValueAnd8BitValue(node.leafAllAABBData.length, maxLayer)
				leafInstanceCountAndMaxLayer
			]
		)
		node.leafAllAABBData.reduce((arr, { aabb, instanceIndex, layer }) => {
			let { screenMin, screenMax } = aabb

			arr.push([
				screenMin[0],
				screenMin[1],
				screenMax[0],
				screenMax[1],
				instanceIndex,
				layer
			])

			return arr
		}, bottomLevelArr)

		return
	}

	topLevelArr.push(
		[
			screenMin[0],
			screenMin[1],
			screenMax[0],
			screenMax[1],
			0,
			_merge24BitValueAnd8BitValue(0, maxLayer)
		]
	)
	let nodeIndex = topLevelArr.length - 1

	if (node.child1 !== null) {
		child1Arr[nodeIndex] = topLevelArr.length

		_build(node.child1, topLevelArr, child1Arr, child2Arr, bottomLevelArr)
	}

	if (node.child2 !== null) {
		child2Arr[nodeIndex] = topLevelArr.length

		_build(node.child2, topLevelArr, child1Arr, child2Arr, bottomLevelArr)
	}

	return
}

// let _getDepth = (topLevelArr) => {
// 	let rootNode = topLevelArr[0]

// 	let child1IndexOffset = 6
// 	let child2IndexOffset = 7

// 	let stackContainer = [rootNode]
// 	let stackSize = 1

// 	let stackSizeArr = []

// 	while (stackSize > 0) {
// 		let currentNode = stackContainer[stackSize - 1]

// 		stackSize -= 1

// 		if (_isLeafNode(currentNode)) {
// 			stackSizeArr.push(stackSize)
// 		}
// 		else {
// 			if (_hasChild(currentNode, child1IndexOffset)) {
// 				stackContainer[stackSize] = topLevelArr[currentNode[child1IndexOffset]]
// 				stackSize += 1
// 			}
// 			if (_hasChild(currentNode, child2IndexOffset)) {
// 				stackContainer[stackSize] = topLevelArr[currentNode[child2IndexOffset]]
// 				stackSize += 1
// 			}
// 		}
// 	}

// 	// let arr = qsort(stackSizeArr, (v) => v)

// 	return Math.max.apply(null, stackSizeArr)
// }

export let build = (tree: tree): [topLevelArr, bottomLevelArr] => {
	let topLevelArr = []
	let bottomLevelArr = []
	let child1Arr = []
	let child2Arr = []

	_build(tree, topLevelArr, child1Arr, child2Arr, bottomLevelArr)

	topLevelArr = topLevelArr.map((data, index) => {
		if (child1Arr[index] !== undefined) {
			data.push(child1Arr[index])
		}
		else {
			data.push(0)
		}

		if (child2Arr[index] !== undefined) {
			data.push(child2Arr[index])
		}
		else {
			data.push(0)
		}

		return data
	})

	return [topLevelArr, bottomLevelArr]
}

type traverseResult = {
	isClosestHit: boolean,
	layer: layer,
	instanceIndex: instanceIndex | null
}

let _isPointIntersectWithAABB = (
	point,
	wholeScreenMinX, wholeScreenMinY, wholeScreenMaxX, wholeScreenMaxY,
) => {
	return point[0] > wholeScreenMinX && point[0] < wholeScreenMaxX && point[1] > wholeScreenMinY && point[1] < wholeScreenMaxY
}

let _isPointIntersectWithTopLevelNode = (point, node: topLevelNodeData) => {
	let [
		wholeScreenMinX, wholeScreenMinY, wholeScreenMaxX, wholeScreenMaxY,
	] = node

	return _isPointIntersectWithAABB(
		point,
		wholeScreenMinX, wholeScreenMinY, wholeScreenMaxX, wholeScreenMaxY,
	)
}

let _isLeafNode = (leafInstanceCount) => {
	// let leafInstanceCountOffset = 5

	// return node[leafInstanceCountOffset] !== 0

	return leafInstanceCount !== 0
}

let _handleIntersectWithLeafNode = (
	intersectResults,
	rayPacketPoints,
	firstActiveRayIndex,
	isIntersectWithInstance,
	leafInstanceCount, maxLayer, node: topLevelNodeData,
	bottomLevelArr: bottomLevelArr,
) => {
	let [
		wholeScreenMinX, wholeScreenMinY, wholeScreenMaxX, wholeScreenMaxY,
		leafInstanceOffset,
		// leafInstanceCount,
		// maxLayer
	] = node

	let oneRayLeafInstanceCount
	let oneRayLeafInstanceOffset


	for (let i = firstActiveRayIndex; i < rayPacketPoints.length; i++) {
		let point = rayPacketPoints[i]
		let intersectResult = intersectResults[i]

		oneRayLeafInstanceCount = leafInstanceCount
		oneRayLeafInstanceOffset = leafInstanceOffset

		while (oneRayLeafInstanceCount > 0) {
			let [screenMinX, screenMinY, screenMaxX, screenMaxY, instanceIndex, layer] = bottomLevelArr[leafInstanceOffset]

			console.log("b1", firstActiveRayIndex)

			if (_isPointIntersectWithAABB(
				point,
				screenMinX, screenMinY, screenMaxX, screenMaxY
			)) {
				console.log("bbb")
				if (isIntersectWithInstance(point, instanceIndex)) {
					console.log("ccc")
					// let layer = getInstanceLayer(instanceIndex)

					// if (!intersectResult.isClosestHit || layer >= intersectResult.layer) {
					if (!intersectResult.isClosestHit || layer > intersectResult.layer) {
						// log("hit")

						intersectResult.isClosestHit = true
						intersectResult.layer = layer
						intersectResult.instanceIndex = instanceIndex

						if (layer == maxLayer) {
							break
						}
					}
				}
			}

			oneRayLeafInstanceCount -= 1
			oneRayLeafInstanceOffset += 1
		}
	}
}

let _hasChild = (node, childIndexOffset) => {
	return node[childIndexOffset] !== 0
}

let _buildRayPacketAABB = (firstActiveRayIndex, rayPacketPoints) => {
	return setByPoints(rayPacketPoints.slice(firstActiveRayIndex))
}

let _isRayPacketAABBIntersectWithTopLevelNode = (aabb, node: topLevelNodeData) => {
	let [
		wholeScreenMinX, wholeScreenMinY, wholeScreenMaxX, wholeScreenMaxY,
	] = node

	// console.log(aabb, node)

	return isAABBIntersection(aabb, {
		screenMin: Vector2.create(wholeScreenMinX, wholeScreenMinY),
		screenMax: Vector2.create(wholeScreenMaxX, wholeScreenMaxY)
	})
}

let _getMinLayerOfActiveIntersectResults = (intersectResults, firstActiveRayIndex) => {
	let minLayer = intersectResults.slice(firstActiveRayIndex).reduce((result, { layer }) => {
		if(result > layer && layer!== 0){
			return layer
		}

		return result
	}, +Infinity)

	if(minLayer == +Infinity){
		return 0
	}
}

export let traverse = (isIntersectWithInstance, rayPacketPoints, topLevelArr, bottomLevelArr: bottomLevelArr): Array<traverseResult> => {
	let rootNode = topLevelArr[0]

	let leafInstanceCountAndMaxLayerOffset = 5
	let child1IndexOffset = 6
	let child2IndexOffset = 7

	let stackContainer = [rootNode]
	let stackSize = 1

	let rayCount = rayPacketPoints.length

	let intersectResults: Array<traverseResult> = range(0, rayCount - 1).map(_ => {
		return {
			isClosestHit: false,
			// layer: -1,
			layer: 0,
			instanceIndex: null
		}
	})

	let maxDepth = 20
	let bvhNodeFirstActiveRayIndexs = range(0, maxDepth - 1).map(_ => 0)

	while (stackSize > 0) {
		console.log(stackSize)
		let currentNode = stackContainer[stackSize - 1]

		stackSize -= 1

		let leafInstanceCountAndMaxLayer = currentNode[leafInstanceCountAndMaxLayerOffset]

		let maxLayer = _getMaxLayer(leafInstanceCountAndMaxLayer)

		var firstActiveRayIndex = bvhNodeFirstActiveRayIndexs[stackSize];

		let minLayerOfActiveIntersectResults = _getMinLayerOfActiveIntersectResults(intersectResults, firstActiveRayIndex)

		if (maxLayer <= minLayerOfActiveIntersectResults) {
			continue
		}

		let pointInScreen = rayPacketPoints[firstActiveRayIndex]

		console.log(
			firstActiveRayIndex,
			pointInScreen,
		)

		if (!_isRayPacketAABBIntersectWithTopLevelNode(_buildRayPacketAABB(firstActiveRayIndex, rayPacketPoints), currentNode)) {
			console.log("aaa")
			continue;
		}

		// _findFirstActiveRayIndex
		while (!_isPointIntersectWithTopLevelNode(pointInScreen, currentNode)) {
			// firstActiveRayIndex = _findFirstActiveRayIndex(firstActiveRayIndex)
			firstActiveRayIndex = firstActiveRayIndex + 1

			// TODO move to ensure check: should firstActiveRayIndex < rayPacketPoints.length
			if (firstActiveRayIndex >= rayPacketPoints.length) {
				throw new Error("error");
			}

			pointInScreen = rayPacketPoints[firstActiveRayIndex]
		}


		let leafInstanceCount = _getLeafInstanceCount(leafInstanceCountAndMaxLayer)


		if (_isLeafNode(leafInstanceCount)) {
			console.log("leaf", leafInstanceCount)

			_handleIntersectWithLeafNode(
				intersectResults,
				rayPacketPoints,
				firstActiveRayIndex,
				isIntersectWithInstance, leafInstanceCount, maxLayer, currentNode, bottomLevelArr)
		}
		else {
			console.log("judge child")

			// TODO perf: 如果Packet与两个子节点都相交则优先遍历相交Ray数目多的那个节点

			if (_hasChild(currentNode, child1IndexOffset)) {
				stackContainer[stackSize] = topLevelArr[currentNode[child1IndexOffset]]

				bvhNodeFirstActiveRayIndexs[stackSize] = firstActiveRayIndex

				stackSize += 1

			}
			if (_hasChild(currentNode, child2IndexOffset)) {
				stackContainer[stackSize] = topLevelArr[currentNode[child2IndexOffset]]

				bvhNodeFirstActiveRayIndexs[stackSize] = firstActiveRayIndex

				stackSize += 1
			}
		}

	}

	return intersectResults
}