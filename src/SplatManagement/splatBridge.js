import { isHeadsetBrowser } from './xrDevice.js';
import {
    launchHeadsetVR,
    enterSuperSplatVR,
    exitSuperSplatVR,
    hasActiveSuperSplatVR,
    isSuperSplatVRReady,
    isSuperSplatVRLoading,
    onSuperSplatXREnd,
} from './superSplatVR.js';

let activeViewer = null;
let activeUrl = null;
let onXREndCallback = null;
let xrStateListeners = [];
let superSplatEndBound = false;

function wireViewerXR(viewer) {
    if (!viewer) return;
    viewer.setOnXRSessionStart(() => notifyXRStateChange(true));
    viewer.setOnXRSessionEnd(() => {
        onXREndCallback?.();
        notifyXRStateChange(false);
    });
}

function bindSuperSplatXREnd() {
    if (superSplatEndBound) return;
    superSplatEndBound = true;

    onSuperSplatXREnd(() => {
        onXREndCallback?.();
        notifyXRStateChange(false);
    });
}

export function setActiveSplatViewer(viewer, url) {
    activeViewer = viewer;
    activeUrl = url;
    wireViewerXR(viewer);
}

export function setActiveSplatUrl(url) {
    activeUrl = url;
}

export function clearActiveSplatViewer(viewer) {
    if (activeViewer === viewer) {
        activeViewer = null;
        activeUrl = null;
    }
}

export function clearActiveSplatUrl() {
    activeUrl = null;
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

/** Fullscreen headset load — single PlayCanvas engine. */
export async function loadHeadsetVR(splatUrl) {
    if (!isHeadsetBrowser() || !splatUrl) return;
    bindSuperSplatXREnd();
    setActiveSplatUrl(splatUrl);
    await launchHeadsetVR(splatUrl);
}

export function enterSplatXR() {
    if (!activeUrl) {
        throw new Error('Splat viewer is not ready');
    }
    if (!isHeadsetBrowser()) {
        throw new Error('VR requires a headset browser');
    }

    bindSuperSplatXREnd();

    if (!isSuperSplatVRReady()) {
        throw new Error('VR viewer is still loading');
    }

    enterSuperSplatVR();
    notifyXRStateChange(true);
}

export function exitSplatXR() {
    if (hasActiveSuperSplatVR()) {
        exitSuperSplatVR();
        return;
    }
    activeViewer?.exitImmersiveVR();
}

export function isSplatXRActive() {
    return hasActiveSuperSplatVR() || (activeViewer?.isInImmersiveVR() ?? false);
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

export { isSuperSplatVRReady, isSuperSplatVRLoading };

export function destroySplatForXR() {}
export async function restoreSplatAfterXR() {}
