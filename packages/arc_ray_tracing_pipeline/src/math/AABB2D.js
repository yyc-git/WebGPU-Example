import * as Vector2 from "./Vector2.js";
export let create = (localMin, localMax) => { return { localMin, localMax }; };
// export let computeRingAABB = ([localPositionX, localPositionY], [cx, cy], r, w) => {
//     let px = cx + localPositionX;
//     let py = cy + localPositionY;
//     return create(Vector2.create(px - r - w, py - r - w), Vector2.create(px + r + w, py + r + w));
// };

export let computeRingAABB = ([cx, cy], r, w) => {
    let px = cx
    let py = cy

    return create(Vector2.create(px - r - w, py - r - w), Vector2.create(px + r + w, py + r + w));
};


export let computeWholeAABBData = (allAABBData, dataStartIndex, dataLength) => {
	let localMin = Vector2.create(
		Infinity,
		Infinity,
	)
	let localMax = Vector2.create(
		-Infinity,
		-Infinity,
	)

	for (let i = dataStartIndex; i < dataStartIndex + dataLength; i++) {
		let aabb = allAABBData[i]

		let aabblocalMin = aabb.localMin
		let aabblocalMax = aabb.localMax

		if (aabblocalMin[0] < localMin[0]) {
			localMin[0] = aabblocalMin[0]
		}
		if (aabblocalMin[1] < localMin[1]) {
			localMin[1] = aabblocalMin[1]
		}

		if (aabblocalMax[0] > localMax[0]) {
			localMax[0] = aabblocalMax[0]
		}
		if (aabblocalMax[1] > localMax[1]) {
			localMax[1] = aabblocalMax[1]
		}
	}

	return create(localMin, localMax)
}