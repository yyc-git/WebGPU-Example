import { buildSceneAccelerationStructureBufferData, buildSceneGeometryDataBufferData, buildSceneInstanceDataBufferData, buildSceneMaterialDataBufferData } from "../../render_data/buildRenderData";
import { computeShader } from "../../shader/ray_tracing";

export let exec = (state) => {
	let { device } = state

	const pipeline = device.createComputePipeline({
		layout: 'auto',
		compute: {
			module: device.createShaderModule({ code: computeShader }),
			entryPoint: 'main',
		},
	});


	let { pixelBufferData, resolutionBufferData } = state.pass

	let [pixelBuffer, pixelBufferSize] = pixelBufferData;
	let [resolutionBuffer, resolutionData] = resolutionBufferData;


	let [sceneAccelerationStructureBuffer, sceneAccelerationStructureBufferSize] = buildSceneAccelerationStructureBufferData(state, device);
	let [geometryDataBuffer, geometryDataBufferSize] = buildSceneGeometryDataBufferData(state, device);
	let [instanceDataBuffer, instanceDataBufferSize] = buildSceneInstanceDataBufferData(state, device);
	let [materialDataBuffer, materialDataBufferSize] = buildSceneMaterialDataBufferData(state, device);

	let bindGroup = device.createBindGroup({
		layout: pipeline.getBindGroupLayout(0),
		entries: [
			{
				binding: 0,
				resource: {
					buffer: sceneAccelerationStructureBuffer,
					size: sceneAccelerationStructureBufferSize
				},
			},
			{
				binding: 1,
				resource: {
					buffer: instanceDataBuffer,
					size: instanceDataBufferSize
				},
			},
			{
				binding: 2,
				resource: {
					buffer: geometryDataBuffer,
					size: geometryDataBufferSize
				},
			},
			{
				binding: 3,
				resource: {
					buffer: materialDataBuffer,
					size: materialDataBufferSize
				},
			},
			{
				binding: 4,
				resource: {
					buffer: geometryDataBuffer,
					size: geometryDataBufferSize
				},
			},
			{
				binding: 5,
				resource: {
					buffer: pixelBuffer,
					size: pixelBufferSize
				},
			},
			{
				binding: 6,
				resource: {
					buffer: resolutionBuffer,
					size: resolutionData.byteLength
				},
			},
		],
	});

	return {
		...state,
		bindGroup,
		pipeline
	}
}