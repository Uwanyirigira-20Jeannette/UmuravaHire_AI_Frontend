interface ScoreBarProps {
  label: string;
  value: number;
  weight: string;
  color: string;
}

export default function ScoreBar({ label, value, weight, color }: ScoreBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-600 font-medium">{label}</span>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{weight}</span>
        </div>
        <span className="text-xs font-bold text-slate-700">{value}</span>
      </div>
      <div className="score-bar">
        <div className={`score-fill ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
