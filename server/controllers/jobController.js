const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');
const Application = require('../models/Application');
const MatchResult = require('../models/MatchResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { canonicalSkill } = require('../services/skillDictionary');
const { getRequiredSkills } = require('../services/matchingService');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSkillList = (list = []) => {
  const output = [];
  list.forEach((item) => {
    const value = canonicalSkill(item);
    if (value && !output.some((skill) => skill.toLowerCase() === value.toLowerCase())) output.push(value);
  });
  return output;
};

const getRecruiterProfile = async (userId) => {
  const recruiter = await Recruiter.findOne({ user: userId });
  if (!recruiter) throw ApiError.badRequest('Recruiter profile not found for this account.');
  return recruiter;
};

const assertJobOwnership = async (job, user) => {
  if (user.role === 'admin') return;
  const recruiter = await Recruiter.findOne({ user: user._id });
  if (!recruiter || String(job.recruiter) !== String(recruiter._id)) {
    throw ApiError.forbidden('You can only manage jobs that belong to your company.');
  }
};

/** POST /api/jobs */
const createJob = asyncHandler(async (req, res) => {
  const recruiter = await getRecruiterProfile(req.user._id);

  const job = await Job.create({
    recruiter: recruiter._id,
    createdBy: req.user._id,
    title: req.body.title,
    company: req.body.company || recruiter.company,
    location: req.body.location || recruiter.location || 'Not specified',
    workMode: req.body.workMode || 'onsite',
    employmentType: req.body.employmentType || 'full-time',
    description: req.body.description,
    responsibilities: req.body.responsibilities || [],
    requiredSkills: normalizeSkillList(req.body.requiredSkills || []),
    preferredSkills: normalizeSkillList(req.body.preferredSkills || []),
    education: req.body.education || 'Any',
    minExperience: Number(req.body.minExperience) || 0,
    salary: req.body.salary || { min: 0, max: 0, currency: 'INR' },
    openings: Number(req.body.openings) || 1,
    status: req.body.status === 'closed' ? 'closed' : 'open',
    deadline: req.body.deadline || undefined,
  });

  res.status(201).json({ success: true, message: 'Job posted successfully.', job });
});

/** GET /api/jobs - public listing with search, filters and pagination */
const listJobs = asyncHandler(async (req, res) => {
  const {
    q,
    skill,
    location,
    workMode,
    employmentType,
    status,
    maxExperience,
    page = 1,
    limit = 12,
    mine,
  } = req.query;

  const filter = {};
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));

  if (mine === 'true') {
    if (!req.user) throw ApiError.unauthorized();
    const recruiter = await Recruiter.findOne({ user: req.user._id });
    if (!recruiter) throw ApiError.forbidden('Only recruiters have job postings.');
    filter.recruiter = recruiter._id;
  }

  if (status && ['open', 'closed'].includes(status)) filter.status = status;
  else if (mine !== 'true') filter.status = 'open';

  if (q) {
    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ title: regex }, { company: regex }, { description: regex }, { requiredSkills: regex }];
  }
  if (skill) filter.requiredSkills = { $in: [new RegExp(`^${escapeRegex(skill)}$`, 'i')] };
  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (workMode) filter.workMode = workMode;
  if (employmentType) filter.employmentType = employmentType;
  if (maxExperience !== undefined && maxExperience !== '') {
    filter.minExperience = { $lte: Number(maxExperience) || 0 };
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('recruiter', 'company designation website')
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Job.countDocuments(filter),
  ]);

  const applicationCounts = await Application.aggregate([
    { $match: { job: { $in: jobs.map((job) => job._id) } } },
    { $group: { _id: '$job', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(applicationCounts.map((row) => [String(row._id), row.count]));

  res.json({
    success: true,
    jobs: jobs.map((job) => ({ ...job, applicationCount: countMap.get(String(job._id)) || 0 })),
    pagination: {
      total,
      page: pageNumber,
      limit: pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
});

/** GET /api/jobs/:id */
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('recruiter', 'company designation website about');
  if (!job) throw ApiError.notFound('Job not found.');

  const applicationCount = await Application.countDocuments({ job: job._id });

  let alreadyApplied = false;
  if (req.user && req.user.role === 'candidate') {
    const candidate = await Candidate.findOne({ user: req.user._id }).select('_id');
    if (candidate) {
      alreadyApplied = Boolean(await Application.exists({ job: job._id, candidate: candidate._id }));
    }
  }

  res.json({
    success: true,
    job: { ...job.toObject(), applicationCount, requiredSkills: getRequiredSkills(job) },
    alreadyApplied,
  });
});

/** PUT /api/jobs/:id */
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found.');
  await assertJobOwnership(job, req.user);

  const fields = [
    'title',
    'company',
    'location',
    'workMode',
    'employmentType',
    'description',
    'responsibilities',
    'education',
    'status',
    'deadline',
    'salary',
    'openings',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) job[field] = req.body[field];
  });

  if (req.body.requiredSkills !== undefined) job.requiredSkills = normalizeSkillList(req.body.requiredSkills);
  if (req.body.preferredSkills !== undefined) job.preferredSkills = normalizeSkillList(req.body.preferredSkills);
  if (req.body.minExperience !== undefined) job.minExperience = Number(req.body.minExperience) || 0;
  if (req.body.openings !== undefined) job.openings = Math.max(1, Number(req.body.openings) || 1);

  await job.save();

  // Skills may have changed - stale scores are no longer valid.
  await MatchResult.deleteMany({ job: job._id });

  res.json({ success: true, message: 'Job updated successfully.', job });
});

/** DELETE /api/jobs/:id */
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found.');
  await assertJobOwnership(job, req.user);

  await Promise.all([
    Application.deleteMany({ job: job._id }),
    MatchResult.deleteMany({ job: job._id }),
    Job.deleteOne({ _id: job._id }),
  ]);

  res.json({ success: true, message: 'Job and its applications were removed.' });
});

/** GET /api/jobs/meta/skills - popular skills for filters */
const getSkillFacets = asyncHandler(async (req, res) => {
  const rows = await Job.aggregate([
    { $match: { status: 'open' } },
    { $unwind: '$requiredSkills' },
    { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 20 },
  ]);

  res.json({ success: true, skills: rows.map((row) => ({ skill: row._id, count: row.count })) });
});

module.exports = { createJob, listJobs, getJob, updateJob, deleteJob, getSkillFacets, normalizeSkillList };
