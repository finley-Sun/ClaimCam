import { Claim, ClaimStatus, PolicyMeta } from '../insuredObject.js';

export class ClaimFlow {

    constructor({ getObjects, onComplete }) {
        this.getObjects = getObjects;
        this.onComplete = onComplete;
        this.draft = this._emptyDraft();
        this._buildModal();
    }

    open() {
        this.draft = this._emptyDraft();
        this._goToStep(1);
        this.overlay.style.display = 'flex';
    }

    close() {
        this.overlay.style.display = 'none';
    }

    _emptyDraft() {
        return {
            objectId: null,
            policyType: null,
            media: [],
            damageSplatURL: null,
        };
    }

    _buildModal() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'cf-overlay';
        this.overlay.style.display = 'none';

        this.modal = document.createElement('div');
        this.modal.className = 'cf-modal';

        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    _goToStep(step) {
        this.currentStep = step;
        this.modal.innerHTML = '';
        const steps = {
            1: '_renderStep1',
            2: '_renderStep2',
            3: '_renderStep3',
            4: '_renderStep4',
        };
        if (steps[step]) this[steps[step]]();
    }

    // ── Step 1: Select object ────────────────────────────────────────

    _renderStep1() {
        const objects = this.getObjects();

        this.modal.innerHTML = `
            <div class="cf-header">
                <div class="cf-step-label">Step 1 of 4</div>
                <div class="cf-title">Start a claim</div>
                <button class="cf-close" id="cf-close">✕</button>
            </div>
            <div class="cf-body">
                <div class="cf-label" style="margin-bottom: 4px;">
                    Select the insured object to claim on
                </div>
                <div class="claim-object-list" id="claim-object-list">
                    ${objects.length === 0 ? `
                        <div style="padding: 24px; text-align: center; font-size: 12px; color: var(--text-tertiary);">
                            No insured objects found. Add one first.
                        </div>
                    ` : objects.map(obj => `
                        <div class="claim-object-item" data-id="${obj.id}">
                            <div class="cc-thumb">
                                ${obj.image
                                    ? `<img src="${obj.image}" alt="${obj.title}" />`
                                    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                                        <path d="M3 9h18"/>
                                    </svg>`
                                }
                            </div>
                            <div class="cc-item-body">
                                <div class="cc-item-name">${obj.title}</div>
                                <div class="cc-chip">
                                    <span class="dot"></span>
                                    ${obj.policies.length} polic${obj.policies.length !== 1 ? 'ies' : 'y'}
                                </div>
                            </div>
                            <span class="claim-object-check" style="display:none;">✓</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="cf-footer">
                <button class="cf-btn-secondary" id="cf-cancel">Cancel</button>
                <button class="cf-btn-primary" id="cf-next1" disabled style="opacity: 0.4;">Continue</button>
            </div>
        `;

        this.modal.querySelector('#cf-close').addEventListener('click', () => this.close());
        this.modal.querySelector('#cf-cancel').addEventListener('click', () => this.close());

        const next = this.modal.querySelector('#cf-next1');

        this.modal.querySelectorAll('.claim-object-item').forEach(item => {
            item.addEventListener('click', () => {
                this.modal.querySelectorAll('.claim-object-item').forEach(i => {
                    i.classList.remove('selected');
                    i.querySelector('.claim-object-check').style.display = 'none';
                });
                item.classList.add('selected');
                item.querySelector('.claim-object-check').style.display = 'block';
                this.draft.objectId = item.dataset.id;
                next.removeAttribute('disabled');
                next.style.opacity = '1';
            });
        });

        next.addEventListener('click', () => {
            if (this.draft.objectId) this._goToStep(2);
        });
    }

    // ── Step 2: Select damage type ───────────────────────────────────

    _renderStep2() {
        const objects = this.getObjects();
        const obj = objects.find(o => o.id === this.draft.objectId);

        this.modal.innerHTML = `
            <div class="cf-header">
                <div class="cf-step-label">Step 2 of 4</div>
                <div class="cf-title">Type of damage</div>
                <button class="cf-close" id="cf-close">✕</button>
            </div>
            <div class="cf-body">
                <div class="cf-label" style="margin-bottom: 4px;">
                    Select the type of damage — only covered policies shown
                </div>
                <div class="cf-policy-grid" id="cf-policy-grid">
                    ${obj.policies.map(key => {
                        const meta = PolicyMeta[key];
                        return `
                            <div class="cf-policy-item ${this.draft.policyType === key ? 'active' : ''}"
                                data-policy="${key}"
                                style="--policy-bg: ${meta.color}; --policy-border: ${meta.border};">
                                <span class="cf-policy-icon">${meta.icon}</span>
                                <span class="cf-policy-label">${meta.label}</span>
                                <span class="cf-policy-check">✓</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="cf-footer">
                <button class="cf-btn-secondary" id="cf-back2">Back</button>
                <button class="cf-btn-primary" id="cf-next2" disabled style="opacity: 0.4;">Continue</button>
            </div>
        `;

        this.modal.querySelector('#cf-close').addEventListener('click', () => this.close());
        this.modal.querySelector('#cf-back2').addEventListener('click', () => this._goToStep(1));

        const next = this.modal.querySelector('#cf-next2');

        this.modal.querySelectorAll('.cf-policy-item').forEach(item => {
            item.addEventListener('click', () => {
                this.modal.querySelectorAll('.cf-policy-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.draft.policyType = item.dataset.policy;
                next.removeAttribute('disabled');
                next.style.opacity = '1';
            });
        });

        next.addEventListener('click', () => {
            if (this.draft.policyType) this._goToStep(3);
        });
    }

    // ── Step 3: Upload damage media ──────────────────────────────────

    _renderStep3() {
        this.modal.innerHTML = `
            <div class="cf-header">
                <div class="cf-step-label">Step 3 of 4</div>
                <div class="cf-title">Document the damage</div>
                <button class="cf-close" id="cf-close">✕</button>
            </div>
            <div class="cf-body">
                <div class="cf-upload-zone" id="cf-upload-zone">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Click to upload or drag &amp; drop</span>
                    <span class="cf-upload-sub">Images and videos of the damage</span>
                    <input type="file" id="cf-file-input" multiple accept="image/*,video/*" style="display:none;" />
                </div>
                <div class="cf-media-requirement">
                    <div class="cf-media-req-text">
                        <span id="cf-media-score-label">0 / 15 points</span>
                        <span class="cf-media-req-hint">Images = 1 pt &nbsp;·&nbsp; Videos = 5 pts</span>
                    </div>
                    <div class="cf-media-progress-track">
                        <div class="cf-media-progress-fill" id="cf-media-progress-fill"></div>
                    </div>
                    <div class="cf-media-req-sub" id="cf-media-req-sub">
                        Upload at least 15 images, or fewer videos to reach 15 points
                    </div>
                </div>
                <div class="cf-media-grid" id="cf-media-grid"></div>
            </div>
            <div class="cf-footer">
                <button class="cf-btn-secondary" id="cf-back3">Back</button>
                <button class="cf-btn-primary" id="cf-next3" disabled style="opacity: 0.4;">Continue</button>
            </div>
        `;

        this.modal.querySelector('#cf-close').addEventListener('click', () => this.close());

        const uploadZone = this.modal.querySelector('#cf-upload-zone');
        const fileInput = this.modal.querySelector('#cf-file-input');

        uploadZone.addEventListener('click', () => fileInput.click());

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            this._addFiles(Array.from(e.dataTransfer.files));
        });

        fileInput.addEventListener('change', () => {
            this._addFiles(Array.from(fileInput.files));
        });

        this.modal.querySelector('#cf-back3').addEventListener('click', () => this._goToStep(2));
        this.modal.querySelector('#cf-next3').addEventListener('click', () => {
            if (this._mediaScore() >= 15) this._goToStep(4);
        });

        requestAnimationFrame(() => this._renderMediaGrid());
    }

    _mediaScore() {
        return this.draft.media.reduce((sum, item) => {
            return sum + (item.type === 'video' ? 5 : 1);
        }, 0);
    }

    _addFiles(files) {
        files.forEach(file => {
            const url = URL.createObjectURL(file);
            this.draft.media.push({
                file,
                url,
                type: file.type.startsWith('video') ? 'video' : 'image',
            });
        });
        this._renderMediaGrid();
    }

    _renderMediaGrid() {
        const grid = this.modal.querySelector('#cf-media-grid');
        const scoreLabel = this.modal.querySelector('#cf-media-score-label');
        const progressFill = this.modal.querySelector('#cf-media-progress-fill');
        const reqSub = this.modal.querySelector('#cf-media-req-sub');
        const nextBtn = this.modal.querySelector('#cf-next3');

        if (!grid) return;

        const score = this._mediaScore();
        const satisfied = score >= 15;
        const pct = Math.min((score / 15) * 100, 100);

        if (scoreLabel) scoreLabel.textContent = `${score} / 15 points`;

        if (progressFill) {
            progressFill.style.width = `${pct}%`;
            progressFill.style.background = satisfied
                ? '#3a7d44'
                : score > 0 ? '#c8860a' : 'var(--border-secondary)';
        }

        if (reqSub) {
            if (satisfied) {
                reqSub.textContent = 'Requirement met — you can continue';
                reqSub.style.color = '#3a7d44';
            } else {
                const remaining = 15 - score;
                const videosNeeded = Math.ceil(remaining / 5);
                reqSub.textContent = `${remaining} more point${remaining !== 1 ? 's' : ''} needed — add ${remaining} image${remaining !== 1 ? 's' : ''} or ${videosNeeded} video${videosNeeded !== 1 ? 's' : ''}`;
                reqSub.style.color = score > 0 ? 'var(--text-warning)' : 'var(--text-tertiary)';
            }
        }

        if (nextBtn) {
            if (satisfied) {
                nextBtn.removeAttribute('disabled');
            } else {
                nextBtn.setAttribute('disabled', 'true');
            }
            nextBtn.style.opacity = satisfied ? '1' : '0.4';
            nextBtn.style.cursor = satisfied ? 'pointer' : 'not-allowed';
        }

        grid.innerHTML = '';

        this.draft.media.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = 'cf-media-thumb';
            el.innerHTML = item.type === 'video'
                ? `<video src="${item.url}" class="cf-media-preview"></video>
                   <span class="cf-media-badge">Video · 5pts</span>`
                : `<img src="${item.url}" class="cf-media-preview" />
                   <span class="cf-media-badge cf-media-badge-img">1pt</span>`;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'cf-media-remove';
            removeBtn.textContent = '✕';
            removeBtn.addEventListener('click', () => {
                this.draft.media.splice(i, 1);
                this._renderMediaGrid();
            });

            el.appendChild(removeBtn);
            grid.appendChild(el);
        });
    }

    // ── Step 4: Generate comparison splat (mocked) ───────────────────

    _renderStep4() {
        const objects = this.getObjects();
        const obj = objects.find(o => o.id === this.draft.objectId);
        const policy = PolicyMeta[this.draft.policyType];

        this.modal.innerHTML = `
            <div class="cf-header">
                <div class="cf-step-label">Step 4 of 4</div>
                <div class="cf-title">Generate damage reconstruction</div>
                <button class="cf-close" id="cf-close">✕</button>
            </div>
            <div class="cf-body cf-body-center">
                <div class="claim-summary">
                    <div class="claim-summary-row">
                        <span class="claim-summary-key">Object</span>
                        <span class="claim-summary-val">${obj.title}</span>
                    </div>
                    <div class="claim-summary-row">
                        <span class="claim-summary-key">Damage type</span>
                        <span class="claim-summary-val">${policy.icon} ${policy.label}</span>
                    </div>
                    <div class="claim-summary-row">
                        <span class="claim-summary-key">Media uploaded</span>
                        <span class="claim-summary-val">${this.draft.media.length} file${this.draft.media.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="cf-gen-idle" id="cf-gen-idle">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                    <span class="cf-gen-label">Generate damage reconstruction</span>
                    <span class="cf-gen-sub">
                        The new scan will be compared with the original to assess the damage
                    </span>
                    <button class="cf-btn-primary" id="cf-gen-start">Start processing</button>
                </div>
                <div class="cf-gen-loading" id="cf-gen-loading" style="display:none;">
                    <div class="cf-gen-spinner"></div>
                    <span class="cf-gen-label" id="cf-gen-status">Uploading media...</span>
                    <span class="cf-gen-sub">This may take a few minutes</span>
                </div>
                <div class="cf-gen-done" id="cf-gen-done" style="display:none;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #3a7d44;">
                        <circle cx="12" cy="12" r="9"/>
                        <polyline points="9 12 11 14 15 10"/>
                    </svg>
                    <span class="cf-gen-label">Claim submitted successfully</span>
                    <span class="cf-gen-sub">Your claim is now pending review</span>
                </div>
            </div>
            <div class="cf-footer" id="cf-footer4">
                <button class="cf-btn-secondary" id="cf-back4">Back</button>
            </div>
        `;

        this.modal.querySelector('#cf-close').addEventListener('click', () => this.close());
        this.modal.querySelector('#cf-back4').addEventListener('click', () => this._goToStep(3));
        this.modal.querySelector('#cf-gen-start').addEventListener('click', () => {
            this._mockGenerate(obj);
        });
    }

    async _mockGenerate(obj) {
        const idle = this.modal.querySelector('#cf-gen-idle');
        const loading = this.modal.querySelector('#cf-gen-loading');
        const done = this.modal.querySelector('#cf-gen-done');
        const status = this.modal.querySelector('#cf-gen-status');
        const footer = this.modal.querySelector('#cf-footer4');

        idle.style.display = 'none';
        loading.style.display = 'flex';
        footer.innerHTML = '';

        const steps = [
            { label: 'Uploading damage media...', duration: 1200 },
            { label: 'Processing frames...', duration: 1500 },
            { label: 'Training damage Gaussian model...', duration: 2000 },
            { label: 'Comparing with original scan...', duration: 1200 },
            { label: 'Finalising claim...', duration: 800 },
        ];

        for (const step of steps) {
            status.textContent = step.label;
            await new Promise(r => setTimeout(r, step.duration));
        }

        this.draft.damageSplatURL =
            'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat';

        loading.style.display = 'none';
        done.style.display = 'flex';

        const claim = new Claim({
            id: crypto.randomUUID(),
            objectId: this.draft.objectId,
            policyType: this.draft.policyType,
            media: this.draft.media,
            damageSplatURL: this.draft.damageSplatURL,
            creationTime: new Date(),
            status: ClaimStatus.PENDING,
        });

        footer.innerHTML = `
            <button class="cf-btn-primary" id="cf-finish">Close</button>
        `;

        footer.querySelector('#cf-finish').addEventListener('click', () => {
            this.onComplete(claim);
            this.close();
        });
    }
}