const VARIANTS = {
  matched: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  missing: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
  preferred: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
};

export default function SkillChip({ children, variant = 'neutral', className = '' }) {
  return <span className={`chip ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}>{children}</span>;
}
