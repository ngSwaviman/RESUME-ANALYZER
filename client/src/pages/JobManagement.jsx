import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SkillChip from '../components/SkillChip.jsx';
import {
  createJobRequest,
  deleteJobRequest,
  listJobsRequest,
  updateJobRequest,
} from '../services/jobService.js';
import { getErrorMessage } from '../services/api.js';
import { formatDate } from '../utils/format.js';

const EMPTY_FORM = {
  title: '',
  location: '',
  workMode: 'onsite',
  employmentType: 'full-time',
  minExperience: 0,
  education: 'Any',
  openings: 1,
  description: '',
  requiredSkills: '',
  preferredSkills: '',
  salaryMin: '',
  salaryMax: '',
  status: 'open',
};

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listJobsRequest({ mine: 'true', limit: 50 });
      setJobs(data.jobs || []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (job) => {
    setEditing(job);
    setForm({
      title: job.title || '',
      location: job.location || '',
      workMode: job.workMode || 'onsite',
      employmentType: job.employmentType || 'full-time',
      minExperience: job.minExperience || 0,
      education: job.education || 'Any',
      openings: job.openings || 1,
      description: job.description || '',
      requiredSkills: (job.requiredSkills || []).join(', '),
      preferredSkills: (job.preferredSkills || []).join(', '),
      salaryMin: job.salary?.min || '',
      salaryMax: job.salary?.max || '',
      status: job.status || 'open',
    });
    setFormError('');
    setFormOpen(true);
  };

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError('');

    const requiredSkills = splitList(form.requiredSkills);
    if (!form.title.trim()) return setFormError('Job title is required.');
    if (form.description.trim().length < 40) {
      return setFormError('Job description must be at least 40 characters so matching has enough text.');
    }
    if (requiredSkills.length === 0) return setFormError('Add at least one required skill.');

    const payload = {
      title: form.title.trim(),
      location: form.location.trim() || 'Not specified',
      workMode: form.workMode,
      employmentType: form.employmentType,
      minExperience: Number(form.minExperience) || 0,
      education: form.education.trim() || 'Any',
      openings: Number(form.openings) || 1,
      description: form.description.trim(),
      requiredSkills,
      preferredSkills: splitList(form.preferredSkills),
      salary: {
        min: Number(form.salaryMin) || 0,
        max: Number(form.salaryMax) || 0,
        currency: 'INR',
      },
      status: form.status,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateJobRequest(editing._id, payload);
        setNotice('Job updated. Existing scores were cleared because the requirements changed.');
      } else {
        await createJobRequest(payload);
        setNotice('Job posted successfully.');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteJobRequest(deleteTarget._id);
      setNotice(`"${deleteTarget.title}" and its applications were removed.`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 4"
        title="Job management"
        subtitle="Create, edit and close vacancies. Required skills drive the matching engine."
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Post a job
          </button>
        }
      />

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {notice}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <Loader label="Loading your postings..." />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job postings yet"
          description="Create your first vacancy with the skills, experience and education you need."
          action={
            <button type="button" className="btn-primary mt-2" onClick={openCreate}>
              <Plus size={16} /> Post a job
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="table-wrap border-0">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Role</th>
                  <th className="th">Required skills</th>
                  <th className="th">Applicants</th>
                  <th className="th">Posted</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-50/60">
                    <td className="td">
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-500">
                        {job.location} · {job.workMode} · {job.minExperience || 0}+ yrs
                      </p>
                    </td>
                    <td className="td">
                      <div className="flex max-w-[260px] flex-wrap gap-1">
                        {(job.requiredSkills || []).slice(0, 4).map((skill) => (
                          <SkillChip key={skill} variant="brand">{skill}</SkillChip>
                        ))}
                        {(job.requiredSkills || []).length > 4 && (
                          <SkillChip>+{job.requiredSkills.length - 4}</SkillChip>
                        )}
                      </div>
                    </td>
                    <td className="td">
                      <Link
                        to={`/recruiter/ranking?job=${job._id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                      >
                        <Users size={14} /> {job.applicationCount || 0}
                      </Link>
                    </td>
                    <td className="td whitespace-nowrap text-xs text-slate-500">{formatDate(job.createdAt)}</td>
                    <td className="td">
                      <span
                        className={`chip ${job.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" className="btn-ghost p-2" onClick={() => openEdit(job)} aria-label="Edit job">
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost p-2 text-rose-500 hover:bg-rose-50"
                          onClick={() => setDeleteTarget(job)}
                          aria-label="Delete job"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit job posting' : 'Post a new job'}
        description="Required skills are extracted and canonicalised before matching."
        size="lg"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="job-form" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Publish job'}
            </button>
          </>
        }
      >
        <form id="job-form" onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="title">Job title</label>
              <input id="title" className="input" required value={form.title} onChange={update('title')} placeholder="MERN Stack Developer" />
            </div>
            <div>
              <label className="label" htmlFor="jobLocation">Location</label>
              <input id="jobLocation" className="input" value={form.location} onChange={update('location')} placeholder="Bhubaneswar, Odisha" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="workMode">Work mode</label>
              <select id="workMode" className="input" value={form.workMode} onChange={update('workMode')}>
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="employmentType">Employment type</label>
              <select id="employmentType" className="input" value={form.employmentType} onChange={update('employmentType')}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" className="input" value={form.status} onChange={update('status')}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="minExperience">Minimum experience (years)</label>
              <input id="minExperience" type="number" min="0" max="40" className="input" value={form.minExperience} onChange={update('minExperience')} />
            </div>
            <div>
              <label className="label" htmlFor="openings">Openings</label>
              <input id="openings" type="number" min="1" max="100" className="input" value={form.openings} onChange={update('openings')} />
            </div>
            <div>
              <label className="label" htmlFor="education">Education requirement</label>
              <input id="education" className="input" value={form.education} onChange={update('education')} placeholder="B.Tech / MCA" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="description">Job description</label>
            <textarea
              id="description"
              rows={5}
              className="input resize-y"
              required
              placeholder="Describe the role, the day to day work and the technologies used. At least 40 characters."
              value={form.description}
              onChange={update('description')}
            />
            <p className="mt-1 text-xs text-slate-400">{form.description.trim().length} characters</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="requiredSkills">Required skills (comma separated)</label>
              <input
                id="requiredSkills"
                className="input"
                required
                placeholder="React.js, Node.js, MongoDB"
                value={form.requiredSkills}
                onChange={update('requiredSkills')}
              />
              <p className="mt-1 text-xs text-slate-400">These drive the match score.</p>
            </div>
            <div>
              <label className="label" htmlFor="preferredSkills">Preferred skills (optional)</label>
              <input
                id="preferredSkills"
                className="input"
                placeholder="TypeScript, Docker"
                value={form.preferredSkills}
                onChange={update('preferredSkills')}
              />
              <p className="mt-1 text-xs text-slate-400">Shown to candidates but not scored.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="salaryMin">Salary minimum (₹ per year)</label>
              <input id="salaryMin" type="number" min="0" className="input" value={form.salaryMin} onChange={update('salaryMin')} placeholder="600000" />
            </div>
            <div>
              <label className="label" htmlFor="salaryMax">Salary maximum (₹ per year)</label>
              <input id="salaryMax" type="number" min="0" className="input" value={form.salaryMax} onChange={update('salaryMax')} placeholder="950000" />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this job?"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setDeleteTarget(null)}>
              Keep job
            </button>
            <button type="button" className="btn-primary bg-rose-600 hover:bg-rose-700" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete permanently'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          <strong className="text-slate-900">{deleteTarget?.title}</strong> and all of its applications and match
          results will be deleted. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
