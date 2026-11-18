import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Plus,
  Save,
  ScanText,
  Trash2,
  UserRound,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import SkillChip from '../components/SkillChip.jsx';
import { meRequest, updateProfileRequest } from '../services/authService.js';
import { getErrorMessage } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';

const toListString = (list = []) => (Array.isArray(list) ? list.join(', ') : '');
const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const EMPTY_EDUCATION = { degree: '', institution: '', field: '', endYear: '', score: '' };
const EMPTY_EXPERIENCE = { title: '', company: '', startDate: '', endDate: '', description: '' };

export default function CandidateProfile() {
  const { refresh, profile: cachedProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [resume, setResume] = useState(null);
  const [completion, setCompletion] = useState(cachedProfile?.profileCompletion || 0);
  const [form, setForm] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await meRequest();
        const profile = data.profile || {};
        setResume(data.resume);
        setCompletion(profile.profileCompletion || 0);
        setForm({
          name: data.user?.name || '',
          phone: data.user?.phone || '',
          headline: profile.headline || '',
          summary: profile.summary || '',
          location: profile.location || '',
          skills: toListString(profile.skills),
          certifications: toListString(profile.certifications),
          linkedin: profile.links?.linkedin || '',
          github: profile.links?.github || '',
          portfolio: profile.links?.portfolio || '',
          education: profile.education?.length ? profile.education : [{ ...EMPTY_EDUCATION }],
          experience: profile.experience?.length ? profile.experience : [],
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const updateEducation = (index, field) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      const education = [...prev.education];
      education[index] = { ...education[index], [field]: value };
      return { ...prev, education };
    });
  };

  const updateExperience = (index, field) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      const experience = [...prev.experience];
      experience[index] = { ...experience[index], [field]: value };
      return { ...prev, experience };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        headline: form.headline,
        summary: form.summary,
        location: form.location,
        skills: splitList(form.skills),
        certifications: splitList(form.certifications),
        links: { linkedin: form.linkedin, github: form.github, portfolio: form.portfolio },
        education: form.education
          .filter((entry) => entry.degree || entry.institution)
          .map((entry) => ({ ...entry, endYear: entry.endYear ? Number(entry.endYear) : undefined })),
        experience: form.experience.filter((entry) => entry.title || entry.company),
      };
      const data = await updateProfileRequest(payload);
      setCompletion(data.profile?.profileCompletion || 0);
      setNotice('Profile saved successfully.');
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <Loader fullscreen label="Loading your profile..." />;

  const skills = splitList(form.skills);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="My profile"
        subtitle="Keep this accurate — recruiters see it alongside your resume and match score."
        actions={
          <Link to="/candidate/analysis" className="btn-secondary">
            <ScanText size={16} /> Parsed resume
          </Link>
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

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserRound size={18} className="text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Basic details</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input id="name" className="input" value={form.name} onChange={update('name')} required />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <input id="phone" className="input" value={form.phone} onChange={update('phone')} placeholder="+91 90000 00000" />
              </div>
              <div>
                <label className="label" htmlFor="headline">Headline</label>
                <input id="headline" className="input" value={form.headline} onChange={update('headline')} placeholder="MERN Stack Developer" />
              </div>
              <div>
                <label className="label" htmlFor="location">Location</label>
                <input id="location" className="input" value={form.location} onChange={update('location')} placeholder="Bhubaneswar, Odisha" />
              </div>
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="summary">Professional summary</label>
              <textarea id="summary" rows={4} className="input resize-y" value={form.summary} onChange={update('summary')} placeholder="Two or three lines about your experience and strengths." />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="linkedin">LinkedIn</label>
                <input id="linkedin" className="input" value={form.linkedin} onChange={update('linkedin')} />
              </div>
              <div>
                <label className="label" htmlFor="github">GitHub</label>
                <input id="github" className="input" value={form.github} onChange={update('github')} />
              </div>
              <div>
                <label className="label" htmlFor="portfolio">Portfolio</label>
                <input id="portfolio" className="input" value={form.portfolio} onChange={update('portfolio')} />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold text-slate-900">Skills &amp; certifications</h2>
            <div className="mt-4">
              <label className="label" htmlFor="skills">Skills (comma separated)</label>
              <input id="skills" className="input" value={form.skills} onChange={update('skills')} placeholder="React.js, Node.js, MongoDB" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skills.slice(0, 20).map((skill) => (
                  <SkillChip key={skill} variant="brand">{skill}</SkillChip>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="certifications">Certifications (comma separated)</label>
              <input id="certifications" className="input" value={form.certifications} onChange={update('certifications')} placeholder="AWS Certified Cloud Practitioner" />
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-brand-600" />
                <h2 className="text-base font-bold text-slate-900">Education</h2>
              </div>
              <button
                type="button"
                className="btn-ghost text-xs text-brand-700"
                onClick={() => setForm((prev) => ({ ...prev, education: [...prev.education, { ...EMPTY_EDUCATION }] }))}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <div className="space-y-3">
              {form.education.map((entry, index) => (
                <div key={index} className="rounded-xl border border-slate-200 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="input" placeholder="Degree (B.Tech in CSE)" value={entry.degree} onChange={updateEducation(index, 'degree')} />
                    <input className="input" placeholder="Institution" value={entry.institution} onChange={updateEducation(index, 'institution')} />
                    <input className="input" placeholder="Field of study" value={entry.field || ''} onChange={updateEducation(index, 'field')} />
                    <div className="grid grid-cols-2 gap-3">
                      <input className="input" placeholder="End year" value={entry.endYear || ''} onChange={updateEducation(index, 'endYear')} />
                      <input className="input" placeholder="CGPA / %" value={entry.score || ''} onChange={updateEducation(index, 'score')} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-500 hover:underline"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, education: prev.education.filter((_, itemIndex) => itemIndex !== index) }))
                    }
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Work experience</h2>
              <button
                type="button"
                className="btn-ghost text-xs text-brand-700"
                onClick={() => setForm((prev) => ({ ...prev, experience: [...prev.experience, { ...EMPTY_EXPERIENCE }] }))}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {form.experience.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No experience added. Add internships or projects here — the resume parser can also populate it.
              </p>
            ) : (
              <div className="space-y-3">
                {form.experience.map((entry, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className="input" placeholder="Job title" value={entry.title || ''} onChange={updateExperience(index, 'title')} />
                      <input className="input" placeholder="Company" value={entry.company || ''} onChange={updateExperience(index, 'company')} />
                      <input className="input" placeholder="Start (Jan 2023)" value={entry.startDate || ''} onChange={updateExperience(index, 'startDate')} />
                      <input className="input" placeholder="End (Present)" value={entry.endDate || ''} onChange={updateExperience(index, 'endDate')} />
                    </div>
                    <textarea
                      className="input mt-3 resize-y"
                      rows={2}
                      placeholder="What you built and the impact"
                      value={entry.description || ''}
                      onChange={updateExperience(index, 'description')}
                    />
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-500 hover:underline"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, experience: prev.experience.filter((_, itemIndex) => itemIndex !== index) }))
                      }
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="text-base font-bold text-slate-900">Profile strength</h2>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Completion</span>
                <span className="text-brand-700">{completion}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-brand-600 transition-all duration-700" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>Resume uploaded</span>
                <span className={`chip ${resume ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                  {resume ? 'Yes' : 'No'}
                </span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>Skills added</span>
                <span className="chip bg-brand-50 text-brand-700">{skills.length}</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>Education entries</span>
                <span className="chip bg-slate-100 text-slate-600">{form.education.filter((entry) => entry.degree).length}</span>
              </li>
            </ul>

            {!resume && (
              <Link to="/candidate/upload" className="btn-primary mt-4 w-full text-xs">
                Upload resume
              </Link>
            )}
          </div>

          {resume && (
            <div className="card p-5">
              <h2 className="text-base font-bold text-slate-900">Parsed from your resume</h2>
              <p className="mt-1 text-xs text-slate-500">{resume.originalName}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(resume.analysis?.skills || []).slice(0, 12).map((skill) => (
                  <SkillChip key={skill}>{skill}</SkillChip>
                ))}
              </div>
              <Link to="/candidate/analysis" className="btn-secondary mt-4 w-full text-xs">
                View full analysis
              </Link>
            </div>
          )}

          <div className="rounded-2xl bg-navy-900 p-5 text-white">
            <h3 className="text-sm font-bold">About matching</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-brand-100/80">
              Skills are extracted from your PDF and compared with each job's required skills. The remaining score
              comes from TF-IDF cosine similarity of the full documents.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
