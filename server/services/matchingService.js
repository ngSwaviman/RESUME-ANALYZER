/**
 * Matching engine: combines dictionary skill overlap with TF-IDF cosine
 * similarity of the full documents.
 *
 * final score = 0.65 * skillCoverage + 0.35 * textSimilarity   (0-100)
 *
 * When a job has no detectable required skills the engine falls back to pure
 * text similarity instead of inventing a number.
 */
const { canonicalSkill, getSkillEntry } = require('./skillDictionary');
const { extractSkills } = require('./skillExtractor');
const { vectorizeCorpus, cosineSimilarity } = require('./tfidf');

const SKILL_WEIGHT = 0.65;
const TEXT_WEIGHT = 0.35;

const toArray = (value) => (Array.isArray(value) ? value : []);

const uniqueCanonicalSkills = (list = []) => {
  const output = [];
  list.forEach((item) => {
    const canonical = canonicalSkill(item);
    if (canonical && !output.some((skill) => skill.toLowerCase() === canonical.toLowerCase())) {
      output.push(canonical);
    }
  });
  return output;
};

const buildJobText = (job) =>
  [
    job.title,
    job.company,
    job.location,
    job.workMode,
    job.employmentType,
    job.description,
    toArray(job.responsibilities).join('. '),
    toArray(job.requiredSkills).join(', '),
    toArray(job.preferredSkills).join(', '),
    job.education,
    job.minExperience ? `minimum ${job.minExperience} years of experience` : '',
  ]
    .filter(Boolean)
    .join('\n');

// Sentences that merely mention a technology as a bonus must not turn it into a
// hard requirement, otherwise a "plus" skill would penalise every applicant.
const PREFERRED_MARKER =
  /(is a plus|are a plus|good to have|nice to have|preferred|bonus|advantage|familiarity with|exposure to)/i;

/** Skills a job demands: recruiter selections plus skills stated in the description. */
const getRequiredSkills = (job) => {
  const listed = uniqueCanonicalSkills(toArray(job.requiredSkills));
  // Only the description body contributes extra requirements; the
  // "responsibilities" list describes duties ("attend agile ceremonies") and
  // would otherwise add noisy, unmatchable skills.
  const sentences = String(job.description || '')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const fromDescription = [];
  sentences.forEach((sentence) => {
    if (PREFERRED_MARKER.test(sentence)) return;
    extractSkills(sentence).forEach((skill) => {
      const entry = getSkillEntry(skill);
      // Soft skills are context dependent; only the recruiter may require them.
      if (entry && entry.category === 'Soft Skill') return;
      fromDescription.push(skill);
    });
  });

  return uniqueCanonicalSkills([...listed, ...fromDescription]);
};

const getPreferredSkills = (job) => uniqueCanonicalSkills(toArray(job.preferredSkills));

const checkEducation = (job, educationLines = []) => {
  if (!job.education || /^any$/i.test(job.education)) return true;
  const haystack = educationLines.join(' ').toLowerCase();
  if (!haystack) return false;
  const tokens = job.education
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
  if (!tokens.length) return true;
  return tokens.some((token) => haystack.includes(token));
};

/**
 * Rank any number of resumes against a single job using one shared TF-IDF space.
 * @param {object} job Job document (lean object is fine)
 * @param {Array<{resume: object, candidate?: object}>} entries
 */
const rankResumesAgainstJob = (job, entries = []) => {
  if (!entries.length) return [];

  const jobText = buildJobText(job);
  const documents = [jobText, ...entries.map((entry) => (entry.resume && entry.resume.text) || '')];
  const { vectors, vocabularySize } = vectorizeCorpus(documents);
  const jobVector = vectors[0];

  const requiredSkills = getRequiredSkills(job);
  const preferredSkills = getPreferredSkills(job);

  const results = entries.map((entry, index) => {
    const resume = entry.resume || {};
    const analysis = resume.analysis || {};
    const resumeText = resume.text || '';
    const candidateSkills = uniqueCanonicalSkills([
      ...toArray(analysis.skills),
      ...extractSkills(resumeText),
    ]);

    const candidateSet = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
    const matchedSkills = requiredSkills.filter((skill) => candidateSet.has(skill.toLowerCase()));
    const missingSkills = requiredSkills.filter((skill) => !candidateSet.has(skill.toLowerCase()));
    const preferredMatched = preferredSkills.filter((skill) => candidateSet.has(skill.toLowerCase()));

    const skillScore =
      requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 100 : 0;

    const cosine = cosineSimilarity(jobVector, vectors[index + 1] || new Map());
    const textScore = cosine * 100;

    const weights = requiredSkills.length > 0
      ? { skills: SKILL_WEIGHT, text: TEXT_WEIGHT }
      : { skills: 0, text: 1 };

    const rawScore = weights.skills * skillScore + weights.text * textScore;
    const score = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

    const educationMatch = checkEducation(job, toArray(analysis.education));
    const experienceYears = Number(analysis.experienceYears) || 0;
    const experienceMatch = experienceYears >= (Number(job.minExperience) || 0);

    const explanation =
      `${matchedSkills.length} of ${requiredSkills.length} required skills matched ` +
      `(${skillScore.toFixed(1)}%). TF-IDF cosine similarity ${(cosine * 100).toFixed(1)}% ` +
      `across ${vocabularySize} terms. Weighted: ` +
      `${weights.skills} × ${skillScore.toFixed(1)} + ${weights.text} × ${textScore.toFixed(1)} ` +
      `= ${score.toFixed(1)}%.`;

    return {
      candidate: entry.candidate || resume.candidate || null,
      resume: resume._id || null,
      candidateName: (entry.candidate && entry.candidate.name) || analysis.name || 'Candidate',
      score,
      skillScore: Math.round(skillScore * 10) / 10,
      textScore: Math.round(textScore * 10) / 10,
      matchedSkills,
      missingSkills,
      preferredMatched,
      requiredSkills,
      experienceYears,
      educationMatch,
      experienceMatch,
      analysis,
      breakdown: {
        requiredFound: matchedSkills.length,
        requiredTotal: requiredSkills.length,
        cosineSimilarity: Number(cosine.toFixed(6)),
        termCount: vocabularySize,
        weights,
      },
      explanation,
    };
  });

  return results.sort((a, b) => b.score - a.score || b.skillScore - a.skillScore);
};

/** Convenience wrapper for a single resume/job pair. */
const scoreResumeAgainstJob = (job, entry) => rankResumesAgainstJob(job, [entry])[0] || null;

module.exports = {
  rankResumesAgainstJob,
  scoreResumeAgainstJob,
  getRequiredSkills,
  getPreferredSkills,
  buildJobText,
  uniqueCanonicalSkills,
  SKILL_WEIGHT,
  TEXT_WEIGHT,
};
