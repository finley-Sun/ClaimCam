import {
    AssetType,
    SessionMode,
    AssetManager,
    World,
    VisibilityState,
    Clock,
    ReferenceSpaceType,
    buildSessionInit,
    normalizeReferenceSpec,
    resolveReferenceSpaceType,
} from '@iwsdk/core';

import { EnvironmentType, LocomotionEnvironment, DomeGradient, IBLGradient } from '@iwsdk/core';
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

const MATCHA_GRADIENT = {
    sky: [0.82, 0.92, 0.76, 1.0],
    equator: [0.55, 0.72, 0.42, 1.0],
    ground: [0.38, 0.55, 0.30, 1.0],
};

function applyMatchaBackground(world) {
    const root = world.activeLevel?.value;
    if (!root) return;

    for (const component of [DomeGradient, IBLGradient]) {
        if (!root.hasComponent(component)) continue;
        root.setValue(component, 'sky', MATCHA_GRADIENT.sky);
        root.setValue(component, 'equator', MATCHA_GRADIENT.equator);
        root.setValue(component, 'ground', MATCHA_GRADIENT.ground);
        root.setValue(component, '_needsUpdate', true);
    }
}

/**
 * IWSDK runs ECS systems, then renderer.render(). Gaussian splats need a custom
 * render pass after the main scene draw or the splats get cleared each frame.
 */
function installSplatRenderHook(world, splatLoader) {
    const renderer = world.renderer;
    const clock = new Clock();

    renderer.setAnimationLoop(() => {
        const delta = clock.getDelta();
        const elapsedTime = clock.elapsedTime;
        world.visibilityState.value =
            world.session?.visibilityState ?? VisibilityState.NonImmersive;
        world.update(delta, elapsedTime);
        renderer.render(world.scene, world.camera);
        splatLoader.render();
    });
}

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

    world.launchXR();
}

/**
 * Create the IWSDK world and load the splat scene without entering XR.
 * Call while the 2D viewer is active so Enter XR can start immediately on click.
 */
export async function prepareXRWorld(splatUrl) {
    if (worldInstance) {
        if (splatUrl && xrSplatLoader) {
            await xrSplatLoader.load(splatUrl);
        }
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
            },
            grabbing: false,
            physics: false,
            sceneUnderstanding: false,
            environmentRaycast: false
        }
    });

    worldInstance = world;

    applyMatchaBackground(world);

    const { scene, camera, renderer } = world;

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
        console.log('[prepareXRWorld] splat loaded, scene children:', scene.children.length);
    }

    const XRSplatSystem = createXRSplatSystem(xrSplatLoader);
    world.registerSystem(XRSplatSystem);
    installSplatRenderHook(world, xrSplatLoader);

    return world;
}

export async function initXR(splatUrl) {
    const world = await prepareXRWorld(splatUrl);
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
