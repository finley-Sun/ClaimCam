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
            if (this.dropIn?.viewer) this.dropIn.viewer.webXRActive = true;
        };
        this._onXRSessionEnd = () => {
            if (this.dropIn?.viewer) this.dropIn.viewer.webXRActive = false;
        };
        this.renderer.xr.addEventListener('sessionstart', this._onXRSessionStart);
        this.renderer.xr.addEventListener('sessionend', this._onXRSessionEnd);
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

        if (this.dropIn.viewer) {
            this.dropIn.viewer.webXRActive = this.renderer.xr.isPresenting;
        }

        this.ready = true;
        console.log('[XRSplatLoader] DropInViewer splat ready for XR');
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
