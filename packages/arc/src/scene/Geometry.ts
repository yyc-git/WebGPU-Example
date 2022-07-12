import { create } from "../math/Vector2"

export let getC = (geometry, { geometryBuffer }) => {
	let offset = geometry * 4

	return create(geometryBuffer[offset], geometryBuffer[offset] + 1)
}


export let getW = (geometry, { geometryBuffer }) => {
	let offset = geometry * 4

	return geometryBuffer[offset] + 2
}

export let getR = (geometry, { geometryBuffer }) => {
	let offset = geometry * 4

	return geometryBuffer[offset] + 3
}