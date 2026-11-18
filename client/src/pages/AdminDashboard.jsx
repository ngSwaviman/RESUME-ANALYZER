import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Activity, Briefcase, FileText, GaugeCircle, UserRound, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Loader from '../components/Loader.jsx';
import SkillChip from '../components/SkillChip.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getDashboardStatsRequest } from '../services/adminService.js';
import { getErrorMessage } from '../services/api.js';
import { formatRelative } from '../utils/format.js';

const PIE_COLORS = ['#2453e6', '#10b981', '#f59e0b', '#f43f5e'];

const ACTIVITY_TONE = {
  registration: 'bg-brand-50 text-brand-600',
  resume: 'bg-emerald-50 text-emerald-600',
  job: 'bg-indigo-50 text-indigo-600',
  application: 'bg-amber-50 text-amber-600',
};

export default function AdminDashboard() {
  const [state, setState] = useState({ loading: true, error: '', stats: null });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stats = await getDashboardStatsRequest();
        if (active) setState({ loading: false, error: '', stats });
      } catch (error) {
        if (active) setState({ loading: false, error: getErrorMessage(error), stats: null });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) return <Loader fullscreen label="Loading platform analytics..." />;
  if (state.error) return <div className="card border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-600">{state.error}</div>;

  const { totals, topCandidates, applicationsByStatus, scoreDistribution, topSkills, activities, jobsByRecruiter } =
    state.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrator"
        title="Platform overview"
        subtitle="Registrations, resume volume, hiring pipeline and matching quality across the whole system."
        actions={
          <Link to="/admin/users" className="btn-secondary">
            <Users size={16} /> All accounts
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserRound} label="Candidates" value={totals.candidates} hint="Registered job seekers" tone="brand" />
        <StatCard icon={Users} label="Recruiters" value={totals.recruiters} hint="Hiring accounts" tone="indigo" />
        <StatCard icon={FileText} label="Resumes" value={totals.resumes} hint="PDFs parsed and stored" tone="emerald" />
        <StatCard icon={Briefcase} label="Jobs" value={totals.jobs} hint={`${totals.openJobs} open`} tone="amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Activity} label="Applications" value={totals.applications} hint="All time" tone="brand" />
        <StatCard icon={GaugeCircle} label="Match evaluations" value={totals.matches} hint="Job-candidate pairs scored" tone="indigo" />
        <StatCard icon={GaugeCircle} label="Average match" value={`${totals.averageMatchScore}%`} hint="Across all evaluations" tone="emerald" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-base font-bold text-slate-900">Resume matching statistics</h2>
          <p className="text-xs text-slate-500">Distribution of computed match scores</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b6cf6" />
                    <stop offset="100%" stopColor="#93b7ff" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: 'rgba(36,83,230,0.06)' }} />
                <Bar dataKey="count" name="Evaluations" fill="url(#scoreGradient)" radius={[8, 8, 0, 0]} maxBarSize={54} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-base font-bold text-slate-900">Applications by status</h2>
          <p className="text-xs text-slate-500">Where candidates sit in the hiring pipeline</p>
          <div className="mt-4 h-64">
            {applicationsByStatus.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-slate-400">No applications yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={applicationsByStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={52}
                    outerRadius={86}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {applicationsByStatus.map((entry, index) => (
                      <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <section className="card p-5">
          <h2 className="text-base font-bold text-slate-900">Top matching candidates</h2>
          <p className="text-xs text-slate-500">Highest score achieved per candidate</p>
          {topCandidates.length === 0 ? (
            <EmptyState icon={GaugeCircle} title="No match results yet" description="Upload resumes and create jobs to generate rankings." />
          ) : (
            <div className="mt-4 table-wrap border-0">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Candidate</th>
                    <th className="th">Headline</th>
                    <th className="th">Best</th>
                    <th className="th">Average</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topCandidates.map((row) => (
                    <tr key={row.candidateId} className="hover:bg-slate-50/60">
                      <td className="td">
                        <p className="font-semibold text-slate-900">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.email}</p>
                      </td>
                      <td className="td text-xs">{row.headline || '—'}</td>
                      <td className="td">
                        <span className="chip bg-emerald-50 text-emerald-700">{row.bestScore}%</span>
                      </td>
                      <td className="td text-xs text-slate-500">{row.avgScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-base font-bold text-slate-900">Most requested skills</h2>
          <p className="text-xs text-slate-500">Across all candidate profiles</p>
          <div className="mt-4 h-64">
            {topSkills.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-slate-400">No skills extracted yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSkills} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="skill" width={92} tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: 'rgba(36,83,230,0.06)' }} />
                  <Bar dataKey="count" name="Candidates" fill="#2453e6" radius={[0, 6, 6, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <section className="card p-5">
          <h2 className="text-base font-bold text-slate-900">Recent activity</h2>
          <p className="text-xs text-slate-500">Latest registrations, uploads, jobs and applications</p>
          <ul className="mt-4 space-y-3">
            {activities.map((activity, index) => (
              <li key={`${activity.type}-${index}`} className="flex items-start gap-3">
                <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase ${ACTIVITY_TONE[activity.type] || 'bg-slate-100 text-slate-500'}`}>
                  {activity.type.slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700">{activity.message}</p>
                  <p className="text-[11px] text-slate-400">{formatRelative(activity.at)}</p>
                </div>
              </li>
            ))}
            {activities.length === 0 && <li className="text-sm text-slate-400">No activity recorded yet.</li>}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-base font-bold text-slate-900">Jobs by recruiter</h2>
          <p className="text-xs text-slate-500">Companies with the most open postings</p>
          <ul className="mt-4 space-y-3">
            {jobsByRecruiter.map((row) => (
              <li key={row.company} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
                <span className="text-sm font-medium text-slate-700">{row.company}</span>
                <SkillChip variant="brand">{row.count} job{row.count > 1 ? 's' : ''}</SkillChip>
              </li>
            ))}
            {jobsByRecruiter.length === 0 && <li className="text-sm text-slate-400">No jobs posted yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
