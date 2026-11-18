const mongoose = require('mongoose');

/**
 * Persisted output of the matching engine so rankings are explainable and stable
 * between requests. Scores are always produced by the TF-IDF + skill-overlap
 * pipeline (see services/matchingService.js) - never hardcoded.
 */
const matchResultSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    score: { type: Number, required: true, min: 0, max: 100 },
    skillScore: { type: Number, default: 0, min: 0, max: 100 },
    textScore: { type: Number, default: 0, min: 0, max: 100 },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    requiredSkills: [{ type: String }],
    breakdown: {
      requiredFound: { type: Number, default: 0 },
      requiredTotal: { type: Number, default: 0 },
      cosineSimilarity: { type: Number, default: 0 },
      termCount: { type: Number, default: 0 },
      weights: {
        skills: { type: Number, default: 0.65 },
        text: { type: Number, default: 0.35 },
      },
    },
    explanation: { type: String, default: '' },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

matchResultSchema.index({ job: 1, candidate: 1 }, { unique: true });
matchResultSchema.index({ job: 1, score: -1 });

module.exports = mongoose.model('MatchResult', matchResultSchema);
