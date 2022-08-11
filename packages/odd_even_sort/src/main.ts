const wgsl = `
const workgroupSize = 64;
// const elementCount = 128;

// var<workgroup> arrOfTwoElements: array<f32,elementCount>;
var<workgroup> arrOfTwoElements: array<f32,128>;
var<workgroup> isSwap: bool;
var<workgroup> stepCount: u32;

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

// set to any value only if > 0
// isSwap = 1;
isSwap = false;

stepCount = 0;

workgroupBarrier();


// while(isSwap != 0){
while(true){
// isSwap = 0;

// workgroupBarrier();

// u32 index = GlobalInvocationID.x * 2;

// f32 a = beforeSortData.data[index];
// f32 b = beforeSortData.data[index + 1];

// bool hasOnlyOneElement = false;

var firstIndex:u32;
var secondIndex:u32;

if(stepCount % 2 == 0){
firstIndex = index;
secondIndex = index + 1;
}
else{
// firstIndex = index;
// secondIndex = index + 1;

// if(LocalInvocationIndex == 0 || LocalInvocationIndex == ){
// hasOnlyOneElement = true;
// }
// else{
// hasOnlyOneElement = false;

// firstIndex = index - 1;
// secondIndex = index;
// }


firstIndex = index - 1;
secondIndex = index;
}

if(firstIndex >= 0){
var a = arrOfTwoElements[firstIndex];
var b = arrOfTwoElements[secondIndex];

if(a > b){
arrOfTwoElements[firstIndex] = b;
arrOfTwoElements[secondIndex] = a;

// isSwap += 1;
// isSwap += 1;
isSwap = true;
}
// else{
// arrOfTwoElements[index] = a;
// arrOfTwoElements[index + 1] = b;
// }


stepCount += 1;
}

workgroupBarrier();

if(!isSwap){
    break;
}

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