const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [120, 'Job title cannot exceed 120 characters'],
    },
    company: { type: String, required: [true, 'Company name is required'], trim: true },
    location: { type: String, trim: true, default: 'Not specified' },
    workMode: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'],
      default: 'onsite',
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'contract'],
      default: 'full-time',
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      minlength: [40, 'Job description should be at least 40 characters'],
    },
    responsibilities: [{ type: String, trim: true }],
    requiredSkills: {
      type: [{ type: String, trim: true }],
      validate: {
        validator: (skills) => Array.isArray(skills) && skills.length > 0,
        message: 'At least one required skill is needed for matching',
      },
    },
    preferredSkills: [{ type: String, trim: true }],
    education: { type: String, trim: true, default: 'Any' },
    minExperience: { type: Number, default: 0, min: 0 },
    salary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    openings: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    deadline: { type: Date },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });

jobSchema.virtual('experienceLabel').get(function experienceLabel() {
  return this.minExperience > 0 ? `${this.minExperience}+ years` : 'Fresher friendly';
});

jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
