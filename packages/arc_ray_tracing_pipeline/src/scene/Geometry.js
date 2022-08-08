import { create } from "../math/Vector2.js";
let _getStride = () => {
    return 8;
};
export let getC = (geometry, { geometryBuffer }) => {
    let offset = geometry * _getStride();
    return create(geometryBuffer[offset], geometryBuffer[offset + 1]);
};
export let getW = (geometry, { geometryBuffer }) => {
    let offset = geometry * _getStride();
    return geometryBuffer[offset + 2];
};
export let getR = (geometry, { geometryBuffer }) => {
    let offset = geometry * _getStride();
    return geometryBuffer[offset + 3];
};
export let getC2 = (geometry, { geometryBuffer }) => {
    let offset = geometry * _getStride();
    return create(geometryBuffer[offset + 4], geometryBuffer[offset + 5]);
};
export let getW2 = (geometry, { geometryBuffer }) => {
    let offset = geometry * _getStride();
    return geometryBuffer[offset + 6];
};
export let getR2 = (geometry, { geometryBuffer }) => {
    let offset = geometry * _getStride();
    return geometryBuffer[offset + 7];
};