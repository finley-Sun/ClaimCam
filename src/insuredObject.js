export const ObjectType = {
    BUILDING: 'building',
    HOUSEHOLD: 'household',
};

export class InsuredObject {
    constructor({ id, title, image, type, splatURL, creationTime, media }) {
        this.id = id;
        this.title = title;
        this.image = image || null;
        this.type = type;
        this.splatURL = splatURL || null;
        this.creationTime = creationTime instanceof Date ? creationTime : new Date(creationTime);
        this.media = media || [];
    }

    get formattedDate() {
        return this.creationTime.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }
}