export let exec = (state) => {
	let canvas = document.querySelector("#webgpu") as HTMLCanvasElement

	// canvas.width = 760;
	// canvas.style.width = "760px";
	canvas.width = 500;
	canvas.style.width = "500px";
	canvas.height = 500;
	canvas.style.height = "500px";

	return {
		...state,
		canvas
	}
}