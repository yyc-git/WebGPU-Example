const num = 1000;
const minX = 0,
	maxX = 2,
	minY = 0,
	maxY = 2;
const invSize = 1 / Math.max(maxX - minX, maxY - minY);
const wgsl = `
    struct Obj {
        minX: f32,
        maxX: f32,
        minY: f32,
        maxY: f32,
        zOrder: u32,
    }

    @binding(0) @group(0) var<storage, read_write> objs: array<Obj>;

    fn setZOrder(i: u32){
        let obj = objs[i];
        var x = u32(32767 * ((obj.minX + obj.maxX) / 2 - ${minX}) * ${invSize});
        var y = u32(32767 * ((obj.minY + obj.maxY) / 2 - ${minX}) * ${invSize});

        x = (x | (x << 8)) & 0x00ff00ff;
        x = (x | (x << 4)) & 0x0f0f0f0f;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;
        
        y = (y | (y << 8)) & 0x00ff00ff;
        y = (y | (y << 4)) & 0x0f0f0f0f;
        y = (y | (y << 2)) & 0x33333333;
        y = (y | (y << 1)) & 0x55555555;

        objs[i].zOrder = x | (y << 1);
    }

    fn bSort(start: i32, end: i32){
        for(var i = start; i < end; i++){
            var last = objs[end - 1];
            for(var j = end - 2; j >= i; j--){
                let cur = objs[j];
                if(cur.zOrder - last.zOrder > 0){
                    objs[j + 1] = cur;
                    objs[j] = last;
                }else{
                    last = cur;
                }
            }
        }
    }

	@compute @workgroup_size(64, 1, 1)
	fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
        if(coord.x != 0){
            return;
        }

        for(var i:u32 = 0; i < ${num}; i++){
            setZOrder(i);
        }
        bSort(0, ${num});

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

	const objsF32 = new Float32Array(num * 5);
	for (let i = 0; i < num; i++) {
		objsF32[i * 5] = Math.random();
		objsF32[i * 5 + 1] = Math.random() + objsF32[i * 5];
		objsF32[i * 5 + 2] = Math.random();
		objsF32[i * 5 + 3] = Math.random() + objsF32[i * 5 + 2];
	}

	const buf = device.createBuffer({
		size: objsF32.byteLength,
		usage:
			GPUBufferUsage.STORAGE |
			GPUBufferUsage.COPY_DST |
			GPUBufferUsage.COPY_SRC,
	});
	device.queue.writeBuffer(buf, 0, objsF32.buffer);

	const bindGroup = device.createBindGroup({
		layout: computePipeline.getBindGroupLayout(0),
		entries: [
			{
				binding: 0,
				resource: {
					buffer: buf,
				},
			},
		],
	});

	const readBuf = device.createBuffer({
		size: buf.size,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
	});

	const commandEncoder = device.createCommandEncoder();
	const passEncoder = commandEncoder.beginComputePass();
	passEncoder.setPipeline(computePipeline);
	passEncoder.setBindGroup(0, bindGroup);
	passEncoder.dispatchWorkgroups(1);
	passEncoder.end();
	commandEncoder.copyBufferToBuffer(buf, 0, readBuf, 0, buf.size);
	device.queue.submit([commandEncoder.finish()]);

	await readBuf.mapAsync(GPUMapMode.READ);
	const result = new Uint32Array(readBuf.getMappedRange().slice(0));
	readBuf.unmap();

	buf.destroy();
	readBuf.destroy();

	for (let i = 0; i < num - 1; i++) {
		if (result[i * 5 + 4] > result[(i + 1) * 5 + 4]) {
			console.log('=======invalid=======');
			break;
		}
	}
	console.log('+++++++++++++');
}
