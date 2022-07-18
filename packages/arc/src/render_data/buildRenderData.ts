import { getAllRenderGameObjectData } from "../scene/Scene";
import { getC, getR, getW } from "../scene/Geometry"
import { computeRingAABB } from "../math/AABB2D";
import { createBuffer } from "../webgpu/Buffer";
import { getColor } from "../scene/Material";
import { getLocalPosition } from "../scene/Transform";
import * as BVH2D from "../math/BVH2D";
import * as Acceleration from "../math/Acceleration";
import { flatten } from "../math/Array";

export let buildSceneAccelerationStructureBufferData = (state, device) => {
	// TODO use pipe
	let allAABBData = getAllRenderGameObjectData(state).map(([gameObject, transform, geometry, material], instanceIndex) => {
		let c = getC(geometry, state)
		let w = getW(geometry, state)
		let r = getR(geometry, state)

		let localPosition = getLocalPosition(transform, state)

		return {
			aabb: computeRingAABB(localPosition, c, r, w),
			instanceIndex
		}
	})

	let tree = BVH2D.build(allAABBData)
	let [topLevelArr, bottomLevelArr] = Acceleration.build(tree)


	let topLevelBufferData = new Float32Array(flatten(topLevelArr))

	let topLevelBuffer = createBuffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, topLevelBufferData)

	let bottomLevelBufferData = new Float32Array(flatten(bottomLevelArr))

	let bottomLevelBuffer = createBuffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, bottomLevelBufferData)


	return [
		topLevelBuffer, topLevelBufferData.byteLength,
		bottomLevelBuffer, bottomLevelBufferData.byteLength
	];
}

export let buildSceneInstanceDataBufferData = (state, device) => {
	let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material]) => {
		let localPosition = getLocalPosition(transform, state)

		bufferDataArr.push(
			geometry,
			material,
			localPosition[0],
			localPosition[1]
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