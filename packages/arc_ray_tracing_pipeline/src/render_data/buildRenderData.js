import WebGPU from "wonder-webgpu";
import { getAllRenderGameObjectData } from "../scene/Scene.js";
import { getC, getR, getW } from "../scene/Geometry.js";
// import { computeRingAABB } from "../math/AABB2D.js";
import { createBuffer } from "../webgpu/Buffer.js";
import { getColor } from "../scene/Material.js";

// export let buildSceneInstanceDataBufferData = (state, device) => {
//     //  TODO split instance buffer
//     // let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material]) => {
//     let bufferDataArr = getAllRenderGameObjectData(state).slice(0, 10).reduce((bufferDataArr, [gameObject, transform, geometry, material]) => {
//         // bufferDataArr.push(geometry, material, 0, 0);
//         let stride = 4
//         bufferDataArr[transform * stride] = geometry
//         bufferDataArr[transform * stride + 1] = material
//         bufferDataArr[transform * stride + 2] = 0
//         bufferDataArr[transform * stride + 3] = 0

//         return bufferDataArr;
//     }, []);
//     let bufferData = new Float32Array(bufferDataArr);
//     // console.log(bufferData.length)
//     let buffer = createBuffer(device, WebGPU.GPUBufferUsage.STORAGE | WebGPU.GPUBufferUsage.COPY_DST, bufferData);
//     return [buffer, bufferData.byteLength];
// };



export let addToSceneInstanceDataBufferDataArr = (bufferDataArr, instanceIndex, geometry, material) => {
    let stride = 4

    bufferDataArr[instanceIndex * stride] = geometry
    bufferDataArr[instanceIndex * stride + 1] = material
    bufferDataArr[instanceIndex * stride + 2] = 0
    bufferDataArr[instanceIndex * stride + 3] = 0

    return bufferDataArr
};

export let buildSceneGeometryDataBufferData = (state, device) => {
    let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material], geometryIndex) => {
        let c = getC(geometry, state);
        let w = getW(geometry, state);
        let r = getR(geometry, state);
        // bufferDataArr.push(c[0], c[1], w, r);
        let stride = 4
        bufferDataArr[geometry * stride] = c[0]
        bufferDataArr[geometry * stride + 1] = c[1]
        bufferDataArr[geometry * stride + 2] = w
        bufferDataArr[geometry * stride + 3] = r

        return bufferDataArr;
    }, []);
    let bufferData = new Float32Array(bufferDataArr);
    let buffer = createBuffer(device, WebGPU.GPUBufferUsage.STORAGE | WebGPU.GPUBufferUsage.COPY_DST, bufferData);
    return [buffer, bufferData.byteLength];
};
export let buildSceneMaterialDataBufferData = (state, device) => {
    let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material], geometryIndex) => {
        let color = getColor(geometry, state);
        // bufferDataArr.push(color[0], color[1], color[2], 0.0);

        let stride = 4
        bufferDataArr[material * stride] = color[0]
        bufferDataArr[material * stride + 1] = color[1]
        bufferDataArr[material * stride + 2] = color[2]
        bufferDataArr[material * stride + 3] = 0.0

        return bufferDataArr;
    }, []);
    let bufferData = new Float32Array(bufferDataArr);
    // console.log(bufferData)
    let buffer = createBuffer(device, WebGPU.GPUBufferUsage.STORAGE | WebGPU.GPUBufferUsage.COPY_DST, bufferData);
    return [buffer, bufferData.byteLength];
};