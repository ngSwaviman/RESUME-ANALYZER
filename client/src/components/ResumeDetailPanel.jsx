import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  Briefcase,
  FolderGit2,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react';
import SkillChip from './SkillChip.jsx';
import { getCandidateResumeRequest } from '../services/resumeService.js';
import { getErrorMessage } from '../services/api.js';
import { formatDate, formatFileSize } from '../utils/format.js';

const LinkChip = ({ href, icon: Icon, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 hover:underline"
  >
    <Icon size={11} /> {label}
  </a>
);

/**
 * Extracted resume details for a candidate: contact block, photo and every
 * parsed section. Used by the recruiter ranking modal.
 */
export default function ResumeDetailPanel({ candidateId, job }) {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    if (!candidateId) return undefined;
    let active = true;
    setState({ loading: true, error: '', data: null });

    getCandidateResumeRequest(candidateId)
      .then((data) => {
        if (active) setState({ loading: false, error: '', data });
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: getErrorMessage(error), data: null });
      });

    return () => {
      active = false;
    };
  }, [candidateId]);

  if (!candidateId) return null;

  if (state.loading) {
    return (
      <div className="animate-pulse space-y-3 rounded-2xl border border-slate-200 p-4">
        <div className="flex gap-3">
          <div className="h-16 w-16 rounded-2xl bg-slate-100" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-40 rounded bg-slate-100" />
            <div className="h-3 w-56 rounded bg-slate-100" />
            <div className="h-3 w-32 rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-slate-100" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
        <AlertCircle size={15} className="mt-0.5 shrink-0" /> {state.error}
      </div>
    );
  }

  const { candidate, resume } = state.data;
  const analysis = resume.analysis || {};
  const links = analysis.links || {};
  const initials = (candidate.name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const education = analysis.education || [];
  const experience = analysis.experience || [];
  const certifications = analysis.certifications || [];
  const projects = analysis.projects || [];
  const skills = candidate.skills?.length ? candidate.skills : analysis.skills || [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-start gap-4">
          {resume.photo ? (
            <img
              src={resume.photo}
              alt={`${candidate.name} photo extracted from the resume`}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-400">
              {initials || <UserRound size={22} />}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900">{candidate.name}</p>
            <p className="truncate text-xs text-slate-500">
              {candidate.headline || 'Role not stated in the resume'}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
              {candidate.email && (
                <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-700">
                  <Mail size={12} className="text-slate-400" /> {candidate.email}
                </a>
              )}
              {candidate.phone && (
                <a href={`tel:${candidate.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-brand-700">
                  <Phone size={12} className="text-slate-400" /> {candidate.phone}
                </a>
              )}
              {candidate.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} className="text-slate-400" /> {candidate.location}
                </span>
              )}
            </div>

            {candidate.accountEmail && candidate.accountEmail !== candidate.email && (
              <p className="mt-1 text-[11px] text-slate-400">Account email: {candidate.accountEmail}</p>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
              {links.linkedin && <LinkChip href={links.linkedin} icon={Linkedin} label="LinkedIn" />}
              {links.github && <LinkChip href={links.github} icon={Github} label="GitHub" />}
              {links.portfolio && <LinkChip href={links.portfolio} icon={Globe} label="Portfolio" />}
            </div>

            {!resume.photo && (
              <p className="mt-1 text-[11px] text-slate-400">No photo embedded in this PDF</p>
            )}
          </div>

          <div className="text-right text-[11px] text-slate-400">
            <p className="font-medium text-slate-600">{resume.originalName}</p>
            <p>
              {formatFileSize(resume.size)} · {analysis.wordCount || 0} words
            </p>
            <p>Uploaded {formatDate(resume.uploadedAt)}</p>
          </div>
        </div>

        {job && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 text-[11px]">
            <span className="chip bg-slate-100 text-slate-600">Requires: {job.education || 'Any degree'}</span>
            <span className="chip bg-slate-100 text-slate-600">Experience: {job.minExperience || 0}+ yrs</span>
          </div>
        )}
      </div>

      {analysis.summary && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Professional summary
          </p>
          <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">{analysis.summary}</p>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Extracted skills ({skills.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <SkillChip key={skill} variant="brand">{skill}</SkillChip>
          ))}
          {skills.length === 0 && <span className="text-xs text-slate-400">No skills detected</span>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
            <GraduationCap size={12} /> Education
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
            {education.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
            {education.length === 0 && <li className="text-slate-400">Not extracted</li>}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
            <Briefcase size={12} /> Experience ({analysis.experienceYears || 0} yrs)
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
            {experience.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
            {experience.length === 0 && <li className="text-slate-400">Not extracted</li>}
          </ul>
        </div>
      </div>

      {certifications.length > 0 && (
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
            <Award size={12} /> Certifications
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {certifications.map((item) => (
              <span key={item} className="chip bg-amber-50 text-amber-700">{item}</span>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
            <FolderGit2 size={12} /> Projects
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
            {projects.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
