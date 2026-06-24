/**
 * SuperSplat PlayCanvas VR — uses the same viewer stack as supersplat-viewer
 * (native gsplat + app.xr.start) inside a pre-loaded iframe so Enter XR can
 * fire startVR synchronously from the user's click (required on Quest).
 */

import { prefersSequentialVRLoad } from './xrDevice.js';

let iframe = null;
let ready = false;
let loading = false;
let currentUrl = null;
let preparePromise = null;
let xrActive = false;
let onXREndCallback = null;

function viewerBaseUrl() {
    const base = import.meta.env.BASE_URL || './';
    return new URL('vr-viewer/index.html', new URL(base, window.location.href)).href;
}

function ensureIframe() {
    if (iframe) return iframe;

    iframe = document.createElement('iframe');
    iframe.id = 'supersplat-vr-iframe';
    iframe.title = 'VR reconstruction viewer';
    iframe.setAttribute('allow', 'xr-spatial-tracking; fullscreen');
    iframe.style.cssText = [
        'position:fixed',
        'inset:0',
        'width:100%',
        'height:100%',
        'border:0',
        'z-index:10000',
        'display:none',
        'background:#dce8d4',
    ].join(';');

    document.body.appendChild(iframe);
    return iframe;
}

function buildViewerUrl(splatUrl) {
    const url = new URL(viewerBaseUrl());
    const absoluteContent = new URL(splatUrl, window.location.origin).href;
    url.searchParams.set('content', absoluteContent);
    url.searchParams.set('noui', '');
    url.searchParams.set('noanim', '');
    url.searchParams.set('nofx', '');
    url.searchParams.set('renderer', 'webgl');
    if (prefersSequentialVRLoad()) {
        url.searchParams.set('budget', '1');
    }
    return url.toString();
}

function handleMessage(event) {
    if (!iframe || event.source !== iframe.contentWindow) return;

    switch (event.data?.type) {
        case 'claimcam-vr-ready':
            ready = true;
            loading = false;
            console.log('[SuperSplat VR] viewer ready');
            break;
        case 'claimcam-vr-error':
            ready = false;
            loading = false;
            preparePromise = null;
            console.error('[SuperSplat VR] viewer error:', event.data?.message);
            break;
        case 'claimcam-vr-started':
            xrActive = true;
            break;
        case 'claimcam-vr-ended':
            xrActive = false;
            if (iframe) iframe.style.display = 'none';
            onXREndCallback?.();
            break;
        default:
            break;
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('message', handleMessage);
}

function waitForVRReady(frame, timeoutMs = 180000) {
    return new Promise((resolve, reject) => {
        if (ready) {
            resolve();
            return;
        }

        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('SuperSplat VR viewer timed out while loading'));
        }, timeoutMs);

        const onMessage = (event) => {
            if (event.source !== frame.contentWindow) return;

            if (event.data?.type === 'claimcam-vr-ready') {
                cleanup();
                resolve();
                return;
            }

            if (event.data?.type === 'claimcam-vr-error') {
                cleanup();
                reject(new Error(event.data?.message || 'VR viewer failed to load'));
            }
        };

        const cleanup = () => {
            clearTimeout(timeout);
            window.removeEventListener('message', onMessage);
        };

        window.addEventListener('message', onMessage);
    });
}

function startPrepare(splatUrl) {
    currentUrl = splatUrl;
    ready = false;
    loading = true;

    const frame = ensureIframe();
    frame.src = buildViewerUrl(splatUrl);

    preparePromise = waitForVRReady(frame)
        .catch((err) => {
            loading = false;
            preparePromise = null;
            console.warn('[SuperSplat VR] prepare failed:', err);
            throw err;
        });

    return preparePromise;
}

/**
 * Pre-load the PlayCanvas gsplat viewer while the 2D splat is visible.
 */
export async function prepareSuperSplatVR(splatUrl) {
    if (!splatUrl) return;

    if (currentUrl === splatUrl && ready) {
        return;
    }

    if (currentUrl === splatUrl && preparePromise) {
        return preparePromise;
    }

    if (currentUrl !== splatUrl) {
        await teardownSuperSplatVR();
    }

    return startPrepare(splatUrl);
}

/**
 * Fire-and-forget VR warm-up after the 2D splat is already on screen.
 * Skipped on Quest — both engines at once exhaust GPU memory.
 */
export function warmSuperSplatVR(splatUrl) {
    if (!splatUrl || prefersSequentialVRLoad()) return;

    if (currentUrl === splatUrl && (ready || preparePromise)) {
        return;
    }

    prepareSuperSplatVR(splatUrl).catch((err) => {
        console.warn('[SuperSplat VR] background warm failed:', err);
    });
}

/**
 * Show the viewer and enter immersive VR. Call synchronously from a user click
 * (do not await before this runs).
 */
export function enterSuperSplatVR() {
    if (!iframe || !ready) {
        throw new Error('SuperSplat VR viewer is not ready');
    }

    iframe.style.display = 'block';

    const win = iframe.contentWindow;
    const enterBtn = win?.document.getElementById('enterVR');
    if (enterBtn) {
        enterBtn.click();
    } else {
        win?.postMessage({ type: 'claimcam-start-vr' }, '*');
    }
}

export function hasActiveSuperSplatVR() {
    return xrActive;
}

export function isSuperSplatVRReady() {
    return ready;
}

export function isSuperSplatVRLoading() {
    return loading && !ready;
}

export function exitSuperSplatVR() {
    iframe?.contentWindow?.postMessage({ type: 'claimcam-end-vr' }, '*');
}

export function onSuperSplatXREnd(callback) {
    onXREndCallback = callback;
}

export async function teardownSuperSplatVR() {
    ready = false;
    loading = false;
    xrActive = false;
    currentUrl = null;
    preparePromise = null;

    if (iframe) {
        iframe.remove();
        iframe = null;
    }
}
