import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { computeSplatBounds } from './splatPlacement.js';
import { isHeadsetBrowser } from './xrDevice.js';
import { createXRExitHud, intersectExitHud } from './xrExitHud.js';

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
    this._exitOverlayEl = null;
    this._exitHud = null;
    this._xrSession = null;
    this._xrSelectHandler = null;
    this._xrBaseUpdateFunc = null;

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
    this._detachExitHud();
    this._exitOverlayEl?.remove();
    this._exitOverlayEl = null;
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

  _ensureExitOverlay() {
    if (this._exitOverlayEl) return this._exitOverlayEl;

    const overlay = document.createElement('div');
    overlay.id = 'claimcam-vr-exit-overlay';
    overlay.setAttribute('data-testid', 'vr-exit-overlay');
    // WebXR dom-overlay root must stay in the DOM and not use display:none at session start.
    overlay.style.cssText = [
      'position:fixed',
      'left:0',
      'right:0',
      'bottom:0',
      'height:96px',
      'z-index:2147483647',
      'display:flex',
      'justify-content:center',
      'align-items:flex-end',
      'padding-bottom:max(24px, env(safe-area-inset-bottom))',
      'pointer-events:none',
      'visibility:hidden',
    ].join(';');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Exit VR';
    btn.setAttribute('aria-label', 'Exit VR');
    btn.style.cssText = [
      'position:relative',
      'pointer-events:auto',
      'padding:14px 24px',
      'border:none',
      'border-radius:9999px',
      'background:#ef4444',
      'color:#fff',
      'font:600 16px/1 system-ui,-apple-system,sans-serif',
      'cursor:pointer',
      'box-shadow:0 12px 36px rgba(0,0,0,0.45)',
    ].join(';');
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.exitImmersiveVR();
    });

    overlay.appendChild(btn);
    document.body.appendChild(overlay);
    this._exitOverlayEl = overlay;
    return overlay;
  }

  _showExitOverlay() {
    const overlay = this._ensureExitOverlay();
    overlay.style.visibility = 'visible';
  }

  _hideExitOverlay() {
    if (this._exitOverlayEl) {
      this._exitOverlayEl.style.visibility = 'hidden';
    }
  }

  _attachExitHud(session) {
    const viewer = this.viewer;
    const camera = viewer?.camera;
    const threeScene = viewer?.threeScene;
    if (!camera || !threeScene || !session) return;

    this._detachExitHud();
    this._exitHud = createXRExitHud(camera, threeScene);
    this._xrSession = session;

    this._xrSelectHandler = (event) => {
      const frame = event.frame;
      const refSpace = this.viewer?.renderer?.xr?.getReferenceSpace?.();
      const mesh = this._exitHud?.mesh;
      if (!frame || !refSpace || !mesh) return;

      if (intersectExitHud(mesh, frame, refSpace, event.inputSource)) {
        this.exitImmersiveVR();
      }
    };

    session.addEventListener('select', this._xrSelectHandler);
  }

  _detachExitHud() {
    if (this._xrSession && this._xrSelectHandler) {
      this._xrSession.removeEventListener('select', this._xrSelectHandler);
    }
    this._xrSession = null;
    this._xrSelectHandler = null;
    this._exitHud?.destroy();
    this._exitHud = null;

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
        this._showExitOverlay();
        this._onXRSessionStart?.();
        const session = renderer.xr.getSession?.();
        if (session) this._attachExitHud(session);
        // mkkellogg uses rAF when webXRMode is None — switch to XR loop for headset.
        try { viewer.stop(); } catch (e) { /* ignore */ }
        if (!this._xrBaseUpdateFunc && viewer.selfDrivenUpdateFunc) {
          this._xrBaseUpdateFunc = viewer.selfDrivenUpdateFunc;
          viewer.selfDrivenUpdateFunc = (time, frame) => {
            this._exitHud?.updatePose?.();
            this._xrBaseUpdateFunc(time, frame);
          };
        }
        viewer.renderer.setAnimationLoop(viewer.selfDrivenUpdateFunc);
        viewer.selfDrivenModeRunning = true;
      });
      renderer.xr.addEventListener('sessionend', () => {
        if (!viewer) return;
        viewer.webXRActive = false;
        this._xrActive = false;
        this._detachExitHud();
        this._hideExitOverlay();
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

    const overlay = this._ensureExitOverlay();
    this._showExitOverlay();

    const sessionOptionsWithOverlay = {
      optionalFeatures: ['local-floor', 'dom-overlay'],
      domOverlay: { root: overlay },
    };
    const sessionOptionsBasic = {
      optionalFeatures: ['local-floor'],
    };

    // Quest immersive-vr does not keep HTML dom-overlay — 3D head-locked HUD handles Exit VR.
    navigator.xr.requestSession('immersive-vr', sessionOptionsBasic)
      .catch((basicErr) => {
        console.warn('[GaussianSplat] basic VR session failed, trying dom-overlay:', basicErr);
        return navigator.xr.requestSession('immersive-vr', sessionOptionsWithOverlay);
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
        this._detachExitHud();
        this._hideExitOverlay();
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
