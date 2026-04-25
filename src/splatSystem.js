import { createSystem } from '@iwsdk/core';

export function createSplatSystem(gsViewer) {
    return class SplatSystem extends createSystem({}) {
        update() {
            gsViewer.update();
        }
    };
}