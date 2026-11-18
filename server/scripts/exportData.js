/**
 * Export every collection from the connected MongoDB database to JSON files.
 *
 *   cd server
 *   npm run export:data
 *
 * Writes to <project>/data-export/ — one JSON file per collection plus a
 * manifest describing the source database and document counts.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('../config/db');

const OUT_DIR = path.join(__dirname, '..', '..', 'data-export');

const run = async () => {
  await connectDB();

  const db = mongoose.connection.db;
  const existing = await db.listCollections().toArray();
  const collections = existing
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('system.'))
    .sort();

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = {
    exportedAt: new Date().toISOString(),
    database: db.databaseName,
    host: mongoose.connection.host,
    collections: {},
  };

  for (const name of collections) {
    // eslint-disable-next-line no-await-in-loop
    const docs = await db.collection(name).find({}).toArray();
    manifest.collections[name] = docs.length;
    if (!docs.length) continue;
    fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(docs, null, 2));
  }

  fs.writeFileSync(path.join(OUT_DIR, '_manifest.json'), JSON.stringify(manifest, null, 2));

  // eslint-disable-next-line no-console
  console.log(`[export] ${db.databaseName} -> ${OUT_DIR}`);
  Object.entries(manifest.collections).forEach(([name, count]) => {
    // eslint-disable-next-line no-console
    console.log(`[export]   ${name.padEnd(16)} ${count} documents`);
  });

  await mongoose.disconnect();
};

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('[export] Failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
