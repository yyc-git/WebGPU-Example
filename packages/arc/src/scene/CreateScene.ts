import { create } from "../math/Vector2"

export let createTransformBuffer = (count): Float32Array => {
	let posArr = []

	for (let i = 0; i < count; i++) {
		posArr.push(Math.random() * 2 - 1)
		posArr.push(Math.random() * 2 - 1)
		// posArr.push(Math.random()  * 0.5)
		//  posArr.push(Math.random() * 0.5 )
	}

	return new Float32Array(posArr)
}

export let createGeometryBuffer = (count): Float32Array => {
	let c = create(0, 0)
	// let w = 2.0
	// let r = 5.0
	let w = 0.02
	let r = 0.05
	// let w = 0.002
	// let r = 0.005
	// let w = 0.008
	// let r = 0.020
	// let w = 0.001
	// let r = 0.0025

	return new Float32Array([
		c[0],
		c[1],
		w,
		r
	])
}

export let createMaterialBuffer = (count): Float32Array => {
	let color = [
		1.0, 0.0, 0.0
	]

	return new Float32Array(color)
}

export let createScene = (transformCount) => {
	let allRenderGameObjectData = []

	for (let i = 0; i < transformCount; i++) {
		allRenderGameObjectData.push([i, i, 0, 0])
	}

	return allRenderGameObjectData
}