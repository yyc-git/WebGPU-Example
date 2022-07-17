var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createState } from "./data/CreateData";
import { exec as init } from "./pipeline/InitPipeline";
import { exec as render } from "./pipeline/RenderPipeline";
import { createGeometryBuffer, createMaterialBuffer, createScene, createTransformBuffer } from "./scene/CreateScene";
let _buildScene = (state, { transformCount, geometryCount, materialCount }) => {
    return Object.assign(Object.assign({}, state), { ecsData: createScene(transformCount), transformBuffer: createTransformBuffer(transformCount), geometryBuffer: createGeometryBuffer(geometryCount), materialBuffer: createMaterialBuffer(materialCount) });
};
let _main = () => __awaiter(void 0, void 0, void 0, function* () {
    let count = { transformCount: 300, geometryCount: 1, materialCount: 1 };
    let state = createState();
    state = _buildScene(state, count);
    state = yield init(state);
    let stateContainer = {
        state: state
    };
    function frame() {
        let state = render(stateContainer.state);
        stateContainer.state = state;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
});
_main().then(() => {
    console.log("finish ");
});
//# sourceMappingURL=main.js.map