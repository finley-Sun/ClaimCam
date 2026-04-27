import { initXR, initGaussian } from './index.js';
import { VisibilityState } from '@iwsdk/core';
import { ArchiveList } from './archiveList.js';
import { mockObjects } from './mockData.js';
import { CreationFlow } from './Flows/creationFlow.js';
import { ClaimFlow } from './Flows/claimFlow.js';
import { PolicyMeta, ClaimStatusMeta } from './insuredObject.js';

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


// ── Disclaimer ──
const disclaimerOverlay = document.getElementById('disclaimer-overlay');
const disclaimerBtn = document.getElementById('disclaimer-btn');

disclaimerBtn.addEventListener('click', () => {
    disclaimerOverlay.style.display = 'none';
});

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

    const creationFlow = new CreationFlow({
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

    const claimFlow = new ClaimFlow({
        getObjects: () => objects,
        onComplete: (claim) => {
            const obj = objects.find(o => o.id === claim.objectId);
            if (obj) {
                obj.claims.push(claim);
            }
            console.log('[ClaimFlow] claim submitted:', claim);
        },
    });

    const addBtn = document.getElementById('cc-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            creationFlow.open();
        });
    }

    const claimBtn = document.getElementById('cc-claim-btn');
    if (claimBtn) {
        claimBtn.addEventListener('click', () => {
            claimFlow.open();
        });
    }
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

    updateInfoCard(obj);

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
        gsViewer.destroyForXR();
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

// ── Stage Info Card ──
function updateInfoCard(obj) {
    const card = document.getElementById('stage-info-card');
    const titleEl = document.getElementById('stage-info-title');
    const metaEl = document.getElementById('stage-info-meta');
    const policiesEl = document.getElementById('stage-info-policies');
    const claimsEl = document.getElementById('stage-info-claims');
    const claimsListEl = document.getElementById('stage-info-claims-list');

    if (!obj) {
        card.style.display = 'none';
        return;
    }

    titleEl.textContent = obj.title;
    metaEl.textContent = `${obj.type === 'building' ? 'Building' : 'Household'} · insured ${obj.formattedDate}`;

    policiesEl.innerHTML = obj.policies.map(key => {
    const meta = PolicyMeta[key];
    return `
    <span class="stage-info-policy-chip" style="
    background: ${meta.color};
    border-color: ${meta.border};
    color: var(--text-secondary);
    ">
    ${meta.icon} ${meta.label}
    </span>
    `;
    }).join('');

    if (obj.claims && obj.claims.length > 0) {
    // Sort by most recent first
    const sorted = [...obj.claims].sort((a, b) =>
    new Date(b.creationTime) - new Date(a.creationTime)
    );

    claimsListEl.innerHTML = sorted.map(claim => {
    const policyMeta = PolicyMeta[claim.policyType];
    const statusMeta = ClaimStatusMeta[claim.status];
    return `
    <div class="stage-info-claim-item">
    <div class="stage-info-claim-row">
    <span class="stage-info-claim-type">
    ${policyMeta.icon} ${policyMeta.label}
    </span>
    <span class="stage-info-claim-status" style="
    background: ${statusMeta.color};
    border-color: ${statusMeta.border};
    color: ${statusMeta.text};
    ">
    ${statusMeta.label}
    </span>
    </div>
    <div class="stage-info-claim-date">${claim.formattedDate}</div>
    </div>
    `;
    }).join('');

    claimsEl.style.display = 'flex';
    } else {
    claimsEl.style.display = 'none';
    }

    card.style.display = 'flex';
}

export { loadScan };

