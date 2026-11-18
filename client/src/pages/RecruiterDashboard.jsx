import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Briefcase, Plus, TrendingUp, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Loader from '../components/Loader.jsx';
import Badge from '../components/Badge.jsx';
import ScoreBar from '../components/ScoreBar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getRecruiterPipelineRequest } from '../services/applicationService.js';
import { listJobsRequest } from '../services/jobService.js';
import { getErrorMessage } from '../services/api.js';
import { formatRelative } from '../utils/format.js';

const STATUS_COLORS = {
  applied: '#2453e6',
  shortlisted: '#10b981',
  'on-hold': '#f59e0b',
  rejected: '#f43f5e',
};

export default function RecruiterDashboard() {
  const { profile } = useAuth();
  const [state, setState] = useState({ loading: true, error: '', jobs: [], pipeline: null });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [jobs, pipeline] = await Promise.all([
          listJobsRequest({ mine: 'true', limit: 50 }),
          getRecruiterPipelineRequest(),
        ]);
        if (!active) return;
        setState({ loading: false, error: '', jobs: jobs.jobs || [], pipeline });
      } catch (error) {
        if (active) setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(error) }));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) return <Loader fullscreen label="Loading recruiter workspace..." />;
  if (state.error) return <div className="card border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-600">{state.error}</div>;

  const { jobs, pipeline } = state;
  const totalApplicants = pipeline?.totalApplications || 0;
  const openJobs = jobs.filter((job) => job.status === 'open').length;

  const statusCounts = ['applied', 'shortlisted', 'on-hold', 'rejected'].map((status) => ({
    status,
    count: (pipeline?.byStatus || []).find((row) => row.status === status)?.count || 0,
  }));
  const shortlisted = statusCounts.find((row) => row.status === 'shortlisted')?.count || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={profile?.company || 'Recruiter'}
        title="Recruitment dashboard"
        subtitle="Your open roles, applicant pipeline and ranking activity."
        actions={
          <Link to="/recruiter/jobs" className="btn-primary">
            <Plus size={16} /> Post a job
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Briefcase} label="My job posts" value={jobs.length} hint={`${openJobs} currently open`} tone="brand" />
        <StatCard icon={Users} label="Applicants" value={totalApplicants} hint="Across all postings" tone="indigo" />
        <StatCard icon={TrendingUp} label="Shortlisted" value={shortlisted} hint="Awaiting interview scheduling" tone="emerald" />
        <StatCard
          icon={TrendingUp}
          label="Open roles"
          value={openJobs}
          hint="Accepting applications"
          tone="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <h2 className="text-base font-bold text-slate-900">Application pipeline</h2>
          <p className="text-xs text-slate-500">Applicants grouped by current status</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  cursor={{ fill: 'rgba(36,83,230,0.06)' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={46}>
                  {statusCounts.map((row) => (
                    <Cell key={row.status} fill={STATUS_COLORS[row.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent applicants</h2>
            <Link to="/recruiter/ranking" className="btn-ghost text-xs">
              Rank <ArrowRight size={14} />
            </Link>
          </div>

          {(pipeline?.recent || []).length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No applications yet. Post a job to start receiving candidates.
            </p>
          ) : (
            <ul className="space-y-3">
              {pipeline.recent.slice(0, 5).map((application) => (
                <li key={application._id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {application.candidate?.user?.name || 'Candidate'}
                      </p>
                      <p className="truncate text-xs text-slate-500">{application.job?.title}</p>
                    </div>
                    <Badge status={application.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="w-28"><ScoreBar score={application.matchScore} showLabel={false} height="h-1.5" /></div>
                    <span className="text-[11px] text-slate-400">{formatRelative(application.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My job postings</h2>
            <p className="text-xs text-slate-500">Open a posting's ranking to review applicants</p>
          </div>
          <Link to="/recruiter/jobs" className="btn-secondary text-xs">
            Manage jobs
          </Link>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs posted yet"
            description="Create your first opening with required skills so candidates can be ranked."
            action={
              <Link to="/recruiter/jobs" className="btn-primary mt-2">
                <Plus size={16} /> Post a job
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Role</th>
                  <th className="th">Location</th>
                  <th className="th">Applicants</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-50/60">
                    <td className="td">
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-500">{job.requiredSkills?.slice(0, 4).join(', ')}</p>
                    </td>
                    <td className="td text-xs">{job.location}</td>
                    <td className="td font-semibold">{job.applicationCount || 0}</td>
                    <td className="td">
                      <span className={`chip ${job.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="td text-right">
                      <Link to={`/recruiter/ranking?job=${job._id}`} className="btn-ghost text-xs text-brand-700">
                        View ranking
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
