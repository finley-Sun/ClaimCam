import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

export class GaussianSplatViewer {

    constructor({ container }) {
        this.container = container;
        this.viewer = null;

        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'absolute';
        this.wrapper.style.inset = '0';
        this.wrapper.style.width = '100%';
        this.wrapper.style.height = '100%';
        this.wrapper.style.zIndex = '10';
        this.wrapper.style.display = 'none';
        this.container.appendChild(this.wrapper);

        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'splat-close-btn';
        this.closeBtn.textContent = '✕';
        this.wrapper.appendChild(this.closeBtn);

        this.hintsEl = document.createElement('div');
        this.hintsEl.className = 'splat-hints';
        this.hintsEl.innerHTML = `
            <div class="splat-hint-row">
                <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
                <span>Move</span>
            </div>
            <div class="splat-hint-row">
                <kbd>Mouse drag</kbd>
                <span>Look around</span>
            </div>
            <div class="splat-hint-row">
                <kbd>Scroll</kbd>
                <span>Zoom</span>
            </div>
        `;
        this.wrapper.appendChild(this.hintsEl);

        this._resizeObserver = new ResizeObserver(() => this._onResize());
        this._resizeObserver.observe(this.container);
    }

    async load(url) {
        if (this.viewer) {
            this._destroyViewer();
        }

        // Show wrapper BEFORE init so dimensions are non-zero
        this.wrapper.style.display = 'block';

        // Wait one frame so the browser paints and dimensions are available
        await new Promise(r => requestAnimationFrame(r));

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        console.log('[GaussianSplat] container size:', width, height);

        this.viewer = new GaussianSplats3D.Viewer({
            rootElement: this.wrapper,
            selfDrivenMode: true,
            useBuiltInControls: true,
            sharedMemoryForWorkers: false,
            width: width,
            height: height,
        });

        await this.viewer.addSplatScene(url, {
            splatAlphaRemovalThreshold: 5,
            position: [0, 1.0, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1, 1]
        });

        this.viewer.start();
        console.log('[GaussianSplat] loaded:', url);
    }

    async swap(url) {
        await this.load(url);
    }

    show() {
        this.wrapper.style.display = 'block';
        this._onResize();
    }

    hide() {
        this.wrapper.style.display = 'none';
    }

    onClose(callback) {
        this.closeBtn.addEventListener('click', callback);
    }

    _onResize() {
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

    _destroyViewer() {
        if (this.viewer) {
            this.viewer.stop();
            this.viewer.dispose();
            this.viewer = null;
        }
        Array.from(this.wrapper.children).forEach(child => {
            if (child !== this.closeBtn && child !== this.hintsEl) {
                this.wrapper.removeChild(child);
            }
        });
    }

    dispose() {
        this._destroyViewer();
        this._resizeObserver.disconnect();
        this.wrapper.remove();
    }
}