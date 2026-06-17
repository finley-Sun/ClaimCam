import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { createSystem } from '@iwsdk/core';

export const SPLAT_XR_POSITION = [0, 1.2, -2];

export class XRSplatLoader {

    constructor({ scene, camera, renderer }) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.viewer = null;
        this.splatMesh = null;
        this.ready = false;
        this._onXRSessionStart = () => {
            if (this.viewer) this.viewer.webXRActive = true;
        };
        this._onXRSessionEnd = () => {
            if (this.viewer) this.viewer.webXRActive = false;
        };
        this.renderer.xr.addEventListener('sessionstart', this._onXRSessionStart);
        this.renderer.xr.addEventListener('sessionend', this._onXRSessionEnd);
    }

    async load(url) {
        if (this.viewer) {
            this._dispose();
        }

        this.ready = false;

        this.viewer = new GaussianSplats3D.Viewer({
            dropInMode: true,
            selfDrivenMode: false,
            useBuiltInControls: false,
            sharedMemoryForWorkers: false,
            gpuAcceleratedSort: false,
            renderer: this.renderer,
            camera: this.camera,
            threeScene: this.scene,
            sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
        });
        this.viewer.init();
        this.viewer.webXRActive = this.renderer.xr.isPresenting;

        await this.viewer.addSplatScene(url, {
            showLoadingUI: false,
            splatAlphaRemovalThreshold: 5,
            position: SPLAT_XR_POSITION,
            rotation: [1, 0, 0, 0],
            scale: [1, 1, 1]
        });

        this.splatMesh = this.viewer.splatMesh;

        if (!this.splatMesh) {
            console.error('[XRSplatLoader] splatMesh is null after load');
            return;
        }

        this.scene.add(this.splatMesh);
        this.ready = true;

        console.log('[XRSplatLoader] splatMesh injected into IWSDK scene:', this.splatMesh);
    }

    update() {
        if (!this.viewer || !this.ready) return;
        try {
            this.viewer.update();
            this.viewer.render();
        } catch (e) {
            // Suppress render errors during XR frame transitions
        }
    }

    _dispose() {
        this.ready = false;
        if (this.splatMesh) {
            this.scene.remove(this.splatMesh);
            this.splatMesh = null;
        }
        if (this.viewer) {
            try { this.viewer.dispose(); } catch (e) {}
            this.viewer = null;
        }
    }

    dispose() {
        this.renderer.xr.removeEventListener('sessionstart', this._onXRSessionStart);
        this.renderer.xr.removeEventListener('sessionend', this._onXRSessionEnd);
        this._dispose();
    }
}

export function createXRSplatSystem(xrSplatLoader) {
    return class XRSplatSystem extends createSystem({}) {
        update() {
            xrSplatLoader.update();
        }
    };
}
