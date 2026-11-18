/**
 * Reset the database to production-style state:
 *   - removes every demo account and all candidate / recruiter data
 *   - deletes the uploaded demo PDFs
 *   - keeps exactly one administrator account, created from .env
 *
 *   cd server
 *   npm run reset:data
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const Application = require('../models/Application');
const MatchResult = require('../models/MatchResult');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';
const ADMIN_NAME = process.env.ADMIN_NAME || 'System Administrator';

const clearUploads = () => {
  if (!fs.existsSync(UPLOAD_DIR)) return;
  fs.readdirSync(UPLOAD_DIR)
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .forEach((file) => {
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, file));
      } catch (error) {
        // ignore locked files
      }
    });
};

const run = async () => {
  await connectDB();

  await Promise.all([
    Candidate.deleteMany({}),
    Recruiter.deleteMany({}),
    Resume.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    MatchResult.deleteMany({}),
    User.deleteMany({}),
  ]);
  clearUploads();

  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
  });

  const users = await User.countDocuments();

  // eslint-disable-next-line no-console
  console.log('[reset] Demo accounts and all candidate/recruiter data removed.');
  console.log(`[reset] Remaining users: ${users} (administrator only)`);
  console.log(`[reset] Admin login: ${admin.email}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('[reset] Failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
