import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../services/api.js';
import { homeFor } from '../utils/roles.js';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(form);
      const redirectTo = location.state?.from || homeFor(data.user.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your workspace."
      bullets={[
        'Role-based dashboards for candidates, recruiters and the administrator',
        'Resume scores you can trace back to individual skills',
        'Applications tracked from applied to shortlisted',
      ]}
      footer={
        <>
          New here?{' '}
          <Link to="/register/candidate" className="font-semibold text-iris-600 hover:underline">
            Create a candidate account
          </Link>{' '}
          or{' '}
          <Link to="/register/recruiter" className="font-semibold text-iris-600 hover:underline">
            register as a recruiter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="input pr-11"
              placeholder="••••••••"
              value={form.password}
              onChange={update('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-auth" disabled={submitting}>
          <LogIn size={17} />
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

    </AuthLayout>
  );
}
