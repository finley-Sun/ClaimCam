import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

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

    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(this.container);
  }

 async load(url) {
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
        position: [0, 1.0, 0],
        rotation: [1, 0, 0, 0],
        scale: [1, 1, 1],
      });

      this.viewer.start();
      console.log('[GaussianSplat] loaded:', url);
    } catch (e) {
      console.error('[GaussianSplat] load failed:', e);
      if (root.parentNode === this.container) {
        this.container.removeChild(root);
      }
      this._activeRoot = null;
      throw e;
    }
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
}
