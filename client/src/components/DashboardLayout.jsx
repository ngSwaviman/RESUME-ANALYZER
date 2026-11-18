import { useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Menu, Search, X, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { roleLabel } from '../utils/roles';

const SEARCH_TARGET = {
  candidate: { to: '/jobs', label: 'Search roles' },
  recruiter: { to: '/recruiter/ranking', label: 'Search candidates' },
  admin: { to: '/admin/users', label: 'Search accounts' },
};

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const search = SEARCH_TARGET[user?.role] || SEARCH_TARGET.candidate;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 animate-fade-up bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {roleLabel(user?.role)} workspace
                </p>
                <p className="text-sm font-semibold text-slate-800">Welcome back, {user?.name?.split(' ')[0]}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={search.to}
                className="hidden items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-brand-200 hover:text-brand-700 sm:flex"
              >
                <Search size={14} />
                {search.label}
              </Link>
              <span className="hidden rounded-xl border border-slate-200 p-2 text-slate-400 sm:block">
                <Bell size={16} />
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
