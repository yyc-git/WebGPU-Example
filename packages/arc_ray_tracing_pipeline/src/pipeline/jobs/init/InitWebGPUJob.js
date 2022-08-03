import WebGPU from "wonder-webgpu";

export let exec = async (state) => {
    // let { width, height } = getConfig();
    let { width, height } = state.config

    let window = new WebGPU.WebGPUWindow({
        width,
        height,
        title: "Wonder-RTX-Path-Tracer-Education",
        resizable: false
    });

    let context = window.getContext("webgpu");

    let adapter = await WebGPU.GPU.requestAdapter({ window, preferredBackend: "Vulkan" });
    
    let device = await adapter.requestDevice({ extensions: ["ray_tracing"] });

    let queue = device.getQueue();

    let swapChainFormat = await context.getSwapChainPreferredFormat(device);

    let swapChain = context.configureSwapChain({
        device: device,
        format: swapChainFormat
    });

    // setWebGPU({
    //     window,
    //     device,
    //     adapter,
    //     context,
    //     queue,
    //     swapChainFormat,
    //     swapChain,
    // });

    return {
        ...state,
        webgpu: {
            window,
            device,
            adapter,
            context,
            queue,
            swapChainFormat,
            swapChain,
        }
    }
}