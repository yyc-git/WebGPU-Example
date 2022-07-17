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

type bottomLevel = Array<[worldMinX, worldMinY, worldMaxX, worldMaxY]>

// TODO refactor(rescript): not edit ref: topLevelArr, bottomLevelArr
let _build = (node, topLevelArr, bottomLevelArr): void => {
	let { worldMin, worldMax } = node.wholeAABB

	if (node.leafAllAABBs !== null) {
		topLevelArr.push(
			[
				worldMin[0],
				worldMin[1],
				worldMax[0],
				worldMax[1],
				bottomLevelArr.length,
				node.leafAllAABBs.length,
				0,
				0
			]
		)
		bottomLevelArr.push(
			node.leafAllAABBs.reduce((arr, { worldMin, worldMax }) => {
				return arr.concat([
					worldMin[0],
					worldMin[1],
					worldMax[0],
					worldMax[1],
				])
			}, [])
		)

		// return [
		// 	topLevelArr,
		// 	bottomLevelArr
		// ]
		return
	}

	if (node.child1 !== null) {
		topLevelArr.push(
			[
				worldMin[0],
				worldMin[1],
				worldMax[0],
				worldMax[1],
				0,
				0,
				topLevelArr.length,
				0
			]
		)

		_build(node.child1, topLevelArr, bottomLevelArr)
	}

	if (node.child2 !== null) {
		topLevelArr.push(
			[
				worldMin[0],
				worldMin[1],
				worldMax[0],
				worldMax[1],
				0,
				0,
				0,
				topLevelArr.length
			]
		)

		_build(node.child2, topLevelArr, bottomLevelArr)
	}

	return
}

export let build = (tree: tree): [topLevel, bottomLevel] => {
	let topLevelArr = []
	let bottomLevelArr = []

	_build(tree, topLevelArr, bottomLevelArr)

	return [topLevelArr, bottomLevelArr]
}