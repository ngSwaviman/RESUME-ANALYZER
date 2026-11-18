const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true, trim: true },
    storedName: { type: String, required: true, trim: true },
    filePath: { type: String, required: true, trim: true },
    mimeType: { type: String, default: 'application/pdf' },
    size: { type: Number, required: true },
    text: { type: String, default: '' },
    analysis: {
      name: { type: String, default: '' },
      headline: { type: String, default: '' },
      summary: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      links: {
        linkedin: { type: String, default: '' },
        github: { type: String, default: '' },
        portfolio: { type: String, default: '' },
      },
      projects: [{ type: String }],
      skills: [{ type: String }],
      education: [{ type: String }],
      experience: [{ type: String }],
      certifications: [{ type: String }],
      experienceYears: { type: Number, default: 0 },
      wordCount: { type: Number, default: 0 },
      headerPreview: { type: String, default: '' },
      sectionsDetected: {
        email: { type: Boolean, default: false },
        phone: { type: Boolean, default: false },
        education: { type: Boolean, default: false },
        experience: { type: Boolean, default: false },
        skills: { type: Boolean, default: false },
        certifications: { type: Boolean, default: false },
      },
    },
    // Largest JPEG embedded in the PDF (profile photo), stored as a data URI.
    photo: { type: String, default: '' },
    // The uploaded PDF itself. Stored in MongoDB so downloads keep working on
    // hosts with an ephemeral filesystem (Render restarts/redeploys).
    fileData: { type: Buffer, select: false },
    isActive: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resumeSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
