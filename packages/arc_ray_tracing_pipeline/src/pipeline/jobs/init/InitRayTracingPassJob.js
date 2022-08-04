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


// TODO refactor
let groupedSortedLayers = [
    { minLayer: 0.00001, maxLayer: 0.00004 },
    { minLayer: 0.00001, maxLayer: 0.00004 },
    { minLayer: 0.00001, maxLayer: 0.00004 },
    { minLayer: 0.00001, maxLayer: 0.00004 },
    { minLayer: 0.00001, maxLayer: 0.00004 },
]

// let maxInstanceCount = 3500000
// let maxInstanceCount = 3000000
let maxInstanceCount = 3
// let maxInstanceCount = 1
// let maxInstanceCount = 10

let epsion = 0.000001

let _createAllInstances = (state, geometryContainerMap) => {
    // TODO get groupedSortedLayers
    // let groupedSortedLayers = [
    //     { minLayer: 0.00004, maxLayer: 0.00004 },
    //     // { minLayer: 0.00004, maxLayer: 0.00004 },
    //     // { minLayer: 0.00003, maxLayer: 0.00004 },
    //     { minLayer: 0.00003, maxLayer: 0.00003 },
    //     // { minLayer: 0.00003, maxLayer: 0.00003 },
    //     // { minLayer: 0.00002, maxLayer: 0.00003 },
    //     // { minLayer: 0.00002, maxLayer: 0.00002 },
    //     // { minLayer: 0.00001, maxLayer: 0.00002 },
    //     { minLayer: 0.00002, maxLayer: 0.00002 },
    //     // { minLayer: 0.00001, maxLayer: 0.00001 },
    //     // { minLayer: 0.00001, maxLayer: 0.00001 },
    //     { minLayer: 0.00001, maxLayer: 0.00002 },
    //     { minLayer: 0.00001, maxLayer: 0.00001 },
    // ]

    let _createInstancesArr = (groupedSortedLayersLength, stride, maxInstanceCount) => {
        // return groupedSortedLayers.map(_ => [])
        return new Float32Array(groupedSortedLayersLength * stride * maxInstanceCount)
    }

    let _getInstancesIndex = (layer, maxInstanceCount, epsion, instancesCountArr, groupedSortedLayers) => {
        return groupedSortedLayers.reduce((result, { minLayer, maxLayer }, index) => {
            if (result !== -1) {
                return result
            }

            if (layer >= minLayer - epsion && layer <= maxLayer + epsion && instancesCountArr[index] < maxInstanceCount) {
                result = index
            }

            return result
        }, -1)
    }

    // let _handleEmptyInstances = (instancesArr, geometryContainerMap) => {
    //     return instancesArr.map(instances => {
    //         if (instances.length === 0) {
    //             instances.push({
    //                 usage: WebGPU.GPURayTracingAccelerationInstanceUsage.FORCE_OPAQUE,
    //                 mask: 0xFF,
    //                 instanceId: 0,
    //                 transformMatrix: _build34RowMajorMatrix([100000, 1000000], 100),
    //                 geometryContainer: geometryContainerMap[0]
    //             })
    //         }

    //         return instances
    //     })
    // }




    // let [f1, f2] = getAllRenderGameObjectData(state).reduce(([f1, f2], [gameObject, transform, geometry, material], instanceIndex) => {
    //     let localPosition = getLocalPosition(transform, state)
    //     let layer = getLayer(transform, state)

    //     let f, startIndex

    //     if (instanceIndex < maxInstanceCount) {
    //         // _build34RowMajorMatrix(localPosition, layer)
    //         f = f1
    //         startIndex = instanceIndex * 12
    //         // endIndex = instanceIndex * 12 + 12
    //     }
    //     else {
    //         f = f2
    //         startIndex = instanceIndex * 12 - maxInstanceCount
    //         // endIndex = instanceIndex * 12 + 12 - maxInstanceCount
    //     }

    //     f[startIndex] = 1
    //     f[startIndex + 1] = 0
    //     f[startIndex + 2] = 0
    //     f[startIndex + 3] = localPosition[0]

    //     f[startIndex + 4] = 0
    //     f[startIndex + 5] = 1
    //     f[startIndex + 6] = 0
    //     f[startIndex + 7] = localPosition[1]

    //     f[startIndex + 8] = 0
    //     f[startIndex + 9] = 0
    //     f[startIndex + 10] = 1
    //     f[startIndex + 11] = layer

    //     return [f1, f2]
    // }, [new Float32Array(maxInstanceCount * 12), new Float32Array(maxInstanceCount * 12)])

    // console.log([f1.length, f2.length, f3.length, f4.length]);


    // TODO move out
    let _createInstancesCountArr = (groupedSortedLayers) => {
        return groupedSortedLayers.map(_ => 0)
    }



    let [instancesArr, instancesCountArr] = getAllRenderGameObjectData(state).reduce(([instancesArr, instancesCountArr], [gameObject, transform, geometry, material], instanceIndex) => {
        if (instanceIndex == 10000) {
            console.log("10000");
        }
        else if (instanceIndex == 1000000) {
            console.log("1000000");
        }
        else if (instanceIndex == 5000000) {
            console.log("5000000");
        }
        else if (instanceIndex == 8000000) {
            console.log("8000000");
        }
        else if (instanceIndex == 9000000) {
            console.log("9000000");
        }
        else if (instanceIndex == 9500000) {
            console.log("9500000");
        }
        else if (instanceIndex == 10000000) {
            console.log("10000000");
        }
        else if (instanceIndex == 12000000) {
            console.log("12000000");
        }

        // let instancesArr = getAllRenderGameObjectData(state).slice(0, 20).reduce((instancesArr, [gameObject, transform, geometry, material], instanceIndex) => {
        // let geometryContainer = geometryContainerMap[geometry]
        // console.log(geometryContainerMap, geometry);

        let localPosition = getLocalPosition(transform, state)
        let layer = getLayer(transform, state)

        let instancesIndex = _getInstancesIndex(layer, maxInstanceCount, epsion, instancesCountArr, groupedSortedLayers)



        if (instancesIndex === -1) {
            console.log(instancesIndex, layer,
                instancesArr.map(instances => instances.length)
            );
            throw new Error("instances are too many")
        }


        instancesCountArr[instancesIndex] += 1

        let instancesCount = instancesCountArr[instancesIndex]

        // console.log(instancesIndex, layer, instancesCount, instancesCountArr);
        let offset = (instancesCount - 1) * 14 + instancesIndex * maxInstanceCount * 14

        instancesArr[offset] = instanceIndex

        instancesArr[offset + 1] = 1
        instancesArr[offset + 2] = 0
        instancesArr[offset + 3] = 0
        instancesArr[offset + 4] = localPosition[0]

        instancesArr[offset + 5] = 0
        instancesArr[offset + 6] = 1
        instancesArr[offset + 7] = 0
        instancesArr[offset + 8] = localPosition[1]

        instancesArr[offset + 9] = 0
        instancesArr[offset + 10] = 0
        instancesArr[offset + 11] = 1
        instancesArr[offset + 12] = layer

        instancesArr[offset + 13] = geometry

        return [instancesArr, instancesCountArr]
    }, [_createInstancesArr(groupedSortedLayers.length, 14, maxInstanceCount), _createInstancesCountArr(groupedSortedLayers)])


    // console.log("aaa", JSON.stringify(instancesArr), instancesCountArr);
    console.log("aaa");

    // return _handleEmptyInstances(instancesArr, geometryContainerMap)
    return [instancesArr, instancesCountArr]
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

    // TODO rename instancesArr
    let [instancesArr, instancesCountArr] = _createAllInstances(state, geometryContainerMap)
    console.log("bbb");
    // console.log(instancesArr);
    let a21 = performance.now();

    let instanceContainerArr = []
    let instanceIndex = 0

    for (let i = 0; i < instancesArr.length; i += 14 * maxInstanceCount) {
        let instances = []

        let instancesCount = instancesCountArr[instanceIndex]

        //handle empty
        if (instancesCount === 0) {
            instances.push({
                usage: WebGPU.GPURayTracingAccelerationInstanceUsage.FORCE_OPAQUE,
                mask: 0xFF,
                instanceId: 0,
                transformMatrix: _build34RowMajorMatrix([100000, 1000000], 100),
                // TODO get geometryContainer for empty
                geometryContainer: geometryContainerMap[0]
            })
        }
        else {
            for (let j = 0; j < 14 * instancesCount; j += 14) {
                instances.push({
                    usage: WebGPU.GPURayTracingAccelerationInstanceUsage.FORCE_OPAQUE,
                    mask: 0xFF,
                    instanceId: instancesArr[i + j],
                    // TODO handle instanceOffset?
                    // instanceOffset: 0,

                    transformMatrix: instancesArr.slice(i + j + 1, i + j + 13),
                    geometryContainer: geometryContainerMap[instancesArr[i + j + 13]]
                })
            }
        }


        // console.log(instances.length);

        instanceContainerArr.push(
            device.createRayTracingAccelerationContainer({
                level: "top",
                usage: WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_TRACE,
                // usage: WebGPU.GPURayTracingAccelerationContainerUsage.ALLOW_UPDATE | WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_TRACE,
                // usage: WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_BUILD,
                instances: instances
            })
        )

        instanceIndex += 1
    }


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
    let instanceContainers = _buildContainers(state, device, queue);

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
            // {
            //     binding: 5,
            //     visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
            //     type: "acceleration-container"
            // },
            // {
            //     binding: 6,
            //     visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
            //     type: "acceleration-container"
            // },
            // {
            //     binding: 7,
            //     visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
            //     type: "acceleration-container"
            // },
            // {
            //     binding: 8,
            //     visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
            //     type: "acceleration-container"
            // },
            // {
            //     binding: 9,
            //     visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
            //     type: "acceleration-container"
            // },
            // {
            //     binding: 10,
            //     visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
            //     type: "acceleration-container"
            // },
            // {
            //     binding: 11,
            //     visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
            //     type: "acceleration-container"
            // },
            // {
            //     binding: 12,
            //     visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
            //     type: "acceleration-container"
            // },
            // {
            //     binding: 13,
            //     visibility: WebGPU.GPUShaderStage.RAY_GENERATION,
            //     type: "acceleration-container"
            // },
        ]
    });

    let { pixelBufferData } = state.pass
    let [pixelBuffer, pixelBufferSize] = pixelBufferData;

    // let { cameraBufferData } = getCamera();
    // let [cameraBuffer, cameraData] = cameraBufferData;

    let [geometryDataBuffer, geometryDataBufferSize] = buildSceneGeometryDataBufferData(state, device);
    let [instanceDataBuffer, instanceDataBufferSize] = buildSceneInstanceDataBufferData(state, device);
    let [materialDataBuffer, materialDataBufferSize] = buildSceneMaterialDataBufferData(state, device);


    let bindGroups = instanceContainers.reduce((bindGroups, instanceContainer) => {
        bindGroups.push(
            device.createBindGroup({
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        accelerationContainer: instanceContainer,
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
                ]
            })
        )

        return bindGroups
    }, [])

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
            bindGroups,
            pipeline
        }
    }
}