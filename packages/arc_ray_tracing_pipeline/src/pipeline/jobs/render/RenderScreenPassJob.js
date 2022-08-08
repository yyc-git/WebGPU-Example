export let exec = (state) => {
    let { swapChain, device, queue } = state.webgpu
    let {
        bindGroup,
        pipeline
    } = state.screenPass

    let backBufferView = swapChain.getCurrentTextureView();
    let commandEncoder = device.createCommandEncoder({});
    let passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [{
            clearColor: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            loadOp: "clear",
            storeOp: "store",
            attachment: backBufferView
        }]
    });
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.endPass();
    queue.submit([commandEncoder.finish()]);

    return state
}