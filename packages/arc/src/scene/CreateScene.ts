export let createTransformBuffer = (): Float32Array => {
	return new Float32Array([
		0.0,
		0.0
	])
}

export let createGeometryBuffer = (): Float32Array => {
	let w = 2.0
	let r = 5.0

	return new Float32Array([
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