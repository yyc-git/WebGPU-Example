import * as Vector2 from "./Vector2"

export type t = {
	screenMin: Vector2.t,
	screenMax: Vector2.t
}

export let create = (screenMin, screenMax): t => { return { screenMin, screenMax } };

export let computeRingAABB = ([localPositionX, localPositionY]: Vector2.t, [cx, cy]: Vector2.t, r, w): t => {
	let px = cx + localPositionX
	let py = cy + localPositionY

	return create(
		Vector2.create(
			px - r - w,
			py - r - w,
		),
		Vector2.create(
			px + r + w,
			py + r + w,
		)
	)
}

export let computeCenter = ({ screenMin, screenMax }: t) => {
	return Vector2.create(
		(screenMax[0] + screenMin[0]) / 2,
		(screenMax[1] + screenMin[1]) / 2
	)
}
export let setByPoints = (points): t => {
	let minX = +Infinity
	let minY = +Infinity
	let maxX = -Infinity
	let maxY = -Infinity

	for (let i = 0; i < points.length; i++) {
		let [x, y] = points[i]

		minX = Math.min(minX, x)
		minY = Math.min(minY, y)

		maxX = Math.max(maxX, x)
		maxY = Math.max(maxY, y)
	}

	return {
		screenMin: Vector2.create(minX, minY),
		screenMax: Vector2.create(maxX, maxY),
	}
}

export let isAABBIntersection = (aabb1: t, aabb2: t): boolean => {
	return aabb2.screenMax[0] < aabb1.screenMin[0] || aabb2.screenMin[0] > aabb1.screenMax[0] ||
		aabb2.screenMax[1] < aabb1.screenMin[1] || aabb2.screenMin[1] > aabb1.screenMax[1] ? false : true;

	// return !(aabb2.screenMin[0] > aabb1.screenMax[0]
	// 	|| aabb2.screenMax[0] < aabb1.screenMin[0]
	// 	|| aabb2.screenMax[1] > aabb1.screenMin[1]
	// 	|| aabb2.screenMin[1] < aabb1.screenMax[1])
}