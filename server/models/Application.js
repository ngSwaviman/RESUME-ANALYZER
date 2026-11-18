const mongoose = require('mongoose');

const APPLICATION_STATUS = ['applied', 'shortlisted', 'on-hold', 'rejected'];

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter', index: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    status: { type: String, enum: APPLICATION_STATUS, default: 'applied', index: true },
    coverLetter: { type: String, trim: true, default: '', maxlength: 3000 },
    matchScore: { type: Number, default: 0 },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    recruiterNote: { type: String, trim: true, default: '' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// One application per candidate per job.
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ createdAt: -1 });

applicationSchema.statics.APPLICATION_STATUS = APPLICATION_STATUS;

module.exports = mongoose.model('Application', applicationSchema);
