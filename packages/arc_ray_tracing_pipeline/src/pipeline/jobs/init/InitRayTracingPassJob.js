import WebGPU from "wonder-webgpu";
import fs from "fs";
import path from "path";
import { getAllRenderGameObjectData } from "../../../scene/Scene.js";
import { getC, getR, getW } from "../../../scene/Geometry.js"
import { getLayer, getLocalPosition } from "../../../scene/Transform.js";
import { createBuffer } from "../../../webgpu/Buffer.js";
import { buildSceneGeometryDataBufferData, buildSceneInstanceDataBufferData, buildSceneMaterialDataBufferData } from "../../../render_data/buildRenderData.js";
import { computeRingAABB } from "../../../math/AABB2D.js";

let _createShaderBindingTable = device => {
    let dirname = path.join(process.cwd(), "src/shader/");
    let rayGenShaderModule = device.createShaderModule({ code: fs.readFileSync(path.join(dirname, "ray-generation.rgen"), "utf-8") });
    let rayCHitShaderModule = device.createShaderModule({ code: fs.readFileSync(path.join(dirname, "ray-closest-hit.rchit"), "utf-8") });
    let rayMissShaderModule = device.createShaderModule({ code: fs.readFileSync(path.join(dirname, "ray-miss.rmiss"), "utf-8") });
    let rayIntShaderModule = device.createShaderModule({ code: fs.readFileSync(path.join(dirname, "ray-intersection.rint"), "utf-8") });

    return device.createRayTracingShaderBindingTable({
        stages: [
            {
                module: rayGenShaderModule,
                stage: WebGPU.GPUShaderStage.RAY_GENERATION
            },
            {
                module: rayCHitShaderModule,
                stage: WebGPU.GPUShaderStage.RAY_CLOSEST_HIT
            },
            {
                module: rayIntShaderModule,
                stage: WebGPU.GPUShaderStage.RAY_INTERSECTION
            },
            {
                module: rayMissShaderModule,
                stage: WebGPU.GPUShaderStage.RAY_MISS
            }
        ],
        groups: [
            // generation group
            {
                type: "general",
                generalIndex: 0, // ray generation shader index
                anyHitIndex: -1,
                closestHitIndex: -1,
                intersectionIndex: -1
            },
            // hit group
            {
                type: "procedural-hit-group",
                generalIndex: -1,
                anyHitIndex: -1,
                closestHitIndex: 1,
                intersectionIndex: 2
            },
            // miss group
            {
                type: "general",
                generalIndex: 3, // ray miss shader index
                anyHitIndex: -1,
                closestHitIndex: -1,
                intersectionIndex: -1
            }
        ]
    });
}

let _build34RowMajorMatrix = (localPosition, layer) => {
    return new Float32Array([
        1,
        0,
        0,
        localPosition[0],
        0,
        1,
        0,
        localPosition[1],
        0,
        0,
        1,
        layer
    ]);
}

let _createAllInstances = (state, geometryContainerMap) => {
    // TODO get groupedSortedLayers
    let groupedSortedLayers = [
        { minLayer: 0.00004, maxLayer: 0.00004 },
        // { minLayer: 0.00003, maxLayer: 0.00004 },
        { minLayer: 0.00003, maxLayer: 0.00003 },
        // { minLayer: 0.00001, maxLayer: 0.00002 },
        { minLayer: 0.00001, maxLayer: 0.00002 },
    ]

    let maxInstanceCount = 10

    let epsion = 0.000001

    let _createInstancesArr = (groupedSortedLayers) => {
        return groupedSortedLayers.map(_ => [])
    }

    let _getInstancesIndex = (layer, maxInstanceCount, epsion, instancesArr, groupedSortedLayers) => {
        return groupedSortedLayers.reduce((result, { minLayer, maxLayer }, index) => {
            if (layer >= minLayer - epsion && layer <= maxLayer + epsion && instancesArr[index].length < maxInstanceCount) {
                result = index
            }

            return result
        }, -1)
    }

    let _handleEmptyInstances = (instancesArr, geometryContainerMap) => {
        return instancesArr.map(instances => {
            if (instances.length === 0) {
                instances.push({
                    usage: WebGPU.GPURayTracingAccelerationInstanceUsage.FORCE_OPAQUE,
                    mask: 0xFF,
                    instanceId: 0,
                    transformMatrix: _build34RowMajorMatrix([100000, 1000000], 100),
                    geometryContainer: geometryContainerMap[0]
                })
            }

            return instances
        })
    }

    let instancesArr = getAllRenderGameObjectData(state).reduce((instancesArr, [gameObject, transform, geometry, material], instanceIndex) => {
        let geometryContainer = geometryContainerMap[geometry]
        // console.log(geometryContainerMap, geometry);

        let localPosition = getLocalPosition(transform, state)
        let layer = getLayer(transform, state)

        let instancesIndex = _getInstancesIndex(layer, maxInstanceCount, epsion, instancesArr, groupedSortedLayers)

        // console.log(instancesIndex, layer, maxInstanceCount);


        if (instancesIndex === -1) {
            throw new Error("instances are too many")
        }


        instancesArr[instancesIndex].push(
            {
                usage: WebGPU.GPURayTracingAccelerationInstanceUsage.FORCE_OPAQUE,
                mask: 0xFF,
                instanceId: instanceIndex,
                // TODO handle instanceOffset?
                // instanceOffset: 0,

                // transform: {
                //     translation: { x: localPosition[0], y: localPosition[1], z: layer },
                //     rotation: { x: 0, y: 0, z: 0 },
                //     scale: { x: 1, y: 1, z: 1 }
                // },
                transformMatrix: _build34RowMajorMatrix(localPosition, layer),
                geometryContainer: geometryContainer
            }
        )

        return instancesArr
    }, _createInstancesArr(groupedSortedLayers));


    return _handleEmptyInstances(instancesArr, geometryContainerMap)


    // TODO ensure check: not exceed maxInstanceCount


    // return [
    //     // instances.slice(0, 3000000),
    //     // instances.slice(3000000, 4000000),
    //     // instances.slice(4000000),
    //     instances.slice(0, 5),
    //     instances.slice(5, 8),
    //     instances.slice(8),
    // ]
}

let _buildContainers = (state, device, queue) => {
    let a1 = performance.now();

    let geometryContainerMap = getAllRenderGameObjectData(state).reduce((geometryContainerMap, [gameObject, transform, geometry, material]) => {
        if (geometryContainerMap[geometry] === undefined) {
            let c = getC(geometry, state)
            let w = getW(geometry, state)
            let r = getR(geometry, state)

            let aabb = computeRingAABB(c, r, w)

            let arr = []


            arr.push(aabb.localMin[0])
            arr.push(aabb.localMin[1])
            arr.push(0)
            // arr.push(Math.random() - 1)
            // arr.push(-0.1)
            arr.push(aabb.localMax[0])
            arr.push(aabb.localMax[1])
            arr.push(0)
            // arr.push(Math.random() )
            // arr.push(0.1)



            let aabbBufferData = new Float32Array(arr)
            // console.log(aabbBufferData);

            let aabbBuffer = createBuffer(device, WebGPU.GPUBufferUsage.COPY_DST | WebGPU.GPUBufferUsage.RAY_TRACING, aabbBufferData)

            let geometryContainer = device.createRayTracingAccelerationContainer({
                level: "bottom",
                usage: WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_TRACE,
                // usage: WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_BUILD,
                geometries: [
                    {
                        usage: WebGPU.GPURayTracingAccelerationGeometryUsage.OPAQUE,
                        type: "aabbs",
                        aabb: {
                            buffer: aabbBuffer,
                            // stride: 4 * Float32Array.BYTES_PER_ELEMENT,
                            stride: 6 * Float32Array.BYTES_PER_ELEMENT,
                            offset: 0,
                            count: 1
                        }
                    }
                ]
            });

            geometryContainerMap[geometry] = geometryContainer
        }

        return geometryContainerMap
    }, {});

    {
        let commandEncoder = device.createCommandEncoder({});

        for (let key in geometryContainerMap) {
            if (!geometryContainerMap.hasOwnProperty(key)) continue;

            commandEncoder.buildRayTracingAccelerationContainer(geometryContainerMap[key]);
        }

        queue.submit([commandEncoder.finish()]);
    }


    let a2 = performance.now();

    let instancesArr = _createAllInstances(state, geometryContainerMap)
    // console.log(instancesArr);
    let a21 = performance.now();

    let instanceContainerArr = instancesArr.map(instances => {
        return device.createRayTracingAccelerationContainer({
            level: "top",
            usage: WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_TRACE,
            // usage: WebGPU.GPURayTracingAccelerationContainerUsage.ALLOW_UPDATE | WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_TRACE,
            // usage: WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_BUILD,
            instances
        })
    })

    {
        let commandEncoder = device.createCommandEncoder({});
        instanceContainerArr.forEach(instanceContainer => {
            commandEncoder.buildRayTracingAccelerationContainer(instanceContainer);
        })
        queue.submit([commandEncoder.finish()]);
    }


    let a3 = performance.now();

    console.log(a2 - a1, a21 - a2, a3 - a21)

    return instanceContainerArr;
}

export let exec = (state) => {
    let { device, queue } = state.webgpu

    let shaderBindingTable = _createShaderBindingTable(device);
    let [instanceContainer1, instanceContainer2, instanceContainer3] = _buildContainers(state, device, queue);

    let bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
                type: "acceleration-container"
            },
            {
                binding: 1,
                visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
                type: "storage-buffer"
            },
            {
                binding: 2,
                visibility: WebGPU.GPUShaderStage.RAY_CLOSEST_HIT | WebGPU.GPUShaderStage.RAY_INTERSECTION,
                type: "storage-buffer"
            },
            {
                binding: 3,
                visibility: WebGPU.GPUShaderStage.RAY_INTERSECTION,
                type: "storage-buffer"
            },
            {
                binding: 4,
                visibility: WebGPU.GPUShaderStage.RAY_CLOSEST_HIT,
                type: "storage-buffer"
            },
            {
                binding: 5,
                visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
                type: "acceleration-container"
            },
            {
                binding: 6,
                visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
                type: "acceleration-container"
            },
        ]
    });

    let { pixelBufferData } = state.pass
    let [pixelBuffer, pixelBufferSize] = pixelBufferData;

    // let { cameraBufferData } = getCamera();
    // let [cameraBuffer, cameraData] = cameraBufferData;

    let [geometryDataBuffer, geometryDataBufferSize] = buildSceneGeometryDataBufferData(state, device);
    let [instanceDataBuffer, instanceDataBufferSize] = buildSceneInstanceDataBufferData(state, device);
    let [materialDataBuffer, materialDataBufferSize] = buildSceneMaterialDataBufferData(state, device);

    let bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                accelerationContainer: instanceContainer1,
                size: 0
            },
            {
                binding: 1,
                buffer: pixelBuffer,
                size: pixelBufferSize
            },
            {
                binding: 2,
                buffer: instanceDataBuffer,
                size: instanceDataBufferSize
            },
            {
                binding: 3,
                buffer: geometryDataBuffer,
                size: geometryDataBufferSize
            },
            {
                binding: 4,
                buffer: materialDataBuffer,
                size: materialDataBufferSize
            },
            {
                binding: 5,
                accelerationContainer: instanceContainer2,
                size: 0
            },
            {
                binding: 6,
                accelerationContainer: instanceContainer3,
                size: 0
            },

        ]
    });

    let pipeline = device.createRayTracingPipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }),
        rayTracingState: {
            shaderBindingTable,
            maxPayloadSize: (3 + 2) * Float32Array.BYTES_PER_ELEMENT
        }
    });

    return {
        ...state,
        rayTracingPass: {
            bindGroup,
            pipeline
        }
    }
}