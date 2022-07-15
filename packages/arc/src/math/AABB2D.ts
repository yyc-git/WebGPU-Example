import * as Vector2 from "./Vector2"
import type * as Vector2Type from "./Vector2"

type t = {
	worldMin: Vector2Type.t,
	worldMax: Vector2Type.t
}

export let create = (worldMin, worldMax): t => { return { worldMin, worldMax } };

export let computeRingAABB = ([localPositionX, localPositionY]: Vector2Type.t, [cx, cy]: Vector2Type.t, r, w): t => {
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