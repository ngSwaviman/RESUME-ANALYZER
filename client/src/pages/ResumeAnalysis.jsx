import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  Briefcase,
  Download,
  FolderGit2,
  GraduationCap,
  Linkedin,
  MapPin,
  Mail,
  Phone,
  RefreshCw,
  ScanText,
  UserRound,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SkillChip from '../components/SkillChip.jsx';
import {
  downloadResumeFile,
  getMyResumeRequest,
  reanalyzeResumeRequest,
} from '../services/resumeService.js';
import { getErrorMessage } from '../services/api.js';
import { formatDate, formatFileSize } from '../utils/format.js';

const SECTION_LABELS = {
  email: 'Contact email',
  phone: 'Phone number',
  education: 'Education section',
  experience: 'Experience section',
  skills: 'Skills section',
  certifications: 'Certifications section',
};

export default function ResumeAnalysis() {
  const [state, setState] = useState({ loading: true, error: '', resume: null });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [showText, setShowText] = useState(false);

  const load = async () => {
    try {
      const data = await getMyResumeRequest();
      setState({ loading: false, error: '', resume: data.resume });
    } catch (error) {
      setState({ loading: false, error: getErrorMessage(error), resume: null });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReanalyze = async () => {
    setBusy(true);
    setNotice('');
    try {
      const data = await reanalyzeResumeRequest(state.resume.id);
      setNotice(`Re-analysis complete — ${data.analysis.skills.length} skills detected.`);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: getErrorMessage(error) }));
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadResumeFile(state.resume.id, state.resume.originalName);
    } catch (error) {
      setState((prev) => ({ ...prev, error: getErrorMessage(error) }));
    }
  };

  if (state.loading) return <Loader fullscreen label="Loading your resume analysis..." />;

  if (state.error && !state.resume) {
    return <div className="card border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-600">{state.error}</div>;
  }

  if (!state.resume) {
    return (
      <div className="space-y-6">
        <PageHeader title="Resume analysis" subtitle="Everything extracted from your uploaded PDF." />
        <EmptyState
          icon={ScanText}
          title="No resume to analyse"
          description="Upload a PDF resume and we will extract your contact details, skills, education and experience."
          action={
            <Link to="/candidate/upload" className="btn-primary mt-2">
              Upload resume
            </Link>
          }
        />
      </div>
    );
  }

  const { resume } = state;
  const analysis = resume.analysis || {};
  const sections = analysis.sectionsDetected || {};

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 3"
        title="Resume analysis"
        subtitle="Rule-based extraction from the PDF text layer, with the detected sections and skills."
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={handleDownload}>
              <Download size={16} /> Download PDF
            </button>
            <button type="button" className="btn-primary" onClick={handleReanalyze} disabled={busy}>
              <RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> Re-analyse
            </button>
          </>
        }
      />

      {notice && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          <AlertCircle size={16} className="mt-0.5" /> {state.error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {resume.photo ? (
                <img
                  src={resume.photo}
                  alt="Photo extracted from the PDF"
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <UserRound size={22} />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-slate-900">
                  {analysis.name || resume.originalName}
                </h2>
                {analysis.headline && (
                  <p className="truncate text-xs font-medium text-brand-700">{analysis.headline}</p>
                )}
                <p className="truncate text-xs text-slate-500">
                  {resume.originalName} · {formatFileSize(resume.size)} · uploaded {formatDate(resume.uploadedAt)}
                </p>
                {!resume.photo && (
                  <p className="mt-0.5 text-[11px] text-slate-400">No photo embedded in this PDF</p>
                )}
              </div>
            </div>
            <span className="chip bg-brand-50 text-brand-700">{analysis.wordCount || 0} words</span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
                <Mail size={12} /> Email
              </dt>
              <dd className="mt-1 break-all text-sm font-medium text-slate-800">{analysis.email || 'Not found'}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
                <Phone size={12} /> Phone
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{analysis.phone || 'Not found'}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
                <MapPin size={12} /> Location
              </dt>
              <dd className="mt-1 truncate text-sm font-medium text-slate-800">{analysis.location || 'Not found'}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
                <Briefcase size={12} /> Experience
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{analysis.experienceYears || 0} years</dd>
            </div>
          </dl>

          {(analysis.links?.linkedin || analysis.links?.github || analysis.links?.portfolio) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {analysis.links?.linkedin && (
                <a
                  href={analysis.links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="chip bg-brand-50 text-brand-700 hover:underline"
                >
                  <Linkedin size={11} className="mr-1" /> LinkedIn
                </a>
              )}
              {analysis.links?.github && (
                <a
                  href={analysis.links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="chip bg-slate-100 text-slate-700 hover:underline"
                >
                  GitHub
                </a>
              )}
              {analysis.links?.portfolio && (
                <a
                  href={analysis.links.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="chip bg-slate-100 text-slate-700 hover:underline"
                >
                  Portfolio
                </a>
              )}
            </div>
          )}

          <div className="mt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Extracted skills ({analysis.skills?.length || 0})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(analysis.skills || []).map((skill) => (
                <SkillChip key={skill} variant="brand">{skill}</SkillChip>
              ))}
              {(analysis.skills || []).length === 0 && (
                <p className="text-sm text-slate-500">No known skills were detected in this PDF.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="text-base font-bold text-slate-900">Sections detected</h2>
            <ul className="mt-3 space-y-2">
              {Object.entries(SECTION_LABELS).map(([key, label]) => (
                <li key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-600">{label}</span>
                  <span className={`chip ${sections[key] ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                    {sections[key] ? 'Detected' : 'Not found'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <UserRound size={16} className="text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Contact block</h2>
            </div>
            <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">
{analysis.headerPreview || 'No header text captured.'}
            </pre>
          </div>
        </div>
      </div>

      {analysis.summary && (
        <section className="card p-5">
          <h2 className="mb-2 text-base font-bold text-slate-900">Professional summary</h2>
          <p className="text-sm leading-relaxed text-slate-600">{analysis.summary}</p>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap size={18} className="text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Education</h2>
          </div>
          {(analysis.education || []).length === 0 ? (
            <p className="text-sm text-slate-500">No education lines were detected.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.education.map((line) => (
                <li key={line} className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase size={18} className="text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Work experience</h2>
          </div>
          {(analysis.experience || []).length === 0 ? (
            <p className="text-sm text-slate-500">No experience lines were detected.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.experience.map((line) => (
                <li key={line} className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {(analysis.projects || []).length > 0 && (
        <section className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <FolderGit2 size={18} className="text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Projects</h2>
          </div>
          <ul className="space-y-2">
            {analysis.projects.map((project) => (
              <li key={project} className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700">
                {project}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Award size={18} className="text-brand-600" />
          <h2 className="text-base font-bold text-slate-900">Certifications</h2>
        </div>
        {(analysis.certifications || []).length === 0 ? (
          <p className="text-sm text-slate-500">No certifications were detected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {analysis.certifications.map((certification) => (
              <span key={certification} className="chip bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                {certification}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Extracted text</h2>
            <p className="text-xs text-slate-500">The exact text layer used by the matching engine</p>
          </div>
          <button type="button" className="btn-ghost text-xs" onClick={() => setShowText((value) => !value)}>
            {showText ? 'Hide text' : 'Show text'}
          </button>
        </div>
        {showText && (
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-200">
{resume.textPreview || 'Text preview unavailable.'}
          </pre>
        )}
      </section>
    </div>
  );
}
