type state = {
	transformBuffer: Float32Array,
	geometryBuffer: Float32Array,
	materialBuffer: Float32Array,
}

let createState = (count) => {
	return {
		transformBuffer: new Float32Array(count * 2),
		geometryBuffer: new Float32Array(count * 2),
		materialBuffer: new Float32Array(count * 3),
	}
}