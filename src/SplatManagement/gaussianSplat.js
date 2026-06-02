import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

// Suppress spurious removeChild NotFoundError rejections from the library
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

  /**
   * Load a splat scene from a URL.
   * If a viewer already exists it is fully torn down before creating a new one.
   * @param {string} url - Path / URL to the .splat / .ksplat file
   */
  async load(url) {
    if (this.viewer) {
      const oldViewer = this.viewer;
      const oldRoot = this._activeRoot;

      this.viewer = null;
      this._activeRoot = null;

      try {
        oldViewer.stop();
      } catch (e) {}

      if (oldRoot && oldRoot.parentNode === this.container) {
        this.container.removeChild(oldRoot);
      }

      // Deferred dispose — give the library a tick to finish any in-flight work
      setTimeout(() => {
        try {
          oldViewer.dispose();
        } catch (e) {}

        try {
          if (oldRoot) oldRoot.remove();
        } catch (e) {}
      }, 200);
    }

    // Create a fresh full-size overlay div that the viewer will render into
    const root = document.createElement('div');
    root.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    `;

    this.container.appendChild(root);
    this._activeRoot = root;

    // Wait one frame so the browser can measure the container before we read its size
    await new Promise((r) => requestAnimationFrame(r));

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

  /**
   * Show the viewer overlay AND restart the internal render loop.
   * Safe to call even if the viewer was never paused.
   */
  show() {
    this._xrActive = false;

    if (this._activeRoot) {
      this._activeRoot.style.display = 'block';
    }

    // Restart the render loop so frames are actually produced
    if (this.viewer) {
      try {
        this.viewer.start();
      } catch (e) {
        console.warn(
          '[GaussianSplat] show: could not start viewer loop',
          e
        );
      }
    }

    this._onResize();
  }

  /**
   * Hide the viewer overlay AND stop the internal render loop to free GPU/CPU.
   * The viewer and scene data are kept intact — call show() to resume.
   */
  hide() {
    // Stop the render loop first so no frames are rendered while hidden
    if (this.viewer) {
      try {
        this.viewer.stop();
      } catch (e) {
        console.warn(
          '[GaussianSplat] hide: could not stop viewer loop',
          e
        );
      }
    }

    if (this._activeRoot) {
      this._activeRoot.style.display = 'none';
    }
  }

  /**
   * Pause rendering — stops the library's internal loop and hides the overlay.
   * Nothing is disposed; call resume() to continue from the same state.
   */
  pause() {
    if (!this.viewer) return;

    try {
      this.viewer.stop();
    } catch (e) {
      console.warn(
        '[GaussianSplat] pause: could not stop viewer loop',
        e
      );
    }

    if (this._activeRoot) {
      this._activeRoot.style.display = 'none';
    }

    console.log('[GaussianSplat] paused');
  }

  /**
   * Resume rendering after a pause() — shows the overlay and restarts the loop.
   */
  resume() {
    if (!this.viewer) return;

    if (this._activeRoot) {
      this._activeRoot.style.display = 'block';
    }

    try {
      this.viewer.start();
    } catch (e) {
      console.warn(
        '[GaussianSplat] resume: could not start viewer loop',
        e
      );
    }

    this._onResize();

    console.log('[GaussianSplat] resumed');
  }

  /**
   * Hot-swap the loaded splat scene without recreating the viewer or its WebGL context.
   * Stops the loop → removes the existing scene → loads the new URL → restarts the loop.
   * @param {string} url - Path / URL to the new .splat / .ksplat file
   */
  async swap(url) {
    if (!this.viewer) {
      // No viewer yet — fall back to a full load
      console.warn(
        '[GaussianSplat] swap called with no active viewer, falling back to load()'
      );
      return this.load(url);
    }

    console.log('[GaussianSplat] swapping scene to:', url);

    // 1. Stop the render loop while we mutate the scene graph
    try {
      this.viewer.stop();
    } catch (e) {}

    // 2. Remove the existing splat scene (index 0)
    try {
      await this.viewer.removeSplatScene(0);
    } catch (e) {
      console.warn(
        '[GaussianSplat] swap: could not remove scene at index 0',
        e
      );
    }

    // 3. Add the new scene
    try {
      await this.viewer.addSplatScene(url, {
        splatAlphaRemovalThreshold: 5,
        position: [0, 1.0, 0],
        rotation: [1, 0, 0, 0],
        scale: [1, 1, 1],
      });
    } catch (e) {
      console.error(
        '[GaussianSplat] swap: failed to add new scene',
        e
      );
      throw e;
    }

    // 4. Restart the render loop
    try {
      this.viewer.start();
    } catch (e) {
      console.warn(
        '[GaussianSplat] swap: could not restart viewer loop',
        e
      );
    }

    console.log('[GaussianSplat] swap complete:', url);
  }

  setXRActive(active) {
    this._xrActive = active;
  }

  /**
   * Stop the render loop and remove the DOM elements in preparation for an XR session.
   * The viewer instance is fully disposed — call load() again after XR ends.
   */
  destroyForXR() {
    this._xrActive = true;
    this._killViewer();
  }

  /** Internal — fully tears down the current viewer and its DOM root. */
  _killViewer() {
    if (!this.viewer) return;

    const oldViewer = this.viewer;
    const oldRoot = this._activeRoot;

    this.viewer = null;
    this._activeRoot = null;

    try {
      oldViewer.stop();
    } catch (e) {}

    if (oldRoot && oldRoot.parentNode === this.container) {
      this.container.removeChild(oldRoot);
    }

    // Deferred dispose — give the library time to finish any in-flight async work
    setTimeout(() => {
      try {
        oldViewer.dispose();
      } catch (e) {}

      try {
        if (oldRoot) oldRoot.remove();
      } catch (e) {}
    }, 200);
  }

  /** Release all resources. Should be called when the host component unmounts. */
  dispose() {
    this._killViewer();
    this._resizeObserver.disconnect();
  }

  /** Sync the renderer/camera to the current container dimensions. */
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