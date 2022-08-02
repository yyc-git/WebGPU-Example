export let exec = (state) => {
    let { window, device, queue } = state.webgpu
    let {
        bindGroup,
        pipeline
    } = state.rayTracingPass

    let commandEncoder = device.createCommandEncoder({});
    let passEncoder = commandEncoder.beginRayTracingPass({});
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.traceRays(
        0, // sbt ray-generation offset
        1, // sbt ray-hit offset
        2, // sbt ray-miss offset
        window.width,  // query width dimension
        window.height, // query height dimension
        1              // query depth dimension
    );
    passEncoder.endPass();
    queue.submit([commandEncoder.finish()]);

    return state
}