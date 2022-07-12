import { getAllRenderGameObjectData } from "../scene/Scene";
import { getC, getR, getW } from "../scene/Geometry"
import { computeRingAABB } from "../math/2DAABB";
import { createBuffer } from "../webgpu/Buffer";
import { getColor } from "../scene/Material";

export let buildSceneAccelerationStructureBufferData = (state, device) => {
	// let { transformBuffer, geometryBuffer, materialBuffer } = state

	let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material], geometryIndex) => {
		let instanceIndex = geometryIndex

		let c = getC(geometry, state)
		let w = getW(geometry, state)
		let r = getR(geometry, state)

		let { min, max } = computeRingAABB(c, r, w)

		bufferDataArr.push(
			min[0],
			min[1],
		);
		bufferDataArr.push(
			max[0],
			max[1],
		);

		bufferDataArr.push(
			instanceIndex,
			0.0,
			0.0,
			0.0,
		);

		return bufferDataArr;
	}, [])

	let bufferData = new Float32Array(bufferDataArr);

	// console.log(bufferData)

	let buffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, bufferData)

	return [buffer, bufferData.byteLength];
}

export let buildSceneInstanceDataBufferData = (state, device) => {
	let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material], geometryIndex) => {
		bufferDataArr.push(
			geometry,
			material,
			0.0,
			0.0
		);

		return bufferDataArr;
	}, [])

	let bufferData = new Float32Array(bufferDataArr);

	// console.log(bufferData)

	let buffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, bufferData)

	return [buffer, bufferData.byteLength];

}

export let buildSceneGeometryDataBufferData = (state, device) => {
	let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material], geometryIndex) => {
		let c = getC(geometry, state)
		let w = getW(geometry, state)
		let r = getR(geometry, state)

		bufferDataArr.push(
			c[0],
			c[1],
			w,
			r
		);

		return bufferDataArr;
	}, [])

	let bufferData = new Float32Array(bufferDataArr);

	// console.log(bufferData)

	let buffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, bufferData)

	return [buffer, bufferData.byteLength];
}

export let buildSceneMaterialDataBufferData = (state, device) => {
	let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material], geometryIndex) => {
		let color = getColor(geometry, state)

		bufferDataArr.push(
			color[0],
			color[1],
			color[2],
			0.0
		);

		return bufferDataArr;
	}, [])

	let bufferData = new Float32Array(bufferDataArr);

	// console.log(bufferData)

	let buffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, bufferData)

	return [buffer, bufferData.byteLength];
}