import WebGPU from "wonder-webgpu";

let _buildPixelBufferData = (window, device) => {
    let bufferSize =
        window.width *
        window.height *
        4 *
        Float32Array.BYTES_PER_ELEMENT;

    let buffer = device.createBuffer({
        size: bufferSize,
        usage: WebGPU.GPUBufferUsage.STORAGE
    });

    return [buffer, bufferSize];
}


let _buildPixelIsMissBufferData = (window, device) => {
    let bufferSize =
        window.width *
        window.height *
        1 *
        Uint32Array.BYTES_PER_ELEMENT;

    let buffer = device.createBuffer({
        size: bufferSize,
        usage: WebGPU.GPUBufferUsage.STORAGE
    });

    return [buffer, bufferSize];
}


export let exec = (state) => {
    let { device, window } = state.webgpu

    return {
        ...state,
        pass: {
            pixelBufferData: _buildPixelBufferData(window, device),
            pixelIsMissBufferData: _buildPixelIsMissBufferData(window, device)
        }
    };
}