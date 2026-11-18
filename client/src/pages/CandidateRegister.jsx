import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, UserPlus } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../services/api.js';

const INITIAL = {
  name: '',
  email: '',
  phone: '',
  password: '',
  headline: '',
  location: '',
};

export default function CandidateRegister() {
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({ ...form, role: 'candidate' });
      navigate('/candidate/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your candidate account"
      subtitle="Upload a resume and get matched with roles that fit your skills."
      bullets={[
        'Automatic skill, education and experience extraction from your PDF',
        'Match percentages with the exact skills you are missing',
        'One profile, applications tracked in a single dashboard',
      ]}
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-iris-600 hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
          </div>
        )}

        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" required maxLength={80} placeholder="Your full name" value={form.name} onChange={update('name')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" required placeholder="you@example.com" value={form.email} onChange={update('email')} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone (optional)</label>
            <input id="phone" className="input" placeholder="+91 90000 00000" value={form.phone} onChange={update('phone')} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="headline">Headline (optional)</label>
            <input id="headline" className="input" placeholder="MERN Stack Developer" value={form.headline} onChange={update('headline')} />
          </div>
          <div>
            <label className="label" htmlFor="location">Location (optional)</label>
            <input id="location" className="input" placeholder="Bhubaneswar, Odisha" value={form.location} onChange={update('location')} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            required
            minLength={6}
            placeholder="At least 6 characters"
            value={form.password}
            onChange={update('password')}
          />
          <p className="mt-1.5 text-xs text-slate-400">Stored as a bcrypt hash — never in plain text.</p>
        </div>

        <button type="submit" className="btn-auth" disabled={submitting}>
          <UserPlus size={17} />
          {submitting ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-500">
          Hiring instead?{' '}
          <Link to="/register/recruiter" className="font-semibold text-iris-600 hover:underline">
            Recruiter registration
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
