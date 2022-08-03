export let computeFPS = (state, deltaTime) => {
	let sampleCount = 100
	let alpha = 1 / sampleCount

	let avgDuration = state.fps.avgDuration
	let frameCount = state.fps.frameCount + 1

	if (frameCount === 1) {
		avgDuration = deltaTime
	}
	else if (frameCount === sampleCount) {
		frameCount = 0
	}
	else {
		avgDuration = avgDuration * (1 - alpha) + deltaTime * alpha
	}

	state = {
		...state,
		fps: {
			avgDuration: avgDuration,
			frameCount: frameCount
		}
	}

	return [state, frameCount !== 0 ? null : 1000 / avgDuration]
}
