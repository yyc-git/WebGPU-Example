import { create } from "../math/Vector3"

export let getColor = (material, { materialBuffer }) => {
	let offset = material * 3

	return create(materialBuffer[offset], materialBuffer[offset] + 1, materialBuffer[offset] + 2)
}
