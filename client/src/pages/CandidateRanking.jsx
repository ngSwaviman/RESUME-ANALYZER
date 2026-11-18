import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  Briefcase,
  Download,
  FileText,
  Info,
  ShieldCheck,
  Users,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ScoreBar from '../components/ScoreBar.jsx';
import SkillChip from '../components/SkillChip.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import ResumeDetailPanel from '../components/ResumeDetailPanel.jsx';
import { listJobsRequest } from '../services/jobService.js';
import { getJobApplicantsRequest } from '../services/jobService.js';
import { getJobRankingRequest } from '../services/matchService.js';
import { updateApplicationStatusRequest } from '../services/applicationService.js';
import { downloadResumeFile } from '../services/resumeService.js';
import { getErrorMessage } from '../services/api.js';
import { formatDate } from '../utils/format.js';

const STATUS_OPTIONS = ['applied', 'shortlisted', 'on-hold', 'rejected'];

export default function CandidateRanking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(searchParams.get('job') || '');
  const [tab, setTab] = useState('ranked');
  const [ranking, setRanking] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [resumeCandidate, setResumeCandidate] = useState(null);
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await listJobsRequest({ mine: 'true', limit: 50 });
        setJobs(data.jobs || []);
        setJobId((current) => current || data.jobs?.[0]?._id || '');
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    })();
  }, []);

  const loadJobData = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [rankData, applicantData] = await Promise.all([
        getJobRankingRequest(jobId),
        getJobApplicantsRequest(jobId).catch(() => ({ applications: [] })),
      ]);
      setRanking(rankData);
      setApplicants(applicantData.applications || []);
    } catch (err) {
      setError(getErrorMessage(err));
      setRanking(null);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJobData();
  }, [loadJobData]);

  const applicationsByCandidate = useMemo(() => {
    const map = new Map();
    applicants.forEach((application) => {
      if (application.candidate?._id) map.set(application.candidate._id, application);
    });
    return map;
  }, [applicants]);

  const handleStatusChange = async (applicationId, status) => {
    setUpdatingId(applicationId);
    try {
      await updateApplicationStatusRequest(applicationId, status);
      await loadJobData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId('');
    }
  };

  const handleDownload = async (row) => {
    try {
      await downloadResumeFile(row.resumeId, `${row.candidate?.name || 'candidate'}_resume.pdf`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 5"
        title="Candidate ranking"
        subtitle="Every candidate with an active resume is scored against the selected job by skill coverage and TF-IDF cosine similarity."
      />

      {jobs.length === 0 && !loading ? (
        <EmptyState
          icon={Briefcase}
          title="No job postings to rank against"
          description="Post a job first — candidates are ranked against its required skills."
        />
      ) : (
        <>
          <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-1 sm:max-w-md">
              <label className="label" htmlFor="jobSelect">Job posting</label>
              <select
                id="jobSelect"
                className="input"
                value={jobId}
                onChange={(event) => {
                  setJobId(event.target.value);
                  setSearchParams({ job: event.target.value });
                  setSelected(null);
                }}
              >
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} · {job.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTab('ranked')}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  tab === 'ranked' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Users size={14} className="mr-1.5 inline" /> Ranked candidates
              </button>
              <button
                type="button"
                onClick={() => setTab('applicants')}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  tab === 'applicants' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Award size={14} className="mr-1.5 inline" /> Applicants ({applicants.length})
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <Loader label="Computing match scores..." />
          ) : !ranking ? (
            <EmptyState icon={Users} title="Select a job to see rankings" />
          ) : tab === 'ranked' ? (
            <>
              <div className="card flex flex-wrap items-center gap-3 p-4 text-xs text-slate-600">
                <span className="chip bg-brand-50 text-brand-700">{ranking.total} candidates evaluated</span>
                <span className="text-slate-400">|</span>
                <span>Required skills: {ranking.job.requiredSkills.join(', ')}</span>
              </div>

              <div className="card overflow-hidden">
                <div className="table-wrap border-0">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="th">#</th>
                        <th className="th">Candidate</th>
                        <th className="th">Match</th>
                        <th className="th">Skills</th>
                        <th className="th">Education</th>
                        <th className="th">Experience</th>
                        <th className="th text-right">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ranking.ranking.map((row) => (
                        <tr key={row.candidate?._id || row.rank} className="hover:bg-slate-50/60">
                          <td className="td font-bold text-slate-400">{row.rank}</td>
                          <td className="td">
                            <p className="font-semibold text-slate-900">{row.candidate?.name}</p>
                            <p className="text-xs text-slate-500">{row.candidate?.headline || row.candidate?.email}</p>
                          </td>
                          <td className="td w-40">
                            <ScoreBar score={row.score} />
                          </td>
                          <td className="td">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="chip bg-emerald-50 text-emerald-700">{row.matchedSkills.length} matched</span>
                              <span className="chip bg-rose-50 text-rose-600">{row.missingSkills.length} missing</span>
                            </div>
                          </td>
                          <td className="td max-w-[200px]">
                            <p className="line-clamp-2 text-xs text-slate-600">
                              {row.candidate?.education?.[0]?.degree || '—'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {row.candidate?.education?.[0]?.institution || ''}
                            </p>
                          </td>
                          <td className="td whitespace-nowrap text-xs">
                            {row.candidate?.experienceYears || 0} yrs
                            <span
                              className={`ml-1.5 chip ${row.experienceMatch ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                            >
                              {row.experienceMatch ? 'meets' : 'below'}
                            </span>
                          </td>
                          <td className="td text-right">
                            <button type="button" className="btn-ghost text-xs text-brand-700" onClick={() => setSelected(row)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {ranking.ranking.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                            No resumes have been uploaded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card overflow-hidden">
              <div className="table-wrap border-0">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th">Candidate</th>
                      <th className="th">Applied</th>
                      <th className="th">Score</th>
                      <th className="th">Status</th>
                      <th className="th">Resume</th>
                      <th className="th text-right">Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map((application) => (
                      <tr key={application._id} className="hover:bg-slate-50/60">
                        <td className="td">
                          <p className="font-semibold text-slate-900">{application.candidate?.user?.name}</p>
                          <p className="text-xs text-slate-500">{application.candidate?.user?.email}</p>
                        </td>
                        <td className="td whitespace-nowrap text-xs text-slate-500">{formatDate(application.createdAt)}</td>
                        <td className="td w-36"><ScoreBar score={application.matchScore} /></td>
                        <td className="td"><Badge status={application.status} /></td>
                        <td className="td">
                          <button
                            type="button"
                            className="btn-ghost whitespace-nowrap text-xs text-brand-700"
                            onClick={() =>
                              setResumeCandidate({
                                _id: application.candidate?._id,
                                name: application.candidate?.user?.name || 'Candidate',
                              })
                            }
                          >
                            <FileText size={13} /> View CV
                          </button>
                        </td>
                        <td className="td text-right">
                          <select
                            className="input max-w-[150px] py-1.5 text-xs"
                            value={application.status}
                            disabled={updatingId === application._id}
                            onChange={(event) => handleStatusChange(application._id, event.target.value)}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {applicants.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                          No candidates have applied to this job yet. Rankings above still show fit for every uploaded resume.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-xs text-brand-800">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            <span>
              {ranking?.note ||
                'Scores are decision support only. AI rankings never reject a candidate automatically — a human recruiter must review every application.'}
            </span>
          </div>
        </>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.candidate?.name || 'Candidate'}
        description={selected?.candidate?.headline || selected?.candidate?.email}
        size="lg"
        footer={
          <>
            {selected?.resumeId && (
              <button type="button" className="btn-secondary" onClick={() => handleDownload(selected)}>
                <Download size={16} /> Resume PDF
              </button>
            )}
            <button type="button" className="btn-primary" onClick={() => setSelected(null)}>
              Close
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">Match score</p>
                <p className="text-3xl font-black text-slate-900">{Math.round(selected.score)}%</p>
                <div className="mt-2 max-w-xs"><ScoreBar score={selected.score} showLabel={false} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white px-3 py-2">
                  <p className="text-slate-400">Skill coverage</p>
                  <p className="font-bold text-slate-800">{selected.skillScore}%</p>
                </div>
                <div className="rounded-lg bg-white px-3 py-2">
                  <p className="text-slate-400">Text similarity</p>
                  <p className="font-bold text-slate-800">{selected.textScore}%</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                Matched skills ({selected.matchedSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selected.matchedSkills.map((skill) => (
                  <SkillChip key={skill} variant="matched">{skill}</SkillChip>
                ))}
                {selected.matchedSkills.length === 0 && <span className="text-xs text-slate-400">None</span>}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-rose-500">
                Missing skills ({selected.missingSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selected.missingSkills.map((skill) => (
                  <SkillChip key={skill} variant="missing">{skill}</SkillChip>
                ))}
                {selected.missingSkills.length === 0 && <span className="text-xs text-slate-400">None</span>}
              </div>
            </div>

            {selected.preferredMatched?.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                  Preferred skills matched
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.preferredMatched.map((skill) => (
                    <SkillChip key={skill} variant="preferred">{skill}</SkillChip>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-[11px] text-slate-600">
              Requirement: {ranking?.job?.education || 'Any'} ·{' '}
              <span className={selected.educationMatch ? 'text-emerald-600' : 'text-amber-600'}>
                {selected.educationMatch ? 'education appears to match' : 'education needs manual check'}
              </span>{' '}
              · {selected.candidate?.experienceYears || 0} yr experience vs {ranking?.job?.minExperience || 0}+ required
            </div>

            <ResumeDetailPanel candidateId={selected.candidate?._id} job={ranking?.job} />

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <Info size={12} /> Explainable score
              </p>
              <pre className="whitespace-pre-wrap rounded-xl bg-slate-900 p-3.5 text-[11px] leading-relaxed text-slate-200">
{selected.explanation}
              </pre>
            </div>

            {applicationsByCandidate.get(selected.candidate?._id) && (
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Application status</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge status={applicationsByCandidate.get(selected.candidate._id).status} />
                  <select
                    className="input max-w-[160px] py-1.5 text-xs"
                    value={applicationsByCandidate.get(selected.candidate._id).status}
                    onChange={(event) =>
                      handleStatusChange(applicationsByCandidate.get(selected.candidate._id)._id, event.target.value)
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(resumeCandidate)}
        onClose={() => setResumeCandidate(null)}
        title={resumeCandidate?.name || 'Candidate resume'}
        description="Contact details and everything parsed from the uploaded PDF"
        size="lg"
        footer={
          <button type="button" className="btn-primary" onClick={() => setResumeCandidate(null)}>
            Close
          </button>
        }
      >
        <ResumeDetailPanel candidateId={resumeCandidate?._id} job={ranking?.job} />
      </Modal>
    </div>
  );
}
