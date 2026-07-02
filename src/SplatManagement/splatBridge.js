import { isHeadsetBrowser } from './xrDevice.js';
import {
    prepareSuperSplatVR,
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

    onSuperSplatXREnd(async () => {
        onXREndCallback?.();
        notifyXRStateChange(false);

        if (activeViewer && activeUrl) {
            try {
                await activeViewer.load(activeUrl);
            } catch (err) {
                console.error('[splatBridge] failed to restore 2D viewer after VR:', err);
            }
        }
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

/**
 * Pre-load the PlayCanvas supersplat viewer for headset VR (sequential after 2D load).
 */
export async function prepareSplatVR(splatUrl) {
    if (!isHeadsetBrowser() || !splatUrl) return;
    bindSuperSplatXREnd();
    await prepareSuperSplatVR(splatUrl);
}

/** Enter immersive VR. On headset uses PlayCanvas supersplat-viewer stack. */
export function enterSplatXR() {
    if (!activeViewer) {
        throw new Error('Splat viewer is not ready');
    }
    if (!isHeadsetBrowser()) {
        throw new Error('VR requires a headset browser');
    }

    bindSuperSplatXREnd();

    if (!isSuperSplatVRReady()) {
        throw new Error('VR viewer is still loading — wait a moment and try again');
    }

    activeViewer.setXRActive(true);
    activeViewer.destroyForXR();
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

export { isSuperSplatVRReady, isSuperSplatVRLoading };

/** @deprecated Native WebXR keeps the same viewer — no teardown needed. */
export function destroySplatForXR() {}

/** @deprecated Native WebXR keeps the same viewer — no reload needed. */
export async function restoreSplatAfterXR() {}
