export let create = (x, y) => [x, y];
export let min = ([v1x, v1y], [v2x, v2y]) => {
    return [
        Math.min(v1x, v2x),
        Math.min(v1y, v2y),
    ];
};
export let max = ([v1x, v1y], [v2x, v2y]) => {
    return [
        Math.max(v1x, v2x),
        Math.max(v1y, v2y),
    ];
};
//# sourceMappingURL=Vector2.js.map