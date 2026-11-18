import { BriefcaseBusiness, GraduationCap, MapPin, Wallet } from 'lucide-react';
import SkillChip from './SkillChip';
import ScoreBar from './ScoreBar';
import { formatSalary } from '../utils/format';

export default function JobCard({ job, score, matchedSkills = [], missingSkills = [], footer }) {
  const required = job.requiredSkills || [];

  return (
    <article className="card flex h-full flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
          <p className="mt-0.5 text-sm font-medium text-brand-700">{job.company}</p>
        </div>
        <span className="chip bg-brand-50 text-brand-700 capitalize">{job.employmentType?.replace('-', ' ')}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={13} /> {job.location || 'Not specified'}
        </span>
        <span className="inline-flex items-center gap-1.5 capitalize">
          <BriefcaseBusiness size={13} /> {job.workMode}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Wallet size={13} /> {formatSalary(job.salary)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <GraduationCap size={13} /> {job.minExperience ? `${job.minExperience}+ yrs` : 'Fresher OK'}
        </span>
      </div>

      {typeof score === 'number' && <ScoreBar score={score} />}

      {job.description && (
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{job.description}</p>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Required skills
        </p>
        <div className="flex flex-wrap gap-1.5">
          {required.slice(0, 8).map((skill) => (
            <SkillChip
              key={skill}
              variant={
                matchedSkills.length
                  ? matchedSkills.includes(skill)
                    ? 'matched'
                    : missingSkills.includes(skill)
                      ? 'missing'
                      : 'neutral'
                  : 'brand'
              }
            >
              {skill}
            </SkillChip>
          ))}
          {required.length > 8 && <SkillChip>+{required.length - 8} more</SkillChip>}
        </div>
      </div>

      {footer && <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">{footer}</div>}
    </article>
  );
}
