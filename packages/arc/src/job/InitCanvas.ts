let exec = (state) => {
	let canvas = document.querySelector("#webgpu") as HTMLCanvasElement

	canvas.width = 760;
	canvas.style.width = "760px";
	canvas.height = 200;
	canvas.style.height = "200px";

	return {
		...state,
		canvas
	}
}