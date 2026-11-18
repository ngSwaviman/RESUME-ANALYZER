export default function Loader({ label = 'Loading...', fullscreen = false, size = 'md' }) {
  const dimensions = size === 'sm' ? 'h-5 w-5 border-2' : 'h-9 w-9 border-[3px]';

  const content = (
    <div className="flex flex-col items-center gap-3">
      <span
        className={`inline-block animate-spin rounded-full border-brand-200 border-t-brand-600 ${dimensions}`}
      />
      {label && <span className="text-sm font-medium text-slate-500">{label}</span>}
    </div>
  );

  if (fullscreen) {
    return <div className="grid min-h-[60vh] place-items-center">{content}</div>;
  }
  return <div className="flex justify-center py-10">{content}</div>;
}
