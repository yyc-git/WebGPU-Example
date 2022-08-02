import WebGPU from "wonder-webgpu";
import { getAllRenderGameObjectData } from "../scene/Scene.js";
import { getC, getR, getW } from "../scene/Geometry.js";
// import { computeRingAABB } from "../math/AABB2D.js";
import { createBuffer } from "../webgpu/Buffer.js";
import { getColor } from "../scene/Material.js";
// import { getLayer, getLocalPosition } from "../scene/Transform.js";

export let buildSceneInstanceDataBufferData = (state, device) => {
    let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material]) => {
        // let localPosition = getLocalPosition(transform, state);
        // bufferDataArr.push(geometry, material, localPosition[0], localPosition[1]);
        bufferDataArr.push(geometry, material, 0, 0);
        return bufferDataArr;
    }, []);
    let bufferData = new Float32Array(bufferDataArr);
    // console.log(bufferData)
    let buffer = createBuffer(device, WebGPU.GPUBufferUsage.STORAGE | WebGPU.GPUBufferUsage.COPY_DST, bufferData);
    return [buffer, bufferData.byteLength];
};
export let buildSceneGeometryDataBufferData = (state, device) => {
    let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material], geometryIndex) => {
        let c = getC(geometry, state);
        let w = getW(geometry, state);
        let r = getR(geometry, state);
        bufferDataArr.push(c[0], c[1], w, r);
        return bufferDataArr;
    }, []);
    let bufferData = new Float32Array(bufferDataArr);
    // console.log(bufferData)
    let buffer = createBuffer(device, WebGPU.GPUBufferUsage.STORAGE | WebGPU.GPUBufferUsage.COPY_DST, bufferData);
    return [buffer, bufferData.byteLength];
};
export let buildSceneMaterialDataBufferData = (state, device) => {
    let bufferDataArr = getAllRenderGameObjectData(state).reduce((bufferDataArr, [gameObject, transform, geometry, material], geometryIndex) => {
        let color = getColor(geometry, state);
        bufferDataArr.push(color[0], color[1], color[2], 0.0);
        return bufferDataArr;
    }, []);
    let bufferData = new Float32Array(bufferDataArr);
    // console.log(bufferData)
    let buffer = createBuffer(device, WebGPU.GPUBufferUsage.STORAGE | WebGPU.GPUBufferUsage.COPY_DST, bufferData);
    return [buffer, bufferData.byteLength];
};