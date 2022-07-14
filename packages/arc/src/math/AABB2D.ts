import * as Vector2 from "./Vector2"
import type * as Vector2Type from "./Vector2"

type t = {
	min: Vector2Type.t,
	max: Vector2Type.t
}

export let create = (min, max): t => { return { min, max } };

export let computeRingAABB = ([cx, cy]: Vector2Type.t, r, w): t => {
	return create(
		Vector2.create(
			cx - r - w,
			cy - r - w,
		),
		Vector2.create(
			cx + r + w,
			cy + r + w,
		)
	)
}