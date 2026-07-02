import * as THREE from 'three';

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

/**
 * Head-locked Exit VR control rendered inside the WebXR frame. Parented to
 * threeScene and synced to the camera each frame (mkkellogg only renders scene children).
 */
export function createXRExitHud(camera, threeScene) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    drawExitButton(canvas);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.44, 0.11),
        new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            toneMapped: false,
        }),
    );

    mesh.renderOrder = 10000;
    mesh.name = 'claimcam-exit-vr';
    mesh.position.set(0, -0.3, -0.7);

    const root = new THREE.Group();
    root.name = 'claimcam-exit-vr-root';
    root.add(mesh);
    threeScene.add(root);

    const updatePose = () => {
        root.position.copy(camera.position);
        root.quaternion.copy(camera.quaternion);
    };
    updatePose();

    return {
        mesh,
        root,
        texture,
        canvas,
        updatePose,
        destroy() {
            threeScene.remove(root);
            texture.dispose();
            mesh.geometry.dispose();
            mesh.material.dispose();
        },
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

    _raycaster.set(_origin, _direction);
    return _raycaster.intersectObject(mesh, false).length > 0;
}
