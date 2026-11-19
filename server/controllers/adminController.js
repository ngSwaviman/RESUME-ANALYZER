const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const Application = require('../models/Application');
const MatchResult = require('../models/MatchResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/** GET /api/admin/stats */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalCandidates,
    totalRecruiters,
    totalResumes,
    totalJobs,
    openJobs,
    totalApplications,
    totalMatches,
  ] = await Promise.all([
    User.countDocuments({ role: 'candidate' }),
    User.countDocuments({ role: 'recruiter' }),
    Resume.countDocuments(),
    Job.countDocuments(),
    Job.countDocuments({ status: 'open' }),
    Application.countDocuments(),
    MatchResult.countDocuments(),
  ]);

  const [
    topCandidates,
    applicationsByStatus,
    scoreBuckets,
    averageScoreRow,
    topSkills,
    recentUsers,
    recentResumes,
    recentJobs,
    recentApplications,
    jobsByRecruiter,
  ] = await Promise.all([
    MatchResult.aggregate([
      { $group: { _id: '$candidate', bestScore: { $max: '$score' }, avgScore: { $avg: '$score' }, evaluations: { $sum: 1 } } },
      { $sort: { bestScore: -1, avgScore: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'candidates', localField: '_id', foreignField: '_id', as: 'candidate' } },
      { $unwind: '$candidate' },
      { $lookup: { from: 'users', localField: 'candidate.user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          candidateId: '$_id',
          name: '$user.name',
          email: '$user.email',
          headline: '$candidate.headline',
          bestScore: { $round: ['$bestScore', 1] },
          avgScore: { $round: ['$avgScore', 1] },
          evaluations: 1,
        },
      },
    ]),
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    MatchResult.aggregate([
      { $bucket: { groupBy: '$score', boundaries: [0, 20, 40, 60, 80, 101], default: 'other', output: { count: { $sum: 1 } } } },
    ]),
    MatchResult.aggregate([{ $group: { _id: null, avg: { $avg: '$score' } } }]),
    Candidate.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select('name role createdAt'),
    Resume.find().sort({ uploadedAt: -1 }).limit(5).populate('user', 'name'),
    Job.find().sort({ createdAt: -1 }).limit(5).select('title company createdAt'),
    Application.find().sort({ createdAt: -1 }).limit(5).populate('job', 'title').populate({ path: 'candidate', populate: { path: 'user', select: 'name' } }),
    Job.aggregate([
      { $group: { _id: '$recruiter', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'recruiters', localField: '_id', foreignField: '_id', as: 'recruiter' } },
      { $unwind: '$recruiter' },
      { $project: { _id: 0, company: '$recruiter.company', count: 1 } },
    ]),
  ]);

  const scoreRanges = ['0-20', '20-40', '40-60', '60-80', '80-100'];
  const boundaries = [0, 20, 40, 60, 80];
  const scoreDistribution = boundaries.map((boundary, index) => ({
    range: scoreRanges[index],
    count: (scoreBuckets.find((bucket) => bucket._id === boundary) || {}).count || 0,
  }));

  const activities = [
    ...recentUsers.map((user) => ({
      type: 'registration',
      message: `${user.name} registered as a ${user.role}`,
      at: user.createdAt,
    })),
    ...recentResumes.map((resume) => ({
      type: 'resume',
      message: `${resume.user?.name || 'A candidate'} uploaded ${resume.originalName}`,
      at: resume.uploadedAt,
    })),
    ...recentJobs.map((job) => ({
      type: 'job',
      message: `${job.company} posted ${job.title}`,
      at: job.createdAt,
    })),
    ...recentApplications.map((application) => ({
      type: 'application',
      message: `${application.candidate?.user?.name || 'A candidate'} applied for ${application.job?.title || 'a job'}`,
      at: application.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 10);

  res.json({
    success: true,
    totals: {
      candidates: totalCandidates,
      recruiters: totalRecruiters,
      resumes: totalResumes,
      jobs: totalJobs,
      openJobs,
      applications: totalApplications,
      matches: totalMatches,
      averageMatchScore: Math.round(((averageScoreRow[0] || {}).avg || 0) * 10) / 10,
    },
    topCandidates,
    applicationsByStatus: applicationsByStatus.map((row) => ({ status: row._id, count: row.count })),
    scoreDistribution,
    topSkills: topSkills.map((row) => ({ skill: row._id, count: row.count })),
    activities,
    jobsByRecruiter,
  });
});

/** GET /api/admin/users?role=candidate */
const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role && User.ROLES.includes(req.query.role)) filter.role = req.query.role;
  if (req.query.q) {
    const regex = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, count: users.length, users: users.map((user) => user.toSafeObject()) });
});

/** PATCH /api/admin/users/:id/approval */
const setRecruiterApproval = asyncHandler(async (req, res) => {
  const status = String(req.body.status || '').toLowerCase();
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    throw ApiError.badRequest('status must be "approved", "rejected" or "pending".');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  if (user.role !== 'recruiter') throw ApiError.badRequest('Only recruiter accounts need approval.');

  user.approvalStatus = status;
  await user.save({ validateBeforeSave: false });

  const labels = { approved: 'approved', rejected: 'rejected', pending: 'put back to pending' };
  res.json({
    success: true,
    message: `${user.name} is now ${labels[status]}.`,
    user: user.toSafeObject(),
  });
});

/** PATCH /api/admin/users/:id/status */
const toggleUserStatus = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot deactivate your own admin account.');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  if (user.role === 'admin') throw ApiError.forbidden('Admin accounts cannot be deactivated from the dashboard.');

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: `${user.name} is now ${user.isActive ? 'active' : 'deactivated'}.`,
    user: user.toSafeObject(),
  });
});

module.exports = { getDashboardStats, listUsers, toggleUserStatus, setRecruiterApproval };
