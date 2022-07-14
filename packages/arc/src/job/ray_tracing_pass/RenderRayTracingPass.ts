import { getSize } from "../../utils/SizeUtils";

export let exec = (state) => {
	let { device, canvas, rayTracingPass } = state
	let { bindGroup, pipeline } = rayTracingPass

	let [width, height] = getSize(canvas)

	const commandEncoder = device.createCommandEncoder();

	const passEncoder = commandEncoder.beginComputePass();
	passEncoder.setPipeline(pipeline);
	passEncoder.setBindGroup(0, bindGroup);
	passEncoder.dispatchWorkgroups(width, height, 1);
	passEncoder.end();

	device.queue.submit([commandEncoder.finish()]);

	return state
}