import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _turnQuat = new THREE.Quaternion();

let visibilityForced = false;

/**
 * Expand progressive-load visibility so splats behind the camera stay drawn.
 */
export function forceFullSplatVisibility(splatMesh) {
    if (!splatMesh) return false;

    const radius = splatMesh.maxSplatDistanceFromSceneCenter;
    if (!radius || radius <= 0) return false;

    splatMesh.finalBuild = true;
    splatMesh.visibleRegionChanging = false;
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

    visibilityForced = true;
    return true;
}

export function resetSplatVisibilityState() {
    visibilityForced = false;
}

/**
 * Quest thumbstick locomotion via reference-space offset + B-button exit.
 */
export function createXRLocomotion({
    getViewer,
    onExit,
    moveSpeed = 2.4,
    turnSpeed = 1.6,
    zoomSpeed = 1.8,
}) {
    const offsetPos = new THREE.Vector3();
    let offsetYaw = 0;
    let baseRefSpace = null;

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

        if (!camera || !session) return;

        if (!visibilityForced) {
            forceFullSplatVisibility(viewer.splatMesh);
        }

        if (!baseRefSpace) {
            captureBaseReferenceSpace();
        }

        for (const source of session.inputSources) {
            const gp = source.gamepad;
            if (!gp?.buttons) continue;
            // Quest mappings vary by browser/runtime; treat any "secondary/B/Y" press as exit.
            // Common: buttons[1] (B/Y), some expose it as [5] or [4] depending on profile.
            const pressed =
                gp.buttons[1]?.pressed ||
                gp.buttons[4]?.pressed ||
                gp.buttons[5]?.pressed ||
                gp.buttons[3]?.pressed; // fallback for some profiles
            if (pressed) {
                onExit();
                return;
            }
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
            resetSplatVisibilityState();
        },
    };
}
