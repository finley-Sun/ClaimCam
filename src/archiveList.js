import { ObjectType } from './insuredObject.js';

/**
 * Manages rendering and filtering of the insured objects list.
 * Calls onSelect(insuredObject) when an item is clicked.
 */
export class ArchiveList {

    constructor({ listEl, searchEl, segmentEl, onSelect }) {
        this.listEl = listEl;
        this.searchEl = searchEl;
        this.segmentEl = segmentEl;
        this.onSelect = onSelect;

        this.objects = [];
        this.activeType = ObjectType.BUILDING;
        this.searchQuery = '';
        this.selectedId = null;

        this._bindSearch();
        this._bindSegment();
    }

    setObjects(objects) {
        this.objects = objects;
        this.render();
    }

    _bindSearch() {
        this.searchEl.addEventListener('input', () => {
            this.searchQuery = this.searchEl.value.trim().toLowerCase();
            this.render();
        });
    }

    _bindSegment() {
        this.segmentEl.querySelectorAll('.segment-option').forEach(opt => {
            opt.addEventListener('click', () => {
                this.segmentEl.querySelectorAll('.segment-option').forEach(o => {
                    o.classList.remove('active');
                });
                opt.classList.add('active');
                this.activeType = opt.dataset.segment;
                this.render();
            });
        });
    }

    _filtered() {
        return this.objects.filter(obj => {
            const matchesType = obj.type === this.activeType;
            const matchesSearch = obj.title.toLowerCase().includes(this.searchQuery);
            return matchesType && matchesSearch;
        });
    }

    render() {
        const items = this._filtered();
        this.listEl.innerHTML = '';

        if (items.length === 0) {
            this.listEl.innerHTML = `
                <div style="
                    padding: 24px 8px;
                    text-align: center;
                    font-size: 12px;
                    color: var(--text-tertiary);
                ">
                    No items found
                </div>
            `;
            return;
        }

        items.forEach(obj => {
            const el = document.createElement('div');
            el.className = 'cc-item' + (obj.id === this.selectedId ? ' selected' : '');
            el.dataset.id = obj.id;
            el.innerHTML = `
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
                        ${obj.formattedDate}
                    </div>
                </div>
            `;

            el.addEventListener('click', () => {
                this.selectedId = obj.id;
                this.render();
                this.onSelect(obj);
            });

            this.listEl.appendChild(el);
        });
    }
}