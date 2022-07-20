import { computeCenter, create, t } from "./AABB2D"
import { qsort } from "./Array"
import * as Vector2 from "./Vector2"

type instanceIndex = number

type aabbData = { aabb: t, instanceIndex: instanceIndex }

export type tree = {
	wholeAABB: t,
	leafAllAABBData: Array<aabbData> | null,
	child1: tree | null,
	child2: tree | null
}

let _sort = (getAxiz, allAABBData: Array<aabbData>) => {
	return qsort(allAABBData, ({ aabb }) => getAxiz(computeCenter(aabb)))
}

// let _findMiddleIndex = (getAxiz, allAABBData: Array<aabbData>) => {
// 	// return allAABBData.reduce(([ middleIndex ], {aabb}) => {
// 	// 	return getAxiz(computeCenter(a.aabb)) - getAxiz(computeCenter(b.aabb))
// 	// })

// 	let [_, middleIndex] = findKthLargest(
// 		allAABBData.map(({ aabb }) => {
// 			return getAxiz(computeCenter(aabb))
// 		}),
// 		Math.floor(allAABBData.length / 2)
// 	)

// 	return middleIndex
// }

let _computeWholeAABB = (allAABBData: Array<aabbData>) => {
	let [worldMin, worldMax] = allAABBData.reduce(([worldMin, worldMax], { aabb }) => {
		let aabbWorldMin = aabb.worldMin
		let aabbWorldMax = aabb.worldMax

		if (aabbWorldMin[0] < worldMin[0]) {
			worldMin[0] = aabbWorldMin[0]
		}
		if (aabbWorldMin[1] < worldMin[1]) {
			worldMin[1] = aabbWorldMin[1]
		}

		if (aabbWorldMax[0] > worldMax[0]) {
			worldMax[0] = aabbWorldMax[0]
		}
		if (aabbWorldMax[1] > worldMax[1]) {
			worldMax[1] = aabbWorldMax[1]
		}

		// TODO refactor(rescript): change to immutable
		return [worldMin, worldMax]
	}, [
		Vector2.create(
			Infinity,
			Infinity,
		),
		Vector2.create(
			-Infinity,
			-Infinity,
		)
	])

	return create(worldMin, worldMax)
}


// TODO refactor: use rescript->tree instead of edit ref<node>
let _build = (node, minCount, maxDepth, depth, getAxizFuncs, getAxizFuncIndex, allAABBData): void => {
	if (depth >= maxDepth || allAABBData.length <= minCount) {
		// node.wholeAABB = _computeWholeAABB(sortedAllAABBData)
		node.leafAllAABBData = allAABBData
		node.child1 = null
		node.child2 = null

		return
	}
	else {
		let sortedAllAABBData = _sort(getAxizFuncs[getAxizFuncIndex % 2], allAABBData)
		// console.log(sortedAllAABBData)


		// let splitIndex = _findMiddleIndex(getAxizFuncs[getAxizFuncIndex % 2], allAABBData)
		let splitIndex = Math.floor(allAABBData.length / 2)

		let arr1 = sortedAllAABBData.slice(0, splitIndex)
		let arr2 = sortedAllAABBData.slice(splitIndex, sortedAllAABBData.length)
		// console.log(splitIndex, arr1, arr2)

		let child1 = {
			wholeAABB: _computeWholeAABB(arr1),
			leafAllAABBData: null,
			child1: null,
			child2: null
		}
		let child2 = {
			wholeAABB: _computeWholeAABB(arr2),
			leafAllAABBData: null,
			child1: null,
			child2: null
		}

		// node.wholeAABB = _computeWholeAABB(sortedAllAABBData)
		node.leafAllAABBData = null
		node.child1 = child1
		node.child2 = child2

		_build(child1, minCount, maxDepth, depth + 1, getAxizFuncs, getAxizFuncIndex + 1, arr1)
		_build(child2, minCount, maxDepth, depth + 1, getAxizFuncs, getAxizFuncIndex + 1, arr2)
	}
}

//by middle
export let build = (allAABBData: Array<aabbData>, minCount = 5, maxDepth = 10): tree => {
	let tree = {
		wholeAABB: _computeWholeAABB(allAABBData),
		leafAllAABBData: null,
		child1: null,
		child2: null
	}


	_build(tree, minCount, maxDepth, 1, [
		(vec2) => vec2[0],
		(vec2) => vec2[1]
	], 0, allAABBData)

	return tree
}




let _buildGridPosition = ({ worldMin, worldMax }, allAABBData: Array<aabbData>) => {
	let minX = worldMin[0]
	let maxX = worldMax[0]
	let minY = worldMin[1]
	let maxY = worldMax[1]

	let stepX = (maxX - minX) / 1024
	let stepY = (maxY - minY) / 1024

	return allAABBData.map((aabbData) => {
		let [centerX, centerY] = computeCenter(aabbData.aabb)

		let gridPosition = [
			Math.floor((centerX - minX) / stepX),
			Math.floor((centerY - minY) / stepY)
		]

		return [aabbData, gridPosition]
	})
}

let _mortonEncodeGridPositionByMagicbits = ([gridPositionX, gridPositionY]) => {
	let res = gridPositionX | (gridPositionY << 32)
	res = (res | (res << 8)) & 0x00ff00ff00ff00ff
	res = (res | (res << 4)) & 0x0f0f0f0f0f0f0f0f
	res = (res | (res << 2)) & 0x3333333333333333
	res = (res | (res << 1)) & 0x5555555555555555

	return res | (res >> 31)
}

let _mortonEncode = (allAABBDataWithGridPosition) => {
	allAABBDataWithGridPosition.map(([aabbData, gridPosition]) => {
		return [aabbData, _mortonEncodeGridPositionByMagicbits(gridPosition)]
	})
}

let _sortByMorton = (allAABBDataWithMortonEncode) => {
	return qsort(allAABBDataWithMortonEncode, ([_, mortonEncode]) => {
		return mortonEncode
	})
}

let _findHighest1BitIndex = (x) => {
	let bitIndex = 0

	while ((x & (x - 1)) !== 0) {
		x = x & (x - 1)

		bitIndex += 1
	}

	return bitIndex
}

let _convertToAllAABBData = (sortedAllAABBDataWithMortonEncode) => {
	return sortedAllAABBDataWithMortonEncode.map(([aabbData, _]) => aabbData)
}

let _binarySearchFirstChangeBitIndex = (sortedAllAABBDataWithMortonEncode) => {
	let [_, maxMortonEncode] = sortedAllAABBDataWithMortonEncode[sortedAllAABBDataWithMortonEncode.length - 1]

	let highest1BitIndex = _findHighest1BitIndex(maxMortonEncode)

	let lowIndex = 0
	let highIndex = sortedAllAABBDataWithMortonEncode.length - 1

	let firstChangeBitIndex = null

	while (lowIndex <= highIndex) {
		let middleIndex = Math.floor((lowIndex + highIndex) / 2)

		let middleHighest1BitIndex = _findHighest1BitIndex(sortedAllAABBDataWithMortonEncode[middleIndex][1])

		if (middleHighest1BitIndex < highest1BitIndex) {
			lowIndex = middleIndex
			firstChangeBitIndex = middleIndex
		}
		// equal
		else {
			highIndex = middleIndex
		}

	}

	return firstChangeBitIndex
}

let _buildByLBVH = (node, minCount, maxDepth, depth, sortedAllAABBDataWithMortonEncode): void => {
	if (depth >= maxDepth || sortedAllAABBDataWithMortonEncode.length <= minCount) {
		node.leafAllAABBData = _convertToAllAABBData(sortedAllAABBDataWithMortonEncode)
		node.child1 = null
		node.child2 = null

		return
	}
	else {
		let firstChangeBitIndex = _binarySearchFirstChangeBitIndex(sortedAllAABBDataWithMortonEncode)

		let arr1 = sortedAllAABBDataWithMortonEncode.slice(0, firstChangeBitIndex)
		let arr2 = sortedAllAABBDataWithMortonEncode.slice(firstChangeBitIndex, sortedAllAABBDataWithMortonEncode.length)

		let child1 = {
			wholeAABB: _computeWholeAABB(_convertToAllAABBData(arr1)),
			leafAllAABBData: null,
			child1: null,
			child2: null
		}
		let child2 = {
			wholeAABB: _computeWholeAABB(_convertToAllAABBData(arr2)),
			leafAllAABBData: null,
			child1: null,
			child2: null
		}

		node.leafAllAABBData = null
		node.child1 = child1
		node.child2 = child2

		_buildByLBVH(child1, minCount, maxDepth, depth + 1, arr1)
		_buildByLBVH(child2, minCount, maxDepth, depth + 1, arr2)
	}
}

export let buildByLBVH = (allAABBData: Array<aabbData>, minCount = 5, maxDepth = 10): tree => {
	let wholeAABB = _computeWholeAABB(allAABBData)
	let tree = {
		wholeAABB,
		leafAllAABBData: null,
		child1: null,
		child2: null
	}

	_buildByLBVH(tree, minCount, maxDepth, 0, _sortByMorton(
		_mortonEncode(_buildGridPosition(wholeAABB, allAABBData))
	))

	return tree
}