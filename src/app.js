import { initXR, initGaussian } from './index.js';
import { VisibilityState } from '@iwsdk/core';
import { ArchiveList } from './archiveList.js';
import { mockObjects } from './mockData.js';
import { CreationFlow } from './creationFlow.js';

let sceneLoaded = false;
let gsViewer = null;
let archiveList = null;
let currentSplatUrl = null;
const objects = [...mockObjects];

// ── Scene area elements — declared first ──
const loadingOverlay = document.getElementById('loading-overlay');
const sceneContainer = document.getElementById('scene-container');
const seeReconBtn = document.getElementById('see-reconstruction-btn');
const xrBtn = document.getElementById('xr-toggle-btn');
const stageEmpty = document.getElementById('stage-empty');

xrBtn.style.display = 'none';
sceneContainer.style.display = 'none';

// ── Navigation maps ──
const sidePanes = {
    dashboard: document.getElementById('pane-dashboard'),
    bills: document.getElementById('pane-bills'),
    products: document.getElementById('pane-products'),
    claims: document.getElementById('pane-claims'),
};

const mainViews = {
    dashboard: document.getElementById('view-dashboard'),
    bills: document.getElementById('view-bills'),
    products: document.getElementById('view-products'),
    claims: document.getElementById('view-claims'),
};

const sideMenu = document.getElementById('side-menu');

// ── Navigation ──
function navigateTo(page) {
    Object.values(sidePanes).forEach(v => v.style.display = 'none');
    Object.values(mainViews).forEach(v => v.style.display = 'none');

    sideMenu.style.display = page === 'dashboard' ? 'flex' : 'none';

    sidePanes[page].style.display = 'block';
    mainViews[page].style.display = 'flex';

    document.querySelectorAll('[data-page]').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
    });

    if (page === 'dashboard' && !sceneLoaded) {
        sceneLoaded = true;
        gsViewer = initGaussian();
        bindGsViewer(gsViewer);
        initArchive();
    }
}

document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

navigateTo('dashboard');

// ── Archive List ──
function initArchive() {
    archiveList = new ArchiveList({
        listEl: document.getElementById('cc-list'),
        searchEl: document.getElementById('cc-search'),
        segmentEl: document.getElementById('segment-picker'),
        onSelect: (obj) => loadScan(obj),
    });

    archiveList.setObjects(objects);

    const flow = new CreationFlow({
        onComplete: (obj, previous) => {
            if (previous) {
                const idx = objects.findIndex(o => o.id === previous.id);
                if (idx !== -1) objects[idx] = obj;
            } else {
                objects.push(obj);
            }
            archiveList.setObjects(objects);
        },
        onRemove: (obj) => {
            const idx = objects.findIndex(o => o.id === obj.id);
            if (idx !== -1) objects.splice(idx, 1);
            archiveList.setObjects(objects);
        },
    });

    document.getElementById('cc-add-btn').addEventListener('click', () => {
        flow.open();
    });
}

// ── loadScan ──
function loadScan(obj) {
    seeReconBtn.style.display = 'none';
    xrBtn.style.display = 'none';
    stageEmpty.style.display = 'none';

    currentSplatUrl = obj.splatURL || null;

    if (gsViewer) gsViewer.hide();

    seeReconBtn.style.display = 'flex';
    seeReconBtn.dataset.splatUrl = obj.splatURL || '';

    console.log('Scan selected:', obj.id);
}

// ── Gaussian Splat bindings ──
function bindGsViewer(gsViewer) {
    seeReconBtn.addEventListener('click', async () => {
        const url = seeReconBtn.dataset.splatUrl ||
            'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat';

        seeReconBtn.style.display = 'none';
        loadingOverlay.classList.add('visible');

        await gsViewer.load(url);

        loadingOverlay.classList.remove('visible');
        xrBtn.style.display = 'flex';
        xrBtn.disabled = false;
    });

    gsViewer.onClose(() => {
        gsViewer.hide();
        stageEmpty.style.display = 'none';
        seeReconBtn.style.display = 'flex';
        xrBtn.style.display = 'none';
        xrBtn.disabled = false;
    });
}

// ── Splat Inspect ──
document.getElementById('view-dashboard').addEventListener('splat:inspect', (e) => {
    console.log('Inspecting splat at:', e.detail);
});

// ── Start Claim ──
document.getElementById('start-claim-btn') &&
    document.getElementById('start-claim-btn').addEventListener('click', () => {
        console.log('Start claim clicked');
    });

// ── XR Toggle ──
xrBtn.addEventListener('click', async () => {
    xrBtn.textContent = 'Loading XR...';
    xrBtn.disabled = true;

    if (gsViewer) {
        gsViewer.setXRActive(true);
        gsViewer.hide();
    }

    const world = await initXR(currentSplatUrl);

    if (world) {
        world.visibilityState.subscribe((state) => {
            if (state === VisibilityState.NonImmersive) {
                xrBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <rect x="2" y="7" width="20" height="11" rx="3"/>
                        <circle cx="8" cy="13" r="1.5"/>
                        <circle cx="16" cy="13" r="1.5"/>
                    </svg>
                    Enter XR
                `;
                xrBtn.disabled = false;
                sceneContainer.style.display = 'none';
                if (gsViewer) gsViewer.show();
            } else {
                xrBtn.innerHTML = 'Exit to Browser';
                xrBtn.disabled = false;
                if (gsViewer) gsViewer.hide();
            }
        });
    }
});

// ── Profile Dropdown ──
const profileBtn = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');

profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('open');
});

document.addEventListener('click', () => {
    profileDropdown.classList.remove('open');
});

document.getElementById('logout-btn').addEventListener('click', () => {
    console.log('Logout clicked');
});

export { loadScan };