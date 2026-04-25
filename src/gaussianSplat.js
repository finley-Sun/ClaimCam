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

        // Info button (iconized)
        this.infoBtn = document.createElement('button');
        this.infoBtn.className = 'splat-info-btn';
        this.infoBtn.textContent = 'i';
        this.wrapper.appendChild(this.infoBtn);

        // Info panel (hidden by default)
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'splat-info-panel';
        this.infoPanel.style.display = 'none';
        this.infoPanel.innerHTML = `
            <div class="splat-info-header">
                <span>Controls</span>
                <button class="splat-info-minimize">−</button>
            </div>
            <div class="splat-info-content">
                <div class="splat-info-section">Navigation</div>
                <div class="splat-hint-row">
                    <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
                    <span>Move up / left / down / right</span>
                </div>
                <div class="splat-hint-row">
                    <kbd>Scroll</kbd>
                    <span>Zoom in / out</span>
                </div>
                <div class="splat-info-section">Camera</div>
                <div class="splat-hint-row">
                    <kbd>Click</kbd>
                    <span>Point camera toward clicked position</span>
                </div>
                <div class="splat-hint-row">
                    <kbd>Click drag</kbd>
                    <span>Move position and view simultaneously</span>
                </div>
                <div class="splat-info-section">Rotation</div>
                <div class="splat-hint-row">
                    <kbd>Ctrl</kbd><kbd>A</kbd>
                    <span>Rotate left</span>
                </div>
                <div class="splat-hint-row">
                    <kbd>Ctrl</kbd><kbd>S</kbd>
                    <span>Rotate down</span>
                </div>
                <div class="splat-hint-row">
                    <kbd>Ctrl</kbd><kbd>D</kbd>
                    <span>Rotate right</span>
                </div>
                <div class="splat-hint-row">
                    <kbd>Ctrl</kbd><kbd>W</kbd>
                    <span style="color:#e05555;">Closes the browser tab</span>
                </div>
            </div>
        `;
        this.wrapper.appendChild(this.infoPanel);

        // Toggle info panel
        this.infoBtn.addEventListener('click', () => {
            const isHidden = this.infoPanel.style.display === 'none';
            this.infoPanel.style.display = isHidden ? 'block' : 'none';
        });

        // Minimize info panel
        this.infoPanel.querySelector('.splat-info-minimize').addEventListener('click', () => {
            this.infoPanel.style.display = 'none';
        });

        this._resizeObserver = new ResizeObserver(() => this._onResize());
        this._resizeObserver.observe(this.container);
    }

    async load(url) {
        if (this.viewer) {
            this._destroyViewer();
        }

        this.wrapper.style.display = 'block';

        await new Promise(r => requestAnimationFrame(r));

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

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
            rotation: [1, 0, 0, 0],
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
            if (
                child !== this.closeBtn &&
                child !== this.infoBtn &&
                child !== this.infoPanel
            ) {
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