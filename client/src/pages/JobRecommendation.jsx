import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Info, Sparkles, UploadCloud } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ScoreBar from '../components/ScoreBar.jsx';
import SkillChip from '../components/SkillChip.jsx';
import ApplyModal from '../components/ApplyModal.jsx';
import { getRecommendationsRequest } from '../services/matchService.js';
import { getErrorMessage } from '../services/api.js';
import { formatSalary } from '../utils/format.js';

export default function JobRecommendation() {
  const [state, setState] = useState({ loading: true, error: '', recommendations: [], candidateSkills: [] });
  const [applyJob, setApplyJob] = useState(null);
  const [appliedIds, setAppliedIds] = useState([]);
  const [openWhy, setOpenWhy] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getRecommendationsRequest(12);
        if (!active) return;
        setState({
          loading: false,
          error: '',
          recommendations: data.recommendations || [],
          candidateSkills: data.candidateSkills || [],
        });
      } catch (error) {
        if (active) {
          setState({ loading: false, error: getErrorMessage(error), recommendations: [], candidateSkills: [] });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) return <Loader fullscreen label="Scoring open jobs against your resume..." />;

  if (state.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Recommended jobs" subtitle="Open roles ranked against your resume." />
        <EmptyState
          icon={UploadCloud}
          title="A resume is required"
          description={state.error}
          action={
            <Link to="/candidate/upload" className="btn-primary mt-2">
              <UploadCloud size={16} /> Upload resume
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 6"
        title="Recommended for you"
        subtitle="Every open role scored against your resume with TF-IDF cosine similarity and skill coverage."
        actions={
          <Link to="/jobs" className="btn-secondary">
            Browse all jobs <ArrowRight size={16} />
          </Link>
        }
      />

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Sparkles size={16} className="text-brand-600" />
          {state.recommendations.length} role{state.recommendations.length === 1 ? '' : 's'} scored
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {state.candidateSkills.slice(0, 12).map((skill) => (
            <SkillChip key={skill}>{skill}</SkillChip>
          ))}
          {state.candidateSkills.length > 12 && <SkillChip>+{state.candidateSkills.length - 12}</SkillChip>}
        </div>
      </div>

      {state.recommendations.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No open jobs to compare yet"
          description="Recruiters have not published any open roles. Check back shortly."
        />
      ) : (
        <div className="space-y-4">
          {state.recommendations.map((item, index) => {
            const applied = appliedIds.includes(item.job._id);
            return (
              <article key={item.job._id} className="card animate-fade-up p-5">
                <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="chip bg-slate-100 text-slate-500">#{index + 1}</span>
                          <h2 className="text-lg font-bold text-slate-900">{item.job.title}</h2>
                        </div>
                        <p className="mt-1 text-sm font-medium text-brand-700">
                          {item.job.company} · {item.job.location} · {item.job.workMode}
                        </p>
                      </div>
                      <span className="chip bg-brand-50 text-brand-700">{formatSalary(item.job.salary)}</span>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.job.description}</p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                          Skills you match ({item.matchedSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.matchedSkills.length === 0 ? (
                            <span className="text-xs text-slate-400">None of the required skills were found.</span>
                          ) : (
                            item.matchedSkills.map((skill) => (
                              <SkillChip key={skill} variant="matched">{skill}</SkillChip>
                            ))
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-500">
                          Skills to add ({item.missingSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.missingSkills.length === 0 ? (
                            <span className="text-xs text-slate-400">You cover every required skill.</span>
                          ) : (
                            item.missingSkills.map((skill) => (
                              <SkillChip key={skill} variant="missing">{skill}</SkillChip>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
                      onClick={() => setOpenWhy((current) => (current === item.job._id ? '' : item.job._id))}
                    >
                      <Info size={13} /> {openWhy === item.job._id ? 'Hide score breakdown' : 'Why this score?'}
                    </button>
                    {openWhy === item.job._id && (
                      <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">
{item.explanation}
                      </pre>
                    )}
                  </div>

                  <div className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Match score</p>
                      <p className="mt-1 text-4xl font-black tracking-tight text-slate-900">
                        {Math.round(item.score)}
                        <span className="text-lg font-semibold text-slate-400">%</span>
                      </p>
                      <div className="mt-3"><ScoreBar score={item.score} showLabel={false} /></div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                        <div className="rounded-lg bg-white p-2">
                          <p className="text-slate-400">Skill coverage</p>
                          <p className="font-bold text-slate-700">{item.skillScore}%</p>
                        </div>
                        <div className="rounded-lg bg-white p-2">
                          <p className="text-slate-400">Text similarity</p>
                          <p className="font-bold text-slate-700">{item.textScore}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        className="btn-primary w-full"
                        disabled={applied}
                        onClick={() => setApplyJob(item.job)}
                      >
                        {applied ? 'Application sent' : 'Apply now'}
                      </button>
                      <p className="text-center text-[11px] text-slate-400">
                        Minimum {item.job.minExperience || 0} year(s) experience
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-xs text-brand-800">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span>
          Recommendations are a starting point, not a verdict. Recruiters review every application manually before
          any decision is made.
        </span>
      </div>

      <ApplyModal
        open={Boolean(applyJob)}
        job={applyJob}
        onClose={() => setApplyJob(null)}
        onApplied={() => {
          if (applyJob) setAppliedIds((prev) => [...prev, applyJob._id]);
        }}
      />
    </div>
  );
}
