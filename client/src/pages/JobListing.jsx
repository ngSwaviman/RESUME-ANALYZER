import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Filter, Search, SlidersHorizontal } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import JobCard from '../components/JobCard.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ApplyModal from '../components/ApplyModal.jsx';
import { listJobsRequest } from '../services/jobService.js';
import { getErrorMessage } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';

const EMPTY_FILTERS = { q: '', location: '', workMode: '', employmentType: '' };

export default function JobListing() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, error: '', jobs: [], pagination: null });
  const [applyJob, setApplyJob] = useState(null);
  const [appliedIds, setAppliedIds] = useState([]);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await listJobsRequest({ ...filters, page, limit: 9 });
      setState({ loading: false, error: '', jobs: data.jobs || [], pagination: data.pagination });
    } catch (error) {
      setState({ loading: false, error: getErrorMessage(error), jobs: [], pagination: null });
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (field) => (event) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    load();
  };

  const isCandidate = user?.role === 'candidate';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 4"
        title="Open positions"
        subtitle="Search by role, company, location or skill. Every posting lists the skills used for matching."
        actions={
          user?.role === 'candidate' ? (
            <Link to="/candidate/recommendations" className="btn-secondary">
              View my matches
            </Link>
          ) : user?.role === 'admin' ? (
            <Link to="/admin/users" className="btn-secondary">
              All accounts
            </Link>
          ) : (
            <Link to="/recruiter/jobs" className="btn-secondary">
              Manage my jobs
            </Link>
          )
        }
      />

      <form onSubmit={handleSearchSubmit} className="card p-4">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Role, company or skill" value={filters.q} onChange={updateFilter('q')} />
          </div>
          <input className="input" placeholder="Location" value={filters.location} onChange={updateFilter('location')} />
          <select className="input" value={filters.workMode} onChange={updateFilter('workMode')}>
            <option value="">Any work mode</option>
            <option value="onsite">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <select className="input" value={filters.employmentType} onChange={updateFilter('employmentType')}>
            <option value="">Any type</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>
          <button type="submit" className="btn-primary">
            <Filter size={16} /> Search
          </button>
        </div>

        {Object.values(filters).some(Boolean) && (
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-brand-700 hover:underline"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(1);
            }}
          >
            Clear filters
          </button>
        )}
      </form>

      {state.error && (
        <div className="card border-rose-100 bg-rose-50/60 p-4 text-sm text-rose-600">{state.error}</div>
      )}

      {state.loading ? (
        <Loader label="Loading jobs..." />
      ) : state.jobs.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No jobs match those filters"
          description="Try a shorter keyword, a different location or clear the filters to see every opening."
          action={
            <button type="button" className="btn-secondary mt-2" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {state.pagination?.total || state.jobs.length} position
              {(state.pagination?.total || state.jobs.length) === 1 ? '' : 's'} found
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase size={14} /> Page {state.pagination?.page || 1} of {state.pagination?.pages || 1}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {state.jobs.map((job) => {
              const applied = appliedIds.includes(job._id);
              return (
                <JobCard
                  key={job._id}
                  job={job}
                  footer={
                    isCandidate ? (
                      <>
                        <button
                          type="button"
                          className="btn-primary flex-1"
                          disabled={applied}
                          onClick={() => setApplyJob(job)}
                        >
                          {applied ? 'Applied' : 'Apply now'}
                        </button>
                        <Link to={`/candidate/recommendations?job=${job._id}`} className="btn-ghost text-xs">
                          Check fit
                        </Link>
                      </>
                    ) : user?.role === 'recruiter' ? (
                      <Link to="/recruiter/jobs" className="btn-secondary w-full text-xs">
                        Manage this posting
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">{job.requiredSkills?.length || 0} required skills</span>
                    )
                  }
                />
              );
            })}
          </div>

          {state.pagination && state.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </button>
              <span className="px-2 text-sm text-slate-500">
                {page} / {state.pagination.pages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={page >= state.pagination.pages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <ApplyModal
        open={Boolean(applyJob)}
        job={applyJob}
        onClose={() => setApplyJob(null)}
        onApplied={() => setAppliedIds((prev) => [...prev, applyJob?._id])}
      />
    </div>
  );
}
