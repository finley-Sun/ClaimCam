import {
    AssetType,
    SessionMode,
    AssetManager,
    World,
    Color,
    ReferenceSpaceType,
    buildSessionInit,
    normalizeReferenceSpec,
    resolveReferenceSpaceType,
} from '@iwsdk/core';

import { EnvironmentType, LocomotionEnvironment } from '@iwsdk/core';
import { GaussianSplatViewer } from './SplatManagement/gaussianSplat.js';
import { XRSplatLoader, createXRSplatSystem } from './SplatManagement/xrSplatSystem.js';

const assets = {
    environmentDesk: {
        url: './gltf/environmentDesk/environmentDesk.gltf',
        type: AssetType.GLTF,
        priority: 'critical'
    },
};

const xrDefaults = {
    sessionMode: SessionMode.ImmersiveVR,
    referenceSpace: ReferenceSpaceType.LocalFloor,
    features: { handTracking: true, layers: true },
};

let worldInstance = null;
let xrSplatLoader = null;
let pendingSessionPromise = null;

/**
 * Call synchronously from a user click/tap before any await.
 * WebXR requires requestSession to run while user activation is active (Quest browser).
 */
export function captureXRSessionRequest() {
    if (worldInstance?.session || pendingSessionPromise) {
        return pendingSessionPromise;
    }

    const opts = worldInstance?.xrDefaults ?? xrDefaults;
    const sessionMode = opts.sessionMode ?? SessionMode.ImmersiveVR;
    const sessionOptions = buildSessionInit(opts);

    pendingSessionPromise = navigator.xr?.requestSession(sessionMode, sessionOptions) ?? null;
    return pendingSessionPromise;
}

async function bindPendingXRSession(world) {
    if (world.session) {
        return;
    }

    const refSpec = normalizeReferenceSpec(world.xrDefaults?.referenceSpace ?? xrDefaults.referenceSpace);

    const onSessionStart = async (session) => {
        const onSessionEnd = () => {
            session.removeEventListener('end', onSessionEnd);
            world.session = undefined;
        };

        session.addEventListener('end', onSessionEnd);

        try {
            const resolvedType = await resolveReferenceSpaceType(
                session,
                refSpec.type,
                refSpec.required ? [] : refSpec.fallbackOrder
            );
            world.renderer.xr.getDepthSensingMesh = function () {
                return null;
            };
            world.renderer.xr.setReferenceSpaceType(resolvedType);
            await world.renderer.xr.setSession(session);
            world.session = session;
        } catch (err) {
            console.error('[XR] Failed to acquire reference space:', err);
            try {
                await session.end();
            } catch (_e) {}
            throw err;
        }
    };

    if (pendingSessionPromise) {
        try {
            const session = await pendingSessionPromise;
            pendingSessionPromise = null;
            if (session) {
                await onSessionStart(session);
            }
        } catch (err) {
            pendingSessionPromise = null;
            throw err;
        }
        return;
    }

    // Desktop emulation fallback when captureXRSessionRequest was not used.
    world.launchXR();
}

export async function initXR(splatUrl) {
    if (worldInstance) {
        if (splatUrl && xrSplatLoader) {
            await xrSplatLoader.load(splatUrl);
        }
        await bindPendingXRSession(worldInstance);
        return worldInstance;
    }

    const sceneContainer = document.getElementById('scene-container');
    sceneContainer.style.display = 'block';

    const world = await World.create(sceneContainer, {
        assets,
        xr: {
            sessionMode: SessionMode.ImmersiveVR,
            referenceSpace: ReferenceSpaceType.LocalFloor,
            offer: 'none',
            features: { handTracking: true, layers: true }
        },
        features: {
            locomotion: {
            useWorker: true,
            gravity: false,
            enableGravity: false,
            gravityEnabled: false,
            },
            grabbing: false,
            physics: false,
            sceneUnderstanding: false,
            environmentRaycast: false
        }
    });

    worldInstance = world;

    const { camera, scene, renderer } = world;

    // Strip default IWSDK environment
    scene.background = new Color(0x000000);
    scene.environment = null;
    scene.fog = null;

    renderer.autoClear = false;

    camera.position.set(0, 1.6, 3);
    camera.lookAt(0, 1.2, -2);

    // Minimal floor for locomotion only
    const { scene: envMesh } = AssetManager.getGLTF('environmentDesk');
    envMesh.visible = false;
    envMesh.rotateY(Math.PI);
    envMesh.position.set(0, -0.1, 0);
    world
        .createTransformEntity(envMesh)
        .addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

    xrSplatLoader = new XRSplatLoader({ scene, camera, renderer });

    if (splatUrl) {
        await xrSplatLoader.load(splatUrl);
        console.log('[initXR] scene children after splat load:', scene.children.length);
    }

    const XRSplatSystem = createXRSplatSystem(xrSplatLoader);
    world.registerSystem(XRSplatSystem);

    await bindPendingXRSession(world);

    return world;
}

export function hasActiveXRSession() {
    return !!worldInstance?.session;
}

export function exitXRSession() {
    worldInstance?.exitXR();
}

export function initGaussian() {
    return new GaussianSplatViewer({
        container: document.getElementById('view-dashboard')
    });
}
