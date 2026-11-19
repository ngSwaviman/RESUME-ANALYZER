import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Building2, Clock, ShieldCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../services/api.js';

const INITIAL = {
  name: '',
  email: '',
  phone: '',
  password: '',
  company: '',
  designation: '',
  location: '',
  industry: '',
};

export default function RecruiterRegister() {
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await register({ ...form, role: 'recruiter' });
      // A new recruiter account is pending until an administrator approves it,
      // so there is no session to open yet.
      if (data?.pendingApproval) {
        setPendingMessage(data.message);
        return;
      }
      navigate('/recruiter/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (pendingMessage) {
    return (
      <AuthLayout
        title="Account created"
        subtitle="One more step before you can sign in."
        bullets={[
          'An administrator reviews every new recruiter account',
          'You will be able to log in as soon as it is approved',
          'Candidates can register and start immediately',
        ]}
        footer={
          <>
            Already approved?{' '}
            <Link to="/login" className="font-semibold text-iris-600 hover:underline">Sign in</Link>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Clock size={18} className="mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Waiting for administrator approval</p>
              <p>{pendingMessage}</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            {['Your company details were saved with the account.', 'Your login will work once approved.'].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link to="/login" className="btn-auth">
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create a recruiter account"
              subtitle="Publish openings and rank applicants by measured skill overlap. Every new recruiter account is reviewed by an administrator before it can sign in."
      bullets={[
        'Job postings with required skills, experience and education',
        'Ranked candidates with matched and missing skills per role',
        'Application pipeline with shortlist and rejection tracking',
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" className="input" required placeholder="Recruiter name" value={form.name} onChange={update('name')} />
          </div>
          <div>
            <label className="label" htmlFor="email">Work email</label>
            <input id="email" type="email" className="input" required placeholder="you@company.com" value={form.email} onChange={update('email')} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="company">Company name</label>
            <input id="company" className="input" required placeholder="Acme Technologies" value={form.company} onChange={update('company')} />
          </div>
          <div>
            <label className="label" htmlFor="designation">Designation (optional)</label>
            <input id="designation" className="input" placeholder="Talent Acquisition Lead" value={form.designation} onChange={update('designation')} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="location">Location (optional)</label>
            <input id="location" className="input" placeholder="Bhubaneswar, Odisha" value={form.location} onChange={update('location')} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone (optional)</label>
            <input id="phone" className="input" placeholder="+91 90000 00000" value={form.phone} onChange={update('phone')} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="industry">Industry (optional)</label>
          <input id="industry" className="input" placeholder="Product Engineering" value={form.industry} onChange={update('industry')} />
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
        </div>

        <button type="submit" className="btn-auth" disabled={submitting}>
          <Building2 size={17} />
          {submitting ? 'Creating account...' : 'Create recruiter account'}
        </button>

        <p className="text-center text-sm text-slate-500">
          Looking for a job?{' '}
          <Link to="/register/candidate" className="font-semibold text-iris-600 hover:underline">
            Candidate registration
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
