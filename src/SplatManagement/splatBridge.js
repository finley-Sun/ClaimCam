import { isHeadsetBrowser } from './xrDevice.js';

let activeViewer = null;
let activeUrl = null;
let onXREndCallback = null;
let xrStateListeners = [];

function wireViewerXR(viewer) {
    if (!viewer) return;
    viewer.setOnXRSessionStart(() => notifyXRStateChange(true));
    viewer.setOnXRSessionEnd(() => {
        onXREndCallback?.();
        notifyXRStateChange(false);
    });
}

export function setActiveSplatViewer(viewer, url) {
    activeViewer = viewer;
    activeUrl = url;
    wireViewerXR(viewer);
}

export function clearActiveSplatViewer(viewer) {
    if (activeViewer === viewer) {
        activeViewer = null;
        activeUrl = null;
    }
}

export function onSplatXREnd(callback) {
    onXREndCallback = callback;
}

export function onXRStateChange(callback) {
    xrStateListeners.push(callback);
    return () => {
        xrStateListeners = xrStateListeners.filter((cb) => cb !== callback);
    };
}

function notifyXRStateChange(active) {
    for (const cb of xrStateListeners) {
        cb(active);
    }
}

/** Enter immersive 360 on the already-loaded splat (must run from a user click). */
export function enterSplatXR() {
    if (!activeViewer) {
        throw new Error('Splat viewer is not ready');
    }
    if (!isHeadsetBrowser()) {
        throw new Error('360 view requires a headset browser');
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
    return typeof navigator !== 'undefined' && !!navigator.xr?.requestSession;
}

export async function checkImmersiveVRSupported() {
    if (!navigator.xr?.isSessionSupported) return false;
    try {
        return await navigator.xr.isSessionSupported('immersive-vr');
    } catch {
        return false;
    }
}

export async function checkHeadsetVRAvailable() {
    if (!isHeadsetBrowser()) return false;
    return checkImmersiveVRSupported();
}

export function destroySplatForXR() {}
export async function restoreSplatAfterXR() {}
