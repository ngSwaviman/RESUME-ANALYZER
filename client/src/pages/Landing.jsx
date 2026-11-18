import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  Check,
  FileSearch,
  Gauge,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  Users,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Reveal from '../components/Reveal.jsx';

const NAV_LINKS = [
  { label: 'Overview', href: '#overview' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'How it works', href: '#how' },
  { label: 'Matching engine', href: '#engine' },
];

const HERO_CHECKS = ['Real PDF extraction', 'Explainable scores', 'Human-reviewed shortlists'];

const SHORTLIST = [
  { name: 'Karan Mehta', score: 65.9 },
  { name: 'Priya Nair', score: 65.9 },
  { name: 'Rohan Das', score: 37.0 },
];

const AUDIENCES = [
  {
    icon: UploadCloud,
    label: 'For candidates',
    title: 'Know exactly where you stand',
    copy: 'Upload a resume once and see it parsed into skills, education and experience — then compare it against every open role.',
    points: [
      'Automatic skill and experience extraction',
      'Match percentage for each open role',
      'The exact skills you are missing',
      'Every application tracked in one place',
    ],
    cta: { label: 'Create a candidate account', to: '/register/candidate' },
  },
  {
    icon: Users,
    label: 'For recruiters',
    title: 'Shortlist with evidence, not instinct',
    copy: 'Publish a role with its required skills and get every uploaded resume ranked against it, with the reasoning written out.',
    points: [
      'Structured job posts with required skills',
      'Ranked candidates with skill coverage',
      'Matched and missing skills per applicant',
      'Pipeline from applied to shortlisted',
    ],
    cta: { label: 'Create a recruiter account', to: '/register/recruiter' },
  },
];

const CAPABILITIES = [
  {
    icon: FileSearch,
    title: 'PDF resume parsing',
    copy: 'The server reads the PDF text layer, rebuilds lines from glyph positions, then extracts contact details, education, experience and certifications.',
  },
  {
    icon: Layers,
    title: 'Dictionary skill extraction',
    copy: 'A curated dictionary with aliases resolves “reactjs”, “React.js” and “react” to one canonical skill, with word boundaries so Java never matches JavaScript.',
  },
  {
    icon: Gauge,
    title: 'TF-IDF + cosine similarity',
    copy: 'Job and resume text become weighted term vectors. Cosine similarity measures how closely they align — no black-box model, no external API.',
  },
  {
    icon: Target,
    title: 'Explainable scoring',
    copy: 'Every percentage ships with the matched skills, missing skills and the exact weighted arithmetic that produced it.',
  },
  {
    icon: Sparkles,
    title: 'Job recommendations',
    copy: 'Candidates get open roles ranked against their own resume, plus the gaps worth closing before applying.',
  },
  {
    icon: BarChart3,
    title: 'Recruiter & admin analytics',
    copy: 'Live dashboards for resume volume, application pipeline, score distribution and the most requested skills.',
  },
];

const STEPS = [
  {
    title: 'Create an account',
    copy: 'Register as a candidate or a recruiter. Passwords are hashed with bcrypt and sessions use signed JWTs.',
  },
  {
    title: 'Upload your resume',
    copy: 'Text-based PDFs up to 5 MB. Text is extracted, parsed and written straight into your profile.',
  },
  {
    title: 'Publish or browse roles',
    copy: 'Recruiters define required skills, experience and education for every opening they post.',
  },
  {
    title: 'Compare and decide',
    copy: 'Ranked candidates with matched and missing skills — always confirmed by a human recruiter.',
  },
];

const ENGINE_POINTS = [
  {
    title: 'One IDF space per job',
    copy: 'The job and every candidate resume are vectorised together, so scores are comparable inside a ranking and never leak across jobs.',
  },
  {
    title: 'Phrases survive tokenisation',
    copy: 'Bigrams keep “machine learning” and “data analysis” intact instead of reducing them to loose words.',
  },
  {
    title: 'Bonus skills are not penalties',
    copy: 'Sentences like “Docker is a plus” are detected and excluded from required skills, so optional technologies never cost a candidate points.',
  },
  {
    title: 'Weights reward evidence',
    copy: 'Skill coverage carries 65 % because it is checkable; document similarity carries 35 % for context and phrasing.',
  },
];

const STACK = ['React 18', 'Node.js', 'Express', 'MongoDB', 'JWT', 'Tailwind CSS', 'pdf.js', 'TF-IDF'];

const PRIMARY_BUTTON =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_45px_-20px_rgba(124,58,237,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-20px_rgba(124,58,237,1)]';

export default function Landing() {
  // Drop the hero illustration at client/public/hero-illustration.png and it
  // replaces the match card automatically; until then the card stays.
  const [heroArt, setHeroArt] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink-950 font-sans text-slate-300 antialiased">
      {/* ---------------- Header ---------------- */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.09] bg-ink-900/70 px-3.5 py-2.5 shadow-[0_24px_60px_-30px_rgba(76,29,149,0.95)] backdrop-blur-xl sm:px-4">
            <Logo light />

            <nav className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1 lg:flex">
              {NAV_LINKS.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                    index === 0
                      ? 'bg-white/[0.09] text-white'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="hidden rounded-full px-3.5 py-2 text-[13px] font-medium text-slate-300 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                to="/register/candidate"
                className="group relative inline-flex shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_14px_35px_-14px_rgba(124,58,237,0.95)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-14px_rgba(124,58,237,1)]"
              >
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  Get started
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sheen bg-white/30 blur-md"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-ink-950" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 hero-aurora" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 tile-grid opacity-80" aria-hidden="true" />

        <div
          className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 animate-drift rounded-[45%] bg-indigo-500/25 blur-[100px] sm:h-96 sm:w-96"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 animate-drift-slow rounded-[45%] bg-violet-500/25 blur-[100px] sm:h-96 sm:w-96"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div
              className="inline-flex animate-fade-up items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-violet-200/90"
              style={{ animationDelay: '40ms' }}
            >
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-violet-400/70" aria-hidden="true" />
              AI driven screening
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-violet-400/70" aria-hidden="true" />
            </div>

            <h1
              className="mt-6 animate-fade-up text-[38px] font-semibold leading-[1.06] tracking-[-0.03em] text-white sm:text-[54px] lg:text-[66px]"
              style={{ animationDelay: '110ms' }}
            >
              Screen every resume
              <br className="hidden sm:block" />{' '}
              with <span className="text-gradient">real evidence.</span>
            </h1>

            <p
              className="mx-auto mt-5 max-w-2xl animate-fade-up text-[15px] leading-relaxed text-slate-300/90 sm:text-[17px]"
              style={{ animationDelay: '190ms' }}
            >
              Upload a PDF and the parser pulls out skills, education and experience. Every job is then scored against
              it with TF-IDF and cosine similarity — and each percentage shows the matched and missing skills behind it.
            </p>

            <div
              className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: '260ms' }}
            >
              <Link to="/register/candidate" className={`${PRIMARY_BUTTON} w-full sm:w-auto`}>
                <UploadCloud size={17} />
                Upload your resume
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#engine"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-white/[0.08] sm:w-auto"
              >
                See how matching works
              </a>
            </div>

            <ul
              className="mt-7 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400"
              style={{ animationDelay: '330ms' }}
            >
              {HERO_CHECKS.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check size={13} className="text-violet-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Product preview — compact match card */}
          <div
            className="relative mx-auto mt-14 w-full max-w-[400px] animate-fade-up sm:mt-16"
            style={{ animationDelay: '400ms' }}
          >
            <img
              src="/hero-illustration.png"
              alt="A candidate reviewing matched roles on a laptop"
              onLoad={() => setHeroArt(true)}
              className={`relative w-full rounded-[28px] border border-white/[0.12] bg-ink-900/60 shadow-panel ${
                heroArt ? 'block' : 'hidden'
              }`}
            />

            <div className={heroArt ? 'hidden' : 'block'}>
              <div
                className="pointer-events-none absolute -inset-6 rounded-[42px] bg-gradient-to-b from-violet-500/40 via-indigo-500/20 to-transparent blur-3xl"
                aria-hidden="true"
              />

            <div className="relative rounded-[28px] border border-white/[0.12] bg-ink-900/80 p-2 shadow-panel backdrop-blur-xl">
              <div className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#060213]">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/70" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/70" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                  <span className="ml-1 truncate text-[10px] font-medium text-slate-400">ResumeRank · Match</span>
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold text-violet-200">
                    Preview
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Open role</p>
                      <p className="truncate text-[13px] font-semibold text-white">MERN Developer</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[9px] font-medium text-slate-300">
                      <Gauge size={10} className="text-violet-300" />
                      65 % skills
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3.5">
                    <div className="relative h-[86px] w-[86px] shrink-0">
                      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                        <defs>
                          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#38bdf8" />
                          </linearGradient>
                        </defs>
                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="9" />
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="url(#ringGradient)"
                          strokeWidth="9"
                          strokeLinecap="round"
                          strokeDasharray="327"
                          strokeDashoffset="72"
                        />
                      </svg>
                      <div className="absolute inset-0 grid place-content-center text-center">
                        <span className="flex items-baseline justify-center gap-0.5 text-[22px] font-black leading-none text-white">
                          78<span className="text-[10px] font-bold text-violet-300">%</span>
                        </span>
                        <span className="mt-0.5 text-[8px] uppercase tracking-[0.16em] text-slate-500">match</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-white">Ananya Mohapatra</p>
                      <p className="truncate text-[10px] text-slate-500">B.Tech CSE · 2 yrs</p>

                      <div className="mt-2.5 space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span>Skills matched</span>
                            <span className="font-semibold text-violet-200">12 / 12</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-400" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span>Text similarity</span>
                            <span className="font-semibold text-sky-300">36 %</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full w-[36%] rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">Next in line</p>
                    <ul className="mt-2 space-y-2">
                      {SHORTLIST.map((person) => (
                        <li key={person.name} className="flex items-center gap-2">
                          <span className="truncate text-[10.5px] text-slate-300">{person.name}</span>
                          <span className="ml-auto shrink-0 text-[10.5px] font-semibold text-slate-200">
                            {person.score.toFixed(1)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-3 flex items-center gap-1.5 text-[9px] text-slate-500">
                    <ShieldCheck size={10} className="text-violet-300" />
                    Reviewed by a human before any decision
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent"
          aria-hidden="true"
        />
      </section>

      {/* ---------------- Audiences ---------------- */}
      <section id="overview" className="relative scroll-mt-28 bg-ink-950 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-300">Built for both sides</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              One platform, two clear workflows.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Candidates get transparency. Recruiters get a defensible shortlist. The matching engine sits between them
              and explains itself to both.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {AUDIENCES.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.label} delay={index * 120}>
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-b from-white/[0.055] to-white/[0.015] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-glow-violet sm:p-8">
                    <div
                      className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-40"
                      aria-hidden="true"
                    />
                    <div className="relative flex items-center justify-between gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/15 text-violet-200">
                        <Icon size={19} />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </span>
                    </div>

                    <h3 className="relative mt-5 text-xl font-semibold text-white">{item.title}</h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-slate-400">{item.copy}</p>

                    <ul className="relative mt-5 space-y-2.5">
                      {item.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-[13px] text-slate-300">
                          <Check size={14} className="mt-0.5 shrink-0 text-violet-300" />
                          {point}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={item.cta.to}
                      className="relative mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-violet-300 transition-colors hover:text-violet-200"
                    >
                      {item.cta.label}
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Capabilities ---------------- */}
      <section id="capabilities" className="relative scroll-mt-28 border-y border-white/[0.07] bg-ink-900 py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 hero-aurora opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
          <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-300">Capabilities</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Everything a screening workflow needs
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Seven connected modules: authentication, resume upload, resume analysis, job management, matching,
                recommendations and analytics.
              </p>
            </div>
            <a
              href="#how"
              className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-violet-300 transition-colors hover:text-violet-200"
            >
              See the workflow <ArrowUpRight size={14} />
            </a>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={(index % 3) * 90}>
                  <div className="group h-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:from-white/[0.08]">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-200 ring-1 ring-inset ring-violet-400/25 transition-colors duration-300 group-hover:bg-violet-500 group-hover:text-white">
                      <Icon size={18} />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{item.copy}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how" className="relative scroll-mt-28 bg-ink-950 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-300">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              From PDF to ranked shortlist
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Four steps, no manual data entry. The server does the parsing and the arithmetic; you make the decision.
            </p>
          </Reveal>

          <div className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="pointer-events-none absolute left-0 right-0 top-[42px] hidden h-px animate-pulse-line bg-gradient-to-r from-transparent via-violet-400/40 to-transparent lg:block"
              aria-hidden="true"
            />
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 100}>
                <div className="group relative h-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/25">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-violet-400/35 bg-ink-950 text-[12px] font-bold text-violet-200 transition-colors duration-300 group-hover:border-violet-300 group-hover:text-white">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="h-px flex-1 bg-white/[0.07]" />
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{step.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Matching engine ---------------- */}
      <section
        id="engine"
        className="relative scroll-mt-28 border-y border-white/[0.07] bg-ink-900 py-20 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-0 hero-aurora opacity-35" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-300">Matching engine</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                A score you can argue with.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Skill coverage is explicit evidence, document similarity is context. The engine combines them with fixed,
                published weights — and writes the arithmetic into every result.
              </p>

              <div className="mt-7 overflow-x-auto rounded-2xl border border-white/[0.08] bg-ink-950/80 p-5 font-mono text-[12.5px] leading-relaxed">
                <p className="text-slate-500">// deterministic, no external model</p>
                <p className="mt-2 whitespace-nowrap text-slate-300">
                  <span className="text-violet-300">idf</span>(t) = ln((1 + N) / (1 + df(t))) + 1
                </p>
                <p className="whitespace-nowrap text-slate-300">
                  <span className="text-violet-300">score</span> = 0.65 × skillCoverage + 0.35 × cosine(job, resume)
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {ENGINE_POINTS.map((point) => (
                  <li key={point.title} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-200 ring-1 ring-inset ring-violet-400/30">
                      <Check size={11} />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-white">{point.title}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-400">{point.copy}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative">
                <div
                  className="pointer-events-none absolute -inset-4 rounded-[36px] bg-violet-600/20 blur-3xl"
                  aria-hidden="true"
                />
                <div className="relative rounded-3xl border border-white/[0.1] bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <BrainCircuit size={13} className="text-violet-300" /> Score breakdown
                    </span>
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[10px] font-bold text-violet-100">
                      77.7 %
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Skill coverage · weight 0.65</span>
                        <span className="font-semibold text-violet-200">100.0 %</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-400" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Text similarity · weight 0.35</span>
                        <span className="font-semibold text-sky-300">36.4 %</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[36.4%] rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" />
                      </div>
                    </div>
                  </div>

                  <pre className="mt-6 overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-ink-950/90 p-4 text-[11.5px] leading-relaxed text-slate-300">
{`12 of 12 required skills matched (100.0%).
TF-IDF cosine similarity 36.4% across 402 terms.
Weighted: 0.65 × 100.0 + 0.35 × 36.4 = 77.7%`}
                  </pre>

                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[11px] text-slate-400">
                    <Lock size={13} className="text-violet-300" />
                    Scores are decision support. Every shortlist is a human decision.
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- Stack ---------------- */}
      <section className="bg-ink-950 py-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Reveal>
            <h2 className="text-lg font-semibold text-white">Built on the MERN stack</h2>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-slate-400">
              JavaScript end to end. The matching engine runs on the same Node server as the API — no second runtime, no
              API keys, no per-request cost.
            </p>
          </Reveal>
          <Reveal delay={100} className="flex flex-wrap gap-2">
            {STACK.map((item) => (
              <span
                key={item}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11.5px] font-medium text-slate-300 transition-colors duration-300 hover:border-violet-400/30 hover:text-white"
              >
                {item}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="bg-ink-950 px-5 py-16 sm:px-6 lg:py-20">
        <Reveal className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 px-7 py-12 sm:px-12">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/25 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-fuchsia-400/25 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Start now</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Start with your resume. See the gaps.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  Create an account, upload a PDF and get a ranked list of roles with the exact skills standing between
                  you and the job.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register/candidate"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-ink-900 shadow-lg shadow-indigo-950/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-50"
                >
                  <UploadCloud size={16} /> Create candidate account
                </Link>
                <Link
                  to="/register/recruiter"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
                >
                  I am hiring
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-white/[0.07] bg-ink-900 px-5 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <Logo light />
              <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">
                AI Resume Screening &amp; Job Matching System — a MERN stack mini project from the Department of Computer
                Science and Engineering, Nalanda Institute of Technology, Bhubaneswar.
              </p>
            </div>
            <div className="flex gap-10 text-[12.5px]">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Platform</p>
                <Link to="/login" className="block text-slate-400 transition-colors hover:text-violet-300">
                  Sign in
                </Link>
                <Link to="/register/candidate" className="block text-slate-400 transition-colors hover:text-violet-300">
                  Candidates
                </Link>
                <Link to="/register/recruiter" className="block text-slate-400 transition-colors hover:text-violet-300">
                  Recruiters
                </Link>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Project</p>
                <a href="#capabilities" className="block text-slate-400 transition-colors hover:text-violet-300">
                  Capabilities
                </a>
                <a href="#engine" className="block text-slate-400 transition-colors hover:text-violet-300">
                  Matching engine
                </a>
                <a href="#how" className="block text-slate-400 transition-colors hover:text-violet-300">
                  Workflow
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/[0.07] pt-5 text-[11.5px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} ResumeRank · Academic project, not a commercial service.</p>
            <p className="inline-flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-violet-400/70" />
              Scores are decision support only — every ranking is reviewed by a human.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
