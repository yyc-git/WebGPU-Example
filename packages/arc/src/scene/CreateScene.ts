import { create } from "../math/Vector2"

export let createTransformBuffer = (): Float32Array => {
	return new Float32Array([
		0.0,
		0.0
	])
}

export let createGeometryBuffer = (): Float32Array => {
	let c = create(0, 0)
	// let w = 2.0
	// let r = 5.0
	let w = 0.2
	let r = 0.5

	return new Float32Array([
		c[0],
		c[1],
		w,
		r
	])
}

export let createMaterialBuffer = (): Float32Array => {
	let color = [
		1.0, 0.0, 0.0
	]

	return new Float32Array(color)
}