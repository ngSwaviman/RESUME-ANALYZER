import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Search, ShieldCheck, UserRound, Users, UserX } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatCard from '../components/StatCard.jsx';
import { listUsersRequest, toggleUserStatusRequest } from '../services/adminService.js';
import { getErrorMessage } from '../services/api.js';
import { formatDate } from '../utils/format.js';

const ROLE_FILTERS = [
  { value: '', label: 'All roles' },
  { value: 'candidate', label: 'Candidates' },
  { value: 'recruiter', label: 'Recruiters' },
  { value: 'admin', label: 'Administrators' },
];

const ROLE_TONE = {
  candidate: 'bg-brand-50 text-brand-700',
  recruiter: 'bg-indigo-50 text-indigo-700',
  admin: 'bg-violet-50 text-violet-700',
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

export default function AdminUsers() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [state, setState] = useState({ loading: true, error: '', users: [] });
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [toggleError, setToggleError] = useState('');

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await listUsersRequest({
        ...(query.trim() ? { q: query.trim() } : {}),
        ...(role ? { role } : {}),
      });
      setState({ loading: false, error: '', users: data.users || [] });
    } catch (error) {
      setState({ loading: false, error: getErrorMessage(error), users: [] });
    }
  }, [query, role]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const handleToggle = async (user) => {
    setBusyId(user.id);
    setToggleError('');
    setNotice('');
    try {
      const data = await toggleUserStatusRequest(user.id);
      setNotice(data.message);
      setState((prev) => ({
        ...prev,
        users: prev.users.map((row) => (row.id === user.id ? { ...row, isActive: data.user.isActive } : row)),
      }));
    } catch (error) {
      setToggleError(getErrorMessage(error));
    } finally {
      setBusyId('');
    }
  };

  const { users } = state;
  const counts = {
    candidates: users.filter((user) => user.role === 'candidate').length,
    recruiters: users.filter((user) => user.role === 'recruiter').length,
    admins: users.filter((user) => user.role === 'admin').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrator"
        title="All accounts"
        subtitle="Every candidate, recruiter and administrator on the platform. Search, filter and deactivate accounts."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={UserRound} label="Candidates" value={counts.candidates} hint="In the current result" tone="brand" />
        <StatCard icon={Users} label="Recruiters" value={counts.recruiters} hint="In the current result" tone="indigo" />
        <StatCard icon={ShieldCheck} label="Administrators" value={counts.admins} hint="In the current result" tone="emerald" />
      </div>

      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Search by name or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search users by name or email"
            />
          </div>
          <select
            className="input sm:w-44"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            aria-label="Filter by role"
          >
            {ROLE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {(query || role) && (
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-brand-700 hover:underline"
            onClick={() => {
              setQuery('');
              setRole('');
            }}
          >
            Clear search
          </button>
        )}
      </div>

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {notice}
        </div>
      )}
      {(state.error || toggleError) && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          {state.error || toggleError}
        </div>
      )}

      {state.loading && users.length === 0 ? (
        <Loader label="Loading accounts..." />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No accounts match"
          description="Try a different name, email or role filter."
          action={
            <button type="button" className="btn-secondary mt-2" onClick={() => { setQuery(''); setRole(''); }}>
              Clear search
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[2fr_1fr_auto_auto] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Account</span>
            <span>Role</span>
            <span>Joined</span>
            <span className="text-right">Access</span>
          </div>

          <ul className="divide-y divide-slate-100">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[2fr_1fr_auto_auto] sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700 ring-1 ring-brand-100">
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>

                <span className={`chip w-fit capitalize ${ROLE_TONE[user.role] || 'bg-slate-100 text-slate-600'}`}>
                  {user.role}
                </span>

                <span className="text-xs text-slate-500">{formatDate(user.createdAt)}</span>

                <div className="flex items-center gap-2 sm:justify-end">
                  <span
                    className={`chip ${
                      user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Disabled'}
                  </span>
                  {user.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleToggle(user)}
                      disabled={busyId === user.id}
                      className="btn-ghost text-xs"
                    >
                      {user.isActive ? <UserX size={14} /> : <CheckCircle2 size={14} />}
                      {busyId === user.id ? 'Saving...' : user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
