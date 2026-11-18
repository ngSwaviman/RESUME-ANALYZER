/**
 * Seed script - creates demo accounts, real PDF resumes, jobs, applications and
 * persisted match results.
 *
 *   cd server
 *   npm run seed
 *
 * Every resume is rendered to an actual PDF, then run through the same
 * extraction + parsing + matching pipeline the application uses, so all scores
 * in the database are computed by the algorithm.
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
const { buildResumePdf } = require('../utils/pdfGenerator');
const { extractTextFromPdf } = require('../services/pdfService');
const { parseResumeText } = require('../services/resumeParser');
const { rankResumesAgainstJob } = require('../services/matchingService');
const { canonicalSkill } = require('../services/skillDictionary');
const { SAMPLE_CANDIDATES, SAMPLE_RECRUITERS, SAMPLE_JOBS } = require('../utils/sampleData');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'User@12345';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const canonicalSkills = (list = []) => {
  const output = [];
  list.forEach((item) => {
    const value = canonicalSkill(item);
    if (value && !output.some((skill) => skill.toLowerCase() === value.toLowerCase())) output.push(value);
  });
  return output;
};

const mapParsedEducation = (lines = []) =>
  lines.map((line) => {
    const [degree, institution] = String(line).split(' — ');
    return { degree: (degree || line).trim(), institution: (institution || '').trim() };
  });

const clearUploads = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    return;
  }
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

const seed = async () => {
  await connectDB();

  const withDemo = process.env.SEED_DEMO === '1';

  // Default mode: make sure the single administrator account exists and touch
  // nothing else. Real candidates and recruiters register themselves.
  if (!withDemo) {
    let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (admin) {
      admin.name = process.env.ADMIN_NAME || admin.name;
      admin.role = 'admin';
      admin.isActive = true;
      admin.password = ADMIN_PASSWORD;
      await admin.save();
    } else {
      admin = await User.create({
        name: process.env.ADMIN_NAME || 'System Administrator',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
      });
    }
    // eslint-disable-next-line no-console
    console.log(`[seed] Administrator ready: ${admin.email}`);
    // eslint-disable-next-line no-console
    console.log('[seed] Demo data is off. Set SEED_DEMO=1 to load the sample candidates, recruiters and jobs.');
    await mongoose.disconnect();
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[seed] Demo mode: clearing existing collections...');

  await Promise.all([
    User.deleteMany({}),
    Candidate.deleteMany({}),
    Recruiter.deleteMany({}),
    Resume.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    MatchResult.deleteMany({}),
  ]);
  clearUploads();

  // ---- Admin -------------------------------------------------------------
  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'System Administrator',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
  });

  // ---- Recruiters --------------------------------------------------------
  const recruiterDocs = [];
  for (const entry of SAMPLE_RECRUITERS) {
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create({ ...entry.user, password: DEFAULT_PASSWORD });
    // eslint-disable-next-line no-await-in-loop
    const recruiter = await Recruiter.create({
      user: user._id,
      company: entry.company,
      designation: entry.designation,
      website: entry.website,
      location: entry.location,
      industry: entry.industry,
      about: entry.about,
      companySize: entry.companySize,
    });
    recruiterDocs.push({ email: entry.user.email, recruiter });
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] Created ${recruiterDocs.length} recruiters.`);

  // ---- Candidates + real PDF resumes ------------------------------------
  const candidateDocs = [];
  for (const entry of SAMPLE_CANDIDATES) {
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create({ ...entry.user, password: DEFAULT_PASSWORD });
    // eslint-disable-next-line no-await-in-loop
    const candidate = await Candidate.create({
      user: user._id,
      headline: entry.profile.headline,
      location: entry.profile.location,
      links: entry.profile.links || {},
    });

    // 1. Render the demo resume to a real PDF and store it like an upload.
    // eslint-disable-next-line no-await-in-loop
    const pdfBuffer = await buildResumePdf(entry.resume);
    const storedName = `seed-${slug(entry.user.name)}.pdf`;
    const filePath = path.join(UPLOAD_DIR, storedName);
    fs.writeFileSync(filePath, pdfBuffer);

    // 2. Extract text and parse it with the production pipeline.
    // eslint-disable-next-line no-await-in-loop
    const { text, numPages } = await extractTextFromPdf(pdfBuffer);
    const analysis = parseResumeText(text);

    // eslint-disable-next-line no-await-in-loop
    const resume = await Resume.create({
      candidate: candidate._id,
      user: user._id,
      originalName: `${entry.user.name.replace(/\s+/g, '_')}_Resume.pdf`,
      storedName,
      filePath,
      mimeType: 'application/pdf',
      size: pdfBuffer.length,
      text,
      analysis,
      isActive: true,
    });

    candidate.resume = resume._id;
    candidate.skills = canonicalSkills(analysis.skills);
    candidate.education = mapParsedEducation(analysis.education);
    candidate.certifications = analysis.certifications;
    candidate.experienceYears = analysis.experienceYears;
    candidate.profileCompletion = 86;
    // eslint-disable-next-line no-await-in-loop
    await candidate.save();

    // eslint-disable-next-line no-console
    console.log(
      `[seed] ${entry.user.name}: ${numPages} page PDF, ${analysis.skills.length} skills, ${analysis.experienceYears} yr experience`
    );

    candidateDocs.push({ candidate, user, resume, name: entry.user.name });
  }

  // ---- Jobs --------------------------------------------------------------
  const jobDocs = [];
  for (const entry of SAMPLE_JOBS) {
    const owner = recruiterDocs.find((item) => item.email === entry.recruiterEmail);
    if (!owner) continue;

    // eslint-disable-next-line no-await-in-loop
    const job = await Job.create({
      recruiter: owner.recruiter._id,
      createdBy: owner.recruiter.user,
      title: entry.title,
      company: owner.recruiter.company,
      location: entry.location,
      workMode: entry.workMode,
      employmentType: entry.employmentType,
      description: entry.description,
      responsibilities: entry.responsibilities,
      requiredSkills: canonicalSkills(entry.requiredSkills),
      preferredSkills: canonicalSkills(entry.preferredSkills),
      education: entry.education,
      minExperience: entry.minExperience,
      salary: entry.salary,
      openings: entry.openings,
      status: 'open',
    });
    jobDocs.push(job);
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] Created ${jobDocs.length} jobs.`);

  // ---- Matching ----------------------------------------------------------
  const entries = candidateDocs.map((item) => ({
    resume: item.resume,
    candidate: { _id: item.candidate._id, name: item.name },
  }));

  const scoresByJob = new Map();
  const matchOperations = [];

  jobDocs.forEach((job) => {
    const ranked = rankResumesAgainstJob(job, entries);
    scoresByJob.set(String(job._id), ranked);

    ranked.forEach((row) => {
      if (!row.candidate || !row.candidate._id) return;
      matchOperations.push({
        updateOne: {
          filter: { job: job._id, candidate: row.candidate._id },
          update: {
            $set: {
              resume: row.resume,
              score: row.score,
              skillScore: row.skillScore,
              textScore: row.textScore,
              matchedSkills: row.matchedSkills,
              missingSkills: row.missingSkills,
              requiredSkills: row.requiredSkills,
              breakdown: row.breakdown,
              explanation: row.explanation,
              computedAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    });
  });

  if (matchOperations.length) await MatchResult.bulkWrite(matchOperations);
  // eslint-disable-next-line no-console
  console.log(`[seed] Stored ${matchOperations.length} match results.`);

  // ---- Applications ------------------------------------------------------
  // Each candidate applies to their two best-fitting jobs (score >= 50).
  let applicationCount = 0;
  const applicationLines = [];

  for (const item of candidateDocs) {
    const scoredJobs = jobDocs
      .map((job) => ({
        job,
        result: (scoresByJob.get(String(job._id)) || []).find(
          (row) => String(row.candidate._id) === String(item.candidate._id)
        ),
      }))
      .filter((row) => row.result)
      .sort((a, b) => b.result.score - a.result.score)
      .slice(0, 2);

    for (const [index, row] of scoredJobs.entries()) {
      if (row.result.score < 45) continue;

      // eslint-disable-next-line no-await-in-loop
      const application = await Application.create({
        job: row.job._id,
        candidate: item.candidate._id,
        recruiter: row.job.recruiter,
        resume: item.resume._id,
        status: index === 0 ? 'shortlisted' : 'applied',
        coverLetter:
          'I am excited about this role and believe my project experience maps well to the requirements listed in the job description.',
        matchScore: row.result.score,
        matchedSkills: row.result.matchedSkills,
        missingSkills: row.result.missingSkills,
        reviewedAt: index === 0 ? new Date() : undefined,
      });

      applicationCount += 1;
      applicationLines.push(
        `  ${item.name.padEnd(20)} -> ${row.job.title.padEnd(30)} ${String(row.result.score).padStart(5)}%  [${application.status}]`
      );
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] Created ${applicationCount} applications:\n${applicationLines.join('\n')}`);

  // ---- Summary -----------------------------------------------------------
  // eslint-disable-next-line no-console
  console.log('\n================ DEMO ACCOUNTS ================');
  console.log(`Admin      : ${admin.email} / ${ADMIN_PASSWORD}`);
  recruiterDocs.forEach(({ email }) => console.log(`Recruiter  : ${email} / ${DEFAULT_PASSWORD}`));
  candidateDocs.forEach(({ user }) => console.log(`Candidate  : ${user.email} / ${DEFAULT_PASSWORD}`));
  console.log('===============================================');
  console.log('\nDemo data ready. Start the API and the React app to explore it.');

  await mongoose.disconnect();
};

// Allow the demo server (scripts/demoServer.js) to reuse the same seeding logic.
module.exports = { seed };

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(async (error) => {
      // eslint-disable-next-line no-console
      console.error('[seed] Failed:', error);
      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    });
}
