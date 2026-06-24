/** Headsets choke when the 2D mkkellogg viewer and PlayCanvas VR iframe load together. */
export function prefersSequentialVRLoad() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /OculusBrowser|Quest|VR\b|Mobile VR/i.test(ua);
}
