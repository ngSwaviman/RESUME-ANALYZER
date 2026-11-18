import { NavLink } from 'react-router-dom';
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  ScanText,
  Sparkles,
  UploadCloud,
  UserRound,
  Users,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../hooks/useAuth';
import { roleLabel } from '../utils/roles';

const NAV_ITEMS = {
  candidate: [
    { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/candidate/upload', label: 'Upload Resume', icon: UploadCloud },
    { to: '/candidate/analysis', label: 'Resume Analysis', icon: ScanText },
    { to: '/jobs', label: 'Browse Jobs', icon: Briefcase },
    { to: '/candidate/recommendations', label: 'Recommended Jobs', icon: Sparkles },
    { to: '/candidate/profile', label: 'My Profile', icon: UserRound },
  ],
  recruiter: [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recruiter/jobs', label: 'Job Management', icon: Briefcase },
    { to: '/recruiter/ranking', label: 'Candidate Ranking', icon: Users },
    { to: '/jobs', label: 'Browse Jobs', icon: ScanText },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'All Accounts', icon: Users },
    { to: '/jobs', label: 'Browse Jobs', icon: Briefcase },
  ],
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS[user?.role] || NAV_ITEMS.candidate;

  return (
    <div className="flex h-full flex-col gap-6 bg-white px-4 py-5">
      <div className="px-2">
        <Logo to="/" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="rounded-2xl bg-slate-50 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {initials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{roleLabel(user?.role)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}
