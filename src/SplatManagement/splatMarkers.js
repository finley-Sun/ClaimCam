import { Vector2, Vector3 } from 'three';
import { computeSplatBounds } from './splatPlacement.js';

function roomAxes(bounds) {
    const alongZ = bounds.size.z >= bounds.size.x;
    return {
        alongZ,
        minX: bounds.center.x - bounds.size.x * 0.5,
        minY: bounds.center.y - bounds.size.y * 0.5,
        minZ: bounds.center.z - bounds.size.z * 0.5,
    };
}

/**
 * Place a label from normalized floor-plan coords within the splat bounds.
 * marker.x = left (0) → right (1) across the room width
 * marker.y = back wall (0) → forward / default view (1) along room depth
 * marker.h = optional height fraction within the room volume (0 = floor, 1 = ceiling)
 */
export function worldFromFloorMarker(bounds, marker) {
    const { alongZ, minX, minY, minZ } = roomAxes(bounds);
    const h = marker.h ?? 0.35;

    if (alongZ) {
        return new Vector3(
            minX + marker.x * bounds.size.x,
            minY + h * bounds.size.y,
            minZ + marker.y * bounds.size.z,
        );
    }

    return new Vector3(
        minX + marker.y * bounds.size.x,
        minY + h * bounds.size.y,
        minZ + marker.x * bounds.size.z,
    );
}

/**
 * Raycast from normalized screen coords [0,1] onto the splat surface (fallback).
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
        dims,
    );
    mkViewer.raycaster.intersectSplatMesh(mkViewer.splatMesh, hits);

    return hits[0]?.origin ? hits[0].origin.clone() : null;
}

/**
 * Resolve each item to a world-space anchor (explicit position or floor-plan marker).
 */
export function resolveItemWorldPositions(mkViewer, items, width, height) {
    const resolved = new Map();
    const bounds = computeSplatBounds(mkViewer);

    for (const item of items) {
        if (item.position) {
            resolved.set(item.id, new Vector3(...item.position));
            continue;
        }

        if (bounds && item.marker) {
            resolved.set(item.id, worldFromFloorMarker(bounds, item.marker));
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
