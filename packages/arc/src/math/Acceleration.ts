import { layer } from "../type/LayerType"
import { log } from "../utils/LogUtils"
import { tree } from "./LBVH2D"

// type instanceOffset = number
// type instanceCount = number

// type accelerationStructures = Array<[instanceOffset, instanceCount]>

type wholeWorldMinX = number
type wholeWorldMinY = number
type wholeWorldMaxX = number
type wholeWorldMaxY = number

type leafInstanceOffset = number
type leafInstanceCount = number
type maxLayer = layer
type child1Index = number
type child2Index = number

type topLevelNodeData = [
	wholeWorldMinX, wholeWorldMinY, wholeWorldMaxX, wholeWorldMaxY,
	leafInstanceOffset,
	leafInstanceCount,
	maxLayer,
	child1Index,
	child2Index
]

type topLevelArr = Array<topLevelNodeData>


type worldMinX = number
type worldMinY = number
type worldMaxX = number
type worldMaxY = number

type instanceIndex = number

type bottomLevelArr = Array<[worldMinX, worldMinY, worldMaxX, worldMaxY, instanceIndex, layer]>

// TODO refactor(rescript): not edit ref: topLevelArr, bottomLevelArr
// let _build = (node, topLevelArr, hierachyArr, bottomLevelArr): void => {
let _build = (node, topLevelArr, child1Arr, child2Arr, bottomLevelArr: bottomLevelArr): void => {
	let { aabb, maxLayer } = node.wholeAABBData
	let { worldMin, worldMax } = aabb

	if (node.leafAllAABBData !== null) {
		topLevelArr.push(
			[
				worldMin[0],
				worldMin[1],
				worldMax[0],
				worldMax[1],
				bottomLevelArr.length,
				node.leafAllAABBData.length,
				maxLayer
			]
		)
		node.leafAllAABBData.reduce((arr, { aabb, instanceIndex, layer }) => {
			let { worldMin, worldMax } = aabb

			arr.push([
				worldMin[0],
				worldMin[1],
				worldMax[0],
				worldMax[1],
				instanceIndex,
				layer
			])

			return arr
		}, bottomLevelArr)

		return
	}

	topLevelArr.push(
		[
			worldMin[0],
			worldMin[1],
			worldMax[0],
			worldMax[1],
			0,
			0,
			maxLayer
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
	instanceIndex: instanceIndex | null
}

let _isPointIntersectWithAABB = (
	point,
	wholeWorldMinX, wholeWorldMinY, wholeWorldMaxX, wholeWorldMaxY,
) => {
	return point[0] > wholeWorldMinX && point[0] < wholeWorldMaxX && point[1] > wholeWorldMinY && point[1] < wholeWorldMaxY
}

let _isPointIntersectWithTopLevelNode = (point, node: topLevelNodeData) => {
	let [
		wholeWorldMinX, wholeWorldMinY, wholeWorldMaxX, wholeWorldMaxY,
	] = node

	return _isPointIntersectWithAABB(
		point,
		wholeWorldMinX, wholeWorldMinY, wholeWorldMaxX, wholeWorldMaxY,
	)
}

let _isLeafNode = (node: topLevelNodeData) => {
	let leafInstanceCountOffset = 5

	return node[leafInstanceCountOffset] !== 0
}

let _handleIntersectWithLeafNode = (intersectResult, isIntersectWithInstance, point, node: topLevelNodeData, bottomLevelArr: bottomLevelArr) => {
	let [
		wholeWorldMinX, wholeWorldMinY, wholeWorldMaxX, wholeWorldMaxY,
		leafInstanceOffset,
		leafInstanceCount,
		maxLayer
	] = node


	while (leafInstanceCount > 0) {
		// let [worldMinX, worldMinY, worldMaxX, worldMaxY, instanceIndex] = bottomLevelArr[leafInstanceOffset]
		let [worldMinX, worldMinY, worldMaxX, worldMaxY, instanceIndex, layer] = bottomLevelArr[leafInstanceOffset]

		if (_isPointIntersectWithAABB(
			point,
			worldMinX, worldMinY, worldMaxX, worldMaxY
		)) {
			if (isIntersectWithInstance(point, instanceIndex)) {
				// let layer = getInstanceLayer(instanceIndex)

				// if (!intersectResult.isClosestHit || layer >= intersectResult.layer) {
				if (!intersectResult.isClosestHit || layer > intersectResult.layer) {
					// log("hit")

					intersectResult.isClosestHit = true
					intersectResult.layer = layer
					intersectResult.instanceIndex = instanceIndex

					if(layer == maxLayer){
						break
					}
				}
			}
		}

		leafInstanceCount -= 1
		leafInstanceOffset += 1
	}
}

let _hasChild = (node, childIndexOffset) => {
	return node[childIndexOffset] !== 0
}

export let traverse = (isIntersectWithInstance, point, topLevelArr: topLevelArr, bottomLevelArr: bottomLevelArr): traverseResult => {
	let rootNode = topLevelArr[0]

	let maxLayerOffset = 6
	let child1IndexOffset = 7
	let child2IndexOffset = 8

	// let node = rootNode

	let stackContainer = [rootNode]
	let stackSize = 1

	let intersectResult = {
		isClosestHit: false,
		layer: -1,
		instanceIndex: null
	}

	while (stackSize > 0) {
		let currentNode = stackContainer[stackSize - 1]

		stackSize -= 1


		if (currentNode[maxLayerOffset] <= intersectResult.layer) {
			continue
		}

		// log("stackSize: ", stackSize)

		if (_isPointIntersectWithTopLevelNode(point, currentNode)) {
			// log(
			// 	"_isPointIntersectWithTopLevelNode true:",
			// 	currentNode,
			// 	_isLeafNode(currentNode),
			// 	_hasChild(currentNode, child1IndexOffset),
			// 	_hasChild(currentNode, child2IndexOffset),
			// )

			if (_isLeafNode(currentNode)) {
				_handleIntersectWithLeafNode(intersectResult, isIntersectWithInstance, point, currentNode, bottomLevelArr)

				// if (intersectResult.isClosestHit) {
				// 	break
				// }
			}
			else {
				// log("judge child")

				if (_hasChild(currentNode, child1IndexOffset)) {
					stackContainer[stackSize] = topLevelArr[currentNode[child1IndexOffset]]
					stackSize += 1
				}
				if (_hasChild(currentNode, child2IndexOffset)) {
					stackContainer[stackSize] = topLevelArr[currentNode[child2IndexOffset]]
					stackSize += 1
				}
			}
		}
	}

	return intersectResult
}