import * as THREE from 'three';
import { resolveItemWorldPositions } from './splatMarkers.js';

const _camPos = new THREE.Vector3();
const _forward = new THREE.Vector3();

function makeTextSprite(text, { fontSize = 30, width = 480, height = 72 } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect(10, 10, width - 20, height - 20, 20);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = `500 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2 + 1);
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
    sprite.scale.set(0.48, 0.072, 1);
    sprite.userData.dispose = () => {
        texture.dispose();
        material.dispose();
    };
    return sprite;
}

function makeLabelSprite(text) {
    return makeTextSprite(text, { fontSize: 34, width: 512, height: 96 });
}

/**
 * World-anchored item labels + floor-anchored "Press B to exit" hint.
 */
export function createXRVrUi({ camera, items, mkViewer, isDamage, width, height }) {
    const worldScene = new THREE.Scene();
    const labelSprites = [];
    const hintWorldPos = new THREE.Vector3();
    let hintPlaced = false;

    const worldPositions = resolveItemWorldPositions(mkViewer, items, width, height, { isDamage });
    for (const item of items) {
        const world = worldPositions.get(item.id);
        if (!world) continue;
        const sprite = makeLabelSprite(item.name);
        sprite.position.copy(world);
        worldScene.add(sprite);
        labelSprites.push(sprite);
    }

    const hintSprite = makeTextSprite('Press B to exit', { fontSize: 28, width: 400, height: 64 });
    worldScene.add(hintSprite);

    const placeHintOnFloor = () => {
        camera.getWorldPosition(_camPos);
        const floorY = mkViewer?.splatMesh?.calculatedSceneCenter?.y ?? _camPos.y - 1.2;

        camera.getWorldDirection(_forward);
        _forward.y = 0;
        if (_forward.lengthSq() < 1e-6) _forward.set(0, 0, -1);
        _forward.normalize();

        hintWorldPos.copy(_camPos).addScaledVector(_forward, 0.55);
        hintWorldPos.y = floorY + 0.06;
        hintSprite.position.copy(hintWorldPos);
        hintPlaced = true;
    };

    const update = () => {
        if (!hintPlaced) placeHintOnFloor();

        hintSprite.position.y = hintWorldPos.y;
        hintSprite.lookAt(camera.position.x, hintWorldPos.y, camera.position.z);

        for (let i = 0; i < labelSprites.length; i++) {
            labelSprites[i].lookAt(camera.position);
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
        worldScene.remove(hintSprite);
        hintSprite.userData.dispose?.();
    };

    return {
        worldScene,
        update,
        render,
        destroy,
    };
}
