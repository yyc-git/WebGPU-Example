import { computeCenter, create, t } from "./AABB2D";
import { qsort } from "./Array";
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
let _build = (node, minCount, getAxizFuncs, getAxizFuncIndex, allAABBData): void => {
	if (allAABBData.length <= minCount) {
		// node.wholeAABB = _computeWholeAABB(sortedAllAABBData)
		node.leafAllAABBData = allAABBData
		node.child1 = null
		node.child2 = null

		return
	}
	else {
		let sortedAllAABBData = _sort(getAxizFuncs[getAxizFuncIndex % 2], allAABBData)
		// console.log(sortedAllAABBData);


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

		_build(child1, minCount, getAxizFuncs, getAxizFuncIndex + 1, arr1)
		_build(child2, minCount, getAxizFuncs, getAxizFuncIndex + 1, arr2)
	}
}

export let build = (allAABBData: Array<aabbData>, minCount = 5): tree => {
	let tree = {
		wholeAABB: _computeWholeAABB(allAABBData),
		leafAllAABBData: null,
		child1: null,
		child2: null
	}

	_build(tree, minCount, [
		(vec2) => vec2[0],
		(vec2) => vec2[1]
	], 0, allAABBData)

	return tree
}