import { initXR, initGaussian } from './index.js';
import { VisibilityState } from '@iwsdk/core';
import { ArchiveList } from './archiveList.js';
import { mockObjects } from './mockData.js';
import { CreationFlow } from './Flows/creationFlow.js';
import { ClaimFlow } from './Flows/claimFlow.js';
import { PolicyMeta, ClaimStatusMeta } from './insuredObject.js';

// ── State ──
let sceneLoaded = false;
let gsViewer = null;
let archiveList = null;
let currentObj = null;
let currentSplatUrl = null;
const objects = [...mockObjects];

// ── Elements ──
const loadingOverlay = document.getElementById('loading-overlay');
const sceneContainer = document.getElementById('scene-container');
const seeReconBtn = document.getElementById('see-reconstruction-btn');
const xrBtn = document.getElementById('xr-toggle-btn');
const stageEmpty = document.getElementById('stage-empty');
const closeBtn = document.getElementById('splat-close-btn');
const infoBtn = document.getElementById('splat-info-btn');
const infoPanel = document.getElementById('splat-info-panel');
const infoMinimize = document.getElementById('splat-info-minimize');
const splatSelectorBar = document.getElementById('splat-selector-bar');
const splatSelectorSelect = document.getElementById('splat-selector-select');

// ── Info button toggle ──
infoBtn.addEventListener('click', () => {
    const isHidden = infoPanel.style.display === 'none';
    infoPanel.style.display = isHidden ? 'block' : 'none';
});

infoMinimize.addEventListener('click', () => {
    infoPanel.style.display = 'none';
});

// ── Close button ──
closeBtn.addEventListener('click', () => {
  if (gsViewer) {
    gsViewer.dispose();
    gsViewer = null;
    // Re-init so it is ready for the next load
    gsViewer = initGaussian();
    bindGsViewer();
  }
  closeBtn.style.display = 'none';
  infoBtn.style.display = 'none';
  infoPanel.style.display = 'none';
  xrBtn.style.display = 'none';
  splatSelectorBar.style.display = 'none';
  seeReconBtn.style.display = currentObj && currentObj.splatURL ? 'flex' : 'none';
  stageEmpty.style.display = currentObj ? 'none' : 'flex';
  updateInfoCard(currentObj, false);
});

// ── Splat selector ––
splatSelectorSelect.addEventListener('change', async () => {
    const url = splatSelectorSelect.value;
    if (!url) return;
    currentSplatUrl = url;
    loadingOverlay.classList.add('visible');
    try {
        await gsViewer.load(url);
    } catch (e) {
        showErrorToast(
            'Reconstruction unavailable',
            'WebGL context could not be created. Close other tabs or reload the page, if it still doesn\'t work restart the browser.'
        );
    }
    loadingOverlay.classList.remove('visible');
});

// ── Initial state ──
xrBtn.style.display = 'none';
sceneContainer.style.display = 'none';

// ── Navigation ──
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

function navigateTo(page) {
  Object.values(sidePanes).forEach(v => v.style.display = 'none');
  Object.values(mainViews).forEach(v => v.style.display = 'none');

  // Destroy viewer when leaving dashboard
  if (page !== 'dashboard') {
    _teardownViewer();
  }

  sideMenu.style.display = page === 'dashboard' ? 'flex' : 'none';
  sidePanes[page].style.display = 'block';
  mainViews[page].style.display = 'flex';

  document.querySelectorAll('[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  if (page === 'dashboard' && !sceneLoaded) {
    sceneLoaded = true;
    gsViewer = initGaussian();
    bindGsViewer();
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

// ── Archive ──
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
                archiveList.setObjects(objects);
                if (currentObj && currentObj.id === obj.id) {
                    _rebuildSelector(obj);
                    updateInfoCard(obj, gsViewer && gsViewer.wrapper.style.display !== 'none');
                }
            }
        },
    });

    const addBtn = document.getElementById('cc-add-btn');
    if (addBtn) addBtn.addEventListener('click', () => creationFlow.open());

    const claimBtn = document.getElementById('cc-claim-btn');
    if (claimBtn) claimBtn.addEventListener('click', () => claimFlow.open());
}

// ── loadScan ──
function loadScan(obj) {
    currentObj = obj;

    gsViewer.hide();
    closeBtn.style.display = 'none';
    infoBtn.style.display = 'none';
    infoPanel.style.display = 'none';
    xrBtn.style.display = 'none';
    splatSelectorBar.style.display = 'none';
    stageEmpty.style.display = 'none';

    if (obj.splatURL) {
        seeReconBtn.style.display = 'flex';
        seeReconBtn.dataset.splatUrl = obj.splatURL;
    } else {
        seeReconBtn.style.display = 'none';
        stageEmpty.style.display = 'flex';
    }

    updateInfoCard(obj, false);
}

// ── Build splat selector options ──
function _rebuildSelector(obj) {
    const iconMap = {
        fire: '🔥', water: '💧', theft: '🔒',
        natural_disaster: '⛈️', vandalism: '🪣', electrical: '⚡',
    };

    const options = [];

    if (obj.splatURL) {
        options.push({ label: 'Original', url: obj.splatURL });
    }

    if (obj.claims && obj.claims.length > 0) {
        obj.claims
        .slice()
        .sort((a, b) => new Date(a.creationTime) - new Date(b.creationTime))
        .forEach((claim, i) => {
            if (claim.damageSplatURL) {
                const icon = iconMap[claim.policyType] || '';
                options.push({
                    label: `${icon} Damage ${i + 1} · ${claim.formattedDate}`,
                    url: claim.damageSplatURL,
                });
            }
        });
    }

    splatSelectorSelect.innerHTML = options.map(o =>
        `<option value="${o.url}">${o.label}</option>`
    ).join('');

    // Track the currently visible splat
    currentSplatUrl = options.length > 0 ? options[0].url : null;

    splatSelectorBar.style.display = options.length > 1 ? 'flex' : 'none';
}

// ── bindGsViewer ──
function bindGsViewer() {
 seeReconBtn.addEventListener('click', async () => {
 seeReconBtn.style.display = 'none';
 loadingOverlay.classList.add('visible');

 try {
 await gsViewer.load(currentObj.splatURL);
 loadingOverlay.classList.remove('visible');
 closeBtn.style.display = 'block';
 infoBtn.style.display = 'flex';
 xrBtn.style.display = 'flex';
 xrBtn.disabled = false;
 _rebuildSelector(currentObj);
 updateInfoCard(currentObj, true);
 } catch (e) {
 loadingOverlay.classList.remove('visible');
 seeReconBtn.style.display = 'flex';
 showErrorToast(
 'Reconstruction unavailable',
 'WebGL context could not be created. Too many renderers are open — close other tabs or reload the page.'
 );
 }
 });
}

// ── updateInfoCard ──
function updateInfoCard(obj, viewerIsOpen = false) {
    const card = document.getElementById('stage-info-card');
    const titleEl = document.getElementById('stage-info-title');
    const metaEl = document.getElementById('stage-info-meta');
    const policiesEl = document.getElementById('stage-info-policies');
    const claimsEl = document.getElementById('stage-info-claims');
    const claimsListEl = document.getElementById('stage-info-claims-list');

    if (!card || !obj) {
        if (card) card.style.display = 'none';
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

    // ── Valuation section ──
    let valuationEl = document.getElementById('stage-info-valuation');
    if (!valuationEl) {
        valuationEl = document.createElement('div');
        valuationEl.id = 'stage-info-valuation';
        valuationEl.className = 'stage-info-valuation';
        policiesEl.parentNode.insertBefore(valuationEl, policiesEl.nextSibling);
    }

    if (obj.receipt || obj.objectValue) {
        let rows = '';

        if (obj.receipt) {
            rows = `
                <div class="stage-info-val-row">
                    <span class="stage-info-val-label">Receipt</span>
                    <span class="stage-info-val-value">
                        ${obj.receipt.name || 'Attached'}
                    </span>
                </div>
            `;
        } else {
            const formatted = Number(obj.objectValue).toLocaleString('en-GB', {
                style: 'currency',
                currency: 'EUR',
            });
            rows = `
                <div class="stage-info-val-row">
                    <span class="stage-info-val-label">Value</span>
                    <span class="stage-info-val-value">${formatted}</span>
                </div>
                ${obj.purchaseYear ? `
                <div class="stage-info-val-row">
                    <span class="stage-info-val-label">Purchased</span>
                    <span class="stage-info-val-value">${obj.purchaseYear}</span>
                </div>
                ` : ''}
            `;
        }

        valuationEl.innerHTML = rows;
        valuationEl.style.display = 'flex';
    } else {
        valuationEl.innerHTML = '';
        valuationEl.style.display = 'none';
    }

    if (obj.claims && obj.claims.length > 0) {
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

    // Collapse toggle — clone to avoid duplicate listeners
    const toggle = document.getElementById('stage-info-toggle');
    const body = document.getElementById('stage-info-body');

    const fresh = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(fresh, toggle);

    fresh.addEventListener('click', () => {
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'flex';
        const icon = fresh.querySelector('.stage-info-toggle-icon');
        icon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });
}

// ── XR Toggle ──
xrBtn.addEventListener('click', async () => {
    xrBtn.textContent = 'Loading XR...';
    xrBtn.disabled = true;

    if (gsViewer) {
        gsViewer.setXRActive(true);
        gsViewer.destroyForXR();
    }

    closeBtn.style.display = 'none';
    infoBtn.style.display = 'none';
    infoPanel.style.display = 'none';
    splatSelectorBar.style.display = 'none';

    // Use currentSplatUrl — respects the dropdown selection
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
                if (currentSplatUrl) {
                    gsViewer.load(currentSplatUrl).then(() => {
                        closeBtn.style.display = 'block';
                        infoBtn.style.display = 'flex';
                        _rebuildSelector(currentObj);
                        updateInfoCard(currentObj, true);
                    });
                }
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

// ── Disclaimer ──
document.addEventListener('DOMContentLoaded', () => {
    const disclaimerOverlay = document.getElementById('disclaimer-overlay');
    const disclaimerBtn = document.getElementById('disclaimer-btn');
    if (disclaimerOverlay && disclaimerBtn) {
        disclaimerBtn.addEventListener('click', () => {
            disclaimerOverlay.style.display = 'none';
        });
    }
});

// ── Error Toast ––
function showErrorToast(title, message) {
  const existing = document.getElementById('error-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'error-toast';
  toast.className = 'error-toast';
  toast.innerHTML = `
    <div class="error-toast-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
      </svg>
    </div>
    <div class="error-toast-body">
      <div class="error-toast-title">${title}</div>
      <div class="error-toast-msg">${message}</div>
    </div>
    <button class="error-toast-close" id="error-toast-close">✕</button>
  `;

  document.body.appendChild(toast);

  toast.querySelector('#error-toast-close').addEventListener('click', () => {
    toast.classList.add('error-toast-hide');
    setTimeout(() => toast.remove(), 300);
  });

  // Auto-dismiss after 6 seconds
  setTimeout(() => {
    if (document.getElementById('error-toast')) {
      toast.classList.add('error-toast-hide');
      setTimeout(() => toast.remove(), 300);
    }
  }, 6000);
}

function _teardownViewer() {
  if (gsViewer) {
    gsViewer.dispose();
    gsViewer = null;
    sceneLoaded = false;
  }
  closeBtn.style.display = 'none';
  infoBtn.style.display = 'none';
  infoPanel.style.display = 'none';
  xrBtn.style.display = 'none';
  splatSelectorBar.style.display = 'none';
}

export { loadScan };