					
import { InsuredObject, ObjectType } from './insuredObject.js';

/**
 * CreationFlow
 * Manages the modal-based creation flow for a new InsuredObject.
 * Steps:
 *   1. Basic info (title, type)
 *   2. Media upload (images / videos)
 *   3. Splat generation (mocked)
 * Calls onComplete(insuredObject) when done.
 */
export class CreationFlow {


 constructor({ onComplete }) {
 this.onComplete = onComplete;
 this.draft = {
 title: '',
 type: ObjectType.BUILDING,
 media: [],
 splatURL: null,
 };

 this._buildModal();
 this._bindClose();
 }

 open() {
 this._reset();
 this._goToStep(1);
 this.overlay.style.display = 'flex';
 }

 close() {
 this.overlay.style.display = 'none';
 }

 // ── Modal shell ──────────────────────────────────────────────────

 _buildModal() {
 this.overlay = document.createElement('div');
 this.overlay.className = 'cf-overlay';
 this.overlay.style.display = 'none';

 this.modal = document.createElement('div');
 this.modal.className = 'cf-modal';

 this.overlay.appendChild(this.modal);
 document.body.appendChild(this.overlay);

 // Close on backdrop click
 this.overlay.addEventListener('click', (e) => {
 if (e.target === this.overlay) this.close();
 });
 }

 _bindClose() {}

 // ── Step router ──────────────────────────────────────────────────

 _goToStep(step) {
 this.currentStep = step;
 this.modal.innerHTML = '';

 if (step === 1) this._renderStep1();
 if (step === 2) this._renderStep2();
 if (step === 3) this._renderStep3();
 }

 _reset() {
 this.draft = {
 title: '',
 type: ObjectType.BUILDING,
 media: [],
 splatURL: null,
 };
 }

 // ── Step 1: Basic info ───────────────────────────────────────────

 _renderStep1() {
 this.modal.innerHTML = `
 <div class="cf-header">
 <div class="cf-step-label">Step 1 of 3</div>
 <div class="cf-title">New insured object</div>
 <button class="cf-close" id="cf-close">✕</button>
 </div>
 <div class="cf-body">
 <div class="cf-field">
 <label class="cf-label">Object name</label>
 <input
 class="cf-input"
 id="cf-title"
 type="text"
 placeholder="e.g. Living room, TV, Bonsai..."
 value="${this.draft.title}"
 />
 </div>
 <div class="cf-field">
 <label class="cf-label">Category</label>
 <div class="cf-segment" id="cf-type">
 <div class="cf-seg-opt ${this.draft.type === ObjectType.BUILDING ? 'active' : ''}"
 data-type="${ObjectType.BUILDING}">
 Building
 </div>
 <div class="cf-seg-opt ${this.draft.type === ObjectType.HOUSEHOLD ? 'active' : ''}"
 data-type="${ObjectType.HOUSEHOLD}">
 Household
 </div>
 </div>
 </div>
 </div>
 <div class="cf-footer">
 <button class="cf-btn-secondary" id="cf-cancel">Cancel</button>
 <button class="cf-btn-primary" id="cf-next1">Continue</button>
 </div>
 `;

 this.modal.querySelector('#cf-close').addEventListener('click', () => this.close());
 this.modal.querySelector('#cf-cancel').addEventListener('click', () => this.close());

 this.modal.querySelector('#cf-title').addEventListener('input', (e) => {
 this.draft.title = e.target.value.trim();
 });

 this.modal.querySelectorAll('.cf-seg-opt').forEach(opt => {
 opt.addEventListener('click', () => {
 this.modal.querySelectorAll('.cf-seg-opt').forEach(o => o.classList.remove('active'));
 opt.classList.add('active');
 this.draft.type = opt.dataset.type;
 });
 });

 this.modal.querySelector('#cf-next1').addEventListener('click', () => {
 if (!this.draft.title) {
 this.modal.querySelector('#cf-title').focus();
 return;
 }
 this._goToStep(2);
 });
 }

 // ── Step 2: Media upload ─────────────────────────────────────────

 _renderStep2() {
 this.modal.innerHTML = `
 <div class="cf-header">
 <div class="cf-step-label">Step 2 of 3</div>
 <div class="cf-title">Add media</div>
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
 <span class="cf-upload-sub">Images and videos supported</span>
 <input type="file" id="cf-file-input" multiple accept="image/*,video/*" style="display:none;" />
 </div>
 <div class="cf-media-grid" id="cf-media-grid"></div>
 </div>
 <div class="cf-footer">
 <button class="cf-btn-secondary" id="cf-back2">Back</button>
 <button class="cf-btn-primary" id="cf-next2">Continue</button>
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

 this.modal.querySelector('#cf-back2').addEventListener('click', () => this._goToStep(1));
 this.modal.querySelector('#cf-next2').addEventListener('click', () => this._goToStep(3));

 this._renderMediaGrid();
 }

 _addFiles(files) {
 files.forEach(file => {
 const url = URL.createObjectURL(file);
 this.draft.media.push({ file, url, type: file.type.startsWith('video') ? 'video' : 'image' });
 });
 this._renderMediaGrid();
 }

 _renderMediaGrid() {
 const grid = this.modal.querySelector('#cf-media-grid');
 if (!grid) return;
 grid.innerHTML = '';

 this.draft.media.forEach((item, i) => {
 const el = document.createElement('div');
 el.className = 'cf-media-thumb';
 el.innerHTML = item.type === 'video'
 ? `<video src="${item.url}" class="cf-media-preview"></video>
 <span class="cf-media-badge">Video</span>`
 : `<img src="${item.url}" class="cf-media-preview" />`;

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

 // ── Step 3: Splat generation (mocked) ───────────────────────────

 _renderStep3() {
 this.modal.innerHTML = `
 <div class="cf-header">
 <div class="cf-step-label">Step 3 of 3</div>
 <div class="cf-title">Generate reconstruction</div>
 <button class="cf-close" id="cf-close">✕</button>
 </div>
 <div class="cf-body cf-body-center">
 <div class="cf-gen-idle" id="cf-gen-idle">
 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
 <polygon points="23 7 16 12 23 17 23 7"/>
 <rect x="1" y="5" width="15" height="14" rx="2"/>
 </svg>
 <span class="cf-gen-label">Ready to generate your 3D reconstruction</span>
 <span class="cf-gen-sub">
 ${this.draft.media.length} media file${this.draft.media.length !== 1 ? 's' : ''} uploaded
 </span>
 <button class="cf-btn-primary cf-gen-start" id="cf-gen-start">
 Generate splat
 </button>
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
 <span class="cf-gen-label">Reconstruction ready</span>
 <span class="cf-gen-sub">${this.draft.title}</span>
 </div>
 </div>
 <div class="cf-footer" id="cf-footer3">
 <button class="cf-btn-secondary" id="cf-back3">Back</button>
 </div>
 `;

 this.modal.querySelector('#cf-close').addEventListener('click', () => this.close());
 this.modal.querySelector('#cf-back3').addEventListener('click', () => this._goToStep(2));

 this.modal.querySelector('#cf-gen-start').addEventListener('click', () => {
 this._mockGenerate();
 });
 }

 async _mockGenerate() {
 const idle = this.modal.querySelector('#cf-gen-idle');
 const loading = this.modal.querySelector('#cf-gen-loading');
 const done = this.modal.querySelector('#cf-gen-done');
 const status = this.modal.querySelector('#cf-gen-status');
 const footer = this.modal.querySelector('#cf-footer3');

 idle.style.display = 'none';
 loading.style.display = 'flex';
 footer.innerHTML = '';

 const steps = [
 { label: 'Uploading media...', duration: 1200 },
 { label: 'Processing frames...', duration: 1500 },
 { label: 'Training Gaussian model...', duration: 2000 },
 { label: 'Finalising splat...', duration: 1000 },
 ];

 for (const step of steps) {
 status.textContent = step.label;
 await new Promise(r => setTimeout(r, step.duration));
 }

 loading.style.display = 'none';
 done.style.display = 'flex';

 // Use bonsai as mock splat URL
 this.draft.splatURL =
 'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat';

 footer.innerHTML = `
 <button class="cf-btn-primary" id="cf-finish">Add to archive</button>
 `;

 footer.querySelector('#cf-finish').addEventListener('click', () => {
 const obj = new InsuredObject({
 id: crypto.randomUUID(),
 title: this.draft.title,
 image: this.draft.media[0]?.url || null,
 type: this.draft.type,
 splatURL: this.draft.splatURL,
 creationTime: new Date(),
 media: this.draft.media,
 });

 this.onComplete(obj);
 this.close();
 });
 }
}