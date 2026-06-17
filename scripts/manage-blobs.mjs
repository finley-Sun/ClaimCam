// One-off Vercel Blob maintenance:
//   - list current blobs
//   - upload the two new .spz scenes (stable pathnames, no random suffix)
//   - delete the five old gs_*.ply blobs
//
// Usage:
//   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx node scripts/manage-blobs.mjs
import { readFile } from 'node:fs/promises';
import { put, del, list } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('Missing BLOB_READ_WRITE_TOKEN env var.');
  process.exit(1);
}

const UPLOADS = [
  {
    file: '/Users/meetanilbhanushali/Downloads/CozyLivingRoomEntertainment_Setup.spz',
    pathname: 'CozyLivingRoomEntertainment_Setup.spz',
  },
  {
    file: '/Users/meetanilbhanushali/Downloads/FireDamagedApartment_Interior.spz',
    pathname: 'FireDamagedApartment_Interior.spz',
  },
];

const DELETE_PATHNAMES = [
  'gs_House.ply',
  'gs_BurnedHouse.ply',
  'gs_Not_Broken_Television.ply',
  'gs_Broken_Television.ply',
  'gs_Vase.ply',
];

async function main() {
  console.log('\n=== BEFORE: current blobs ===');
  const before = await list({ token });
  for (const b of before.blobs) console.log(`  ${b.pathname}  ${b.url}`);

  console.log('\n=== UPLOAD new scenes ===');
  for (const u of UPLOADS) {
    const data = await readFile(u.file);
    const res = await put(u.pathname, data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/octet-stream',
      token,
    });
    console.log(`  uploaded ${u.pathname} -> ${res.url} (${(data.length / 1e6).toFixed(1)} MB)`);
  }

  console.log('\n=== DELETE old blobs ===');
  // Resolve pathnames -> full URLs from the live listing (del needs the URL).
  const byPath = new Map(before.blobs.map((b) => [b.pathname, b.url]));
  for (const p of DELETE_PATHNAMES) {
    const url = byPath.get(p);
    if (!url) {
      console.log(`  skip ${p} (not found in store)`);
      continue;
    }
    await del(url, { token });
    console.log(`  deleted ${p}`);
  }

  console.log('\n=== AFTER: remaining blobs ===');
  const after = await list({ token });
  for (const b of after.blobs) console.log(`  ${b.pathname}  ${b.url}`);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Blob maintenance failed:', err);
  process.exit(1);
});
