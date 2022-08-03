export let createState = () => {
    return {
        // canvas: null,
        // adapter: null,
        // device: null,
        // context: null,
        // format: null,

        config: {
            width: null,
            height: null
        },
        webgpu: {
            window: null,
            device: null,
            adapter: null,
            context: null,
            queue: null,
            swapChainFormat: null,
            swapChain: null
        },


        fps: {
            avgDuration: 0,
            frameCount: 0
        },



        ecsData: [],
        transformBuffer: null,
        geometryBuffer: null,
        materialBuffer: null,
        pass: {
            pixelBufferData: null,
            // resolutionBufferData: null
        },
        rayTracingPass: {
            bindGroup: null,
            pipeline: null
        },
        screenPass: {
            bindGroup: null,
            pipeline: null
        }
    };
};