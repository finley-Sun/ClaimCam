import { InsuredObject, ObjectType, PolicyType, Claim, ClaimStatus } from './insuredObject.js';

// ── Splat URLs ──
const SPLAT_BONSAI =
  'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat';

const SPLAT_BICYCLE =
  'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bicycle/bicycle-7k.splat';

const SPLAT_COUNTER =
  'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/counter/counter-7k.splat';

const SPLAT_HOUSE =
  'https://xmhfuitlwymxrgwo.public.blob.vercel-storage.com/gs_House.ply';

const SPLAT_TV =
  'https://xmhfuitlwymxrgwo.public.blob.vercel-storage.com/gs_Not_Broken_Television.ply';

const SPLAT_TV_BROKEN =
  'https://xmhfuitlwymxrgwo.public.blob.vercel-storage.com/gs_Broken_Television.ply';

const SPLAT_VASE =
  'https://xmhfuitlwymxrgwo.public.blob.vercel-storage.com/gs_Vase.ply';

// ── Claims ──
const mockClaimTVBroken = new Claim({
  id: 'claim-tv-vandalism',
  objectId: 'television',
  policyType: PolicyType.VANDALISM,
  media: [],
  damageSplatURL: SPLAT_TV_BROKEN,
  creationTime: new Date('2025-04-20'),
  status: ClaimStatus.PENDING,
});

// ── Objects ──
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
    id: 'bicycle',
    title: 'Mountain Bike',
    image: null,
    type: ObjectType.HOUSEHOLD,
    policies: [PolicyType.VANDALISM, PolicyType.WATER],
    splatURL: SPLAT_BICYCLE,
    creationTime: new Date('2025-04-12'),
    media: [],
    claims: [],
    receipt: null,
    objectValue: 1200,
    purchaseYear: 2023,
  }),
  new InsuredObject({
    id: 'counter',
    title: 'Kitchen Counter',
    image: null,
    type: ObjectType.BUILDING,
    policies: [PolicyType.FIRE, PolicyType.WATER],
    splatURL: SPLAT_COUNTER,
    creationTime: new Date('2025-03-15'),
    media: [],
    claims: [],
    receipt: null,
    objectValue: 5000,
    purchaseYear: 2018,
  }),
  new InsuredObject({
    id: 'grandmas-house',
    title: "Grandma's House",
    image: null,
    type: ObjectType.BUILDING,
    policies: [PolicyType.FIRE, PolicyType.WATER, PolicyType.NATURAL_DISASTER],
    splatURL: SPLAT_HOUSE,
    creationTime: new Date('2025-03-22'),
    media: [],
    claims: [],
    receipt: null,
    objectValue: 1805000,
    purchaseYear: 1960,
  }),
  new InsuredObject({
    id: 'television',
    title: 'Smart TV',
    image: null,
    type: ObjectType.HOUSEHOLD,
    policies: [PolicyType.FIRE, PolicyType.ELECTRICAL, PolicyType.VANDALISM],
    splatURL: SPLAT_TV,
    creationTime: new Date('2025-04-05'),
    media: [],
    claims: [mockClaimTVBroken],
    receipt: null,
    objectValue: 1200,
    purchaseYear: 2023,
  }),
  new InsuredObject({
    id: 'vase',
    title: 'Ceramic Vase',
    image: null,
    type: ObjectType.HOUSEHOLD,
    policies: [PolicyType.FIRE, PolicyType.WATER],
    splatURL: SPLAT_VASE,
    creationTime: new Date('2025-04-12'),
    media: [],
    claims: [],
    receipt: null,
    objectValue: 480,
    purchaseYear: 2019,
  })
];