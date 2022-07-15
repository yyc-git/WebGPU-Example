import { create } from "../math/Vector2"

export let getLocalPosition = (transform, { transformBuffer }) => {
	let offset = transform * 2

	return create(transformBuffer[offset], transformBuffer[offset + 1])
}
