import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  delta?: string;
  deltaPositive?: boolean;
}

export default function StatsCard({ label, value, icon: Icon, iconBg, iconColor, delta, deltaPositive }: StatsCardProps) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 mt-0.5 leading-none">{value}</p>
        {delta && (
          <p className={`text-xs mt-1 font-medium ${deltaPositive ? 'text-emerald-600' : 'text-slate-400'}`}>
            {delta}
          </p>
        )}
      </div>
    </div>
  );
}
