import { create, t } from "./AABB2D";
import * as Vector2 from "./Vector2"

export type tree = {
	wholeAABB: t,
	leafAllAABBs: Array<t> | null,
	child1: tree | null,
	child2: tree | null
}

let _sort = (getAxizFunc, allAABBs: Array<t>) => {
	return allAABBs.sort((a, b) => {
		return getAxizFunc(a.worldMin) - getAxizFunc(b.worldMin)
	})
}

let _computeWholeAABB = (allAABBs) => {
	let [worldMin, worldMax] = allAABBs.reduce(([worldMin, worldMax], aabb) => {
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
let _build = (node, minCount, getAxizFuncs, getAxizFuncIndex, allAABBs: Array<t>): void => {
	if (allAABBs.length <= minCount) {
		// node.wholeAABB = _computeWholeAABB(sortedAllAABBData)
		node.leafAllAABBs = allAABBs
		node.child1 = null
		node.child2 = null

		return
	}
	else {
		let sortedAllAABBData = _sort(getAxizFuncs[getAxizFuncIndex % 2], allAABBs)

		let splitIndex = Math.floor(sortedAllAABBData.length / 2)

		let arr1 = sortedAllAABBData.slice(0, splitIndex)
		let arr2 = sortedAllAABBData.slice(splitIndex + 1, sortedAllAABBData.length)

		let child1 = {
			wholeAABB: _computeWholeAABB(arr1),
			leafAllAABBs: null,
			child1: null,
			child2: null
		}
		let child2 = {
			wholeAABB: _computeWholeAABB(arr2),
			leafAllAABBs: null,
			child1: null,
			child2: null
		}

		// node.wholeAABB = _computeWholeAABB(sortedAllAABBData)
		node.leafAllAABBs = null
		node.child1 = child1
		node.child2 = child2

		_build(child1, minCount, getAxizFuncs, getAxizFuncIndex + 1, arr1)
		_build(child2, minCount, getAxizFuncs, getAxizFuncIndex + 1, arr2)
	}
}

// TODO perf: use LBVH
export let build = (allAABBs: Array<t>): tree => {
	const MIN_COUNT = 5
	let tree = {
		wholeAABB: _computeWholeAABB(allAABBs),
		leafAllAABBs: null,
		child1: null,
		child2: null
	}

	_build(tree, MIN_COUNT, [
		(vec2) => vec2.x,
		(vec2) => vec2.y
	], 0, allAABBs)

	return tree
}


// let traverse = () => {
// return 1 as any
// }