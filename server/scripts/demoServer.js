/**
 * Optional zero-install demo: starts an in-memory MongoDB, seeds the demo data
 * and boots the API in a single process.
 *
 *   cd server
 *   npm run demo
 *
 * Data lives only for the lifetime of this process - use a real local or Atlas
 * MongoDB (npm start + npm run seed) for persistent data.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('resume_analyzer');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'local_demo_secret_change_me';
  process.env.SEED_DEMO = '1';
  // eslint-disable-next-line no-console
  console.log(`[demo] In-memory MongoDB started at ${process.env.MONGO_URI}`);

  const { seed } = require('./seed');
  await seed();

  // Disconnect so the API boots its own connection cleanly.
  await mongoose.disconnect();
  require('../server');

  const shutdown = async () => {
    await mongoose.disconnect().catch(() => {});
    await mongod.stop().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[demo] Failed to start:', error);
  process.exit(1);
});
