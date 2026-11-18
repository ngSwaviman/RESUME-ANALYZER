import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import Modal from './Modal.jsx';
import ScoreBar from './ScoreBar.jsx';
import SkillChip from './SkillChip.jsx';
import { applyToJobRequest } from '../services/applicationService.js';
import { getErrorMessage } from '../services/api.js';

export default function ApplyModal({ open, job, onClose, onApplied }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setCoverLetter('');
      setError('');
      setResult(null);
    }
  }, [open, job?._id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await applyToJobRequest(job._id, coverLetter);
      setResult(data);
      onApplied?.(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!job) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Apply for ${job.title}`}
      description={`${job.company} · ${job.location}`}
      size="md"
      footer={
        result ? (
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" form="apply-form" className="btn-primary" disabled={submitting}>
              <Send size={16} /> {submitting ? 'Submitting...' : 'Submit application'}
            </button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>Your application was submitted with your active resume attached.</span>
          </div>

          {result.match && (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Computed match</p>
              <div className="mt-2"><ScoreBar score={result.match.score} /></div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.match.matchedSkills.map((skill) => (
                  <SkillChip key={skill} variant="matched">{skill}</SkillChip>
                ))}
                {result.match.missingSkills.map((skill) => (
                  <SkillChip key={skill} variant="missing">{skill}</SkillChip>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{result.match.explanation}</p>
            </div>
          )}
        </div>
      ) : (
        <form id="apply-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}

          <div>
            <p className="label">Required skills for this role</p>
            <div className="flex flex-wrap gap-1.5">
              {(job.requiredSkills || []).map((skill) => (
                <SkillChip key={skill} variant="brand">{skill}</SkillChip>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="coverLetter">Cover note (optional)</label>
            <textarea
              id="coverLetter"
              rows={4}
              maxLength={3000}
              className="input resize-y"
              placeholder="A short note on why you fit this role..."
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
            />
          </div>

          <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
            Your active resume is attached automatically. Your match score is calculated on submission and shown
            to the recruiter with matched and missing skills.
          </p>
        </form>
      )}
    </Modal>
  );
}
