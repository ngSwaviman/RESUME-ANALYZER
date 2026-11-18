const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');
const Resume = require('../models/Resume');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../middleware/auth');
const { canonicalSkill } = require('../services/skillDictionary');

const findProfile = async (user) => {
  if (!user) return null;
  if (user.role === 'candidate') return Candidate.findOne({ user: user._id });
  if (user.role === 'recruiter') return Recruiter.findOne({ user: user._id });
  return null;
};

const uniqueSkills = (list = []) => {
  const output = [];
  list.forEach((item) => {
    const value = canonicalSkill(item);
    if (value && !output.some((skill) => skill.toLowerCase() === value.toLowerCase())) output.push(value);
  });
  return output;
};

/** POST /api/auth/register */
const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role = 'candidate',
    phone = '',
    headline = '',
    company,
    designation,
    location = '',
    website = '',
    industry = '',
    about = '',
  } = req.body;

  if (!['candidate', 'recruiter'].includes(role)) {
    throw ApiError.badRequest('Role must be either "candidate" or "recruiter".');
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists. Please log in.');

  if (role === 'recruiter' && !company) {
    throw ApiError.badRequest('Company name is required for recruiter accounts.');
  }

  const user = await User.create({ name, email, password, role, phone });

  try {
    if (role === 'recruiter') {
      await Recruiter.create({
        user: user._id,
        company,
        designation: designation || 'Recruiter',
        location,
        website,
        industry,
        about,
      });
    } else {
      await Candidate.create({ user: user._id, headline, location });
    }
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  const profile = await findProfile(user);
  const token = signToken(user);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user: user.toSafeObject(),
    profile,
  });
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated. Contact the administrator.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const profile = await findProfile(user);

  res.json({
    success: true,
    message: 'Logged in successfully.',
    token: signToken(user),
    user: user.toSafeObject(),
    profile,
  });
});

/** GET /api/auth/me */
const me = asyncHandler(async (req, res) => {
  const profile = await findProfile(req.user);
  let resume = null;

  if (req.user.role === 'candidate') {
    resume = await Resume.findOne({ user: req.user._id, isActive: true }).select(
      'originalName analysis.skills analysis.name analysis.experienceYears uploadedAt size'
    );
  }

  res.json({
    success: true,
    user: req.user.toSafeObject(),
    profile,
    resume,
  });
});

/** PUT /api/auth/profile */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.unauthorized();

  if (req.body.name) user.name = req.body.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  await user.save({ validateBeforeSave: false });

  if (user.role === 'candidate') {
    const candidate =
      (await Candidate.findOne({ user: user._id })) || (await Candidate.create({ user: user._id }));
    const allowed = ['headline', 'summary', 'location', 'links', 'education', 'experience'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) candidate[field] = req.body[field];
    });
    if (Array.isArray(req.body.skills)) candidate.skills = uniqueSkills(req.body.skills);
    if (Array.isArray(req.body.certifications)) {
      candidate.certifications = req.body.certifications.filter(Boolean).map((item) => String(item).trim());
    }

    const checks = [
      candidate.headline,
      candidate.location,
      candidate.skills.length >= 3,
      candidate.education.length > 0,
      candidate.experience.length > 0,
      Boolean(candidate.resume),
      Boolean(candidate.links?.linkedin || candidate.links?.github),
    ];
    candidate.profileCompletion = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    await candidate.save();
    return res.json({ success: true, message: 'Profile updated.', user: user.toSafeObject(), profile: candidate });
  }

  const recruiter = await Recruiter.findOne({ user: user._id });
  if (recruiter) {
    ['company', 'designation', 'website', 'location', 'industry', 'about', 'companySize'].forEach((field) => {
      if (req.body[field] !== undefined) recruiter[field] = req.body[field];
    });
    await recruiter.save();
  }

  return res.json({ success: true, message: 'Profile updated.', user: user.toSafeObject(), profile: recruiter });
});

/** PUT /api/auth/password */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    throw ApiError.badRequest('New password must be at least 6 characters long.');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully.' });
});

module.exports = { register, login, me, updateProfile, changePassword };
