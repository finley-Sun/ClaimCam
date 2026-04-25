import { initXR, initGaussian } from './index.js';
import { VisibilityState } from '@iwsdk/core';

let sceneLoaded = false;
let gsViewer = null;

// ── Scene area elements — declared first ──
const loadingOverlay = document.getElementById('loading-overlay');
const sceneContainer = document.getElementById('scene-container');
const seeReconBtn = document.getElementById('see-reconstruction-btn');
const xrBtn = document.getElementById('xr-toggle-btn');

xrBtn.style.display = 'none';
sceneContainer.style.display = 'none';

// ── Navigation ──
const views = {
    dashboard: document.getElementById('view-dashboard'),
    bills: document.getElementById('view-bills'),
    products: document.getElementById('view-products'),
    claims: document.getElementById('view-claims'),
};

function navigateTo(page) {
    Object.values(views).forEach(v => v.style.display = 'none');
    views[page].style.display = 'flex';
    document.querySelectorAll('[data-page]').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
    });
    if (page === 'dashboard' && !sceneLoaded) {
        sceneLoaded = true;
        gsViewer = initGaussian();
        bindGsViewer(gsViewer);
    }
}

document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

navigateTo('dashboard');

// ── Segmented Picker ──
document.querySelectorAll('.segment-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.segment-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
    });
});

// ── loadScan ──
function loadScan(scanId) {
    seeReconBtn.style.display = 'none';
    xrBtn.style.display = 'none';

    if (gsViewer) gsViewer.hide();

    loadingOverlay.classList.add('visible');

    setTimeout(() => {
        loadingOverlay.classList.remove('visible');
        seeReconBtn.style.display = 'flex';
        console.log('loadScan complete for:', scanId);
    }, 2000);
}

document.querySelectorAll('.scan-item').forEach(item => {
    item.addEventListener('click', () => {
        loadScan(item.dataset.scan);
    });
});

// ── Gaussian Splat bindings ──
function bindGsViewer(gsViewer) {
    seeReconBtn.addEventListener('click', async () => {
        seeReconBtn.style.display = 'none';
        await gsViewer.load(
            'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat'
        );
        xrBtn.style.display = 'block';
    });

    gsViewer.onClose(() => {
        gsViewer.hide();
        seeReconBtn.style.display = 'flex';
        xrBtn.style.display = 'none';
    });
}

// ── Splat Inspect ──
document.getElementById('scene-wrapper').addEventListener('splat:inspect', (e) => {
    console.log('Inspecting splat at:', e.detail);
});

// ── Start Claim ──
document.getElementById('start-claim-btn').addEventListener('click', () => {
    console.log('Start claim clicked');
});

// ── XR Toggle ──
xrBtn.addEventListener('click', async () => {
    xrBtn.textContent = 'Loading XR...';
    xrBtn.disabled = true;

    const world = await initXR();

    if (world) {
        world.visibilityState.subscribe((state) => {
            if (state === VisibilityState.NonImmersive) {
                xrBtn.textContent = 'Enter XR';
                xrBtn.disabled = false;
                sceneContainer.style.display = 'none';
                if (gsViewer) gsViewer.show();
            } else {
                xrBtn.textContent = 'Exit to Browser';
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