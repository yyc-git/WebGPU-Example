import { tree } from "./BVH2D"

// type instanceOffset = number
// type instanceCount = number

// type accelerationStructures = Array<[instanceOffset, instanceCount]>

type wholeWorldMinX = number
type wholeWorldMinY = number
type wholeWorldMaxX = number
type wholeWorldMaxY = number

type leafInstanceOffset = number
type leafInstanceCount = number
type child1Index = number
type child2Index = number
// type child1InstanceOffset = number
// type child1InstanceCount = number
// type child2InstanceOffset = number
// type child2InstanceCount = number

type topLevelNodeData = [
	wholeWorldMinX, wholeWorldMinY, wholeWorldMaxX, wholeWorldMaxY,
	leafInstanceOffset,
	leafInstanceCount,
	// child1InstanceOffset,
	// child1InstanceCount,
	// child2InstanceOffset,
	// child2InstanceCount
	child1Index,
	child2Index
]

type topLevel = Array<topLevelNodeData>


type worldMinX = number
type worldMinY = number
type worldMaxX = number
type worldMaxY = number

type instanceIndex = number

type bottomLevel = Array<[worldMinX, worldMinY, worldMaxX, worldMaxY, instanceIndex]>

// TODO refactor(rescript): not edit ref: topLevelArr, bottomLevelArr
// let _build = (node, topLevelArr, hierachyArr, bottomLevelArr): void => {
let _build = (node, topLevelArr, child1Arr, child2Arr, bottomLevelArr): void => {
	let { worldMin, worldMax } = node.wholeAABB

	if (node.leafAllAABBData !== null) {
		// hierachyArr[topLevelArr.length] = null
		// child1Arr[topLevelArr.length] = null
		// child2Arr[topLevelArr.length] = null

		topLevelArr.push(
			[
				worldMin[0],
				worldMin[1],
				worldMax[0],
				worldMax[1],
				bottomLevelArr.length,
				node.leafAllAABBData.length,
				// 0,
				// 0
			]
		)
		bottomLevelArr.push(
			node.leafAllAABBData.reduce((arr, { aabb, instanceIndex }) => {
				let { worldMin, worldMax } = aabb

				return arr.concat([
					worldMin[0],
					worldMin[1],
					worldMax[0],
					worldMax[1],
					instanceIndex
				])
			}, [])
		)

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

export let build = (tree: tree): [topLevel, bottomLevel] => {
	let topLevelArr = []
	let bottomLevelArr = []
	let child1Arr = []
	let child2Arr = []

	_build(tree, topLevelArr, child1Arr, child2Arr, bottomLevelArr)


	// console.log("aaa");
	// console.log(child1Arr, child2Arr);

	// console.log("bbb");

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
		leafInstanceOffset,
		leafInstanceCount,
		child1Index,
		child2Index
	] = node

	return _isPointIntersectWithAABB(
		point,
		wholeWorldMinX, wholeWorldMinY, wholeWorldMaxX, wholeWorldMaxY,
	)
}

let _isLeafNode = (node: topLevelNodeData) => {
	let leafInstanceCountOffset = 6

	return node[leafInstanceCountOffset] !== 0
}

let _handleIntersectWithLeafNode = (intersectResult, isIntersectWithInstance, point, node: topLevelNodeData, bottomLevel: bottomLevel) => {
	let [
		wholeWorldMinX, wholeWorldMinY, wholeWorldMaxX, wholeWorldMaxY,
		leafInstanceOffset,
		leafInstanceCount,
		child1Index,
		child2Index
	] = node

	while (leafInstanceCount > 0) {
		let [worldMinX, worldMinY, worldMaxX, worldMaxY, instanceIndex] = bottomLevel[leafInstanceOffset]

		if (_isPointIntersectWithAABB(
			point,
			worldMinX, worldMinY, worldMaxX, worldMaxY
		)) {
			if (isIntersectWithInstance(point, instanceIndex)) {
				intersectResult.isClosestHit = true
				intersectResult.instanceIndex = instanceIndex

				break;
			}
		}

		leafInstanceCount -= 1
		leafInstanceOffset += 1
	}
}

let _hasChild = (node, childIndexOffset) => {
	return node[childIndexOffset] !== 0
}

export let traverse = (isIntersectWithInstance, point, topLevel: topLevel, bottomLevel: bottomLevel): traverseResult => {
	let rootNode = topLevel[0]

	let child1IndexOffset = 7
	let child2IndexOffset = 8

	let node = rootNode

	let stackContainer = [rootNode]
	let stackSize = 1

	let intersectResult = {
		isClosestHit: false,
		instanceIndex: null
	}

	while (stackSize > 0) {
		let currentStackNode = stackContainer[stackSize - 1]

		stackSize -= 1

		if (_isPointIntersectWithTopLevelNode(currentStackNode, point)) {
			if (_isLeafNode(node)) {
				_handleIntersectWithLeafNode(intersectResult, isIntersectWithInstance, node, point, bottomLevel)

				if (intersectResult.isClosestHit) {
					break
				}
			}
			else {
				if (_hasChild(currentStackNode, child1IndexOffset)) {
					stackContainer[stackSize] = topLevel[currentStackNode[child1IndexOffset]]
					stackSize += 1
				}
				if (_hasChild(currentStackNode, child2IndexOffset)) {
					stackContainer[stackSize] = topLevel[currentStackNode[child2IndexOffset]]
					stackSize += 1
				}
			}
		}
	}

	return intersectResult
}