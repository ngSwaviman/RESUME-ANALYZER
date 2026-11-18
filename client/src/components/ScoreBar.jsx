import { scoreTone } from '../utils/format';

export default function ScoreBar({ score = 0, showLabel = true, height = 'h-2' }) {
  const tone = scoreTone(score);
  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Match score</span>
          <span className={tone.text}>{Math.round(score)}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}>
        <div
          className={`${height} rounded-full ${tone.bar} transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}
