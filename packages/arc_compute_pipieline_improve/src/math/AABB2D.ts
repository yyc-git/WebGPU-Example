import * as Vector2 from "./Vector2"

export type t = {
	worldMin: Vector2.t,
	worldMax: Vector2.t
}

export let create = (worldMin, worldMax): t => { return { worldMin, worldMax } };

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

export let computeCenter = ({ worldMin, worldMax }: t) => {
	return Vector2.create(
		(worldMax[0] + worldMin[0]) / 2,
		(worldMax[1] + worldMin[1]) / 2
	)
}
export let setByPoints = (points): t => {
	let minX = +Infinity
	let minY = +Infinity
	let maxX = -Infinity
	let maxY = -Infinity

	for (let i = 0; i < points.length; i++) {
		let [x, y] = points[i]
		if (x > maxX) {
			maxX = x
		} else if (x < minX) {
			minX = x
		} else if (y > maxY) {
			maxY = y
		}
		else if (y < minY) {
			minY = y
		}
	}

	return {
		worldMin: Vector2.create(minX, minY),
		worldMax: Vector2.create(maxX, maxY),
	}
}

export let isAABBIntersection = (aabb1: t, aabb2: t): boolean => {
	return !(aabb2.worldMin[0] > aabb1.worldMax[0]
		|| aabb2.worldMax[0] < aabb1.worldMin[0]
		|| aabb2.worldMax[1] > aabb1.worldMin[1]
		|| aabb2.worldMin[1] < aabb1.worldMax[1])
}