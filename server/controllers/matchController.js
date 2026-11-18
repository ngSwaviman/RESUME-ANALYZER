const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');
const Resume = require('../models/Resume');
const MatchResult = require('../models/MatchResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { rankResumesAgainstJob, getRequiredSkills } = require('../services/matchingService');
const { extractSkills } = require('../services/skillExtractor');

const assertRecruiterOwnsJob = async (job, user) => {
  if (user.role === 'admin') return;
  const recruiter = await Recruiter.findOne({ user: user._id });
  if (!recruiter || String(job.recruiter) !== String(recruiter._id)) {
    throw ApiError.forbidden('You can only view rankings for your own job postings.');
  }
};

const persistMatches = async (jobId, ranked) => {
  if (!ranked.length) return;
  const operations = ranked
    .filter((row) => row.candidate && row.candidate._id)
    .map((row) => ({
      updateOne: {
        filter: { job: jobId, candidate: row.candidate._id },
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
    }));

  if (operations.length) await MatchResult.bulkWrite(operations);
};

const candidateSummary = (candidate) => ({
  _id: candidate._id,
  name: candidate.user?.name || '',
  email: candidate.user?.email || '',
  phone: candidate.user?.phone || '',
  headline: candidate.headline || '',
  location: candidate.location || '',
  skills: candidate.skills || [],
  education: candidate.education || [],
  experience: candidate.experience || [],
  experienceYears: candidate.experienceYears || 0,
  certifications: candidate.certifications || [],
  profileCompletion: candidate.profileCompletion || 0,
});

/**
 * GET /api/matches/job/:jobId
 * Runs the matching engine over every active resume and returns a ranked list.
 */
const rankCandidatesForJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw ApiError.notFound('Job not found.');
  await assertRecruiterOwnsJob(job, req.user);

  const resumes = await Resume.find({ isActive: true }).populate({
    path: 'candidate',
    populate: { path: 'user', select: 'name email phone' },
  });

  const entries = resumes
    .filter((resume) => resume.candidate)
    .map((resume) => ({ resume, candidate: candidateSummary(resume.candidate) }));

  const ranked = rankResumesAgainstJob(job, entries);
  await persistMatches(job._id, ranked);

  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

  res.json({
    success: true,
    job: {
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      minExperience: job.minExperience,
      education: job.education,
      requiredSkills: getRequiredSkills(job),
    },
    total: ranked.length,
    ranking: ranked.slice(0, limit).map((row, index) => ({
      rank: index + 1,
      score: row.score,
      skillScore: row.skillScore,
      textScore: row.textScore,
      matchedSkills: row.matchedSkills,
      missingSkills: row.missingSkills,
      preferredMatched: row.preferredMatched,
      educationMatch: row.educationMatch,
      experienceMatch: row.experienceMatch,
      explanation: row.explanation,
      breakdown: row.breakdown,
      candidate: row.candidate,
      resumeId: row.resume,
    })),
    note: 'Scores are decision support only. Every shortlist decision must be reviewed by a human recruiter.',
  });
});

/**
 * GET /api/matches/recommendations
 * Scores the candidate's resume against every open job.
 */
const recommendJobs = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ user: req.user._id }).populate('resume');
  if (!candidate || !candidate.resume) {
    throw ApiError.badRequest('Upload a resume first so we can recommend matching jobs.');
  }

  const jobs = await Job.find({ status: 'open' }).populate('recruiter', 'company designation');
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));

  const scored = jobs.map((job) => {
    const [result] = rankResumesAgainstJob(job, [
      { resume: candidate.resume, candidate: candidateSummary(candidate) },
    ]);
    return {
      job: {
        _id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        workMode: job.workMode,
        employmentType: job.employmentType,
        minExperience: job.minExperience,
        education: job.education,
        description: job.description,
        requiredSkills: getRequiredSkills(job),
        preferredSkills: job.preferredSkills,
        salary: job.salary,
        createdAt: job.createdAt,
      },
      score: result?.score || 0,
      skillScore: result?.skillScore || 0,
      textScore: result?.textScore || 0,
      matchedSkills: result?.matchedSkills || [],
      missingSkills: result?.missingSkills || [],
      explanation: result?.explanation || '',
    };
  });

  scored.sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    total: scored.length,
    recommendations: scored.slice(0, limit),
    candidateSkills: extractSkills(candidate.resume.text || ''),
  });
});

/**
 * GET /api/matches/candidate/:candidateId
 * Recruiter view: which of this candidate's matches rank highest.
 */
const getCandidateMatches = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.candidateId).populate('user', 'name email phone');
  if (!candidate) throw ApiError.notFound('Candidate not found.');

  const matches = await MatchResult.find({ candidate: candidate._id })
    .populate('job', 'title company location status')
    .sort({ score: -1 })
    .limit(20);

  res.json({
    success: true,
    candidate: candidateSummary(candidate),
    matches,
  });
});

/** GET /api/matches/job/:jobId/statistics - score distribution for charts */
const getJobMatchStatistics = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw ApiError.notFound('Job not found.');
  await assertRecruiterOwnsJob(job, req.user);

  const rows = await MatchResult.aggregate([
    { $match: { job: job._id } },
    {
      $bucket: {
        groupBy: '$score',
        boundaries: [0, 20, 40, 60, 80, 101],
        default: 'other',
        output: { count: { $sum: 1 } },
      },
    },
  ]);

  const labels = ['0-20', '20-40', '40-60', '60-80', '80-100'];
  const boundaries = [0, 20, 40, 60, 80];
  const distribution = boundaries.map((boundary, index) => {
    const row = rows.find((item) => item._id === boundary);
    return { range: labels[index], count: row ? row.count : 0 };
  });

  const scores = await MatchResult.find({ job: job._id }).select('score').lean();
  const average = scores.length
    ? Math.round((scores.reduce((sum, row) => sum + row.score, 0) / scores.length) * 10) / 10
    : 0;

  res.json({ success: true, distribution, average, evaluated: scores.length });
});

module.exports = {
  rankCandidatesForJob,
  recommendJobs,
  getCandidateMatches,
  getJobMatchStatistics,
};
