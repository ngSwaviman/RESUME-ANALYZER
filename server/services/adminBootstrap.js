const User = require('../models/User');

/**
 * Deployment bootstrap for the administrator account.
 *
 * `npm run seed` is a local-only step, so a fresh Render deployment had no
 * admin user in the database and the login failed with "Invalid email or
 * password" even though the same credentials worked on localhost. This runs on
 * every boot and guarantees the account from ADMIN_EMAIL / ADMIN_PASSWORD
 * exists, matching what `npm run seed` creates locally.
 *
 * The password is only written when the account is created, so changing it from
 * the app is not reverted by a redeploy.
 */
const ensureAdminUser = async () => {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.warn('[bootstrap] ADMIN_EMAIL/ADMIN_PASSWORD not set - skipped administrator bootstrap.');
    return null;
  }

  const existing = await User.findOne({ email });

  if (existing) {
    let changed = false;
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      changed = true;
    }
    if (!existing.isActive) {
      existing.isActive = true;
      changed = true;
    }
    if (changed) await existing.save({ validateBeforeSave: false });
    // eslint-disable-next-line no-console
    console.log(`[bootstrap] Administrator available: ${existing.email}`);
    return existing;
  }

  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'System Administrator',
    email,
    password,
    role: 'admin',
    isActive: true,
  });

  // eslint-disable-next-line no-console
  console.log(`[bootstrap] Administrator created: ${admin.email}`);
  return admin;
};

module.exports = { ensureAdminUser };
