import { create } from "../math/Vector3.js";
let _getStride = () => {
    return 3;
};
export let getColor = (material, { materialBuffer }) => {
    let offset = material * _getStride();
    return create(materialBuffer[offset], materialBuffer[offset + 1], materialBuffer[offset + 2]);
};
//# sourceMappingURL=Material.js.map