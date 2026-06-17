import { InsuredObject, ObjectType, PolicyType, Claim, ClaimStatus } from './insuredObject.js';

// ── Splat URLs ──
// Both scenes live in Vercel Blob storage (uploaded with addRandomSuffix: false
// so the pathname is stable).
const SPLAT_LIVING_ROOM =
  '/CozyLivingRoomEntertainment_Setup.spz';

const SPLAT_FIRE_DAMAGE =
  '/FireDamagedApartment_Interior.spz';

// ── Claims ──
const mockClaimLivingRoomFire = new Claim({
  id: 'claim-living-room-fire',
  objectId: 'living-room',
  policyType: PolicyType.FIRE,
  media: [],
  damageSplatURL: SPLAT_FIRE_DAMAGE,
  creationTime: new Date('2025-04-20'),
  status: ClaimStatus.PENDING,
});

// ── Objects ──
export const mockObjects = [
  new InsuredObject({
    id: 'living-room',
    title: 'Cozy Living Room',
    image: null,
    type: ObjectType.HOUSEHOLD,
    policies: [PolicyType.FIRE, PolicyType.ELECTRICAL, PolicyType.WATER],
    splatURL: SPLAT_LIVING_ROOM,
    creationTime: new Date('2025-04-05'),
    media: [],
    claims: [mockClaimLivingRoomFire],
    receipt: null,
    objectValue: 8500,
    purchaseYear: 2022,
  }),
];
