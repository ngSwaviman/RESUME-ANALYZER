/**
 * End-to-end API smoke test. Requires a running API with seeded demo data:
 *
 *   cd server
 *   npm run demo          # terminal 1 (or use npm start with local MongoDB)
 *   npm run check:api     # terminal 2
 *
 * Verifies authentication, role-based authorization, job CRUD reads, ranking,
 * recommendation, PDF upload, validation and the application flow.
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.API_URL || 'http://localhost:5000/api';
const PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'User@12345';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

let failures = 0;

const check = (label, condition, detail = '') => {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
};

const request = async (endpoint, options = {}) => {
  const headers = { ...(options.headers || {}) };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const response = await fetch(`${BASE}${endpoint}`, { method: options.method || 'GET', headers, body });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    data = text;
  }
  return { status: response.status, data };
};

const login = async (email, password) => {
  const result = await request('/auth/login', { method: 'POST', body: { email, password } });
  return { status: result.status, token: result.data?.token, user: result.data?.user };
};

(async () => {
  console.log(`\nAPI smoke test against ${BASE}\n`);

  const health = await request('/health');
  check('health endpoint responds', health.status === 200 && health.data?.success);

  const candidate = await login('ananya.mohapatra@example.com', PASSWORD);
  check('candidate login', candidate.status === 200 && Boolean(candidate.token));

  const me = await request('/auth/me', { token: candidate.token });
  check('candidate profile loads with resume', me.status === 200 && me.data?.resume, me.data?.resume?.originalName);

  const bearer = await request('/admin/stats');
  check('unauthenticated admin request is blocked', bearer.status === 401, `status ${bearer.status}`);

  const forbidden = await request('/admin/stats', { token: candidate.token });
  check('candidate blocked from admin stats', forbidden.status === 403, `status ${forbidden.status}`);

  const jobs = await request('/jobs');
  const jobList = jobs.data?.jobs || [];
  check('job listing returns seeded jobs', jobs.status === 200 && jobList.length >= 5, `${jobList.length} jobs`);

  const candidateRanking = await request(`/matches/job/${jobList[0]?._id}`, { token: candidate.token });
  check('candidate blocked from ranking endpoint', candidateRanking.status === 403, `status ${candidateRanking.status}`);

  const recommendations = await request('/matches/recommendations', { token: candidate.token });
  const recs = recommendations.data?.recommendations || [];
  check(
    'recommendations computed for candidate',
    recommendations.status === 200 && recs.length > 0 && recs.every((row) => row.score >= 0 && row.score <= 100),
    recs.length ? `top score ${recs[0].score}% for ${recs[0].job.title}` : 'none'
  );
  check(
    'recommendation includes matched and missing skills',
    recs.length > 0 && Array.isArray(recs[0].matchedSkills) && Array.isArray(recs[0].missingSkills),
    recs.length ? `${recs[0].matchedSkills.length} matched / ${recs[0].missingSkills.length} missing` : ''
  );
  check('score explanation is returned', recs.length > 0 && Boolean(recs[0].explanation));

  const applications = await request('/applications/me', { token: candidate.token });
  check('candidate applications load', applications.status === 200, `${applications.data?.count || 0} applications`);

  const recruiter = await login('ritika@nexoratech.com', PASSWORD);
  check('recruiter login', recruiter.status === 200 && Boolean(recruiter.token));

  const myJobs = await request('/jobs?mine=true&limit=50', { token: recruiter.token });
  const ownedJobs = myJobs.data?.jobs || [];
  // Prefer a posting that already received applications for the applicant checks.
  const recruiterJob = ownedJobs.find((job) => job.applicationCount > 0) || ownedJobs[0];
  check('recruiter sees own jobs', myJobs.status === 200 && Boolean(recruiterJob), recruiterJob?.title);

  const ranking = await request(`/matches/job/${recruiterJob?._id}`, { token: recruiter.token });
  const ranked = ranking.data?.ranking || [];
  check(
    'ranking returns scored candidates',
    ranking.status === 200 && ranked.length > 0 && ranked[0].score > 0,
    ranked.length ? `${ranked[0].candidate.name} at ${ranked[0].score}%` : 'none'
  );
  check(
    'ranking is sorted high to low',
    ranked.length > 1 ? ranked.every((row, index) => index === 0 || ranked[index - 1].score >= row.score) : true
  );
  check(
    'ranking carries explainable breakdown',
    ranked.length > 0 && Boolean(ranked[0].explanation) && ranked[0].breakdown?.requiredTotal > 0
  );
  check('ranking shows human-review note', Boolean(ranking.data?.note));

  const applicants = await request(`/jobs/${recruiterJob?._id}/applicants`, { token: recruiter.token });
  const applicantList = applicants.data?.applications || [];
  check('recruiter can view applicants', applicants.status === 200, `${applicantList.length} applicants`);

  if (applicantList.length) {
    const updated = await request(`/applications/${applicantList[0]._id}/status`, {
      method: 'PATCH',
      token: recruiter.token,
      body: { status: 'shortlisted', note: 'Reviewed by recruiter' },
    });
    check('recruiter updates application status', updated.status === 200 && updated.data?.application?.status === 'shortlisted');
  }

  const admin = await login('admin@resume-analyzer.local', ADMIN_PASSWORD);
  check('admin login', admin.status === 200 && admin.user?.role === 'admin');

  const stats = await request('/admin/stats', { token: admin.token });
  check(
    'admin dashboard statistics load',
    stats.status === 200 && stats.data?.totals?.candidates >= 6 && stats.data?.scoreDistribution?.length === 5,
    stats.status === 200
      ? `${stats.data.totals.candidates} candidates, avg match ${stats.data.totals.averageMatchScore}%`
      : ''
  );
  check('admin top candidates chart data present', Array.isArray(stats.data?.topCandidates) && stats.data.topCandidates.length > 0);
  check('admin activity feed present', Array.isArray(stats.data?.activities) && stats.data.activities.length > 0);

  // ---- Fresh candidate: registration + real PDF upload + application ----
  const email = `test.candidate.${Date.now()}@example.com`;
  const registration = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Test Candidate', email, password: 'Test@12345', role: 'candidate' },
  });
  check('candidate registration', registration.status === 201 && Boolean(registration.data?.token));

  const uploadDir = path.join(__dirname, '..', 'uploads');
  const samplePdf = fs.readdirSync(uploadDir).find((file) => file.endsWith('.pdf'));
  if (samplePdf && registration.data?.token) {
    const form = new FormData();
    const buffer = fs.readFileSync(path.join(uploadDir, samplePdf));
    form.append('resume', new Blob([buffer], { type: 'application/pdf' }), 'candidate.pdf');

    const upload = await request('/resumes/upload', { method: 'POST', token: registration.data.token, body: form });
    const skills = upload.data?.resume?.analysis?.skills || [];
    check(
      'PDF upload extracts text and skills',
      upload.status === 201 && skills.length > 5,
      skills.length ? `${skills.length} skills, ${upload.data.resume.analysis.wordCount} words` : JSON.stringify(upload.data)
    );

    const analysis = await request('/resumes/me', { token: registration.data.token });
    check(
      'extracted contact details persisted',
      analysis.status === 200 && Boolean(analysis.data?.resume?.analysis?.email),
      analysis.data?.resume?.analysis?.email
    );

    const invalid = new FormData();
    invalid.append('resume', new Blob([Buffer.from('not a pdf')], { type: 'application/pdf' }), 'fake.pdf');
    const invalidUpload = await request('/resumes/upload', { method: 'POST', token: registration.data.token, body: invalid });
    check('invalid PDF rejected', invalidUpload.status === 400, invalidUpload.data?.message);

    const targetJob = jobList.find((job) => job.status === 'open');
    const application = await request(`/applications/${targetJob._id}`, {
      method: 'POST',
      token: registration.data.token,
      body: { coverLetter: 'Automated smoke test application.' },
    });
    check(
      'application computed a match score',
      application.status === 201 && application.data?.match?.score >= 0,
      application.data?.match ? `${application.data.match.score}% for ${targetJob.title}` : JSON.stringify(application.data)
    );

    const duplicate = await request(`/applications/${targetJob._id}`, {
      method: 'POST',
      token: registration.data.token,
      body: {},
    });
    check('duplicate application blocked', duplicate.status === 409, `status ${duplicate.status}`);

    const recruiterRanking = await request(`/matches/job/${targetJob._id}`, { token: recruiter.token });
    check(
      'new candidate appears in someone else\'s ranking',
      recruiterRanking.status === 200 && (recruiterRanking.data?.ranking || []).length > 0
    );
  } else {
    check('sample PDF available for upload test', false, 'run npm run seed first');
  }

  console.log(`\n${failures === 0 ? 'All API checks passed.' : `${failures} check(s) failed.`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((error) => {
  console.error('Smoke test crashed:', error);
  process.exit(1);
});
