const wgsl = `
const workgroupSize = 64;
// TODO why can't use?
// const elementCount = 128;

var<workgroup> arrOfTwoElements: array<f32,128>;

struct BeforeSortData {
  data : array<f32, 128>
}

struct AfterSortData {
  data : array<f32, 128>
}


@binding(0) @group(0) var<storage, read> beforeSortData : BeforeSortData;
@binding(1) @group(0) var<storage, read_write> afterSortData :  AfterSortData;

// for only one group, 64 items

@compute @workgroup_size(workgroupSize, 1, 1)
fn main(
@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>, 
@builtin(local_invocation_index) LocalInvocationIndex : u32,
@builtin(workgroup_id) WorkgroupID : vec3<u32>
) {

var index = GlobalInvocationID.x * 2;

arrOfTwoElements[index] = beforeSortData.data[index];
arrOfTwoElements[index+ 1 ] = beforeSortData.data[index + 1];

workgroupBarrier();

var firstIndex:u32;
var secondIndex:u32;

for (var i: u32 = 0; i < workgroupSize; i += 1) {
	// TODO extract odd, even sort

firstIndex = index;
secondIndex = index + 1;

if(arrOfTwoElements[firstIndex] > arrOfTwoElements[secondIndex]){
	var temp = arrOfTwoElements[firstIndex];
arrOfTwoElements[firstIndex] = arrOfTwoElements[secondIndex];
arrOfTwoElements[secondIndex] = temp;
}

workgroupBarrier();

firstIndex = index + 1;
secondIndex = index + 2;

// TODO extract 128 to be elementCount
if(secondIndex <128 && arrOfTwoElements[firstIndex] > arrOfTwoElements[secondIndex]){
	// TODO duplicate
	var temp = arrOfTwoElements[firstIndex];
arrOfTwoElements[firstIndex] = arrOfTwoElements[secondIndex];
arrOfTwoElements[secondIndex] = temp;
}

workgroupBarrier();
}

afterSortData.data[index] = arrOfTwoElements[index];
afterSortData.data[index + 1] = arrOfTwoElements[index + 1];

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

	const beforeSortData = new Float32Array(64 * 2);
	for (let i = 0; i < 64 * 2; i++) {
	// for (let i = 64 * 2 -1; i >= 0; i--) {
		// beforeSortData[i] = Math.random();
		beforeSortData[i] = 64 * 2 - i - 1;
	}

	const beforeSortDataBuffer = device.createBuffer({
		size: beforeSortData.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(beforeSortDataBuffer, 0, beforeSortData.buffer);

	const afterSortBufferSize = 64 * 2 * Float32Array.BYTES_PER_ELEMENT;
	const afterSortBuffer = device.createBuffer({
		size: afterSortBufferSize,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
	});

	const bindGroup = device.createBindGroup({
		layout: computePipeline.getBindGroupLayout(0),
		entries: [
			{
				binding: 0,
				resource: {
					buffer: beforeSortDataBuffer,
					size: beforeSortData.byteLength
				},
			},
			{
				binding: 1,
				resource: {
					buffer: afterSortBuffer,
					size: afterSortBufferSize
				},
			},
		],
	});

	const commandEncoder = device.createCommandEncoder();
	const passEncoder = commandEncoder.beginComputePass();
	passEncoder.setPipeline(computePipeline);
	passEncoder.setBindGroup(0, bindGroup);
	passEncoder.dispatchWorkgroups(1, 1, 1);
	passEncoder.end();


	const readBuf = device.createBuffer({
		size: afterSortBufferSize,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
	});

	commandEncoder.copyBufferToBuffer(afterSortBuffer, 0, readBuf, 0, afterSortBufferSize);


	device.queue.submit([commandEncoder.finish()]);


	await readBuf.mapAsync(GPUMapMode.READ);
	const afterSort = new Float32Array(readBuf.getMappedRange().slice(0));
	readBuf.unmap();

	// buf.destroy();
	// readBuf.destroy();

	console.log(beforeSortData);
	console.log(afterSort);
}

test()