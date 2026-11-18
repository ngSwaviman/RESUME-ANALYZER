/**
 * Standalone NLP pipeline check - no database required.
 *
 *   cd server && node scripts/nlpCheck.js
 *
 * Renders the demo resumes to PDF, extracts the text layer with pdf.js, runs the
 * resume parser, then scores every candidate against every demo job so you can
 * verify the algorithm produces the numbers shown in the UI.
 */
const { buildResumePdf } = require('../utils/pdfGenerator');
const { extractTextFromPdf } = require('../services/pdfService');
const { parseResumeText } = require('../services/resumeParser');
const { rankResumesAgainstJob, getRequiredSkills } = require('../services/matchingService');
const { SAMPLE_CANDIDATES, SAMPLE_JOBS } = require('../utils/sampleData');

const pad = (value, width) => String(value).padEnd(width).slice(0, width);

(async () => {
  const resumes = [];

  for (const candidate of SAMPLE_CANDIDATES) {
    const pdf = await buildResumePdf(candidate.resume);
    const { text, numPages } = await extractTextFromPdf(pdf);
    const analysis = parseResumeText(text);
    resumes.push({ candidate, text, analysis, numPages });
  }

  console.log('\n=== PARSED RESUMES ===');
  resumes.forEach(({ analysis, numPages }) => {
    console.log(`\n${analysis.name || '(name not detected)'} | ${analysis.email} | ${analysis.phone}`);
    console.log(`  pages: ${numPages}, words: ${analysis.wordCount}, experience: ${analysis.experienceYears} yr`);
    console.log(`  skills (${analysis.skills.length}): ${analysis.skills.join(', ')}`);
    console.log(`  education: ${analysis.education.join(' / ') || '(none)'}`);
    console.log(`  certifications: ${analysis.certifications.join(' / ') || '(none)'}`);
  });

  const entries = resumes.map((r) => ({
    resume: { text: r.text, analysis: r.analysis },
    candidate: { name: r.candidate.user.name },
  }));

  console.log('\n=== REQUIRED SKILLS PER JOB ===');
  SAMPLE_JOBS.forEach((job) => {
    console.log(`${job.title}: ${getRequiredSkills(job).join(', ')}`);
  });

  console.log('\n=== MATCH SCORES (100 point scale) ===');
  SAMPLE_JOBS.forEach((job) => {
    console.log(`\n${job.title}`);
    rankResumesAgainstJob(job, entries).forEach((result, index) => {
      console.log(
        `  ${index + 1}. ${pad(result.candidateName, 20)} ${String(result.score).padStart(5)}%  ` +
          `(skills ${result.skillScore}%, text ${result.textScore}%)`
      );
      console.log(`     matched: ${result.matchedSkills.join(', ') || '(none)'}`);
      console.log(`     missing: ${result.missingSkills.join(', ') || '(none)'}`);
    });
  });

  console.log('\nDone.');
})().catch((error) => {
  console.error('Pipeline check failed:', error);
  process.exit(1);
});
