type pass = {
	pixelBufferData: [GPUBuffer, Float32Array] | null,
	resolutionBufferData: [GPUBuffer, Float32Array] | null
}

type rayTracingPass = {
	bindGroup: GPUBindGroup | null,
	pipeline: GPUComputePipeline | null
}

type screenPass = {
	bindGroup: GPUBindGroup | null,
	pipeline: GPUComputePipeline | null
}

type state = {
	canvas: HTMLCanvasElement | null,
	adapter: GPUAdapter | null,
	device: GPUDevice | null,
	context: GPUCanvasContext | null,
	format: GPUTextureFormat | null,

	transformBuffer: Float32Array,
	geometryBuffer: Float32Array,
	materialBuffer: Float32Array,

	pass: pass,
	rayTracingPass: rayTracingPass,
	screenPass: screenPass
}

let createState = (count) => {
	return {
		canvas: null,
		adapter: null,
		device: null,
		context: null,
		format: null,
		transformBuffer: new Float32Array(count * 2),
		geometryBuffer: new Float32Array(count * 4),
		materialBuffer: new Float32Array(count * 3),
		pass: {
			pixelBufferData: null,
			resolutionBufferData: null
		},
		rayTracingPass: {
			bindGroup: null,
			pipeline: null
		},
		screenPass: {
			bindGroup: null,
			pipeline: null
		}
	}
}