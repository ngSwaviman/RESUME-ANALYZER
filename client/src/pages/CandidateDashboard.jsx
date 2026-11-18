import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  FileText,
  GaugeCircle,
  Sparkles,
  UploadCloud,
  UserRound,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import ScoreBar from '../components/ScoreBar.jsx';
import Badge from '../components/Badge.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SkillChip from '../components/SkillChip.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { meRequest } from '../services/authService.js';
import { getMyApplicationsRequest } from '../services/applicationService.js';
import { getRecommendationsRequest } from '../services/matchService.js';
import { getErrorMessage } from '../services/api.js';
import { formatDate } from '../utils/format.js';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({
    loading: true,
    error: '',
    profile: null,
    resume: null,
    applications: [],
    recommendations: [],
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [me, applications, recs] = await Promise.all([
          meRequest(),
          getMyApplicationsRequest().catch(() => ({ applications: [] })),
          getRecommendationsRequest(3).catch(() => ({ recommendations: [] })),
        ]);
        if (!active) return;
        setState({
          loading: false,
          error: '',
          profile: me.profile,
          resume: me.resume,
          applications: applications.applications || [],
          recommendations: recs.recommendations || [],
        });
      } catch (error) {
        if (active) setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(error) }));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) return <Loader fullscreen label="Loading your dashboard..." />;

  if (state.error) {
    return (
      <div className="card border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-600">{state.error}</div>
    );
  }

  const { profile, resume, applications, recommendations } = state;
  const bestScore = recommendations.length ? Math.max(...recommendations.map((item) => item.score)) : 0;
  const shortlisted = applications.filter((application) => application.status === 'shortlisted').length;
  const skills = profile?.skills || resume?.analysis?.skills || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Candidate"
        title={`Hello, ${user?.name?.split(' ')[0]}`}
        subtitle="Your resume, applications and best-fitting jobs in one place."
        actions={
          <>
            <Link to="/candidate/upload" className="btn-secondary">
              <UploadCloud size={16} /> {resume ? 'Replace resume' : 'Upload resume'}
            </Link>
            <Link to="/jobs" className="btn-primary">
              Browse jobs <ArrowRight size={16} />
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserRound} label="Profile completion" value={`${profile?.profileCompletion || 0}%`} hint="Add skills and education to improve" tone="brand" />
        <StatCard icon={FileText} label="Resume" value={resume ? 'Uploaded' : 'Missing'} hint={resume ? resume.originalName : 'PDF required to match jobs'} tone={resume ? 'emerald' : 'rose'} />
        <StatCard icon={Briefcase} label="Applications" value={applications.length} hint={`${shortlisted} shortlisted`} tone="indigo" />
        <StatCard icon={GaugeCircle} label="Best match" value={bestScore ? `${Math.round(bestScore)}%` : '—'} hint="Across current openings" tone="amber" />
      </div>

      {!resume && (
        <div className="card flex flex-col items-start gap-4 border-brand-100 bg-gradient-to-r from-brand-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Start by uploading your resume</h3>
            <p className="mt-1 text-sm text-slate-600">
              We extract your skills, education and experience from the PDF, then score every open role against it.
            </p>
          </div>
          <Link to="/candidate/upload" className="btn-primary shrink-0">
            <UploadCloud size={16} /> Upload PDF
          </Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent applications</h2>
              <p className="text-xs text-slate-500">Tracked from applied to shortlisted</p>
            </div>
            <Link to="/jobs" className="btn-ghost text-xs">
              Find more <ArrowRight size={14} />
            </Link>
          </div>

          {applications.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No applications yet"
              description="Browse open roles and apply — your resume and match score are attached automatically."
              action={
                <Link to="/jobs" className="btn-primary mt-2">
                  Browse jobs
                </Link>
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Role</th>
                    <th className="th">Applied</th>
                    <th className="th">Score</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((application) => (
                    <tr key={application._id} className="hover:bg-slate-50/60">
                      <td className="td">
                        <p className="font-semibold text-slate-900">{application.job?.title || 'Job removed'}</p>
                        <p className="text-xs text-slate-500">{application.job?.company}</p>
                      </td>
                      <td className="td whitespace-nowrap text-xs text-slate-500">{formatDate(application.createdAt)}</td>
                      <td className="td w-32"><ScoreBar score={application.matchScore} showLabel={false} /></td>
                      <td className="td"><Badge status={application.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Top job matches</h2>
              <Link to="/candidate/recommendations" className="btn-ghost text-xs">
                All <ArrowRight size={14} />
              </Link>
            </div>

            {recommendations.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Upload a resume to receive ranked job recommendations.
              </p>
            ) : (
              <ul className="space-y-3">
                {recommendations.map((item) => (
                  <li key={item.job._id} className="rounded-xl border border-slate-200 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.job.title}</p>
                        <p className="text-xs text-slate-500">{item.job.company} · {item.job.location}</p>
                      </div>
                      <span className="chip bg-brand-50 text-brand-700">{Math.round(item.score)}%</span>
                    </div>
                    <div className="mt-2.5"><ScoreBar score={item.score} showLabel={false} height="h-1.5" /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Skills extracted</h2>
              <span className="chip bg-slate-100 text-slate-600">{skills.length}</span>
            </div>
            {skills.length === 0 ? (
              <p className="text-sm text-slate-500">No skills detected yet. Upload a resume to extract them.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skills.slice(0, 18).map((skill) => (
                  <SkillChip key={skill} variant="brand">{skill}</SkillChip>
                ))}
                {skills.length > 18 && <SkillChip>+{skills.length - 18}</SkillChip>}
              </div>
            )}
            {resume && (
              <Link to="/candidate/analysis" className="btn-secondary mt-4 w-full text-xs">
                View full analysis <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
