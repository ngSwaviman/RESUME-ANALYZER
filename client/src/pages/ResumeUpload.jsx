import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import SkillChip from '../components/SkillChip.jsx';
import Loader from '../components/Loader.jsx';
import { getMyResumeRequest, uploadResumeRequest } from '../services/resumeService.js';
import { getErrorMessage } from '../services/api.js';
import { formatFileSize } from '../utils/format.js';

const MAX_SIZE_MB = 5;

export default function ResumeUpload() {
  const inputRef = useRef(null);
  const [current, setCurrent] = useState(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getMyResumeRequest()
      .then((data) => {
        if (active) setCurrent(data.resume);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingCurrent(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const acceptFile = (selected) => {
    setError('');
    setResult(null);
    if (!selected) return;
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted.');
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setProgress(0);
    try {
      const data = await uploadResumeRequest(file, (event) => {
        if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
      });
      setResult(data);
      setCurrent({
        id: data.resume.id,
        originalName: data.resume.originalName,
        size: data.resume.size,
        uploadedAt: data.resume.uploadedAt,
        analysis: data.resume.analysis,
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const analysis = result?.resume?.analysis;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 2 & 3"
        title="Resume upload & parsing"
        subtitle="Upload a text-based PDF. The server extracts the text layer, identifies your skills and updates your profile."
      />

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-5">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              acceptFile(event.dataTransfer.files?.[0]);
            }}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
              dragging ? 'border-brand-500 bg-brand-50/60' : 'border-slate-300 bg-slate-50/60'
            }`}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-md">
              <UploadCloud size={24} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Drag and drop your resume here</p>
              <p className="mt-1 text-xs text-slate-500">PDF only · maximum {MAX_SIZE_MB} MB · text-based (not scanned)</p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>
              <FileText size={16} /> Choose PDF
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-brand-600 ring-1 ring-brand-100">
                  <FileText size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-500"
                onClick={() => setFile(null)}
                aria-label="Remove selected file"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {uploading && (
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
                <span>Extracting text and analysing...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${Math.max(6, progress)}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={!file || uploading} onClick={handleUpload}>
              {uploading ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              {uploading ? 'Uploading...' : 'Upload and analyse'}
            </button>
            {current && (
              <Link to="/candidate/analysis" className="btn-secondary">
                View current analysis <ArrowRight size={16} />
              </Link>
            )}
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>
              Files are stored on the server, not in a public folder. Only you, recruiters evaluating your
              application and the administrator can open them.
            </span>
          </div>
        </section>

        <section className="space-y-5">
          <div className="card p-5">
            <h2 className="text-base font-bold text-slate-900">Current resume</h2>
            {loadingCurrent ? (
              <Loader label="" size="sm" />
            ) : current ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{current.originalName}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(current.size)} · active</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <dt className="text-slate-400">Skills found</dt>
                    <dd className="text-base font-bold text-slate-900">{current.analysis?.skills?.length || 0}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <dt className="text-slate-400">Experience</dt>
                    <dd className="text-base font-bold text-slate-900">{current.analysis?.experienceYears || 0} yr</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No resume uploaded yet. Upload a PDF to unlock matching and recommendations.
              </p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-base font-bold text-slate-900">What gets extracted</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {['Name, email and phone number', 'Technical and professional skills', 'Education history', 'Work experience and total years', 'Certifications'].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {analysis && (
        <section className="card animate-fade-up p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Latest analysis</h2>
              <p className="text-xs text-slate-500">{result?.message}</p>
            </div>
            <span className="chip bg-emerald-50 text-emerald-700">
              {analysis.skills.length} skills detected
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Name</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{analysis.name || 'Not detected'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Email</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">{analysis.email || 'Not detected'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Phone</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{analysis.phone || 'Not detected'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Experience</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{analysis.experienceYears || 0} years</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.skills.map((skill) => (
                <SkillChip key={skill} variant="brand">{skill}</SkillChip>
              ))}
            </div>
          </div>

          <Link to="/candidate/analysis" className="btn-secondary mt-5">
            Open full resume analysis <ArrowRight size={16} />
          </Link>
        </section>
      )}
    </div>
  );
}
