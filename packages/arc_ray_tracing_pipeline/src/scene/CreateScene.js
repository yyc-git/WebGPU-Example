import { create } from "../math/Vector2.js";

export let createTransformBuffer = (count) => {
    let layers = [1, 2, 3, 4];
    let data = [];
    for (let i = 0; i < count; i++) {
        data.push(Math.random() * 2 - 1);
        data.push(Math.random() * 2 - 1);

        data.push(layers[Math.floor(Math.random() * 4)]);
    }
    return new Float32Array(data);
};
export let createGeometryBuffer = (count) => {
    let c = create(0, 0);
    // let w = 2.0
    // let r = 5.0
    // let w = 0.2
    // let r = 0.5
    let w = 0.02
    let r = 0.05
    // let w = 0.002;
    // let r = 0.005;
    // let w = 0.008
    // let r = 0.020
    // let w = 0.001
    // let r = 0.0025
    return new Float32Array([
        c[0],
        c[1],
        w,
        r
    ]);
};
export let createMaterialBuffer = (count) => {
    let color = [
        1.0, 0.0, 0.0
    ];
    return new Float32Array(color);
};
export let createScene = (transformCount) => {
    let allRenderGameObjectData = [];
    for (let i = 0; i < transformCount; i++) {
        allRenderGameObjectData.push([i, i, 0, 0]);
    }
    return allRenderGameObjectData;
};
//# sourceMappingURL=CreateScene.js.map