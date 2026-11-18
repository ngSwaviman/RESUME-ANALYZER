const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');
const Job = require('../models/Job');
const MatchResult = require('../models/MatchResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { rankResumesAgainstJob } = require('../services/matchingService');

/** POST /api/applications/:jobId - candidate applies with their active resume */
const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw ApiError.notFound('Job not found.');
  if (job.status !== 'open') throw ApiError.badRequest('This job is no longer accepting applications.');

  const candidate = await Candidate.findOne({ user: req.user._id }).populate('resume');
  if (!candidate) throw ApiError.notFound('Candidate profile not found.');
  if (!candidate.resume) throw ApiError.badRequest('Upload a resume before applying to a job.');

  const existing = await Application.findOne({ job: job._id, candidate: candidate._id });
  if (existing) throw ApiError.conflict('You have already applied to this job.');

  const [analysis] = rankResumesAgainstJob(job, [
    {
      resume: candidate.resume,
      candidate: { _id: candidate._id, name: req.user.name },
    },
  ]);

  const application = await Application.create({
    job: job._id,
    candidate: candidate._id,
    recruiter: job.recruiter,
    resume: candidate.resume._id,
    coverLetter: req.body.coverLetter || '',
    matchScore: analysis ? analysis.score : 0,
    matchedSkills: analysis ? analysis.matchedSkills : [],
    missingSkills: analysis ? analysis.missingSkills : [],
  });

  if (analysis) {
    await MatchResult.findOneAndUpdate(
      { job: job._id, candidate: candidate._id },
      {
        $set: {
          resume: candidate.resume._id,
          score: analysis.score,
          skillScore: analysis.skillScore,
          textScore: analysis.textScore,
          matchedSkills: analysis.matchedSkills,
          missingSkills: analysis.missingSkills,
          requiredSkills: analysis.requiredSkills,
          breakdown: analysis.breakdown,
          explanation: analysis.explanation,
          computedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully.',
    application,
    match: analysis
      ? {
          score: analysis.score,
          matchedSkills: analysis.matchedSkills,
          missingSkills: analysis.missingSkills,
          explanation: analysis.explanation,
        }
      : null,
  });
});

/** GET /api/applications/me */
const getMyApplications = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ user: req.user._id }).select('_id');
  if (!candidate) throw ApiError.notFound('Candidate profile not found.');

  const applications = await Application.find({ candidate: candidate._id })
    .populate('job', 'title company location workMode employmentType status salary requiredSkills')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: applications.length, applications });
});

/** GET /api/jobs/:jobId/applicants - recruiter view */
const getJobApplicants = asyncHandler(async (req, res) => {
  // Mounted as GET /api/jobs/:id/applicants
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found.');

  if (req.user.role === 'recruiter') {
    const recruiter = await Recruiter.findOne({ user: req.user._id });
    if (!recruiter || String(job.recruiter) !== String(recruiter._id)) {
      throw ApiError.forbidden('You can only view applicants for your own job postings.');
    }
  }

  const applications = await Application.find({ job: job._id })
    .populate({
      path: 'candidate',
      select: 'headline location skills education experience experienceYears resume profileCompletion user',
      populate: { path: 'user', select: 'name email phone' },
    })
    .sort({ matchScore: -1, createdAt: -1 });

  res.json({
    success: true,
    job: { _id: job._id, title: job.title, company: job.company, status: job.status },
    count: applications.length,
    applications,
  });
});

/** PATCH /api/applications/:id/status */
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!Application.APPLICATION_STATUS.includes(status)) {
    throw ApiError.badRequest(`Status must be one of: ${Application.APPLICATION_STATUS.join(', ')}.`);
  }

  const application = await Application.findById(req.params.id).populate('job', 'recruiter title');
  if (!application) throw ApiError.notFound('Application not found.');

  if (req.user.role === 'recruiter') {
    const recruiter = await Recruiter.findOne({ user: req.user._id });
    if (!recruiter || String(application.job.recruiter) !== String(recruiter._id)) {
      throw ApiError.forbidden('You can only manage applications for your own job postings.');
    }
  }

  application.status = status;
  application.reviewedAt = new Date();
  if (note !== undefined) application.recruiterNote = note;
  await application.save();

  res.json({ success: true, message: `Application marked as ${status}.`, application });
});

/** DELETE /api/applications/:id - candidate withdraws */
const withdrawApplication = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ user: req.user._id }).select('_id');
  if (!candidate) throw ApiError.notFound('Candidate profile not found.');

  const application = await Application.findOne({ _id: req.params.id, candidate: candidate._id });
  if (!application) throw ApiError.notFound('Application not found.');
  if (application.status !== 'applied') {
    throw ApiError.badRequest('Applications already under review cannot be withdrawn.');
  }

  await Application.deleteOne({ _id: application._id });
  res.json({ success: true, message: 'Application withdrawn.' });
});

/** GET /api/applications/recruiter/summary - pipeline counters for the recruiter dashboard */
const getRecruiterPipeline = asyncHandler(async (req, res) => {
  const recruiter = await Recruiter.findOne({ user: req.user._id });
  if (!recruiter) throw ApiError.notFound('Recruiter profile not found.');

  const jobIds = await Job.find({ recruiter: recruiter._id }).distinct('_id');
  const [totalApplications, byStatus, recent] = await Promise.all([
    Application.countDocuments({ job: { $in: jobIds } }),
    Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.find({ job: { $in: jobIds } })
      .populate('candidate', 'headline user')
      .populate('job', 'title')
      .sort({ createdAt: -1 })
      .limit(8),
  ]);

  res.json({
    success: true,
    totalApplications,
    byStatus: byStatus.map((row) => ({ status: row._id, count: row.count })),
    recent,
  });
});

module.exports = {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
  withdrawApplication,
  getRecruiterPipeline,
};
