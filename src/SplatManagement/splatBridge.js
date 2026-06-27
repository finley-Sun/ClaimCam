/** Shared handle to the active 2D Gaussian splat viewer (React dashboard). */

let activeViewer = null;
let activeUrl = null;
let onXREndCallback = null;

export function setActiveSplatViewer(viewer, url) {
    activeViewer = viewer;
    activeUrl = url;
    if (viewer && onXREndCallback) {
        viewer.setOnXRSessionEnd(onXREndCallback);
    }
}

export function clearActiveSplatViewer(viewer) {
    if (activeViewer === viewer) {
        activeViewer = null;
        activeUrl = null;
    }
}

export function onSplatXREnd(callback) {
    onXREndCallback = callback;
    activeViewer?.setOnXRSessionEnd(callback);
}

/** Enter immersive VR on the already-loaded splat (must run from a user click). */
export function enterSplatXR() {
    if (!activeViewer) {
        throw new Error('Splat viewer is not ready');
    }
    activeViewer.enterImmersiveVR();
}

export function exitSplatXR() {
    activeViewer?.exitImmersiveVR();
}

export function isSplatXRActive() {
    return activeViewer?.isInImmersiveVR() ?? false;
}

export function isWebXRSupported() {
    return typeof navigator !== 'undefined' && 'xr' in navigator;
}

/** @deprecated Native WebXR keeps the same viewer — no teardown needed. */
export function destroySplatForXR() {}

/** @deprecated Native WebXR keeps the same viewer — no reload needed. */
export async function restoreSplatAfterXR() {}
