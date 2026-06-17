import { Vector3 } from '@iwsdk/core';

/**
 * Sample the loaded splat scene and return robust interior bounds.
 *
 * Room scans (.spz/.ply) come in with an arbitrary origin, scale and a sprinkle
 * of "floater" splats far outside the real geometry. We sample splat centers in
 * the splat mesh's scene-transformed space and use 2nd/98th percentiles so the
 * floaters don't blow up the bounding box.
 *
 * @param {object} viewer mkkellogg Viewer (viewer.splatMesh must be built)
 * @returns {null | {
 *   count:number, sampled:number,
 *   center:Vector3, floorY:number, ceilY:number, size:Vector3
 * }}
 */
export function computeSplatBounds(viewer, sampleTarget = 40000) {
    const splatMesh = viewer?.splatMesh;
    const count = splatMesh?.getSplatCount ? splatMesh.getSplatCount(true) : 0;
    if (!count) return null;

    const step = Math.max(1, Math.floor(count / sampleTarget));
    const xs = [], ys = [], zs = [];
    const v = new Vector3();
    for (let i = 0; i < count; i += step) {
        // applySceneTransform = true -> includes the addSplatScene rotation/scale,
        // i.e. coordinates in the splat group's local space.
        splatMesh.getSplatCenter(i, v, true);
        xs.push(v.x); ys.push(v.y); zs.push(v.z);
    }
    if (!xs.length) return null;

    const pct = (arr, p) => {
        const s = arr.slice().sort((a, b) => a - b);
        const idx = Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))));
        return s[idx];
    };
    const axis = (arr) => ({ lo: pct(arr, 0.02), hi: pct(arr, 0.98) });
    const ax = axis(xs), ay = axis(ys), az = axis(zs);

    return {
        count,
        sampled: xs.length,
        center: new Vector3((ax.lo + ax.hi) / 2, (ay.lo + ay.hi) / 2, (az.lo + az.hi) / 2),
        floorY: ay.lo,
        ceilY: ay.hi,
        size: new Vector3(ax.hi - ax.lo, ay.hi - ay.lo, az.hi - az.lo),
    };
}
