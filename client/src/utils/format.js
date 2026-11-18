export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatRelative = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(value);
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatSalary = (salary) => {
  if (!salary || (!salary.min && !salary.max)) return 'Not disclosed';
  const currency = salary.currency || 'INR';
  const formatter = (amount) =>
    currency === 'INR' ? `₹${(amount / 100000).toFixed(1)}L` : `${currency} ${amount.toLocaleString()}`;
  if (salary.min && salary.max) return `${formatter(salary.min)} - ${formatter(salary.max)}`;
  return formatter(salary.min || salary.max);
};

export const statusTone = (status) => {
  switch (status) {
    case 'shortlisted':
      return 'bg-emerald-50 text-emerald-700';
    case 'rejected':
      return 'bg-rose-50 text-rose-600';
    case 'on-hold':
      return 'bg-amber-50 text-amber-700';
    default:
      return 'bg-brand-50 text-brand-700';
  }
};

export const scoreTone = (score) => {
  if (score >= 75) return { text: 'text-emerald-600', bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' };
  if (score >= 50) return { text: 'text-brand-600', bar: 'bg-brand-500', chip: 'bg-brand-50 text-brand-700' };
  if (score >= 30) return { text: 'text-amber-600', bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' };
  return { text: 'text-rose-500', bar: 'bg-rose-400', chip: 'bg-rose-50 text-rose-600' };
};
