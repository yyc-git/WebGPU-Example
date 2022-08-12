const wgsl = `
const workgroupSize = 64;

// TODO why can't use const itemCount?
var<workgroup> sharedData: array<f32,128>;

struct BeforeSortData {
  data : array<f32, 128>
}

struct AfterSortData {
  data : array<f32, 128>
}


@binding(0) @group(0) var<storage, read> beforeSortData : BeforeSortData;
@binding(1) @group(0) var<storage, read_write> afterSortData :  AfterSortData;


fn _swap(firstIndex:u32, secondIndex:u32){
var temp = sharedData[firstIndex];
sharedData[firstIndex] = sharedData[secondIndex];
sharedData[secondIndex] = temp;
}

fn _oddSort(index:u32) {
var firstIndex = index;
var secondIndex = index + 1;

if(sharedData[firstIndex] > sharedData[secondIndex]){
	_swap(firstIndex, secondIndex);
}
}

fn _evenSort(index:u32) {
var firstIndex = index + 1;
var secondIndex = index + 2;

if(secondIndex <128 && sharedData[firstIndex] > sharedData[secondIndex]){
	_swap(firstIndex, secondIndex);
}
}

@compute @workgroup_size(workgroupSize, 1, 1)
fn main(
@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
) {

var index = GlobalInvocationID.x * 2;

sharedData[index] = beforeSortData.data[index];
sharedData[index+ 1 ] = beforeSortData.data[index + 1];

workgroupBarrier();

var firstIndex:u32;
var secondIndex:u32;

for (var i: u32 = 0; i < workgroupSize; i += 1) {
_oddSort(index);
workgroupBarrier();

_evenSort(index);
workgroupBarrier();
}

afterSortData.data[index] = sharedData[index];
afterSortData.data[index + 1] = sharedData[index + 1];

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

	let a1 = performance.now()

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


	let a2 = performance.now()

	console.log(a2 - a1)


	await readBuf.mapAsync(GPUMapMode.READ);
	const afterSort = new Float32Array(readBuf.getMappedRange().slice(0));
	readBuf.unmap();

	// buf.destroy();
	// readBuf.destroy();

	console.log(beforeSortData);
	console.log(afterSort);
}

test()