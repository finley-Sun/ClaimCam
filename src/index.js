import {
    AssetType,
    SessionMode,
    AssetManager,
    World,
    Color
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

let worldInstance = null;
let xrSplatLoader = null;

export async function initXR(splatUrl) {
    if (worldInstance) {
        if (splatUrl && xrSplatLoader) {
            await xrSplatLoader.load(splatUrl);
        }
        worldInstance.launchXR();
        return worldInstance;
    }

    const sceneContainer = document.getElementById('scene-container');
    sceneContainer.style.display = 'block';

    const world = await World.create(sceneContainer, {
        assets,
        xr: {
            sessionMode: SessionMode.ImmersiveVR,
            offer: 'never',
            features: { handTracking: true, layers: true }
        },
        features: {
            locomotion: {
                useWorker: true,
                gravity: false,
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

    world.launchXR();

    return world;
}

export function initGaussian() {
    return new GaussianSplatViewer({
        container: document.getElementById('view-dashboard')
    });
}