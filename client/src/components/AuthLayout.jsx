import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileSearch, Gauge, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

const PIPELINE = [
  { icon: FileSearch, label: 'PDF parsed', value: '20 skills detected' },
  { icon: Gauge, label: 'Match computed', value: '0.65 skills + 0.35 text' },
  { icon: ShieldCheck, label: 'Human review', value: 'Required by design' },
];

export default function AuthLayout({ title, subtitle, bullets = [], children, footer }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.02fr_1fr]">
      {/* ---------- Story panel (desktop) ---------- */}
      <aside className="relative hidden overflow-hidden bg-ink-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 hero-aurora" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 tile-grid opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -left-28 top-1/4 h-80 w-80 animate-drift rounded-full bg-violet-600/30 blur-[100px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-4 h-72 w-72 animate-drift-slow rounded-full bg-sky-500/20 blur-[100px]"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="animate-fade-up">
            <Logo light />
          </div>

          <p
            className="mt-14 animate-fade-up text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300"
            style={{ animationDelay: '70ms' }}
          >
            AI screening &amp; matching
          </p>
          <h2
            className="mt-3 max-w-md animate-fade-up text-[32px] font-extrabold leading-[1.15] tracking-tight text-white"
            style={{ animationDelay: '130ms' }}
          >
            Every shortlist should come with a <span className="text-gradient">reason.</span>
          </h2>
          <p
            className="mt-4 max-w-md animate-fade-up text-[13.5px] leading-relaxed text-slate-400"
            style={{ animationDelay: '190ms' }}
          >
            ResumeRank reads PDF resumes, extracts real skills and scores them against job descriptions with TF-IDF and
            cosine similarity — then shows exactly which requirements matched.
          </p>

          <ul className="mt-8 space-y-3">
            {bullets.map((item, index) => (
              <li
                key={item}
                className="flex animate-fade-up items-start gap-3 text-[13px] leading-relaxed text-slate-300"
                style={{ animationDelay: `${250 + index * 70}ms` }}
              >
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-violet-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-12 max-w-sm animate-float-slow rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pipeline</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-violet-200/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-300" />
              </span>
              live
            </span>
          </div>
          <ul className="mt-3 space-y-3">
            {PIPELINE.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-violet-400/25 bg-violet-500/15 text-violet-200">
                  <Icon size={14} />
                </span>
                <span className="flex-1 text-[12px] font-medium text-slate-200">{label}</span>
                <span className="text-[11px] text-slate-500">{value}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-8 text-[11px] text-slate-600">
          AI Resume Screening &amp; Job Matching System · Department of CSE, Nalanda Institute of Technology, Bhubaneswar
        </p>
      </aside>

      {/* ---------- Story banner (mobile / tablet) ---------- */}
      <div className="relative overflow-hidden bg-ink-950 px-5 pb-8 pt-5 text-white lg:hidden">
        <div className="pointer-events-none absolute inset-0 hero-aurora opacity-90" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 tile-grid opacity-40" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 animate-drift rounded-full bg-violet-500/30 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex animate-fade-up items-center justify-between gap-3">
          <Logo light />
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-slate-200 backdrop-blur transition-colors duration-200 hover:border-violet-300/40 hover:text-white"
          >
            <ArrowLeft size={12} /> Home
          </Link>
        </div>

        <h2
          className="relative mt-6 max-w-xs animate-fade-up text-[22px] font-bold leading-tight tracking-tight text-white"
          style={{ animationDelay: '90ms' }}
        >
          Every shortlist should come with a <span className="text-gradient">reason.</span>
        </h2>
        <p
          className="relative mt-2 max-w-xs animate-fade-up text-[12.5px] leading-relaxed text-slate-400"
          style={{ animationDelay: '150ms' }}
        >
          Real PDF parsing, TF-IDF matching and scores you can trace back to individual skills.
        </p>
      </div>

      {/* ---------- Form panel ---------- */}
      <main
        className="relative flex flex-col overflow-hidden bg-white px-5 py-10 sm:px-10 lg:min-h-screen lg:py-12"
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-24 hidden h-64 w-64 rounded-full bg-sky-200/40 blur-3xl lg:block"
          aria-hidden="true"
        />

        <div className="relative mx-auto my-auto w-full max-w-md">
          <h1 className="animate-fade-up text-[26px] font-bold tracking-tight text-slate-900 sm:text-[30px]">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 animate-fade-up text-sm leading-relaxed text-slate-500" style={{ animationDelay: '60ms' }}>
              {subtitle}
            </p>
          )}

          <div className="mt-7">{children}</div>

          {footer && (
            <div
              className="mt-6 animate-fade-up text-center text-sm text-slate-500"
              style={{ animationDelay: '220ms' }}
            >
              {footer}
            </div>
          )}

          <p className="mt-8 hidden text-center text-xs text-slate-400 lg:block">
            <Link to="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-iris-600">
              <ArrowLeft size={12} /> Back to home
            </Link>
          </p>

          <p className="mt-7 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={12} className="text-iris-500" />
            Protected with bcrypt hashing and signed JWT sessions
          </p>
        </div>

        <p
          className="pointer-events-none absolute bottom-3 right-4 select-none text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400/50"
          aria-hidden="true"
        >
          google@gmail
        </p>
      </main>
    </div>
  );
}
