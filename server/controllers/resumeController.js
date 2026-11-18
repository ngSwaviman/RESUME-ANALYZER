const fs = require('fs');
const path = require('path');
const Resume = require('../models/Resume');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');
const Job = require('../models/Job');
const MatchResult = require('../models/MatchResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { extractTextFromPdf, extractEmbeddedJpeg } = require('../services/pdfService');
const { parseResumeText } = require('../services/resumeParser');
const { removeFile } = require('../middleware/upload');

const MAX_PHOTO_BYTES = 400 * 1024;
const MAX_PHOTO_URI_LENGTH = Math.round(MAX_PHOTO_BYTES * 1.37);

/** Largest JPEG embedded in the PDF as a data URI (profile photo), else ''. */
const buildPhotoDataUri = (buffer) => {
  try {
    const jpeg = extractEmbeddedJpeg(buffer);
    if (!jpeg || jpeg.length > MAX_PHOTO_BYTES) return '';
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  } catch (error) {
    return '';
  }
};

/**
 * Prefer the photo decoded by pdf.js (JPEG or PNG, re-encoded as PNG) and fall
 * back to the raw JPEG scan when that is missing or too large.
 */
const pickPhoto = (extracted, buffer) => {
  const candidates = [extracted?.photo, buildPhotoDataUri(buffer)].filter(Boolean);
  return candidates.find((value) => value.length <= MAX_PHOTO_URI_LENGTH) || '';
};

/**
 * The stored PDF, preferring the copy in MongoDB so uploads survive redeploys on
 * hosts with an ephemeral filesystem.
 */
const readResumeBuffer = async (resume) => {
  if (resume.fileData && resume.fileData.length) return resume.fileData;
  if (resume.filePath && fs.existsSync(resume.filePath)) return fs.promises.readFile(resume.filePath);
  return null;
};

const MERGE_SKILLS = (existing = [], incoming = []) => {
  const output = [...existing];
  incoming.forEach((skill) => {
    const value = String(skill).trim();
    if (!value) return;
    if (output.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    output.push(value);
  });
  return output.slice(0, 60);
};

const mapParsedEducation = (lines = []) =>
  lines.map((line) => {
    const [degree, institution] = String(line).split(' — ');
    return { degree: (degree || line).trim(), institution: (institution || '').trim() };
  });

const computeCompletion = (candidate) => {
  const checks = [
    candidate.headline,
    candidate.location,
    candidate.skills.length >= 3,
    candidate.education.length > 0,
    candidate.experience.length > 0 || candidate.experienceYears > 0,
    Boolean(candidate.resume),
    Boolean(candidate.links?.linkedin || candidate.links?.github || candidate.links?.portfolio),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const getCandidateProfile = async (userId) => {
  const candidate = await Candidate.findOne({ user: userId });
  if (!candidate) throw ApiError.notFound('Candidate profile not found. Please complete your profile.');
  return candidate;
};

/** POST /api/resumes/upload - multipart field name: "resume" */
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file received. Attach a PDF using the "resume" form field.');
  }

  const candidate = await getCandidateProfile(req.user._id);

  let extracted;
  let photo = '';
  let fileBuffer;
  try {
    const buffer = await fs.promises.readFile(req.file.path);
    fileBuffer = buffer;
    // Verify the file really is a PDF (guards against renamed non-PDF files).
    if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw new Error('This file is not a valid PDF.');
    }
    extracted = await extractTextFromPdf(buffer);
    photo = pickPhoto(extracted, buffer);
  } catch (error) {
    removeFile(req.file.path);
    throw ApiError.badRequest(error.message || 'Could not read the uploaded PDF.');
  }

  if (!extracted.text || extracted.text.replace(/\s/g, '').length < 60) {
    removeFile(req.file.path);
    throw ApiError.badRequest(
      'This PDF has no text layer — it looks like a scan or a photo saved as PDF. Open the original document and use "Save as PDF" / "Export to PDF" from Word, Google Docs or Canva, then upload that file.'
    );
  }

  const analysis = parseResumeText(extracted.text);

  // Keep earlier uploads as history but only one active resume per candidate.
  await Resume.updateMany({ candidate: candidate._id, isActive: true }, { $set: { isActive: false } });

  const resume = await Resume.create({
    candidate: candidate._id,
    user: req.user._id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    filePath: req.file.path,
    mimeType: req.file.mimetype,
    size: req.file.size,
    text: extracted.text,
    analysis,
    photo,
    fileData: fileBuffer,
    isActive: true,
  });

  candidate.resume = resume._id;
  candidate.skills = MERGE_SKILLS(candidate.skills, analysis.skills);
  if (!candidate.education.length && analysis.education.length) {
    candidate.education = mapParsedEducation(analysis.education);
  }
  if (!candidate.certifications.length && analysis.certifications.length) {
    candidate.certifications = analysis.certifications;
  }
  if (!candidate.experienceYears && analysis.experienceYears) {
    candidate.experienceYears = analysis.experienceYears;
  }
  if (!candidate.headline && analysis.headline) {
    candidate.headline = analysis.headline;
  }
  if (!candidate.headline && analysis.skills.length) {
    candidate.headline = `${analysis.skills[0]} Developer`;
  }
  if (!candidate.location && analysis.headerPreview) {
    const match = analysis.headerPreview.match(
      /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?,\s(?:Odisha|Telangana|Karnataka|Maharashtra|Delhi|West Bengal|Tamil Nadu|Andhra Pradesh|Gujarat|Rajasthan|Kerala|Punjab|Haryana|Bihar|Jharkhand))/
    );
    if (match) candidate.location = match[1];
  }
  candidate.profileCompletion = computeCompletion(candidate);
  await candidate.save();

  res.status(201).json({
    success: true,
    message: 'Resume uploaded and analysed successfully.',
    resume: {
      id: resume._id,
      originalName: resume.originalName,
      size: resume.size,
      numPages: extracted.numPages,
      uploadedAt: resume.uploadedAt,
      analysis: resume.analysis,
      photo: resume.photo,
      textPreview: extracted.text.slice(0, 1200),
    },
    profile: candidate,
  });
});

/** GET /api/resumes/me */
const getMyResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ user: req.user._id, isActive: true }).sort({ uploadedAt: -1 });
  if (!resume) {
    return res.json({ success: true, resume: null, message: 'No resume uploaded yet.' });
  }

  res.json({
    success: true,
    resume: {
      id: resume._id,
      originalName: resume.originalName,
      size: resume.size,
      uploadedAt: resume.uploadedAt,
      analysis: resume.analysis,
      photo: resume.photo || '',
      textPreview: (resume.text || '').slice(0, 1500),
    },
  });
});

/** GET /api/resumes/:id - owner, recruiter or admin */
const getResumeById = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id).populate({
    path: 'candidate',
    populate: { path: 'user', select: 'name email phone' },
  });

  if (!resume) throw ApiError.notFound('Resume not found.');

  const isOwner = resume.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role === 'candidate') {
    throw ApiError.forbidden('You can only view your own resume.');
  }

  res.json({
    success: true,
    resume: {
      id: resume._id,
      originalName: resume.originalName,
      size: resume.size,
      uploadedAt: resume.uploadedAt,
      analysis: resume.analysis,
      photo: resume.photo || '',
      candidate: resume.candidate,
    },
  });
});

/** GET /api/resumes/:id/download - streams the stored PDF */
const downloadResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id).select('+fileData');
  if (!resume) throw ApiError.notFound('Resume not found.');

  const isOwner = resume.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role === 'candidate') {
    throw ApiError.forbidden('You can only download your own resume.');
  }

  const buffer = await readResumeBuffer(resume);
  if (!buffer) throw ApiError.notFound('The stored file is no longer available.');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${resume.originalName.replace(/"/g, '')}"`);
  res.send(buffer);
});

/** DELETE /api/resumes/:id */
const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) throw ApiError.notFound('Resume not found.');

  removeFile(resume.filePath);
  await Resume.deleteOne({ _id: resume._id });

  const candidate = await Candidate.findOne({ user: req.user._id });
  if (candidate && String(candidate.resume) === String(resume._id)) {
    const next = await Resume.findOne({ user: req.user._id }).sort({ uploadedAt: -1 });
    candidate.resume = next ? next._id : null;
    if (next) await Resume.updateOne({ _id: next._id }, { isActive: true });
    candidate.profileCompletion = computeCompletion(candidate);
    await candidate.save();
  }

  res.json({ success: true, message: 'Resume deleted.' });
});

/** POST /api/resumes/:id/reanalyze - rerun parsing on the stored text */
const reanalyzeResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id).select('+fileData');
  if (!resume) throw ApiError.notFound('Resume not found.');
  if (resume.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only reanalyse your own resume.');
  }

  resume.analysis = parseResumeText(resume.text);
  try {
    const buffer = await readResumeBuffer(resume);
    if (!buffer) throw new Error('The stored PDF is no longer available.');
    const extracted = await extractTextFromPdf(buffer);
    if (extracted.text) resume.text = extracted.text;
    resume.analysis = parseResumeText(resume.text);
    resume.photo = pickPhoto(extracted, buffer) || resume.photo;
  } catch (error) {
    // Photo extraction is best-effort; keep the existing value.
  }
  await resume.save();

  const candidate = await Candidate.findOne({ user: resume.user });
  if (candidate) {
    candidate.skills = MERGE_SKILLS(candidate.skills, resume.analysis.skills);
    candidate.profileCompletion = computeCompletion(candidate);
    await candidate.save();
  }

  res.json({ success: true, message: 'Resume re-analysed.', analysis: resume.analysis });
});

/** GET /api/resumes/candidate/:candidateId - recruiter/admin view of a candidate's active resume */
const getCandidateResume = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.candidateId).populate('user', 'name email phone');
  if (!candidate) throw ApiError.notFound('Candidate not found.');

  if (req.user.role === 'recruiter') {
    const recruiter = await Recruiter.findOne({ user: req.user._id });
    if (!recruiter) throw ApiError.forbidden('Recruiter profile not found.');
    const jobIds = (await Job.find({ recruiter: recruiter._id }).select('_id')).map((job) => job._id);
    const hasAccess = jobIds.length
      ? await MatchResult.exists({ candidate: candidate._id, job: { $in: jobIds } })
      : null;
    if (!hasAccess) {
      throw ApiError.forbidden(
        'Open the ranking for one of your job postings first - candidates become available once they are scored against your role.'
      );
    }
  } else if (req.user.role !== 'admin') {
    throw ApiError.forbidden('Only recruiters and administrators can view candidate resumes.');
  }

  const resume = await Resume.findOne({ candidate: candidate._id, isActive: true }).sort({ uploadedAt: -1 });
  if (!resume) throw ApiError.notFound('This candidate has not uploaded a resume yet.');

  const analysis = resume.analysis || {};
  res.json({
    success: true,
    candidate: {
      _id: candidate._id,
      name: candidate.user?.name || analysis.name || 'Candidate',
      // Prefer what the resume itself states; the account values are separate.
      email: analysis.email || candidate.user?.email || '',
      phone: analysis.phone || candidate.user?.phone || '',
      accountEmail: candidate.user?.email || '',
      accountPhone: candidate.user?.phone || '',
      headline: candidate.headline || analysis.headline || '',
      location: candidate.location || analysis.location || '',
      skills: candidate.skills || analysis.skills || [],
      profileCompletion: candidate.profileCompletion || 0,
    },
    resume: {
      id: resume._id,
      originalName: resume.originalName,
      size: resume.size,
      uploadedAt: resume.uploadedAt,
      photo: resume.photo || '',
      analysis,
      textPreview: (resume.text || '').slice(0, 2000),
      wordCount: analysis.wordCount || 0,
    },
  });
});

module.exports = {
  uploadResume,
  getMyResume,
  getResumeById,
  getCandidateResume,
  downloadResume,
  deleteResume,
  reanalyzeResume,
};
