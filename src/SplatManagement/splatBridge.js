/** Shared handle to the active 2D Gaussian splat viewer (React dashboard). */

let activeViewer = null;
let activeUrl = null;

export function setActiveSplatViewer(viewer, url) {
    activeViewer = viewer;
    activeUrl = url;
}

export function clearActiveSplatViewer(viewer) {
    if (activeViewer === viewer) {
        activeViewer = null;
        activeUrl = null;
    }
}

export function destroySplatForXR() {
    activeViewer?.destroyForXR();
}

export async function restoreSplatAfterXR() {
    if (activeViewer && activeUrl) {
        await activeViewer.load(activeUrl);
    }
}
