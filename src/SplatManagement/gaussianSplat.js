import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { computeSplatBounds } from './splatPlacement.js';

// mkkellogg uses quaternion [x, y, z, w]. [1,0,0,0] is 180° around X (upside down).
const SPLAT_IDENTITY_ROTATION = [0, 0, 0, 1];

window.addEventListener('unhandledrejection', (e) => {
  if (
    e.reason &&
    e.reason.name === 'NotFoundError' &&
    typeof e.reason.message === 'string' &&
    e.reason.message.includes('removeChild')
  ) {
    e.preventDefault();
  }
});

export class GaussianSplatViewer {

  constructor({ container }) {
    this.container = container;
    this.viewer = null;
    this._xrActive = false;
    this._activeRoot = null;
    this._loadedUrl = null;

    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(this.container);
  }

 async load(url) {
    if (this.viewer && this._loadedUrl === url) {
      return;
    }

    this._loadedUrl = url;

    // Kill the old viewer by orphaning its root entirely
    if (this.viewer) {
      const oldViewer = this.viewer;
      const oldRoot = this._activeRoot;

      this.viewer = null;
      this._activeRoot = null;

      try { oldViewer.stop(); } catch (e) {}

      // Detach the old root from container immediately
      if (oldRoot && oldRoot.parentNode === this.container) {
        this.container.removeChild(oldRoot);
      }

      // Let the library dispose in the background on its own detached root
      setTimeout(() => {
        try { oldViewer.dispose(); } catch (e) {}
        try { if (oldRoot) oldRoot.remove(); } catch (e) {}
      }, 200);
    }

    // Create a brand new root element for this viewer instance
    const root = document.createElement('div');
    root.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    `;
    this.container.appendChild(root);
    this._activeRoot = root;

    await new Promise(r => requestAnimationFrame(r));

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    try {
      this.viewer = new GaussianSplats3D.Viewer({
        rootElement: root,
        selfDrivenMode: true,
        useBuiltInControls: true,
        sharedMemoryForWorkers: false,
        width,
        height,
      });

      await this.viewer.addSplatScene(url, {
        splatAlphaRemovalThreshold: 5,
        position: [0, 0, 0],
        rotation: SPLAT_IDENTITY_ROTATION,
        scale: [1, 1, 1],
        progressiveLoad: true,
        showLoadingUI: false,
      });

      this.viewer.start();
      this.viewer.renderer.setClearColor(0xe2edd8, 1);
      this._centerCameraInRoom();
      console.log('[GaussianSplat] loaded:', url);
    } catch (e) {
      console.error('[GaussianSplat] load failed:', e);
      if (root.parentNode === this.container) {
        this.container.removeChild(root);
      }
      this._activeRoot = null;
      this._loadedUrl = null;
      throw e;
    }
  }

  // Put the orbit camera inside the room (interior centre) instead of leaving
  // it outside framing the scan as a small box.
  _centerCameraInRoom() {
    const bounds = computeSplatBounds(this.viewer);
    if (!bounds) {
      console.warn('[GaussianSplat] could not compute room bounds for camera');
      return;
    }

    const c = bounds.center;
    const cam = this.viewer.camera;
    const controls = this.viewer.controls;
    if (!cam) return;

    // Look along the longer horizontal axis so most of the room is in view.
    const alongZ = bounds.size.z >= bounds.size.x;
    const dist = Math.max(0.6, (alongZ ? bounds.size.z : bounds.size.x) * 0.3);

    cam.up.set(0, 1, 0);
    cam.near = 0.01;
    cam.far = Math.max(1000, (bounds.size.x + bounds.size.y + bounds.size.z) * 10);
    cam.position.set(c.x, c.y, c.z);
    cam.updateProjectionMatrix();

    if (controls) {
      controls.target.set(
        c.x + (alongZ ? 0 : dist),
        c.y,
        c.z + (alongZ ? dist : 0)
      );
      controls.update();
    }

    console.log('[GaussianSplat] camera centered in room', {
      size: {
        x: +bounds.size.x.toFixed(2),
        y: +bounds.size.y.toFixed(2),
        z: +bounds.size.z.toFixed(2),
      },
      center: c.toArray().map((n) => +n.toFixed(2)),
    });
  }

  show() {
    this._xrActive = false;
    if (this._activeRoot) this._activeRoot.style.display = 'block';
    this._onResize();
  }

  hide() {
    if (this._activeRoot) this._activeRoot.style.display = 'none';
  }

  setXRActive(active) {
    this._xrActive = active;
  }

  destroyForXR() {
    this._xrActive = true;
    this._killViewer();
  }

  _killViewer() {
    if (!this.viewer) return;

    const oldViewer = this.viewer;
    const oldRoot = this._activeRoot;

    this.viewer = null;
    this._activeRoot = null;
    this._loadedUrl = null;

    try { oldViewer.stop(); } catch (e) {}

    if (oldRoot && oldRoot.parentNode === this.container) {
      this.container.removeChild(oldRoot);
    }

    setTimeout(() => {
      try { oldViewer.dispose(); } catch (e) {}
      try { if (oldRoot) oldRoot.remove(); } catch (e) {}
    }, 200);
  }

  dispose() {
    this._killViewer();
    this._resizeObserver.disconnect();
  }

  _onResize() {
    if (this._xrActive) return;
    if (this.viewer && this.viewer.renderer) {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.viewer.renderer.setSize(width, height);
      if (this.viewer.camera) {
        this.viewer.camera.aspect = width / height;
        this.viewer.camera.updateProjectionMatrix();
      }
    }
  }

  getMkViewer() {
    return this.viewer;
  }

  getContainerSize() {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
  }
}
