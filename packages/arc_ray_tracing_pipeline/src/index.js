import { log } from "./log/Log.js";
import { createState } from "./data/CreateData.js";
import { exec as init } from "./pipeline/InitPipeline.js";
import { exec as render } from "./pipeline/RenderPipeline.js";
import { createGeometryBuffer2, createMaterialBuffer, createScene, createTransformBuffer } from "./scene/CreateScene.js";
import { computeFPS } from "./utils/fps.js";

let _buildScene = (state, { transformCount, geometryCount, materialCount }) => {
    return Object.assign(Object.assign({}, state), { ecsData: createScene(transformCount), transformBuffer: createTransformBuffer(transformCount), geometryBuffer: createGeometryBuffer2(geometryCount), materialBuffer: createMaterialBuffer(materialCount) });

    // return {
    //     ...state,
    //     ecsData: createScene(transformCount),
    //     transformBuffer: createTransformBuffer(transformCount),
    //     geometryBuffer: createGeometryBuffer(geometryCount),
    //     materialBuffer: createMaterialBuffer(materialCount)
    // }
};

let _main = async () => {
    // setConfig({ width: 640, height: 480 });
    // setConfig({ width: 512, height: 512 });


    // let count = { transformCount: 5000000, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 1, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 50, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 10, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 5000000, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 5000000, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 13000000, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 4000000, geometryCount: 1, materialCount: 1 }
    let count = { transformCount: 20000000, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 16000000, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 10000000, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 11000000, geometryCount: 1, materialCount: 1 }

    let state = createState()

    state = {
        ...state,
        config: {
            width: 512, height: 512
        }
    }

    state = _buildScene(state, count)


    // let [camera, scene] = _buildScene();

    // camera.updateMatrixWorld();
    // scene.updateMatrixWorld();

    // setScene({
    //     camera,
    //     scene
    // });

    // await init();
    state = await init(state)

    let stateContainer = {
        state: state
    }

    // function frame() {
    //     let state = render(stateContainer.state)

    //     stateContainer.state = state

    //     requestAnimationFrame(frame);
    // }

    // requestAnimationFrame(frame);


    setInterval(() => {
        let t1 = performance.now()
        let state = render(stateContainer.state)

        let t2 = performance.now()

        let [newState, fps] = computeFPS(state, t2 - t1)

        if (fps !== null) {
            console.log("fps:", fps);
        }

        stateContainer.state = newState
    }, 16)

    // while (true) {
    //     render();
    // }
}

_main().then(() => {
    log("finish main");
});