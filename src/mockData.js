import { InsuredObject, ObjectType } from './insuredObject.js';

export const mockObjects = [
    new InsuredObject({
        id: 'bonsai',
        title: 'Bonsai',
        image: null,
        type: ObjectType.HOUSEHOLD,
        splatURL: 'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat',
        creationTime: new Date('2025-04-10'),
        media: [],
    }),
    new InsuredObject({
        id: 'living-room',
        title: 'Living Room',
        image: null,
        type: ObjectType.BUILDING,
        splatURL: null,
        creationTime: new Date('2025-03-22'),
        media: [],
    }),
    new InsuredObject({
        id: 'kitchen',
        title: 'Kitchen',
        image: null,
        type: ObjectType.BUILDING,
        splatURL: null,
        creationTime: new Date('2025-04-01'),
        media: [],
    }),
    new InsuredObject({
        id: 'tv',
        title: 'Television',
        image: null,
        type: ObjectType.HOUSEHOLD,
        splatURL: null,
        creationTime: new Date('2025-02-14'),
        media: [],
    }),
];