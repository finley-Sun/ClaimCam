import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { computeSplatBounds } from './splatPlacement.js';
import { isHeadsetBrowser } from './xrDevice.js';
import { createXRVrUi, intersectExitHud } from './xrVrUi.js';
import { createXRLocomotion, forceFullSplatVisibility } from './xrLocomotion.js';

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
    this._xrUi = null;
    this._xrItems = [];
    this._xrIsDamage = false;
    this._xrSession = null;
    this._xrSelectHandler = null;
    this._xrSqueezeHandler = null;
    this._xrBaseUpdateFunc = null;
    this._xrLocomotion = null;
    this._xrLastFrameTime = 0;
    this._controlsWereEnabled = true;

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
      this._readyCallback?.();
      this.viewer.renderer.setClearColor(0xe2edd8, 1);

      const splatMesh = this.viewer.splatMesh;
      if (splatMesh) {
        splatMesh.frustumCulled = false;
      }

      this._centerCameraInRoom();
      this._ensureXR();
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
    this._detachXrUi();
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

  setOnXRSessionEnd(callback) {
    this._onXRSessionEnd = callback;
  }

  setOnXRSessionStart(callback) {
    this._onXRSessionStart = callback;
  }

  setReadyCallback(callback) {
    this._readyCallback = callback;
  }

  setXRItems(items, isDamage = false) {
    this._xrItems = items ?? [];
    this._xrIsDamage = isDamage;
  }

  _attachXrUi(session) {
    const viewer = this.viewer;
    const camera = viewer?.camera;
    if (!camera || !session) return;

    this._detachXrUi();
    const { width, height } = this.getContainerSize();
    this._xrUi = createXRVrUi({
      camera,
      items: this._xrItems,
      mkViewer: viewer,
      isDamage: this._xrIsDamage,
      width,
      height,
    });
    this._xrSession = session;

    this._xrSelectHandler = (event) => {
      const frame = event.frame;
      const refSpace = viewer.renderer?.xr?.getReferenceSpace?.();
      const mesh = this._xrUi?.exitMesh;
      if (!frame || !refSpace || !mesh) return;

      if (intersectExitHud(mesh, frame, refSpace, event.inputSource)) {
        this.exitImmersiveVR();
      }
    };

    this._xrSqueezeHandler = (event) => {
      const frame = event.frame;
      const refSpace = viewer.renderer?.xr?.getReferenceSpace?.();
      const mesh = this._xrUi?.exitMesh;
      if (!frame || !refSpace || !mesh) return;

      if (intersectExitHud(mesh, frame, refSpace, event.inputSource)) {
        this.exitImmersiveVR();
      }
    };

    session.addEventListener('select', this._xrSelectHandler);
    session.addEventListener('squeeze', this._xrSqueezeHandler);

    this._xrLocomotion = createXRLocomotion({
      getViewer: () => this.viewer,
      getExitMesh: () => this._xrUi?.exitMesh,
      onExit: () => this.exitImmersiveVR(),
    });
    this._xrLocomotion.captureBaseReferenceSpace();
    this._xrLastFrameTime = 0;
  }

  _detachXrUi() {
    if (this._xrSession && this._xrSelectHandler) {
      this._xrSession.removeEventListener('select', this._xrSelectHandler);
    }
    if (this._xrSession && this._xrSqueezeHandler) {
      this._xrSession.removeEventListener('squeeze', this._xrSqueezeHandler);
    }
    this._xrSession = null;
    this._xrSelectHandler = null;
    this._xrSqueezeHandler = null;
    this._xrLocomotion?.reset();
    this._xrLocomotion = null;
    this._xrLastFrameTime = 0;
    this._xrUi?.destroy();
    this._xrUi = null;

    const viewer = this.viewer;
    if (viewer && this._xrBaseUpdateFunc) {
      viewer.selfDrivenUpdateFunc = this._xrBaseUpdateFunc;
      this._xrBaseUpdateFunc = null;
    }
  }

  _ensureXR() {
    const viewer = this.viewer;
    const renderer = viewer?.renderer;
    if (!renderer) return false;

    renderer.xr.enabled = true;

    if (!this._xrListenersAttached) {
      renderer.xr.addEventListener('sessionstart', () => {
        if (!viewer) return;
        viewer.webXRActive = true;
        this._xrActive = true;
        forceFullSplatVisibility(viewer.splatMesh);
        viewer.renderer.setClearColor(0xe2edd8, 1);
        if (viewer.controls) {
          this._controlsWereEnabled = viewer.controls.enabled;
          viewer.controls.enabled = false;
        }
        this._onXRSessionStart?.();
        const session = renderer.xr.getSession?.();
        if (session) this._attachXrUi(session);
        try { viewer.stop(); } catch (e) { /* ignore */ }
        if (!this._xrBaseUpdateFunc && viewer.selfDrivenUpdateFunc) {
          this._xrBaseUpdateFunc = viewer.selfDrivenUpdateFunc;
          viewer.selfDrivenUpdateFunc = (time, frame) => {
            const deltaSec = this._xrLastFrameTime
              ? (time - this._xrLastFrameTime) / 1000
              : 0;
            this._xrLastFrameTime = time;

            this._xrBaseUpdateFunc(time, frame);
            if (this._xrLocomotion && frame) {
              this._xrLocomotion.update(frame, deltaSec);
            }
            if (this._xrUi) {
              this._xrUi.render(viewer.renderer, viewer.camera);
            }
          };
        }
        viewer.renderer.setAnimationLoop(viewer.selfDrivenUpdateFunc);
        viewer.selfDrivenModeRunning = true;
      });
      renderer.xr.addEventListener('sessionend', () => {
        if (!viewer) return;
        viewer.webXRActive = false;
        this._xrActive = false;
        this._detachXrUi();
        if (viewer.controls) {
          viewer.controls.enabled = this._controlsWereEnabled;
        }
        viewer.renderer.setAnimationLoop(null);
        if (viewer.selfDrivenMode) {
          try { viewer.start(); } catch (e) { /* ignore */ }
        }
        this._onXRSessionEnd?.();
      });
      this._xrListenersAttached = true;
    }

    return true;
  }

  /**
   * Enter headset VR using the already-loaded splat. Call synchronously from
   * the user's click/tap — do not await other work before this runs.
   */
  enterImmersiveVR() {
    if (!isHeadsetBrowser()) {
      throw new Error('VR requires a headset browser');
    }

    if (!this._ensureXR()) {
      throw new Error('Splat viewer is not ready for VR');
    }

    const renderer = this.viewer.renderer;
    if (renderer.xr.isPresenting) return;

    if (!navigator.xr?.requestSession) {
      throw new Error('WebXR is not available in this browser');
    }

    navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor'],
    })
      .then(async (session) => {
        if (!session) return;
        this.viewer.webXRActive = true;
        this._xrActive = true;
        await renderer.xr.setSession(session);
      })
      .catch((err) => {
        this.viewer.webXRActive = false;
        this._xrActive = false;
        this._detachXrUi();
        console.error('[GaussianSplat] VR session failed:', err);
        this._onXRSessionEnd?.();
      });
  }

  exitImmersiveVR() {
    const session = this.viewer?.renderer?.xr?.getSession?.();
    if (session) session.end();
  }

  isInImmersiveVR() {
    return !!this.viewer?.renderer?.xr?.isPresenting;
  }
}
