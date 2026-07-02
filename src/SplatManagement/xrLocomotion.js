import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _gazeDir = new THREE.Vector3();
const _toTarget = new THREE.Vector3();
const _turnQuat = new THREE.Quaternion();

/**
 * Expand progressive-load visibility so splats behind the camera stay drawn.
 */
export function forceFullSplatVisibility(splatMesh) {
    if (!splatMesh) return;

    splatMesh.finalBuild = true;
    splatMesh.visibleRegionChanging = false;

    const radius = splatMesh.maxSplatDistanceFromSceneCenter;
    if (!radius || radius <= 0) return;

    splatMesh.visibleRegionRadius = radius;
    splatMesh.visibleRegionBufferRadius = radius;
    splatMesh.visibleRegionFadeStartRadius = radius;

    const uniforms = splatMesh.material?.uniforms;
    if (uniforms?.visibleRegionRadius) {
        uniforms.visibleRegionRadius.value = radius;
    }
    if (uniforms?.visibleRegionFadeStartRadius) {
        uniforms.visibleRegionFadeStartRadius.value = radius;
    }
    if (uniforms?.fadeInComplete) {
        uniforms.fadeInComplete.value = 1;
    }
}

export function isGazingAtMesh(camera, mesh, minDot = 0.94) {
    if (!camera || !mesh) return false;

    mesh.getWorldPosition(_toTarget);
    camera.getWorldDirection(_gazeDir);
    _toTarget.sub(camera.position).normalize();
    return _gazeDir.dot(_toTarget) >= minDot;
}

/**
 * Quest thumbstick locomotion via reference-space offset, gaze-dwell exit,
 * and B-button exit fallback.
 */
export function createXRLocomotion({
    getViewer,
    getExitMesh,
    onExit,
    moveSpeed = 2.4,
    turnSpeed = 1.6,
    zoomSpeed = 1.8,
    gazeExitSeconds = 1.4,
}) {
    const offsetPos = new THREE.Vector3();
    let offsetYaw = 0;
    let baseRefSpace = null;
    let gazeTimer = 0;

    const captureBaseReferenceSpace = () => {
        const renderer = getViewer()?.renderer;
        if (!renderer?.xr) return;
        baseRefSpace = renderer.xr.getReferenceSpace();
    };

    const applyOffset = () => {
        const renderer = getViewer()?.renderer;
        if (!renderer?.xr || !baseRefSpace) return;

        _turnQuat.setFromAxisAngle(UP, offsetYaw);
        const transform = new XRRigidTransform(
            { x: offsetPos.x, y: offsetPos.y, z: offsetPos.z },
            { x: _turnQuat.x, y: _turnQuat.y, z: _turnQuat.z, w: _turnQuat.w },
        );
        renderer.xr.setReferenceSpace(baseRefSpace.getOffsetReferenceSpace(transform));
    };

    const update = (frame, deltaSec) => {
        const viewer = getViewer();
        const camera = viewer?.camera;
        const session = viewer?.renderer?.xr?.getSession?.();
        const exitMesh = getExitMesh();

        if (!camera || !session) return;

        forceFullSplatVisibility(viewer.splatMesh);

        if (!baseRefSpace) {
            captureBaseReferenceSpace();
        }

        for (const source of session.inputSources) {
            const gamepad = source.gamepad;
            if (gamepad?.buttons?.[1]?.pressed) {
                onExit();
                return;
            }
        }

        if (exitMesh && isGazingAtMesh(camera, exitMesh)) {
            gazeTimer += deltaSec;
            if (gazeTimer >= gazeExitSeconds) {
                onExit();
                return;
            }
        } else {
            gazeTimer = 0;
        }

        let moveX = 0;
        let moveZ = 0;
        let turn = 0;
        let zoom = 0;

        for (const source of session.inputSources) {
            const gamepad = source.gamepad;
            if (!gamepad?.axes) continue;

            const dead = 0.2;
            const x = Math.abs(gamepad.axes[0] ?? 0) > dead ? gamepad.axes[0] : 0;
            const y = Math.abs(gamepad.axes[1] ?? 0) > dead ? gamepad.axes[1] : 0;

            if (source.handedness === 'left') {
                moveX += x;
                moveZ -= y;
            } else if (source.handedness === 'right') {
                turn -= x;
                zoom -= y;
            }

            if (gamepad.buttons?.[0]?.pressed && exitMesh && isGazingAtMesh(camera, exitMesh, 0.9)) {
                onExit();
                return;
            }
        }

        if (moveX === 0 && moveZ === 0 && turn === 0 && zoom === 0) return;

        camera.getWorldDirection(_forward);
        _forward.y = 0;
        if (_forward.lengthSq() < 1e-6) return;
        _forward.normalize();
        _right.crossVectors(_forward, UP).normalize();

        _move.set(0, 0, 0);
        _move.addScaledVector(_right, moveX);
        _move.addScaledVector(_forward, moveZ);
        if (_move.lengthSq() > 0) {
            _move.normalize().multiplyScalar(moveSpeed * deltaSec);
            offsetPos.add(_move);
        }

        if (turn !== 0) {
            offsetYaw += turn * turnSpeed * deltaSec;
        }

        if (zoom !== 0) {
            offsetPos.addScaledVector(_forward, zoom * zoomSpeed * deltaSec);
        }

        applyOffset();
    };

    return {
        update,
        captureBaseReferenceSpace,
        reset() {
            offsetPos.set(0, 0, 0);
            offsetYaw = 0;
            baseRefSpace = null;
            gazeTimer = 0;
        },
    };
}
