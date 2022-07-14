import { createState } from "./data/CreateData";
import { exec as init } from "./pipeline/InitPipeline";
import { exec as render } from "./pipeline/RenderPipeline";
import { createGeometryBuffer, createMaterialBuffer, createTransformBuffer } from "./scene/CreateScene";

let _buildScene = (state, count) => {
	return {
		...state,
		transformBuffer: createTransformBuffer(count),
		geometryBuffer: createGeometryBuffer(count),
		materialBuffer: createMaterialBuffer(count)
	}
}

let _main = async () => {
	let count = 1

	let state = createState()

	state = _buildScene(state, count)

	state = await init(state)

	let stateContainer = {
		state: state
	}

	function frame() {
		let state = render(stateContainer.state)

		stateContainer.state = state

		requestAnimationFrame(frame);
	}

	requestAnimationFrame(frame);
};

_main().then(() => {
	console.log("finish ");
});