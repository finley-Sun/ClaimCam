// owner.js
// Manages the owner dashboard: object selection, claim dropdowns, Gaussian splat viewer,
// XR entry, archive list, creation/claim flows, and UI state for the insurance owner view.

'use strict';

import { initXR, initGaussian } from './index.js';
import { VisibilityState } from '@iwsdk/core';
import { ArchiveList } from './archiveList.js';
import { mockObjects } from './mockData.js';
import { CreationFlow } from './Flows/creationFlow.js';
import { ClaimFlow } from './Flows/claimFlow.js';
import { PolicyMeta, ClaimStatusMeta, ObjectType } from './insuredObject.js';

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let gsViewer = null;
let archiveList = null;
let currentObj = null;
let currentSplatUrl = null;
let creationFlow = null;
let claimFlow = null;
let activeTab = ObjectType.HOUSEHOLD;

const objects = [...mockObjects];

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', init);

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------

function init() {
    gsViewer = initGaussian('stage-renderer');
    initSidebar();
    initDropdowns();
    initArchive();
    initStageButtons();
    refreshObjDropdown();
}

// ---------------------------------------------------------------------------
// initSidebar
// ---------------------------------------------------------------------------

function initSidebar() {
    const btnProperty = document.getElementById('btn-property');
    const btnClaims   = document.getElementById('btn-claims');
    const btnContact  = document.getElementById('btn-contact');
    const switchBtn   = document.getElementById('archive-switch-btn');

    btnProperty.addEventListener('click', () => {
        btnProperty.classList.add('active');
        btnClaims.classList.remove('active');
    });

    btnClaims.addEventListener('click', () => {
        btnClaims.classList.add('active');
        btnProperty.classList.remove('active');
    });

    btnContact.addEventListener('click', () => {
        console.log('contact');
    });

    switchBtn.addEventListener('click', () => {
        window.location.href = 'landing.html';
    });
}

// ---------------------------------------------------------------------------
// initDropdowns
// ---------------------------------------------------------------------------

function initDropdowns() {
    const objPill      = document.getElementById('obj-pill');
    const objMenu      = document.getElementById('obj-menu');
    const claimPill    = document.getElementById('claim-pill');
    const claimMenu    = document.getElementById('claim-menu');
    const archiveToggle = document.getElementById('archive-toggle-btn');

    // Object pill toggles its own menu
    objPill.addEventListener('click', (e) => {
        objMenu.classList.toggle('open');
        objPill.classList.toggle('open');
        e.stopPropagation();
    });

    // Claim pill toggles its own menu
    claimPill.addEventListener('click', (e) => {
        claimMenu.classList.toggle('open');
        claimPill.classList.toggle('open');
        e.stopPropagation();
    });

    // Clicking anywhere else closes all dropdowns
    document.addEventListener('click', () => {
        objMenu.classList.remove('open');
        objPill.classList.remove('open');
        claimMenu.classList.remove('open');
        claimPill.classList.remove('open');
    });

    // Toggle archive panel open/closed
    archiveToggle.addEventListener('click', () => {
        document.getElementById('owner-root').classList.toggle('archive-open');
        archiveToggle.classList.toggle('active');
    });

    // "Add object" button inside obj dropdown
    document.getElementById('obj-add-btn').addEventListener('click', () => {
        closeDropdowns();
        creationFlow.open();
    });

    // "Add claim" button inside claim dropdown
    document.getElementById('claim-add-btn').addEventListener('click', () => {
        closeDropdowns();
        claimFlow.open();
    });
}

/**
 * Closes all dropdown menus by removing the 'open' class from every pill and menu.
 */
function closeDropdowns() {
    const ids = ['obj-menu', 'obj-pill', 'claim-menu', 'claim-pill'];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('open');
    });
}

// ---------------------------------------------------------------------------
// refreshObjDropdown
// ---------------------------------------------------------------------------

function refreshObjDropdown() {
    const list = document.getElementById('obj-list');
    list.innerHTML = '';

    // Inline SVG cube icon used for each object entry
    const svgCube =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13">' +
        '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>' +
        '</svg>';

    objects.forEach((obj) => {
        const isSelected = currentObj && currentObj.id === obj.id;
        const li = document.createElement('li');
        li.className = 'dropdown-item' + (isSelected ? ' selected' : '');
        li.innerHTML = svgCube + '<span>' + obj.title + '</span>';

        li.addEventListener('click', () => {
            document.getElementById('obj-menu').classList.remove('open');
            document.getElementById('obj-pill').classList.remove('open');
            selectObject(obj);
        });

        list.appendChild(li);
    });
}

// ---------------------------------------------------------------------------
// selectObject
// ---------------------------------------------------------------------------

function selectObject(obj) {
    currentObj = obj;
    gsViewer.hide(); // ← was gsViewer.pause()
    document.getElementById('stage-empty').style.display = 'flex';
    document.getElementById('stage-label').classList.remove('visible');
    document.getElementById('xr-btn').classList.remove('visible');
    document.getElementById('obj-pill-label').textContent = obj.title;
    document.getElementById('obj-menu').classList.remove('open');
    document.getElementById('obj-pill').classList.remove('open');
    populateClaimDropdown(obj);
    document.getElementById('stage-label').textContent = obj.title.toUpperCase();
}
// ---------------------------------------------------------------------------
// populateClaimDropdown
// ---------------------------------------------------------------------------

function populateClaimDropdown(obj) {
    const list = document.getElementById('claim-list');
    list.innerHTML = '';

    // Maps policy type keys to display emoji icons
    const iconMap = {
        fire:             '🔥',
        water:            '💧',
        theft:            '🔒',
        natural_disaster: '⛈️',
        vandalism:        '🪣',
        electrical:       '⚡',
    };

    /**
     * Marks the given list item as selected and removes 'selected'
     * from all sibling items.
     */
    function setSelected(li) {
        list.querySelectorAll('.dropdown-item').forEach((el) => el.classList.remove('selected'));
        li.classList.add('selected');
    }

    // "Original" entry — always present; click handler is a no-op when there is no splat
    const originalLi = document.createElement('li');
    originalLi.className = 'dropdown-item';
    originalLi.innerHTML = '<span>Original</span>';

    originalLi.addEventListener('click', () => {
        setSelected(originalLi);
        document.getElementById('claim-pill-label').textContent = 'Original';
        document.getElementById('claim-menu').classList.remove('open');
        document.getElementById('claim-pill').classList.remove('open');
        if (obj.splatURL) {
            loadSplat(obj.splatURL);
        } else {
            document.getElementById('stage-empty').style.display = 'flex';
        }
    });

    list.appendChild(originalLi);

    // Damage entries sorted oldest → newest
    if (obj.claims && obj.claims.length > 0) {
        obj.claims
            .slice()
            .sort((a, b) => new Date(a.creationTime) - new Date(b.creationTime))
            .forEach((claim, i) => {
                if (!claim.damageSplatURL) return;

                const icon  = iconMap[claim.policyType] || '';
                const label = icon + ' Damage ' + (i + 1) + ' · ' + claim.formattedDate;

                const li = document.createElement('li');
                li.className = 'dropdown-item';
                li.innerHTML = '<span>' + label + '</span>';

                li.addEventListener('click', () => {
                    setSelected(li);
                    document.getElementById('claim-pill-label').textContent = label;
                    document.getElementById('claim-menu').classList.remove('open');
                    document.getElementById('claim-pill').classList.remove('open');
                    loadSplat(claim.damageSplatURL);
                });

                list.appendChild(li);
            });
    }

    // Auto-select the Original item to kick off the initial load
    originalLi.click();
}

// ---------------------------------------------------------------------------
// loadSplat
// ---------------------------------------------------------------------------

async function loadSplat(url) {
    if (!gsViewer) return;

    currentSplatUrl = url;
    showLoading(true);
    lockList();

    document.getElementById('stage-empty').style.display = 'none';

    try {
        // Swap if a viewer scene already exists, otherwise do a fresh load
        if (gsViewer.viewer) {
            await gsViewer.swap(url);
        } else {
            await gsViewer.load(url);
        }

        showLoading(false);
        unlockList();

        const label = document.getElementById('stage-label');
        label.textContent = currentObj ? currentObj.title.toUpperCase() : '';
        label.classList.add('visible');

        const xrBtn = document.getElementById('xr-btn');
        xrBtn.classList.add('visible');
        xrBtn.disabled = false;
    } catch (e) {
        showLoading(false);
        unlockList();
        showErrorToast(
            'Reconstruction unavailable',
            'WebGL context could not be created. Close other tabs or reload.'
        );
    }
}

// ---------------------------------------------------------------------------
// showLoading
// ---------------------------------------------------------------------------

function showLoading(visible) {
    document.getElementById('stage-loading').classList.toggle('visible', visible);
}

// ---------------------------------------------------------------------------
// lockList / unlockList
// ---------------------------------------------------------------------------

function lockList() {
    const wrap = document.getElementById('obj-dropdown-wrap');
    if (!wrap) return;
    wrap.style.pointerEvents = 'none';
    wrap.style.opacity = '0.5';
}

function unlockList() {
    const wrap = document.getElementById('obj-dropdown-wrap');
    if (!wrap) return;
    wrap.style.pointerEvents = '';
    wrap.style.opacity = '';
}

// ---------------------------------------------------------------------------
// initArchive
// ---------------------------------------------------------------------------

function initArchive() {
    // Creation flow: handles adding or editing insured objects
    creationFlow = new CreationFlow({
        onComplete: (obj, previous) => {
            if (previous) {
                // Replace existing object in the array
                const idx = objects.findIndex((o) => o.id === previous.id);
                if (idx !== -1) objects[idx] = obj;
            } else {
                objects.push(obj);
            }
            refreshObjDropdown();
            refreshArchive();
        },
        onRemove: (obj) => {
            const idx = objects.findIndex((o) => o.id === obj.id);
            if (idx !== -1) objects.splice(idx, 1);
            refreshObjDropdown();
            refreshArchive();
        },
    });

    // Claim flow: handles creating new damage claims against an object
    claimFlow = new ClaimFlow({
        getObjects: () => objects,
        onComplete: (claim) => {
            const obj = objects.find((o) => o.id === claim.objectId);
            if (obj) {
                obj.claims.push(claim);
                refreshArchive();
                // Keep claim dropdown in sync if the affected object is currently selected
                if (currentObj && currentObj.id === obj.id) {
                    populateClaimDropdown(obj);
                }
            }
        },
    });

    // ArchiveList renders the sidebar list of insured objects
    archiveList = new ArchiveList({
        listEl:     document.getElementById('archive-list'),
        // Search and segment controls are not wired to real DOM elements here
        searchEl:   { addEventListener: () => {}, value: '' },
        segmentEl:  { querySelectorAll: () => [] },
        onSelect:   (obj) => selectObject(obj),
    });

    // Tab: Household
    document.getElementById('tab-household').addEventListener('click', () => {
        activeTab = ObjectType.HOUSEHOLD;
        document.getElementById('tab-household').classList.add('active');
        document.getElementById('tab-building').classList.remove('active');
        refreshArchive();
    });

    // Tab: Building
    document.getElementById('tab-building').addEventListener('click', () => {
        activeTab = ObjectType.BUILDING;
        document.getElementById('tab-building').classList.add('active');
        document.getElementById('tab-household').classList.remove('active');
        refreshArchive();
    });

    // Archive panel "add" button
    document.getElementById('archive-add-btn').addEventListener('click', () => {
        creationFlow.open();
    });

    refreshArchive();
    updateSecuredValue();
}

// ---------------------------------------------------------------------------
// refreshArchive
// ---------------------------------------------------------------------------

function refreshArchive() {
    // Show only objects matching the currently active tab type
    const filtered = objects.filter((o) => o.type === activeTab);
    archiveList.setObjects(filtered);
    updateSecuredValue();
}

// ---------------------------------------------------------------------------
// updateSecuredValue
// ---------------------------------------------------------------------------

function updateSecuredValue() {
    const total = objects.reduce((sum, o) => sum + (Number(o.objectValue) || 0), 0);
    const el = document.getElementById('archive-secured');
    if (el) {
        el.textContent = total.toLocaleString('en-GB', {
            style:                'currency',
            currency:             'EUR',
            maximumFractionDigits: 0,
        });
    }
}

// ---------------------------------------------------------------------------
// initStageButtons
// ---------------------------------------------------------------------------

function initStageButtons() {
    const xrBtn = document.getElementById('xr-btn');

    xrBtn.addEventListener('click', async () => {
        xrBtn.textContent = 'Loading XR...';
        xrBtn.disabled = true;

        // Tear down the Gaussian viewer before handing the GPU to the XR world
        if (gsViewer) {
            gsViewer.setXRActive(true);
            gsViewer.destroyForXR();
        }

        const world = await initXR(currentSplatUrl);

        if (world) {
            world.visibilityState.subscribe((state) => {
                if (state === VisibilityState.NonImmersive) {
                    // User has exited immersive XR — restore the browser view
                    xrBtn.innerHTML =
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">' +
                        '<rect x="2" y="7" width="20" height="11" rx="3"/>' +
                        '<circle cx="8" cy="13" r="1.5"/>' +
                        '<circle cx="16" cy="13" r="1.5"/>' +
                        '</svg> Enter XR';
                    xrBtn.disabled = false;

                    if (currentSplatUrl) {
                        gsViewer.load(currentSplatUrl).then(() => {
                            document.getElementById('xr-btn').classList.add('visible');
                        });
                    }
                } else {
                    // User is now inside XR — hide the Gaussian canvas
                    xrBtn.textContent = 'Exit to Browser';
                    xrBtn.disabled = false;
                    if (gsViewer) gsViewer.hide();
                }
            });
        }
    });
}

// ---------------------------------------------------------------------------
// showErrorToast
// ---------------------------------------------------------------------------

/**
 * Displays a dismissible error toast at the bottom of the page.
 * Any existing toast with id "error-toast" is removed before showing a new one.
 *
 * @param {string} title   - Bold heading line inside the toast.
 * @param {string} message - Descriptive body text.
 */
function showErrorToast(title, message) {
    // Remove any toast that is already on screen
    const existing = document.getElementById('error-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'error-toast';
    toast.className = 'error-toast';

    toast.innerHTML =
        // Info / warning icon
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="12" cy="12" r="9"/>' +
        '<line x1="12" y1="8" x2="12" y2="12"/>' +
        '<circle cx="12" cy="16" r="0.5" fill="currentColor"/>' +
        '</svg>' +
        // Text body
        '<div class="error-toast-body">' +
        '<div class="error-toast-title">' + title + '</div>' +
        '<div class="error-toast-msg">' + message + '</div>' +
        '</div>' +
        // Close button
        '<button class="error-toast-close" id="error-toast-close">&times;</button>';

    document.body.appendChild(toast);

    /**
     * Triggers the hide animation and removes the toast from the DOM afterwards.
     */
    function dismiss() {
        toast.classList.add('error-toast-hide');
        setTimeout(() => toast.remove(), 300);
    }

    document.getElementById('error-toast-close').addEventListener('click', dismiss);

    // Auto-dismiss after 6 seconds
    setTimeout(dismiss, 6000);
}