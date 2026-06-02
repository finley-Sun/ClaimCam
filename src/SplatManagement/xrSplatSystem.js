import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { createSystem } from '@iwsdk/core';

export class XRSplatLoader {

    constructor({ scene, camera, renderer }) {
        this.scene    = scene;
        this.camera   = camera;
        this.renderer = renderer;
        this.viewer   = null;
        this.splatMesh = null;
        this.ready    = false;
    }

    async load(url) {
        if (this.viewer) {
            this._dispose();
        }

        this.ready = false;

        this.viewer = new GaussianSplats3D.Viewer({
            selfDrivenMode:         false,
            useBuiltInControls:     false,
            sharedMemoryForWorkers: false,
            gpuAcceleratedSort:     false,
            renderer:               this.renderer,
            camera:                 this.camera,
            scene:                  this.scene,
        });

        await this.viewer.addSplatScene(url, {
            splatAlphaRemovalThreshold: 5,
            position: [0, 1.2, -2],
            rotation: [1, 0, 0, 0],
            scale:    [1, 1, 1],
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

    // Called once per frame by the IWSDK system.
    // Only CPU work here — sorting + buffer upload.
    // IWSDK owns the actual renderer.render() call.
    update() {
        if (!this.viewer || !this.ready) return;
        try {
            this.viewer.update();
            // *** Do NOT call this.viewer.render() here. ***
            // IWSDK will render the scene (including splatMesh) itself.
        } catch (e) {
            // suppress transient XR frame errors
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
        this._dispose();
    }

    pause() {
        this.ready = false;
    }

    resume() {
        if (this.viewer && this.splatMesh) this.ready = true;
    }

    async swap(url) {
        this.pause();
        await this.viewer.removeSplatScene(0);
        await this.viewer.addSplatScene(url, {
            splatAlphaRemovalThreshold: 5,
            position: [0, 1.2, -2],
            rotation: [1, 0, 0, 0],
            scale: [1, 1, 1],
        });
        this.resume();
    }
}

export function createXRSplatSystem(xrSplatLoader) {
    return class XRSplatSystem extends createSystem({}) {
        update() {
            xrSplatLoader.update();
        }
    };
}