import { exec as execRenderRayTracingPassJob } from "./jobs/render/RenderRayTracingPassJob.js";
import { exec as execRenderScreenPassJob } from "./jobs/render/RenderScreenPassJob.js";
import { exec as execEndRenderJob } from "./jobs/render/EndRenderJob.js";

export let exec = (state) => {
    state = execRenderRayTracingPassJob(state);
    state = execRenderScreenPassJob(state);
    state = execEndRenderJob(state);

    return state
}
