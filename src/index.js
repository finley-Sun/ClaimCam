import {
    AssetType,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    SessionMode,
    SRGBColorSpace,
    AssetManager,
    World
} from '@iwsdk/core';

import {
    AudioSource,
    DistanceGrabbable,
    MovementMode,
    Interactable,
    PlaybackMode
} from '@iwsdk/core';

import { EnvironmentType, LocomotionEnvironment } from '@iwsdk/core';
import { Robot, RobotSystem } from './robot.js';
import { GaussianSplatViewer } from './gaussianSplat.js';

const assets = {
    chimeSound: {
        url: '/audio/chime.mp3',
        type: AssetType.Audio,
        priority: 'background'
    },
    webxr: {
        url: '/textures/webxr.png',
        type: AssetType.Texture,
        priority: 'critical'
    },
    environmentDesk: {
        url: './gltf/environmentDesk/environmentDesk.gltf',
        type: AssetType.GLTF,
        priority: 'critical'
    },
    plantSansevieria: {
        url: './gltf/plantSansevieria/plantSansevieria.gltf',
        type: AssetType.GLTF,
        priority: 'critical'
    },
    robot: {
        url: './gltf/robot/robot.gltf',
        type: AssetType.GLTF,
        priority: 'critical'
    }
};

let worldInstance = null;

export async function initXR() {
    if (worldInstance) {
        worldInstance.launchXR();
        return worldInstance;
    }

    const sceneContainer = document.getElementById('scene-container');
    sceneContainer.style.display = 'block';

    const world = await World.create(sceneContainer, {
        assets,
        xr: {
            sessionMode: SessionMode.ImmersiveVR,
            offer: 'always',
            features: { handTracking: true, layers: true }
        },
        features: {
            locomotion: { useWorker: true },
            grabbing: true,
            physics: false,
            sceneUnderstanding: false,
            environmentRaycast: false
        }
    });

    worldInstance = world;

    const { camera, scene, renderer } = world;

    camera.position.set(-4, 1.5, -6);
    camera.rotateY(-Math.PI * 0.75);

    const { scene: envMesh } = AssetManager.getGLTF('environmentDesk');
    envMesh.rotateY(Math.PI);
    envMesh.position.set(0, -0.1, 0);
    world
        .createTransformEntity(envMesh)
        .addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

    const { scene: plantMesh } = AssetManager.getGLTF('plantSansevieria');
    plantMesh.position.set(1.2, 0.85, -1.8);
    world
        .createTransformEntity(plantMesh)
        .addComponent(Interactable)
        .addComponent(DistanceGrabbable, {
            movementMode: MovementMode.MoveFromTarget
        });

    const { scene: robotMesh } = AssetManager.getGLTF('robot');
    robotMesh.position.set(-1.2, 0.95, -1.8);
    robotMesh.scale.setScalar(0.5);
    world
        .createTransformEntity(robotMesh)
        .addComponent(Interactable)
        .addComponent(Robot)
        .addComponent(AudioSource, {
            src: './audio/chime.mp3',
            maxInstances: 3,
            playbackMode: PlaybackMode.FadeRestart
        });

    const webxrLogoTexture = AssetManager.getTexture('webxr');
    webxrLogoTexture.colorSpace = SRGBColorSpace;
    const logoBanner = new Mesh(
        new PlaneGeometry(3.39, 0.96),
        new MeshBasicMaterial({
            map: webxrLogoTexture,
            transparent: true
        })
    );
    world.createTransformEntity(logoBanner);
    logoBanner.position.set(0, 1, 1.8);
    logoBanner.rotateY(Math.PI);

    world.registerSystem(RobotSystem);
    world.launchXR();

    return world;
}

export function initGaussian() {
    return new GaussianSplatViewer({
        container: document.getElementById('scene-wrapper')
    });
}