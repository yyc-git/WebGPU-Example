import { create } from "../math/Vector2.js";

export let createTransformBuffer = (count) => {
    // let layers = [1, 2, 3, 4];
    let layers = [0.00001, 0.00002, 0.00003, 0.00004];
    // let layers = [0.00001, 0.00002];
    // let layers = [0.00001];
    let data = [];

    for (let i = 0; i < count; i++) {
        data.push(Math.random() * 2 - 1);
        data.push(Math.random() * 2 - 1);

        // data.push(layers[Math.floor(Math.random() * 4)]);
        data.push(layers[i % 4]);
    }
    return new Float32Array(data);
};

// export let createGeometryBuffer = (count) => {
//     let c = create(0, 0);
//     // let w = 2.0
//     // let r = 5.0
//     // let w = 0.2
//     // let r = 0.5
//     // let w = 0.02
//     // let r = 0.05
//     // let w = 0.002;
//     // let r = 0.005;
//     let w = 0.004;
//     let r = 0.010;

//     // let w = 0.008
//     // let r = 0.020

//     // let w = 0.08
//     // let r = 0.04
//     return new Float32Array([
//         c[0],
//         c[1],
//         w,
//         r
//     ]);
// };


export let createGeometryBuffer2 = (count) => {
    let c = create(0, 0);
    let w = 0.004;
    let r = 0.010;

    // let c2 = create(0.01, 0.01);
    let c2 = create(0.0, 0.0);
    let w2 = 0.004;
    let r2 = 0.010;


    return new Float32Array([
        c[0],
        c[1],
        w,
        r,

        c2[0],
        c2[1],
        w2,
        r2
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
    console.log(allRenderGameObjectData[allRenderGameObjectData.length - 1]);
    return allRenderGameObjectData;
};
//# sourceMappingURL=CreateScene.js.map