const wgsl = `
override workgroupSize = 64;

var<workgroup> shareData: array<f32,workgroupSize>;

struct Source {
  data : array<f32>
}

struct Result {
  data : array<f32>
}

@binding(0) @group(0) var<storage, read> source : Source;
@binding(1) @group(0) var<storage, read_write> result :  Result;

@compute @workgroup_size(workgroupSize, 1, 1)
fn main(
@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>, 
@builtin(local_invocation_index) LocalInvocationIndex : u32,
@builtin(workgroup_id) WorkgroupID : vec3<u32>
) {
shareData[LocalInvocationIndex] = source.data[GlobalInvocationID.x];
workgroupBarrier();

for (var s: u32 = 1; s < workgroupSize; s = s * 2) {
if(LocalInvocationIndex % (2 * s) == 0){
  shareData[LocalInvocationIndex] += shareData[LocalInvocationIndex + s];
}
workgroupBarrier();
}

if(LocalInvocationIndex == 0){
result.data[WorkgroupID.x] = shareData[0];
}
}
`;

export async function test() {
	const adapter = await navigator.gpu.requestAdapter();
	const device = await adapter.requestDevice();

	const computePipeline = device.createComputePipeline({
		layout: 'auto',
		compute: {
			module: device.createShaderModule({
				code: wgsl,
			}),
			entryPoint: 'main',
		},
	});

	const source = new Float32Array(64 * 2);
	for (let i = 0; i < 64 * 2; i++) {
		// source[i] = Math.random();
		source[i] = i;
	}

	const sourceBuffer = device.createBuffer({
		size: source.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(sourceBuffer, 0, source.buffer);

	const resultBufferSize = 2 * Float32Array.BYTES_PER_ELEMENT;
	const resultBuffer = device.createBuffer({
		size: resultBufferSize,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
	});

	const bindGroup = device.createBindGroup({
		layout: computePipeline.getBindGroupLayout(0),
		entries: [
			{
				binding: 0,
				resource: {
					buffer: sourceBuffer,
					size: source.byteLength
				},
			},
			{
				binding: 1,
				resource: {
					buffer: resultBuffer,
					size: resultBufferSize
				},
			},
		],
	});

	const commandEncoder = device.createCommandEncoder();
	const passEncoder = commandEncoder.beginComputePass();
	passEncoder.setPipeline(computePipeline);
	passEncoder.setBindGroup(0, bindGroup);
	passEncoder.dispatchWorkgroups(2, 1, 1);
	passEncoder.end();


	const readBuf = device.createBuffer({
		size: resultBufferSize,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
	});

	commandEncoder.copyBufferToBuffer(resultBuffer, 0, readBuf, 0, resultBufferSize);


	device.queue.submit([commandEncoder.finish()]);


	await readBuf.mapAsync(GPUMapMode.READ);
	const result = new Float32Array(readBuf.getMappedRange());
	readBuf.unmap();

	// buf.destroy();
	// readBuf.destroy();

	console.log(source);
	console.log(result);
}

test()