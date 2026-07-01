/** True when running inside a headset browser (Quest Browser, Wolvic, etc.). */
export function isHeadsetBrowser() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /OculusBrowser|Quest|Wolvic|Mobile VR|VR\b/i.test(ua);
}

/** Headsets choke when the 2D mkkellogg viewer and PlayCanvas VR iframe load together. */
export function prefersSequentialVRLoad() {
    return isHeadsetBrowser();
}
