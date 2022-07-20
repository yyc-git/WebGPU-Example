import { dec2bin } from "../utils/BitUtils"
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


		let splitIndex = Math.floor(allAABBData.length / 2)

		let arr1 = sortedAllAABBData.slice(0, splitIndex)
		let arr2 = sortedAllAABBData.slice(splitIndex, sortedAllAABBData.length)

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




let _buildGridPosition = ({ worldMin, worldMax }, allAABBData: Array<aabbData>, gridXBitCount, gridYBitCount) => {
	let minX = worldMin[0]
	let maxX = worldMax[0]
	let minY = worldMin[1]
	let maxY = worldMax[1]

	let stepX = (maxX - minX) / Math.pow(2, gridXBitCount)
	let stepY = (maxY - minY) / Math.pow(2, gridYBitCount)

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
	let index1 = gridPositionX
	let index2 = gridPositionY

	index1 &= 0x0000ffff
	index2 &= 0x0000ffff
	index1 |= (index1 << 8)
	index2 |= (index2 << 8)
	index1 &= 0x00ff00ff
	index2 &= 0x00ff00ff
	index1 |= (index1 << 4)
	index2 |= (index2 << 4)
	index1 &= 0x0f0f0f0f
	index2 &= 0x0f0f0f0f
	index1 |= (index1 << 2)
	index2 |= (index2 << 2)
	index1 &= 0x33333333
	index2 &= 0x33333333
	index1 |= (index1 << 1)
	index2 |= (index2 << 1)
	index1 &= 0x55555555
	index2 &= 0x55555555

	return (index1 | (index2 << 1))
}

let _mortonEncode = (allAABBDataWithGridPosition) => {
	// console.log(allAABBDataWithGridPosition)

	return allAABBDataWithGridPosition.map(([aabbData, gridPosition]) => {
		return [aabbData, _mortonEncodeGridPositionByMagicbits(gridPosition)]
	})
}

let _sortByMorton = (allAABBDataWithMortonEncode) => {
	return qsort(allAABBDataWithMortonEncode, ([_, mortonEncode]) => {
		return mortonEncode
	})
}

// let _findHighest1BitIndex = (x) => {
// 	let bitIndex = 0

// 	while (x) {
// 		x >>= 1
// 		bitIndex++
// 	}

// 	return bitIndex
// }

let _findBit = (x, index) => {
	return (x >> index) & 1
}

let _convertToAllAABBData = (sortedAllAABBDataWithMortonEncode) => {
	return sortedAllAABBDataWithMortonEncode.map(([aabbData, _]) => aabbData)
}

let _binarySearchFirstChangeBitIndex = (sortedAllAABBDataWithMortonEncode, index) => {
	let [_, maxMortonEncode] = sortedAllAABBDataWithMortonEncode[sortedAllAABBDataWithMortonEncode.length - 1]

	let maxValueBit = _findBit(maxMortonEncode, index)

	// 	console.log(
	// 		sortedAllAABBDataWithMortonEncode,
	// 		maxMortonEncode, dec2bin(maxMortonEncode), highest1BitIndex
	// 	)
	// 	console.log(
	// 		 dec2bin(sortedAllAABBDataWithMortonEncode[0][1]),
	// _findHighest1BitIndex(sortedAllAABBDataWithMortonEncode[0][1])
	// 	)





	// sortedAllAABBDataWithMortonEncode




	let lowIndex = 0
	let highIndex = sortedAllAABBDataWithMortonEncode.length - 1

	let firstChangeBitIndex = null

	// TODO remove
	let count = 30

	while (lowIndex < highIndex && count > 0) {
		// console.log(lowIndex, highIndex, firstChangeBitIndex)

		count--

		let middleIndex = Math.floor((lowIndex + highIndex) / 2)

		let middleValueBit = _findBit(sortedAllAABBDataWithMortonEncode[middleIndex][1], index)


		// console.log("middleValueBit:", middleValueBit, sortedAllAABBDataWithMortonEncode[middleIndex][1]);


		if (middleValueBit < maxValueBit) {
			lowIndex = middleIndex
			firstChangeBitIndex = middleIndex

			if (lowIndex == highIndex - 1) {
				break
			}
		}
		// equal
		else {
			highIndex = middleIndex
		}
	}

	// TODO remove
	if (count === 0) {
		throw new Error("error")
	}

	return firstChangeBitIndex
}

let _findSearchBitIndex = (sortedAllAABBDataWithMortonEncode, searchBitIndex) => {
	let maxMortonEncode = sortedAllAABBDataWithMortonEncode[sortedAllAABBDataWithMortonEncode.length - 1][1]
	let minMortonEncode = sortedAllAABBDataWithMortonEncode[0][1]

	let result = searchBitIndex

	while (result > 0) {
		if (_findBit(maxMortonEncode, result) == _findBit(minMortonEncode, result)) {
			result -= 1
		}
		else {
			break
		}
	}

	return result
}

let _buildByLBVH = (node, minCount, maxDepth, depth, searchBitIndex, sortedAllAABBDataWithMortonEncode): void => {
	// console.log(sortedAllAABBDataWithMortonEncode)
	if (depth >= maxDepth || sortedAllAABBDataWithMortonEncode.length <= minCount || searchBitIndex < 1) {
		node.leafAllAABBData = _convertToAllAABBData(sortedAllAABBDataWithMortonEncode)
		node.child1 = null
		node.child2 = null

		return
	}
	else {
		// console.log(sortedAllAABBDataWithMortonEncode, searchBitIndex)
		searchBitIndex = _findSearchBitIndex(sortedAllAABBDataWithMortonEncode, searchBitIndex)
		// console.log(searchBitIndex)

		let firstChangeBitIndex = _binarySearchFirstChangeBitIndex(sortedAllAABBDataWithMortonEncode, searchBitIndex)

		let arr1 = sortedAllAABBDataWithMortonEncode.slice(0, firstChangeBitIndex + 1)
		let arr2 = sortedAllAABBDataWithMortonEncode.slice(firstChangeBitIndex + 1, sortedAllAABBDataWithMortonEncode.length)

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

		_buildByLBVH(child1, minCount, maxDepth, depth + 1, searchBitIndex - 1, arr1)
		_buildByLBVH(child2, minCount, maxDepth, depth + 1, searchBitIndex - 1, arr2)
	}
}

export let buildByLBVH = (allAABBData: Array<aabbData>, minCount = 5, maxDepth = 10): tree => {
	const GRID_X_BIT_COUNT = 10
	const GRID_Y_BIT_COUNT = 10

	let wholeAABB = _computeWholeAABB(allAABBData)
	let tree = {
		wholeAABB,
		leafAllAABBData: null,
		child1: null,
		child2: null
	}

	_buildByLBVH(tree, minCount, maxDepth, 0, GRID_X_BIT_COUNT + GRID_Y_BIT_COUNT, _sortByMorton(
		_mortonEncode(_buildGridPosition(wholeAABB, allAABBData, GRID_X_BIT_COUNT, GRID_Y_BIT_COUNT))
	))

	return tree
}