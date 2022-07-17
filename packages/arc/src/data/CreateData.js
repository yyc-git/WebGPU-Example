export let createState = () => {
    return {
        canvas: null,
        adapter: null,
        device: null,
        context: null,
        format: null,
        // transformBuffer: new Float32Array(count * 2),
        // geometryBuffer: new Float32Array(count * 4),
        // materialBuffer: new Float32Array(count * 3),
        ecsData: [],
        transformBuffer: null,
        geometryBuffer: null,
        materialBuffer: null,
        pass: {
            pixelBufferData: null,
            resolutionBufferData: null
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
//# sourceMappingURL=CreateData.js.map