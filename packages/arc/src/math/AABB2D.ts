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