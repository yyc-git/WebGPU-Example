import WebGPU from "wonder-webgpu";
import fs from "fs";
import path from "path";
import { getAllRenderGameObjectData } from "../../../scene/Scene.js";
import { getC, getR, getW } from "../../../scene/Geometry.js"
import { getLayer, getLocalPosition } from "../../../scene/Transform.js";
import { createBuffer } from "../../../webgpu/Buffer.js";
import { addToSceneInstanceDataBufferDataArr, buildSceneGeometryDataBufferData, buildSceneMaterialDataBufferData } from "../../../render_data/buildRenderData.js";
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
    { minLayer: 0.00004, maxLayer: 0.00004 },
    { minLayer: 0.00004, maxLayer: 0.00004 },
    { minLayer: 0.00003, maxLayer: 0.00003 },
    { minLayer: 0.00003, maxLayer: 0.00003 },
    { minLayer: 0.00002, maxLayer: 0.00002 },
    { minLayer: 0.00002, maxLayer: 0.00002 },
    { minLayer: 0.00001, maxLayer: 0.00001 },
    { minLayer: 0.00001, maxLayer: 0.00001 },
]

// let maxInstanceCount = 3500000
let maxInstanceCount = 3000000
// let maxInstanceCount = 2500000
// let maxInstanceCount = 3
// let maxInstanceCount = 1
// let maxInstanceCount = 10

let epsion = 0.000001

let _createAllInstances = (state, geometryContainerMap, device) => {
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

    let _createInstancesGroupTypeArr = (groupedSortedLayers, maxInstanceCount) => {
        return new Float32Array(groupedSortedLayers.length * 5 * maxInstanceCount)
    }

    let _createInstancesGroupCountArr = (groupedSortedLayers) => {
        return groupedSortedLayers.map(_ => 0)
    }


    let _getInstancesIndex = (layer, maxInstanceCount, epsion, instancesGroupCountArr, groupedSortedLayers) => {
        return groupedSortedLayers.reduce((result, { minLayer, maxLayer }, index) => {
            if (result !== -1) {
                return result
            }

            if (layer >= minLayer - epsion && layer <= maxLayer + epsion && instancesGroupCountArr[index] < maxInstanceCount) {
                result = index
            }

            return result
        }, -1)
    }

    let _group = () => {
        return getAllRenderGameObjectData(state).reduce(([instancesGroupTypeArr, instancesGroupCountArr], [gameObject, transform, geometry, material]) => {
            let localPosition = getLocalPosition(transform, state)
            let layer = getLayer(transform, state)


            let instancesIndex = _getInstancesIndex(layer, maxInstanceCount, epsion, instancesGroupCountArr, groupedSortedLayers)


            if (instancesIndex === -1) {
                console.log(instancesIndex, layer, transform);
                throw new Error("instances are too many")
            }


            let offset = instancesGroupCountArr[instancesIndex] * 5 + instancesIndex * maxInstanceCount * 5

            instancesGroupTypeArr[offset] = localPosition[0]
            instancesGroupTypeArr[offset + 1] = localPosition[1]
            instancesGroupTypeArr[offset + 2] = layer
            instancesGroupTypeArr[offset + 3] = geometry
            instancesGroupTypeArr[offset + 4] = material

            instancesGroupCountArr[instancesIndex] += 1

            return [instancesGroupTypeArr, instancesGroupCountArr]
        }, [_createInstancesGroupTypeArr(groupedSortedLayers, maxInstanceCount), _createInstancesGroupCountArr(groupedSortedLayers)])

        // return instancesGroupTypeArr
    }

    let _buildInstanceContainerArrAndSceneInstanceDataBufferDataArr = ([instancesGroupTypeArr, instancesGroupCountArr]) => {
        let instancesIndex = 0

        let instanceContainerArr = []
        let instances = []
        let instancesActualLength = -1
        let lastIndex = null

        let sceneInstanceDataBufferDataArr = []
        let sceneInstanceDataBufferData

        // for (let instancesIndex in map) {
        //     if (!map.hasOwnProperty(instancesIndex)) {
        //         throw new Error("error")
        //     }
        for (let i = 0; i < instancesGroupTypeArr.length; i += 5 * maxInstanceCount) {
            sceneInstanceDataBufferData = []

            // let renderGameObjectDataGroup = map[instancesIndex]
            // let instancesCount = renderGameObjectDataGroup.length
            let instancesCount = instancesGroupCountArr[instancesIndex]

            // index = 0

            //handle empty
            if (instancesCount === 0) {
                // instances[0] = {
                //     usage: WebGPU.GPURayTracingAccelerationInstanceUsage.FORCE_OPAQUE,
                //     mask: 0xFF,
                //     instanceId: 0,
                //     transformMatrix: _build34RowMajorMatrix([100000, 1000000], 100),
                //     // TODO get geometryContainer for empty
                //     geometryContainer: geometryContainerMap[0]
                // }

                // instancesActualLength = 1

                // sceneInstanceDataBufferData = addToSceneInstanceDataBufferDataArr(sceneInstanceDataBufferData, 0, 0, 0)

                // break

                instancesActualLength = 0
            }
            else {
                let instanceIndex = 0
                for (let j = 0; j < 5 * instancesCount; j += 5) {
                    instances[instanceIndex] = {
                        usage: WebGPU.GPURayTracingAccelerationInstanceUsage.FORCE_OPAQUE,
                        mask: 0xFF,
                        instanceId: instanceIndex,
                        // TODO handle instanceOffset?
                        // instanceOffset: 0,

                        transformMatrix: _build34RowMajorMatrix([
                            instancesGroupTypeArr[i + j],
                            instancesGroupTypeArr[i + j + 1]
                        ], instancesGroupTypeArr[i + j + 2]),
                        geometryContainer: geometryContainerMap[instancesGroupTypeArr[i + j + 3]]
                    }


                    sceneInstanceDataBufferData = addToSceneInstanceDataBufferDataArr(sceneInstanceDataBufferData, instanceIndex, instancesGroupTypeArr[i + j + 3], instancesGroupTypeArr[i + j + 4])

                    instanceIndex += 1
                }

                instancesActualLength = instancesCount
            }


            console.log("bbbbbb0: ", instancesActualLength);

            let instancesResult = null

            if (instancesActualLength === 0) {
                instancesResult = null
            }
            else {
                if (lastIndex === null || lastIndex === instancesActualLength || lastIndex === 0) {
                    instancesResult = instances
                }
                else if (lastIndex > instancesActualLength) {
                    instancesResult = instances.slice(0, instancesActualLength)
                }
                // else {
                //     console.log(lastIndex, instancesActualLength)

                //     throw new Error("error")
                // }
            }
            // console.log(instancesResult);

            if (instancesResult !== null) {
                instanceContainerArr.push(
                    device.createRayTracingAccelerationContainer({
                        level: "top",
                        // usage: WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_TRACE,
                        // usage: WebGPU.GPURayTracingAccelerationContainerUsage.ALLOW_UPDATE | WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_TRACE,
                        usage: WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_BUILD,
                        instances: instancesResult
                    })
                )

                sceneInstanceDataBufferDataArr.push(sceneInstanceDataBufferData)
            }

            console.log("bbbbbb1");

            instancesIndex += 1

            lastIndex = instancesActualLength
        }

        return [instanceContainerArr, sceneInstanceDataBufferDataArr]
    }


    // console.log("a");
    let [instancesGroupTypeArr, instancesGroupCountArr] = _group()
    // console.log([instancesGroupTypeArr, instancesGroupCountArr]);
    console.log("after group");

    return _buildInstanceContainerArrAndSceneInstanceDataBufferDataArr([instancesGroupTypeArr, instancesGroupCountArr])
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
                // usage: WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_TRACE,
                usage: WebGPU.GPURayTracingAccelerationContainerUsage.PREFER_FAST_BUILD,
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

    let [instanceContainerArr, sceneInstanceDataBufferDataArr] = _createAllInstances(state, geometryContainerMap, device)
    console.log("bbb");
    // console.log([instanceContainerArr, sceneInstanceDataBufferDataArr]);
    let a21 = performance.now();



    {
        let commandEncoder = device.createCommandEncoder({});
        instanceContainerArr.forEach(instanceContainer => {
            commandEncoder.buildRayTracingAccelerationContainer(instanceContainer);
        })
        queue.submit([commandEncoder.finish()]);
    }


    let a3 = performance.now();

    console.log(a2 - a1, a21 - a2, a3 - a21)

    return [instanceContainerArr, sceneInstanceDataBufferDataArr];
}

export let exec = (state) => {
    let { device, queue } = state.webgpu

    let shaderBindingTable = _createShaderBindingTable(device);
    let [instanceContainerArr, sceneInstanceDataBufferDataArr] = _buildContainers(state, device, queue);

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
                type: "storage-buffer"
            },
        ]
    });

    let { pixelBufferData, pixelIsMissBufferData } = state.pass
    let [pixelBuffer, pixelBufferSize] = pixelBufferData;
    let [pixelIsMissBuffer, pixelIsMissBufferSize] = pixelIsMissBufferData;

    // let { cameraBufferData } = getCamera();
    // let [cameraBuffer, cameraData] = cameraBufferData;

    let [geometryDataBuffer, geometryDataBufferSize] = buildSceneGeometryDataBufferData(state, device);
    let [materialDataBuffer, materialDataBufferSize] = buildSceneMaterialDataBufferData(state, device);



    let bindGroups = instanceContainerArr.reduce((bindGroups, instanceContainer, index) => {
        let sceneInstanceDataBufferData = sceneInstanceDataBufferDataArr[index]
        let bufferData = new Float32Array(sceneInstanceDataBufferData);
        let instanceDataBuffer = createBuffer(device, WebGPU.GPUBufferUsage.STORAGE | WebGPU.GPUBufferUsage.COPY_DST, bufferData);
        let instanceDataBufferSize = bufferData.byteLength


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
                    {
                        binding: 5,
                        buffer: pixelIsMissBuffer,
                        size: pixelIsMissBufferSize
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