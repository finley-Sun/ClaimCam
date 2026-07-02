import { isHeadsetBrowser } from './xrDevice.js';

let activeViewer = null;
let activeUrl = null;
let onXREndCallback = null;
let xrStateListeners = [];
let fullscreenListenersBound = false;

function wireViewerXR(viewer) {
    if (!viewer || fullscreenListenersBound) return;

    const onFullscreenChange = () => {
        const active = isSplatXRActive();
        notifyXRStateChange(active);
        if (!active) onXREndCallback?.();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    fullscreenListenersBound = true;
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

    const container = activeViewer.container;
    if (!container) {
        throw new Error('Fullscreen target is unavailable');
    }

    if (container.requestFullscreen) {
        container.requestFullscreen();
        return;
    }

    if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
        return;
    }

    throw new Error('Fullscreen is not supported in this browser');
}

export function exitSplatXR() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
        return;
    }
    if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

export function isSplatXRActive() {
    const container = activeViewer?.container;
    if (!container) return false;
    return document.fullscreenElement === container || document.webkitFullscreenElement === container;
}

export function isWebXRSupported() {
    return typeof navigator !== 'undefined' && !!navigator.xr?.requestSession;
}

/** True when this browser can start immersive-vr (any WebXR-capable headset browser). */
export async function checkImmersiveVRSupported() {
    return !!document.fullscreenEnabled || !!document.webkitFullscreenEnabled;
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
