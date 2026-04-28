export const ObjectType = {
    BUILDING: 'building',
    HOUSEHOLD: 'household',
};

export const PolicyType = {
    FIRE: 'fire',
    WATER: 'water',
    THEFT: 'theft',
    NATURAL_DISASTER: 'natural_disaster',
    VANDALISM: 'vandalism',
    ELECTRICAL: 'electrical',
};

export const PolicyMeta = {
    [PolicyType.FIRE]: { label: 'Fire', icon: '🔥', color: '#fceaea', border: '#f5c2c2' },
    [PolicyType.WATER]: { label: 'Water damage', icon: '💧', color: '#e8f0fa', border: '#b8d0f0' },
    [PolicyType.THEFT]: { label: 'Theft', icon: '🔒', color: '#f5f4ef', border: '#d4d2c8' },
    [PolicyType.NATURAL_DISASTER]: { label: 'Natural disaster', icon: '⛈️', color: '#faeed8', border: '#e8d0a0' },
    [PolicyType.VANDALISM]: { label: 'Vandalism', icon: '🪣', color: '#f0eafa', border: '#d0b8f0' },
    [PolicyType.ELECTRICAL]: { label: 'Electrical', icon: '⚡', color: '#fafae8', border: '#e0e0a0' },
};

export const ClaimStatus = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

export const ClaimStatusMeta = {
    [ClaimStatus.PENDING]: { label: 'Pending', color: '#faeed8', border: '#e8d0a0', text: '#855010' },
    [ClaimStatus.PROCESSING]: { label: 'Processing', color: '#e8f0fa', border: '#b8d0f0', text: '#185fa5' },
    [ClaimStatus.APPROVED]: { label: 'Approved', color: '#eaf4ec', border: '#b0ddb8', text: '#3a7d44' },
    [ClaimStatus.REJECTED]: { label: 'Rejected', color: '#fceaea', border: '#f5c2c2', text: '#a32d2d' },
};

export class Claim {
    constructor({ id, objectId, policyType, media, damageSplatURL, creationTime, status }) {
        this.id = id;
        this.objectId = objectId;
        this.policyType = policyType;
        this.media = media || [];
        this.damageSplatURL = damageSplatURL || null;
        this.creationTime = creationTime instanceof Date ? creationTime : new Date(creationTime);
        this.status = status || ClaimStatus.PENDING;
    }

    get formattedDate() {
        return this.creationTime.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }
}

export class InsuredObject {
    constructor({ id, title, image, type, policies, splatURL, creationTime, media, claims,
                  receipt, objectValue, purchaseYear }) {
        this.id = id;
        this.title = title;
        this.image = image || null;
        this.type = type;
        this.policies = policies || [];
        this.splatURL = splatURL || null;
        this.creationTime = creationTime instanceof Date ? creationTime : new Date(creationTime);
        this.media = media || [];
        this.claims = claims || [];
        this.receipt = receipt || null;
        this.objectValue = objectValue || null;
        this.purchaseYear = purchaseYear || null;
    }
    get formattedDate() {
        return this.creationTime.toLocaleDateString('en-GB', {            day: 'numeric',
            month: 'short',            year: 'numeric',
        });
    }
}