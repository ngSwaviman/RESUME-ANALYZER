import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6">
      <div className="card max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Compass size={26} />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you are looking for does not exist or you may not have access to it.
        </p>
        <Link to="/" className="btn-primary mt-6 w-full py-2.5">
          <ArrowLeft size={16} /> Back to home
        </Link>
      </div>
    </div>
  );
}
