import { Link } from 'react-router-dom';
import logoMark from '../assets/logo.svg';
import logoMarkMint from '../assets/logo-mint.svg';

export default function Logo({ to = '/', compact = false, light = false }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <img
        src={light ? logoMarkMint : logoMark}
        alt="ResumeRank"
        className={`h-10 w-10 rounded-xl ${light ? 'shadow-lg shadow-mint-400/20' : 'shadow-md shadow-brand-600/25'}`}
      />
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-[15px] font-bold ${light ? 'text-white' : 'text-slate-900'}`}>
            ResumeRank
          </span>
          <span
            className={`block whitespace-nowrap text-[11px] font-medium ${
              light ? 'text-violet-200/70' : 'text-slate-400'
            }`}
          >
            AI Screening &amp; Matching
          </span>
        </span>
      )}
    </Link>
  );
}
