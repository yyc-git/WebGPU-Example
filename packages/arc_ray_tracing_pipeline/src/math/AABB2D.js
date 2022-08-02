import * as Vector2 from "./Vector2.js";
export let create = (localMin, localMax) => { return { localMin, localMax }; };
// export let computeRingAABB = ([localPositionX, localPositionY], [cx, cy], r, w) => {
//     let px = cx + localPositionX;
//     let py = cy + localPositionY;
//     return create(Vector2.create(px - r - w, py - r - w), Vector2.create(px + r + w, py + r + w));
// };

export let computeRingAABB = ([cx, cy], r, w) => {
    let px = cx
    let py = cy

    return create(Vector2.create(px - r - w, py - r - w), Vector2.create(px + r + w, py + r + w));
};