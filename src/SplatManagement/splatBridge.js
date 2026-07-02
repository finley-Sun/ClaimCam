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

/** Register a listener that fires whenever XR state changes. */
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

/** Enter immersive VR on the already-loaded splat (must run from a user click). */
export function enterSplatXR() {
    if (!activeViewer) {
        throw new Error('Splat viewer is not ready');
    }
    if (!isHeadsetBrowser()) {
        throw new Error('VR requires a headset browser');
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

/** True when this browser can start immersive-vr (any WebXR-capable headset browser). */
export async function checkImmersiveVRSupported() {
    if (!navigator.xr?.isSessionSupported) return false;
    try {
        return await navigator.xr.isSessionSupported('immersive-vr');
    } catch {
        return false;
    }
}

/** VR entry is limited to real headset browsers — desktop/emulator sessions are blocked. */
export async function checkHeadsetVRAvailable() {
    if (!isHeadsetBrowser()) return false;
    return checkImmersiveVRSupported();
}

/** @deprecated Native WebXR keeps the same viewer — no teardown needed. */
export function destroySplatForXR() {}

/** @deprecated Native WebXR keeps the same viewer — no reload needed. */
export async function restoreSplatAfterXR() {}
