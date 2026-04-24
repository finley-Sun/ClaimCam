import {
    createSystem,
    PanelUI,
    PanelDocument,
    eq
} from '@iwsdk/core';

export class PanelSystem extends createSystem({
    welcomePanel: {
        required: [PanelUI, PanelDocument],
        where: [eq(PanelUI, 'config', './ui/welcome.json')]
    }
}) {
    init() {
        this.queries.welcomePanel.subscribe('qualify', (entity) => {
            const document = PanelDocument.data.document[entity.index];
            if (!document) {
                return;
            }
            // Panel ready
        });
    }
}