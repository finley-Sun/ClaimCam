import { InsuredObject, ObjectType, PolicyType, Claim, ClaimStatus } from './insuredObject.js';

// ── Two visually distinct public splats ──
const SPLAT_BONSAI =
  'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat';

const SPLAT_BICYCLE =
  'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bicycle/bicycle-7k.splat';

const SPLAT_COUNTER =
  'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/counter/counter-7k.splat';

// ── Mock claims for Living Room ──
const mockClaimLivingRoom1 = new Claim({
  id: 'claim-living-room-1',
  objectId: 'living-room',
  policyType: PolicyType.WATER,
  media: [],
  damageSplatURL: SPLAT_BICYCLE,
  creationTime: new Date('2025-04-02'),
  status: ClaimStatus.PENDING,
});

const mockClaimLivingRoom2 = new Claim({
  id: 'claim-living-room-2',
  objectId: 'living-room',
  policyType: PolicyType.FIRE,
  media: [],
  damageSplatURL: SPLAT_COUNTER,
  creationTime: new Date('2025-04-15'),
  status: ClaimStatus.PROCESSING,
});

export const mockObjects = [
    new InsuredObject({
        id: 'bonsai',
        title: 'Bonsai',
        image: null,
        type: ObjectType.HOUSEHOLD,
        policies: [PolicyType.FIRE, PolicyType.WATER],
        splatURL: SPLAT_BONSAI,
        creationTime: new Date('2025-04-10'),
        media: [],
        claims: [],
        receipt: null,
        objectValue: 350,
        purchaseYear: 2021,
    }),
    new InsuredObject({
        id: 'living-room',
        title: 'Living Room',
        image: null,
        type: ObjectType.BUILDING,
        policies: [PolicyType.FIRE, PolicyType.WATER, PolicyType.NATURAL_DISASTER],
        splatURL: SPLAT_BONSAI,
        creationTime: new Date('2025-03-22'),
        media: [],
        claims: [mockClaimLivingRoom1, mockClaimLivingRoom2],
        receipt: null,
        objectValue: 185000,
        purchaseYear: 2018,
    }),
    new InsuredObject({
        id: 'kitchen',
        title: 'Kitchen',
        image: null,
        type: ObjectType.BUILDING,
        policies: [PolicyType.ELECTRICAL, PolicyType.FIRE],
        splatURL: null,
        creationTime: new Date('2025-04-01'),
        media: [],
        claims: [],
        receipt: null,
        objectValue: null,
        purchaseYear: null,
    })
];