import * as THREE from 'three';
import { resolveItemWorldPositions } from './splatMarkers.js';

const _matrix = new THREE.Matrix4();
const _origin = new THREE.Vector3();
const _direction = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

function drawExitButton(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const radius = h / 2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, radius);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Exit VR', w / 2, h / 2 + 2);
}

function makeLabelSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.beginPath();
        ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 28);
        ctx.fill();
        ctx.fillStyle = '#FF8A47';
        ctx.beginPath();
        ctx.arc(40, canvas.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 34px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const label = text.length > 22 ? `${text.slice(0, 20)}…` : text;
        ctx.fillText(label, 64, canvas.height / 2 + 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.42, 0.08, 1);
    sprite.userData.dispose = () => {
        texture.dispose();
        material.dispose();
    };
    return sprite;
}

const _camPos = new THREE.Vector3();

/**
 * Lightweight VR UI: world-anchored item labels + floor-anchored Exit VR panel.
 * Rendered in dedicated passes after the splat to avoid extra threeScene work.
 */
export function createXRVrUi({ camera, items, mkViewer, isDamage, width, height }) {
    const worldScene = new THREE.Scene();
    const labelSprites = [];
    const exitWorldPos = new THREE.Vector3();
    let exitPlaced = false;

    const worldPositions = resolveItemWorldPositions(mkViewer, items, width, height, { isDamage });
    for (const item of items) {
        const world = worldPositions.get(item.id);
        if (!world) continue;
        const sprite = makeLabelSprite(item.name);
        sprite.position.copy(world);
        worldScene.add(sprite);
        labelSprites.push(sprite);
    }

    const exitCanvas = document.createElement('canvas');
    exitCanvas.width = 512;
    exitCanvas.height = 128;
    drawExitButton(exitCanvas);
    const exitTexture = new THREE.CanvasTexture(exitCanvas);
    exitTexture.colorSpace = THREE.SRGBColorSpace;

    const exitMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.52, 0.13),
        new THREE.MeshBasicMaterial({
            map: exitTexture,
            transparent: true,
            depthTest: true,
            depthWrite: false,
            toneMapped: false,
        }),
    );
    exitMesh.renderOrder = 10000;
    exitMesh.name = 'claimcam-exit-vr';

    const exitRoot = new THREE.Group();
    exitRoot.add(exitMesh);
    worldScene.add(exitRoot);

    const placeExitOnFloor = () => {
        camera.getWorldPosition(_camPos);
        const floorY = mkViewer?.splatMesh?.calculatedSceneCenter?.y ?? _camPos.y - 1.2;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
        forward.normalize();

        exitWorldPos.copy(_camPos).addScaledVector(forward, 0.85);
        exitWorldPos.y = floorY + 0.42;
        exitRoot.position.copy(exitWorldPos);
        exitRoot.lookAt(_camPos.x, exitWorldPos.y, _camPos.z);
        exitPlaced = true;
    };

    const update = () => {
        camera.updateMatrixWorld(true);
        if (!exitPlaced) placeExitOnFloor();

        exitRoot.lookAt(camera.position.x, exitWorldPos.y, camera.position.z);

        for (const sprite of labelSprites) {
            sprite.lookAt(camera.position);
        }
    };

    const render = (renderer, cam) => {
        if (!renderer || !cam) return;

        update();

        const prevAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        renderer.render(worldScene, cam);
        renderer.autoClear = prevAutoClear;
    };

    const destroy = () => {
        for (const sprite of labelSprites) {
            worldScene.remove(sprite);
            sprite.userData.dispose?.();
        }
        labelSprites.length = 0;
        worldScene.remove(exitRoot);
        exitTexture.dispose();
        exitMesh.geometry.dispose();
        exitMesh.material.dispose();
    };

    return {
        exitMesh,
        worldScene,
        update,
        render,
        destroy,
    };
}

export function intersectExitHud(mesh, frame, referenceSpace, inputSource) {
    if (!mesh || !frame || !referenceSpace || !inputSource?.targetRaySpace) {
        return false;
    }

    const pose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
    if (!pose) return false;

    _matrix.fromArray(pose.transform.matrix);
    _origin.setFromMatrixPosition(_matrix);
    _direction.set(0, 0, -1).transformDirection(_matrix).normalize();

    mesh.updateMatrixWorld(true);
    _raycaster.set(_origin, _direction);
    return _raycaster.intersectObject(mesh, true).length > 0;
}
