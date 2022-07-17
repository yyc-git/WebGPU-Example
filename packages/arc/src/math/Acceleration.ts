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


type topLevel = Array<[
	wholeWorldMinX, wholeWorldMinY, wholeWorldMaxX, wholeWorldMaxY,
	leafInstanceOffset,
	leafInstanceCount,
	// child1InstanceOffset,
	// child1InstanceCount,
	// child2InstanceOffset,
	// child2InstanceCount
	child1Index,
	child2Index
]>


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
		child1Arr[nodeIndex ] = topLevelArr.length

		_build(node.child1, topLevelArr, child1Arr, child2Arr, bottomLevelArr)
	}

	if (node.child2 !== null) {
		child2Arr[nodeIndex ] = topLevelArr.length

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