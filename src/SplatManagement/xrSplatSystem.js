import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

export const SPLAT_XR_POSITION = [0, 1.0, -2];

/**
 * Embeds gaussian splats in the IWSDK scene via DropInViewer so they render
 * inside the same WebXR frame as the dome (required for immersive VR on Quest).
 */
export class XRSplatLoader {

    constructor({ scene, renderer }) {
        this.scene = scene;
        this.renderer = renderer;
        this.dropIn = null;
        this.ready = false;
        this._onXRSessionStart = () => {
            console.log('[XRSplatLoader] renderer.xr "sessionstart" fired');
            this.setWebXRActive(true);
        };
        this._onXRSessionEnd = () => {
            console.log('[XRSplatLoader] renderer.xr "sessionend" fired');
            this.setWebXRActive(false);
        };
        this.renderer.xr.addEventListener('sessionstart', this._onXRSessionStart);
        this.renderer.xr.addEventListener('sessionend', this._onXRSessionEnd);
    }

    /**
     * Force the inner mkkellogg viewer into / out of stereo WebXR mode.
     * mkkellogg only applies per-eye focal-length correction
     * (adjustForWebXRStereo) when viewer.webXRActive === true; without it the
     * splats are sized for a mono framebuffer and collapse to ~nothing in the
     * stereo immersive frame.
     */
    setWebXRActive(active) {
        const viewer = this.dropIn?.viewer;
        if (!viewer) return;
        viewer.webXRActive = active;
        console.log('[XRSplatLoader] webXRActive =', active);
    }

    /**
     * Throttled diagnostics — call from the render loop. Prints whether the
     * splat is actually ready to draw inside the immersive frame.
     */
    logDiagnostics(tag = '') {
        const viewer = this.dropIn?.viewer;
        console.log(`[XRSplatLoader diag${tag ? ' ' + tag : ''}]`, {
            hasDropIn: !!this.dropIn,
            ready: this.ready,
            isPresenting: this.renderer.xr.isPresenting,
            webXRActive: viewer?.webXRActive,
            splatRenderReady: viewer?.splatRenderReady,
            initialized: viewer?.initialized,
            sceneCount: viewer?.getSceneCount?.(),
            dropInVisible: this.dropIn?.visible,
            dropInParent: this.dropIn?.parent?.type || null,
        });
    }

    async load(url) {
        await this._dispose();

        this.dropIn = new GaussianSplats3D.DropInViewer({
            sharedMemoryForWorkers: false,
            gpuAcceleratedSort: false,
            sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
            renderMode: GaussianSplats3D.RenderMode.Always,
        });
        this.dropIn.position.set(
            SPLAT_XR_POSITION[0],
            SPLAT_XR_POSITION[1],
            SPLAT_XR_POSITION[2]
        );

        this.scene.add(this.dropIn);

        await this.dropIn.addSplatScene(url, {
            showLoadingUI: false,
            splatAlphaRemovalThreshold: 5,
            rotation: [1, 0, 0, 0],
            scale: [1, 1, 1],
        });

        // The splat mesh must never be frustum-culled: in stereo the cull test
        // runs against the mono camera and can drop the mesh entirely.
        const splatMesh = this.dropIn.viewer?.splatMesh;
        if (splatMesh) {
            splatMesh.frustumCulled = false;
            this.dropIn.frustumCulled = false;
        }

        // Sync to whatever the session state is right now (covers the case
        // where the session started before this (re)load finished).
        this.setWebXRActive(this.renderer.xr.isPresenting);

        this.ready = true;
        console.log('[XRSplatLoader] DropInViewer splat ready for XR', {
            isPresenting: this.renderer.xr.isPresenting,
            sceneCount: this.dropIn.viewer?.getSceneCount?.(),
            splatMesh: !!splatMesh,
        });
    }

    async _dispose() {
        this.ready = false;
        if (!this.dropIn) return;

        this.scene.remove(this.dropIn);
        try {
            await this.dropIn.dispose();
        } catch (e) {}
        this.dropIn = null;
    }

    dispose() {
        this.renderer.xr.removeEventListener('sessionstart', this._onXRSessionStart);
        this.renderer.xr.removeEventListener('sessionend', this._onXRSessionEnd);
        return this._dispose();
    }
}
