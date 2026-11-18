const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true, default: '' },
    institution: { type: String, trim: true, default: '' },
    field: { type: String, trim: true, default: '' },
    startYear: { type: Number },
    endYear: { type: Number },
    score: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    startDate: { type: String, trim: true, default: '' },
    endDate: { type: String, trim: true, default: '' },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    headline: { type: String, trim: true, default: '' },
    summary: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    skills: [{ type: String, trim: true }],
    education: [educationSchema],
    experience: [experienceSchema],
    certifications: [{ type: String, trim: true }],
    experienceYears: { type: Number, default: 0, min: 0 },
    links: {
      linkedin: { type: String, trim: true, default: '' },
      github: { type: String, trim: true, default: '' },
      portfolio: { type: String, trim: true, default: '' },
    },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

candidateSchema.index({ skills: 1 });
candidateSchema.index({ 'user.name': 1 });

module.exports = mongoose.model('Candidate', candidateSchema);
