import { Vector2, Vector3 } from 'three';

/**
 * Raycast from normalized screen coords [0,1] onto the splat surface.
 */
export function pickWorldFromMarker(mkViewer, marker, width, height) {
    if (!mkViewer?.splatMesh || !mkViewer.raycaster || !mkViewer.camera) {
        return null;
    }

    const screen = new Vector2(marker.x * width, marker.y * height);
    const dims = new Vector2(width, height);
    const hits = [];

    mkViewer.raycaster.setFromCameraAndScreenPosition(
        mkViewer.camera,
        screen,
        dims
    );
    mkViewer.raycaster.intersectSplatMesh(mkViewer.splatMesh, hits);

    return hits[0]?.origin ? hits[0].origin.clone() : null;
}

/**
 * Resolve each item to a world-space anchor (explicit position or raycast from marker).
 */
export function resolveItemWorldPositions(mkViewer, items, width, height) {
    const resolved = new Map();

    for (const item of items) {
        if (item.position) {
            resolved.set(item.id, new Vector3(...item.position));
            continue;
        }

        const hit = pickWorldFromMarker(mkViewer, item.marker, width, height);
        if (hit) {
            resolved.set(item.id, hit);
        }
    }

    return resolved;
}

/**
 * Project a world point to container pixel coordinates.
 */
export function projectWorldToScreen(worldPos, camera, width, height) {
    const projected = worldPos.clone().project(camera);

    if (projected.z > 1) {
        return { visible: false, x: 0, y: 0 };
    }

    return {
        visible: true,
        x: (projected.x * 0.5 + 0.5) * width,
        y: (-projected.y * 0.5 + 0.5) * height,
    };
}
