export let exec = (state) => {
    let { swapChain, window } = state.webgpu

    swapChain.present();
    window.pollEvents();

    return state
}