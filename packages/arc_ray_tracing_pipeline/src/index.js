import { log } from "./log/Log.js";
import { createState } from "./data/CreateData.js";
import { exec as init } from "./pipeline/InitPipeline.js";
import { exec as render } from "./pipeline/RenderPipeline.js";
import { createGeometryBuffer, createMaterialBuffer, createScene, createTransformBuffer } from "./scene/CreateScene.js";

let _buildScene = (state, { transformCount, geometryCount, materialCount }) => {
    return Object.assign(Object.assign({}, state), { ecsData: createScene(transformCount), transformBuffer: createTransformBuffer(transformCount), geometryBuffer: createGeometryBuffer(geometryCount), materialBuffer: createMaterialBuffer(materialCount) });

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


    // let count = { transformCount: 1000000, geometryCount: 1, materialCount: 1 }
    let count = { transformCount: 1, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 500000, geometryCount: 1, materialCount: 1 }
    // let count = { transformCount: 3000000, geometryCount: 1, materialCount: 1 }

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

    setInterval(() =>{
        let state = render(stateContainer.state)

        stateContainer.state = state
    }, 16)

    // while (true) {
    //     render();
    // }
}

_main().then(() => {
    log("finish main");
});